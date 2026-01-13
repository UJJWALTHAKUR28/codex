import uuid
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END, add_messages
from app.services.github import GitHubService
from app.services.scanner import RepoScanner
from app.services.llm_gemini_real import GeminiLLMReal
from app.services.gitops import GitOps
from app.services.hosting import HostingManager
from app.services.code_fixer import EnhancementPatchGenerator, DeploymentConfigGenerator

JOBS = {}

class AgentState(TypedDict):
    job_id: str
    token: str
    repo_url: str
    auto_issue: bool
    auto_pr: bool
    hosting_provider: str
    owner: str
    repo: str
    files: list
    issues: list
    enhancements: list
    file_suggestions: list
    patch: str
    hosting_config: dict
    enhancement_patch: str
    deployment_patch: str
    created_issues: list
    pr_url: str
    enhancement_pr_url: str
    deployment_pr_url: str
    messages: Annotated[list, add_messages]
    next_action: str
    gemini_api_key: str
    model_preference: str

# Agent Nodes
def repo_agent(state: AgentState) -> AgentState:
    """Agent responsible for repository operations."""
    JOBS[state['job_id']]['progress'] = 'Downloading repository...'
    gh = GitHubService(state['token'])
    owner, repo = gh.parse_repo_url(state['repo_url'])
    archive = gh.download_repo_zip(owner, repo)
    
    JOBS[state['job_id']]['progress'] = 'Scanning files...'
    scanner = RepoScanner()
    files = scanner.extract_and_scan(archive)
    
    return {
        **state,
        'owner': owner,
        'repo': repo,
        'files': files,
        'messages': [f"Repository {owner}/{repo} downloaded and scanned"]
    }

def analysis_agent(state: AgentState) -> AgentState:
    """Agent responsible for code analysis."""
    JOBS[state['job_id']]['progress'] = 'Deep Analysis with AI...'
    llm = GeminiLLMReal(api_key=state.get('gemini_api_key'), model=state.get('model_preference', 'gemini-2.5-flash'))
    
    # Perform comprehensive analysis using the new robust prompts
    analysis = llm.analyze_comprehensive(state['files'])
    
    return {
        **state,
        'issues': analysis['issues'],
        'enhancements': analysis['enhancements'],
        'file_suggestions': analysis['file_suggestions'],
        'messages': state['messages'] + [f"Deep Analysis complete: Found {len(analysis['issues'])} critical issues"]
    }

def patch_agent(state: AgentState) -> AgentState:
    """Agent responsible for generating patches."""
    JOBS[state['job_id']]['progress'] = 'Generating Engineering Fixes...'
    llm = GeminiLLMReal(api_key=state.get('gemini_api_key'), model=state.get('model_preference', 'gemini-2.5-flash'))
    
    # Generate unified diff using the robust patch prompt
    patch = llm.generate_patch(state['files'], state['issues']) if state['issues'] else None
    
    # Keep enhancement patches separate
    enhancement_patch = EnhancementPatchGenerator.generate_enhancement_patch(state['enhancements'], state['files'])
    
    hosting_config = None
    deployment_patch = None
    if state['hosting_provider']:
        hosting_config = HostingManager.get_provider(state['hosting_provider'])
        deployment_patch = DeploymentConfigGenerator.generate_deployment_patch(hosting_config, state['repo'])
    
    return {
        **state,
        'patch': patch,
        'hosting_config': hosting_config,
        'enhancement_patch': enhancement_patch,
        'deployment_patch': deployment_patch,
        'messages': state['messages'] + ["Engineering fixes generated"]
    }

def coordinator_agent(state: AgentState) -> AgentState:
    """Agent that decides next actions based on analysis."""
    next_actions = []
    
    if state['auto_issue'] and state['issues']:
        next_actions.append('create_issues')
    if state['auto_pr'] and state['issues'] and state['patch']:
        next_actions.append('create_pr')
    if not next_actions:
        next_actions.append('finish')
    
    return {
        **state,
        'next_action': next_actions[0],
        'messages': state['messages'] + [f"Coordinator decided: {next_actions[0]}"]
    }

def action_agent(state: AgentState) -> AgentState:
    """Agent responsible for GitHub actions."""
    gh = GitHubService(state['token'])
    created_issues = []
    pr_url = None
    
    if state['auto_issue'] and state['issues']:
        JOBS[state['job_id']]['progress'] = 'Creating issues...'
        for issue in state['issues']:
            try:
                url = gh.create_issue(state['owner'], state['repo'], issue['title'], issue['description'])
                created_issues.append(url)
            except Exception as e:
                print(f"Failed to create issue: {e}")
    
    if state['auto_pr'] and state['issues'] and state['patch']:
        JOBS[state['job_id']]['progress'] = 'Creating pull request...'
        try:
            gitops = GitOps(state['token'])
            pr_url = gitops.create_pr_from_patch(state['owner'], state['repo'], state['patch'])
        except Exception as e:
            print(f"Failed to create PR: {e}")
    
    return {
        **state,
        'created_issues': created_issues,
        'pr_url': pr_url,
        'messages': state['messages'] + [f"Created {len(created_issues)} issues, PR: {pr_url}"]
    }

def should_continue(state: AgentState) -> str:
    """Router function to determine next step."""
    if state.get('next_action') == 'create_issues' or state.get('next_action') == 'create_pr':
        return 'action_agent'
    return END

# Build LangGraph workflow
def create_workflow():
    workflow = StateGraph(AgentState)
    
    # Add agent nodes
    workflow.add_node("repo_agent", repo_agent)
    workflow.add_node("analysis_agent", analysis_agent)
    workflow.add_node("patch_agent", patch_agent)
    workflow.add_node("coordinator_agent", coordinator_agent)
    workflow.add_node("action_agent", action_agent)
    
    # Define workflow edges
    workflow.set_entry_point("repo_agent")
    workflow.add_edge("repo_agent", "analysis_agent")
    workflow.add_edge("analysis_agent", "patch_agent")
    workflow.add_edge("patch_agent", "coordinator_agent")
    workflow.add_conditional_edges(
        "coordinator_agent",
        should_continue,
        {
            "action_agent": "action_agent",
            END: END
        }
    )
    workflow.add_edge("action_agent", END)
    
    return workflow.compile()

def run_job_sync(payload: dict) -> str:
    """Run analysis job using LangGraph agents."""
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {'status': 'running', 'progress': 'Starting agentic analysis...'}
    
    try:
        # Initialize agent state
        initial_state = AgentState(
            job_id=job_id,
            token=payload['access_token'],
            repo_url=payload['repo_url'],
            auto_issue=payload.get('auto_issue', False),
            auto_pr=payload.get('auto_pr', False),
            hosting_provider=payload.get('hosting_provider', None),
            owner='',
            repo='',
            files=[],
            issues=[],
            enhancements=[],
            file_suggestions=[],
            patch='',
            hosting_config={},
            enhancement_patch='',
            deployment_patch='',
            created_issues=[],
            pr_url='',
            enhancement_pr_url='',
            deployment_pr_url='',
            messages=[],
            next_action='',
            gemini_api_key=payload.get('gemini_api_key'),
            model_preference=payload.get('model_preference', 'gemini-2.5-flash')
        )
        
        # Run LangGraph workflow
        workflow = create_workflow()
        final_state = workflow.invoke(initial_state)
        
        # Prepare result
        result = {
            'owner': final_state['owner'],
            'repo': final_state['repo'],
            'files': final_state['files'],
            'issues': final_state['issues'],
            'enhancements': final_state['enhancements'],
            'file_suggestions': final_state['file_suggestions'],
            'patch': final_state['patch'],
            'hosting_config': final_state['hosting_config'],
            'enhancement_patch': final_state['enhancement_patch'],
            'deployment_patch': final_state['deployment_patch'],
            'created_issues': final_state['created_issues'],
            'pr_url': final_state['pr_url'],
            'enhancement_pr_url': final_state['enhancement_pr_url'],
            'deployment_pr_url': final_state['deployment_pr_url'],
            'agent_messages': final_state['messages']
        }
        
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
