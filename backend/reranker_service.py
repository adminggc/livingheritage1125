import requests
import json
from backend.config import RERANKER_PROVIDER, JINA_API_KEY, COHERE_API_KEY

class RerankerService:
    def __init__(self):
        self.provider = RERANKER_PROVIDER.lower()
        
        if self.provider == "jina":
            self.api_key = JINA_API_KEY
            self.api_url = "https://api.jina.ai/v1/rerank"
            self.model = "jina-reranker-v3"
            print(f"Using Jina reranker: {self.model}")
            
        elif self.provider == "cohere":
            self.api_key = COHERE_API_KEY
            self.api_url = "https://api.cohere.ai/v1/rerank"
            self.model = "rerank-english-v3.0"
            print(f"Using Cohere reranker: {self.model}")
            
        elif self.provider == "none":
            print("Reranker disabled - using original document order")
        else:
            print(f"Unknown reranker provider: {self.provider}, disabling reranking")
            self.provider = "none"

    def rerank(self, query, documents, top_k=5):
        """
        Rerank a list of documents based on the query.
        Supports Jina, Cohere, or no reranking.
        """
        if not documents:
            return []
        
        # If reranking is disabled, just return top_k docs
        if self.provider == "none":
            return documents[:top_k]
        
        # Jina reranking
        if self.provider == "jina":
            return self._rerank_jina(query, documents, top_k)
        
        # Cohere reranking
        elif self.provider == "cohere":
            return self._rerank_cohere(query, documents, top_k)
        
        # Fallback
        return documents[:top_k]
    
    def _rerank_jina(self, query, documents, top_k):
        """Rerank using Jina API"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": self.model,
            "query": query,
            "top_n": top_k,
            "documents": documents,
            "return_documents": True
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code != 200:
                print(f"⚠️  Jina Error: {response.status_code}")
                
            response.raise_for_status()
            results = response.json().get('results', [])
            
            # Extract document text from results
            ranked_docs = [item['document']['text'] for item in results]
            return ranked_docs
            
        except Exception as e:
            print(f"Error reranking with Jina: {e}")
            return documents[:top_k]
    
    def _rerank_cohere(self, query, documents, top_k):
        """Rerank using Cohere API"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": self.model,
            "query": query,
            "top_n": top_k,
            "documents": documents,
            "return_documents": True
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code != 200:
                print(f"⚠️  Cohere Error: {response.status_code}")
                
            response.raise_for_status()
            results = response.json().get('results', [])
            
            # Extract document text from results
            ranked_docs = [item['document']['text'] for item in results]
            return ranked_docs
            
        except Exception as e:
            print(f"Error reranking with Cohere: {e}")
            return documents[:top_k]

if __name__ == "__main__":
    service = RerankerService()
    # service.rerank("test", ["doc1", "doc2"])
