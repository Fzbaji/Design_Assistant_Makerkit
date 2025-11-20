"""
Backend FastAPI pour Optimisation Topologique avec SIMP
Déployé sur Railway - appelé par Next.js frontend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

# Charger variables d'environnement (avant les imports qui pourraient en avoir besoin)
load_dotenv()

# Import des routers
from app.routers import optimize, generate_3d

# Initialiser FastAPI
app = FastAPI(
    title="Topology Optimization API",
    description="Backend SIMP pour génération de pièces optimisées",
    version="1.0.0"
)

# Configuration CORS pour Next.js
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(optimize.router, prefix="/api", tags=["optimization"])
app.include_router(generate_3d.router, prefix="/api", tags=["3d-generation"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Topology Optimization API",
        "version": "1.0.0",
        "endpoints": {
            "optimize": "/api/optimize (POST)",
            "download_stl": "/api/download/{filename} (GET)"
        }
    }


@app.get("/health")
async def health():
    """Health check pour Railway"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    # Windows fix: disable reload pour éviter multiprocessing issues
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
