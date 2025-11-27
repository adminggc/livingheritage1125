from langchain_community.graphs import Neo4jGraph
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from backend.config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, GOOGLE_API_KEY, OLLAMA_BASE_URL, EMBEDDING_MODEL
import requests
import os
from datetime import datetime


class GraphIngestionService:
    def __init__(self):
        self.graph = Neo4jGraph(
            url=NEO4J_URI,
            username=NEO4J_USER,
            password=NEO4J_PASSWORD,
            refresh_schema=False # Avoid calling apoc.meta.data on init
        )

        # Use Gemini for Graph Extraction
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0
        )

        # Initialize Ollama embedding
        self.ollama_url = OLLAMA_BASE_URL
        self.embedding_model_name = EMBEDDING_MODEL
        print(f"Using Ollama embedding: {self.embedding_model_name} @ {self.ollama_url}")

        # Create vector index in Neo4j
        self._create_vector_index()

        # Cache for existing entities (loaded on first use)
        self._existing_nodes_cache = None
        self._existing_relationships_cache = None

    def _get_embedding(self, text):
        """Generate embedding using Ollama API."""
        try:
            response = requests.post(
                f"{self.ollama_url}/api/embeddings",
                json={"model": self.embedding_model_name, "prompt": text},
                timeout=30
            )
            response.raise_for_status()
            return response.json().get('embedding', [])
        except Exception as e:
            print(f"Ollama embedding error: {e}")
            return []

    def _get_existing_entities(self):
        """Get list of existing approved nodes and relationships for entity matching."""
        if self._existing_nodes_cache is None:
            # Get existing node IDs and labels (prioritize approved ones)
            node_query = """
            MATCH (n)
            WHERE n.status IS NULL OR n.status = 'approved'
            RETURN DISTINCT n.id as id, labels(n) as labels, n.text as text
            ORDER BY n.id
            LIMIT 500
            """
            nodes = self.graph.query(node_query)
            self._existing_nodes_cache = nodes

            # Get existing relationship types
            rel_query = """
            MATCH ()-[r]->()
            WHERE r.status IS NULL OR r.status = 'approved'
            RETURN DISTINCT type(r) as type, count(*) as count
            ORDER BY count DESC
            LIMIT 100
            """
            rels = self.graph.query(rel_query)
            self._existing_relationships_cache = rels

        return self._existing_nodes_cache, self._existing_relationships_cache

    def _build_entity_context_prompt(self):
        """Build a prompt with existing entities to guide LLM."""
        nodes, relationships = self._get_existing_entities()

        # Format existing nodes
        node_list = []
        for n in nodes[:100]:  # Limit to 100 for prompt size
            node_id = n.get('id', '')
            labels = n.get('labels', [])
            if node_id and labels:
                node_list.append(f"- {node_id} ({', '.join(labels)})")

        # Format existing relationship types
        rel_list = [r.get('type', '') for r in relationships if r.get('type')]

        context = ""
        if node_list:
            context += f"""
EXISTING ENTITIES IN KNOWLEDGE GRAPH (prioritize matching these):
{chr(10).join(node_list[:50])}
{"... and more" if len(node_list) > 50 else ""}

"""
        if rel_list:
            context += f"""
EXISTING RELATIONSHIP TYPES (use these when applicable):
{', '.join(rel_list[:30])}

"""
        return context

    def _create_vector_index(self):
        """Create vector index in Neo4j for semantic search"""
        try:
            # Check if index exists, create if not
            query = """
            CREATE VECTOR INDEX node_embeddings IF NOT EXISTS
            FOR (n:Document) ON (n.embedding)
            OPTIONS {indexConfig: {
              `vector.dimensions`: 384,
              `vector.similarity_function`: 'cosine'
            }}
            """
            self.graph.query(query)
            print("✅ Vector index created/verified in Neo4j")
        except Exception as e:
            print(f"⚠️  Vector index creation: {e}")

    def _find_matching_entity(self, node_id, node_type):
        """Find if a similar entity already exists in the graph."""
        existing_nodes, _ = self._get_existing_entities()

        node_id_lower = node_id.lower().strip()

        for existing in existing_nodes:
            existing_id = existing.get('id', '').lower().strip()
            existing_labels = [l.lower() for l in existing.get('labels', [])]

            # Exact match
            if node_id_lower == existing_id:
                return existing.get('id'), True

            # Partial match (one contains the other)
            if len(node_id_lower) > 3 and len(existing_id) > 3:
                if node_id_lower in existing_id or existing_id in node_id_lower:
                    # Check if same type/label
                    if node_type.lower() in existing_labels:
                        return existing.get('id'), True

        return None, False

    def _is_existing_relationship_type(self, rel_type):
        """Check if relationship type already exists."""
        _, existing_rels = self._get_existing_entities()
        rel_type_upper = rel_type.upper().replace(' ', '_')

        for existing in existing_rels:
            if existing.get('type', '').upper() == rel_type_upper:
                return True
        return False

    def ingest_document(self, file_path):
        """
        Ingest a document into Neo4j by extracting entities and relationships.
        - Matches new entities against existing ones to maintain consistency
        - Marks truly new entities/relationships with status='new' for review
        - Generates embeddings for semantic search
        """
        print(f"Starting Graph Ingestion for {file_path}...")

        try:
            # 1. Load Text
            from langchain_community.document_loaders import PyPDFLoader
            loader = PyPDFLoader(file_path)
            documents = loader.load()

            # 2. Build context with existing entities
            print("Loading existing entities for context...")
            entity_context = self._build_entity_context_prompt()

            # 3. Create custom LLM transformer with entity-aware prompt
            custom_prompt = f"""You are extracting entities and relationships from a document for a knowledge graph.

{entity_context}
IMPORTANT INSTRUCTIONS:
1. PRIORITIZE matching entities to the existing list above when possible
2. Use EXACT names from the existing entity list if the concept matches
3. Use existing relationship types when they fit the context
4. Only create NEW entity names if no existing entity matches the concept
5. Be consistent with naming conventions (use the same format as existing entities)
6. Extract meaningful relationships that connect entities

Extract entities and relationships from the following text:
"""

            # Add context to documents
            for doc in documents:
                doc.page_content = custom_prompt + doc.page_content

            # 4. Transform to Graph Documents
            print("Extracting graph data (Nodes & Relationships) with entity matching...")
            self.llm_transformer = LLMGraphTransformer(llm=self.llm)
            graph_documents = self.llm_transformer.convert_to_graph_documents(documents)

            # 5. Process nodes - match existing or mark as new
            print("Processing nodes and matching entities...")
            new_nodes_count = 0
            matched_nodes_count = 0
            timestamp = datetime.now().isoformat()

            for graph_doc in graph_documents:
                for node in graph_doc.nodes:
                    # Create text representation of node
                    node_text = f"{node.type}: {node.id}"
                    if hasattr(node, 'properties') and node.properties:
                        node_text += f" {str(node.properties)}"

                    # Generate embedding using Ollama
                    embedding = self._get_embedding(node_text)

                    # Initialize properties
                    if not hasattr(node, 'properties') or node.properties is None:
                        node.properties = {}

                    node.properties['embedding'] = embedding
                    node.properties['text'] = node_text
                    node.properties['created_at'] = timestamp
                    node.properties['source_file'] = os.path.basename(file_path)

                    # Check if entity matches existing
                    matched_id, is_match = self._find_matching_entity(node.id, node.type)

                    if is_match:
                        # Use existing entity ID for consistency
                        print(f"  ✓ Matched: '{node.id}' → '{matched_id}'")
                        node.id = matched_id
                        node.properties['status'] = 'approved'
                        matched_nodes_count += 1
                    else:
                        # Mark as new for review
                        print(f"  ★ New entity: '{node.id}' ({node.type})")
                        node.properties['status'] = 'new'
                        new_nodes_count += 1

            # 6. Process relationships - mark new types
            print("Processing relationships...")
            new_rels_count = 0
            for graph_doc in graph_documents:
                for rel in graph_doc.relationships:
                    if not hasattr(rel, 'properties') or rel.properties is None:
                        rel.properties = {}

                    rel.properties['created_at'] = timestamp
                    rel.properties['source_file'] = os.path.basename(file_path)

                    if self._is_existing_relationship_type(rel.type):
                        rel.properties['status'] = 'approved'
                    else:
                        print(f"  ★ New relationship type: '{rel.type}'")
                        rel.properties['status'] = 'new'
                        new_rels_count += 1

            # 7. Store in Neo4j
            print(f"Saving {len(graph_documents)} graph documents to Neo4j...")
            self.graph.add_graph_documents(graph_documents)

            # Clear cache to include new entities
            self._existing_nodes_cache = None
            self._existing_relationships_cache = None

            print("=" * 50)
            print("Graph Ingestion Completed!")
            print(f"  Matched nodes: {matched_nodes_count}")
            print(f"  New nodes (pending review): {new_nodes_count}")
            print(f"  New relationship types: {new_rels_count}")
            print("=" * 50)

            return {
                'success': True,
                'matched_nodes': matched_nodes_count,
                'new_nodes': new_nodes_count,
                'new_relationships': new_rels_count
            }

        except Exception as e:
            import traceback
            print(f"Error ingesting to Graph: {e}")
            traceback.print_exc()
            return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    # Test
    pass
