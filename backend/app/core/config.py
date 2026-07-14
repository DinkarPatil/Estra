from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./glimmora.db"
    FRONTEND_URL: str = "http://localhost:3000,http://localhost:3001"

    LOG_LEVEL: str = "INFO"

    # Legacy Google AI Studio API key — kept as a soft fallback during the
    # migration to GCP Vertex AI. New deployments leave this empty and use
    # the Vertex variables below.
    GEMINI_API_KEY: str | None = None

    # ── GCP Vertex AI (preferred) ───────────────────────────────────────
    GCP_PROJECT_ID: str | None = None
    GCP_LOCATION: str = "us-central1"
    # Whole service-account JSON, base64-encoded. Decoded at runtime in
    # app.core.llm to build google.oauth2 Credentials. Avoids shipping a
    # JSON file in containers / git.
    GCP_SERVICE_ACCOUNT_JSON_B64: str | None = None

    # Single model used for every non-2D LLM call (QA, deep-dive, intent
    # parser, area explanations, comparison, ranking explanation). Swap
    # here to change behaviour globally.
    GEMINI_MODEL: str = "gemini-2.5-flash"
    # Legacy aliases — still readable from env, but new code uses GEMINI_MODEL.
    INTENT_MODEL: str = "gemini-2.5-flash"
    QA_MODEL: str = "gemini-2.5-flash"

    # Retry budget for transient Vertex errors (429/503). Other 4xx codes
    # fail fast.
    LLM_MAX_RETRIES: int = 1
    LLM_INITIAL_BACKOFF: float = 1.0

    # Toggle between template-based (False) and AI-generated (True) area explanations.
    USE_AI_AREA_EXPLANATIONS: bool = False

    # OSM local-extract paths, resolved relative to the backend/ directory.
    # Download from geofabrik.de (any extract covering Maharashtra will do).
    OSM_PBF_PATH: str = "western-zone-260420.osm.pbf"
    OSM_POI_CACHE_PATH: str = "data/osm/pois.json"

    SEED_SUPER_ADMIN_EMAIL: str = "superadmin@glimmora.ai"
    SEED_SUPER_ADMIN_PASSWORD: str = "superadmin123"
    SEED_SUPER_ADMIN_NAME: str = "Super Admin"
    SEED_SUPER_ADMIN_COUNTRY: str = "India"

    # ── Razorpay ───────────────────────────────────────────────────────
    # Test or live keys; same id is exposed to the browser via the Next.js
    # NEXT_PUBLIC_RAZORPAY_KEY_ID env var. Secret stays server-only and is
    # used to verify the HMAC signature returned by Razorpay Checkout.
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None

    SEED_ADMIN_EMAIL: str = "admin@glimmora.ai"
    SEED_ADMIN_PASSWORD: str = "admin123"
    SEED_ADMIN_NAME: str = "Admin"
    SEED_ADMIN_COUNTRY: str = "India"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
