from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "EdTech"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+asyncpg://edtech:edtech@postgres:5432/edtech"
    REDIS_URL: str = "redis://redis:6379/0"

    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_BOT_USERNAME: str = ""
    PISTON_URL: str = "http://piston:2000"

    STORAGE_DIR: str = "/data/storage"

    PUBLIC_BASE_URL: str = "http://localhost:8700"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "EdTech <no-reply@edtech.local>"

    # Google bilan kirish (Google Cloud Console → OAuth client ID, "Web application"). Bo'sh bo'lsa, tugma ko'rsatilmaydi.
    GOOGLE_CLIENT_ID: str = ""

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8700"]


settings = Settings()
