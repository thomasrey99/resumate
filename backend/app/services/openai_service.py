
from openai import AsyncOpenAI, OpenAIError

from app.core.config import settings
from app.schemas.application import JobAnalysis


async def generate_job_analysis(job_description: str) -> JobAnalysis:
    """
    Analiza una descripción laboral utilizando OpenAI
    y devuelve una respuesta validada por Pydantic.
    """

    if not settings.openai_api_key:
        raise RuntimeError("La API key de OpenAI no está configurada.")

    try:
        async with AsyncOpenAI(
            api_key=settings.openai_api_key
        ) as client:

            completion = await client.beta.chat.completions.parse(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": """
Sos un especialista en selección de personal y análisis de
vacantes tecnológicas.

Analizá la descripción laboral y extraé exclusivamente
información respaldada por el texto proporcionado.

Identificá:
- Puesto y empresa.
- Ubicación y modalidad contractual, si aparecen.
- Seniority.
- Resumen del puesto.
- Responsabilidades.
- Requisitos obligatorios.
- Requisitos deseables.
- Tecnologías y herramientas.
- Idiomas solicitados.

Reglas:
1. No inventes información que no aparezca en la vacante.
2. Diferenciá requisitos obligatorios de deseables.
3. Conservá los nombres originales de tecnologías.
4. No confundas tecnologías mencionadas como deseables
   con requisitos obligatorios.
5. Si un dato no está disponible, utilizá null o una lista vacía.
6. Respondé en español.
                        """,
                    },
                    {
                        "role": "user",
                        "content": job_description,
                    },
                ],
                response_format=JobAnalysis,
            )

        result = completion.choices[0].message.parsed

        if result is None:
            raise RuntimeError(
                "OpenAI no devolvió un análisis estructurado."
            )

        return result

    except OpenAIError as error:
        raise RuntimeError(
            "No se pudo completar el análisis con OpenAI."
        ) from error
