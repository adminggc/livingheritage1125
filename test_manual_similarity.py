import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph_db.db_utils import Neo4jConnection

conn = Neo4jConnection()

# Check the exact index configuration
print("Checking vector index configuration...")
query = """
SHOW INDEXES YIELD name, type, labelsOrTypes, properties, options
WHERE type = 'VECTOR'
RETURN name, type, labelsOrTypes, properties, options
"""
result = conn.query(query)
for r in result:
    print(f"Index: {r}")

# Try to manually compute similarity
print("\n\nTrying manual cosine similarity...")
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
query_embedding = model.encode("fraud detection").tolist()

# Manual similarity calculation
manual_query = """
MATCH (n)
WHERE n.embedding IS NOT NULL
WITH n, 
     reduce(dot = 0.0, i IN range(0, size(n.embedding)-1) | 
         dot + n.embedding[i] * $query_embedding[i]) as dotProduct,
     sqrt(reduce(sum = 0.0, i IN range(0, size(n.embedding)-1) | 
         sum + n.embedding[i] * n.embedding[i])) as norm1,
     sqrt(reduce(sum = 0.0, i IN range(0, size($query_embedding)-1) | 
         sum + $query_embedding[i] * $query_embedding[i])) as norm2
WITH n, dotProduct / (norm1 * norm2) as similarity
WHERE similarity > 0.3
RETURN n.id as id, n.text as text, similarity
ORDER BY similarity DESC
LIMIT 5
"""

try:
    results = conn.query(manual_query, {'query_embedding': query_embedding})
    print(f"Manual similarity results: {len(results)}")
    for r in results:
        print(f"  - {r['id']}: {r['similarity']:.4f}")
        print(f"    {r['text'][:80]}...")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
