"""
Vercel Serverless Function entry point.
Wraps the existing FastAPI app for Vercel's serverless Python runtime.
"""
import sys
import os

# Add server_fastapi directory to Python path so 'app' package resolves
# On Vercel, the project root is the working directory
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
server_path = os.path.join(project_root, 'server_fastapi')
if server_path not in sys.path:
    sys.path.insert(0, server_path)

# Also add project root itself
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import connect_db, close_db
from app.core.config import settings
from app.routes import auth, student, mentor, admin


@asynccontextmanager
async def lifespan(application: FastAPI):
    await connect_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    await close_db()


app = FastAPI(
    title="MIT VPU Internship Portal API",
    description="Backend API for MCA Semester IV Internship Management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Vercel deployment domain + localhost for dev
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add Vercel deployment URL if set
vercel_url = os.getenv("VERCEL_URL")
if vercel_url:
    allowed_origins.append(f"https://{vercel_url}")

# Add custom domain if set
custom_domain = os.getenv("CUSTOM_DOMAIN")
if custom_domain:
    allowed_origins.append(f"https://{custom_domain}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins on Vercel (same-origin requests)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(student.router)
app.include_router(mentor.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "MIT VPU Internship Portal API is running on Vercel"}
