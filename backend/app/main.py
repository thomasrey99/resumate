
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import health, applications, cv

app = FastAPI(
    title="Resumate API",
    description="API para la plataforma Resumate",
    version="1.0.0",
)

# Comunicación con Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas principales
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(applications.router, prefix="/api/v1", tags=["Applications"])
app.include_router(cv.router, prefix="/api/v1", tags=["CV"])


@app.get("/")
def root():
    return {
        "message": "Bienvenido a Resumate API",
        "version": "1.0.0",
    }
