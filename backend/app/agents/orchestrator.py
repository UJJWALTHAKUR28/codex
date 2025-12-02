import uuid
from app.services.github import GitHubService
from app.services.scanner import RepoScanner
from app.services.llm_gemini_real import GeminiLLMReal
from app.services.gitops import GitOps
from app.services.hosting import HostingManager
from app.services.code_fixer import EnhancementPatchGenerator, DeploymentConfigGenerator

JOBS = {}

def run_job_sync(payload: dict) -> str:
    """Run analysis job synchronously."""
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {'status': 'running', 'progress': 'Starting analysis...'}

    try:
        token = payload['access_token']
        repo_url = payload['repo_url']
        auto_issue = payload.get('auto_issue', False)
        auto_pr = payload.get('auto_pr', False)
        hosting_provider = payload.get('hosting_provider', None)

        gh = GitHubService(token)
        owner, repo = gh.parse_repo_url(repo_url)
        
        JOBS[job_id]['progress'] = 'Downloading repository...'
        archive = gh.download_repo_zip(owner, repo)
        
        JOBS[job_id]['progress'] = 'Scanning files...'
        scanner = RepoScanner()
        files = scanner.extract_and_scan(archive)
        
        JOBS[job_id]['progress'] = 'Analyzing with AI...'
        llm = GeminiLLMReal()
        
        # Comprehensive analysis: issues, enhancements, file suggestions
        analysis = llm.analyze_comprehensive(files)
        issues = analysis['issues']
        enhancements = analysis['enhancements']
        file_suggestions = analysis['file_suggestions']
        
        # Generate patch
        JOBS[job_id]['progress'] = 'Generating patches...'
        patch = llm.generate_patch(files, issues) if issues else None
        
        # Get hosting suggestions if provider selected
        hosting_config = None
        if hosting_provider:
            JOBS[job_id]['progress'] = f'Generating {hosting_provider} deployment config...'
            hosting_config = HostingManager.get_provider(hosting_provider)
        
        result = {
            'owner': owner, 
            'repo': repo, 
            'files': files,
            'issues': issues,
            'enhancements': enhancements,
            'file_suggestions': file_suggestions,
            'patch': patch,
            'hosting_config': hosting_config,
            'enhancement_patch': EnhancementPatchGenerator.generate_enhancement_patch(enhancements, files),
            'deployment_patch': DeploymentConfigGenerator.generate_deployment_patch(hosting_config, repo) if hosting_config else None,
            'created_issues': [], 
            'pr_url': None,
            'enhancement_pr_url': None,
            'deployment_pr_url': None
        }

        if auto_issue and issues:
            JOBS[job_id]['progress'] = 'Creating issues...'
            for i in issues:
                try:
                    url = gh.create_issue(owner, repo, i['title'], i['description'])
                    result['created_issues'].append(url)
                except Exception as e:
                    print(f"Failed to create issue: {e}")

        if auto_pr and issues and patch:
            JOBS[job_id]['progress'] = 'Creating pull request...'
            try:
                gitops = GitOps(token)
                pr_url = gitops.create_pr_from_patch(owner, repo, patch, base_branch='main')
                result['pr_url'] = pr_url
            except Exception as e:
                print(f"Failed to create PR: {e}")

        JOBS[job_id]['status'] = 'done'
        JOBS[job_id]['result'] = result
        
    except Exception as e:
        JOBS[job_id]['status'] = 'error'
        JOBS[job_id]['error'] = str(e)
    
    return job_id

def get_job_result(job_id: str):
    """Get result of a job."""
    job = JOBS.get(job_id)
    if not job:
        return None
    
    if job['status'] == 'running':
        return {'status': 'running', 'progress': job.get('progress', 'Processing...')}
    
    if job['status'] == 'error':
        return {'status': 'error', 'error': job.get('error', 'Unknown error')}
    
    return {'status': 'done', **job.get('result', {})}
