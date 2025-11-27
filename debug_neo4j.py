import sys
import os
from neo4j import GraphDatabase

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

def debug_neo4j():
    print(f"Attempting to connect to: {NEO4J_URI}")
    print(f"User: {NEO4J_USER}")
    print(f"Password: {NEO4J_PASSWORD}") # Printing for debugging since user says it's correct
    
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            result = session.run("RETURN 1 AS num")
            record = result.single()
            print(f"Success! Result: {record['num']}")
        driver.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    debug_neo4j()
