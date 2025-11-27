import requests
import json
import os
from backend.config import FLOWISE_API_URL, FLOWISE_API_KEY, FLOWISE_DOC_STORE_ID

class IngestionService:
    def __init__(self):
        # Base URL
        base_url = FLOWISE_API_URL.split('/api/v1')[0]
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {FLOWISE_API_KEY}"
        }

    def list_stores(self):
        """List all document stores"""
        url = f"{self.base_url}/api/v1/document-store/store"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error listing stores: {e}")
            return []

    def create_store(self, name, description=""):
        """Create a new document store"""
        url = f"{self.base_url}/api/v1/document-store/store"
        payload = {
            "name": name,
            "description": description
        }
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            result = response.json()
            print(f"✅ Created new store: {name} (ID: {result.get('id')})")
            return result
        except Exception as e:
            print(f"Error creating store: {e}")
            return None

    def get_store_loaders(self, store_id):
        """Get all loaders from a document store"""
        url = f"{self.base_url}/api/v1/document-store/store/{store_id}"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            store_data = response.json()
            # Parse loaders from JSON string
            loaders_str = store_data.get('loaders', '[]')
            loaders = json.loads(loaders_str) if isinstance(loaders_str, str) else loaders_str
            return loaders
        except Exception as e:
            print(f"Error getting store loaders: {e}")
            return []

    def upsert_file(self, file_path, store_id=None, create_new_store=False, store_name=None, store_desc=None, metadata=None):
        """
        Upsert a file to Flowise Document Store.
        
        Args:
            file_path: Path to the file
            store_id: ID of existing store (uses default if None)
            create_new_store: Whether to create a new store
            store_name: Name for new store (if create_new_store=True)
            store_desc: Description for new store (if create_new_store=True)
            metadata: Optional metadata dict
        """
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return None

        # Use provided store_id or default
        target_store_id = store_id or FLOWISE_DOC_STORE_ID
        upsert_url = f"{self.base_url}/api/v1/document-store/upsert/{target_store_id}"
        
        filename = os.path.basename(file_path)
        
        try:
            with open(file_path, 'rb') as f:
                files = {'files': (filename, f)}
                
                # Base configuration
                body_data = {
                    "metadata": json.dumps(metadata) if metadata else "{}",
                    "replaceExisting": "false"
                }
                
                # Handle new store creation
                if create_new_store and store_name:
                    # Create the store first
                    print(f"Creating new store '{store_name}'...")
                    new_store = self.create_store(store_name, store_desc or "")
                    
                    if new_store and 'id' in new_store:
                        # Use the newly created store
                        target_store_id = new_store['id']
                        upsert_url = f"{self.base_url}/api/v1/document-store/upsert/{target_store_id}"
                        print(f"New store created with ID: {target_store_id}")
                        
                        # Get a docId from an existing store to inherit configuration
                        print("Getting reference configuration from existing store...")
                        existing_stores = self.list_stores()
                        reference_doc_id = None
                        
                        # Find a store with loaders (not the one we just created)
                        for store in existing_stores:
                            if store.get('id') != target_store_id:
                                loaders = self.get_store_loaders(store.get('id'))
                                if loaders and len(loaders) > 0:
                                    reference_doc_id = loaders[0].get('id')
                                    print(f"Using docId from store '{store.get('name')}': {reference_doc_id}")
                                    break
                        
                        if reference_doc_id:
                            # Use docId to inherit all configuration
                            body_data["createNewDocStore"] = "false"
                            body_data["docId"] = reference_doc_id
                            print(f"Uploading {filename} to new store (inheriting config via docId)...")
                        else:
                            print("❌ No reference loader found to inherit configuration")
                            return None
                    else:
                        print("❌ Failed to create new store")
                        return None
                else:
                    # For existing store, use docId to inherit configuration
                    body_data["createNewDocStore"] = "false"
                    
                    # Get existing loaders to inherit configuration
                    loaders = self.get_store_loaders(target_store_id)
                    if loaders and len(loaders) > 0:
                        # Use the first loader's ID to inherit its configuration
                        doc_id = loaders[0].get('id')
                        if doc_id:
                            body_data["docId"] = doc_id
                            print(f"Uploading {filename} to store {target_store_id} (inheriting config from loader {doc_id[:8]}...)...")
                        else:
                            print(f"Warning: No loader ID found, providing full config...")
                            # Fallback: provide full configuration
                            body_data["loader"] = json.dumps({"name": "pdfFile_0", "config": {}})
                            body_data["splitter"] = json.dumps({
                                "name": "recursiveCharacterTextSplitter",
                                "config": {"chunkSize": 1000, "chunkOverlap": 200}
                            })
                    else:
                        print(f"Warning: No existing loaders found, providing full config...")
                        # No existing loaders, provide full configuration
                        body_data["loader"] = json.dumps({"name": "pdfFile_0", "config": {}})
                        body_data["splitter"] = json.dumps({
                            "name": "recursiveCharacterTextSplitter",
                            "config": {"chunkSize": 1000, "chunkOverlap": 200}
                        })
                
                # Debug: Print the payload
                print(f"Request payload keys: {list(body_data.keys())}")
                if 'docId' in body_data:
                    print(f"Using docId: {body_data['docId']}")
                
                response = requests.post(upsert_url, files=files, data=body_data, headers=self.headers)
                
                if response.status_code != 200:
                    print(f"Error: {response.status_code}")
                    print(f"Response: {response.text}")
                    print(f"Request URL: {upsert_url}")
                    print(f"Request body keys: {list(body_data.keys())}")
                    
                response.raise_for_status()
                print("✅ Upload successful!")
                return response.json()
                
        except Exception as e:
            print(f"Error upserting file: {e}")
            return None

if __name__ == "__main__":
    service = IngestionService()
    # Example: List stores
    # stores = service.list_stores()
    # print(f"Available stores: {stores}")
