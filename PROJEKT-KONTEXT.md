# 🍓 Harvio – Projektkontext für VS Code

## Was bisher gebaut wurde

Mobile Web-App zur Ernteerfassung von Erdbeeren, optimiert für den Feldeinsatz.
Einzelne HTML-Datei (`ernte-app.html`), läuft komplett im Browser ohne Backend.

### Features
- 3-Tab-Navigation: Erfassung / Protokoll / Statistik
- Erfassungsfelder: Feld, Sorte, Pflücker, Reihe, Qualität, Korbtyp, Gewicht
- Numpad für Gewichtseingabe
- Tagesstatistik: KPIs, Qualitätsverteilung, Pflücker-Ranking (Balkendiagramm), Aufschlüsselung nach Feld & Sorte, Stundenverteilung
- Export: CSV, JSON, Clipboard
- Datenhaltung aktuell: LocalStorage (nur lokal, pro Gerät)

### Konfigurierbare Listen (oben im JS)
```javascript
const FELDER   = ['Feld A','Feld B','Feld C','Feld Nord','Feld Süd'];
const SORTEN   = ['Elsanta','Honeoye','Senga Sengana','Malling Centenary','Rumba','Polka'];
const PFLÜCKER = ['Anna','Bernd','Carlos','Daria','Erika','Fatima','Georg','Hana'];
const REIHEN   = 18;
```

### Datenstruktur eines Eintrags
```json
{
  "id": 1718000000000,
  "datum": "2025-06-10",
  "uhrzeit": "09:30",
  "stunde": 9,
  "feld": "Feld A",
  "sorte": "Elsanta",
  "pflücker": "Anna",
  "reihe": 3,
  "qualität": "A",
  "korbtyp": "1.0",
  "gewicht_kg": 1.0
}
```

---

## Nächster Schritt: GitHub Gist als Datenspeicher (POC)

### Ziel
Mehrere Geräte im Feld sollen auf denselben Datensatz zugreifen.
Lösung: GitHub Gist als einfache JSON-Datenbank, GitHub Pages als Hosting.

### Architektur
```
[Gerät 1 - Feld]  ──┐
[Gerät 2 - Feld]  ──┼──► GitHub Gist (ernte.json)  ◄──  [Büro - Laptop/PC]
[Gerät 3 - Feld]  ──┘
                              │
                        GitHub Pages
                     (ernte-app.html)
```

### Einrichtung GitHub Gist (manuell, einmalig)

1. Gehe zu https://gist.github.com
2. Dateiname: `ernte.json`
3. Inhalt: `[]`
4. "Create secret gist" klicken
5. Die **Gist-ID** aus der URL kopieren: `https://gist.github.com/USERNAME/` **`<GIST_ID>`**

### GitHub Personal Access Token erstellen

1. GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Nur Berechtigung **`gist`** ankreuzen
4. Token kopieren und sicher aufbewahren (wird nur einmal angezeigt)

### Was im Code zu ergänzen ist

Die App braucht 3 neue Funktionen:

```javascript
// Konfiguration (einmalig vom Nutzer einzutragen)
const CONFIG = {
  gistId: '',      // Gist-ID eintragen
  token: '',       // GitHub Token eintragen
  filename: 'ernte.json'
};

// Alle Einträge vom Gist laden
async function loadFromGist() {
  const res = await fetch(`https://api.github.com/gists/${CONFIG.gistId}`, {
    headers: { 'Authorization': `token ${CONFIG.token}` }
  });
  const data = await res.json();
  const content = data.files[CONFIG.filename].content;
  return JSON.parse(content);
}

// Alle Einträge in den Gist speichern
async function saveToGist(allEntries) {
  await fetch(`https://api.github.com/gists/${CONFIG.gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${CONFIG.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: {
        [CONFIG.filename]: {
          content: JSON.stringify(allEntries, null, 2)
        }
      }
    })
  });
}
```

### Wichtige Hinweise für die Implementierung

- **Token-Speicherung:** Token beim ersten Start abfragen und in `localStorage` speichern – nicht hardcoded im Code
- **Merge-Strategie:** Beim Speichern erst laden, dann neuen Eintrag anhängen, dann speichern (kein Überschreiben)
- **Offline-Fallback:** Wenn kein Netz → in localStorage zwischenspeichern, beim nächsten Start sync anbieten
- **Konflikt-Handling:** Beim POC reicht "last write wins" – IDs sind Timestamps, also eindeutig
- **Rate Limits:** GitHub API erlaubt 5.000 Requests/Stunde – für Feldeinsatz völlig ausreichend

### Einschränkungen des POC (bewusst akzeptiert)
- Token im localStorage = nicht production-ready (für POC ok)
- Kein Echtzeit-Sync zwischen Geräten (manueller Reload nötig)
- Gist ist "secret" aber nicht verschlüsselt – keine sensiblen Daten

---

## Spätere Professionalisierung (nach POC)

| Thema | POC | Produktion |
|---|---|---|
| Datenhaltung | GitHub Gist | Supabase (PostgreSQL) |
| Hosting | GitHub Pages | Netlify / Vercel |
| Auth | Token in localStorage | Supabase Auth (Login) |
| Offline | Kein Sync | Service Worker + Queue |
| Excel | CSV-Export | Power Query auf REST-API |
| Rollen | Keine | Pflücker / Vorarbeiter / Betrieb |

Empfohlener Stack für Produktion:
- **Frontend:** PWA (bestehende App + Service Worker)
- **Backend:** Supabase (kostenlos bis ~50.000 Einträge/Monat)
- **Hosting:** Netlify (kostenlos)
- **Excel:** Power Query mit API-Zugriff (kein manueller Export)

---

## Aufgaben für VS Code / Claude Extension

### Schritt 1 – Gist-Integration einbauen
- Einstellungs-Screen: Gist-ID + Token einmalig eingeben → in localStorage speichern
- `saveEntries()` ersetzen durch `saveToGist()`
- `init()` erweitern: beim Start von Gist laden, LocalStorage als Cache
- Sync-Status anzeigen (lädt... / ✓ synchronisiert / ⚠ offline)

### Schritt 2 – GitHub Pages Setup
- Repository anlegen: `ernte-tracker`
- `ernte-app.html` → `index.html` umbenennen
- GitHub Pages auf `main` Branch aktivieren
- URL teilen mit Feldarbeitern

### Schritt 3 – Testen
- Auf zwei Geräten gleichzeitig öffnen
- Eintrag auf Gerät 1 → Reload auf Gerät 2 → Eintrag sichtbar?
- CSV-Export testen (funktioniert außerhalb Claude-Vorschau)

---

## Dateien

- `ernte-app.html` – die komplette App (HTML + CSS + JS in einer Datei)
- `PROJEKT-KONTEXT.md` – diese Datei

## Hinweis zum CSV-Export

Der CSV-Download funktioniert **nicht** in der Claude.ai Vorschau (Sicherheitseinschränkung).
Lokal im Browser oder auf GitHub Pages läuft er einwandfrei.
