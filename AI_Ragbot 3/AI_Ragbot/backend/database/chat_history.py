import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
import sqlite3
import json
import os

class ChatHistoryHandler:
    def __init__(self, db_path: str = "./database/chat_history.db"):
        """Initialize the chat history handler with a SQLite database."""
        self.db_path = db_path
        db_dir = os.path.dirname(self.db_path)         
        if db_dir and not os.path.exists(db_dir):             
            os.makedirs(db_dir, exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initialize the database with required tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create conversations table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL,
            metadata TEXT
        )
        ''')

        # Create messages table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            message_id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id)
        )
        ''')

        # Create uploaded_files table for file deduplication
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            filehash TEXT UNIQUE
        )
        ''')

        conn.commit()
        conn.close()

    def create_conversation(self, conversation_id: str, title: str = "New Chat",  metadata: Optional[Dict] = None) -> str:
        """Create a new conversation and return its ID."""
            # If conversation_id is not passed, generate a new one
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        now = datetime.now().isoformat()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO conversations (conversation_id, title, created_at, updated_at, metadata) VALUES (?, ?, ?, ?, ?)",
            (conversation_id, title, now, now, json.dumps(metadata or {}))
        )
        conn.commit()
        conn.close()
        return conversation_id
    def add_message(self, conversation_id: str, role: str, content: str) -> Optional[str]:
        """Add a message to a conversation if it doesn't already exist. Return message ID or None."""
        print('Attempting to add message to conversation_id:', conversation_id)

        now = datetime.now().isoformat()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Check for exact duplicate
        cursor.execute("""
            SELECT COUNT(*) FROM messages
            WHERE conversation_id = ? AND role = ? AND content = ?
        """, (conversation_id, role, content.strip()))
        count = cursor.fetchone()[0]

        if count > 0:
            print(f"[INFO] Duplicate message detected and skipped: {role} – {content[:60]}")
            conn.close()
            return None

        # Proceed with insert
        message_id = str(uuid.uuid4())

        # Update the conversation's updated_at timestamp
        cursor.execute(
            "UPDATE conversations SET updated_at = ? WHERE conversation_id = ?",
            (now, conversation_id)
        )

        # Insert the new message
        cursor.execute(
            "INSERT INTO messages (message_id, conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
            (message_id, conversation_id, role, content.strip(), now)
        )

        conn.commit()
        conn.close()

        print('Successfully added message_id:', message_id)
        return message_id

    # def add_message(self, conversation_id: str, role: str, content: str) -> str:
    #     """Add a message to a conversation and return the message ID."""
    #     print('adding message to conversation_id   '+conversation_id)
    #     message_id = str(uuid.uuid4())
    #     now = datetime.now().isoformat()
    #     conn = sqlite3.connect(self.db_path)
    #     cursor = conn.cursor()
    #     # Update the conversation's updated_at timestamp
    #     cursor.execute(
    #         "UPDATE conversations SET updated_at = ? WHERE conversation_id = ?",
    #         (now, conversation_id)
    #     )
    #     # Insert the new message
    #     cursor.execute(
    #         "INSERT INTO messages (message_id, conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
    #         (message_id, conversation_id, role, content, now)
    #     )
    #     conn.commit()
    #     conn.close()
    #     print(message_id)
    #     print('adding message to message_id   '+message_id)
    #     return message_id

    # def add_message(self, conversation_id: str, role: str, content: str) -> str:
    #     print("Checking if conversation exists")
    #     conn = sqlite3.connect(self.db_path)
    #     cursor = conn.cursor()

    #     now = datetime.now().isoformat()
    #     cursor.execute(
    #         "SELECT 1 FROM conversations WHERE conversation_id = ?",
    #         (conversation_id,)
    #     )
    #     if cursor.fetchone() is None:
    #         print(f"Conversation {conversation_id} not found. Creating new one.")
    #         cursor.execute(
    #             "INSERT INTO conversations (conversation_id, updated_at, title) VALUES (?, ?, ?)",
    #             (conversation_id, now, content)
    #     )

    #     cursor.execute(
    #         "UPDATE conversations SET updated_at = ? WHERE conversation_id = ?",
    #         (now, conversation_id)
    #     )

    #     message_id = str(uuid.uuid4())
    #     cursor.execute(
    #         "INSERT INTO messages (message_id, conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
    #         (message_id, conversation_id, role, content, now)
    #     )

    #     conn.commit()
    #     conn.close()
    #     print("Message inserted successfully")
    #     return message_id


    def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """Get a conversation by its ID, including all messages."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        # Get conversation details
        print('reading message to conversation_id   '+conversation_id)
        cursor.execute("SELECT * FROM conversations WHERE conversation_id = ?", (conversation_id,))
        conversation_row = cursor.fetchone()
        if not conversation_row:
            conn.close()
            raise ValueError(f"Conversation with ID {conversation_id} not found")
        conversation = dict(conversation_row)
        conversation['metadata'] = json.loads(conversation['metadata'])
        # Get messages for this conversation
        cursor.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC", 
            (conversation_id,)
        )
        messages = [dict(row) for row in cursor.fetchall()]
        conversation['messages'] = messages
        conn.close()
        # print(conversation['messages'])
        return conversation

    def get_all_conversations(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get a list of all conversations with their basic info (not including messages)."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ? OFFSET ?", 
            (limit, offset)
        )
        conversations = []
        for row in cursor.fetchall():
            conversation = dict(row)
            conversation['metadata'] = json.loads(conversation['metadata'])
            conversations.append(conversation)
            print(conversations)
        conn.close()
        return conversations

    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            # Delete messages first due to foreign key constraint
            cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
            cursor.execute("DELETE FROM conversations WHERE conversation_id = ?", (conversation_id,))
            affected = cursor.rowcount
            conn.commit()
            conn.close()
            return affected > 0
        except Exception as e:
            conn.rollback()
            conn.close()
            raise e

    def update_conversation_title(self, conversation_id: str, title: str) -> bool:
        """Update the title of a conversation."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE conversations SET title = ? WHERE conversation_id = ?",
            (title, conversation_id)
        )
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        return affected > 0

    def is_file_already_uploaded(self, filehash: str) -> bool:
        """Check if a file with the given hash already exists in the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM uploaded_files WHERE filehash = ?", (filehash,))
        result = cursor.fetchone()
        conn.close()
        return result is not None

    def log_uploaded_file(self, filename: str, filehash: str):
        """Log a new uploaded file in the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO uploaded_files (filename, filehash) VALUES (?, ?)",
                (filename, filehash)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            # File already exists, skip
            pass
        finally:
            conn.close()