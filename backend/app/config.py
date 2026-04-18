from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
from pathlib import Path
import os
import json


class Settings(BaseSettings):
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    DATABASE_URL: str = "sqlite:///./promptlab.db"
    SECRET_KEY: str = "dev-secret-key"
    DAILY_TOKEN_BUDGET: int = 100000
    CORS_ORIGINS: Union[List[str], str] = '["http://localhost:5173","http://localhost:3000"]'
    CONTENT_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "content", "modules")

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS as list, supporting both JSON array and comma-separated string."""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        try:
            parsed = json.loads(self.CORS_ORIGINS)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
        return [s.strip() for s in str(self.CORS_ORIGINS).split(",") if s.strip()]

    model_config = SettingsConfigDict(
        env_file=".env" if Path(".env").exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
