"""Gemini integration using Google's Gen AI Python SDK (genai).
This module tries to use the official SDK. If unavailable, it falls back to heuristic detection.

Requirements:
  pip install google-generativeai

Authentication:
  Set GEMINI_API_KEY in env or pass into GeminiLLMReal(api_key=...)
"""
import os, json, textwrap, re, time, random
from dotenv import load_dotenv
from app.services.enhancement import CodeEnhancementAnalyzer
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

class GeminiLLMReal:
    def __init__(self, api_key: str = None, model: str = 'gemini-2.5-flash'):
        self.api_key = api_key or GEMINI_API_KEY
        self.model = model
        self.client = None
        self.enhancement_analyzer = CodeEnhancementAnalyzer()
        try:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
        except Exception as e:
            self.client = None
    
    def detect_issues(self, files):
        """Detect bugs, vulnerabilities, and issues."""
        prompt = self._build_issue_detection_prompt(files)
        # Use SDK if available
        if self.client:
            max_retries = 3
            base_delay = 2
            for attempt in range(max_retries):
                try:
                    resp = self.client.models.generate_content(model=self.model, contents=prompt)
                    text = resp.text
                    break
                except Exception as e:
                    if "429" in str(e) and attempt < max_retries - 1:
                        time.sleep(base_delay * (2 ** attempt) + random.uniform(0, 1))
                        continue
                    return self._heuristic_detect(files)
            else:
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
        if self.client:
            max_retries = 3
            base_delay = 2
            for attempt in range(max_retries):
                try:
                    resp = self.client.models.generate_content(model=self.model, contents=prompt)
                    patch_text = resp.text
                    return patch_text
                except Exception as e:
                    if "429" in str(e) and attempt < max_retries - 1:
                        time.sleep(base_delay * (2 ** attempt) + random.uniform(0, 1))
                        continue
                    return self._generate_fallback_patch(issues, files)
            else:
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
            You are a Senior Principal Software Engineer and Security Researcher.
            Analyze the provided code files deeply for:
            1. Critical Security Vulnerabilities (OWASP Top 10, Injection, Auth flaws)
            2. Major Bugs & Logic Errors
            3. severe Performance Bottlenecks
            4. Architectural Flaws

            Output MUST be a valid JSON array of objects.
            Schema:
            [
              {
                "title": "Short title of the issue",
                "description": "Detailed technical explanation",
                "severity": "high" | "medium" | "low",
                "file": "file_path",
                "line": line_number,
                "type": "bug" | "vuln" | "perf" | "arch",
                "suggested_fix": "Description of how to fix it"
              }
            ]

            Do not output markdown code blocks. Just the raw JSON string.
            If no issues are found, return [].
        """)
        parts = []
        for f in files:
            # Increased limit for better context
            safe_content = f['content'][:15000]
            parts.append(f"File: {f['path']}\nContent:\n{safe_content}\n")
        
        return header + "\n\n" + "\n".join(parts)

    def _build_patch_prompt(self, files, issues):
        header = textwrap.dedent("""
            You are a DevOps Engineer and Code Expert.
            Your task is to generate executable UNIFIED DIFF patches to fix the identified issues.
            
            Rules:
            1. Return ONLY the unified diffs. No explanations, no markdown.
            2. Each file patch must start with `diff --git a/path b/path` standard format or `--- a/path` and `+++ b/path`.
            3. Ensure context lines match exactly so the patch applies cleanly.
            4. Fix ALL high severity issues provided.

            Issues to fix:
            """ + json.dumps(issues, indent=2) + """
            
            Output format:
            --- a/path/to/file.py
            +++ b/path/to/file.py
            @@ -10,4 +10,4 @@
             original line
            -broken line
            +fixed line
             context line
        """)
        
        parts = []
        for f in files:
            # Provide full content for accurate patching
            safe_content = f['content'][:20000]
            parts.append(f"File: {f['path']}\nContent:\n{safe_content}\n")
        
        return header + "\n\n" + "\n".join(parts)
