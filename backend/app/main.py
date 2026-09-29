from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import course, avatar

app = FastAPI(
    title="Adhyaya - Personalized AI Education Platform API",
    description="Backend API powering customized courses, tests, neurodivergent tutoring, and AI virtual teacher avatar generation.",
    version="2.0.0"
)

# Enable CORS for the frontend React app (typically http://localhost:5173 during Vite development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific origins like ["http://localhost:5173"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

# Mount static files directory for generated videos and audio
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(os.path.join(static_dir, "videos"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "audio"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include Routers
app.include_router(course.router)
app.include_router(avatar.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Adhyaya AI Education Platform API!",
        "status": "online",
        "docs_url": "/docs"
    }
