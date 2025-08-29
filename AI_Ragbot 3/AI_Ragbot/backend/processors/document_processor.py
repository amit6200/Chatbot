
import os
from typing import Optional
import json
from PyPDF2 import PdfReader
import docx2txt
import re

class DocumentProcessor:
    def process_document(self, file_path: str) -> str:
        """Process different document types and extract text content"""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            return self._process_pdf(file_path)
        elif file_extension == '.txt':
            return self._process_txt(file_path)
        elif file_extension in ['.docx', '.doc']:
            return self._process_docx(file_path)
        elif file_extension == '.json':
            return self._process_json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    def _process_pdf(self, file_path: str) -> str:
        """Extract text from PDF files"""
        text = ""
        try:
            pdf_reader = PdfReader(file_path)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error processing PDF: {str(e)}")
    
    def _process_txt(self, file_path: str) -> str:
        """Extract text from TXT files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            # Try with a different encoding if UTF-8 fails
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read()
        except Exception as e:
            raise Exception(f"Error processing TXT: {str(e)}")
    
    def _process_docx(self, file_path: str) -> str:
        """Extract text from DOCX files"""
        try:
            text = docx2txt.process(file_path)
            return text
        except Exception as e:
            raise Exception(f"Error processing DOCX: {str(e)}")
    
    def _process_json(self, file_path: str) -> str:
        """Extract text from JSON files - converts to readable text format"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            text = json.dumps(data, indent=2)
            return text
        except Exception as e:
            raise Exception(f"Error processing JSON: {str(e)}")

    def chunk_by_heading(self, raw_text: str) -> list:
        """
        Splits the extracted raw document text into chunks based on numbered headings like '6. Sick Leave'
        """
        pattern = r"\n(?=\d{1,2}\.\s+[A-Z][a-zA-Z ]+Leave)"
        chunks = re.split(pattern, raw_text)

        titles = re.findall(r"\n(\d{1,2}\.\s+[A-Z][a-zA-Z ]+Leave)", raw_text)
        for i in range(1, len(chunks)):
            if i < len(titles):
                chunks[i] = titles[i] + "\n" + chunks[i]

        return [chunk.strip() for chunk in chunks if chunk.strip()]
    
    def delete_all_documents(self):
        """
        Delete all documents from the uploads folder and return the count of deleted files
        """
        try:
            uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
            root_uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads')
            
            deleted_count = 0

            # Delete files from backend/uploads
            if os.path.exists(uploads_dir) and os.path.isdir(uploads_dir):
                for filename in os.listdir(uploads_dir):
                    file_path = os.path.join(uploads_dir, filename)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                        deleted_count += 1
            
            # Delete files from root uploads directory
            if os.path.exists(root_uploads_dir) and os.path.isdir(root_uploads_dir):
                for filename in os.listdir(root_uploads_dir):
                    file_path = os.path.join(root_uploads_dir, filename)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                        deleted_count += 1
                        
            return {"success": True, "deleted_count": deleted_count}
            
        except Exception as e:
            return {"success": False, "error": str(e)}



# import os
# from typing import Optional
# import json
# from PyPDF2 import PdfReader
# import docx2txt

# class DocumentProcessor:
#     def process_document(self, file_path: str) -> str:
#         """Process different document types and extract text content"""
#         file_extension = os.path.splitext(file_path)[1].lower()
        
#         if file_extension == '.pdf':
#             return self._process_pdf(file_path)
#         elif file_extension == '.txt':
#             return self._process_txt(file_path)
#         elif file_extension in ['.docx', '.doc']:
#             return self._process_docx(file_path)
#         elif file_extension == '.json':
#             return self._process_json(file_path)
#         else:
#             raise ValueError(f"Unsupported file format: {file_extension}")
    
#     def _process_pdf(self, file_path: str) -> str:
#         """Extract text from PDF files"""
#         text = ""
#         try:
#             pdf_reader = PdfReader(file_path)
#             for page in pdf_reader.pages:
#                 text += page.extract_text() + "\n"
#             return text
#         except Exception as e:
#             raise Exception(f"Error processing PDF: {str(e)}")
    
#     def _process_txt(self, file_path: str) -> str:
#         """Extract text from TXT files"""
#         try:
#             with open(file_path, 'r', encoding='utf-8') as file:
#                 return file.read()
#         except UnicodeDecodeError:
#             # Try with a different encoding if UTF-8 fails
#             with open(file_path, 'r', encoding='latin-1') as file:
#                 return file.read()
#         except Exception as e:
#             raise Exception(f"Error processing TXT: {str(e)}")
    
#     def _process_docx(self, file_path: str) -> str:
#         """Extract text from DOCX files"""
#         try:
#             text = docx2txt.process(file_path)
#             return text
#         except Exception as e:
#             raise Exception(f"Error processing DOCX: {str(e)}")
    
#     def _process_json(self, file_path: str) -> str:
#         """Extract text from JSON files - converts to readable text format"""
#         try:
#             with open(file_path, 'r', encoding='utf-8') as file:
#                 data = json.load(file)
            
#             # Convert JSON to text representation
#             text = json.dumps(data, indent=2)
#             return text
#         except Exception as e:
#             raise Exception(f"Error processing JSON: {str(e)}")
#     def delete_all_documents(self):
#         """
#         Delete all documents from the uploads folder and return the count of deleted files
#         """
#         try:
#             # Path to your uploads directory
#             uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
#             root_uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads')
            
#             deleted_count = 0

#             # Delete files from backend/uploads
#             if os.path.exists(uploads_dir) and os.path.isdir(uploads_dir):
#                 for filename in os.listdir(uploads_dir):
#                     file_path = os.path.join(uploads_dir, filename)
#                     if os.path.isfile(file_path):
#                         os.remove(file_path)
#                         deleted_count += 1
            
#             # Delete files from root uploads directory
#             if os.path.exists(root_uploads_dir) and os.path.isdir(root_uploads_dir):
#                 for filename in os.listdir(root_uploads_dir):
#                     file_path = os.path.join(root_uploads_dir, filename)
#                     if os.path.isfile(file_path):
#                         os.remove(file_path)
#                         deleted_count += 1
                        
#             return {"success": True, "deleted_count": deleted_count}
            
#         except Exception as e:
#             return {"success": False, "error": str(e)}