import tempfile, shutil, os
from git import Repo
from app.utils.patch import apply_unified_diff
from uuid import uuid4
class GitOps:
    def __init__(self, token: str = None):
        self.token = token
    def create_pr_from_patch(self, owner, repo, patch, base_branch='main', title=None, description=None):
        clone_url = f"https://{self.token}@github.com/{owner}/{repo}.git" if self.token else f"https://github.com/{owner}/{repo}.git"
        tmpdir = tempfile.mkdtemp()
        try:
            repo_obj = Repo.clone_from(clone_url, tmpdir)
            new_branch = f"ai-fix-{uuid4().hex[:8]}"
            repo_obj.git.checkout('-b', new_branch)
            apply_unified_diff(tmpdir, patch)
            repo_obj.git.add(all=True)
            
            commit_message = title or 'AI: apply automated fixes'
            repo_obj.index.commit(commit_message)
            repo_obj.remotes.origin.push(refspec=f"{new_branch}:{new_branch}")
            from app.services.github import GitHubService
            gh = GitHubService(self.token)
            pr_title = title or 'AI: automated fixes'
            pr_body = description or 'Automated fixes by AI'
            pr_url = gh.create_pull_request(owner, repo, head=new_branch, base=base_branch, title=pr_title, body=pr_body)
            return pr_url
        finally:
            try:
                shutil.rmtree(tmpdir)
            except Exception:
                pass
