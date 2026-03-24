# Ripelog – Benutzerhandbuch

**Version:** aktuell
**Zielgruppe:** Betriebsleiter und Erntehelfer ohne IT-Kenntnisse

---

## Was ist Ripelog?

Ripelog ist eine digitale Lösung zur **Erfassung und Auswertung von Erntemengen** auf dem Hof. Jeder Pflücker scannt beim Abliefern eines vollen Gebindes (Korb, Steige) einen QR-Code auf seinem persönlichen Etikett – die App bucht den Eintrag sofort in die Datenbank. Am Ende des Tages oder der Woche sehen Sie auf einen Blick: wer hat wie viel geerntet, auf welchem Feld, in welchem Gebinde.

**Die Software besteht aus zwei Teilen:**

| Teil | Datei | Wofür |
|------|-------|-------|
| **Ernte-App** | `ernte-app.html` | Erfassung auf dem Feld (Smartphone/Tablet) |
| **Admin-Panel** | `admin.html` | Verwaltung und Auswertung (PC/Laptop) |

Beide Dateien werden einfach im Browser geöffnet – keine Installation nötig.

---

## Teil 1 – Die Ernte-App (`ernte-app.html`)

Die App ist für den **Einsatz auf dem Feld** gedacht. Sie läuft auf jedem Smartphone oder Tablet im Browser.

### Anmeldung

Beim ersten Öffnen erscheint ein Login-Bildschirm. Geben Sie Ihre **E-Mail-Adresse** und Ihr Passwort ein. Die Verbindungsdaten zur Datenbank sind bereits eingebaut – kein manuelles Einrichten nötig.

Nach erfolgreicher Anmeldung werden alle Stammdaten (Felder, Sorten, Pflücker, Gebinde) automatisch geladen.

---

### Tab: Erfassung ➕

Dies ist der Haupt-Bildschirm für die tägliche Arbeit.

#### Schritt 1 – Schicht einrichten

Bevor Einträge gebucht werden können, muss einmalig pro Schicht eingestellt werden:

- **Feld** – auf welchem Feldstück wird heute geerntet
- **Sorte** – welche Fruchtsorte (optional)
- **Gebinde** – welcher Behältertyp wird verwendet (z. B. Steige 2 kg, Steige 5 kg)

Tippen Sie auf **Schicht einrichten** (oder auf das Feld/Gebinde-Anzeige oben), wählen Sie die Werte und bestätigen Sie mit **Übernehmen**.

#### Schritt 2 – Menge wählen (optional)

Standardmäßig wird **1× Gebinde** pro Scan gebucht. Wenn ein Pflücker ein halb volles oder dreiviertel volles Gebinde abgibt, können Sie vor dem Scan die Menge anpassen:

- Schaltflächen **1×**, **¾×**, **½×**, **¼×** – einfach antippen
- Oder einen eigenen Wert in das Eingabefeld tippen

#### Schritt 3a – QR-Code scannen

Tippen Sie auf den großen **Scannen**-Button. Die Kamera öffnet sich. Halten Sie den QR-Code des Pflückers in den Rahmen. Bei erfolgreichem Scan erscheint kurz eine grüne Bestätigung mit dem Namen des Pflückers und dem gebuchten Gewicht.

#### Schritt 3b – Manuelle Erfassung (ohne Etikett)

Hat ein Pflücker kein Etikett dabei, tippen Sie auf den kleinen Button **"✋ Kein Etikett – manuell erfassen"** unterhalb des Scan-Buttons. Es öffnet sich eine Liste aller Pflücker. Pflücker antippen → **Gebinde erfassen** tippen. Der Eintrag wird wie ein normaler Scan gebucht.

> Diese Option eignet sich als Notlösung, wenn ein Etikett fehlt oder beschädigt ist. Für die reguläre Arbeit ist der QR-Scan zu bevorzugen.

> **Doppelerfassung:** Wird derselbe QR-Code innerhalb weniger Sekunden zweimal gescannt, erscheint eine Warnung. Der zweite Scan wird **nicht** gebucht.

#### Tagesübersicht

Unterhalb des Scan-Buttons sehen Sie live:
- **Gesamt kg** – alle heute gescannten Kilogramm
- **Anzahl Einträge** – wie viele Gebinde heute erfasst wurden
- Die letzten Scans als kleine Karten mit Name, Uhrzeit und Gewicht

---

### Tab: Protokoll 📋

Zeigt alle Einträge des **heutigen Tages** in einer Tabelle.

- **Bearbeiten** (Stift-Symbol): Menge eines Eintrags korrigieren → Gewicht wird automatisch neu berechnet
- **Löschen** (Papierkorb-Symbol): Eintrag entfernen

> Einträge aus der Vergangenheit können nur im Admin-Panel bearbeitet werden.

---

### Tab: Statistik 📊

Tagesauswertung auf einen Blick:
- Gesamtkilogramm und Anzahl Gebinde
- Aufschlüsselung nach Pflücker (Balkendiagramm)
- Stundenverteilung der Ernte
- Gruppenübersichten nach Feld, Sorte und Gebinde

---

### Tab: Einstellungen ⚙️

- **Stammdaten neu laden** – falls neue Pflücker oder Felder im Admin-Panel angelegt wurden, hier aktualisieren
- **Verbindung testen** – prüft ob die Datenbank erreichbar ist
- Synchronisierungsstatus (oben rechts):
  - ✓ Synchronisiert (grün)
  - ⚠ Offline – Einträge werden lokal gespeichert und beim nächsten Online-Gang automatisch hochgeladen

---

### Offline-Betrieb

Die App funktioniert auch **ohne Internetverbindung**. Einträge werden lokal auf dem Gerät gespeichert und sobald wieder eine Verbindung besteht automatisch in die Datenbank übertragen. Das Symbol oben rechts zeigt den aktuellen Status.

---

## Teil 2 – Das Admin-Panel (`admin.html`)

Das Admin-Panel wird auf einem **PC oder Laptop** im Browser geöffnet. Hier werden Stammdaten gepflegt, Auswertungen abgerufen und das Protokoll verwaltet.

### Anmeldung

Beim Öffnen erscheint ein Login-Fenster. Geben Sie Ihre **E-Mail-Adresse** und Ihr Passwort ein. Es gibt zwei Rollen:

| Rolle | Was darf ich? |
|-------|---------------|
| **Admin** | Alles – inkl. Benutzerkonten anlegen und löschen |
| **Betriebsleiter** | Alles außer neue Benutzerkonten anlegen/löschen |

Nach der Anmeldung sehen Sie oben links Ihren Namen und Ihre Rolle. Mit dem Button **Passwort ändern** können Sie jederzeit Ihr eigenes Passwort aktualisieren.

---

### Navigation (linke Seitenleiste)

#### Mitarbeiter (Pflücker)

Hier werden alle **Erntehelfer** angelegt und verwaltet.

Oberhalb der Liste befindet sich ein **Suchfeld**: Tippen Sie einen Namen oder eine MA-Nummer ein, um die Liste sofort zu filtern. Die Trefferzahl wird rechts neben dem Suchfeld angezeigt.

- **Neu anlegen**: Name und Nummer eingeben → Speichern
- **QR-Etikett drucken**: Klick auf das Drucker-Symbol neben dem Namen → Ein Dialog öffnet sich. Das Etikettenformat und der Inhalt werden aus der **Konfiguration** übernommen (siehe unten). Das System ermittelt automatisch die nächste freie Nummer und bereitet den Bogen zum Drucken vor.
- **Deaktivieren**: Pflücker können deaktiviert werden, wenn sie nicht mehr im Betrieb sind – ihre Daten und Einträge bleiben erhalten
- **Löschen**: Nur möglich wenn keine Ernteeinträge mit diesem Pflücker verknüpft sind

#### Betriebsleiter

Zugänge für weitere Personen, die das Admin-Panel nutzen sollen.

- Nur der **Admin** kann Betriebsleiter anlegen und löschen
- Beim Anlegen wird die **E-Mail-Adresse** und ein Passwort eingetragen. Die Person kann sich danach direkt mit diesen Zugangsdaten anmelden.

#### Felder

Alle **Feldstücke** des Betriebs.

- Name und Reihenfolge festlegen
- Felder können aktiviert/deaktiviert werden (deaktivierte erscheinen nicht in der App)

#### Fruchtarten

Übergeordnete Kategorien (z. B. Erdbeere, Himbeere, Johannisbeere).

#### Sorten

Konkrete Sorten je Fruchtart (z. B. Elsanta, Senga Sengana). Sorten werden in der App bei der Schichteinrichtung ausgewählt.

#### Qualitäten

Qualitätsstufen für die Ernte (z. B. A, B, C). Können bei Bedarf ergänzt werden.

#### Gebinde

**Behältertypen** mit ihrem Gewicht – z. B.:
- Steige 2 kg → 2,0 kg pro Stück
- Steige 5 kg → 5,0 kg pro Stück
- Manuell → kein festes Gewicht (für Sondermengen)

Das Gewicht pro Gebinde wird automatisch mit der erfassten Menge multipliziert, um das Gesamtgewicht zu berechnen.

---

#### Protokoll

Vollständige Liste aller **Ernteeinträge** aus der Datenbank.

**Filter:**
- **Von / Bis**: Datumszeitraum einschränken
- **Feld**: Nur ein bestimmtes Feldstück anzeigen
- **Pflücker**: Nur einen bestimmten Pflücker anzeigen
- Schnellauswahl: **Heute**, **Diese Woche**, **Dieser Monat**, **Gesamt**

**Tabellenspalten:**
| Spalte | Bedeutung |
|--------|-----------|
| Datum | Tag des Eintrags |
| Zeit | Uhrzeit des Scans |
| Pflücker | Name des Erntehelfers |
| Feld | Feldstück |
| Sorte | Fruchtsorte |
| Korbtyp | Verwendetes Gebinde |
| Gewicht | Berechnetes Gewicht (Menge × Gewindegewicht) |
| QR-Nr. | Laufende Nummer des gescannten QR-Etiketts |

**Eintrag bearbeiten** (Stift-Symbol):
- Datum, Uhrzeit, Pflücker, Feld, Sorte, Gebinde und Menge können korrigiert werden
- Die QR-Nummer ist nicht änderbar

**Eintrag löschen** (Papierkorb-Symbol): Endgültig – nicht rückgängig zu machen.

---

#### Konfiguration ⚙️

Hier werden betriebsweite Einstellungen für den **Etikettendruck** festgelegt. Diese Einstellungen gelten für alle zukünftigen Druckvorgänge.

**Etikettenformat (Blatt-Einteilung):**
| Format | Größe | Etiketten je Bogen |
|--------|-------|--------------------|
| **Klein** (Standard) | 70 × 42 mm | 21 je A4-Bogen |
| **Groß** | 104 × 48 mm | 12 je A4-Bogen |

**Etiketteninhalt:**
Über Checkboxen wählen Sie, welche Informationen auf dem Etikett erscheinen:
- **Mitarbeiter-Name** – Vollständiger Name des Pflückers
- **Mitarbeiter-Nr.** – Die fortlaufende MA-Nummer
- **Lfd. Nummer** – Die laufende Etikett-Nummer

Sind alle drei deaktiviert, wird **nur der QR-Code** gedruckt (maximale Größe).

Eine **Live-Vorschau** zeigt sofort, wie das fertige Etikett aussehen wird. Änderungen werden automatisch gespeichert.

---

#### Auswertung

Dashboard mit **Kennzahlen und Diagrammen** für den gewählten Zeitraum.

**Schnellauswahl:** Heute / Diese Woche / Dieser Monat / Gesamt – oder eigene Datumsbereich eingeben.

**KPI-Karten (oben):**
- Gesamt-Erntekilogramm (mit Tagesvergleich)
- Gesamtzahl Gebinde
- Anzahl aktiver Pflücker (und Durchschnitt je Person)
- Anzahl beernteter Felder und Zeitraum

**Balkendiagramme:**
- Ernte nach Feld (kg)
- Ernte nach Pflücker (kg)
- Ernte nach Qualität (kg)
- Ernte nach Sorte (kg)
- Ernte nach Tag (letzte 14 Tage)
- Ernte nach Kalenderwoche (letzte 8 Wochen)
- Stundenverteilung der Ernte

---

## Häufige Fragen

**Ein Pflücker hat ein neues Etikett bekommen – was muss ich tun?**
Nichts weiter. Das Etikett enthält eine eindeutige Nummer, die beim ersten Scan automatisch dem Pflücker zugeordnet wird.

**Die App zeigt alte/gelöschte Einträge an.**
Im Tab Einstellungen auf **Stammdaten neu laden** tippen. Die App synchronisiert sich dann neu mit der Datenbank.

**Ein Eintrag wurde versehentlich doppelt gebucht.**
Im Admin-Panel unter **Protokoll** den betroffenen Eintrag suchen und löschen.

**Die App zeigt „Offline".**
Kein Problem – Einträge werden lokal gespeichert. Sobald wieder WLAN oder Mobilfunk verfügbar ist, werden sie automatisch hochgeladen.

**Ich möchte ein neues Feldstück anlegen, es erscheint aber noch nicht in der App.**
Im Admin-Panel unter **Felder** anlegen und aktivieren. Danach in der App unter **Einstellungen → Stammdaten neu laden**.

**Wie ändere ich mein Passwort?**
Im Admin-Panel links unten auf **Passwort ändern** klicken.

**Ich möchte das Etikettenformat ändern (z. B. auf größere Bögen).**
Im Admin-Panel unter **Konfiguration** das gewünschte Format wählen. Die Änderung gilt ab dem nächsten Druckvorgang.

**Ein Pflücker hat kein Etikett dabei – wie erfasse ich trotzdem?**
In der Ernte-App auf den Button **"✋ Kein Etikett – manuell erfassen"** tippen, den Pflücker in der Liste auswählen und bestätigen.

---

## Technische Hinweise (für den Admin)

- Die Daten werden in einer **Supabase-Datenbank** (PostgreSQL) gespeichert. Ein Internetzugang ist für die Synchronisierung erforderlich.
- Beide HTML-Dateien können direkt im Browser geöffnet werden – kein Webserver nötig.
- Für den produktiven Einsatz empfiehlt sich das Ablegen der Dateien auf einem lokalen Server oder einem einfachen Webhosting, damit alle Geräte im Betrieb dieselbe Version nutzen.
- QR-Etiketten werden direkt im Browser als Druck-Dialog erzeugt. Ein normaler Drucker reicht aus; für den Dauereinsatz empfehlen sich wetterfeste Etiketten.
