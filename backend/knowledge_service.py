from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from config import get_settings

settings = get_settings()


class KnowledgeService:
    def __init__(self):
        self.client = chromadb.Client(Settings(
            persist_directory="./chroma_db",
            anonymized_telemetry=False
        ))
        self.collection = self.client.get_or_create_collection("hospital_knowledge")

    def add_document(self, doc_id: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        self.collection.add(
            documents=[content],
            metadatas=[metadata or {}],
            ids=[doc_id]
        )
        return doc_id

    def search_documents(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )
        documents = []
        if results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                documents.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else None
                })
        return documents

    def delete_document(self, doc_id: str):
        self.collection.delete(ids=[doc_id])

    def update_document(self, doc_id: str, content: str, metadata: Optional[Dict[str, Any]] = None):
        self.collection.update(
            documents=[content],
            metadatas=[metadata or {}],
            ids=[doc_id]
        )


knowledge_service = KnowledgeService()
