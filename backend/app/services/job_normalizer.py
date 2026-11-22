
import re

from app.schemas.application import JobAnalysis


TECHNOLOGY_CATEGORIES = {
    "frontend": {
        "react", "next.js", "nextjs", "angular", "vue",
        "typescript", "javascript", "html", "css", "tailwind",
        "redux", "svelte",
    },
    "backend": {
        "python", "java", "node.js", "nodejs", "express",
        "fastapi", "django", "spring boot", "php", "ruby",
        "c#", "c++", "go", "apis rest", "rest api",
    },
    "database": {
        "postgresql", "postgres", "mysql", "mongodb",
        "redis", "sqlite", "qdrant", "supabase",
        "sql", "elasticsearch",
    },
    "cloud": {
        "aws", "azure", "gcp", "google cloud",
        "amazon web services",
    },
    "devops": {
        "docker", "kubernetes", "jenkins", "terraform",
        "github actions", "gitlab ci", "ci/cd",
    },
    "ai_ml": {
        "openai", "tensorflow", "pytorch", "langchain",
        "llamaindex", "rag", "machine learning",
        "deep learning", "embeddings",
    },
    "testing": {
        "pytest", "jest", "vitest", "playwright",
        "cypress", "selenium",
    },
    "data": {
        "power bi", "pandas", "numpy", "spark",
        "tableau",
    },
}

LEVEL_ALIASES = {
    "basico": "Básico",
    "basic": "Básico",
    "intermedio": "Intermedio",
    "intermediate": "Intermedio",
    "avanzado": "Avanzado",
    "advanced": "Avanzado",
    "experto": "Experto",
    "expert": "Experto",
    "nativo": "Nativo",
    "native": "Nativo",
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().casefold())


def infer_technology_category(name: str) -> str:
    normalized = normalize_text(name)

    for category, technologies in TECHNOLOGY_CATEGORIES.items():
        if normalized in technologies:
            return category

    return "other"


def normalize_requested_level(level: str | None) -> str | None:
    if not level:
        return None

    normalized = normalize_text(level)

    for alias, canonical in LEVEL_ALIASES.items():
        if alias in normalized:
            return canonical

    return level.strip()


def normalize_job_analysis(analysis: JobAnalysis) -> JobAnalysis:
    # Normalizar categorías y niveles de las tecnologías.
    for technology in analysis.technology_requirements:
        inferred_category = infer_technology_category(technology.name)

        if inferred_category != "other":
            technology.category = inferred_category

        technology.requested_level = normalize_requested_level(
            technology.requested_level
        )

    # Normalizar niveles de requisitos generales.
    for requirement in analysis.requirements:
        requirement.requested_level = normalize_requested_level(
            requirement.requested_level
        )

    # Completar las listas de compatibilidad.
    analysis.required_qualifications = list(dict.fromkeys(
        requirement.name
        for requirement in analysis.requirements
        if requirement.importance == "mandatory"
    ))

    analysis.preferred_qualifications = list(dict.fromkeys(
        requirement.name
        for requirement in analysis.requirements
        if requirement.importance == "preferred"
    ))

    # Evitar tecnologías duplicadas.
    analysis.technologies = list(dict.fromkeys(
        technology.name
        for technology in analysis.technology_requirements
    ))

    # Normalizar idiomas.
    analysis.languages = list(dict.fromkeys(
        language.language
        for language in analysis.language_requirements
    ))

    return analysis
