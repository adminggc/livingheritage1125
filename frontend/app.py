import streamlit as st
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.rag_orchestrator import RAGAgent

st.set_page_config(page_title="Enterprise RAG Agent", page_icon="🤖", layout="wide")

# Enhanced Custom CSS
st.markdown("""
<style>
    .main {
        background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    }
    
    .stChatMessage {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 15px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(10px);
        padding: 1.5rem !important;
        margin: 1rem 0 !important;
    }
    
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, rgba(15, 12, 41, 0.95) 0%, rgba(48, 43, 99, 0.95) 100%);
    }
    
    [data-testid="stSidebar"] * {
        color: #ffffff !important;
    }
    
    [data-testid="stSidebar"] label {
        color: #e0e7ff !important;
    }
    
    /* Text inputs in sidebar - dark text on light background */
    [data-testid="stSidebar"] input[type="text"] {
        background-color: #ffffff !important;
        color: #1e1b4b !important;
        border: 1px solid rgba(99, 102, 241, 0.3) !important;
    }
    
    [data-testid="stSidebar"] input[type="text"]::placeholder {
        color: #9ca3af !important;
    }
    
    /* Radio button labels in sidebar */
    [data-testid="stSidebar"] .stRadio label {
        color: #e0e7ff !important;
    }
    
    .stButton button {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 0.5rem 2rem !important;
        font-weight: 600 !important;
    }
    
    .stButton button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3) !important;
    }
    
    [data-testid="stFileUploader"] {
        background: linear-gradient(135deg, rgba(199, 202, 255, 0.95) 0%, rgba(218, 185, 255, 0.95) 100%) !important;
        border: 2px dashed rgba(99, 102, 241, 0.8) !important;
        border-radius: 15px !important;
        padding: 1.5rem !important;
    }
    
    [data-testid="stFileUploader"] label {
        color: #1e1b4b !important;
        font-weight: 600 !important;
    }
    
    [data-testid="stFileUploader"] * {
        color: #1e1b4b !important;
    }
    
    h1 {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .stSuccess {
        background: rgba(34, 197, 94, 0.1) !important;
        border-left: 4px solid #22c55e !important;
        border-radius: 10px !important;
    }
    
    .stError {
        background: rgba(239, 68, 68, 0.1) !important;
        border-left: 4px solid #ef4444 !important;
        border-radius: 10px !important;
    }
    
    .stInfo {
        background: rgba(59, 130, 246, 0.1) !important;
        border-left: 4px solid #3b82f6 !important;
        border-radius: 10px !important;
    }
</style>
""", unsafe_allow_html=True)

st.title("🤖 Enterprise RAG Agent")
st.markdown("### Powered by Vector, Graph, and Agentic AI")

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []

if "agent" not in st.session_state:
    st.session_state.agent = RAGAgent()

if "session_id" not in st.session_state:
    import uuid
    st.session_state.session_id = str(uuid.uuid4())[:8]

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN TABS: Chat | Graph Explorer
# ═══════════════════════════════════════════════════════════════════════════════
main_tab1, main_tab2 = st.tabs(["💬 Chat", "🕸️ Graph Explorer"])

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 1: CHAT
# ═══════════════════════════════════════════════════════════════════════════════
with main_tab1:
    # NEW SESSION BUTTON (Top of page)
    col1, col2, col3 = st.columns([6, 2, 2])
    with col2:
        # Show conversation count
        conv_count = len(st.session_state.agent.conversation_history)
        if conv_count > 0:
            st.caption(f"💬 {conv_count} exchange(s)")
    with col3:
        if st.button("🔄 New Session", use_container_width=True, type="secondary"):
            # Clear agent's conversation history
            st.session_state.agent.clear_conversation()
            # Clear UI messages
            st.session_state.messages = []
            # Generate new session ID
            import uuid
            st.session_state.session_id = str(uuid.uuid4())[:8]
            st.rerun()

    st.divider()

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 2: GRAPH EXPLORER
# ═══════════════════════════════════════════════════════════════════════════════
with main_tab2:
    from frontend.graph_explorer import render_graph_explorer
    render_graph_explorer()

# ═══════════════════════════════════════════════════════════════════════════════
# CHAT INPUT (Outside tabs to always show)
# ═══════════════════════════════════════════════════════════════════════════════
if prompt := st.chat_input("Ask me anything about your documents..."):
    # Store the prompt and switch to chat tab
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Process and display in main area (will show in Chat tab context)
    with main_tab1:
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    stream = st.session_state.agent.process_query(prompt)
                    response = st.write_stream(stream)
                    st.session_state.messages.append({"role": "assistant", "content": response})
                except Exception as e:
                    st.error(f"An error occurred: {e}")

with st.sidebar:
    st.header("System Status")
    st.success("Flowise API: Connected")
    st.success("Neo4j Graph: Connected")
    st.success("Jina Reranker: Ready")

    st.divider()

    # ═══════════════════════════════════════════════════════════════════════════════
    # SEARCH STORE SELECTION
    # ═══════════════════════════════════════════════════════════════════════════════
    st.header("🔍 Search Settings")
    st.markdown("**Select stores to search:**")

    # Initialize selected stores in session state
    if "search_store_ids" not in st.session_state:
        st.session_state.search_store_ids = []

    # Load available stores
    try:
        available_stores = st.session_state.agent.get_available_stores()

        if available_stores:
            # Create checkboxes for each store
            selected_stores = []
            for store in available_stores:
                store_id = store.get('id', '')
                store_name = store.get('name', 'Unnamed')
                store_status = store.get('status', '')

                # Check if store was previously selected
                is_selected = store_id in st.session_state.search_store_ids

                # Status indicator
                status_icon = "✅" if store_status == "SYNC" else "🔄" if store_status == "SYNCING" else "📦"

                if st.checkbox(
                    f"{status_icon} {store_name}",
                    value=is_selected,
                    key=f"search_store_{store_id}",
                    help=f"ID: {store_id[:12]}..."
                ):
                    selected_stores.append(store_id)

            # Update session state and agent
            st.session_state.search_store_ids = selected_stores
            st.session_state.agent.set_selected_stores(selected_stores)

            # Show selected count
            if selected_stores:
                st.caption(f"✓ Searching in {len(selected_stores)} store(s)")
            else:
                st.caption("⚠️ No stores selected - using default")

        else:
            st.warning("No document stores found")

    except Exception as e:
        st.warning(f"⚠️ Could not load stores: {e}")

    st.divider()

    st.header("Document Ingestion")
    
    ingest_vector = st.checkbox("Ingest to Vector Store (Flowise)", value=True)
    ingest_graph = st.checkbox("Ingest to Knowledge Graph (Neo4j)", value=True)
    
    if ingest_vector:
        st.markdown("**Select Document Store:**")
        
        try:
            from backend.ingestion_service import IngestionService
            temp_ingestor = IngestionService()
            stores = temp_ingestor.list_stores()
            
            store_options = []
            store_map = {}
            
            if stores:
                for store in stores:
                    store_id = store.get('id', '')
                    store_name = store.get('name', 'Unnamed')
                    display_name = f"{store_name} ({store_id[:8]}...)"
                    store_options.append(display_name)
                    store_map[display_name] = store_id
            
            store_options.append("Create New Store")
            
            store_option = st.radio(
                "Choose store",
                store_options,
                label_visibility="collapsed"
            )
            
            if store_option != "Create New Store" and store_option in store_map:
                selected_store_id = store_map[store_option]
            else:
                selected_store_id = None
            
        except Exception as e:
            st.warning(f"⚠️ Could not load stores: {e}")
            store_option = "Default Store"
            selected_store_id = None
        
        if store_option == "Create New Store":
            new_store_name = st.text_input("New Store Name", placeholder="e.g., Legal Documents")
            new_store_desc = st.text_input("Description", placeholder="e.g., Contract analysis")
    
    uploaded_file = st.file_uploader(
        "Upload PDF to Knowledge Base", 
        type=['pdf'],
        help="Upload a PDF document"
    )
    
    if uploaded_file:
        st.info(f"📄 {uploaded_file.name} ({uploaded_file.size / 1024:.1f} KB)")
        
        if st.button("Ingest Document", type="primary", use_container_width=True):
            if not ingest_vector and not ingest_graph:
                st.warning("⚠️ Please select at least one target.")
            else:
                with st.spinner("Processing..."):
                    temp_path = os.path.join("temp", uploaded_file.name)
                    os.makedirs("temp", exist_ok=True)
                    with open(temp_path, "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    
                    if ingest_vector:
                        st.info("📚 Ingesting to Vector Store...")
                        try:
                            from backend.ingestion_service import IngestionService
                            ingestor = IngestionService()
                            
                            if store_option == "Create New Store":
                                if 'new_store_name' in locals() and new_store_name:
                                    result = ingestor.upsert_file(
                                        temp_path,
                                        create_new_store=True,
                                        store_name=new_store_name,
                                        store_desc=new_store_desc if 'new_store_desc' in locals() else ""
                                    )
                                else:
                                    st.error("❌ Please provide a store name")
                                    result = None
                            else:
                                result = ingestor.upsert_file(
                                    temp_path,
                                    store_id=selected_store_id if 'selected_store_id' in locals() else None
                                )
                            
                            if result:
                                st.success(f"✅ Vector Store: Success")
                                with st.expander("📊 Details"):
                                    st.json(result)
                            else:
                                st.error("❌ Vector Store: Failed")
                        except Exception as e:
                            st.error(f"❌ Error: {e}")

                    if ingest_graph:
                        st.info("🕸️ Ingesting to Knowledge Graph...")
                        try:
                            from backend.graph_ingestion_service import GraphIngestionService
                            graph_ingestor = GraphIngestionService()
                            graph_success = graph_ingestor.ingest_document(temp_path)
                            
                            if graph_success:
                                st.success(f"✅ Knowledge Graph: Success")
                            else:
                                st.error("❌ Knowledge Graph: Failed")
                        except Exception as e:
                            st.error(f"❌ Error: {e}")
                    
                    if os.path.exists(temp_path):
                        os.remove(temp_path)

    st.divider()

    # ═══════════════════════════════════════════════════════════════════════════════
    # SESSION INFO
    # ═══════════════════════════════════════════════════════════════════════════════
    st.header("💬 Session Info")

    # Session ID
    st.caption(f"Session ID: `{st.session_state.session_id}`")

    # Conversation history stats
    conv_history = st.session_state.agent.conversation_history
    if conv_history:
        st.info(f"📝 **{len(conv_history)}** conversation exchange(s)")

        with st.expander("View Conversation History"):
            for i, item in enumerate(conv_history, 1):
                st.markdown(f"**Q{i}:** {item.get('question', '')[:100]}...")
                st.markdown(f"**A{i}:** {item.get('answer', '')[:150]}...")
                st.divider()
    else:
        st.caption("No conversation history yet")

    # Clear buttons
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.messages = []
            st.rerun()
    with col2:
        if st.button("🔄 New Session", use_container_width=True, key="sidebar_new_session"):
            st.session_state.agent.clear_conversation()
            st.session_state.messages = []
            import uuid
            st.session_state.session_id = str(uuid.uuid4())[:8]
            st.rerun()

    st.caption("💡 *New Session clears conversation context for follow-up questions*")
