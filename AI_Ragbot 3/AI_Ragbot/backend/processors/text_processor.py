import re
from typing import List

class TextProcessor:
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks of roughly equal size"""
        if not text:
            return []
        
        # Basic chunking by paragraphs first
        paragraphs = re.split(r'\n\s*\n', text)
        chunks = []
        current_chunk = []
        current_size = 0
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            paragraph_size = len(paragraph)
            
            # If paragraph is too large, split it further
            if paragraph_size > self.chunk_size:
                # Split by sentences
                sentences = re.split(r'(?<=[.!?])\s+', paragraph)
                for sentence in sentences:
                    sentence = sentence.strip()
                    sentence_size = len(sentence)
                    
                    if current_size + sentence_size <= self.chunk_size:
                        current_chunk.append(sentence)
                        current_size += sentence_size
                    else:
                        if current_chunk:
                            chunks.append(" ".join(current_chunk))
                        current_chunk = [sentence]
                        current_size = sentence_size
            else:
                # If adding this paragraph exceeds chunk size, store current chunk and start new one
                if current_size + paragraph_size > self.chunk_size:
                    chunks.append(" ".join(current_chunk))
                    
                    # Start a new chunk with overlap
                    overlap_tokens = []
                    overlap_size = 0
                    for token in reversed(current_chunk):
                        if overlap_size + len(token) > self.chunk_overlap:
                            break
                        overlap_tokens.append(token)
                        overlap_size += len(token)
                    
                    if overlap_tokens:
                        current_chunk = list(reversed(overlap_tokens))
                        current_size = overlap_size
                    else:
                        current_chunk = []
                        current_size = 0
                
                current_chunk.append(paragraph)
                current_size += paragraph_size
        
        # Add the last chunk if it exists
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Fix common OCR errors
        text = re.sub(r'(\w)-\s+(\w)', r'\1\2', text)
        return text
        
    def extract_code(self, text: str) -> str:
        """Extract clean Python code from a text that might contain markdown code blocks or explanations"""
        # First, check if we have a markdown code block
        code_block_pattern = r"```(?:python)?\s*([\s\S]*?)\s*```"
        match = re.search(code_block_pattern, text)
        
        if match:
            return match.group(1).strip()
        
        # If no code block, try to extract code lines (this is less reliable)
        # Look for common Python patterns like function/class definitions, imports, etc.
        lines = text.split('\n')
        code_lines = []
        in_code = False
        
        for line in lines:
            stripped = line.strip()
            
            # Patterns that strongly indicate Python code
            python_patterns = [
                r"^import\s+\w+",
                r"^from\s+\w+\s+import",
                r"^def\s+\w+\s*\(",
                r"^class\s+\w+",
                r"^if\s+__name__\s*==\s*['\"]__main__['\"]",
                r"^\s*for\s+\w+\s+in\s+",
                r"^\s*if\s+",
                r"^\s*elif\s+",
                r"^\s*else\s*:",
                r"^\s*while\s+",
                r"^\s*try\s*:",
                r"^\s*except\s+",
                r"^\s*with\s+",
                r"^\s*return\s+"
            ]
            
            # Check if the current line matches any Python pattern
            is_python_line = any(re.match(pattern, stripped) for pattern in python_patterns)
            
            # Or check if it's likely to be continuation of Python code
            is_continuation = in_code and (stripped.startswith("    ") or 
                                          stripped.endswith(":") or 
                                          stripped.endswith(",") or
                                          "=" in stripped)
            
            if is_python_line or is_continuation:
                in_code = True
                code_lines.append(line)
            elif stripped == "" and in_code:
                # Keep empty lines within code blocks
                code_lines.append(line)
            elif in_code and not stripped.startswith("#"):
                # If we were in code but this line doesn't look like code,
                # we might be exiting the code section
                in_code = False
        
        if code_lines:
            return "\n".join(code_lines)
        
        # If all else fails, return the original text
        return text