#!/bin/sh
set -eu

anon_key="$(tr -d '\n' < /run/secrets/supabase-anon-key)"
sed "s|__SUPABASE_ANON_KEY__|${anon_key}|g" /etc/kong/kong.template.yml > /tmp/kong.yml
export KONG_DECLARATIVE_CONFIG=/tmp/kong.yml
exec /entrypoint.sh kong docker-start
