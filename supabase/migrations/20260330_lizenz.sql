-- ── Lizenzmodell ──────────────────────────────────────────────
-- Aktive Lizenzstufe je Betrieb (free, pro, …)
CREATE TABLE IF NOT EXISTS lizenzen (
  id           SERIAL      PRIMARY KEY,
  betrieb_id   UUID        NOT NULL REFERENCES betriebe(id) ON DELETE CASCADE,
  stufe        TEXT        NOT NULL DEFAULT 'free',
  gueltig_bis  DATE,
  notiz        TEXT,
  erstellt_am  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade-Anfragen von Betrieben
CREATE TABLE IF NOT EXISTS lizenz_anfragen (
  id                SERIAL      PRIMARY KEY,
  betrieb_id        UUID        NOT NULL REFERENCES betriebe(id) ON DELETE CASCADE,
  betrieb_name      TEXT,
  kontakt_email     TEXT        NOT NULL,
  kontakt_name      TEXT,
  gewuenschte_stufe TEXT        NOT NULL DEFAULT 'pro',
  nachricht         TEXT,
  bearbeitet        BOOLEAN     NOT NULL DEFAULT false,
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE lizenzen        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lizenz_anfragen ENABLE ROW LEVEL SECURITY;

-- Betriebsmitglieder dürfen ihre eigene Lizenz lesen
CREATE POLICY "Eigene Lizenz lesen" ON lizenzen
  FOR SELECT USING (
    betrieb_id IN (
      SELECT betrieb_id FROM betrieb_mitglieder WHERE user_id = auth.uid()
    )
  );

-- Betriebsmitglieder dürfen eigene Upgrade-Anfragen lesen und erstellen
CREATE POLICY "Eigene Anfragen lesen" ON lizenz_anfragen
  FOR SELECT USING (
    betrieb_id IN (
      SELECT betrieb_id FROM betrieb_mitglieder WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Eigene Anfragen erstellen" ON lizenz_anfragen
  FOR INSERT WITH CHECK (
    betrieb_id IN (
      SELECT betrieb_id FROM betrieb_mitglieder WHERE user_id = auth.uid()
    )
  );
