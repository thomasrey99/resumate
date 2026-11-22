
import hashlib
import re

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.application import JobAnalysis, JobAnalysisRequest
from app.services.openai_service import generate_job_analysis


def generate_content_hash(description: str) -> str:
    """Genera una huella del texto normalizado de la vacante."""

    normalized = re.sub(r"\s+", " ", description).strip().casefold()

    return hashlib.sha256(
        normalized.encode("utf-8")
    ).hexdigest()


async def analyze_job(
    request: JobAnalysisRequest,
    client: httpx.AsyncClient,
    user_id: str,
) -> tuple[JobAnalysis, bool]:
    """
    Recupera un análisis existente o genera uno nuevo.
    El booleano indica si se reutilizó un análisis guardado.
    """

    content_hash = generate_content_hash(request.job_description)

    # 1. Buscar un análisis previo del mismo usuario.
    response = await client.get(
        "/job_analyses",
        params={
            "select": "analysis",
            "user_id": f"eq.{user_id}",
            "content_hash": f"eq.{content_hash}",
            "limit": "1",
        },
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="No se pudo consultar el historial de análisis.",
        )

    existing = response.json()

    if existing:
        return JobAnalysis(**existing[0]["analysis"]), True

    # 2. Generar un análisis nuevo con OpenAI.
    try:
        analysis = await generate_job_analysis(
            request.job_description
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    # 3. Guardar el resultado en Supabase.
    payload = {
        "user_id": user_id,
        "job_description": request.job_description,
        "job_url": str(request.job_url) if request.job_url else None,
        "content_hash": content_hash,
        "analysis": analysis.model_dump(mode="json"),
        "model": settings.openai_model,
    }

    save_response = await client.post(
        "/job_analyses",
        json=payload,
        headers={"Prefer": "return=representation"},
    )

    if save_response.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail="El análisis se generó, pero no se pudo guardar.",
        )

    return analysis, False
