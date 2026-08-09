#!/bin/sh

set -eu

escape_js_string() {
  printf '%s' "$1" \
    | sed 's/\\/\\\\/g' \
    | sed 's/"/\\"/g'
}

VITE_API_URL_ESCAPED="$(
  escape_js_string "${VITE_API_URL:-}"
)"

VITE_ENABLE_DEMO_LOGIN_ESCAPED="$(
  escape_js_string "${VITE_ENABLE_DEMO_LOGIN:-false}"
)"

VITE_PUBLIC_BOOKING_BASE_URL_ESCAPED="$(
  escape_js_string "${VITE_PUBLIC_BOOKING_BASE_URL:-}"
)"

VITE_META_APP_ID_ESCAPED="$(
  escape_js_string "${VITE_META_APP_ID:-}"
)"

VITE_META_CONFIG_ID_ESCAPED="$(
  escape_js_string "${VITE_META_CONFIG_ID:-}"
)"

VITE_META_EMBEDDED_REDIRECT_URI_ESCAPED="$(
  escape_js_string "${VITE_META_EMBEDDED_REDIRECT_URI:-}"
)"

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL_ESCAPED}",
  VITE_ENABLE_DEMO_LOGIN: "${VITE_ENABLE_DEMO_LOGIN_ESCAPED}",
  VITE_PUBLIC_BOOKING_BASE_URL: "${VITE_PUBLIC_BOOKING_BASE_URL_ESCAPED}",
  VITE_META_APP_ID: "${VITE_META_APP_ID_ESCAPED}",
  VITE_META_CONFIG_ID: "${VITE_META_CONFIG_ID_ESCAPED}",
  VITE_META_EMBEDDED_REDIRECT_URI: "${VITE_META_EMBEDDED_REDIRECT_URI_ESCAPED}"
};
EOF

exec nginx -g "daemon off;"