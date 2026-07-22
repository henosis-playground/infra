#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
secrets="${root}/secrets"
mkdir -p "${secrets}"
umask 077

password_file="${secrets}/supabase-postgres-password.txt"
jwt_file="${secrets}/supabase-jwt-secret.txt"
anon_file="${secrets}/supabase-anon-key.txt"
connection_file="${secrets}/supabase-connection-url.txt"

if [[ ! -s "${password_file}" ]]; then
  openssl rand -hex -out "${password_file}" 24
fi
if [[ ! -s "${jwt_file}" ]]; then
  openssl rand -hex -out "${jwt_file}" 32
fi

base64url() {
  openssl base64 -A | tr '+/' '-_' | tr -d '='
}

header="$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | base64url)"
payload="$(printf '%s' '{"role":"anon","iss":"supabase","iat":1783890000,"exp":2524608000}' | base64url)"
unsigned="${header}.${payload}"
jwt_secret="$(tr -d '\n' < "${jwt_file}")"
signature="$(printf '%s' "${unsigned}" | openssl dgst -sha256 -hmac "${jwt_secret}" -binary | base64url)"
printf '%s\n' "${unsigned}.${signature}" > "${anon_file}"

password="$(tr -d '\n' < "${password_file}")"
printf 'postgresql://postgres:%s@supabase-db:5432/postgres\n' "${password}" > "${connection_file}"
chmod 600 "${password_file}" "${jwt_file}" "${anon_file}" "${connection_file}"
