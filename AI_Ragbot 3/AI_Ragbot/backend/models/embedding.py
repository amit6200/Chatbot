import ollama
from typing import List, Union

class LocalEmbedder:
    def __init__(self, model_name="nomic-embed-text"):
        self.model_name = model_name

    def _get_embedding(self, text: Union[str, List[str]]) -> List[float]:
        if isinstance(text, list):
            text = " ".join(str(item) for item in text)
        
        if not isinstance(text, str):
            raise ValueError(f"Expected text to be a string or list of strings, but got {type(text)}")
        
        try:
            response = ollama.embeddings(model=self.model_name, prompt=text)
        except Exception as e:
            raise Exception(f"Error while making API request: {str(e)}")

        try:
            return response["embedding"]
        except KeyError:
            raise Exception(f"Invalid response from API. Response: {response}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            embedding = self._get_embedding(text)
            embeddings.append(embedding)
        return embeddings
    
    def embed_query(self, text: str) -> List[float]:
        return self._get_embedding(text)
