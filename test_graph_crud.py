"""
Test script for Graph CRUD operations
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from graph_db.db_utils import Neo4jConnection

def test_crud():
    print("=" * 60)
    print("Testing Graph CRUD Operations")
    print("=" * 60)

    # Initialize connection
    neo4j = Neo4jConnection()

    # Test 1: Get stats
    print("\n1. Getting graph stats...")
    stats = neo4j.get_graph_stats()
    print(f"   Total nodes: {stats.get('total_nodes', 0)}")
    print(f"   Total relationships: {stats.get('total_relationships', 0)}")
    print(f"   Labels: {stats.get('labels', {})}")

    # Test 2: Create a test node
    print("\n2. Creating test node...")
    test_node_id = "TEST_NODE_001"
    test_label = "TestEntity"
    test_text = "This is a test node for CRUD operations"

    success, msg = neo4j.create_node(test_node_id, test_label, test_text)
    print(f"   Result: {success}")
    print(f"   Message: {msg}")

    # Test 3: Get the node
    print("\n3. Getting the created node...")
    node = neo4j.get_node_by_id(test_node_id)
    if node:
        print(f"   Found node: {node['id']}")
        print(f"   Labels: {node['labels']}")
        print(f"   Text: {node['text']}")
        print(f"   Has embedding: {node.get('has_embedding', False)}")
    else:
        print("   ERROR: Node not found!")

    # Test 4: List all nodes
    print("\n4. Listing all nodes...")
    nodes = neo4j.get_all_nodes(limit=10)
    print(f"   Found {len(nodes)} nodes")
    for n in nodes[:5]:
        print(f"   - {n.get('id', 'N/A')}: {n.get('labels', [])}")

    # Test 5: Update the node
    print("\n5. Updating the test node...")
    success, msg = neo4j.update_node(test_node_id, new_text="Updated test text for CRUD operations")
    print(f"   Result: {success}")
    print(f"   Message: {msg}")

    # Verify update
    node = neo4j.get_node_by_id(test_node_id)
    if node:
        print(f"   Updated text: {node['text']}")

    # Test 6: Create relationship (if another node exists)
    print("\n6. Testing relationship creation...")
    # First check if there's another node to connect to
    nodes = neo4j.get_all_nodes(limit=5)
    other_nodes = [n for n in nodes if n['id'] != test_node_id]

    if other_nodes:
        target_id = other_nodes[0]['id']
        print(f"   Creating relationship to: {target_id}")
        success, msg = neo4j.create_relationship(test_node_id, target_id, "TEST_RELATIONSHIP")
        print(f"   Result: {success}")
        print(f"   Message: {msg}")

        # Delete the test relationship
        print("\n7. Deleting test relationship...")
        success, msg = neo4j.delete_relationship(test_node_id, target_id, "TEST_RELATIONSHIP")
        print(f"   Result: {success}")
        print(f"   Message: {msg}")
    else:
        print("   No other nodes found to test relationship")

    # Test 8: Delete the test node
    print("\n8. Deleting test node...")
    success, msg = neo4j.delete_node(test_node_id)
    print(f"   Result: {success}")
    print(f"   Message: {msg}")

    # Verify deletion
    node = neo4j.get_node_by_id(test_node_id)
    if node:
        print("   ERROR: Node still exists!")
    else:
        print("   Confirmed: Node deleted successfully")

    # Final stats
    print("\n9. Final graph stats...")
    stats = neo4j.get_graph_stats()
    print(f"   Total nodes: {stats.get('total_nodes', 0)}")
    print(f"   Total relationships: {stats.get('total_relationships', 0)}")

    print("\n" + "=" * 60)
    print("CRUD Tests Complete!")
    print("=" * 60)

    neo4j.close()

if __name__ == "__main__":
    test_crud()
