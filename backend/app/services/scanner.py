"""Repository scanner service - extracts and scans files from GitHub repos."""
import zipfile
import io
import os

class RepoScanner:
    """Scan repository files and extract content."""
    
    SUPPORTED_EXTENSIONS = [
        '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.h',
        '.go', '.rb', '.php', '.cs', '.swift', '.kt', '.rs', '.scala',
        '.json', '.yaml', '.yml', '.xml', '.toml', '.md', '.txt',
        '.html', '.css', '.scss', '.sass', '.vue', '.sql'
    ]
    
    IGNORE_DIRS = [
        '__pycache__', 'node_modules', '.git', '.next', 'build', 'dist',
        'venv', 'env', '.venv', 'target', 'bin', 'obj', '.idea', '.vscode'
    ]
    
    def extract_and_scan(self, zip_content: bytes) -> list:
        """Extract ZIP and scan all supported files."""
        files = []
        
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zf:
            for file_info in zf.namelist():
                # Skip directories
                if file_info.endswith('/'):
                    continue
                
                # Skip ignored directories
                if any(ignored in file_info for ignored in self.IGNORE_DIRS):
                    continue
                
                # Check if file extension is supported
                _, ext = os.path.splitext(file_info)
                if ext not in self.SUPPORTED_EXTENSIONS:
                    continue
                
                try:
                    # Read file content
                    content = zf.read(file_info).decode('utf-8', errors='ignore')
                    
                    # Skip empty files
                    if not content.strip():
                        continue
                    
                    # Normalize path (remove leading directory from GitHub ZIP)
                    path_parts = file_info.split('/', 1)
                    normalized_path = path_parts[1] if len(path_parts) > 1 else file_info
                    
                    files.append({
                        'path': normalized_path,
                        'content': content,
                        'size': len(content)
                    })
                    
                except Exception as e:
                    # Skip files that can't be read
                    continue
        
        return files
    
    def filter_by_language(self, files: list, language: str) -> list:
        """Filter files by programming language."""
        language_extensions = {
            'python': ['.py'],
            'javascript': ['.js', '.jsx'],
            'typescript': ['.ts', '.tsx'],
            'java': ['.java'],
            'go': ['.go'],
            'ruby': ['.rb'],
            'php': ['.php'],
            'csharp': ['.cs'],
            'cpp': ['.cpp', '.c', '.h'],
            'rust': ['.rs']
        }
        
        extensions = language_extensions.get(language.lower(), [])
        if not extensions:
            return files
        
        return [f for f in files if any(f['path'].endswith(ext) for ext in extensions)]
