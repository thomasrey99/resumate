
from collections.abc import AsyncIterator

import httpx
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials

from app.core.config import settings
from app.core.security import bearer_scheme, get_current_user


async def get_supabase_client(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    user: dict = Depends(get_current_user),
) -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(
        base_url=f"{settings.supabase_url}/rest/v1",
        headers={
            "apikey": settings.supabase_publishable_key,
            "Authorization": f"Bearer {credentials.credentials}",
            "Content-Type": "application/json",
        },
        timeout=15.0,
    ) as client:
        yield client
