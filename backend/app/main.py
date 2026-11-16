
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Crear aplicación FastAPI
app = FastAPI(
    title="Resumate API",
    description="API para la plataforma Resumate",
    version="1.0.0"
)

# Configuración de comunicación con Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Bienvenido a Resumate API"
    }

@app.get("/api/v1/health")
def health():
    return {
        "status": "ok",
        "application": "Resumate"
    }
