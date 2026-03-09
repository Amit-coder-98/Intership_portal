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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import connect_db, close_db, db as _db
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


# Middleware to ensure DB is connected on every request (serverless cold start safety)
@app.middleware("http")
async def ensure_db(request: Request, call_next):
    from app.core.database import db
    if db is None:
        await connect_db()
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
