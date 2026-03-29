#!/bin/bash
# Wird von Netlify vor dem Deploy ausgeführt.
# Erzeugt config.js mit den umgebungsspezifischen Werten aus den Netlify-Env-Vars.
set -e

cat > config.js << EOF
window.RIPELOG_CONFIG = {
  supabaseUrl: '${SUPABASE_URL}',
  supabaseKey: '${SUPABASE_KEY}',
  sentryDsn:   '${SENTRY_DSN}',
  sentryEnv:   '${SENTRY_ENV}',
  release:     '${RELEASE_VERSION}'
};
EOF

echo "✓ config.js generiert für Umgebung: ${SENTRY_ENV}"
