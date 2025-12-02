"""Gemini integration using Google's Gen AI Python SDK (genai).
This module tries to use the official SDK. If unavailable, it falls back to heuristic detection.

Requirements:
  pip install google-generativeai

Authentication:
  Set GEMINI_API_KEY in env or pass into GeminiLLMReal(api_key=...)
"""
import os, json, textwrap, re
from dotenv import load_dotenv
from app.services.enhancement import CodeEnhancementAnalyzer
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

class GeminiLLMReal:
    def __init__(self, api_key: str = None, model: str = 'gemini-1.5-mini'):
        self.api_key = api_key or GEMINI_API_KEY
        self.model = model
        self.genai = None
        self.model_obj = None
        self.enhancement_analyzer = CodeEnhancementAnalyzer()
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.genai = genai
            self.model_obj = genai.GenerativeModel(model)
        except Exception as e:
            self.genai = None
            self.model_obj = None
    
    def detect_issues(self, files):
        """Detect bugs, vulnerabilities, and issues."""
        prompt = self._build_issue_detection_prompt(files)
        # Use SDK if available
        if self.model_obj:
            try:
                resp = self.model_obj.generate_content(prompt)
                text = resp.text
            except Exception as e:
                return self._heuristic_detect(files)
        else:
            # Fallback: return heuristic detections
            return self._heuristic_detect(files)
        # Parse JSON from LLM output
        try:
            # Extract JSON if wrapped in markdown code blocks
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1].split('```')[0]
            issues = json.loads(text.strip())
            return issues if isinstance(issues, list) else [issues]
        except Exception:
            # If LLM returned plain text, return heuristic
            return self._heuristic_detect(files)
    
    def detect_enhancements(self, files):
        """Detect code enhancement opportunities."""
        return self.enhancement_analyzer.analyze_enhancements(files)
    
    def analyze_comprehensive(self, files):
        """Comprehensive analysis: issues + enhancements + file suggestions."""
        issues = self.detect_issues(files)
        enhancements = self.detect_enhancements(files)
        file_suggestions = self._suggest_files_to_update(files, issues, enhancements)
        
        return {
            'issues': issues,
            'enhancements': enhancements,
            'file_suggestions': file_suggestions
        }

    def generate_patch(self, files, issues):
        prompt = self._build_patch_prompt(files, issues)
        if self.model_obj:
            try:
                resp = self.model_obj.generate_content(prompt)
                patch_text = resp.text
                return patch_text
            except Exception as e:
                return self._generate_fallback_patch(issues, files)
        else:
            # Fallback simple patch
            return self._generate_fallback_patch(issues, files)

    def _generate_fallback_patch(self, issues, files):
        chunks = []
        for i in issues:
            if i.get('type')=='vuln' and 'eval' in i.get('title','').lower():
                path = i['file']
                chunks.append(f"*** Begin Patch for {path}\n--- a/{path}\n+++ b/{path}\n@@\n- [replaced eval]\n+ [safe_eval used]\n*** End Patch\n")
        return '\n'.join(chunks) if chunks else "# No patches generated"

    def _heuristic_detect(self, files):
        issues = []
        for f in files:
            c = f['content']
            if 'eval(' in c:
                issues.append({'title':'Use of eval() detected','description':f"Found eval() in {f['path']}",'severity':'high','file':f['path'],'line':self._find_line(c,'eval('),'type':'vuln'})
            if 'TODO' in c:
                issues.append({'title':'TODO found','description':f"TODO in {f['path']}",'severity':'low','file':f['path'],'line':self._find_line(c,'TODO'),'type':'style'})
        if not issues:
            issues.append({'title':'No issues detected','description':'No obvious issues found','severity':'low','file':'','line':0,'type':'info'})
        return issues

    def _find_line(self, content, needle):
        for idx, line in enumerate(content.splitlines(), start=1):
            if needle in line:
                return idx
        return 0

    def _suggest_files_to_update(self, files, issues, enhancements):
        """Suggest which files need updates based on analysis."""
        file_suggestions = {}
        
        # Add files with issues
        for issue in issues:
            if issue.get('file'):
                if issue['file'] not in file_suggestions:
                    file_suggestions[issue['file']] = {
                        'file': issue['file'],
                        'issues_count': 0,
                        'enhancements_count': 0,
                        'priority': 'medium',
                        'suggested_changes': []
                    }
                file_suggestions[issue['file']]['issues_count'] += 1
                file_suggestions[issue['file']]['suggested_changes'].append({
                    'type': 'fix',
                    'title': issue.get('title', ''),
                    'line': issue.get('line', 0)
                })
        
        # Add files with enhancements
        for enhancement in enhancements:
            if enhancement.get('file'):
                if enhancement['file'] not in file_suggestions:
                    file_suggestions[enhancement['file']] = {
                        'file': enhancement['file'],
                        'issues_count': 0,
                        'enhancements_count': 0,
                        'priority': 'low',
                        'suggested_changes': []
                    }
                file_suggestions[enhancement['file']]['enhancements_count'] += 1
                file_suggestions[enhancement['file']]['suggested_changes'].append({
                    'type': 'enhancement',
                    'title': enhancement.get('title', ''),
                    'line': enhancement.get('line', 0)
                })
        
        # Set priority based on issues count
        for file_key in file_suggestions:
            if file_suggestions[file_key]['issues_count'] > 0:
                file_suggestions[file_key]['priority'] = 'high'
            elif file_suggestions[file_key]['enhancements_count'] > 3:
                file_suggestions[file_key]['priority'] = 'medium'
        
        return list(file_suggestions.values())

    def _build_issue_detection_prompt(self, files):
        header = textwrap.dedent("""
            You are a code review assistant. Analyze the following files and return a JSON array of issues.
            Each issue must be a JSON object with keys: title, description, severity (low|medium|high), file, line, type (bug|vuln|style|info).
            Return only valid JSON — do not include extra explanation.
        """)
        parts = []
        for f in files:
            safe_content = f['content'][:4000]  # limit per file for prompt brevity
            parts.append({'path': f['path'], 'content': safe_content})
        payload = {'instructions': header, 'files': parts}
        return json.dumps(payload)

    def _build_patch_prompt(self, files, issues):
        header = textwrap.dedent("""
            You are an expert software engineer. Given the files and the list of issues, produce unified diff patches that fix the issues.
            Use standard unified diff format starting with '*** Begin Patch for <path>' and ending with '*** End Patch'.
            For each file include the full updated file content between those markers.
            Do not include explanations — only the patches.
        """)
        payload = { 'instructions': header, 'issues': issues, 'files': [{ 'path': f['path'], 'content': f['content'][:4000]} for f in files] }
        return json.dumps(payload)
