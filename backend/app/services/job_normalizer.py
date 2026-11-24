
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
    Clasifica un requisito según su naturaleza:
    lenguaje, framework, base de datos, herramienta,
    metodología, habilidad o experiencia.
    """
    normalized_name = normalize_text(name)
    padded_name = f" {normalized_name} "

    def contains_any(keywords: set[str]) -> bool:
        return any(
            f" {keyword} " in padded_name
            for keyword in keywords
        )

    # Formación académica.
    education_keywords = {
        "titulo universitario",
        "titulo de grado",
        "formacion academica",
        "estudios universitarios",
        "estudios avanzados",
        "carrera universitaria",
        "licenciatura",
        "ingenieria",
        "ingeniero",
        "ingeniera",
        "tecnicatura",
        "tecnico universitario",
        "grado academico",
        "ciencias de la computacion",
        "ingenieria en sistemas",
    }

    if contains_any(education_keywords):
        return "education"

    # Certificaciones.
    certification_keywords = {
        "certificacion",
        "certificado profesional",
        "certificacion profesional",
        "certificacion tecnica",
        "certified",
        "certificate",
        "certification",
    }

    if contains_any(certification_keywords):
        return "certification"

    # Metodologías.
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

    if contains_any(methodology_keywords):
        return "methodology"

    # Idiomas humanos.
    language_keywords = {
        "ingles", "english",
        "espanol", "spanish",
        "portugues", "portuguese",
        "frances", "french",
        "aleman", "german",
        "italiano", "italian",
    }

    if contains_any(language_keywords):
        return "language"

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

    if contains_any(soft_skill_keywords):
        return "soft_skill"

    # Lenguajes de programación.
    programming_languages = {
        "javascript",
        "typescript",
        "python",
        "java",
        "c++",
        "c#",
        "golang",
        "go",
        "php",
        "ruby",
        "swift",
        "kotlin",
        "rust",
        "scala",
        "dart",
        "r",
    }

    if contains_any(programming_languages):
        return "programming_language"

    # Frameworks y librerías.
    frameworks = {
        "react",
        "next.js",
        "nextjs",
        "angular",
        "vue",
        "svelte",
        "django",
        "flask",
        "fastapi",
        "spring",
        "spring boot",
        "express",
        "nestjs",
        "node.js express",
        "laravel",
        "symfony",
        "asp.net",
        ".net",
        "tailwind",
        "bootstrap",
    }

    if contains_any(frameworks):
        return "framework"

    # Categorías tecnológicas ya conocidas.
    technology_category = find_technology_category(normalized_name)

    if technology_category in REQUIREMENT_CATEGORY_MAP:
        return REQUIREMENT_CATEGORY_MAP[technology_category]

    # APIs y arquitectura son habilidades técnicas,
    # no lenguajes ni frameworks.
    technical_keywords = {
        "api",
        "apis",
        "rest",
        "restful",
        "microservicios",
        "arquitectura de software",
        "integracion de servicios",
        "desarrollo backend",
        "desarrollo frontend",
    }

    if contains_any(technical_keywords):
        return "technical_skill"

    # Experiencia laboral.
    experience_keywords = {
        "anos de experiencia",
        "año de experiencia",
        "años de experiencia",
        "experiencia laboral",
        "experiencia profesional",
        "trayectoria laboral",
        "experiencia general",
        "experiencia en desarrollo de software",
    }

    if contains_any(experience_keywords):
        return "experience"

    return "other"

# ============================================================
# NORMALIZACIÓN DE NIVELES
# ============================================================


def normalize_requested_level(
    level: str | None,
    text: str | None = None,
) -> str | None:
    """
    Normaliza el nivel solicitado.
    Si no recibe un nivel, intenta recuperarlo del texto del requisito.
    """
    if level:
        normalized = normalize_text(level)
        return LEVEL_ALIASES.get(normalized, normalized)

    if not text:
        return None

    normalized_text = normalize_text(text)

    level_keywords = {
        "advanced": [
            "avanzado",
            "avanzada",
            "advanced",
            "experto",
            "experta",
            "expert",
        ],
        "intermediate": [
            "intermedio",
            "intermedia",
            "intermediate",
            "mid level",
        ],
        "beginner": [
            "basico",
            "basica",
            "principiante",
            "beginner",
            "junior",
        ],
    }

    for level_name, keywords in level_keywords.items():
        if any(keyword in normalized_text for keyword in keywords):
            return level_name

    return None



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

    Conserva las estructuras especializadas y evita sobrescribir
    categorías válidas con clasificaciones incorrectas.
    """

    # 1. Recuperar tecnologías omitidas.
    extract_technologies_from_requirements(analysis)

    # 2. Normalizar tecnologías.
    for technology in analysis.technology_requirements:
        inferred_category = infer_technology_category(
            technology.name
        )

        if inferred_category != "other":
            technology.category = inferred_category

        technology.requested_level = normalize_requested_level(
            technology.requested_level,
            technology.evidence,
        )

    # 3. Normalizar requisitos generales.
    for requirement in analysis.requirements:
        inferred_category = infer_requirement_category(
            requirement.name
        )

        # Solo reemplazar la categoría cuando la inferencia
        # sea concreta. Así no perdemos education/certification
        # ni otras categorías válidas del modelo.
        if inferred_category != "other":
            requirement.category = inferred_category

        requirement.requested_level = normalize_requested_level(
            requirement.requested_level,
            f"{requirement.name} {requirement.evidence}",
        )

    # 4. Reconstruir required_qualifications.
    analysis.required_qualifications = list(
        dict.fromkeys(
            requirement.name
            for requirement in analysis.requirements
            if requirement.importance == "mandatory"
        )
    )

    # 5. Reconstruir preferred_qualifications.
    analysis.preferred_qualifications = list(
        dict.fromkeys(
            requirement.name
            for requirement in analysis.requirements
            if requirement.importance == "preferred"
        )
    )

    # 6. Reconstruir technologies sin duplicados.
    unique_technologies = {}

    for technology in analysis.technology_requirements:
        normalized_name = normalize_text(technology.name)

        if normalized_name and normalized_name not in unique_technologies:
            unique_technologies[normalized_name] = technology.name

    analysis.technologies = list(unique_technologies.values())

    # 7. Reconstruir languages sin duplicados.
    unique_languages = {}

    for language in analysis.language_requirements:
        normalized_name = normalize_text(language.language)

        if normalized_name and normalized_name not in unique_languages:
            unique_languages[normalized_name] = language.language

    analysis.languages = list(unique_languages.values())

    return analysis
