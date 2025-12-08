
import pytest
from unittest.mock import MagicMock

class TestSettings:
    """Tests for settings endpoints."""

    def test_get_settings_empty(self, client, mock_supabase):
        """Test getting settings when db is empty."""
        mock_supabase.table.return_value.select.return_value.execute.return_value.data = []

        response = client.get("/api/v1/admin/settings")

        assert response.status_code == 200
        assert response.json() == {}

    def test_get_settings_populates(self, client, mock_supabase):
        """Test getting settings retrieves stored values."""
        mock_supabase.table.return_value.select.return_value.execute.return_value.data = [
            {"key": "store", "value": {"name": "Test Store"}}
        ]

        response = client.get("/api/v1/admin/settings")

        assert response.status_code == 200
        data = response.json()
        assert "store" in data
        assert data["store"]["name"] == "Test Store"

    def test_update_setting_existing(self, client, mock_supabase):
        """Test updating an existing setting."""
        # Mock successful update
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
            {"key": "store", "value": {"name": "New Name"}}
        ]

        response = client.patch("/api/v1/admin/settings/store", json={"name": "New Name"})

        assert response.status_code == 200
        assert response.json()["value"]["name"] == "New Name"

    def test_update_setting_new_key_creates(self, client, mock_supabase):
        """Test updating a non-existent key creates it (upsert)."""
        # Mock update returning empty list (not found)
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
        
        # Mock insert success
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"key": "new_key", "value": {"foo": "bar"}}
        ]

        response = client.patch("/api/v1/admin/settings/new_key", json={"foo": "bar"})

        assert response.status_code == 200
        assert response.json()["key"] == "new_key"
        assert response.json()["value"]["foo"] == "bar"
