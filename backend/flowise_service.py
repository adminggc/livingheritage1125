import requests
import json
from backend.config import FLOWISE_API_URL, FLOWISE_CHATFLOW_ID, FLOWISE_DOC_STORE_ID, FLOWISE_API_KEY


class FlowiseService:
    def __init__(self):
        self.api_url = FLOWISE_API_URL
        self.chatflow_id = FLOWISE_CHATFLOW_ID
        self.doc_store_id = FLOWISE_DOC_STORE_ID
        # Extract base URL (remove /prediction path)
        self.base_url = FLOWISE_API_URL.replace('/api/v1/prediction', '/api/v1')

    def list_document_stores(self):
        """List all available document stores."""
        url = f"{self.base_url}/document-store/store"
        headers = {"Content-Type": "application/json"}
        if FLOWISE_API_KEY:
            headers["Authorization"] = f"Bearer {FLOWISE_API_KEY}"

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            stores = response.json()
            # Return list of stores with id, name, description
            return [
                {
                    'id': store.get('id', ''),
                    'name': store.get('name', 'Unnamed'),
                    'description': store.get('description', ''),
                    'status': store.get('status', 'unknown')
                }
                for store in stores
            ]
        except Exception as e:
            print(f"Error listing document stores: {e}")
            return []

    def vector_store_query(self, question, top_k=5, store_ids=None):
        """
        Direct vector store query - retrieves raw chunks without LLM processing.
        This is better for retrieval as it returns multiple source documents.

        Args:
            question: The query text
            top_k: Number of results per store
            store_ids: List of store IDs to query (uses default if None)
        """
        # Determine which stores to query
        if store_ids and len(store_ids) > 0:
            stores_to_query = store_ids
        elif self.doc_store_id:
            stores_to_query = [self.doc_store_id]
        else:
            print("   ⚠️  No document stores configured, falling back to chatflow query")
            return self.query(question)

        url = f"{self.base_url}/document-store/vectorstore/query"
        headers = {"Content-Type": "application/json"}
        if FLOWISE_API_KEY:
            headers["Authorization"] = f"Bearer {FLOWISE_API_KEY}"

        all_results = []

        # Query each store
        for store_id in stores_to_query:
            payload = {
                "storeId": store_id,
                "query": question
            }

            try:
                response = requests.post(url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()

                # Extract documents from response
                docs = result.get('docs', [])
                for doc in docs[:top_k]:
                    content = doc.get('pageContent', str(doc))
                    # Add store info to help identify source
                    all_results.append({
                        'content': content,
                        'store_id': store_id,
                        'metadata': doc.get('metadata', {})
                    })

            except requests.exceptions.RequestException as e:
                print(f"   ⚠️  Vector store query failed for store {store_id}: {e}")
                continue

        if not all_results:
            print("   ⚠️  No results from any store, falling back to chatflow")
            return self.query(question)

        # Return just the content for backward compatibility
        return [r['content'] for r in all_results[:top_k * len(stores_to_query)]]

    def vector_store_query_detailed(self, question, top_k=5, store_ids=None):
        """
        Vector store query with detailed results including store info.
        Returns list of dicts with content, store_id, and metadata.
        """
        if store_ids and len(store_ids) > 0:
            stores_to_query = store_ids
        elif self.doc_store_id:
            stores_to_query = [self.doc_store_id]
        else:
            return []

        url = f"{self.base_url}/document-store/vectorstore/query"
        headers = {"Content-Type": "application/json"}
        if FLOWISE_API_KEY:
            headers["Authorization"] = f"Bearer {FLOWISE_API_KEY}"

        all_results = []

        for store_id in stores_to_query:
            payload = {
                "storeId": store_id,
                "query": question
            }

            try:
                response = requests.post(url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()

                docs = result.get('docs', [])
                for doc in docs[:top_k]:
                    all_results.append({
                        'content': doc.get('pageContent', str(doc)),
                        'store_id': store_id,
                        'metadata': doc.get('metadata', {}),
                        'score': doc.get('score', 0)
                    })

            except requests.exceptions.RequestException as e:
                print(f"   ⚠️  Query failed for store {store_id}: {e}")
                continue

        return all_results

    def query(self, question):
        """
        Send a query to the Flowise API and return the response.
        """
        url = f"{self.api_url}/{self.chatflow_id}"
        
        payload = {
            "question": question,
            "overrideConfig": {
                "returnSourceDocuments": True
            }
        }
        
        # Add Authorization header if API key is present
        headers = {}
        from backend.config import FLOWISE_API_KEY
        if FLOWISE_API_KEY:
            headers["Authorization"] = f"Bearer {FLOWISE_API_KEY}"
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            # Extract source documents if available
            if isinstance(result, dict):
                # Check for sourceDocuments
                if 'sourceDocuments' in result:
                    docs = result['sourceDocuments']
                    # Extract pageContent from each doc
                    return [doc.get('pageContent', str(doc)) for doc in docs]
                # Fallback: return the text response as a single-item list
                elif 'text' in result:
                    return [result['text']]
                else:
                    return [str(result)]
            else:
                return [str(result)]
                
        except requests.exceptions.RequestException as e:
            print(f"Error querying Flowise: {e}")
            return []

if __name__ == "__main__":
    # Test the service
    service = FlowiseService()
    # print(service.query("Test query"))
