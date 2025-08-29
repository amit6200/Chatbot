from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv
 
# Load environment variables from .env file if it exists
load_dotenv()
 
class Settings(BaseSettings):
    """Application settings"""
    APP_NAME: str = "Advanced Chatbot"
    DEBUG: bool = True
    LLAMA_API_URL: str = os.getenv("LLAMA_API_URL", "http://localhost:11434/api/generate")
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "./chroma_db")
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", 1000))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", 200))
    MAX_DOCUMENTS: int = int(os.getenv("MAX_DOCUMENTS", 1000))
    # Code execution settings
    CODE_EXECUTION_ENABLED: bool = os.getenv("CODE_EXECUTION_ENABLED", "True").lower() == "true"
    CODE_EXECUTION_TIMEOUT: int = int(os.getenv("CODE_EXECUTION_TIMEOUT", 5))
    MAX_CODE_OUTPUT_SIZE: int = int(os.getenv("MAX_CODE_OUTPUT_SIZE", 10000))
    # Security settings for code execution
    ALLOWED_MODULES: list = os.getenv("ALLOWED_MODULES", "math,random,datetime,json,collections,re,string,itertools,functools").split(",")
    RESTRICTED_MODULES: list = os.getenv("RESTRICTED_MODULES", "os,subprocess,sys,shutil,requests,socket,pickle,urllib").split(",")
 
    class Config:
        env_file = ".env"
 
# Create settings instance
settings = Settings()