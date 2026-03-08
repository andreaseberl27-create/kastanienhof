-- ══ ErntcTracker: Metadaten-Tabellen ══════════════════════════
-- Ausführen im Supabase SQL Editor

-- Felder
CREATE TABLE IF NOT EXISTS felder (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  aktiv      BOOLEAN DEFAULT true
);

-- Sorten
CREATE TABLE IF NOT EXISTS sorten (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  aktiv      BOOLEAN DEFAULT true
);

-- Pflücker
CREATE TABLE IF NOT EXISTS pfluecker (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  aktiv      BOOLEAN DEFAULT true
);

-- Qualitäten (Klasse A/B/C …)
CREATE TABLE IF NOT EXISTS qualitaeten (
  id         SERIAL PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  emoji      TEXT DEFAULT '⚪',
  sort_order INTEGER DEFAULT 0,
  aktiv      BOOLEAN DEFAULT true
);

-- Gebinde / Verpackungstypen
CREATE TABLE IF NOT EXISTS gebinde (
  id         SERIAL PRIMARY KEY,
  label      TEXT NOT NULL,
  gewicht_kg NUMERIC(6,2),          -- NULL = Manuell
  sort_order INTEGER DEFAULT 0,
  aktiv      BOOLEAN DEFAULT true
);

-- RLS deaktivieren (wie ernteeintraege)
ALTER TABLE felder       DISABLE ROW LEVEL SECURITY;
ALTER TABLE sorten       DISABLE ROW LEVEL SECURITY;
ALTER TABLE pfluecker    DISABLE ROW LEVEL SECURITY;
ALTER TABLE qualitaeten  DISABLE ROW LEVEL SECURITY;
ALTER TABLE gebinde      DISABLE ROW LEVEL SECURITY;

-- ── Beispieldaten ─────────────────────────────────────────────
INSERT INTO felder (name) VALUES
  ('Feld A'),('Feld B'),('Feld C'),('Feld Nord'),('Feld Süd')
ON CONFLICT (name) DO NOTHING;

INSERT INTO sorten (name) VALUES
  ('Elsanta'),('Honeoye'),('Senga Sengana'),('Malling Centenary'),('Rumba'),('Polka')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pfluecker (name) VALUES
  ('Anna'),('Bernd'),('Carlos'),('Daria'),('Erika'),('Fatima'),('Georg'),('Hana')
ON CONFLICT (name) DO NOTHING;

INSERT INTO qualitaeten (code, label, emoji, sort_order) VALUES
  ('A', 'Klasse A', '🟢', 1),
  ('B', 'Klasse B', '🟡', 2),
  ('C', 'Klasse C', '⚪', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO gebinde (label, gewicht_kg, sort_order) VALUES
  ('Steige 2kg',  2.0,  1),
  ('Steige 5kg',  5.0,  2),
  ('Steige 10kg', 10.0, 3),
  ('Manuell',     NULL, 4)
ON CONFLICT DO NOTHING;
