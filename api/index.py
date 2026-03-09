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
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import connect_db, db as _db
from app.core.config import settings
from app.routes import auth, student, mentor, admin

# Create upload dir (safe on /tmp for Vercel)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="MIT VPU Internship Portal API",
    description="Backend API for MCA Semester IV Internship Management",
    version="1.0.0",
)


# Middleware to lazily connect DB on each request (serverless cold start safety)
@app.middleware("http")
async def ensure_db(request: Request, call_next):
    # Skip DB connection for health check
    if request.url.path == "/api/health":
        return await call_next(request)
    try:
        from app.core.database import db
        if db is None:
            await connect_db()
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"detail": f"Database connection failed: {str(e)}"}
        )
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
    from app.core.database import db
    return {
        "status": "ok",
        "message": "MIT VPU Internship Portal API is running on Vercel",
        "db_connected": db is not None,
        "mongodb_uri_set": bool(os.environ.get("MONGODB_URI")),
    }
