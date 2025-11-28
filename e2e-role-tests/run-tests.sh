#!/bin/bash

# E2E Test Runner Script
# This script helps you run Playwright tests easily

echo "🎭 Playwright E2E Test Runner"
echo "=============================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Playwright browsers are installed
if [ ! -d "node_modules/@playwright" ]; then
    echo "🌐 Installing Playwright browsers..."
    npx playwright install
fi

# Show menu
echo "Select test mode:"
echo "1) UI Mode (Interactive - Recommended)"
echo "2) Run All Tests (Headless)"
echo "3) Run All Tests (Headed - Watch Browser)"
echo "4) Run Authentication Tests"
echo "5) Run Performance Tests"
echo "6) Run Add/Edit Tests"
echo "7) Debug Mode"
echo "8) Generate Report"
echo ""
read -p "Enter choice [1-8]: " choice

case $choice in
    1)
        echo "🎨 Starting Playwright UI..."
        npx playwright test --ui
        ;;
    2)
        echo "🏃 Running all tests (headless)..."
        npx playwright test
        ;;
    3)
        echo "👀 Running all tests (headed)..."
        npx playwright test --headed
        ;;
    4)
        echo "🔐 Running authentication tests..."
        npx playwright test e2e/auth.spec.js --headed
        ;;
    5)
        echo "🎵 Running performance tests..."
        npx playwright test e2e/performances.spec.js e2e/performance-form.spec.js e2e/performance-workflow.spec.js --headed
        ;;
    6)
        echo "✏️ Running add/edit tests..."
        npx playwright test e2e/performance-add-edit.spec.js --headed
        ;;
    7)
        echo "🐛 Starting debug mode..."
        npx playwright test --debug
        ;;
    8)
        echo "📊 Generating report..."
        npx playwright show-report
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
