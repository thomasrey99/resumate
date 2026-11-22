
import re
import unicodedata

from app.schemas.application import JobAnalysis, TechnologyRequirement


# ============================================================
# TECNOLOGÍAS Y CATEGORÍAS
# ============================================================

TECHNOLOGY_CATEGORIES = {
    "frontend": {
        "react",
        "next.js",
        "nextjs",
        "angular",
        "vue",
        "typescript",
        "javascript",
        "html",
        "css",
        "tailwind",
        "redux",
        "svelte",
    },
    "backend": {
        "python",
        "java",
        "node.js",
        "nodejs",
        "express",
        "fastapi",
        "django",
        "spring boot",
        "php",
        "ruby",
        "c#",
        "c++",
        "go",
        "apis rest",
        "rest api",
    },
    "database": {
        "postgresql",
        "postgres",
        "mysql",
        "mongodb",
        "redis",
        "sqlite",
        "qdrant",
        "supabase",
        "sql",
        "elasticsearch",
    },
    "cloud": {
        "aws",
        "azure",
        "gcp",
        "google cloud",
        "amazon web services",
    },
    "devops": {
        "docker",
        "kubernetes",
        "jenkins",
        "terraform",
        "github actions",
        "gitlab ci",
        "ci/cd",
    },
    "ai_ml": {
        "openai",
        "tensorflow",
        "pytorch",
        "langchain",
        "llamaindex",
        "rag",
        "machine learning",
        "deep learning",
        "embeddings",
    },
    "testing": {
        "pytest",
        "jest",
        "vitest",
        "playwright",
        "cypress",
        "selenium",
    },
    "data": {
        "power bi",
        "pandas",
        "numpy",
        "spark",
        "tableau",
    },
    "tools": {
        "git",
        "github",
        "jira",
        "figma",
    },
}


TECHNOLOGY_DISPLAY_NAMES = {
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "spring boot": "Spring Boot",
    "apis rest": "APIs REST",
    "rest api": "REST API",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "github actions": "GitHub Actions",
    "gitlab ci": "GitLab CI",
    "ci/cd": "CI/CD",
    "power bi": "Power BI",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "c#": "C#",
    "c++": "C++",
    "aws": "AWS",
    "gcp": "GCP",
    "rag": "RAG",
    "openai": "OpenAI",
    "qdrant": "Qdrant",
    "supabase": "Supabase",
    "pytest": "pytest",
}


REQUIREMENT_CATEGORY_MAP = {
    "frontend": "framework",
    "backend": "programming_language",
    "database": "database",
    "cloud": "tool",
    "devops": "tool",
    "ai_ml": "technology",
    "testing": "tool",
    "data": "technical_skill",
    "tools": "tool",
}


LEVEL_ALIASES = {
    "junior": "junior",
    "jr": "junior",
    "trainee": "junior",
    "entry level": "junior",
    "entry-level": "junior",
    "semi senior": "intermediate",
    "semi-senior": "intermediate",
    "semisenior": "intermediate",
    "intermediate": "intermediate",
    "mid": "intermediate",
    "mid-level": "intermediate",
    "middle": "intermediate",
    "senior": "senior",
    "sr": "senior",
    "advanced": "advanced",
    "avanzado": "advanced",
    "expert": "expert",
    "experto": "expert",
    "basic": "basic",
    "basico": "basic",
    "básico": "basic",
}


# ============================================================
# NORMALIZACIÓN DE TEXTO
# ============================================================

def normalize_text(value: str | None) -> str:
    """
    Normaliza texto para facilitar comparaciones.
    Elimina acentos, unifica mayúsculas y espacios.
    """
    if not value:
        return ""

    value = value.strip().casefold()
    value = unicodedata.normalize("NFKD", value)

    value = "".join(
        character
        for character in value
        if not unicodedata.combining(character)
    )

    value = re.sub(r"\s+", " ", value)

    return value


# ============================================================
# CLASIFICACIÓN DE TECNOLOGÍAS
# ============================================================

def infer_technology_category(name: str) -> str:
    """
    Devuelve la categoría de una tecnología conocida.
    """
    normalized_name = normalize_text(name)

    for category, technologies in TECHNOLOGY_CATEGORIES.items():
        normalized_technologies = {
            normalize_text(technology)
            for technology in technologies
        }

        if normalized_name in normalized_technologies:
            return category

    return "other"


def find_technology_category(text: str) -> str:
    """
    Busca tecnologías conocidas dentro de un texto.
    """
    normalized = normalize_text(text)

    for category, technologies in TECHNOLOGY_CATEGORIES.items():
        for technology in sorted(technologies, key=len, reverse=True):
            normalized_technology = normalize_text(technology)

            pattern = (
                rf"(?<!\w)"
                rf"{re.escape(normalized_technology)}"
                rf"(?!\w)"
            )

            if re.search(pattern, normalized):
                return category

    return "other"


# ============================================================
# CLASIFICACIÓN DE REQUISITOS
# ============================================================


def infer_requirement_category(name: str) -> str:
    """
    Determina la categoría de un requisito según su contenido.
    Utiliza exclusivamente categorías permitidas por Pydantic.
    """
    normalized_name = normalize_text(name)

    # Metodologías de trabajo.
    methodology_keywords = {
        "metodologia agil",
        "metodologias agiles",
        "scrum",
        "kanban",
        "agile",
        "safe",
        "extreme programming",
        "lean",
        "design thinking",
    }

    if any(keyword in normalized_name for keyword in methodology_keywords):
        return "methodology"

    # Idiomas humanos.
    language_keywords = {
        "ingles", "english", "espanol", "spanish",
        "portugues", "portuguese", "frances", "french",
        "aleman", "german", "italiano", "italian",
    }

    if any(keyword in normalized_name for keyword in language_keywords):
        return "language"

    # Experiencia laboral y trayectoria.
    experience_keywords = {
        "experiencia",
        "anos de experiencia",
        "trayectoria laboral",
        "experiencia profesional",
        "experiencia laboral",
    }

    if any(keyword in normalized_name for keyword in experience_keywords):
        return "experience"

    # Habilidades interpersonales.
    soft_skill_keywords = {
        "comunicacion",
        "trabajo en equipo",
        "liderazgo",
        "adaptabilidad",
        "resolucion de problemas",
        "pensamiento critico",
        "proactividad",
        "autonomia",
        "organizacion",
        "gestion del tiempo",
    }

    if any(keyword in normalized_name for keyword in soft_skill_keywords):
        return "soft_skill"

    # Lenguajes de programación: buscar por nombre,
    # aunque aparezcan dentro de una descripción más extensa.
    programming_languages = {
        "typescript",
        "javascript",
        "python",
        "java",
        "php",
        "ruby",
        "c++",
        "c#",
        "go",
    }

    for language in programming_languages:
        if re.search(rf"(?<!\w){re.escape(language)}(?!\w)", normalized_name):
            return "programming_language"

    # Clasificación basada en tecnologías conocidas.
    technology_category = find_technology_category(normalized_name)

    if technology_category == "database":
        return "database"

    if technology_category == "frontend":
        return "framework"

    if technology_category == "backend":
        if "api" in normalized_name:
            return "technical_skill"
        return "programming_language"

    if technology_category in REQUIREMENT_CATEGORY_MAP:
        return REQUIREMENT_CATEGORY_MAP[technology_category]

    return "other"


# ============================================================
# NORMALIZACIÓN DE NIVELES
# ============================================================

def normalize_requested_level(level: str | None) -> str | None:
    """
    Normaliza los niveles de experiencia solicitados.
    """
    if not level:
        return None

    normalized = normalize_text(level)

    return LEVEL_ALIASES.get(normalized, normalized)


# ============================================================
# RECUPERACIÓN DE TECNOLOGÍAS OMITIDAS
# ============================================================

def extract_technologies_from_requirements(
    analysis: JobAnalysis,
) -> None:
    """
    Recupera tecnologías conocidas presentes en requirements
    que el modelo no haya incluido en technology_requirements.

    Conserva la importancia y el nivel del requisito original.
    """

    existing = {
        normalize_text(item.name)
        for item in analysis.technology_requirements
    }

    for requirement in analysis.requirements:
        text = f"{requirement.name} {requirement.evidence}"
        normalized_text = normalize_text(text)

        for category, technologies in TECHNOLOGY_CATEGORIES.items():
            for technology in sorted(technologies, key=len, reverse=True):
                normalized_technology = normalize_text(technology)

                pattern = (
                    rf"(?<!\w)"
                    rf"{re.escape(normalized_technology)}"
                    rf"(?!\w)"
                )

                if not re.search(pattern, normalized_text):
                    continue

                if normalized_technology in existing:
                    continue

                display_name = TECHNOLOGY_DISPLAY_NAMES.get(
                    normalized_technology,
                    technology,
                )

                analysis.technology_requirements.append(
                    TechnologyRequirement(
                        name=display_name,
                        category=category,
                        importance=requirement.importance,
                        requested_level=requirement.requested_level,
                        evidence=requirement.evidence,
                    )
                )

                existing.add(normalized_technology)


# ============================================================
# NORMALIZACIÓN PRINCIPAL
# ============================================================

def normalize_job_analysis(analysis: JobAnalysis) -> JobAnalysis:
    """
    Normaliza y completa el análisis de una vacante.

    Responsabilidades:
    1. Recuperar tecnologías omitidas.
    2. Normalizar categorías y niveles tecnológicos.
    3. Clasificar requisitos.
    4. Reconstruir listas derivadas.
    """

    # 1. Recuperar tecnologías omitidas.
    extract_technologies_from_requirements(analysis)

    # 2. Normalizar technology_requirements.
    for technology in analysis.technology_requirements:
        inferred_category = infer_technology_category(
            technology.name
        )

        if inferred_category != "other":
            technology.category = inferred_category

        technology.requested_level = normalize_requested_level(
            technology.requested_level
        )

    # 3. Normalizar requirements.
    for requirement in analysis.requirements:
        requirement.category = infer_requirement_category(
            requirement.name
        )

        requirement.requested_level = normalize_requested_level(
            requirement.requested_level
        )

    # 4. Reconstruir required_qualifications.
    analysis.required_qualifications = [
        requirement.name
        for requirement in analysis.requirements
        if requirement.importance == "mandatory"
    ]

    # 5. Reconstruir preferred_qualifications.
    analysis.preferred_qualifications = [
        requirement.name
        for requirement in analysis.requirements
        if requirement.importance == "preferred"
    ]

    # 6. Reconstruir technologies.
    analysis.technologies = list(
        dict.fromkeys(
            technology.name
            for technology in analysis.technology_requirements
        )
    )

    # 7. Reconstruir languages.
    analysis.languages = list(
        dict.fromkeys(
            language.language
            for language in analysis.language_requirements
        )
    )

    return analysis
