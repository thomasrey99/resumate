
from fastapi import APIRouter

router = APIRouter()


@router.post("/cv/analyze-job")
def analyze_job():
    return {
        "message": "Endpoint de análisis de vacantes funcionando",
        "status": "pending",
    }


@router.post("/cv/optimize")
def optimize_cv():
    return {
        "message": "Endpoint de adaptación de CV funcionando",
        "status": "pending",
    }


@router.post("/cv/cover-letter")
def generate_cover_letter():
    return {
        "message": "Endpoint de generación de carta funcionando",
        "status": "pending",
    }
