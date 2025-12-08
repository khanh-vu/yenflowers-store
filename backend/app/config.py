from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    app_name: str = "YenFlowers API"
    debug: bool = False
    api_prefix: str = "/api/v1"
    
    # Database Mode: "supabase" or "postgres"
    # If DATABASE_URL is set, uses direct PostgreSQL
    # Otherwise, uses Supabase client
    database_url: Optional[str] = None
    
    # Supabase (optional if using DATABASE_URL)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    
    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    
    # PayPal
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_mode: str = "sandbox"  # sandbox or live
    
    # Facebook
    facebook_page_id: str = ""
    facebook_access_token: str = ""
    facebook_app_id: str = ""
    facebook_app_secret: str = ""
    
    # Instagram
    instagram_access_token: str = ""
    
    # JWT Auth
    jwt_secret_key: str = "yenflowers-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24
    
    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    @property
    def use_postgres(self) -> bool:
        """Check if using direct PostgreSQL instead of Supabase."""
        return bool(self.database_url)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore unknown env vars


@lru_cache()
def get_settings() -> Settings:
    return Settings()

