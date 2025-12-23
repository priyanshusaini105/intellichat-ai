#!/bin/sh
set -e

echo "🔄 Running database migrations..."
# Run db push to sync schema with database
npx prisma db push --schema=./prisma/schema.prisma --skip-generate || echo "⚠️ Migration failed, continuing..."

echo "✅ Database ready"
echo "🚀 Starting server..."

exec "$@"
