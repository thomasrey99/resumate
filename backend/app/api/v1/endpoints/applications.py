
from fastapi import APIRouter

router = APIRouter()


@router.get("/applications")
def get_applications():
    return {
        "message": "Endpoint de postulaciones funcionando",
        "data": [],
    }


@router.get("/applications/{application_id}")
def get_application(application_id: str):
    return {
        "message": "Endpoint de detalle de postulación funcionando",
        "application_id": application_id,
    }
