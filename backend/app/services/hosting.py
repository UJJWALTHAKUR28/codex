"""Hosting provider configuration and deployment suggestion service."""

class HostingProvider:
    """Base hosting provider configuration."""
    
    def __init__(self, name, platform):
        self.name = name
        self.platform = platform
    
    def get_config_files(self):
        """Return list of config files needed for this provider."""
        return []
    
    def get_env_vars(self):
        """Return required environment variables."""
        return {}
    
    def get_deployment_steps(self):
        """Return deployment steps."""
        return []
    
    def get_suggestions(self):
        """Return enhancement suggestions for this provider."""
        return []


class VercelProvider(HostingProvider):
    """Vercel hosting configuration."""
    
    def __init__(self):
        super().__init__("Vercel", "Frontend + Backend")
    
    def get_config_files(self):
        return [
            {
                'name': 'vercel.json',
                'location': 'root',
                'content': '''{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "http://localhost:8000/api/$1"
    }
  ]
}'''
            }
        ]
    
    def get_env_vars(self):
        return {
            'NEXT_PUBLIC_API_URL': 'https://your-api.vercel.app',
            'GITHUB_CLIENT_ID': 'your_github_client_id',
            'GITHUB_CLIENT_SECRET': 'your_github_client_secret'
        }
    
    def get_deployment_steps(self):
        return [
            '1. Install Vercel CLI: npm i -g vercel',
            '2. Login: vercel login',
            '3. Deploy frontend: vercel deploy',
            '4. Configure environment variables in Vercel dashboard',
            '5. Connect GitHub repository for auto-deployment'
        ]
    
    def get_suggestions(self):
        return [
            'Add .vercelignore file to exclude unnecessary files',
            'Enable edge caching for API responses',
            'Use Vercel Analytics for performance monitoring',
            'Configure automatic deployments on git push'
        ]


class HerokuProvider(HostingProvider):
    """Heroku hosting configuration."""
    
    def __init__(self):
        super().__init__("Heroku", "Full Stack")
    
    def get_config_files(self):
        return [
            {
                'name': 'Procfile',
                'location': 'root',
                'content': '''web: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
release: alembic upgrade head'''
            },
            {
                'name': 'runtime.txt',
                'location': 'root',
                'content': 'python-3.11.7'
            }
        ]
    
    def get_env_vars(self):
        return {
            'DATABASE_URL': 'postgresql://...',
            'GITHUB_CLIENT_ID': 'your_github_client_id',
            'GITHUB_CLIENT_SECRET': 'your_github_client_secret',
            'GEMINI_API_KEY': 'your_gemini_key'
        }
    
    def get_deployment_steps(self):
        return [
            '1. Install Heroku CLI',
            '2. Login: heroku login',
            '3. Create app: heroku create your-app-name',
            '4. Deploy: git push heroku main',
            '5. Set env vars: heroku config:set KEY=VALUE'
        ]
    
    def get_suggestions(self):
        return [
            'Use Heroku Postgres for database',
            'Enable automatic deployments from GitHub',
            'Configure dyno types for performance',
            'Use Heroku Scheduler for background jobs',
            'Monitor with New Relic or Datadog'
        ]


class RailwayProvider(HostingProvider):
    """Railway hosting configuration."""
    
    def __init__(self):
        super().__init__("Railway", "Full Stack")
    
    def get_config_files(self):
        return [
            {
                'name': 'railway.toml',
                'location': 'root',
                'content': '''[build]
builder = "nixpacks"

[deploy]
startCommand = "python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"
'''
            }
        ]
    
    def get_env_vars(self):
        return {
            'GITHUB_CLIENT_ID': 'your_github_client_id',
            'GITHUB_CLIENT_SECRET': 'your_github_client_secret',
            'GEMINI_API_KEY': 'your_gemini_key'
        }
    
    def get_deployment_steps(self):
        return [
            '1. Connect GitHub repo to Railway',
            '2. Create new project',
            '3. Add environment variables',
            '4. Deploy automatically on git push'
        ]
    
    def get_suggestions(self):
        return [
            'Use Railway Postgres for database',
            'Enable GitHub integration for CD',
            'Monitor with Railway dashboard',
            'Use Railway secrets for sensitive data'
        ]


class HostingManager:
    """Manage all hosting providers and suggest best option."""
    
    PROVIDERS = {
        'vercel': VercelProvider(),
        'heroku': HerokuProvider(),
        'railway': RailwayProvider()
    }
    
    @classmethod
    def get_all_providers(cls):
        """Get all available hosting providers."""
        return {
            name: {
                'name': provider.name,
                'platform': provider.platform,
                'config_files': provider.get_config_files(),
                'env_vars': provider.get_env_vars(),
                'deployment_steps': provider.get_deployment_steps(),
                'suggestions': provider.get_suggestions()
            }
            for name, provider in cls.PROVIDERS.items()
        }
    
    @classmethod
    def get_provider(cls, provider_name: str):
        """Get specific provider configuration."""
        provider = cls.PROVIDERS.get(provider_name.lower())
        if not provider:
            return None
        
        return {
            'name': provider.name,
            'platform': provider.platform,
            'config_files': provider.get_config_files(),
            'env_vars': provider.get_env_vars(),
            'deployment_steps': provider.get_deployment_steps(),
            'suggestions': provider.get_suggestions()
        }
    
    @classmethod
    def suggest_provider(cls, project_type='full-stack'):
        """Suggest best hosting provider based on project type."""
        suggestions = {
            'full-stack': {
                'recommended': 'railway',
                'reason': 'Best for full-stack with built-in PostgreSQL',
                'alternatives': ['heroku', 'vercel']
            },
            'frontend-only': {
                'recommended': 'vercel',
                'reason': 'Optimized for Next.js applications',
                'alternatives': []
            },
            'backend-only': {
                'recommended': 'railway',
                'reason': 'Simple deployment with automatic scaling',
                'alternatives': ['heroku']
            },
            'serverless': {
                'recommended': 'railway',
                'reason': 'Modern alternative with automatic scaling',
                'alternatives': ['heroku']
            }
        }
        
        return suggestions.get(project_type, suggestions['full-stack'])
