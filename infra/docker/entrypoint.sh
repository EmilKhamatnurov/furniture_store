#!/bin/sh
set -e

# Migrations run as a separate one-shot `migrate` service (see docker-compose),
# which uses the worker image that has drizzle-kit. The standalone app image
# intentionally does NOT carry drizzle-kit, so we just start the server here.
echo "▶ Starting Next.js..."
exec node server.js
