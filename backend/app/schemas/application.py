
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class JobAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    job_description: str = Field(
        min_length=50,
        description="Texto completo de la descripción de la vacante",
    )
    job_url: HttpUrl | None = None


class RequirementDetail(BaseModel):
    name: str
    category: Literal[
        "technology",
        "framework",
        "database",
        "tool",
        "methodology",
        "programming_language",
        "soft_skill",
        "technical_skill",
        "language",
        "experience",
        "education",
        "certification",
        "other",
    ] = "other"
    importance: Literal[
        "mandatory",
        "preferred",
        "exclusion",
    ]
    requested_level: str | None = None
    evidence: str


class ExperienceRequirement(BaseModel):
    area: str | None = None
    min_years: float | None = None
    max_years: float | None = None
    seniority: str | None = None
    evidence: str


class LanguageRequirement(BaseModel):
    language: str
    requested_level: str | None = None
    cefr_level: Literal[
        "A1", "A2", "B1", "B2", "C1", "C2", "Native"
    ] | None = None
    importance: Literal[
        "mandatory",
        "preferred",
        "exclusion",
    ] = "mandatory"
    evidence: str


class TechnologyRequirement(BaseModel):
    name: str
    category: Literal[
        "frontend",
        "backend",
        "database",
        "cloud",
        "devops",
        "ai_ml",
        "testing",
        "data",
        "tools",
        "other",
    ] = "other"
    importance: Literal[
        "mandatory",
        "preferred",
        "exclusion",
    ]
    requested_level: str | None = None
    evidence: str


class EducationRequirement(BaseModel):
    qualification: str | None = None
    field_of_study: str | None = None
    importance: Literal[
        "mandatory",
        "preferred",
        "exclusion",
    ] = "preferred"
    evidence: str


class CertificationRequirement(BaseModel):
    name: str
    importance: Literal[
        "mandatory",
        "preferred",
        "exclusion",
    ] = "preferred"
    evidence: str


class ExclusionRequirement(BaseModel):
    category: Literal[
        "language",
        "location",
        "availability",
        "experience",
        "education",
        "certification",
        "other",
    ] = "other"
    description: str
    evidence: str


class JobAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")

    # Información general
    job_title: str | None = None
    company: str | None = None
    location: str | None = None
    employment_type: str | None = None
    work_mode: Literal["remote", "hybrid", "on_site"] | None = None
    seniority: str | None = None
    summary: str

    # Responsabilidades
    responsibilities: list[str] = Field(default_factory=list)

    # Requisitos originales, conservados para compatibilidad
    required_qualifications: list[str] = Field(default_factory=list)
    preferred_qualifications: list[str] = Field(default_factory=list)

    # Requisitos estructurados
    requirements: list[RequirementDetail] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    technology_requirements: list[TechnologyRequirement] = Field(
        default_factory=list
    )

    # Experiencia
    experience_requirements: list[ExperienceRequirement] = Field(
        default_factory=list
    )
    years_experience_min: float | None = None
    years_experience_max: float | None = None

    # Idiomas
    language_requirements: list[LanguageRequirement] = Field(
        default_factory=list
    )
    languages: list[str] = Field(default_factory=list)

    # Formación y certificaciones
    education_requirements: list[EducationRequirement] = Field(
        default_factory=list
    )
    certification_requirements: list[CertificationRequirement] = Field(
        default_factory=list
    )

    # Condiciones excluyentes
    exclusion_requirements: list[ExclusionRequirement] = Field(
        default_factory=list
    )
