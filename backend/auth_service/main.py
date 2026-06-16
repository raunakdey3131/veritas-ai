"""
Veritas AI — Authentication Service

OAuth 2.0, JWT issuance, RBAC, API key management.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from jose import jwt
from loguru import logger
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

JWT_SECRET = "CHANGE_ME_IN_PRODUCTION_USE_VAULT"
JWT_ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE = 3600  # 1 hour
REFRESH_TOKEN_EXPIRE = 2592000  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Veritas AI — Auth Service", version="1.0.0")

# ── Models ──────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    scope: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str
    organization: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    organization: Optional[str]
    created_at: datetime

class APIKeyResponse(BaseModel):
    api_key: str
    name: str
    created_at: datetime
    expires_at: datetime

# ── Auth Endpoints ──────────────────────────────────────────────────────────

@app.post("/v1/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT tokens."""
    # Would validate against PostgreSQL
    if request.email == "admin@veritas.ai" and request.password == "admin123":
        user_id = str(uuid.uuid4())
        access_token = _create_access_token(user_id, "admin")
        refresh_token = _create_refresh_token(user_id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE,
            scope="verify:write claims:read analytics:read"
        )
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/v1/auth/register", response_model=UserResponse)
async def register(request: RegisterRequest):
    """Register new user."""
    hashed = pwd_context.hash(request.password)
    user = UserResponse(
        id=str(uuid.uuid4()),
        email=request.email,
        name=request.name,
        role="api",
        organization=request.organization,
        created_at=datetime.now(timezone.utc),
    )
    logger.info(f"Registered user: {user.email}")
    return user

@app.post("/v1/auth/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str):
    """Refresh access token."""
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenResponse(
            access_token=_create_access_token(user_id, payload.get("role", "api")),
            refresh_token=_create_refresh_token(user_id),
            expires_in=ACCESS_TOKEN_EXPIRE,
            scope="verify:write claims:read",
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid refresh token: {e}")

@app.post("/v1/auth/api-key", response_model=APIKeyResponse)
async def create_api_key(name: str = "default"):
    """Generate API key for programmatic access."""
    api_key = f"vrt_{uuid.uuid4().hex[:32]}"
    return APIKeyResponse(
        api_key=api_key,
        name=name,
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(days=365),
    )

@app.get("/v1/auth/verify")
async def verify_token(token: str):
    """Verify JWT token validity."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"valid": True, "sub": payload["sub"], "role": payload["role"]}
    except Exception:
        return {"valid": False}

# ── Helpers ─────────────────────────────────────────────────────────────────

def _create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(seconds=ACCESS_TOKEN_EXPIRE),
        "jti": uuid.uuid4().hex,
        "permissions": _get_permissions(role),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def _create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(seconds=REFRESH_TOKEN_EXPIRE),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def _get_permissions(role: str) -> list:
    permissions = {
        "admin": ["verify:write", "verify:read", "claims:read", "analytics:read",
                  "analytics:write", "human-review:read", "human-review:write",
                  "admin:all"],
        "reviewer": ["verify:read", "claims:read", "human-review:read",
                     "human-review:write", "analytics:read"],
        "analyst": ["analytics:read", "claims:read", "verify:read"],
        "api": ["verify:write", "verify:read", "claims:read"],
    }
    return permissions.get(role, ["verify:read"])
