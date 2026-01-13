"""User repository management service."""
import requests
import logging

logger = logging.getLogger(__name__)
GITHUB_API = "https://api.github.com"

class UserReposService:
    """Fetch and manage user repositories from GitHub."""
    
    @staticmethod
    def get_user_repos(access_token: str):
        """
        Get all repositories for the authenticated user.
        
        Args:
            access_token: GitHub OAuth token
            
        Returns:
            List of repos with name, url, isPrivate, description
        """
        try:
            headers = {"Authorization": f"token {access_token}"}
            repos = []
            page = 1
            
            while True:
                resp = requests.get(
                    f"{GITHUB_API}/user/repos",
                    headers=headers,
                    params={"page": page, "per_page": 100}
                )
                
                if resp.status_code != 200:
                    logger.error(f"Failed to fetch repos: {resp.status_code}")
                    break
                    
                data = resp.json()
                if not data:
                    break
                
                for repo in data:
                    repos.append({
                        "name": repo.get("name"),
                        "full_name": repo.get("full_name"),
                        "url": repo.get("html_url"),
                        "clone_url": repo.get("clone_url"),
                        "isPrivate": repo.get("private", False),
                        "description": repo.get("description"),
                        "language": repo.get("language"),
                        "stars": repo.get("stargazers_count", 0)
                    })
                
                page += 1
            
            # Sort by stars descending
            repos.sort(key=lambda x: x.get("stars", 0), reverse=True)
            return repos
            
        except Exception as e:
            logger.error(f"Error fetching user repos: {str(e)}")
            return []
    
    @staticmethod
    def check_repo_access(access_token: str, repo_full_name: str):
        """
        Check if user can create PRs on a repository.
        For public repos, everyone with valid token can create PRs.
        
        Args:
            access_token: GitHub OAuth token
            repo_full_name: Repository in format "owner/repo"
            
        Returns:
            Boolean indicating if user can push/create PRs to repo
        """
        try:
            headers = {"Authorization": f"token {access_token}"}
            resp = requests.get(
                f"{GITHUB_API}/repos/{repo_full_name}",
                headers=headers
            )
            
            if resp.status_code != 200:
                return False
            
            repo = resp.json()
            is_public = not repo.get("private", False)
            
            # For public repos: anyone with valid token can create PRs
            # For private repos: only if user has push access
            if is_public:
                return True
            else:
                # Private repo: check if user has push permissions
                return repo.get("permissions", {}).get("push", False) or repo.get("permissions", {}).get("admin", False)
            
        except Exception as e:
            logger.error(f"Error checking repo access: {str(e)}")
            return False
    
    @staticmethod
    def get_public_repo(repo_full_name: str):
        """
        Get info about a public repository (no auth needed).
        
        Args:
            repo_full_name: Repository in format "owner/repo"
            
        Returns:
            Repo info dict or None if not found
        """
        try:
            resp = requests.get(
                f"{GITHUB_API}/repos/{repo_full_name}"
            )
            
            if resp.status_code != 200:
                return None
            
            repo = resp.json()
            return {
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "url": repo.get("html_url"),
                "clone_url": repo.get("clone_url"),
                "isPrivate": repo.get("private", False),
                "description": repo.get("description"),
                "language": repo.get("language"),
                "stars": repo.get("stargazers_count", 0)
            }
            
        except Exception as e:
            logger.error(f"Error fetching public repo: {str(e)}")
            return None

    @staticmethod
    def search_repositories(query: str, access_token: str = None):
        """
        Search for repositories on GitHub.
        
        Args:
            query: Search query (e.g. "user:octocat topic:react")
            access_token: Optional token for higher rate limits
            
        Returns:
            List of matching repos
        """
        try:
            headers = {}
            if access_token:
                headers["Authorization"] = f"token {access_token}"
                
            resp = requests.get(
                f"{GITHUB_API}/search/repositories",
                headers=headers,
                params={"q": query, "per_page": 20, "sort": "stars"}
            )
            
            if resp.status_code != 200:
                logger.error(f"GitHub search failed: {resp.status_code}")
                return []
            
            data = resp.json()
            items = data.get("items", [])
            
            repos = []
            for repo in items:
                repos.append({
                    "name": repo.get("name"),
                    "full_name": repo.get("full_name"),
                    "url": repo.get("html_url"),
                    "clone_url": repo.get("clone_url"),
                    "isPrivate": repo.get("private", False),
                    "description": repo.get("description"),
                    "language": repo.get("language"),
                    "stars": repo.get("stargazers_count", 0),
                    "owner": repo.get("owner", {}).get("login"),
                    "owner_avatar": repo.get("owner", {}).get("avatar_url")
                })
                
            return repos
            
        except Exception as e:
            logger.error(f"Error searching repos: {str(e)}")
            return []
