
from fastapi import APIRouter, Depends
import httpx

from app.core.security import get_current_user
from app.core.supabase import get_supabase_client
from app.schemas.application import JobAnalysis, JobAnalysisRequest
from app.services.job_analyzer import analyze_job

router = APIRouter()


class JobAnalysisResponse(JobAnalysis):
    reused: bool = False


@router.post(
    "/cv/analyze-job",
    response_model=JobAnalysisResponse,
)
async def analyze_job_endpoint(
    request: JobAnalysisRequest,
    user: dict = Depends(get_current_user),
    client: httpx.AsyncClient = Depends(get_supabase_client),
):
    analysis, reused = await analyze_job(
        request=request,
        client=client,
        user_id=user["id"],
    )

    return JobAnalysisResponse(
        **analysis.model_dump(),
        reused=reused,
    )


@router.post("/cv/optimize")
async def optimize_cv():
    return {
        "message": "Endpoint de adaptación de CV pendiente",
        "status": "pending",
    }


@router.post("/cv/cover-letter")
async def generate_cover_letter():
    return {
        "message": "Endpoint de generación de carta pendiente",
        "status": "pending",
    }
