# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Enterprise RAG Implementation** is a Retrieval-Augmented Generation (RAG) system that combines multiple retrieval strategies with agentic synthesis. The system performs hybrid search across vector databases and knowledge graphs, reranks results, and synthesizes answers using an LLM.

### Core Architecture

The RAG pipeline follows this pattern:

```
User Query
  ↓
[Vector Search] Flowise API (semantic similarity in documents)
  ↓
[Graph Search] Neo4j (semantic similarity in knowledge graph via embeddings)
  ↓
[Reranking] Jina/Cohere API (score and rank combined results)
  ↓
[Synthesis] Google Gemini (generate answer from top-k context)
  ↓
Answer (streamed to Streamlit UI)
```

## Directory Structure

- **`backend/`**: Core RAG services
  - `rag_orchestrator.py`: Main orchestration engine implementing the 4-step pipeline
  - `flowise_service.py`: Vector search integration via Flowise API
  - `reranker_service.py`: Result reranking using external reranker models
  - `embedding_service.py`: Embedding generation and management
  - `graph_ingestion_service.py`: Document ingestion with graph extraction and embeddings
  - `ingestion_service.py`: Document processing pipeline
  - `config.py`: Environment configuration loading (uses `.env` in parent or current directory)

- **`frontend/`**: Streamlit UI
  - `app.py`: Main Streamlit application with chat interface

- **`graph_db/`**: Knowledge graph utilities
  - `db_utils.py`: Neo4j connection and query methods, including vector search

- **Test files**: Various test scripts in root (`test_*.py`) for debugging services

## Setup and Running

### Prerequisites

1. **Python 3.8+**
2. **Neo4j** running locally (`bolt://localhost:7687`, default user: `neo4j`, password: `Password`)
3. **Flowise** running on port 3003 with a configured chatflow
4. **Ollama** running locally with `dengcao/Qwen3-Reranker-0.6B:Q8_0` model pulled (for local reranking)
5. **Google API Key** (for Gemini LLM synthesis, optional but recommended)

### Environment Configuration

1. Copy `.env.example` to `.env` in the root `implementation/` directory
2. Update `.env` with your keys:
   - `FLOWISE_CHATFLOW_ID`: Your Flowise chatflow ID
   - `GOOGLE_API_KEY`: Google Generative AI key (for synthesis)
   - Optional: `FLOWISE_API_KEY`, `JINA_API_KEY`, `COHERE_API_KEY`, `OPENAI_API_KEY`

The `config.py` searches for `.env` in parent and current directories, so placement in `implementation/` or `backend/` both work.

### Installation and Running

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run the Streamlit UI
streamlit run frontend/app.py

# Or use the batch file (Windows)
run_app.bat
```

## Key Components

### RAG Orchestrator (`backend/rag_orchestrator.py`)

The `RAGAgent` class orchestrates the entire pipeline:

1. **Vector Search** (`flowise.query()`): Retrieves documents from Flowise
2. **Graph Search** (`neo4j.vector_search()`): Performs semantic similarity search on Neo4j knowledge graph nodes using embeddings
3. **Reranking** (`reranker.rerank()`): Scores and ranks combined results
4. **Synthesis** (`llm.stream()`): Generates answer from top-k results using Gemini

Method: `process_query(query)` - Main entry point that yields answer chunks for streaming.

### Vector Search in Knowledge Graph

The system implements **vector search on Neo4j** using sentence embeddings:

- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` (384-dim vectors)
- **Method**: Manual cosine similarity calculation in Neo4j (works across all node labels)
- **Trigger**: During document ingestion via `graph_ingestion_service.py`
- **Query Method**: `Neo4jConnection.vector_search(query_text, top_k=5)` in `graph_db/db_utils.py`

Each graph node stores:
- `embedding`: 384-dimensional vector
- `text`: Node content (type, ID, properties)
- `node_id`, `labels`: Node metadata

### Embedding and Ingestion

**`backend/graph_ingestion_service.py`**:
- Extracts entities and relationships from documents using Google Gemini
- Generates embeddings for each node
- Creates/updates Neo4j nodes with embeddings and vector index

**`backend/embedding_service.py`**:
- Manages embedding generation from various providers (sentence-transformers, Google Gemini, OpenAI)
- Uses configuration from `config.py` to select provider

### Reranking

**`backend/reranker_service.py`**:
- Supports multiple reranker backends: Jina, Cohere, Ollama
- Default provider is Jina (configured in `config.py`)
- Takes query and documents, returns top-k reranked results with scores

## Common Development Tasks

### Running Tests

Individual test scripts exist for different services:

```bash
# Test Neo4j connection and graph operations
python test_connections.py

# Test vector search implementation
python test_vector_search.py
python test_vector_search_detailed.py

# Test manual similarity calculations
python test_manual_similarity.py

# Test API query endpoint
python test_query.py

# Debug Neo4j connection
python debug_neo4j.py

# List available models
python list_models.py
```

### Adding a New Reranker

1. Update `backend/reranker_service.py` to add new provider logic
2. Add corresponding config variables in `backend/config.py`
3. Update `RERANKER_PROVIDER` in `.env`

### Modifying the RAG Pipeline

To change the orchestration flow, edit `backend/rag_orchestrator.py`:

- **Add new retrieval source**: Add method to `RAGAgent.__init__()` and call in `process_query()`
- **Change reranking strategy**: Modify reranking parameters in Step 3
- **Adjust synthesis prompt**: Edit the prompt template in the synthesis step

### Debugging

The orchestrator logs each step with detailed output:

```
🔍 Processing: [query]
📚 Step 1/4: Vector Search...
   → Retrieved X document(s)
🕸️  Step 2/4: Graph Search...
   → Found X graph node(s) via vector search
🎯 Step 3/4: Reranking...
   → Input: X documents → Output: Top X
✨ Step 4/4: Generating answer...
✅ Complete (X.Xs)
```

Check console output to identify which step is failing or producing unexpected results.

### Adding New External Services

1. Create a new service file in `backend/` (e.g., `backend/new_service.py`)
2. Add configuration variables to `backend/config.py`
3. Import and initialize in `RAGAgent.__init__()`
4. Call in appropriate pipeline step

## Configuration Variables

Key environment variables (see `.env.example`):

- **Neo4j**: `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
- **Flowise**: `FLOWISE_API_URL`, `FLOWISE_CHATFLOW_ID`, `FLOWISE_API_KEY`
- **Ollama**: `OLLAMA_BASE_URL`, `RERANKER_MODEL`
- **Embedding**: `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`
- **Reranker**: `RERANKER_PROVIDER`, `JINA_API_KEY`, `COHERE_API_KEY`
- **LLM**: `GOOGLE_API_KEY`, `OPENAI_API_KEY`

## Important Notes

- **Neo4j Connection**: Must be running and accessible at configured URI. Connection is tested on initialization.
- **Streamlit State**: The app maintains chat history in Streamlit's session state. Each new session starts fresh.
- **Streaming**: LLM responses are streamed word-by-word to the UI via `yield` in `process_query()`.
- **Graph Embeddings**: Existing graph nodes need re-ingestion to get embeddings. Upload documents via the sidebar to generate embeddings.
- **Error Handling**: If GOOGLE_API_KEY is missing, synthesis will fail gracefully and return raw retrieved documents.
