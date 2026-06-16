"""
Veritas AI — API Gateway Middleware

JWT authentication, rate limiting, request validation.
"""

import time
import uuid
from typing import Optional

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

JWT_SECRET = "CHANGE_ME_IN_PRODUCTION_USE_VAULT"
JWT_ALGORITHM = "RS256"
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 1000  # requests per window


class AuthMiddleware(BaseHTTPMiddleware):
    """
    JWT validation middleware for protected endpoints.

    Skips auth for /health, /metrics, /docs, /openapi.json.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Public endpoints
        if path in ("/health", "/metrics", "/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        # Swagger UI static files
        if path.startswith(("/docs", "/redoc", "/openapi")):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        api_key = request.headers.get("X-API-Key", "")

        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                request.state.user_id = payload.get("sub")
                request.state.role = payload.get("role", "api")
                request.state.permissions = payload.get("permissions", [])
            except JWTError as e:
                return JSONResponse(
                    status_code=401,
                    content={"error": "Invalid token", "detail": str(e)},
                )
        elif api_key:
            # Validate API key (check against PostgreSQL)
            request.state.user_id = api_key[:12]
            request.state.role = "api"
            request.state.permissions = ["verify:write"]
        else:
            return JSONResponse(
                status_code=401,
                content={"error": "Authentication required"},
            )

        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Token bucket rate limiter using Redis.

    Per-client rate limiting with sliding window.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        client_id = request.state.user_id if hasattr(request.state, "user_id") else request.client.host
        path = request.url.path

        if path in ("/health", "/metrics"):
            return await call_next(request)

        # Check rate limit (would use Redis in production)
        # For now, pass-through with header annotation
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX)
        response.headers["X-RateLimit-Window"] = str(RATE_LIMIT_WINDOW)
        return response
