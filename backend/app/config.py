from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    app_name: str = "YenFlowers API"
    debug: bool = False
    api_prefix: str = "/api/v1"
    
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    
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
    
    # Instagram
    instagram_access_token: str = ""
    
    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
