from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.database import connect_db, close_db
from app.core.config import settings
from app.routes import auth, student, mentor, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="MIT VPU Internship Portal API",
    description="Backend API for MCA Semester IV Internship Management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — supports both local dev and Vercel deployment
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

vercel_url = os.environ.get("VERCEL_URL")
if vercel_url:
    allowed_origins.append(f"https://{vercel_url}")

custom_domain = os.environ.get("CUSTOM_DOMAIN")
if custom_domain:
    allowed_origins.append(f"https://{custom_domain}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routes
app.include_router(auth.router)
app.include_router(student.router)
app.include_router(mentor.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "MIT VPU Internship Portal API is running (FastAPI)"}
