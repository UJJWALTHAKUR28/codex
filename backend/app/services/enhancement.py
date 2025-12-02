"""Code enhancement suggestion service.
Analyzes code for improvement opportunities beyond bugs.
Suggests refactoring, performance optimization, best practices, etc.
"""
import json
import textwrap
import re

class CodeEnhancementAnalyzer:
    """Suggests code improvements and enhancements."""
    
    def __init__(self):
        self.enhancement_types = [
            'performance',
            'maintainability',
            'security',
            'best-practices',
            'style',
            'documentation',
            'testing'
        ]
    
    def analyze_enhancements(self, files):
        """Analyze files for enhancement opportunities."""
        enhancements = []
        
        for file_obj in files:
            path = file_obj.get('path', '')
            content = file_obj.get('content', '')
            
            # Check file type and apply relevant checks
            if path.endswith('.py'):
                enhancements.extend(self._check_python(path, content))
            elif path.endswith('.js') or path.endswith('.jsx'):
                enhancements.extend(self._check_javascript(path, content))
            elif path.endswith('.json'):
                enhancements.extend(self._check_json(path, content))
        
        return enhancements
    
    def _check_python(self, path, content):
        """Check Python files for enhancements."""
        enhancements = []
        lines = content.splitlines()
        
        # Performance: Check for inefficient loops
        if 'for ' in content and '.append(' in content:
            for idx, line in enumerate(lines):
                if 'for ' in line and any(lines[i].__contains__('.append(') for i in range(idx, min(idx+5, len(lines)))):
                    enhancements.append({
                        'title': 'Use list comprehension instead of loop',
                        'description': f'Line {idx+1}: Consider replacing loop+append with list comprehension for better performance',
                        'file': path,
                        'line': idx + 1,
                        'type': 'performance',
                        'severity': 'low',
                        'suggestion': 'Replace with: [expr for item in iterable]'
                    })
                    break
        
        # Best practices: Check for missing docstrings
        if 'def ' in content and '"""' not in content:
            for idx, line in enumerate(lines):
                if line.strip().startswith('def ') and idx > 0:
                    if '"""' not in lines[idx+1]:
                        enhancements.append({
                            'title': 'Missing function docstring',
                            'description': f'Function at line {idx+1} lacks documentation',
                            'file': path,
                            'line': idx + 1,
                            'type': 'documentation',
                            'severity': 'low',
                            'suggestion': 'Add docstring with function description, args, and return value'
                        })
        
        # Maintainability: Check for long functions
        func_lines = 0
        for idx, line in enumerate(lines):
            if line.startswith('def '):
                func_lines = 0
            else:
                func_lines += 1
                if func_lines > 50 and not line.strip().startswith('def '):
                    if idx < len(lines) - 1:
                        continue
                    enhancements.append({
                        'title': 'Long function detected',
                        'description': f'Function starting around line {idx-50} has many lines',
                        'file': path,
                        'line': idx - 50,
                        'type': 'maintainability',
                        'severity': 'medium',
                        'suggestion': 'Consider breaking into smaller functions'
                    })
        
        return enhancements
    
    def _check_javascript(self, path, content):
        """Check JavaScript files for enhancements."""
        enhancements = []
        lines = content.splitlines()
        
        # Performance: Check for console.log in production
        if 'console.log' in content:
            for idx, line in enumerate(lines):
                if 'console.log' in line:
                    enhancements.append({
                        'title': 'Remove console.log for production',
                        'description': f'Line {idx+1}: Debug logging should be removed before deployment',
                        'file': path,
                        'line': idx + 1,
                        'type': 'performance',
                        'severity': 'low',
                        'suggestion': 'Remove or use proper logging library'
                    })
        
        # Best practices: Check for var usage
        if re.search(r'\bvar\s+', content):
            for idx, line in enumerate(lines):
                if 'var ' in line and not line.strip().startswith('//'):
                    enhancements.append({
                        'title': 'Use const/let instead of var',
                        'description': f'Line {idx+1}: var has function scope, use const/let for block scope',
                        'file': path,
                        'line': idx + 1,
                        'type': 'best-practices',
                        'severity': 'low',
                        'suggestion': 'Replace var with const or let'
                    })
        
        # Style: Check for missing semicolons
        for idx, line in enumerate(lines):
            stripped = line.rstrip()
            if stripped and not stripped.endswith((';', '{', '}', '//', '*/')) and '=' in line:
                if not any(x in line for x in ['import', 'export', '//']):
                    enhancements.append({
                        'title': 'Missing semicolon',
                        'description': f'Line {idx+1}: JavaScript line should end with semicolon',
                        'file': path,
                        'line': idx + 1,
                        'type': 'style',
                        'severity': 'low',
                        'suggestion': 'Add semicolon at end of line'
                    })
        
        return enhancements
    
    def _check_json(self, path, content):
        """Check JSON files for enhancements."""
        enhancements = []
        
        try:
            data = json.loads(content)
            
            # Check for missing scripts in package.json
            if 'package.json' in path:
                scripts = data.get('scripts', {})
                if 'lint' not in scripts:
                    enhancements.append({
                        'title': 'Add lint script',
                        'description': 'package.json missing lint script for code quality checks',
                        'file': path,
                        'line': 1,
                        'type': 'best-practices',
                        'severity': 'low',
                        'suggestion': 'Add "lint": "eslint ." to scripts'
                    })
                
                if 'test' not in scripts:
                    enhancements.append({
                        'title': 'Add test script',
                        'description': 'package.json missing test script',
                        'file': path,
                        'line': 1,
                        'type': 'best-practices',
                        'severity': 'medium',
                        'suggestion': 'Add "test": "jest" to scripts'
                    })
        except:
            pass
        
        return enhancements
