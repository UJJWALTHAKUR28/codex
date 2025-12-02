"""GitHub OAuth authentication endpoints."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import requests
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')
GITHUB_OAUTH_CALLBACK = os.getenv('GITHUB_OAUTH_CALLBACK', 'http://localhost:8000/auth/callback')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

@router.get("/login")
async def github_login():
    """Redirect to GitHub OAuth login page."""
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_OAUTH_CALLBACK}"
        f"&scope=repo,user:email"
    )
    return RedirectResponse(url=github_auth_url)

@router.get("/callback")
async def github_callback(code: str):
    """Handle GitHub OAuth callback and exchange code for access token."""
    try:
        # Exchange code for access token
        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code
            }
        )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        # Get user info
        user_response = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"}
        )
        
        user_data = user_response.json()
        
        # Redirect to frontend with token
        redirect_url = f"{FRONTEND_URL}/callback?token={access_token}&user={user_data.get('login')}"
        return RedirectResponse(url=redirect_url)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user")
async def get_user(access_token: str):
    """Get authenticated user information."""
    try:
        response = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return response.json()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
