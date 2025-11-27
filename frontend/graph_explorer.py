"""
Graph Explorer Component for Streamlit
Provides CRUD operations for Neo4j Knowledge Graph
"""
import streamlit as st
import pandas as pd
from graph_db.db_utils import Neo4jConnection


def render_graph_explorer():
    """Main function to render the Graph Explorer tab."""

    st.header("🕸️ Knowledge Graph Explorer")
    st.markdown("View, search, create, update and delete nodes and relationships in your Knowledge Graph")

    # Initialize Neo4j connection
    if "neo4j_conn" not in st.session_state:
        st.session_state.neo4j_conn = Neo4jConnection()

    neo4j = st.session_state.neo4j_conn

    # ═══════════════════════════════════════════════════════════════════════════════
    # GRAPH STATISTICS
    # ═══════════════════════════════════════════════════════════════════════════════
    with st.expander("📊 Graph Statistics", expanded=True):
        if st.button("🔄 Refresh Stats", key="refresh_stats"):
            st.rerun()

        stats = neo4j.get_graph_stats()

        if stats:
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Total Nodes", stats.get('total_nodes', 0))
            with col2:
                st.metric("Total Relationships", stats.get('total_relationships', 0))

            col3, col4 = st.columns(2)
            with col3:
                st.markdown("**Node Labels:**")
                labels = stats.get('labels', {})
                for label, count in labels.items():
                    st.caption(f"• {label}: {count}")

            with col4:
                st.markdown("**Relationship Types:**")
                rel_types = stats.get('relationship_types', {})
                for rel_type, count in rel_types.items():
                    st.caption(f"• {rel_type}: {count}")
        else:
            st.warning("Could not load graph statistics. Check Neo4j connection.")

    st.divider()

    # ═══════════════════════════════════════════════════════════════════════════════
    # SUB-TABS FOR DIFFERENT OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════════
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "🔍 Browse Nodes",
        "🔗 Browse Relationships",
        "🧠 Semantic Search",
        "📋 Review New",
        "➕ Create",
        "🗑️ Delete"
    ])

    # ═══════════════════════════════════════════════════════════════════════════════
    # TAB 1: BROWSE NODES
    # ═══════════════════════════════════════════════════════════════════════════════
    with tab1:
        st.subheader("Browse and Search Nodes")

        # Refresh button
        if st.button("🔄 Refresh Node List", key="refresh_nodes"):
            st.session_state.node_page = 0
            st.rerun()

        # Filters
        col1, col2, col3 = st.columns([2, 2, 1])

        with col1:
            # Get available labels - refresh each time
            stats = neo4j.get_graph_stats()
            label_options = stats.get('labels', {})
            labels = ["All"] + sorted(label_options.keys())
            selected_label = st.selectbox(
                f"Filter by Label ({len(label_options)} types)",
                labels,
                key="node_label_filter"
            )

        with col2:
            search_term = st.text_input("Search by ID or Text", key="node_search")

        with col3:
            st.write("")  # Spacer
            st.write("")
            search_btn = st.button("🔍 Search", key="search_nodes")

        # Pagination
        if "node_page" not in st.session_state:
            st.session_state.node_page = 0

        page_size = 20
        skip = st.session_state.node_page * page_size

        # Get nodes
        nodes = neo4j.get_all_nodes(
            label=selected_label if selected_label != "All" else None,
            limit=page_size,
            skip=skip,
            search_term=search_term if search_term else None
        )

        if nodes:
            # Display as table
            df = pd.DataFrame(nodes)
            df['labels'] = df['labels'].apply(lambda x: ', '.join(x) if x else '')

            # Make ID clickable for details
            st.dataframe(
                df[['id', 'labels', 'text']],
                use_container_width=True,
                hide_index=True,
                column_config={
                    "id": st.column_config.TextColumn("Node ID", width="medium"),
                    "labels": st.column_config.TextColumn("Labels", width="small"),
                    "text": st.column_config.TextColumn("Text", width="large"),
                }
            )

            # Pagination controls
            col1, col2, col3 = st.columns([1, 2, 1])
            with col1:
                if st.button("⬅️ Previous", disabled=st.session_state.node_page == 0):
                    st.session_state.node_page -= 1
                    st.rerun()
            with col2:
                st.caption(f"Page {st.session_state.node_page + 1} • Showing {len(nodes)} nodes")
            with col3:
                if st.button("➡️ Next", disabled=len(nodes) < page_size):
                    st.session_state.node_page += 1
                    st.rerun()

            # Node detail viewer
            st.divider()
            st.markdown("### 📋 Node Details")
            selected_node_id = st.selectbox(
                "Select a node to view details",
                options=[n['id'] for n in nodes],
                key="node_detail_select"
            )

            if selected_node_id:
                node_detail = neo4j.get_node_by_id(selected_node_id)
                if node_detail:
                    col1, col2 = st.columns(2)

                    with col1:
                        st.markdown(f"**ID:** `{node_detail['id']}`")
                        st.markdown(f"**Labels:** {', '.join(node_detail['labels'])}")
                        st.markdown(f"**Has Embedding:** {'✅' if node_detail.get('has_embedding') else '❌'}")

                    with col2:
                        st.markdown(f"**Text:**")
                        st.info(node_detail.get('text', 'N/A'))

                    # Show relationships
                    if node_detail.get('relationships'):
                        st.markdown("**Relationships:**")
                        for rel in node_detail['relationships']:
                            direction = "→" if rel['direction'] == 'outgoing' else "←"
                            st.caption(f"  {direction} **{rel['relationship']}** → {rel['connected_id']}")

                    # Edit node
                    st.divider()
                    st.markdown("### ✏️ Edit Node")
                    with st.form(key="edit_node_form"):
                        new_text = st.text_area("New Text", value=node_detail.get('text', ''))
                        submit_edit = st.form_submit_button("💾 Update Node")

                        if submit_edit:
                            success, msg = neo4j.update_node(selected_node_id, new_text=new_text)
                            if success:
                                st.success(msg)
                                st.rerun()
                            else:
                                st.error(msg)
        else:
            st.info("No nodes found. Try adjusting your filters or add some nodes.")

    # ═══════════════════════════════════════════════════════════════════════════════
    # TAB 2: BROWSE RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════════════════════════
    with tab2:
        st.subheader("Browse Relationships")

        # Pagination
        if "rel_page" not in st.session_state:
            st.session_state.rel_page = 0

        page_size = 20
        skip = st.session_state.rel_page * page_size

        relationships = neo4j.get_all_relationships(limit=page_size, skip=skip)

        if relationships:
            # Display as table
            df = pd.DataFrame(relationships)
            df['source_labels'] = df['source_labels'].apply(lambda x: ', '.join(x) if x else '')
            df['target_labels'] = df['target_labels'].apply(lambda x: ', '.join(x) if x else '')

            st.dataframe(
                df[['source_id', 'relationship', 'target_id', 'source_labels', 'target_labels']],
                use_container_width=True,
                hide_index=True,
                column_config={
                    "source_id": st.column_config.TextColumn("Source", width="medium"),
                    "relationship": st.column_config.TextColumn("Relationship", width="medium"),
                    "target_id": st.column_config.TextColumn("Target", width="medium"),
                    "source_labels": st.column_config.TextColumn("Source Labels", width="small"),
                    "target_labels": st.column_config.TextColumn("Target Labels", width="small"),
                }
            )

            # Pagination controls
            col1, col2, col3 = st.columns([1, 2, 1])
            with col1:
                if st.button("⬅️ Previous", key="rel_prev", disabled=st.session_state.rel_page == 0):
                    st.session_state.rel_page -= 1
                    st.rerun()
            with col2:
                st.caption(f"Page {st.session_state.rel_page + 1} • Showing {len(relationships)} relationships")
            with col3:
                if st.button("➡️ Next", key="rel_next", disabled=len(relationships) < page_size):
                    st.session_state.rel_page += 1
                    st.rerun()
        else:
            st.info("No relationships found.")

    # ═══════════════════════════════════════════════════════════════════════════════
    # TAB 3: SEMANTIC SEARCH
    # ═══════════════════════════════════════════════════════════════════════════════
    with tab3:
        st.subheader("Semantic Search (Embedding-based)")
        st.markdown("Find similar nodes using vector embeddings. This searches by meaning, not just keywords.")

        # Search input
        col1, col2 = st.columns([4, 1])
        with col1:
            semantic_query = st.text_input(
                "Enter your search query",
                placeholder="e.g., What are the regulations about banking?",
                key="semantic_search_query"
            )
        with col2:
            top_k = st.number_input("Results", min_value=1, max_value=50, value=10, key="semantic_top_k")

        # Advanced options
        with st.expander("⚙️ Advanced Options"):
            min_score = st.slider(
                "Minimum Similarity Score",
                min_value=0.0,
                max_value=1.0,
                value=0.3,
                step=0.05,
                help="Only show results with similarity score above this threshold"
            )
            show_relationships = st.checkbox("Show relationships for each result", value=True)

        # Search button
        if st.button("🔎 Search", key="semantic_search_btn", type="primary", use_container_width=True):
            if not semantic_query:
                st.warning("Please enter a search query")
            else:
                with st.spinner("Searching with embeddings..."):
                    # Perform vector search
                    results = neo4j.vector_search(semantic_query, top_k=int(top_k))

                    # Filter by minimum score
                    results = [r for r in results if r.get('score', 0) >= min_score]

                    # Store results in session state
                    st.session_state.semantic_results = results
                    st.session_state.semantic_query_text = semantic_query

        # Display results
        if "semantic_results" in st.session_state and st.session_state.semantic_results:
            results = st.session_state.semantic_results
            query_text = st.session_state.get("semantic_query_text", "")

            st.success(f"Found {len(results)} similar nodes for: \"{query_text}\"")
            st.divider()

            for i, result in enumerate(results, 1):
                score = result.get('score', 0)
                node_id = result.get('node_id', 'Unknown')
                labels = result.get('labels', [])
                node_text = result.get('node_text', result.get('text', 'N/A'))
                relationships = result.get('relationships', [])

                # Score color based on similarity
                if score >= 0.8:
                    score_color = "🟢"
                elif score >= 0.6:
                    score_color = "🟡"
                else:
                    score_color = "🟠"

                # Result card
                with st.container():
                    # Header with score
                    col1, col2 = st.columns([4, 1])
                    with col1:
                        st.markdown(f"**#{i} [{', '.join(labels)}] {node_id}**")
                    with col2:
                        st.markdown(f"{score_color} **{score:.3f}**")

                    # Progress bar for score visualization
                    st.progress(score, text=f"Similarity: {score*100:.1f}%")

                    # Node text
                    st.info(node_text[:500] + "..." if len(str(node_text)) > 500 else node_text)

                    # Relationships
                    if show_relationships and relationships:
                        with st.expander(f"🔗 {len(relationships)} Relationship(s)"):
                            for rel in relationships[:10]:  # Limit to 10
                                rel_type = rel.get('relationship', 'UNKNOWN')
                                direction = rel.get('direction', 'unknown')
                                connected_id = rel.get('connected_node', 'Unknown')
                                connected_text = rel.get('connected_text', '')

                                arrow = "→" if direction == 'outgoing' else "←"
                                st.caption(f"{arrow} **{rel_type}** → {connected_id}")
                                if connected_text:
                                    st.caption(f"   _{connected_text[:100]}..._" if len(str(connected_text)) > 100 else f"   _{connected_text}_")

                    st.divider()

            # Export results option
            if st.button("📥 Export Results as CSV", key="export_semantic"):
                export_data = []
                for r in results:
                    export_data.append({
                        'node_id': r.get('node_id', ''),
                        'labels': ', '.join(r.get('labels', [])),
                        'score': r.get('score', 0),
                        'text': r.get('node_text', r.get('text', '')),
                        'relationships_count': r.get('relationships_count', 0)
                    })
                df_export = pd.DataFrame(export_data)
                csv = df_export.to_csv(index=False)
                st.download_button(
                    label="💾 Download CSV",
                    data=csv,
                    file_name=f"semantic_search_{query_text[:20].replace(' ', '_')}.csv",
                    mime="text/csv"
                )

        elif "semantic_results" in st.session_state and not st.session_state.semantic_results:
            st.info("No similar nodes found. Try adjusting your query or lowering the minimum score threshold.")

    # ═══════════════════════════════════════════════════════════════════════════════
    # TAB 4: REVIEW NEW NODES/RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════════════════════════
    with tab4:
        st.subheader("Review New Nodes & Relationships")
        st.markdown("Review and approve/reject newly ingested entities to maintain graph quality.")

        # Review statistics
        review_stats = neo4j.get_review_stats()
        if review_stats:
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                node_new = review_stats.get('nodes', {}).get('new', 0)
                st.metric("🆕 New Nodes", node_new)
            with col2:
                node_approved = review_stats.get('nodes', {}).get('approved', 0)
                st.metric("✅ Approved Nodes", node_approved)
            with col3:
                rel_new = review_stats.get('relationships', {}).get('new', 0)
                st.metric("🆕 New Relationships", rel_new)
            with col4:
                rel_approved = review_stats.get('relationships', {}).get('approved', 0)
                st.metric("✅ Approved Rels", rel_approved)

        st.divider()

        # Quick actions
        col1, col2, col3 = st.columns([2, 2, 1])
        with col1:
            if st.button("✅ Approve All New", key="approve_all_btn", type="primary"):
                success, msg = neo4j.approve_all_new()
                if success:
                    st.success(msg)
                    st.rerun()
                else:
                    st.error(msg)
        with col2:
            if st.button("🔄 Refresh Review List", key="refresh_review"):
                st.rerun()

        st.divider()

        # Sub-tabs for nodes vs relationships
        review_tab1, review_tab2 = st.tabs(["📦 New Nodes", "🔗 New Relationships"])

        # ─────────────────────────────────────────────────────────────────────────
        # REVIEW NEW NODES
        # ─────────────────────────────────────────────────────────────────────────
        with review_tab1:
            pending_nodes = neo4j.get_pending_review_nodes(limit=50)

            if pending_nodes:
                st.info(f"Found {len(pending_nodes)} node(s) pending review")

                # Select all checkbox
                if "selected_nodes" not in st.session_state:
                    st.session_state.selected_nodes = []

                # Display nodes with checkboxes
                for i, node in enumerate(pending_nodes):
                    node_id = node.get('id', 'Unknown')
                    labels = node.get('labels', [])
                    text = node.get('text', 'N/A')
                    source_file = node.get('source_file', 'Unknown')
                    created_at = node.get('created_at', 'Unknown')

                    with st.container():
                        col1, col2, col3, col4 = st.columns([0.5, 3, 1, 1])

                        with col1:
                            selected = st.checkbox("", key=f"select_node_{i}", value=node_id in st.session_state.selected_nodes)
                            if selected and node_id not in st.session_state.selected_nodes:
                                st.session_state.selected_nodes.append(node_id)
                            elif not selected and node_id in st.session_state.selected_nodes:
                                st.session_state.selected_nodes.remove(node_id)

                        with col2:
                            st.markdown(f"**[{', '.join(labels)}] {node_id}**")
                            st.caption(f"📄 {source_file} | 🕐 {created_at[:19] if created_at and len(created_at) > 19 else created_at}")
                            if text:
                                st.caption(f"_{text[:150]}..._" if len(str(text)) > 150 else f"_{text}_")

                        with col3:
                            if st.button("✅", key=f"approve_node_{i}", help="Approve this node"):
                                success, msg = neo4j.approve_node(node_id)
                                if success:
                                    st.success(f"Approved: {node_id}")
                                    st.rerun()
                                else:
                                    st.error(msg)

                        with col4:
                            if st.button("🗑️", key=f"reject_node_{i}", help="Reject and delete this node"):
                                success, msg = neo4j.reject_node(node_id)
                                if success:
                                    st.warning(f"Deleted: {node_id}")
                                    st.rerun()
                                else:
                                    st.error(msg)

                        st.divider()

                # Bulk actions
                if st.session_state.selected_nodes:
                    st.markdown(f"**Selected: {len(st.session_state.selected_nodes)} node(s)**")
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button("✅ Approve Selected", key="bulk_approve_nodes"):
                            success, msg = neo4j.bulk_approve_nodes(st.session_state.selected_nodes)
                            if success:
                                st.success(msg)
                                st.session_state.selected_nodes = []
                                st.rerun()
                            else:
                                st.error(msg)
                    with col2:
                        if st.button("🗑️ Reject Selected", key="bulk_reject_nodes"):
                            success, msg = neo4j.bulk_reject_nodes(st.session_state.selected_nodes)
                            if success:
                                st.warning(msg)
                                st.session_state.selected_nodes = []
                                st.rerun()
                            else:
                                st.error(msg)
            else:
                st.success("🎉 No new nodes pending review!")

        # ─────────────────────────────────────────────────────────────────────────
        # REVIEW NEW RELATIONSHIPS
        # ─────────────────────────────────────────────────────────────────────────
        with review_tab2:
            pending_rels = neo4j.get_pending_review_relationships(limit=50)

            if pending_rels:
                st.info(f"Found {len(pending_rels)} relationship(s) pending review")

                for i, rel in enumerate(pending_rels):
                    source_id = rel.get('source_id', 'Unknown')
                    target_id = rel.get('target_id', 'Unknown')
                    rel_type = rel.get('relationship', 'UNKNOWN')
                    source_file = rel.get('source_file', 'Unknown')
                    created_at = rel.get('created_at', 'Unknown')

                    with st.container():
                        col1, col2, col3, col4 = st.columns([3, 1, 0.5, 0.5])

                        with col1:
                            st.markdown(f"**{source_id}** → `{rel_type}` → **{target_id}**")
                            st.caption(f"📄 {source_file} | 🕐 {created_at[:19] if created_at and len(created_at) > 19 else created_at}")

                        with col3:
                            if st.button("✅", key=f"approve_rel_{i}", help="Approve"):
                                success, msg = neo4j.approve_relationship(source_id, target_id, rel_type)
                                if success:
                                    st.success(f"Approved: {rel_type}")
                                    st.rerun()
                                else:
                                    st.error(msg)

                        with col4:
                            if st.button("🗑️", key=f"reject_rel_{i}", help="Reject"):
                                success, msg = neo4j.reject_relationship(source_id, target_id, rel_type)
                                if success:
                                    st.warning(f"Deleted: {rel_type}")
                                    st.rerun()
                                else:
                                    st.error(msg)

                        st.divider()
            else:
                st.success("🎉 No new relationships pending review!")

    # ═══════════════════════════════════════════════════════════════════════════════
    # TAB 5: CREATE
    # ═══════════════════════════════════════════════════════════════════════════════
    with tab5:
        st.subheader("Create New Node or Relationship")

        create_type = st.radio("What do you want to create?", ["Node", "Relationship"], horizontal=True)

        if create_type == "Node":
            st.markdown("### ➕ Create New Node")

            with st.form(key="create_node_form"):
                col1, col2 = st.columns(2)

                with col1:
                    node_id = st.text_input("Node ID *", placeholder="e.g., Central Bank of Vietnam")
                    node_label = st.text_input("Label *", placeholder="e.g., Organization")

                with col2:
                    node_text = st.text_area("Text/Description *", placeholder="Description of this entity...")

                st.caption("* Required fields")
                submit_node = st.form_submit_button("➕ Create Node", type="primary")

                if submit_node:
                    if not node_id or not node_label or not node_text:
                        st.error("Please fill in all required fields")
                    else:
                        success, msg = neo4j.create_node(node_id, node_label, node_text)
                        if success:
                            st.success(msg)
                            st.balloons()
                            st.info("💡 Click 'Browse Nodes' tab and press 'Refresh' to see the new node")
                        else:
                            st.error(msg)

        else:  # Relationship
            st.markdown("### 🔗 Create New Relationship")

            with st.form(key="create_rel_form"):
                col1, col2, col3 = st.columns(3)

                with col1:
                    source_id = st.text_input("Source Node ID *", placeholder="e.g., Node A")

                with col2:
                    rel_type = st.text_input("Relationship Type *", placeholder="e.g., BELONGS_TO")

                with col3:
                    target_id = st.text_input("Target Node ID *", placeholder="e.g., Node B")

                st.caption("* Required fields. Relationship type will be converted to UPPERCASE_WITH_UNDERSCORES")
                submit_rel = st.form_submit_button("🔗 Create Relationship", type="primary")

                if submit_rel:
                    if not source_id or not rel_type or not target_id:
                        st.error("Please fill in all required fields")
                    else:
                        success, msg = neo4j.create_relationship(source_id, target_id, rel_type)
                        if success:
                            st.success(msg)
                            st.balloons()
                        else:
                            st.error(msg)

    # ═══════════════════════════════════════════════════════════════════════════════
    # TAB 6: DELETE
    # ═══════════════════════════════════════════════════════════════════════════════
    with tab6:
        st.subheader("Delete Node or Relationship")
        st.warning("⚠️ Deletion is permanent and cannot be undone!")

        delete_type = st.radio("What do you want to delete?", ["Node", "Relationship"], horizontal=True, key="delete_type")

        if delete_type == "Node":
            st.markdown("### 🗑️ Delete Node")
            st.caption("Deleting a node will also delete all its relationships.")

            with st.form(key="delete_node_form"):
                delete_node_id = st.text_input("Node ID to delete", placeholder="e.g., Old Node")

                # Confirmation
                confirm = st.checkbox("I understand this action is permanent")

                submit_delete = st.form_submit_button("🗑️ Delete Node", type="primary")

                if submit_delete:
                    if not delete_node_id:
                        st.error("Please enter a Node ID")
                    elif not confirm:
                        st.error("Please confirm the deletion")
                    else:
                        success, msg = neo4j.delete_node(delete_node_id)
                        if success:
                            st.success(msg)
                        else:
                            st.error(msg)

        else:  # Relationship
            st.markdown("### 🗑️ Delete Relationship")

            with st.form(key="delete_rel_form"):
                col1, col2, col3 = st.columns(3)

                with col1:
                    del_source_id = st.text_input("Source Node ID", placeholder="e.g., Node A")

                with col2:
                    del_rel_type = st.text_input("Relationship Type (optional)", placeholder="e.g., BELONGS_TO")

                with col3:
                    del_target_id = st.text_input("Target Node ID", placeholder="e.g., Node B")

                st.caption("If relationship type is empty, ALL relationships between the two nodes will be deleted.")

                # Confirmation
                confirm_rel = st.checkbox("I understand this action is permanent", key="confirm_rel_delete")

                submit_del_rel = st.form_submit_button("🗑️ Delete Relationship", type="primary")

                if submit_del_rel:
                    if not del_source_id or not del_target_id:
                        st.error("Please enter both Source and Target Node IDs")
                    elif not confirm_rel:
                        st.error("Please confirm the deletion")
                    else:
                        success, msg = neo4j.delete_relationship(
                            del_source_id,
                            del_target_id,
                            del_rel_type if del_rel_type else None
                        )
                        if success:
                            st.success(msg)
                        else:
                            st.error(msg)


def render_node_explorer(neo4j, node_id):
    """Render detailed view and neighborhood of a specific node."""
    st.subheader(f"🔍 Exploring: {node_id}")

    node = neo4j.get_node_by_id(node_id)
    if not node:
        st.error(f"Node '{node_id}' not found")
        return

    # Node info
    col1, col2 = st.columns(2)
    with col1:
        st.markdown(f"**Labels:** {', '.join(node['labels'])}")
        st.markdown(f"**Has Embedding:** {'✅' if node.get('has_embedding') else '❌'}")
    with col2:
        st.markdown(f"**Text:** {node.get('text', 'N/A')}")

    # Get neighbors
    st.divider()
    depth = st.slider("Exploration Depth", 1, 3, 1)

    neighbors = neo4j.get_node_neighbors(node_id, depth=depth)

    if neighbors['nodes']:
        st.markdown(f"**Found {len(neighbors['nodes'])} connected nodes:**")

        for n in neighbors['nodes']:
            if n['id'] != node_id:
                st.caption(f"• [{', '.join(n['labels'])}] **{n['id']}**: {n['text'][:100] if n['text'] else 'N/A'}...")
    else:
        st.info("No connected nodes found.")
