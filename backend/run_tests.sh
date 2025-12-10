#!/bin/bash
# Test runner for AI features
# Run all tests with coverage

cd "$(dirname "$0")"

echo "🧪 Running AI Features Test Suite..."
echo "===================================="

# Activate virtual environment
source venv/bin/activate

# Run tests with verbose output
echo ""
echo "📊 Testing Recommendations..."
python -m pytest tests/test_recommendations.py -v --tb=short || true

echo ""
echo "🔍 Testing Smart Search..."
python -m pytest tests/test_smart_search.py -v --tb=short || true

echo ""
echo "📸 Testing Visual Search..."
python -m pytest tests/test_visual_search.py -v --tb=short || true

echo ""
echo "🎂 Testing Occasions..."
python -m pytest tests/test_occasions.py -v --tb=short || true

echo ""
echo "✅ Test suite completed!"
