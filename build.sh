#!/bin/bash
# Wird von Netlify vor dem Deploy ausgeführt.
# Erzeugt config.js mit den umgebungsspezifischen Werten aus den Netlify-Env-Vars.
set -e

# ── Pflicht-Variablen prüfen ───────────────────────────────────────────────
MISSING=0
for VAR in SUPABASE_URL SUPABASE_KEY SENTRY_DSN; do
  if [ -z "${!VAR}" ]; then
    echo "ERROR: Env-Variable '$VAR' ist nicht gesetzt. Deploy abgebrochen." >&2
    MISSING=1
  fi
done
[ $MISSING -eq 1 ] && exit 1

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
