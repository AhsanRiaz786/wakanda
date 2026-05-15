from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    google_api_key: str = ""
    llm_model: str = "gemini-2.0-flash"
    max_budget_pkr: int = 50_000
    max_dispatch_minutes: int = 45
    mock_llm: bool = True
    cors_origins: str = "*"
    log_level: str = "INFO"


settings = Settings()
