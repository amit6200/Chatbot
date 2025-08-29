import os
import uuid
from typing import List, Optional, Sequence, Dict

import chromadb
from chromadb.config import Settings
from chromadb.api.types import EmbeddingFunction


class LangchainEmbeddingAdapter(EmbeddingFunction[Sequence[str]]):
    """
    Adapter to wrap a LangChain-style embedder into a Chroma-compatible EmbeddingFunction.
    """
    def __init__(self, embedder):
        self.embedder = embedder

    def __call__(self, input: Sequence[str]) -> List[List[float]]:
        return self.embedder.embed_documents(list(input))

    def embed_query(self, query: str) -> List[float]:
        return self.embedder.embed_query(query)


class ChromaDBHandler:
    """
    Handler for managing document vectors using ChromaDB
    with optional on-disk SQLite persistence and folder reuse.
    """
    def __init__(
        self,
        embedder,
        persist_directory: str = "C:\\Users\\Amit Singh\\Downloads\\AI_Ragbot 3\\AI_Ragbot\\chroma_db",
        clear_on_init: bool = False
    ):
        """
        Initializes the ChromaDBHandler.

        Args:
            embedder: An object with embed_documents and embed_query methods.
            persist_directory: Filesystem path for persistence.
            clear_on_init: If True, clears existing data at the directory on startup.
                           If False, reuses the existing store.
        """
        self.embedder = embedder
        # Normalize path
        self.persist_directory = os.path.abspath(os.path.expanduser(persist_directory))
        self.db: Dict[str, Dict] = {}

        print(f"Using persistence directory: {self.persist_directory}")

        # Optionally clear existing data
        if clear_on_init and os.path.exists(self.persist_directory):
            try:
                import shutil
                shutil.rmtree(self.persist_directory)
                print(f"Cleared existing ChromaDB at '{self.persist_directory}'")
            except Exception as e:
                print(f"Warning: could not clear '{self.persist_directory}': {e}")

        # Ensure directory exists
        os.makedirs(self.persist_directory, exist_ok=True)

        # Prepare embedding adapter
        embedding_function = LangchainEmbeddingAdapter(self.embedder)

        # Configure unified client
        settings = Settings(
            persist_directory=self.persist_directory,
            is_persistent=True,
            allow_reset=True
        )
        self.client = chromadb.Client(settings=settings)

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="documents",
            embedding_function=embedding_function,
            metadata={"hnsw:space": "cosine"}
        )
        print(f"Initialized ChromaDB collection at '{self.persist_directory}' (clear_on_init={clear_on_init})")

    def document_exists(self, doc_hash: str) -> bool:
        return any(
            entry.get("metadata", {}).get("doc_hash") == doc_hash
            for entry in self.db.values()
        )

    def add_documents(
        self,
        ids: Optional[List[str]],
        documents: List[str],
        embeddings: Optional[List[List[float]]] = None,
        metadatas: Optional[List[dict]] = None
    ) -> List[str]:
        # Compute embeddings if missing
        if embeddings is None:
            embeddings = self.embedder.embed_documents(documents)

        # Normalize metadata
        if metadatas is None:
            metadatas = [{} for _ in documents]
        elif isinstance(metadatas, dict):
            metadatas = [metadatas] * len(documents)

        # Generate IDs if not provided
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in documents]

        # Validate lengths
        if not (len(ids) == len(documents) == len(embeddings) == len(metadatas)):
            raise ValueError(
                f"Length mismatch: ids({len(ids)}), docs({len(documents)}), "
                f"embeddings({len(embeddings)}), metadatas({len(metadatas)})"
            )

        # Add to collection
        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

        # No manual persist needed: auto-persistence enabled.

        # Update in-memory store
        for doc_id, text, emb, meta in zip(ids, documents, embeddings, metadatas):
            self.db[doc_id] = {"chunk": text, "embedding": emb, "metadata": meta}

        return ids

    def similarity_search(
        self,
        query: str,
        top_k: int = 5
    ) -> List[dict]:
        query_embedding = self.embedder.embed_query(query)
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
        except Exception as e:
            print(f"ChromaDB query error: {e}")
            return []

        ids = results.get("ids", [[]])[0]
        texts = results.get("documents", [[]])[0]
        metas = (
            results.get("metadatas", [[]])[0]
            if results.get("metadatas") else [{}] * len(ids)
        )
        return [{"id": i, "content": t, "metadata": m} for i, t, m in zip(ids, texts, metas)]

    def delete_document(self, doc_id: str) -> bool:
        try:
            self.collection.delete(ids=[doc_id])
            self.db.pop(doc_id, None)
            return True
        except Exception as e:
            print(f"Error deleting {doc_id}: {e}")
            return False

    def get_document(self, doc_id: str) -> Optional[dict]:
        try:
            result = self.collection.get(ids=[doc_id])
            docs = result.get("documents", [[]])[0]
            metas = result.get("metadatas", [[]])[0] if result.get("metadatas") else [{}]
            if docs:
                return {"id": doc_id, "content": docs[0], "metadata": metas[0]}
        except Exception as e:
            print(f"Error retrieving {doc_id}: {e}")
        return None
    # def clear_collection(self):
    #     """
    #     Clears all documents from the collection
    #     """
    #     try:
    #     # Clear all documents from the collection
    #         self.collection.delete(where={})
        
    #     # Also clear the in-memory database
    #         self.db = {}
        
    #         return {"success": True, "message": "Collection cleared successfully"}
    #     except Exception as e:
    #         print(f"Error clearing collection: {e}")
    #         return {"success": False, "error": str(e)}
    def clear_collection(self):
        """
        Clears all documents from the collection
        """
        try:
            # Get all IDs in the collection to ensure complete deletion
            all_ids = self.collection.get()["ids"]
        
            if all_ids:
             # Delete all documents using their IDs for more reliable deletion
                self.collection.delete(ids=all_ids)
        
            # Also clear the in-memory database
            self.db = {}
        
            # Verify the collection is empty
            remaining = self.collection.count()
            if remaining > 0:
                print(f"Warning: Collection still contains {remaining} documents after deletion")
            # Force a complete reset by recreating the collection if supported
                try:
                    client = self.collection._client
                    collection_name = self.collection.name
                
                    # Delete and recreate collection (if your ChromaDB version supports this)
                    client.delete_collection(collection_name)
                    self.collection = client.get_or_create_collection(collection_name)
                    print(f"Collection {collection_name} was recreated")
                except Exception as e:
                    print(f"Could not recreate collection: {e}")
        
            return {"success": True, "message": "Collection cleared successfully"}
        except Exception as e:
            print(f"Error clearing collection: {e}")
            return {"success": False, "error": str(e)}
