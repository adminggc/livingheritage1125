import os
import sys
import time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.flowise_service import FlowiseService
from backend.reranker_service import RerankerService
from graph_db.db_utils import Neo4jConnection
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.config import GOOGLE_API_KEY


# ═══════════════════════════════════════════════════════════════════════════════
# Beautiful Console Logging Utilities
# ═══════════════════════════════════════════════════════════════════════════════

class ConsoleLogger:
    """Beautiful console logger for RAG pipeline steps."""

    # Colors
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

    # Box drawing characters
    BOX_TL = '╔'
    BOX_TR = '╗'
    BOX_BL = '╚'
    BOX_BR = '╝'
    BOX_H = '═'
    BOX_V = '║'
    BOX_L = '╠'
    BOX_R = '╣'

    @staticmethod
    def header(title, emoji="🔍"):
        """Print a beautiful header box."""
        width = 70
        print()
        print(f"{ConsoleLogger.CYAN}{ConsoleLogger.BOX_TL}{ConsoleLogger.BOX_H * (width-2)}{ConsoleLogger.BOX_TR}{ConsoleLogger.RESET}")
        print(f"{ConsoleLogger.CYAN}{ConsoleLogger.BOX_V}{ConsoleLogger.RESET} {emoji} {ConsoleLogger.BOLD}{title.center(width-6)}{ConsoleLogger.RESET} {ConsoleLogger.CYAN}{ConsoleLogger.BOX_V}{ConsoleLogger.RESET}")
        print(f"{ConsoleLogger.CYAN}{ConsoleLogger.BOX_BL}{ConsoleLogger.BOX_H * (width-2)}{ConsoleLogger.BOX_BR}{ConsoleLogger.RESET}")

    @staticmethod
    def step(step_num, total, title, emoji="📌"):
        """Print a step header."""
        print()
        print(f"{ConsoleLogger.YELLOW}{ConsoleLogger.BOLD}{'─' * 60}{ConsoleLogger.RESET}")
        print(f"{ConsoleLogger.YELLOW}{ConsoleLogger.BOLD}{emoji} STEP {step_num}/{total}: {title.upper()}{ConsoleLogger.RESET}")
        print(f"{ConsoleLogger.YELLOW}{'─' * 60}{ConsoleLogger.RESET}")

    @staticmethod
    def substep(title, emoji="→"):
        """Print a substep."""
        print(f"  {ConsoleLogger.CYAN}{emoji}{ConsoleLogger.RESET} {title}")

    @staticmethod
    def result(label, value, emoji="•"):
        """Print a result line."""
        print(f"    {ConsoleLogger.GREEN}{emoji}{ConsoleLogger.RESET} {ConsoleLogger.DIM}{label}:{ConsoleLogger.RESET} {value}")

    @staticmethod
    def info(message, emoji="ℹ️"):
        """Print an info message."""
        print(f"  {emoji}  {ConsoleLogger.DIM}{message}{ConsoleLogger.RESET}")

    @staticmethod
    def success(message, emoji="✅"):
        """Print a success message."""
        print(f"  {emoji} {ConsoleLogger.GREEN}{message}{ConsoleLogger.RESET}")

    @staticmethod
    def warning(message, emoji="⚠️"):
        """Print a warning message."""
        print(f"  {emoji}  {ConsoleLogger.YELLOW}{message}{ConsoleLogger.RESET}")

    @staticmethod
    def error(message, emoji="❌"):
        """Print an error message."""
        print(f"  {emoji} {ConsoleLogger.RED}{message}{ConsoleLogger.RESET}")

    @staticmethod
    def document(index, content, score=None, doc_type="doc"):
        """Print a document preview."""
        preview = str(content)[:200].replace('\n', ' ').strip()
        if len(str(content)) > 200:
            preview += "..."

        if score is not None:
            score_bar = ConsoleLogger._score_bar(score)
            print(f"    {ConsoleLogger.BLUE}[{doc_type.upper()} {index}]{ConsoleLogger.RESET} {score_bar} {ConsoleLogger.DIM}score: {score:.3f}{ConsoleLogger.RESET}")
        else:
            print(f"    {ConsoleLogger.BLUE}[{doc_type.upper()} {index}]{ConsoleLogger.RESET}")

        # Wrap text nicely
        wrapped = ConsoleLogger._wrap_text(preview, 60)
        for line in wrapped:
            print(f"      {ConsoleLogger.DIM}{line}{ConsoleLogger.RESET}")

    @staticmethod
    def _score_bar(score, width=10):
        """Create a visual score bar."""
        filled = int(score * width)
        empty = width - filled
        if score >= 0.7:
            color = ConsoleLogger.GREEN
        elif score >= 0.4:
            color = ConsoleLogger.YELLOW
        else:
            color = ConsoleLogger.RED
        return f"{color}{'█' * filled}{'░' * empty}{ConsoleLogger.RESET}"

    @staticmethod
    def _wrap_text(text, width):
        """Wrap text to specified width."""
        words = text.split()
        lines = []
        current_line = []
        current_length = 0

        for word in words:
            if current_length + len(word) + 1 <= width:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_length = len(word)

        if current_line:
            lines.append(' '.join(current_line))

        return lines[:3]  # Max 3 lines

    @staticmethod
    def stats_box(stats_dict):
        """Print a stats box."""
        print(f"  {ConsoleLogger.CYAN}┌{'─' * 40}┐{ConsoleLogger.RESET}")
        for key, value in stats_dict.items():
            line = f"  {key}: {value}"
            padding = 38 - len(line)
            print(f"  {ConsoleLogger.CYAN}│{ConsoleLogger.RESET}{line}{' ' * padding}{ConsoleLogger.CYAN}│{ConsoleLogger.RESET}")
        print(f"  {ConsoleLogger.CYAN}└{'─' * 40}┘{ConsoleLogger.RESET}")

    @staticmethod
    def divider(char="─", width=60):
        """Print a divider line."""
        print(f"  {ConsoleLogger.DIM}{char * width}{ConsoleLogger.RESET}")

    @staticmethod
    def timer_start():
        """Start a timer."""
        return time.time()

    @staticmethod
    def timer_end(start_time, label=""):
        """End timer and print elapsed time."""
        elapsed = time.time() - start_time
        print(f"  {ConsoleLogger.DIM}⏱️  {label} completed in {elapsed:.2f}s{ConsoleLogger.RESET}")
        return elapsed


log = ConsoleLogger()


class RAGAgent:
    def __init__(self):
        self.flowise = FlowiseService()
        self.reranker = RerankerService()
        self.neo4j = Neo4jConnection()

        # Conversation history for context
        self.conversation_history = []

        # Selected store IDs for vector search (empty = use default from config)
        self.selected_store_ids = []

        # Initialize LLM for synthesis (Agentic part)
        if GOOGLE_API_KEY:
            self.llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GOOGLE_API_KEY)
        else:
            print("Warning: GOOGLE_API_KEY not found. Agentic synthesis might fail or need local LLM fallback.")
            self.llm = None

    def set_selected_stores(self, store_ids):
        """Set the document stores to search from."""
        self.selected_store_ids = store_ids if store_ids else []
        if store_ids:
            log.info(f"Vector search will query {len(store_ids)} store(s)")
        else:
            log.info("Vector search will use default store from config")

    def get_available_stores(self):
        """Get list of available document stores from Flowise."""
        return self.flowise.list_document_stores()

    def clear_conversation(self):
        """Clear conversation history to start a fresh session."""
        self.conversation_history = []
        log.success("Conversation history cleared - Starting fresh session")

    def _build_contextual_query(self, query):
        """
        Build an enriched query by extracting key terms from conversation history.

        Strategy:
        - Extract important nouns/entities from previous Q&A
        - Append only key terms (not full sentences) to avoid noise
        - Keep query focused for better vector search results
        """
        if not self.conversation_history:
            return query

        # Get last 2 Q&A pairs (most recent context)
        recent_history = self.conversation_history[-2:]

        # Extract key terms from previous conversations
        key_terms = set()

        for item in recent_history:
            prev_question = item.get('question', '')
            prev_answer = item.get('answer', '')

            # Extract potential entities/keywords from previous question
            # Split by common delimiters and filter short words
            for text in [prev_question, prev_answer[:300]]:  # Limit answer to 300 chars
                words = text.replace(',', ' ').replace('.', ' ').replace(':', ' ').split()
                for word in words:
                    # Keep words that look like entities (capitalized, longer than 3 chars)
                    # or important Vietnamese/English terms
                    word_clean = word.strip()
                    if len(word_clean) > 3:
                        # Check if it's a potential entity (capitalized or contains uppercase)
                        if any(c.isupper() for c in word_clean) or word_clean[0].isupper():
                            key_terms.add(word_clean)
                        # Also keep longer words that might be important
                        elif len(word_clean) > 6:
                            key_terms.add(word_clean)

        # Limit to top 5 most relevant terms (by length, as proxy for importance)
        sorted_terms = sorted(key_terms, key=len, reverse=True)[:5]

        if not sorted_terms:
            return query

        # Build enriched query: original query + key context terms
        context_terms = ' '.join(sorted_terms)
        enriched_query = f"{query} {context_terms}"

        return enriched_query

    def _get_previous_topics(self):
        """
        Get main topics from previous conversations for display.
        """
        if not self.conversation_history:
            return []

        topics = []
        for item in self.conversation_history[-3:]:
            q = item.get('question', '')[:50]
            topics.append(q)
        return topics

    def _build_conversation_summary_query(self, query):
        """
        Build a query that combines current question with a summary of previous Q&A.
        This is specifically designed for vector search which benefits from natural language context.

        Strategy:
        - Create a brief summary sentence from previous Q&A
        - Combine with current query in natural language format
        - Better for semantic search in document stores
        """
        if not self.conversation_history:
            return None

        # Get last Q&A pair (most relevant)
        last_exchange = self.conversation_history[-1]
        prev_question = last_exchange.get('question', '')
        prev_answer = last_exchange.get('answer', '')

        # Extract key info from previous answer (first 150 chars - usually contains main point)
        answer_summary = prev_answer[:150].strip()
        if len(prev_answer) > 150:
            # Try to cut at sentence boundary
            last_period = answer_summary.rfind('.')
            if last_period > 50:
                answer_summary = answer_summary[:last_period + 1]

        # Build natural language summary query
        # Format: "Given that [previous context], [current question]"
        summary_query = f"Context: {prev_question[:80]} - {answer_summary} | Question: {query}"

        return summary_query

    def _build_follow_up_query(self, query):
        """
        Build a query specifically for follow-up questions.
        Detects if current query is a follow-up and enriches accordingly.
        """
        if not self.conversation_history:
            return None

        # Common follow-up patterns (English and Vietnamese)
        follow_up_patterns = [
            'tell me more', 'explain', 'what about', 'how about',
            'chi tiết', 'giải thích', 'cụ thể', 'thêm về', 'còn gì',
            'ngoài ra', 'ví dụ', 'example', 'more detail', 'elaborate'
        ]

        query_lower = query.lower()
        is_follow_up = any(pattern in query_lower for pattern in follow_up_patterns)

        if not is_follow_up:
            return None

        # For follow-up questions, combine with previous Q&A topic
        last_exchange = self.conversation_history[-1]
        prev_question = last_exchange.get('question', '')

        # Extract main topic from previous question
        return f"{query} về {prev_question[:100]}"

    def _get_conversation_context_for_prompt(self):
        """
        Get formatted conversation history for the synthesis prompt.
        """
        if not self.conversation_history:
            return ""

        # Get last 3 exchanges
        recent = self.conversation_history[-3:]

        lines = ["Previous conversation:"]
        for i, item in enumerate(recent, 1):
            lines.append(f"User: {item.get('question', '')[:150]}")
            lines.append(f"Assistant: {item.get('answer', '')[:300]}")
            lines.append("")

        return "\n".join(lines)

    def _extract_graph_context(self, graph_results):
        """
        Extract keywords, entities, and context from graph search results
        to enhance the vector search query.

        Returns:
            dict with:
                - keywords: list of key terms from nodes and relationships
                - entities: list of node IDs and connected node IDs
                - context_summary: brief text summary of graph knowledge
        """
        keywords = set()
        entities = set()
        context_parts = []

        for result in graph_results:
            # Extract node ID as entity
            node_id = result.get('node_id', '')
            if node_id:
                entities.add(node_id)
                # Extract words from node ID (often contains key terms)
                keywords.update(node_id.replace('_', ' ').replace('-', ' ').split())

            # Extract labels as keywords
            labels = result.get('labels', [])
            keywords.update(labels)

            # Extract key terms from node text
            node_text = result.get('node_text', '')
            if node_text:
                # Add short context
                context_parts.append(node_text[:200])

            # Extract from relationships
            relationships = result.get('relationships', [])
            for rel in relationships:
                # Relationship type as keyword
                rel_type = rel.get('relationship', '')
                if rel_type:
                    keywords.add(rel_type.replace('_', ' '))

                # Connected node as entity
                connected_node = rel.get('connected_node', '')
                if connected_node:
                    entities.add(connected_node)
                    keywords.update(connected_node.replace('_', ' ').replace('-', ' ').split())

                # Connected text for context
                connected_text = rel.get('connected_text', '')
                if connected_text:
                    context_parts.append(connected_text[:100])

        # Clean up keywords (remove very short ones and common words)
        stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with'}
        keywords = {k.lower() for k in keywords if len(k) > 2 and k.lower() not in stop_words}

        return {
            'keywords': list(keywords)[:15],  # Limit to top 15 keywords
            'entities': list(entities)[:10],   # Limit to top 10 entities
            'context_summary': ' | '.join(context_parts[:5])  # Brief context from top 5 parts
        }

    def _build_enhanced_query(self, original_query, graph_context):
        """
        Build a cleaner enhanced query - just append top entities.
        Keep it simple to avoid confusing the vector search.
        """
        entities = graph_context.get('entities', [])

        if not entities:
            return original_query

        # Only add top 3 most relevant entities to keep query focused
        top_entities = entities[:3]
        return f"{original_query} {' '.join(top_entities)}"

    def _build_entity_query(self, graph_context):
        """
        Build a separate entity-focused query for retrieving related documents.
        """
        entities = graph_context.get('entities', [])
        keywords = graph_context.get('keywords', [])

        if not entities and not keywords:
            return None

        # Combine entities and top keywords for a focused retrieval
        query_parts = list(entities[:5])  # Top 5 entities
        query_parts.extend(keywords[:3])   # Top 3 keywords

        return ' '.join(query_parts) if query_parts else None

    def process_query(self, query):
        # ══════════════════════════════════════════════════════════════════════
        # HEADER
        # ══════════════════════════════════════════════════════════════════════
        log.header(f"RAG PIPELINE - Processing Query", "🚀")
        log.info(f"Query: \"{query}\"")

        # Show conversation context if available
        if self.conversation_history:
            log.info(f"Conversation context: {len(self.conversation_history)} previous exchange(s)")
            log.divider()
            log.substep("Previous conversations:")
            for i, item in enumerate(self.conversation_history[-2:], 1):  # Last 2
                prev_q = item.get('question', '')[:80]
                log.result(f"Q{i}", prev_q + ("..." if len(item.get('question', '')) > 80 else ""))

        pipeline_start = log.timer_start()

        # Build contextual query (extract key terms from conversation history)
        contextual_query = self._build_contextual_query(query)

        # Show what key terms were extracted
        if contextual_query != query:
            extracted_terms = contextual_query.replace(query, '').strip()
            log.substep(f"Key terms extracted from history:")
            log.result("Added to query", f"\"{extracted_terms}\"")

        # ══════════════════════════════════════════════════════════════════════
        # STEP 1: GRAPH SEARCH
        # ══════════════════════════════════════════════════════════════════════
        log.step(1, 4, "Knowledge Graph Search", "🕸️")
        step1_start = log.timer_start()

        # Show if using contextual query
        if contextual_query != query:
            log.info("Using conversation-enriched query for search")

        # Use contextual query for better results on follow-up questions
        graph_results = self.neo4j.vector_search(contextual_query, top_k=5)

        log.substep(f"Vector similarity search in Neo4j")
        log.result("Nodes found", f"{len(graph_results)} graph nodes")

        if graph_results:
            log.divider()
            log.substep("Top matching nodes:")
            for i, result in enumerate(graph_results[:3], 1):
                score = result.get('score', 0)
                labels = result.get('labels', [])
                node_id = result.get('node_id', 'Unknown')
                content = result.get('text', '')
                log.document(i, f"[{', '.join(labels)}] {node_id}: {content}", score, "NODE")

        # Extract context from graph results
        graph_context = self._extract_graph_context(graph_results)

        if graph_context['entities'] or graph_context['keywords']:
            log.divider()
            log.substep("Extracted knowledge context:")
            log.result("Entities", f"{len(graph_context['entities'])} → {', '.join(graph_context['entities'][:5])}{'...' if len(graph_context['entities']) > 5 else ''}")
            log.result("Keywords", f"{len(graph_context['keywords'])} → {', '.join(graph_context['keywords'][:5])}{'...' if len(graph_context['keywords']) > 5 else ''}")

        log.timer_end(step1_start, "Graph Search")

        # Build enhanced queries
        enhanced_query = self._build_enhanced_query(query, graph_context)
        entity_query = self._build_entity_query(graph_context)

        # ══════════════════════════════════════════════════════════════════════
        # STEP 2: VECTOR SEARCH (Graph-Guided + Conversation Context)
        # ══════════════════════════════════════════════════════════════════════
        log.step(2, 4, "Vector Search (Multi-Strategy)", "📚")
        step2_start = log.timer_start()

        log.substep("Multi-query retrieval strategy:")

        # Build conversation-aware queries for vector search
        summary_query = self._build_conversation_summary_query(query)
        follow_up_query = self._build_follow_up_query(query)

        # Show which stores are being searched
        if self.selected_store_ids:
            log.info(f"Searching in {len(self.selected_store_ids)} selected store(s)")
        else:
            log.info("Searching in default store (from config)")

        # 2a: Original query
        log.info("Query 1: Original user query")
        original_docs = self.flowise.vector_store_query(query, top_k=3, store_ids=self.selected_store_ids)
        log.result("Results", f"{len(original_docs)} documents")

        # 2b: Conversation Summary Query (if has history)
        summary_docs = []
        if summary_query:
            log.info(f"Query 2: 📝 Conversation Summary")
            log.result("Query", f"\"{summary_query[:80]}{'...' if len(summary_query) > 80 else ''}\"")
            summary_docs = self.flowise.vector_store_query(summary_query, top_k=3, store_ids=self.selected_store_ids)
            log.result("Results", f"{len(summary_docs)} documents")

        # 2c: Follow-up Query (if detected as follow-up question)
        follow_up_docs = []
        if follow_up_query:
            log.info(f"Query 3: 🔄 Follow-up Enhanced")
            log.result("Query", f"\"{follow_up_query[:80]}{'...' if len(follow_up_query) > 80 else ''}\"")
            follow_up_docs = self.flowise.vector_store_query(follow_up_query, top_k=2, store_ids=self.selected_store_ids)
            log.result("Results", f"{len(follow_up_docs)} documents")

        # 2d: Graph-enhanced query (with extracted entities)
        enhanced_docs = []
        if enhanced_query != query:
            log.info(f"Query 4: 🕸️ Graph-enhanced")
            log.result("Query", f"\"{enhanced_query[:80]}{'...' if len(enhanced_query) > 80 else ''}\"")
            enhanced_docs = self.flowise.vector_store_query(enhanced_query, top_k=2, store_ids=self.selected_store_ids)
            log.result("Results", f"{len(enhanced_docs)} documents")

        # 2e: Entity-only query
        entity_docs = []
        if entity_query:
            log.info(f"Query 5: 🏷️ Entity-focused")
            log.result("Query", f"\"{entity_query[:80]}{'...' if len(entity_query) > 80 else ''}\"")
            entity_docs = self.flowise.vector_store_query(entity_query, top_k=2, store_ids=self.selected_store_ids)
            log.result("Results", f"{len(entity_docs)} documents")

        # Combine and deduplicate all results
        vector_docs = []
        seen_docs = set()
        all_retrieved = original_docs + summary_docs + follow_up_docs + enhanced_docs + entity_docs
        for doc in all_retrieved:
            doc_key = str(doc)[:100]
            if doc_key not in seen_docs:
                seen_docs.add(doc_key)
                vector_docs.append(doc)

        log.divider()
        log.substep(f"Combined unique documents: {len(vector_docs)}")

        if vector_docs:
            log.substep("Retrieved documents preview:")
            for i, doc in enumerate(vector_docs[:3], 1):
                log.document(i, doc, doc_type="DOC")

        log.timer_end(step2_start, "Vector Search")

        # ══════════════════════════════════════════════════════════════════════
        # COMBINE RESULTS
        # ══════════════════════════════════════════════════════════════════════
        all_docs = []

        # Add graph results
        for result in graph_results:
            node_id = result.get('node_id', 'N/A')
            labels = result.get('labels', [])
            score = result.get('score', 0)
            graph_text = result.get('text', '')
            if graph_text:
                block = [
                    f"Graph Knowledge (Node ID: {node_id}, Labels: {', '.join(labels)}, Score: {score:.3f}):",
                    graph_text
                ]
                all_docs.append("\n".join(block))

        # Add vector docs
        all_docs.extend(vector_docs)

        # ══════════════════════════════════════════════════════════════════════
        # STEP 3: RERANKING
        # ══════════════════════════════════════════════════════════════════════
        log.step(3, 4, "Reranking Results", "🎯")
        step3_start = log.timer_start()

        log.substep(f"Input: {len(all_docs)} documents (graph + vector)")
        log.stats_box({
            "Graph nodes": len(graph_results),
            "Vector docs": len(vector_docs),
            "Total input": len(all_docs),
            "Target output": "Top 5"
        })

        reranked_docs = self.reranker.rerank(query, all_docs, top_k=5)

        log.divider()
        log.substep(f"Output: Top {len(reranked_docs)} most relevant")

        if reranked_docs:
            log.substep("Reranked results:")
            for i, doc in enumerate(reranked_docs[:3], 1):
                # Check if it's from graph or vector
                doc_type = "GRAPH" if "Graph Knowledge" in str(doc) else "DOC"
                log.document(i, doc, doc_type=doc_type)

        log.timer_end(step3_start, "Reranking")

        # ══════════════════════════════════════════════════════════════════════
        # STEP 4: SYNTHESIS
        # ══════════════════════════════════════════════════════════════════════
        log.step(4, 4, "Answer Synthesis", "✨")
        synthesis_start = log.timer_start()

        context_str = "\n".join([str(d) for d in reranked_docs])
        log.substep(f"Generating answer with Gemini 2.5 Flash")
        log.stats_box({
            "Context size": f"{len(context_str)} chars",
            "Documents used": len(reranked_docs),
            "Model": "gemini-2.5-flash"
        })
        
        if self.llm:
            # Get conversation history for context
            conversation_context = self._get_conversation_context_for_prompt()

            prompt = f"""You are an intelligent assistant. Answer the user's question based on the following context and conversation history.

{conversation_context}

Retrieved Context:
{context_str}

Current Question: {query}

Instructions:
- If the user asks a follow-up question (like "tell me more", "explain that", "what about X"), refer to the conversation history
- Provide a comprehensive answer based on the retrieved context
- If information is not available in the context, say so clearly

Answer:"""

            log.divider()
            log.substep("Streaming response...")

            try:
                # Collect full response for history
                full_response = []

                # Stream the response
                for chunk in self.llm.stream([HumanMessage(content=prompt)]):
                    if hasattr(chunk, 'content'):
                        full_response.append(chunk.content)
                        yield chunk.content
                    else:
                        full_response.append(str(chunk))
                        yield str(chunk)

                # Save to conversation history
                response_text = ''.join(full_response)
                self.conversation_history.append({
                    'question': query,
                    'answer': response_text
                })

                # Final summary
                synthesis_time = log.timer_end(synthesis_start, "Synthesis")
                total_time = time.time() - pipeline_start

                log.divider("═")
                log.success(f"PIPELINE COMPLETE")
                log.stats_box({
                    "Total time": f"{total_time:.2f}s",
                    "Graph search": f"{len(graph_results)} nodes",
                    "Vector search": f"{len(vector_docs)} docs",
                    "Final context": f"{len(reranked_docs)} docs",
                    "History": f"{len(self.conversation_history)} exchanges"
                })
                print()

            except Exception as e:
                log.error(f"Synthesis failed: {e}")
                yield f"Error generating response: {str(e)}"
        else:
            log.warning("No LLM available - returning raw documents")
            yield "No LLM available to synthesize answer. Here are the retrieved docs:\n" + str(reranked_docs)

    def close(self):
        self.neo4j.close()

if __name__ == "__main__":
    agent = RAGAgent()
    agent.close()
