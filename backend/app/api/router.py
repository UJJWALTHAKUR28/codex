from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.agents.orchestrator import run_job_sync, get_job_result
from app.services.github import GitHubService
from app.services.gitops import GitOps
from app.services.hosting import HostingManager
from app.services.email_report import EmailReportService, PDFReportGenerator
from app.services.user_repos import UserReposService
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter()

class AnalyzeRequest(BaseModel):
    repo_url: str
    access_token: str
    auto_issue: bool = False
    auto_pr: bool = False
    hosting_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    model_preference: Optional[str] = "gemini-2.5-flash"
    model_config = {"protected_namespaces": ()}

class AnalyzeRepoRequest(BaseModel):
    """Analyze a repository by owner/repo name."""
    repo_full_name: str  # e.g., "username/repo-name"
    access_token: str
    auto_issue: bool = False
    auto_pr: bool = False
    hosting_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    model_preference: Optional[str] = "gemini-2.5-flash"
    model_config = {"protected_namespaces": ()}

class CreateIssueRequest(BaseModel):
    job_id: str
    issue_title: str
    issue_body: str
    access_token: str

class CreatePRRequest(BaseModel):
    job_id: str
    access_token: str

class SendReportRequest(BaseModel):
    job_id: str
    recipient_email: str
    user_email: str
    user_name: str = "User"

@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Start analysis job with optional hosting config."""
    try:
        job_id = run_job_sync(req.dict())
        return {"job_id": job_id}
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-repo")
async def analyze_repo(req: AnalyzeRepoRequest):
    """Analyze a repository by owner/repo name."""
    try:
        # Convert repo_full_name to URL
        repo_url = f"https://github.com/{req.repo_full_name}.git"
        
        analyze_req = AnalyzeRequest(
            repo_url=repo_url,
            access_token=req.access_token,
            auto_issue=req.auto_issue,
            auto_pr=req.auto_pr,
            hosting_provider=req.hosting_provider,
            gemini_api_key=req.gemini_api_key,
            model_preference=req.model_preference
        )
        
        job_id = run_job_sync(analyze_req.dict())
        return {"job_id": job_id}
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/repos")
async def get_user_repos(access_token: str):
    """Get all repositories for the authenticated user."""
    try:
        repos = UserReposService.get_user_repos(access_token)
        return {"repos": repos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/github/search")
async def search_repos(q: str, access_token: Optional[str] = None):
    """Search for public repositories."""
    try:
        repos = UserReposService.search_repositories(q, access_token)
        return {"repos": repos}
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-pr-access")
async def check_pr_access(repo_full_name: str, access_token: str):
    """Check if user can create PRs on a repository."""
    try:
        has_access = UserReposService.check_repo_access(access_token, repo_full_name)
        return {"can_create_pr": has_access}
    except Exception as e:
        logger.error(f"Error checking PR access: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/repo/{repo_full_name}")
async def get_public_repo(repo_full_name: str):
    """Get info about a public repository (anyone can use)."""
    try:
        repo = UserReposService.get_public_repo(repo_full_name)
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")
        return repo
    except Exception as e:
        logger.error(f"Error fetching repo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{job_id}")
async def get_results(job_id: str):
    """Get analysis results for a job."""
    result = get_job_result(job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found or still running")
    return result

@router.post("/issue")
async def create_issue(req: CreateIssueRequest):
    """Create an issue from analysis result."""
    result = get_job_result(req.job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    gh = GitHubService(req.access_token)
    owner, repo_name = result['owner'], result['repo']
    
    issue_url = gh.create_issue(owner, repo_name, req.issue_title, req.issue_body)
    return {"issue_url": issue_url}

@router.post("/pr")
async def create_pr(req: CreatePRRequest):
    """Create a PR with fixes from analysis. Works for all public repos."""
    result = get_job_result(req.job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if 'patch' not in result or not result['patch']:
        raise HTTPException(status_code=400, detail="No patch available for this job")
    
    gitops = GitOps(req.access_token)
    owner, repo_name = result['owner'], result['repo']
    
    pr_url = gitops.create_pr_from_patch(owner, repo_name, result['patch'])
    result['pr_url'] = pr_url
    
    return {"pr_url": pr_url}

@router.post("/pr-enhancements")
async def create_enhancements_pr(req: CreatePRRequest):
    """Create a PR with code enhancement suggestions."""
    result = get_job_result(req.job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if 'enhancement_patch' not in result or not result['enhancement_patch']:
        raise HTTPException(status_code=400, detail="No enhancement suggestions for this job")
    
    gitops = GitOps(req.access_token)
    owner, repo_name = result['owner'], result['repo']
    
    pr_title = "🎨 AI Code Enhancements - Quality Improvements"
    pr_description = """## Code Enhancement Suggestions

This PR contains AI-suggested code improvements:

- 🚀 Performance optimizations
- 📚 Better documentation
- ✨ Code style improvements
- 🔒 Security hardening
- ♻️ Refactoring suggestions
- 🧪 Testing additions

Please review each suggestion and apply the ones that fit your project standards."""
    
    pr_url = gitops.create_pr_from_patch(
        owner, 
        repo_name, 
        result['enhancement_patch'],
        title=pr_title,
        description=pr_description
    )
    result['enhancement_pr_url'] = pr_url
    
    return {"pr_url": pr_url}

@router.post("/pr-deployment")
async def create_deployment_pr(req: CreatePRRequest):
    """Create a PR with deployment configuration."""
    result = get_job_result(req.job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if 'deployment_patch' not in result or not result['deployment_patch']:
        raise HTTPException(status_code=400, detail="No deployment configuration for this job")
    
    gitops = GitOps(req.access_token)
    owner, repo_name = result['owner'], result['repo']
    
    hosting_name = result.get('hosting_config', {}).get('name', 'Hosting')
    pr_title = f"🚀 {hosting_name} Deployment Configuration"
    pr_description = f"""## {hosting_name} Deployment Configuration

This PR adds all necessary configuration files for deploying to {hosting_name}:

✅ Configuration files (vercel.json, Procfile, etc.)
✅ Environment variables template (.env.example)
✅ Deployment guide (DEPLOYMENT.md)

**Steps to deploy:**
1. Review and merge this PR
2. Follow DEPLOYMENT.md for setup
3. Configure environment variables
4. Deploy!"""
    
    pr_url = gitops.create_pr_from_patch(
        owner, 
        repo_name, 
        result['deployment_patch'],
        title=pr_title,
        description=pr_description
    )
    result['deployment_pr_url'] = pr_url
    
    return {"pr_url": pr_url}

@router.get("/hosting/providers")
async def get_hosting_providers():
    """Get all available hosting providers."""
    return HostingManager.get_all_providers()

@router.get("/hosting/provider/{provider_name}")
async def get_hosting_provider(provider_name: str):
    """Get specific hosting provider configuration."""
    config = HostingManager.get_provider(provider_name)
    if not config:
        raise HTTPException(status_code=404, detail="Provider not found")
    return config

@router.get("/hosting/suggest")
async def suggest_hosting(project_type: str = 'full-stack'):
    """Get hosting provider suggestion based on project type."""
    return HostingManager.suggest_provider(project_type)

@router.post("/send-report")
async def send_report(req: SendReportRequest):
    """Send analysis report via email as PDF."""
    result = get_job_result(req.job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    try:
        # Try to generate PDF report
        email_service = EmailReportService()
        response = email_service.send_report(
            recipient_email=req.recipient_email,
            analysis_result=result,
            user_email=req.user_email,
            user_name=req.user_name
        )
        
        if not response['success']:
            # Fallback to simple HTML email if PDF fails
            response = EmailReportService.send_simple_report(
                recipient_email=req.recipient_email,
                analysis_result=result,
                user_email=req.user_email,
                user_name=req.user_name
            )
        
        if response['success']:
            return {"success": True, "message": response['message']}
        else:
            raise HTTPException(status_code=500, detail=response['message'])
    
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send report: {str(e)}")

@router.post("/download-report/{job_id}")
async def download_report(job_id: str):
    """Download analysis report as PDF."""
    result = get_job_result(job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    try:
        pdf_content = PDFReportGenerator.generate_pdf_report(result)
        
        return {
            "pdf": pdf_content.hex(),
            "filename": f"audit_report_{result.get('owner', 'repo')}_{result.get('repo', 'name')}.pdf"
        }
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

