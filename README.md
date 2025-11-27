# Enterprise RAG Implementation

This project implements a Basic RAG system with Enterprise features:
- **Vector Search**: Using local Flowise API (Port 3003).
- **Graph Search**: Using local Neo4j.
- **Reranking**: Using local Ollama (Qwen3-Reranker).
- **Agentic UI**: Built with Streamlit, powered by Google GenAI (or local LLM fallback).

## Prerequisites

1.  **Python 3.8+**
2.  **Neo4j** running locally (`bolt://localhost:7687`, user: `neo4j`, pass: `Password`).
3.  **Flowise** running locally on port 3003.
4.  **Ollama** running locally with `dengcao/Qwen3-Reranker-0.6B:Q8_0` pulled.
5.  **Google API Key** (optional, for Gemini).

## Setup

1.  Copy `.env.example` to `.env` in the `implementation` folder (or `backend` folder depending on where you run it from, but code looks for `.env` in current or parent).
    *   *Note*: The `config.py` loads `.env`. Best to place it in `implementation/backend/` or just `implementation/`.
2.  Update `.env` with your `FLOWISE_CHATFLOW_ID` and `GOOGLE_API_KEY`.

## Running

Double click `run_app.bat` or run:

```bash
pip install -r backend/requirements.txt
streamlit run frontend/app.py
```

## Architecture

- **Backend**: `backend/` contains services for Flowise, Ollama, and the main RAG Orchestrator.
- **Frontend**: `frontend/` contains the Streamlit UI.
- **Neo4j**: `neo4j/` contains database utilities.
