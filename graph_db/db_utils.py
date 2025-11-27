from neo4j import GraphDatabase
import sys
import os
import requests

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config import (
    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD,
    OLLAMA_BASE_URL, EMBEDDING_PROVIDER, EMBEDDING_MODEL
)


class OllamaEmbedding:
    """Ollama embedding client."""

    def __init__(self, base_url="http://localhost:11435", model="nomic-embed-text"):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.embedding_dim = None  # Will be set after first call

    def encode(self, text):
        """Generate embedding for text using Ollama API."""
        try:
            response = requests.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": self.model,
                    "prompt": text
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            embedding = result.get('embedding', [])

            if not self.embedding_dim and embedding:
                self.embedding_dim = len(embedding)
                print(f"Ollama embedding dimension: {self.embedding_dim}")

            return embedding
        except Exception as e:
            print(f"Ollama embedding error: {e}")
            return []


class Neo4jConnection:
    def __init__(self):
        self.uri = NEO4J_URI
        self.user = NEO4J_USER
        self.password = NEO4J_PASSWORD
        self.driver = None

        # Initialize embedding model based on provider
        self.embedding_provider = EMBEDDING_PROVIDER
        print(f"Using embedding provider: {self.embedding_provider}")

        if self.embedding_provider == "ollama":
            self.embedding_model = OllamaEmbedding(
                base_url=OLLAMA_BASE_URL,
                model=EMBEDDING_MODEL
            )
            print(f"Ollama embedding model: {EMBEDDING_MODEL} @ {OLLAMA_BASE_URL}")
        else:
            # Fallback to sentence-transformers
            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer(EMBEDDING_MODEL, device='cpu')
            print(f"SentenceTransformer model: {EMBEDDING_MODEL}")

        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            # Test connection
            with self.driver.session() as session:
                session.run("RETURN 1")
            print("Successfully connected to Neo4j")
        except Exception as e:
            print(f"Failed to connect to Neo4j: {e}")
            self.driver = None

    def _get_embedding(self, text):
        """Get embedding from the configured provider."""
        if self.embedding_provider == "ollama":
            return self.embedding_model.encode(text)
        else:
            # sentence-transformers returns numpy array, convert to list
            return self.embedding_model.encode(text).tolist()

    def query(self, query_str, parameters=None):
        if not self.driver:
            print("Neo4j driver not connected")
            return []
        
        try:
            with self.driver.session() as session:
                result = session.run(query_str, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            print(f"Error executing query: {e}")
            return []

    def vector_search(self, query_text, top_k=5):
        """
        Perform vector similarity search on graph nodes using manual cosine similarity
        (The vector index is label-specific, so we use manual calculation for all nodes)
        """
        if not self.driver:
            print("Neo4j driver not connected")
            return []

        try:
            # Generate embedding for query using configured provider
            query_embedding = self._get_embedding(query_text)

            if not query_embedding:
                print("Failed to generate embedding for query")
                return []
            
            # Manual cosine similarity calculation (works across all labels)
            query_str = """
            MATCH (n)
            WHERE n.embedding IS NOT NULL
            WITH n, 
                 reduce(dot = 0.0, i IN range(0, size(n.embedding)-1) | 
                     dot + n.embedding[i] * $query_embedding[i]) as dotProduct,
                 sqrt(reduce(sum = 0.0, i IN range(0, size(n.embedding)-1) | 
                     sum + n.embedding[i] * n.embedding[i])) as norm1,
                 sqrt(reduce(sum = 0.0, i IN range(0, size($query_embedding)-1) | 
                     sum + $query_embedding[i] * $query_embedding[i])) as norm2
            WITH n, dotProduct / (norm1 * norm2) as score
            WHERE score > 0.3
            ORDER BY score DESC
            LIMIT $top_k
            
            // Get the node's relationships and connected nodes
            OPTIONAL MATCH (n)-[r]-(connected)
            
            // Return node info, relationships, and connected nodes
            RETURN 
                n.id as node_id,
                n.text as text,
                labels(n) as labels,
                score,
                collect(DISTINCT {
                    relationship: type(r),
                    direction: CASE 
                        WHEN startNode(r) = n THEN 'outgoing'
                        ELSE 'incoming'
                    END,
                    connected_node: connected.id,
                    connected_text: connected.text,
                    connected_labels: labels(connected)
                }) as relationships
            ORDER BY score DESC
            """
            
            with self.driver.session() as session:
                result = session.run(query_str, {
                    'top_k': top_k,
                    'query_embedding': query_embedding
                })
                results = []
                for record in result:
                    # Build a rich context string
                    node_text = record['text'] or ''
                    node_id = record.get('node_id', 'Unknown')
                    labels = record.get('labels', [])
                    relationships = record.get('relationships', [])
                    
                    # Create context text including relationships
                    context_parts = [f"Node ({', '.join(labels)}): {node_text}"]
                    
                    # Add relationship information
                    if relationships and relationships[0]:  # Check if not empty dict
                        for rel in relationships[:5]:  # Limit to 5 relationships
                            if rel.get('relationship'):  # Skip empty relationships
                                rel_type = rel['relationship']
                                direction = rel['direction']
                                connected_text = rel.get('connected_text', '')
                                arrow = '->' if direction == 'outgoing' else '<-'
                                context_parts.append(f"  {arrow} {rel_type}: {connected_text}")
                    
                    full_context = '\n'.join(context_parts)
                    
                    # Filter out empty relationships
                    valid_relationships = [r for r in relationships if r.get('relationship')]

                    results.append({
                        'text': full_context,
                        'node_id': node_id,
                        'labels': labels,
                        'score': record['score'],
                        'relationships_count': len(valid_relationships),
                        'relationships': valid_relationships,  # Include raw relationship data
                        'node_text': node_text  # Include raw node text for context extraction
                    })
                return results
                
        except Exception as e:
            print(f"Error in vector search: {e}")
            import traceback
            traceback.print_exc()
            return []

    def get_graph_context(self, entity):
        """
        Legacy keyword-based search (kept for backward compatibility)
        """
        if not self.driver:
            return []

        query_str = """
        MATCH (n)
        WHERE toLower(n.id) CONTAINS toLower($entity) OR toLower(n.text) CONTAINS toLower($entity)
        OPTIONAL MATCH (n)-[r]-(m)
        RETURN n, r, m
        LIMIT 5
        """

        try:
            with self.driver.session() as session:
                result = session.run(query_str, {'entity': entity})
                return [record.data() for record in result]
        except Exception as e:
            print(f"Error getting graph context: {e}")
            return []

    # ═══════════════════════════════════════════════════════════════════════════════
    # CRUD OPERATIONS FOR GRAPH EXPLORER
    # ═══════════════════════════════════════════════════════════════════════════════

    def get_graph_stats(self):
        """Get overall graph statistics."""
        if not self.driver:
            return {}

        try:
            with self.driver.session() as session:
                # Count nodes
                node_count = session.run("MATCH (n) RETURN count(n) as count").single()['count']

                # Count relationships
                rel_count = session.run("MATCH ()-[r]->() RETURN count(r) as count").single()['count']

                # Get label counts
                label_result = session.run("""
                    MATCH (n)
                    UNWIND labels(n) as label
                    RETURN label, count(*) as count
                    ORDER BY count DESC
                """)
                labels = {record['label']: record['count'] for record in label_result}

                # Get relationship type counts
                rel_type_result = session.run("""
                    MATCH ()-[r]->()
                    RETURN type(r) as type, count(*) as count
                    ORDER BY count DESC
                """)
                rel_types = {record['type']: record['count'] for record in rel_type_result}

                return {
                    'total_nodes': node_count,
                    'total_relationships': rel_count,
                    'labels': labels,
                    'relationship_types': rel_types
                }
        except Exception as e:
            print(f"Error getting graph stats: {e}")
            return {}

    def get_all_nodes(self, label=None, limit=100, skip=0, search_term=None):
        """Get all nodes, optionally filtered by label or search term."""
        if not self.driver:
            return []

        try:
            if label and label != "All":
                # Use backticks for label name to handle special characters
                if search_term:
                    query = f"""
                        MATCH (n:`{label}`)
                        WHERE (n.id IS NOT NULL AND toLower(n.id) CONTAINS toLower($search))
                           OR (n.text IS NOT NULL AND toLower(n.text) CONTAINS toLower($search))
                        RETURN n.id as id, n.text as text, labels(n) as labels,
                               n.type as type, elementId(n) as element_id
                        ORDER BY n.id
                        SKIP $skip LIMIT $limit
                    """
                else:
                    query = f"""
                        MATCH (n:`{label}`)
                        RETURN n.id as id, n.text as text, labels(n) as labels,
                               n.type as type, elementId(n) as element_id
                        ORDER BY n.id
                        SKIP $skip LIMIT $limit
                    """
            else:
                if search_term:
                    query = """
                        MATCH (n)
                        WHERE (n.id IS NOT NULL AND toLower(n.id) CONTAINS toLower($search))
                           OR (n.text IS NOT NULL AND toLower(n.text) CONTAINS toLower($search))
                        RETURN n.id as id, n.text as text, labels(n) as labels,
                               n.type as type, elementId(n) as element_id
                        ORDER BY n.id
                        SKIP $skip LIMIT $limit
                    """
                else:
                    query = """
                        MATCH (n)
                        RETURN n.id as id, n.text as text, labels(n) as labels,
                               n.type as type, elementId(n) as element_id
                        ORDER BY n.id
                        SKIP $skip LIMIT $limit
                    """

            with self.driver.session() as session:
                params = {'limit': limit, 'skip': skip}
                if search_term:
                    params['search'] = search_term
                result = session.run(query, params)
                nodes = []
                for record in result:
                    node = dict(record)
                    # Ensure id is not None for display
                    if node.get('id') is None:
                        node['id'] = f"[No ID - {node.get('element_id', 'unknown')[:8]}]"
                    nodes.append(node)
                return nodes
        except Exception as e:
            print(f"Error getting nodes: {e}")
            import traceback
            traceback.print_exc()
            return []

    def get_node_by_id(self, node_id):
        """Get a specific node by its id property."""
        if not self.driver:
            return None

        try:
            query = """
                MATCH (n {id: $node_id})
                OPTIONAL MATCH (n)-[r]-(connected)
                RETURN n.id as id, n.text as text, labels(n) as labels,
                       n.type as type, n.embedding as embedding,
                       collect(DISTINCT {
                           relationship: type(r),
                           direction: CASE WHEN startNode(r) = n THEN 'outgoing' ELSE 'incoming' END,
                           connected_id: connected.id,
                           connected_text: connected.text,
                           connected_labels: labels(connected)
                       }) as relationships
            """
            with self.driver.session() as session:
                result = session.run(query, {'node_id': node_id}).single()
                if result:
                    data = dict(result)
                    # Filter empty relationships
                    data['relationships'] = [r for r in data['relationships'] if r.get('relationship')]
                    # Check if has embedding
                    data['has_embedding'] = data['embedding'] is not None
                    del data['embedding']  # Don't return full embedding
                    return data
                return None
        except Exception as e:
            print(f"Error getting node: {e}")
            return None

    def get_all_relationships(self, limit=100, skip=0):
        """Get all relationships."""
        if not self.driver:
            return []

        try:
            query = """
                MATCH (a)-[r]->(b)
                RETURN a.id as source_id, type(r) as relationship, b.id as target_id,
                       labels(a) as source_labels, labels(b) as target_labels,
                       elementId(r) as element_id
                ORDER BY type(r), a.id
                SKIP $skip LIMIT $limit
            """
            with self.driver.session() as session:
                result = session.run(query, {'limit': limit, 'skip': skip})
                return [dict(record) for record in result]
        except Exception as e:
            print(f"Error getting relationships: {e}")
            return []

    def create_node(self, node_id, label, text, properties=None):
        """Create a new node."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            # Sanitize label: remove spaces, special chars, use PascalCase
            sanitized_label = ''.join(word.capitalize() for word in label.replace('-', ' ').replace('_', ' ').split())
            # Remove any remaining non-alphanumeric chars
            sanitized_label = ''.join(c for c in sanitized_label if c.isalnum())

            if not sanitized_label:
                sanitized_label = "Entity"

            # Generate embedding for the node using configured provider
            node_text_for_embedding = f"{sanitized_label}: {node_id} - {text}"
            embedding = self._get_embedding(node_text_for_embedding)

            # Use backticks for label to handle edge cases
            query = f"""
                CREATE (n:`{sanitized_label}` {{
                    id: $node_id,
                    text: $text,
                    type: $label,
                    embedding: $embedding
                }})
                RETURN n.id as id, labels(n) as labels
            """

            with self.driver.session() as session:
                result = session.run(query, {
                    'node_id': node_id,
                    'text': text,
                    'label': label,  # Keep original label in type property
                    'embedding': embedding
                })
                record = result.single()
                if record:
                    created_labels = record['labels']
                    return True, f"Node '{node_id}' created with label '{created_labels[0]}'"
                return False, "Failed to create node"
        except Exception as e:
            return False, f"Error creating node: {e}"

    def update_node(self, node_id, new_text=None, new_id=None):
        """Update an existing node."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            updates = []
            params = {'node_id': node_id}

            if new_text:
                updates.append("n.text = $new_text")
                params['new_text'] = new_text

            if new_id:
                updates.append("n.id = $new_id")
                params['new_id'] = new_id

            if not updates:
                return False, "No updates provided"

            # Regenerate embedding if text changed
            if new_text:
                # Get current node to get label
                node = self.get_node_by_id(node_id)
                if node:
                    label = node['labels'][0] if node['labels'] else 'Node'
                    node_text_for_embedding = f"{label}: {new_id or node_id} - {new_text}"
                    embedding = self._get_embedding(node_text_for_embedding)
                    updates.append("n.embedding = $embedding")
                    params['embedding'] = embedding

            query = f"""
                MATCH (n {{id: $node_id}})
                SET {', '.join(updates)}
                RETURN n.id as id
            """

            with self.driver.session() as session:
                result = session.run(query, params)
                record = result.single()
                if record:
                    return True, f"Node updated successfully"
                return False, "Node not found"
        except Exception as e:
            return False, f"Error updating node: {e}"

    def delete_node(self, node_id):
        """Delete a node and its relationships."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            query = """
                MATCH (n {id: $node_id})
                DETACH DELETE n
                RETURN count(*) as deleted
            """
            with self.driver.session() as session:
                result = session.run(query, {'node_id': node_id})
                record = result.single()
                if record and record['deleted'] > 0:
                    return True, f"Node '{node_id}' deleted successfully"
                return False, "Node not found"
        except Exception as e:
            return False, f"Error deleting node: {e}"

    def create_relationship(self, source_id, target_id, relationship_type):
        """Create a relationship between two nodes."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            # Sanitize relationship type (remove spaces, uppercase)
            rel_type = relationship_type.upper().replace(' ', '_')

            query = f"""
                MATCH (a {{id: $source_id}}), (b {{id: $target_id}})
                CREATE (a)-[r:{rel_type}]->(b)
                RETURN type(r) as relationship
            """
            with self.driver.session() as session:
                result = session.run(query, {
                    'source_id': source_id,
                    'target_id': target_id
                })
                record = result.single()
                if record:
                    return True, f"Relationship '{rel_type}' created successfully"
                return False, "One or both nodes not found"
        except Exception as e:
            return False, f"Error creating relationship: {e}"

    def delete_relationship(self, source_id, target_id, relationship_type=None):
        """Delete a relationship between two nodes."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            if relationship_type:
                rel_type = relationship_type.upper().replace(' ', '_')
                query = f"""
                    MATCH (a {{id: $source_id}})-[r:{rel_type}]->(b {{id: $target_id}})
                    DELETE r
                    RETURN count(*) as deleted
                """
            else:
                query = """
                    MATCH (a {id: $source_id})-[r]->(b {id: $target_id})
                    DELETE r
                    RETURN count(*) as deleted
                """

            with self.driver.session() as session:
                result = session.run(query, {
                    'source_id': source_id,
                    'target_id': target_id
                })
                record = result.single()
                if record and record['deleted'] > 0:
                    return True, f"Relationship deleted successfully"
                return False, "Relationship not found"
        except Exception as e:
            return False, f"Error deleting relationship: {e}"

    def get_node_neighbors(self, node_id, depth=1):
        """Get neighbors of a node up to specified depth."""
        if not self.driver:
            return {'nodes': [], 'relationships': []}

        try:
            query = f"""
                MATCH path = (n {{id: $node_id}})-[*1..{depth}]-(connected)
                WITH n, connected, relationships(path) as rels
                UNWIND rels as r
                WITH n, connected, r, startNode(r) as start_node, endNode(r) as end_node
                RETURN DISTINCT
                    connected.id as node_id,
                    connected.text as text,
                    labels(connected) as labels,
                    type(r) as relationship,
                    start_node.id as source,
                    end_node.id as target
            """
            with self.driver.session() as session:
                result = session.run(query, {'node_id': node_id})

                nodes = {}
                relationships = []

                for record in result:
                    # Add node
                    nid = record['node_id']
                    if nid and nid not in nodes:
                        nodes[nid] = {
                            'id': nid,
                            'text': record['text'],
                            'labels': record['labels']
                        }

                    # Add relationship
                    if record['source'] and record['target']:
                        relationships.append({
                            'source': record['source'],
                            'target': record['target'],
                            'type': record['relationship']
                        })

                # Add the center node
                center_node = self.get_node_by_id(node_id)
                if center_node:
                    nodes[node_id] = {
                        'id': node_id,
                        'text': center_node['text'],
                        'labels': center_node['labels']
                    }

                return {
                    'nodes': list(nodes.values()),
                    'relationships': relationships
                }
        except Exception as e:
            print(f"Error getting neighbors: {e}")
            return {'nodes': [], 'relationships': []}

    # ═══════════════════════════════════════════════════════════════════════════════
    # STATUS MANAGEMENT (NEW/APPROVED) FOR REVIEW WORKFLOW
    # ═══════════════════════════════════════════════════════════════════════════════

    def get_pending_review_nodes(self, limit=100, skip=0):
        """Get all nodes with status='new' pending review."""
        if not self.driver:
            return []

        try:
            query = """
                MATCH (n)
                WHERE n.status = 'new'
                RETURN n.id as id, n.text as text, labels(n) as labels,
                       n.status as status, n.created_at as created_at,
                       n.source_file as source_file, elementId(n) as element_id
                ORDER BY n.created_at DESC
                SKIP $skip LIMIT $limit
            """
            with self.driver.session() as session:
                result = session.run(query, {'limit': limit, 'skip': skip})
                nodes = []
                for record in result:
                    node = dict(record)
                    if node.get('id') is None:
                        node['id'] = f"[No ID - {node.get('element_id', 'unknown')[:8]}]"
                    nodes.append(node)
                return nodes
        except Exception as e:
            print(f"Error getting pending nodes: {e}")
            return []

    def get_pending_review_relationships(self, limit=100, skip=0):
        """Get all relationships with status='new' pending review."""
        if not self.driver:
            return []

        try:
            query = """
                MATCH (a)-[r]->(b)
                WHERE r.status = 'new'
                RETURN a.id as source_id, type(r) as relationship, b.id as target_id,
                       labels(a) as source_labels, labels(b) as target_labels,
                       r.status as status, r.created_at as created_at,
                       r.source_file as source_file, elementId(r) as element_id
                ORDER BY r.created_at DESC
                SKIP $skip LIMIT $limit
            """
            with self.driver.session() as session:
                result = session.run(query, {'limit': limit, 'skip': skip})
                return [dict(record) for record in result]
        except Exception as e:
            print(f"Error getting pending relationships: {e}")
            return []

    def get_review_stats(self):
        """Get counts of new vs approved nodes and relationships."""
        if not self.driver:
            return {}

        try:
            with self.driver.session() as session:
                # Node status counts
                node_stats = session.run("""
                    MATCH (n)
                    RETURN n.status as status, count(*) as count
                """)
                node_counts = {'new': 0, 'approved': 0, 'no_status': 0}
                for record in node_stats:
                    status = record['status']
                    if status == 'new':
                        node_counts['new'] = record['count']
                    elif status == 'approved':
                        node_counts['approved'] = record['count']
                    else:
                        node_counts['no_status'] += record['count']

                # Relationship status counts
                rel_stats = session.run("""
                    MATCH ()-[r]->()
                    RETURN r.status as status, count(*) as count
                """)
                rel_counts = {'new': 0, 'approved': 0, 'no_status': 0}
                for record in rel_stats:
                    status = record['status']
                    if status == 'new':
                        rel_counts['new'] = record['count']
                    elif status == 'approved':
                        rel_counts['approved'] = record['count']
                    else:
                        rel_counts['no_status'] += record['count']

                return {
                    'nodes': node_counts,
                    'relationships': rel_counts
                }
        except Exception as e:
            print(f"Error getting review stats: {e}")
            return {}

    def approve_node(self, node_id):
        """Approve a node (change status from 'new' to 'approved')."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            query = """
                MATCH (n {id: $node_id})
                SET n.status = 'approved', n.reviewed_at = datetime()
                RETURN n.id as id
            """
            with self.driver.session() as session:
                result = session.run(query, {'node_id': node_id})
                record = result.single()
                if record:
                    return True, f"Node '{node_id}' approved"
                return False, "Node not found"
        except Exception as e:
            return False, f"Error approving node: {e}"

    def reject_node(self, node_id):
        """Reject and delete a node (and its relationships)."""
        return self.delete_node(node_id)

    def approve_relationship(self, source_id, target_id, rel_type):
        """Approve a relationship."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            rel_type_clean = rel_type.upper().replace(' ', '_')
            query = f"""
                MATCH (a {{id: $source_id}})-[r:{rel_type_clean}]->(b {{id: $target_id}})
                SET r.status = 'approved', r.reviewed_at = datetime()
                RETURN type(r) as type
            """
            with self.driver.session() as session:
                result = session.run(query, {
                    'source_id': source_id,
                    'target_id': target_id
                })
                record = result.single()
                if record:
                    return True, f"Relationship '{rel_type}' approved"
                return False, "Relationship not found"
        except Exception as e:
            return False, f"Error approving relationship: {e}"

    def reject_relationship(self, source_id, target_id, rel_type):
        """Reject and delete a relationship."""
        return self.delete_relationship(source_id, target_id, rel_type)

    def bulk_approve_nodes(self, node_ids):
        """Approve multiple nodes at once."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            query = """
                MATCH (n)
                WHERE n.id IN $node_ids
                SET n.status = 'approved', n.reviewed_at = datetime()
                RETURN count(n) as approved_count
            """
            with self.driver.session() as session:
                result = session.run(query, {'node_ids': node_ids})
                record = result.single()
                count = record['approved_count'] if record else 0
                return True, f"Approved {count} nodes"
        except Exception as e:
            return False, f"Error bulk approving nodes: {e}"

    def bulk_reject_nodes(self, node_ids):
        """Reject and delete multiple nodes at once."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            query = """
                MATCH (n)
                WHERE n.id IN $node_ids
                DETACH DELETE n
                RETURN count(*) as deleted_count
            """
            with self.driver.session() as session:
                result = session.run(query, {'node_ids': node_ids})
                record = result.single()
                count = record['deleted_count'] if record else 0
                return True, f"Deleted {count} nodes"
        except Exception as e:
            return False, f"Error bulk rejecting nodes: {e}"

    def approve_all_new(self):
        """Approve all new nodes and relationships."""
        if not self.driver:
            return False, "Not connected to Neo4j"

        try:
            with self.driver.session() as session:
                # Approve all new nodes
                node_result = session.run("""
                    MATCH (n)
                    WHERE n.status = 'new'
                    SET n.status = 'approved', n.reviewed_at = datetime()
                    RETURN count(n) as count
                """)
                node_count = node_result.single()['count']

                # Approve all new relationships
                rel_result = session.run("""
                    MATCH ()-[r]->()
                    WHERE r.status = 'new'
                    SET r.status = 'approved', r.reviewed_at = datetime()
                    RETURN count(r) as count
                """)
                rel_count = rel_result.single()['count']

                return True, f"Approved {node_count} nodes and {rel_count} relationships"
        except Exception as e:
            return False, f"Error approving all: {e}"

    def close(self):
        """Close the Neo4j driver connection."""
        if self.driver:
            self.driver.close()


if __name__ == "__main__":
    conn = Neo4jConnection()
    # The close method was removed, so this line should be removed or updated
    # conn.close() 
    # Example usage (optional, for testing)
    # print(conn.query("RETURN 1"))
    # print(conn.vector_search("example query"))
    # print(conn.get_graph_context("example entity"))
