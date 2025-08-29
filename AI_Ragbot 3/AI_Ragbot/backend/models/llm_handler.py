import httpx
import json
from typing import List, Dict, Optional, AsyncGenerator
import os
import asyncio

class LlamaModel:
    def __init__(self, api_url="http://localhost:11434/api/chat", model="llama3:8b"):
        """Initialize the Llama model handler"""
        self.api_url = api_url
        self.model = model
        self.default_timeout = 120.0
        self.max_context_chars = 6000
        self.max_history_messages = 3

    def _create_payload(self, messages: List[Dict], temperature: float = 0.7, 
                       max_tokens: int = 2048, **kwargs) -> Dict:
        """Create a standardized payload for Ollama API requests"""
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        # Add any additional parameters
        payload.update(kwargs)
        return payload

    def _prepare_messages(self, prompt: str, system_prompt: str = "You are a helpful assistant.", 
                         chat_history: Optional[List[Dict]] = None) -> List[Dict]:
        """Prepare messages in the correct format for the API"""
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add chat history if provided
        if chat_history:
            for message in chat_history[-self.max_history_messages:]:
                if message["role"] in ["user", "assistant"]:
                    messages.append({
                        "role": message["role"],
                        "content": message["content"]
                    })
        
        # Add current prompt if not already the last message
        if not chat_history or chat_history[-1]["role"] != "user" or chat_history[-1]["content"] != prompt:
            messages.append({"role": "user", "content": prompt})
        
        return messages

    async def _make_api_request(self, payload: Dict) -> str:
        """Make API request to Ollama and return response content"""
        try:
            async with httpx.AsyncClient(timeout=self.default_timeout) as client:
                response = await client.post(self.api_url, json=payload)
                response.raise_for_status()
                result = response.json()
                return result.get("message", {}).get("content", "")
        except httpx.HTTPError as e:
            print(f"HTTP error: {e}")
            return f"Error generating response: {str(e)}"
        except Exception as e:
            print(f"Unexpected error: {e}")
            return f"Unexpected error: {str(e)}"

    def _make_sync_api_request(self, payload: Dict) -> str:
        """Make synchronous API request to Ollama and return response content"""
        try:
            with httpx.Client(timeout=self.default_timeout) as client:
                response = client.post(self.api_url, json=payload)
                response.raise_for_status()
                result = response.json()
                return result.get("message", {}).get("content", "")
        except httpx.HTTPError as e:
            print(f"HTTP error: {e}")
            return f"Error generating response: {str(e)}"
        except Exception as e:
            print(f"Unexpected error: {e}")
            return f"Unexpected error: {str(e)}"

    def generate(self, prompt: str, chat_history: Optional[List[Dict]] = None, 
                system_prompt: str = "You are a helpful assistant.") -> str:
        """Generate a response using Llama model synchronously"""
        messages = self._prepare_messages(prompt, system_prompt, chat_history)
        payload = self._create_payload(messages, temperature=0.7, max_tokens=2048)
        return self._make_sync_api_request(payload)

    def generate_code(self, prompt: str, system_prompt: str = None) -> str:
        """Generate Python code based on the prompt"""
        if system_prompt is None:
            system_prompt = ("You are a Python programming assistant. Generate concise, "
                           "working Python code that addresses the user's request. Include "
                           "only code without explanation or markdown formatting.")
        
        messages = self._prepare_messages(prompt, system_prompt)
        payload = self._create_payload(messages, temperature=0.1, max_tokens=2048, top_p=0.95)
        return self._make_sync_api_request(payload)

    async def generate_response(self, query: str, context: str = None, 
                              system_prompt: Optional[str] = "You are a helpful assistant.",
                              conversation_history: List[Dict[str, str]] = None) -> AsyncGenerator[Dict[str, str], None]:
        """
        Generate a response from the LLM using the query, context, and conversation history.
        
        Args:
            query: The user's question
            context: Optional retrieved context from vector store
            system_prompt: System prompt for the model
            conversation_history: List of previous messages
            
        Yields:
            Dict with status updates and final response
        """
        print("[DEBUG] Entered generate_response")
        
        try:
            yield {"status": "thinking", "message": "Processing your request..."}
            
            # Truncate context if too long
            if context and len(context) > self.max_context_chars:
                context = context[:self.max_context_chars]
            
            # Prepare system message with context
            enhanced_system_prompt = system_prompt or "You are a helpful assistant."
            if context:
                enhanced_system_prompt += f"\n\nUse the following context to answer the question:\n{context}"
            
            # Prepare messages
            messages = [{"role": "system", "content": enhanced_system_prompt}]
            
            # Add conversation history
            if conversation_history:
                for message in conversation_history[-self.max_history_messages:]:
                    messages.append({"role": message["role"], "content": message["content"]})
            
            # Add current query
            messages.append({"role": "user", "content": query})
            
            # Additional status update for context analysis
            if context:
                yield {"status": "thinking", "message": "Analyzing relevant information..."}
            
            # Debug logging
            print(f"[DEBUG] Context length: {len(context) if context else 0}")
            print(f"[DEBUG] Query: {query[:100]}")
            print(f"[DEBUG] History length: {len(conversation_history) if conversation_history else 0}")
            print(f"[DEBUG] Payload tokens approx: {sum(len(m['content']) for m in messages)}")
            
            # Generate response
            payload = self._create_payload(messages, temperature=0.7, max_tokens=2048)
            response = await self._make_api_request(payload)
            
            yield {"status": "complete", "message": response}
            
        except Exception as e:
            print(f"[ERROR] generate_response crashed: {e}")
            yield {"status": "error", "message": "I'm sorry, I encountered an error processing your request."}

    # Keep this for backward compatibility if needed
    async def _generate_from_llm(self, messages: List[Dict[str, str]]) -> str:
        """Generate response from LLM - now just a wrapper around _make_api_request"""
        payload = self._create_payload(messages, temperature=0.7, max_tokens=2048)
        return await self._make_api_request(payload)

    def _format_messages_for_llm(self, messages: List[Dict[str, str]]) -> str:
        """Format messages for specific LLM format if needed"""
        formatted_prompt = ""
        for message in messages:
            if message["role"] == "system":
                formatted_prompt += f"<system>\n{message['content']}\n</system>\n\n"
            elif message["role"] == "user":
                formatted_prompt += f"<human>\n{message['content']}\n</human>\n\n"
            elif message["role"] == "assistant":
                formatted_prompt += f"<assistant>\n{message['content']}\n</assistant>\n\n"
        
        formatted_prompt += "<assistant>\n"
        return formatted_prompt