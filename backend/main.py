import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mcp.manager import mcp_manager

sys.path.insert(0, str(Path(__file__).parent))

load_dotenv()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await mcp_manager.startup()
    try:
        yield
    finally:
        await mcp_manager.shutdown()


app = FastAPI(
    title="Warden API",
    description="Autonomous Supply Chain Resilience Co-Pilot",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# import & register routes
from routes.agent import router as agent_router
from routes.dashboard import router as dashboard_router
from routes.actions import router as actions_router
from routes.company import router as company_router
from routes.upload import router as upload_router
from routes.perception import router as perception_router

app.include_router(agent_router)
app.include_router(dashboard_router)
app.include_router(actions_router)
app.include_router(company_router)
app.include_router(upload_router)
app.include_router(perception_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "name": "Warden API",
        "version": "1.0.0",
        "description": "Autonomous Supply Chain Resilience Co-Pilot",
        "status": "operational",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("BACKEND_HOST", "0.0.0.0"),
        port=int(os.getenv("BACKEND_PORT", "8000")),
        reload=True,
    )
