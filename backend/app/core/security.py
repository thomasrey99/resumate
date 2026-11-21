
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx

from app.core.config import settings


bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials

    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {token}",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers=headers,
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=401,
                detail="Sesión inválida o expirada",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = response.json()

        if not user.get("id"):
            raise HTTPException(
                status_code=401,
                detail="No se pudo identificar al usuario",
            )

        return user

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con el servicio de autenticación",
        )
