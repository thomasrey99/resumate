
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class JobAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    job_description: str = Field(
        min_length=50,
        description="Texto completo de la descripción de la vacante",
    )
    job_url: HttpUrl | None = None


class JobAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")

    job_title: str | None = None
    company: str | None = None
    location: str | None = None
    employment_type: str | None = None
    seniority: str | None = None
    summary: str
    responsibilities: list[str] = Field(default_factory=list)
    required_qualifications: list[str] = Field(default_factory=list)
    preferred_qualifications: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
