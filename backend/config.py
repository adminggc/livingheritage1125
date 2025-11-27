import os
from dotenv import load_dotenv

from pathlib import Path
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Neo4j Configuration
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "Password")

# Flowise Configuration
FLOWISE_API_URL = os.getenv("FLOWISE_API_URL", "http://localhost:3003/api/v1/prediction")
FLOWISE_CHATFLOW_ID = os.getenv("FLOWISE_CHATFLOW_ID", "YOUR_FLOW_ID")
FLOWISE_API_KEY = os.getenv("FLOWISE_API_KEY", "")
FLOWISE_DOC_STORE_ID = os.getenv("FLOWISE_DOC_STORE_ID", "")
FLOWISE_DOC_LOADER_ID = os.getenv("FLOWISE_DOC_LOADER_ID", "")

# Ollama Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11435")
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")  # or mxbai-embed-large, all-minilm
RERANKER_MODEL = "dengcao/Qwen3-Reranker-0.6B:Q8_0"

# Google AI Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Jina Configuration
JINA_API_KEY = os.getenv("JINA_API_KEY", "")

# Embedding Configuration
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "ollama")  # ollama, sentence-transformers, google-gemini, openai
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")  # For ollama: nomic-embed-text, mxbai-embed-large
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Reranker Configuration
RERANKER_PROVIDER = os.getenv("RERANKER_PROVIDER", "jina")  # jina, cohere, none
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
