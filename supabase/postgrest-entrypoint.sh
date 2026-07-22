#!/bin/sh
set -eu

password="$(/bin/busybox tr -d '\n' < /run/secrets/supabase-postgres-password)"
jwt_secret="$(/bin/busybox tr -d '\n' < /run/secrets/supabase-jwt-secret)"
export PGRST_DB_URI="postgres://postgres:${password}@supabase-db:5432/postgres"
export PGRST_JWT_SECRET="${jwt_secret}"
exec /bin/postgrest
