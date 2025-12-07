from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

# Admin client with service role (bypasses RLS)
supabase_admin: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)

# Public client (respects RLS)
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key
)


def get_supabase() -> Client:
    """Dependency for public Supabase client."""
    return supabase


def get_supabase_admin() -> Client:
    """Dependency for admin Supabase client (bypasses RLS)."""
    return supabase_admin
