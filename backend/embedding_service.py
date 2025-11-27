"""
Flexible embedding service that supports multiple providers
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import EMBEDDING_PROVIDER, EMBEDDING_MODEL, GOOGLE_API_KEY, OPENAI_API_KEY

class EmbeddingService:
    def __init__(self):
        self.provider = EMBEDDING_PROVIDER.lower()
        self.model_name = EMBEDDING_MODEL
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the embedding model based on provider"""
        if self.provider == "sentence-transformers":
            from sentence_transformers import SentenceTransformer
            print(f"Loading SentenceTransformer model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            print(f"Model loaded ({self.model.get_sentence_embedding_dimension()} dimensions)")
            
        elif self.provider == "google-gemini":
            import google.generativeai as genai
            if not GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY not set for Google Gemini embeddings")
            genai.configure(api_key=GOOGLE_API_KEY)
            print(f"Using Google Gemini embeddings: {self.model_name}")
            self.model = genai
            
        elif self.provider == "openai":
            from openai import OpenAI
            if not OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not set for OpenAI embeddings")
            self.model = OpenAI(api_key=OPENAI_API_KEY)
            print(f"Using OpenAI embeddings: {self.model_name}")
            
        else:
            raise ValueError(f"Unknown embedding provider: {self.provider}")
    
    def encode(self, text):
        """
        Generate embedding for text
        Returns: list of floats (embedding vector)
        """
        if self.provider == "sentence-transformers":
            return self.model.encode(text).tolist()
            
        elif self.provider == "google-gemini":
            result = self.model.embed_content(
                model=self.model_name,
                content=text,
                task_type="retrieval_query"
            )
            return result['embedding']
            
        elif self.provider == "openai":
            response = self.model.embeddings.create(
                input=text,
                model=self.model_name
            )
            return response.data[0].embedding
        
        else:
            raise ValueError(f"Unknown provider: {self.provider}")
    
    def get_dimension(self):
        """Get embedding dimension"""
        if self.provider == "sentence-transformers":
            return self.model.get_sentence_embedding_dimension()
        elif self.provider == "google-gemini":
            # Google Gemini embedding-001: 768 dims, text-embedding-004: 768 dims
            return 768
        elif self.provider == "openai":
            # text-embedding-3-small: 1536, text-embedding-3-large: 3072, ada-002: 1536
            if "3-small" in self.model_name:
                return 1536
            elif "3-large" in self.model_name:
                return 3072
            else:
                return 1536
        return None

if __name__ == "__main__":
    # Test the embedding service
    service = EmbeddingService()
    test_text = "This is a test sentence"
    embedding = service.encode(test_text)
    print(f"Embedding dimension: {len(embedding)}")
    print(f"First 5 values: {embedding[:5]}")
