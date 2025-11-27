import sys
import os
import requests

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.config import FLOWISE_API_URL, FLOWISE_CHATFLOW_ID, NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, OLLAMA_BASE_URL, FLOWISE_API_KEY
from graph_db.db_utils import Neo4jConnection

def test_flowise():
    print("-" * 20)
    print("Testing Flowise Connection...")
    url = f"{FLOWISE_API_URL}/{FLOWISE_CHATFLOW_ID}"
    print(f"URL: {url}")
    try:
        # Just a simple check, maybe a GET or a dummy POST
        # Flowise prediction endpoints usually expect POST.
        # We'll try a simple hello message.
        headers = {"Authorization": f"Bearer {FLOWISE_API_KEY}"} if FLOWISE_API_KEY else {}
        response = requests.post(url, json={"question": "Hello"}, headers=headers)
        if response.status_code == 200:
            print("✅ Flowise Connection Successful!")
            # print("Response:", response.json())
        else:
            print(f"❌ Flowise returned status code: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"❌ Flowise Connection Failed: {e}")

def test_neo4j():
    print("-" * 20)
    print("Testing Neo4j Connection...")
    try:
        conn = Neo4jConnection()
        # The __init__ already verifies connection and prints
        conn.close()
        print("✅ Neo4j Connection Test Completed.")
    except Exception as e:
        print(f"❌ Neo4j Connection Failed: {e}")

def test_ollama():
    print("-" * 20)
    print("Testing Ollama Connection...")
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}")
        if response.status_code == 200:
            print("✅ Ollama is running!")
        else:
            print(f"⚠️ Ollama returned status code: {response.status_code}")
            
        # Check for specific model
        # This endpoint might vary, usually /api/tags to list models
        tags_response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        if tags_response.status_code == 200:
            models = [m['name'] for m in tags_response.json().get('models', [])]
            print(f"Available Models: {models}")
            if "dengcao/Qwen3-Reranker-0.6B:Q8_0" in models:
                print("✅ Reranker model found!")
            else:
                print("⚠️ Reranker model 'dengcao/Qwen3-Reranker-0.6B:Q8_0' not found in list.")
        
    except Exception as e:
        print(f"❌ Ollama Connection Failed: {e}")

from backend.config import JINA_API_KEY

def test_jina():
    print("-" * 20)
    print("Testing Jina Reranker API...")
    url = "https://api.jina.ai/v1/rerank"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JINA_API_KEY}"
    }
    payload = {
        "model": "jina-reranker-v3",
        "query": "test query",
        "documents": ["doc1", "doc2"],
        "top_n": 1
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            print("✅ Jina API Connection Successful!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Jina API returned status code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Jina API Connection Failed: {e}")

if __name__ == "__main__":
    test_flowise()
    test_neo4j()
    # test_ollama() # Skipped as requested
    test_jina()
