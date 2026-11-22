from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ProfileData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: str | None = None
    professional_title: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    portfolio_url: str | None = None
    github_url: str | None = None
    professional_summary: str | None = None


class ExperienceData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    company: str
    position: str
    location: str | None = None
    employment_type: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    description: str | None = None
    achievements: Any = None


class EducationData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    description: str | None = None


class SkillData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    category: str | None = None
    proficiency: str | None = None


class ProjectData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    description: str | None = None
    technologies: list[str] = Field(default_factory=list)
    project_url: str | None = None
    repository_url: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class CertificationData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    issuing_organization: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None
    credential_url: str | None = None
    credential_id: str | None = None


class LanguageData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    proficiency: str | None = None
    certification: str | None = None


class ProfessionalProfile(BaseModel):
    profile: ProfileData | None = None
    experiences: list[ExperienceData] = Field(default_factory=list)
    education: list[EducationData] = Field(default_factory=list)
    skills: list[SkillData] = Field(default_factory=list)
    projects: list[ProjectData] = Field(default_factory=list)
    certifications: list[CertificationData] = Field(default_factory=list)
    languages: list[LanguageData] = Field(default_factory=list)
