import re
import hashlib
from typing import Dict, Any, List
import json

def generate_document_id(content: str, metadata: Dict[str, Any] = None) -> str:
    """Generate a deterministic ID for a document based on its content and metadata"""
    hash_input = content
    if metadata:
        hash_input += json.dumps(metadata, sort_keys=True)
    return hashlib.md5(hash_input.encode()).hexdigest()

def extract_code_from_markdown(markdown_text: str) -> List[Dict[str, str]]:
    """Extract code blocks from markdown text"""
    pattern = r'```(\w+)?\n(.*?)```'
    matches = re.findall(pattern, markdown_text, re.DOTALL)
    
    extracted_code = []
    for language, code in matches:
        extracted_code.append({
            "language": language.strip() if language else "text",
            "code": code.strip()
        })
    
    return extracted_code

def extract_meeting_minutes(text: str) -> Dict[str, Any]:
    """Extract key points from meeting transcripts"""
    # This is a simple extraction. A more sophisticated approach would involve NLP
    lines = text.strip().split('\n')
    
    # Extract potential metadata
    participants = []
    date = None
    title = None
    
    for i, line in enumerate(lines[:10]):  # Check first 10 lines for metadata
        if re.search(r'participant|attendee|present', line.lower()):
            participant_match = re.search(r'[:]\s*(.*)', line)
            if participant_match:
                participants = [p.strip() for p in participant_match.group(1).split(',')]
        
        date_match = re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\w+ \d{1,2},? \d{4}', line)
        if date_match and not date:
            date = date_match.group(0)
        
        if i == 0 and not title:  # First line could be title
            title = line.strip()
    
    # Extract action items
    action_items = []
    for line in lines:
        if re.search(r'action item|todo|to-do|action point', line.lower()):
            action_items.append(line.strip())
    
    # Simple key points extraction (sentences with important-sounding phrases)
    key_points = []
    for line in lines:
        if re.search(r'key point|important|critical|crucial|decided|agreed|conclusion', line.lower()):
            key_points.append(line.strip())
    
    return {
        "title": title,
        "date": date,
        "participants": participants,
        "action_items": action_items,
        "key_points": key_points,
        "full_text": text
    }
def get_file_hash(file_path: str) -> str:
    """Generate a SHA-256 hash for a given file's content"""
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        hasher.update(f.read())
    return hasher.hexdigest()
