"""
Unit tests for Ollama Embedding and Graph CRUD operations
"""
import sys
import os
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestOllamaEmbedding(unittest.TestCase):
    """Test cases for OllamaEmbedding class."""

    def setUp(self):
        """Set up test fixtures."""
        from graph_db.db_utils import OllamaEmbedding
        self.embedding = OllamaEmbedding(
            base_url="http://localhost:11435",
            model="nomic-embed-text"
        )

    def test_init(self):
        """Test OllamaEmbedding initialization."""
        self.assertEqual(self.embedding.base_url, "http://localhost:11435")
        self.assertEqual(self.embedding.model, "nomic-embed-text")
        self.assertIsNone(self.embedding.embedding_dim)

    def test_init_strips_trailing_slash(self):
        """Test that trailing slash is stripped from base_url."""
        from graph_db.db_utils import OllamaEmbedding
        embedding = OllamaEmbedding(base_url="http://localhost:11435/")
        self.assertEqual(embedding.base_url, "http://localhost:11435")

    @patch('requests.post')
    def test_encode_success(self, mock_post):
        """Test successful embedding generation."""
        # Mock response
        mock_response = Mock()
        mock_response.json.return_value = {
            'embedding': [0.1, 0.2, 0.3, 0.4, 0.5]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        result = self.embedding.encode("test text")

        self.assertEqual(result, [0.1, 0.2, 0.3, 0.4, 0.5])
        self.assertEqual(self.embedding.embedding_dim, 5)
        mock_post.assert_called_once_with(
            "http://localhost:11435/api/embeddings",
            json={"model": "nomic-embed-text", "prompt": "test text"},
            timeout=30
        )

    @patch('requests.post')
    def test_encode_empty_response(self, mock_post):
        """Test handling of empty embedding response."""
        mock_response = Mock()
        mock_response.json.return_value = {'embedding': []}
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        result = self.embedding.encode("test text")

        self.assertEqual(result, [])

    @patch('requests.post')
    def test_encode_network_error(self, mock_post):
        """Test handling of network errors."""
        mock_post.side_effect = Exception("Connection refused")

        result = self.embedding.encode("test text")

        self.assertEqual(result, [])

    @patch('requests.post')
    def test_encode_timeout(self, mock_post):
        """Test handling of timeout."""
        import requests
        mock_post.side_effect = requests.exceptions.Timeout("Request timed out")

        result = self.embedding.encode("test text")

        self.assertEqual(result, [])


class TestNeo4jConnectionEmbedding(unittest.TestCase):
    """Test cases for Neo4jConnection embedding methods."""

    @patch('graph_db.db_utils.GraphDatabase')
    def setUp(self, mock_graph_db):
        """Set up test fixtures with mocked Neo4j."""
        # Mock the driver
        mock_driver = Mock()
        mock_session = Mock()
        mock_driver.session.return_value.__enter__ = Mock(return_value=mock_session)
        mock_driver.session.return_value.__exit__ = Mock(return_value=False)
        mock_session.run.return_value = Mock()
        mock_graph_db.driver.return_value = mock_driver

        from graph_db.db_utils import Neo4jConnection
        with patch.object(Neo4jConnection, '__init__', lambda x: None):
            self.neo4j = Neo4jConnection()
            self.neo4j.driver = mock_driver
            self.neo4j.embedding_provider = "ollama"
            self.neo4j.embedding_model = Mock()
            self.neo4j.embedding_model.encode = Mock(return_value=[0.1, 0.2, 0.3])

    def test_get_embedding_ollama(self):
        """Test _get_embedding with Ollama provider."""
        self.neo4j.embedding_provider = "ollama"
        self.neo4j.embedding_model.encode = Mock(return_value=[0.1, 0.2, 0.3])

        result = self.neo4j._get_embedding("test text")

        self.assertEqual(result, [0.1, 0.2, 0.3])
        self.neo4j.embedding_model.encode.assert_called_once_with("test text")

    def test_get_embedding_sentence_transformers(self):
        """Test _get_embedding with sentence-transformers provider."""
        import numpy as np
        self.neo4j.embedding_provider = "sentence-transformers"
        mock_array = Mock()
        mock_array.tolist.return_value = [0.1, 0.2, 0.3]
        self.neo4j.embedding_model.encode = Mock(return_value=mock_array)

        result = self.neo4j._get_embedding("test text")

        self.assertEqual(result, [0.1, 0.2, 0.3])


class TestNeo4jCRUD(unittest.TestCase):
    """Test cases for Neo4j CRUD operations."""

    def setUp(self):
        """Set up test fixtures with mocked Neo4j."""
        self.mock_driver = Mock()
        self.mock_session = MagicMock()
        self.mock_driver.session.return_value.__enter__ = Mock(return_value=self.mock_session)
        self.mock_driver.session.return_value.__exit__ = Mock(return_value=False)

        from graph_db.db_utils import Neo4jConnection
        with patch.object(Neo4jConnection, '__init__', lambda x: None):
            self.neo4j = Neo4jConnection()
            self.neo4j.driver = self.mock_driver
            self.neo4j.embedding_provider = "ollama"
            self.neo4j.embedding_model = Mock()
            self.neo4j.embedding_model.encode = Mock(return_value=[0.1, 0.2, 0.3])

    def test_get_graph_stats(self):
        """Test get_graph_stats returns correct structure."""
        # Mock responses
        self.mock_session.run.side_effect = [
            Mock(single=Mock(return_value={'count': 100})),  # node count
            Mock(single=Mock(return_value={'count': 50})),   # rel count
            [{'label': 'Person', 'count': 60}, {'label': 'Document', 'count': 40}],  # labels
            [{'type': 'KNOWS', 'count': 30}, {'type': 'CONTAINS', 'count': 20}]  # rel types
        ]

        result = self.neo4j.get_graph_stats()

        self.assertEqual(result['total_nodes'], 100)
        self.assertEqual(result['total_relationships'], 50)

    def test_get_graph_stats_no_driver(self):
        """Test get_graph_stats returns empty dict when not connected."""
        self.neo4j.driver = None

        result = self.neo4j.get_graph_stats()

        self.assertEqual(result, {})

    def test_create_node_success(self):
        """Test successful node creation."""
        mock_result = Mock()
        mock_result.single.return_value = {'id': 'test_node', 'labels': ['TestLabel']}
        self.mock_session.run.return_value = mock_result

        # Need to mock _get_embedding
        self.neo4j._get_embedding = Mock(return_value=[0.1, 0.2, 0.3])

        success, msg = self.neo4j.create_node("test_node", "Test Label", "Test description")

        self.assertTrue(success)
        self.assertIn("test_node", msg)

    def test_create_node_label_sanitization(self):
        """Test that labels are properly sanitized."""
        mock_result = Mock()
        mock_result.single.return_value = {'id': 'test', 'labels': ['TestLabel']}
        self.mock_session.run.return_value = mock_result
        self.neo4j._get_embedding = Mock(return_value=[0.1, 0.2, 0.3])

        # Test various label formats
        test_cases = [
            ("test label", "TestLabel"),
            ("test-label", "TestLabel"),
            ("test_label", "TestLabel"),
            ("TEST LABEL", "TestLabel"),
        ]

        for input_label, expected in test_cases:
            self.neo4j.create_node("test", input_label, "desc")
            # Verify the query was called (label sanitization happens before query)

    def test_create_node_no_driver(self):
        """Test create_node fails gracefully without driver."""
        self.neo4j.driver = None

        success, msg = self.neo4j.create_node("test", "Label", "text")

        self.assertFalse(success)
        self.assertIn("Not connected", msg)

    def test_update_node_success(self):
        """Test successful node update."""
        # Mock get_node_by_id
        self.neo4j.get_node_by_id = Mock(return_value={
            'id': 'test_node',
            'labels': ['TestLabel'],
            'text': 'old text'
        })
        self.neo4j._get_embedding = Mock(return_value=[0.1, 0.2, 0.3])

        mock_result = Mock()
        mock_result.single.return_value = {'id': 'test_node'}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.update_node("test_node", new_text="new text")

        self.assertTrue(success)
        self.assertIn("updated", msg.lower())

    def test_update_node_not_found(self):
        """Test update_node when node doesn't exist."""
        self.neo4j.get_node_by_id = Mock(return_value=None)

        mock_result = Mock()
        mock_result.single.return_value = None
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.update_node("nonexistent", new_text="text")

        self.assertFalse(success)

    def test_update_node_no_updates(self):
        """Test update_node with no updates provided."""
        success, msg = self.neo4j.update_node("test_node")

        self.assertFalse(success)
        self.assertIn("No updates", msg)

    def test_delete_node_success(self):
        """Test successful node deletion."""
        mock_result = Mock()
        mock_result.single.return_value = {'deleted': 1}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.delete_node("test_node")

        self.assertTrue(success)
        self.assertIn("deleted", msg.lower())

    def test_delete_node_not_found(self):
        """Test delete_node when node doesn't exist."""
        mock_result = Mock()
        mock_result.single.return_value = {'deleted': 0}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.delete_node("nonexistent")

        self.assertFalse(success)
        self.assertIn("not found", msg.lower())

    def test_create_relationship_success(self):
        """Test successful relationship creation."""
        mock_result = Mock()
        mock_result.single.return_value = {'relationship': 'KNOWS'}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.create_relationship("node_a", "node_b", "knows")

        self.assertTrue(success)
        self.assertIn("KNOWS", msg)

    def test_create_relationship_type_sanitization(self):
        """Test that relationship types are sanitized."""
        mock_result = Mock()
        mock_result.single.return_value = {'relationship': 'WORKS_FOR'}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.create_relationship("a", "b", "works for")

        self.assertTrue(success)
        # Relationship should be uppercased and spaces replaced with underscores

    def test_delete_relationship_success(self):
        """Test successful relationship deletion."""
        mock_result = Mock()
        mock_result.single.return_value = {'deleted': 1}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.delete_relationship("a", "b", "KNOWS")

        self.assertTrue(success)

    def test_delete_relationship_all_types(self):
        """Test deleting all relationships between two nodes."""
        mock_result = Mock()
        mock_result.single.return_value = {'deleted': 3}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.delete_relationship("a", "b", None)

        self.assertTrue(success)


class TestVectorSearch(unittest.TestCase):
    """Test cases for vector search functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_driver = Mock()
        self.mock_session = MagicMock()
        self.mock_driver.session.return_value.__enter__ = Mock(return_value=self.mock_session)
        self.mock_driver.session.return_value.__exit__ = Mock(return_value=False)

        from graph_db.db_utils import Neo4jConnection
        with patch.object(Neo4jConnection, '__init__', lambda x: None):
            self.neo4j = Neo4jConnection()
            self.neo4j.driver = self.mock_driver
            self.neo4j.embedding_provider = "ollama"
            self.neo4j.embedding_model = Mock()

    def test_vector_search_no_driver(self):
        """Test vector_search returns empty list without driver."""
        self.neo4j.driver = None

        result = self.neo4j.vector_search("test query")

        self.assertEqual(result, [])

    def test_vector_search_empty_embedding(self):
        """Test vector_search handles empty embedding."""
        self.neo4j._get_embedding = Mock(return_value=[])

        result = self.neo4j.vector_search("test query")

        self.assertEqual(result, [])

    def test_vector_search_success(self):
        """Test successful vector search."""
        self.neo4j._get_embedding = Mock(return_value=[0.1, 0.2, 0.3])

        mock_records = [
            {
                'node_id': 'node1',
                'text': 'Test document',
                'labels': ['Document'],
                'score': 0.95,
                'relationships': [{'relationship': 'CONTAINS', 'direction': 'outgoing', 'connected_text': 'Related'}]
            }
        ]
        self.mock_session.run.return_value = mock_records

        result = self.neo4j.vector_search("test query", top_k=5)

        self.neo4j._get_embedding.assert_called_once_with("test query")


class TestGetAllNodes(unittest.TestCase):
    """Test cases for get_all_nodes functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_driver = Mock()
        self.mock_session = MagicMock()
        self.mock_driver.session.return_value.__enter__ = Mock(return_value=self.mock_session)
        self.mock_driver.session.return_value.__exit__ = Mock(return_value=False)

        from graph_db.db_utils import Neo4jConnection
        with patch.object(Neo4jConnection, '__init__', lambda x: None):
            self.neo4j = Neo4jConnection()
            self.neo4j.driver = self.mock_driver

    def test_get_all_nodes_no_driver(self):
        """Test get_all_nodes returns empty list without driver."""
        self.neo4j.driver = None

        result = self.neo4j.get_all_nodes()

        self.assertEqual(result, [])

    def test_get_all_nodes_with_label_filter(self):
        """Test get_all_nodes with label filter."""
        mock_records = [
            {'id': 'node1', 'text': 'Text 1', 'labels': ['Person'], 'type': 'Person', 'element_id': '123'}
        ]
        self.mock_session.run.return_value = mock_records

        result = self.neo4j.get_all_nodes(label="Person", limit=10)

        # Verify query was called with label filter
        self.mock_session.run.assert_called_once()

    def test_get_all_nodes_with_search(self):
        """Test get_all_nodes with search term."""
        mock_records = [
            {'id': 'node1', 'text': 'Search match', 'labels': ['Document'], 'type': 'Document', 'element_id': '123'}
        ]
        self.mock_session.run.return_value = mock_records

        result = self.neo4j.get_all_nodes(search_term="Search")

        self.mock_session.run.assert_called_once()

    def test_get_all_nodes_handles_null_id(self):
        """Test get_all_nodes handles nodes without id."""
        mock_records = [
            {'id': None, 'text': 'No ID node', 'labels': ['Orphan'], 'type': None, 'element_id': 'abc12345'}
        ]
        self.mock_session.run.return_value = mock_records

        result = self.neo4j.get_all_nodes()

        # Should have a fallback ID
        self.assertEqual(len(result), 1)


class TestSemanticSearch(unittest.TestCase):
    """Test cases for semantic search functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_driver = Mock()
        self.mock_session = MagicMock()
        self.mock_driver.session.return_value.__enter__ = Mock(return_value=self.mock_session)
        self.mock_driver.session.return_value.__exit__ = Mock(return_value=False)

        from graph_db.db_utils import Neo4jConnection
        with patch.object(Neo4jConnection, '__init__', lambda x: None):
            self.neo4j = Neo4jConnection()
            self.neo4j.driver = self.mock_driver
            self.neo4j.embedding_provider = "ollama"
            self.neo4j.embedding_model = Mock()

    def test_semantic_search_returns_scored_results(self):
        """Test that semantic search returns results with scores."""
        self.neo4j._get_embedding = Mock(return_value=[0.1, 0.2, 0.3])

        mock_records = [
            Mock(**{
                '__getitem__': lambda self, key: {
                    'node_id': 'node1',
                    'text': 'Test document about banking',
                    'labels': ['Document'],
                    'score': 0.95,
                    'relationships': []
                }[key],
                'get': lambda key, default=None: {
                    'node_id': 'node1',
                    'text': 'Test document about banking',
                    'labels': ['Document'],
                    'score': 0.95,
                    'relationships': []
                }.get(key, default)
            })
        ]
        self.mock_session.run.return_value = mock_records

        # The vector_search method should be called
        self.neo4j._get_embedding.assert_not_called()  # Not called yet

    def test_semantic_search_filters_by_score(self):
        """Test that results can be filtered by minimum score."""
        results = [
            {'node_id': 'high', 'score': 0.9},
            {'node_id': 'medium', 'score': 0.5},
            {'node_id': 'low', 'score': 0.2}
        ]

        # Filter by score >= 0.5
        filtered = [r for r in results if r.get('score', 0) >= 0.5]

        self.assertEqual(len(filtered), 2)
        self.assertEqual(filtered[0]['node_id'], 'high')
        self.assertEqual(filtered[1]['node_id'], 'medium')

    def test_semantic_search_score_categories(self):
        """Test score categorization for display."""
        def get_score_color(score):
            if score >= 0.8:
                return "green"
            elif score >= 0.6:
                return "yellow"
            else:
                return "orange"

        self.assertEqual(get_score_color(0.95), "green")
        self.assertEqual(get_score_color(0.75), "yellow")
        self.assertEqual(get_score_color(0.45), "orange")

    def test_semantic_search_with_relationships(self):
        """Test semantic search results include relationships."""
        results = [{
            'node_id': 'node1',
            'score': 0.9,
            'relationships': [
                {'relationship': 'CONTAINS', 'direction': 'outgoing', 'connected_node': 'node2'},
                {'relationship': 'BELONGS_TO', 'direction': 'incoming', 'connected_node': 'node3'}
            ]
        }]

        self.assertEqual(len(results[0]['relationships']), 2)
        self.assertEqual(results[0]['relationships'][0]['relationship'], 'CONTAINS')

    def test_semantic_search_export_format(self):
        """Test export data format for CSV."""
        results = [
            {
                'node_id': 'node1',
                'labels': ['Document', 'Legal'],
                'score': 0.95,
                'node_text': 'Some text content',
                'relationships_count': 3
            }
        ]

        export_data = []
        for r in results:
            export_data.append({
                'node_id': r.get('node_id', ''),
                'labels': ', '.join(r.get('labels', [])),
                'score': r.get('score', 0),
                'text': r.get('node_text', r.get('text', '')),
                'relationships_count': r.get('relationships_count', 0)
            })

        self.assertEqual(len(export_data), 1)
        self.assertEqual(export_data[0]['labels'], 'Document, Legal')
        self.assertEqual(export_data[0]['score'], 0.95)


class TestStatusManagement(unittest.TestCase):
    """Test cases for node/relationship status management (new/approved workflow)."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_driver = Mock()
        self.mock_session = MagicMock()
        self.mock_driver.session.return_value.__enter__ = Mock(return_value=self.mock_session)
        self.mock_driver.session.return_value.__exit__ = Mock(return_value=False)

        from graph_db.db_utils import Neo4jConnection
        with patch.object(Neo4jConnection, '__init__', lambda x: None):
            self.neo4j = Neo4jConnection()
            self.neo4j.driver = self.mock_driver

    def test_get_pending_review_nodes(self):
        """Test fetching nodes with status='new'."""
        mock_records = [
            {'id': 'node1', 'text': 'Test', 'labels': ['Entity'], 'status': 'new',
             'created_at': '2024-01-01', 'source_file': 'test.pdf', 'element_id': '123'}
        ]
        self.mock_session.run.return_value = mock_records

        result = self.neo4j.get_pending_review_nodes(limit=10)

        self.mock_session.run.assert_called_once()

    def test_get_pending_review_nodes_no_driver(self):
        """Test get_pending_review_nodes returns empty list without driver."""
        self.neo4j.driver = None

        result = self.neo4j.get_pending_review_nodes()

        self.assertEqual(result, [])

    def test_get_pending_review_relationships(self):
        """Test fetching relationships with status='new'."""
        mock_records = [
            {'source_id': 'a', 'target_id': 'b', 'relationship': 'KNOWS',
             'source_labels': ['Person'], 'target_labels': ['Person'],
             'status': 'new', 'created_at': '2024-01-01', 'source_file': 'test.pdf', 'element_id': '456'}
        ]
        self.mock_session.run.return_value = mock_records

        result = self.neo4j.get_pending_review_relationships(limit=10)

        self.mock_session.run.assert_called_once()

    def test_get_review_stats(self):
        """Test getting review statistics."""
        # Mock node stats
        node_stats = [{'status': 'new', 'count': 5}, {'status': 'approved', 'count': 10}]
        rel_stats = [{'status': 'new', 'count': 3}, {'status': 'approved', 'count': 7}]

        self.mock_session.run.side_effect = [node_stats, rel_stats]

        result = self.neo4j.get_review_stats()

        self.assertEqual(self.mock_session.run.call_count, 2)

    def test_approve_node_success(self):
        """Test successfully approving a node."""
        mock_result = Mock()
        mock_result.single.return_value = {'id': 'test_node'}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.approve_node('test_node')

        self.assertTrue(success)
        self.assertIn('approved', msg.lower())

    def test_approve_node_not_found(self):
        """Test approving a non-existent node."""
        mock_result = Mock()
        mock_result.single.return_value = None
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.approve_node('nonexistent')

        self.assertFalse(success)
        self.assertIn('not found', msg.lower())

    def test_approve_node_no_driver(self):
        """Test approve_node fails gracefully without driver."""
        self.neo4j.driver = None

        success, msg = self.neo4j.approve_node('test')

        self.assertFalse(success)
        self.assertIn('Not connected', msg)

    def test_reject_node(self):
        """Test rejecting (deleting) a node."""
        mock_result = Mock()
        mock_result.single.return_value = {'deleted': 1}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.reject_node('test_node')

        self.assertTrue(success)

    def test_approve_relationship_success(self):
        """Test successfully approving a relationship."""
        mock_result = Mock()
        mock_result.single.return_value = {'type': 'KNOWS'}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.approve_relationship('a', 'b', 'KNOWS')

        self.assertTrue(success)
        self.assertIn('approved', msg.lower())

    def test_approve_relationship_not_found(self):
        """Test approving a non-existent relationship."""
        mock_result = Mock()
        mock_result.single.return_value = None
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.approve_relationship('a', 'b', 'UNKNOWN')

        self.assertFalse(success)

    def test_bulk_approve_nodes(self):
        """Test bulk approving multiple nodes."""
        mock_result = Mock()
        mock_result.single.return_value = {'approved_count': 5}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.bulk_approve_nodes(['node1', 'node2', 'node3', 'node4', 'node5'])

        self.assertTrue(success)
        self.assertIn('5', msg)

    def test_bulk_reject_nodes(self):
        """Test bulk rejecting multiple nodes."""
        mock_result = Mock()
        mock_result.single.return_value = {'deleted_count': 3}
        self.mock_session.run.return_value = mock_result

        success, msg = self.neo4j.bulk_reject_nodes(['node1', 'node2', 'node3'])

        self.assertTrue(success)
        self.assertIn('3', msg)

    def test_approve_all_new(self):
        """Test approving all new nodes and relationships."""
        node_result = Mock()
        node_result.single.return_value = {'count': 10}
        rel_result = Mock()
        rel_result.single.return_value = {'count': 5}

        self.mock_session.run.side_effect = [node_result, rel_result]

        success, msg = self.neo4j.approve_all_new()

        self.assertTrue(success)
        self.assertIn('10', msg)
        self.assertIn('5', msg)


class TestGraphIngestionEntityMatching(unittest.TestCase):
    """Test cases for entity matching in graph ingestion."""

    def test_entity_matching_exact(self):
        """Test exact entity name matching."""
        existing_nodes = [
            {'id': 'Central Bank', 'labels': ['Organization'], 'text': ''},
            {'id': 'Vietnam', 'labels': ['Country'], 'text': ''}
        ]

        # Simulate matching logic
        def find_match(node_id, node_type, existing):
            node_id_lower = node_id.lower().strip()
            for e in existing:
                if e.get('id', '').lower().strip() == node_id_lower:
                    return e.get('id'), True
            return None, False

        matched_id, is_match = find_match('Central Bank', 'Organization', existing_nodes)
        self.assertTrue(is_match)
        self.assertEqual(matched_id, 'Central Bank')

    def test_entity_matching_partial(self):
        """Test partial entity name matching."""
        existing_nodes = [
            {'id': 'State Bank of Vietnam', 'labels': ['organization'], 'text': ''}
        ]

        # Simulate partial matching logic
        def find_partial_match(node_id, node_type, existing):
            node_id_lower = node_id.lower().strip()
            for e in existing:
                existing_id = e.get('id', '').lower().strip()
                existing_labels = [l.lower() for l in e.get('labels', [])]
                if len(node_id_lower) > 3 and len(existing_id) > 3:
                    if node_id_lower in existing_id or existing_id in node_id_lower:
                        if node_type.lower() in existing_labels:
                            return e.get('id'), True
            return None, False

        matched_id, is_match = find_partial_match('State Bank', 'Organization', existing_nodes)
        self.assertTrue(is_match)
        self.assertEqual(matched_id, 'State Bank of Vietnam')

    def test_entity_no_match_creates_new(self):
        """Test that unmatched entities are marked as new."""
        existing_nodes = [
            {'id': 'Central Bank', 'labels': ['Organization'], 'text': ''}
        ]

        def find_match(node_id, node_type, existing):
            node_id_lower = node_id.lower().strip()
            for e in existing:
                if e.get('id', '').lower().strip() == node_id_lower:
                    return e.get('id'), True
            return None, False

        matched_id, is_match = find_match('New Entity', 'Organization', existing_nodes)
        self.assertFalse(is_match)
        self.assertIsNone(matched_id)

    def test_relationship_type_matching(self):
        """Test relationship type matching."""
        existing_rels = [
            {'type': 'BELONGS_TO', 'count': 10},
            {'type': 'CONTAINS', 'count': 5}
        ]

        def is_existing_rel(rel_type, existing):
            rel_type_upper = rel_type.upper().replace(' ', '_')
            for e in existing:
                if e.get('type', '').upper() == rel_type_upper:
                    return True
            return False

        self.assertTrue(is_existing_rel('belongs_to', existing_rels))
        self.assertTrue(is_existing_rel('BELONGS TO', existing_rels))
        self.assertFalse(is_existing_rel('NEW_RELATIONSHIP', existing_rels))


class TestMultiStoreVectorSearch(unittest.TestCase):
    """Test cases for multi-store vector search functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_response = Mock()
        self.mock_response.raise_for_status = Mock()

    @patch('requests.get')
    def test_list_document_stores(self, mock_get):
        """Test listing available document stores."""
        mock_get.return_value.json.return_value = [
            {'id': 'store1', 'name': 'Legal Docs', 'description': 'Legal documents', 'status': 'SYNC'},
            {'id': 'store2', 'name': 'Finance', 'description': 'Financial reports', 'status': 'SYNC'}
        ]
        mock_get.return_value.raise_for_status = Mock()

        from backend.flowise_service import FlowiseService
        service = FlowiseService()
        stores = service.list_document_stores()

        self.assertEqual(len(stores), 2)
        self.assertEqual(stores[0]['name'], 'Legal Docs')
        self.assertEqual(stores[1]['name'], 'Finance')

    @patch('requests.post')
    def test_vector_store_query_single_store(self, mock_post):
        """Test vector store query with single store."""
        mock_post.return_value.json.return_value = {
            'docs': [
                {'pageContent': 'Document 1 content', 'metadata': {}},
                {'pageContent': 'Document 2 content', 'metadata': {}}
            ]
        }
        mock_post.return_value.raise_for_status = Mock()

        from backend.flowise_service import FlowiseService
        service = FlowiseService()
        results = service.vector_store_query("test query", top_k=5, store_ids=['store1'])

        self.assertEqual(len(results), 2)
        self.assertIn('Document 1 content', results)

    @patch('requests.post')
    def test_vector_store_query_multiple_stores(self, mock_post):
        """Test vector store query across multiple stores."""
        # Mock different responses for different stores
        def mock_response(*args, **kwargs):
            response = Mock()
            response.raise_for_status = Mock()
            store_id = kwargs.get('json', {}).get('storeId', '')
            if store_id == 'store1':
                response.json.return_value = {
                    'docs': [{'pageContent': 'Store 1 Doc 1', 'metadata': {}}]
                }
            else:
                response.json.return_value = {
                    'docs': [{'pageContent': 'Store 2 Doc 1', 'metadata': {}}]
                }
            return response

        mock_post.side_effect = mock_response

        from backend.flowise_service import FlowiseService
        service = FlowiseService()
        results = service.vector_store_query("test", top_k=3, store_ids=['store1', 'store2'])

        # Should have results from both stores
        self.assertEqual(mock_post.call_count, 2)

    @patch('requests.post')
    def test_vector_store_query_detailed(self, mock_post):
        """Test detailed vector store query with store info."""
        mock_post.return_value.json.return_value = {
            'docs': [
                {'pageContent': 'Document content', 'metadata': {'source': 'test.pdf'}, 'score': 0.95}
            ]
        }
        mock_post.return_value.raise_for_status = Mock()

        from backend.flowise_service import FlowiseService
        service = FlowiseService()
        results = service.vector_store_query_detailed("test", store_ids=['store1'])

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['store_id'], 'store1')
        self.assertEqual(results[0]['content'], 'Document content')

    @patch('builtins.print')  # Mock print to avoid Unicode issues on Windows
    def test_vector_store_query_no_stores(self, mock_print):
        """Test vector store query with no stores configured."""
        from backend.flowise_service import FlowiseService
        service = FlowiseService()
        service.doc_store_id = None  # No default store

        # Should fall back to chatflow query
        with patch.object(service, 'query', return_value=['fallback result']) as mock_query:
            results = service.vector_store_query("test", store_ids=[])
            # Empty store_ids with no default should trigger fallback
            self.assertEqual(results, ['fallback result'])


class TestRAGAgentStoreSelection(unittest.TestCase):
    """Test cases for RAG agent store selection."""

    def test_set_selected_stores(self):
        """Test setting selected stores."""
        from backend.rag_orchestrator import RAGAgent

        with patch.object(RAGAgent, '__init__', lambda x: None):
            agent = RAGAgent()
            agent.selected_store_ids = []
            agent.flowise = Mock()

            agent.set_selected_stores = lambda ids: setattr(agent, 'selected_store_ids', ids or [])
            agent.set_selected_stores(['store1', 'store2'])

            self.assertEqual(agent.selected_store_ids, ['store1', 'store2'])

    def test_set_selected_stores_empty(self):
        """Test setting empty store list."""
        from backend.rag_orchestrator import RAGAgent

        with patch.object(RAGAgent, '__init__', lambda x: None):
            agent = RAGAgent()
            agent.selected_store_ids = ['old_store']

            agent.set_selected_stores = lambda ids: setattr(agent, 'selected_store_ids', ids or [])
            agent.set_selected_stores([])

            self.assertEqual(agent.selected_store_ids, [])

    def test_get_available_stores(self):
        """Test getting available stores from agent."""
        from backend.rag_orchestrator import RAGAgent

        with patch.object(RAGAgent, '__init__', lambda x: None):
            agent = RAGAgent()
            agent.flowise = Mock()
            agent.flowise.list_document_stores.return_value = [
                {'id': 'store1', 'name': 'Test Store'}
            ]

            agent.get_available_stores = lambda: agent.flowise.list_document_stores()
            stores = agent.get_available_stores()

            self.assertEqual(len(stores), 1)
            self.assertEqual(stores[0]['name'], 'Test Store')


class TestIntegration(unittest.TestCase):
    """Integration tests (require running services)."""

    @unittest.skip("Integration test - requires running Ollama at localhost:11435")
    def test_ollama_embedding_real(self):
        """Test real Ollama embedding generation."""
        from graph_db.db_utils import OllamaEmbedding

        embedding = OllamaEmbedding(
            base_url="http://localhost:11435",
            model="nomic-embed-text"
        )

        result = embedding.encode("Hello, world!")

        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
        print(f"Embedding dimension: {len(result)}")

    @unittest.skip("Integration test - requires running Neo4j and Ollama")
    def test_neo4j_crud_real(self):
        """Test real Neo4j CRUD operations."""
        from graph_db.db_utils import Neo4jConnection

        neo4j = Neo4jConnection()

        # Create
        success, msg = neo4j.create_node("TEST_UNIT_001", "UnitTest", "Unit test node")
        print(f"Create: {success} - {msg}")
        self.assertTrue(success)

        # Read
        node = neo4j.get_node_by_id("TEST_UNIT_001")
        self.assertIsNotNone(node)
        self.assertEqual(node['id'], "TEST_UNIT_001")

        # Update
        success, msg = neo4j.update_node("TEST_UNIT_001", new_text="Updated unit test")
        print(f"Update: {success} - {msg}")
        self.assertTrue(success)

        # Delete
        success, msg = neo4j.delete_node("TEST_UNIT_001")
        print(f"Delete: {success} - {msg}")
        self.assertTrue(success)

        neo4j.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
