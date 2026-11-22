
import httpx
from fastapi import HTTPException

from app.schemas.cv import ProfessionalProfile


async def get_professional_profile(
    client: httpx.AsyncClient,
    user_id: str,
) -> ProfessionalProfile:
    """
    Recupera toda la información profesional del usuario autenticado.
    Las consultas respetan las políticas RLS de Supabase.
    """

    tables = {
        "profile": ("profiles", "user_id"),
        "experiences": ("experiences", "user_id"),
        "education": ("education", "user_id"),
        "skills": ("skills", "user_id"),
        "projects": ("projects", "user_id"),
        "certifications": ("certifications", "user_id"),
        "languages": ("languages", "user_id"),
    }

    result = {}

    for key, (table, user_column) in tables.items():
        response = await client.get(
            f"/{table}",
            params={
                "select": "*",
                user_column: f"eq.{user_id}",
            },
        )

        if response.status_code not in (200, 206):
            raise HTTPException(
                status_code=502,
                detail=f"No se pudieron recuperar los datos de {table}",
            )

        data = response.json()

        if key == "profile":
            result[key] = data[0] if data else None
        else:
            result[key] = data

    return ProfessionalProfile(**result)
