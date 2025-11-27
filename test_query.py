import sys
import os
# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.rag_orchestrator import RAGAgent

if __name__ == '__main__':
    agent = RAGAgent()
    query = "liet ke cac kich ban cua NHNN ve fraude"
    print('=== Query ===')
    print(query)
    print('\n=== Answer ===')
    try:
        for chunk in agent.process_query(query):
            print(chunk, end='')
    except Exception as e:
        print('Error during processing:', e)
    finally:
        agent.close()
