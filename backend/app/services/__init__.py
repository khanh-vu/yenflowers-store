"""
Services layer for YenFlowers
"""
# AI Services
from .recommendations import RecommendationEngine
from .smart_search import SmartSearchService
from .interaction_tracker import InteractionTracker
from .visual_search import VisualSearchService
from .occasion_service import OccasionService

# Other services (conditional imports)
try:
    from .facebook_sync import FacebookSyncService
except ImportError:
    FacebookSyncService = None

try:
    from .paypal import PayPalService
except ImportError:
    PayPalService = None

__all__ = [
    "RecommendationEngine",
    "SmartSearchService",
    "InteractionTracker",
    "VisualSearchService",
    "OccasionService",
    "FacebookSyncService",
    "PayPalService",
]
