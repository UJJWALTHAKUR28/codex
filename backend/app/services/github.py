import requests
GITHUB_API = 'https://api.github.com'
class GitHubService:
    def __init__(self, token: str):
        self.token = token
        self.headers = { "Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json" }
    def parse_repo_url(self, url: str):
        """
        Parse GitHub URL or owner/repo format.
        Handles:
        - https://github.com/owner/repo
        - https://github.com/owner/repo.git
        - owner/repo
        """
        # Remove .git suffix if present
        url = url.rstrip('/').replace('.git', '')
        
        if url.startswith('http'):
            # Extract from URL: https://github.com/owner/repo -> owner, repo
            parts = url.split('/')
            # parts[-1] is repo, parts[-2] is owner
            repo = parts[-1]
            owner = parts[-2]
            return owner, repo
        else:
            # Already in owner/repo format
            parts = url.split('/')
            return parts[0], parts[1]
    def download_repo_zip(self, owner, repo):
        url = f"{GITHUB_API}/repos/{owner}/{repo}/zipball"
        r = requests.get(url, headers=self.headers)
        r.raise_for_status()
        return r.content
    def create_issue(self, owner, repo, title, body):
        url = f"{GITHUB_API}/repos/{owner}/{repo}/issues"
        data = {"title": title, "body": body}
        r = requests.post(url, headers=self.headers, json=data)
        r.raise_for_status()
        return r.json().get('html_url')
    def create_pull_request(self, owner, repo, head, base, title, body):
        url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls"
        data = {"title": title, "head": head, "base": base, "body": body}
        r = requests.post(url, headers=self.headers, json=data)
        r.raise_for_status()
        return r.json().get('html_url')
