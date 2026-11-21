
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "application": "Resumate",
    }


from fastapi import Depends

from app.core.security import get_current_user


@router.get("/health/protected")
async def protected_health_check(user: dict = Depends(get_current_user)):
    return {
        "status": "ok",
        "user_id": user["id"],
    }
