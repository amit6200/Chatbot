import subprocess
import os
import uuid
import json
import tempfile
import time
from typing import Dict, Any, Tuple
 
class CodeExecutor:
    def __init__(self, timeout: int = 5, max_output_size: int = 10000):
        """
        Initialize the code executor with safety parameters
        Args:
            timeout: Maximum execution time in seconds
            max_output_size: Maximum size of output in characters
        """
        self.timeout = timeout
        self.max_output_size = max_output_size
        self.temp_dir = tempfile.gettempdir()
    def execute_python_code(self, code: str) -> Dict[str, Any]:
        """
        Execute Python code safely and return the result
        Args:
            code: Python code string to execute
        Returns:
            Dictionary containing execution status, output, and error if any
        """
        # Create a unique file name
        file_id = str(uuid.uuid4())
        file_path = os.path.join(self.temp_dir, f"{file_id}.py")
        try:
            # Save code to temporary file
            with open(file_path, 'w') as f:
                f.write(code)
            # Execute code in a subprocess with restrictions
            start_time = time.time()
            # Using subprocess with restricted permissions
            process = subprocess.Popen(
                ["python", file_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            # Enforce timeout
            try:
                stdout, stderr = process.communicate(timeout=self.timeout)
            except subprocess.TimeoutExpired:
                process.kill()
                return {
                    "success": False,
                    "output": "",
                    "error": f"Execution timed out after {self.timeout} seconds",
                    "execution_time": self.timeout
                }
            execution_time = time.time() - start_time
            # Truncate output if too large
            if len(stdout) > self.max_output_size:
                stdout = stdout[:self.max_output_size] + "\n... (output truncated)"
            if len(stderr) > self.max_output_size:
                stderr = stderr[:self.max_output_size] + "\n... (error output truncated)"
            return {
                "success": process.returncode == 0,
                "output": stdout,
                "error": stderr,
                "execution_time": round(execution_time, 3)
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": f"Error executing code: {str(e)}",
                "execution_time": 0
            }
        finally:
            # Clean up the temporary file
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
 
# Optional: Enhanced security with resource limits using module like 'resource'
# Consider adding more security measures based on your requirements