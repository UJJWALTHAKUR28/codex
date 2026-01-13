from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router, auth
import logging
from dotenv import load_dotenv

load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Code Auditor API", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router.router, prefix="/api")
app.include_router(auth.router, prefix="/auth")

@app.get("/")
async def root():
    return {
        "message": "AI Code Auditor API",
        "version": "2.0.0",
        "features": [
            "Bug & Vulnerability Detection",
            "Code Enhancement Suggestions",
            "File Priority Ranking",
            "Deployment Configuration",
            "GitHub Integration",
            "Email Reports"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
