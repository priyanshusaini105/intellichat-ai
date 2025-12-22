#!/bin/bash

# SvelteKit Migration Setup Script
# This script helps set up the SvelteKit frontend after migration

set -e

echo "🚀 SvelteKit Frontend Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the frontend directory:"
    echo "  cd packages/frontend"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js 18+ is required. You have Node.js $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development server:"
echo "   pnpm dev"
echo ""
echo "2. Open your browser to:"
echo "   http://localhost:5173"
echo ""
echo "3. Build for production:"
echo "   pnpm build"
echo ""
echo "=================================="
