import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.seed import seed_database
from app.api.v1 import (
    auth, agents, executions, guardian,
    policies, approvals, security, audit,
    governance, dashboard, redteam, benchmark
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed baseline data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Runtime Security, Governance & Control Platform for AI Agents",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_v1 = FastAPI()
api_v1.include_router(auth.router)
api_v1.include_router(dashboard.router)
api_v1.include_router(agents.router)
api_v1.include_router(executions.router)
api_v1.include_router(guardian.router)
api_v1.include_router(policies.router)
api_v1.include_router(approvals.router)
api_v1.include_router(security.router)
api_v1.include_router(audit.router)
api_v1.include_router(governance.router)
api_v1.include_router(redteam.router)
api_v1.include_router(benchmark.router)

app.mount(settings.API_V1_STR, api_v1)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# Serve frontend static assets if built
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "product": "VerityLatch",
            "tagline": "Every AI action must be verified before it is executed.",
            "api_documentation": "/docs"
        }
