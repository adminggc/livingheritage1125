import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph_db.db_utils import Neo4jConnection

# Test the vector index
conn = Neo4jConnection()

# Check if nodes have embeddings
print("Checking nodes with embeddings...")
query = """
MATCH (n)
WHERE n.embedding IS NOT NULL
RETURN count(n) as nodes_with_embeddings, labels(n)[0] as label
"""
result = conn.query(query)
print(f"Nodes with embeddings: {result}")

# Check vector index
print("\nChecking vector index...")
query = """
SHOW INDEXES
"""
result = conn.query(query)
for idx in result:
    print(f"Index: {idx}")

# Try a simple vector search
print("\nTrying vector search...")
results = conn.vector_search("fraud detection", top_k=3)
print(f"Vector search results: {len(results)}")
for i, r in enumerate(results):
    print(f"{i+1}. Score: {r.get('score', 0):.3f}")
    print(f"   Text: {r.get('text', '')[:100]}...")
    print(f"   Relationships: {r.get('relationships_count', 0)}")
