
from fastapi import APIRouter, Depends, HTTPException
import httpx

from app.core.supabase import get_supabase_client
from app.core.security import get_current_user
from app.schemas.cv import ProfessionalProfile
from app.services.profile_service import get_professional_profile

router = APIRouter()


@router.get("/profile/me")
async def get_my_profile(
    user: dict = Depends(get_current_user),
    client: httpx.AsyncClient = Depends(get_supabase_client),
):
    response = await client.get(
        "/profiles",
        params={
            "select": "*",
            "user_id": f"eq.{user['id']}",
            "limit": "1",
        },
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="No se pudo recuperar el perfil profesional",
        )

    profiles = response.json()

    if not profiles:
        raise HTTPException(
            status_code=404,
            detail="El usuario todavía no tiene un perfil creado",
        )

    return profiles[0]


@router.get("/profile/me/full", response_model=ProfessionalProfile)
async def get_my_full_profile(
    user: dict = Depends(get_current_user),
    client: httpx.AsyncClient = Depends(get_supabase_client),
):
    return await get_professional_profile(
        client=client,
        user_id=user["id"],
    )
