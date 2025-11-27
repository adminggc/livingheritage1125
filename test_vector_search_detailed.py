import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph_db.db_utils import Neo4jConnection
from sentence_transformers import SentenceTransformer

# Test the vector search manually
conn = Neo4jConnection()

print("Testing vector search manually...")
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
query_text = "fraud detection"
query_embedding = model.encode(query_text).tolist()

print(f"Query: {query_text}")
print(f"Embedding dimensions: {len(query_embedding)}")

# Try the vector search query directly
query_str = """
CALL db.index.vector.queryNodes('node_embeddings', $top_k, $query_embedding)
YIELD node, score
WITH node, score
ORDER BY score DESC
RETURN 
    node.id as node_id,
    node.text as text,
    labels(node) as labels,
    score
LIMIT 3
"""

try:
    result = conn.query(query_str, {
        'top_k': 3,
        'query_embedding': query_embedding
    })
    print(f"\nResults: {len(result)}")
    for r in result:
        print(f"  - {r}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

# Also check what's in the nodes
print("\n\nChecking sample nodes...")
sample_query = """
MATCH (n)
WHERE n.embedding IS NOT NULL
RETURN n.id as id, n.text as text, labels(n) as labels, size(n.embedding) as emb_size
LIMIT 3
"""
samples = conn.query(sample_query)
for s in samples:
    print(f"  - ID: {s['id']}, Labels: {s['labels']}, Emb size: {s['emb_size']}")
    print(f"    Text: {s['text'][:100]}...")
