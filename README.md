# ImmoRadar – Immobilien-Cockpit

Statisches Recherchewerkzeug für **85622 Feldkirchen bei München (100 km)**. Es werden **keine erfundenen Angebote** angezeigt.

## Funktionen

- Externe Suchlinks zu 6 Immobilienportalen: Sanierungsobjekte, Preisreduzierungen, Privatverkauf, Versteigerung. Die Links sind **keine Live-API** und die Entfernung ist im Originalportal zu prüfen.
- Eigene Immobilien erfassen, favorisieren, filtern und als CSV/JSON importieren.
- Cockpit mit Übersicht und nachvollziehbarem Chancen-Score, wenn Kaufpreis und geschätzter Marktwert vorliegen.
- Interaktive Leaflet-/OpenStreetMap-Karte mit 100-km-Ring und Markern nur für Objekte mit Koordinaten.
- Sanierungsbudget für Dach, Fenster, Heizung, Elektrik, Innenausbau, Energie, sonstige Posten und Puffer.
- Preisverlauf aus lokal beobachteten Preisänderungen derselben Anzeigen-URL.
- Suchprofile, lokale Preisänderungshinweise, Objektakten mit Notizen und Besichtigungs-Checklisten.
- Analyse-CSV-Export.

## Modellbewertung

Der Deal-Score (0–100) wird **nur** vergeben, wenn ein Kaufpreis und ein geschätzter Marktwert angegeben sind. Formel: 50 + 2 × modellierter Abschlag in Prozentpunkten + 5 für Koordinaten im 100-km-Kreis + 5 für vorhandene Fläche/Beschreibung + 5 für dokumentierte Preisreduzierung; begrenzt auf 0–100. Modellierter Abschlag: (Marktwert − [Kaufpreis + Kaufnebenkosten + Sanierung]) / Marktwert. Ein höherer Score ist kein Nachweis eines unter Marktwert liegenden Angebots. Sanierungsschätzungen, Marktwerte und Risiken müssen fachlich geprüft werden.

## Was ist automatisch und was nicht?

Die Portalverlinkungen sind externe Suchlinks, **kein Scraping**. Für automatische Datenimporte existiert ein optionales GitHub-Actions-Verfahren, das nur zuvor ausdrücklich erlaubte HTTPS-JSON-Feeds verarbeitet. Ohne freigegebene Quelle werden keine automatischen Immobilienangebote geladen. Das Setup ist standardmäßig absichtlich leer.

Zum Aktivieren:

1. Vom Datenanbieter eine ausdrückliche Berechtigung für automatisierte Abrufe **und Veröffentlichung/Weitergabe** der Daten einholen und alle Lizenz-/Datenschutzbedingungen prüfen.
2. In config/feeds.json einen Feed hinterlegen; Bedingungen über termsApproved: true und redistributionApproved: true bestätigen, aber nur wenn diese Erlaubnisse tatsächlich vorliegen. enabled muss true sein. Format ist momentan ausschließlich json.
3. Erforderliche Feed-Eigenschaften sind name, url und allowedHost. Die URL muss https sein und exakt zu allowedHost passen. Kein Scraping, keine Umleitungen, keine Zugangsdaten oder API-Keys.
4. Der JSON-Feed muss ein Array oder ein Objekt mit items- oder results-Array zurückgeben. Jedes Angebot benötigt title, url (https) und price (>0). Optional: kind, location, description, area, lat, lon. Feldzuordnungen können in fields als Objekt gesetzt werden; auch Pfade wie details.price werden unterstützt.
5. Mit Node 22+ ausführen: node scripts/sync-feeds.mjs --check; danach node scripts/sync-feeds.mjs. Der Workflow in .github/workflows/sync-approved-feeds.yml ist manuell startbar und zusätzlich täglich geplant. Ohne aktivierte Quellen tut er nichts. Bei Feed-Fehlern bleibt die vorherige Datendatei unverändert.
6. Öffentlich nutzbare Daten landen in data/listings.json und werden beim Seitenaufruf in die lokale Objektliste übernommen. Der URL-Abgleich verhindert Dubletten. Browser-Favoriten und eigene Marktwertannahmen bleiben erhalten.

### Beispielkonfiguration

~~~json
{
  "feeds": [
    {
      "name": "Lizenzierter Anbieter",
      "enabled": true,
      "termsApproved": true,
      "redistributionApproved": true,
      "format": "json",
      "url": "https://feed.example.org/immobilien.json",
      "allowedHost": "feed.example.org",
      "fields": {
        "title": "title",
        "url": "url",
        "price": "price",
        "location": "location",
        "area": "area",
        "lat": "lat",
        "lon": "lon"
      }
    }
  ]
}
~~~

**Sicherheit:** data/listings.json ist bei diesem öffentlichen GitHub-Repository öffentlich lesbar. Keine privaten Verträge, persönlichen Kontaktdaten, Geheimnisse oder nicht zur Veröffentlichung freigegebenen Inserate dort ablegen. Ohne explizite Rechte keine fremden Portale automatisiert auslesen.

## Webseite veröffentlichen

Repository: https://github.com/zeyhermutter/immo_portal

GitHub Pages: Settings → Pages → Deploy from a branch → main → / (root) → Save. Sobald Pages aktiviert und veröffentlicht ist, sollte die Webseite hier erreichbar sein:

https://zeyhermutter.github.io/immo_portal/

Die Erstellung der Dateien aktiviert Pages **nicht automatisch**.

## Datenhaltung und Einschränkungen

- Eigene Daten, Marktwertannahmen, Suchprofile, Historien, Sanierungspläne und Objektakten liegen in localStorage **nur auf diesem Browser/Gerät**. Ohne Login keine Gerätesynchronisation. Regelmäßig JSON exportieren.
- Preisverläufe entstehen erst **ab der ersten lokalen Erfassung**. Es werden keine historischen Portalpreise vorgetäuscht.
- Hinweise sind **keine Push-Nachrichten oder E-Mails**. Neue Daten müssen beim Öffnen, Aktualisieren oder Importieren eingelesen werden.
- Ohne Koordinaten ist eine zuverlässige Radiusprüfung nicht möglich. Externe Suchen können Treffer außerhalb des Radius liefern.
- Es gibt keine vollautomatische Marktwertermittlung, keine Energieanalyse durch Exposébilder und keine verifizierte Hochwasser-/Denkmalschutzprüfung.
- Die Karte lädt nur die angezeigten OpenStreetMap-Kacheln, zeigt Attribution und darf nicht für Massendownloads verwendet werden. Nutzungsregeln: https://operations.osmfoundation.org/policies/tiles/.
- Amtliche Prüfmöglichkeiten für Bayern: https://www.umweltatlas.bayern.de/ und https://www.boris-bayern.de/.
- Dieses Projekt ersetzt keine Fachberatung zu Immobilienkauf, Sanierung oder Finanzierung.

## Dateien und lokale Tests

~~~text
index.html                         Grundoberfläche und lokale Objektverwaltung
cockpit.js                         Dashboard, Karte, Scores, Budgets, Historie, Hinweise
cockpit.css                        Cockpit-Layout
config/feeds.json                  Nur ausdrücklich erlaubte Quellen; leer ab Werk
data/listings.json                 Öffentliches Feed-Dataset; leer ab Werk
scripts/sync-feeds.mjs             Kontrollierter JSON-Import
.github/workflows/sync-approved-feeds.yml  Geplanter optionaler Import
~~~

~~~sh
node --check cockpit.js
node --check scripts/sync-feeds.mjs
node scripts/sync-feeds.mjs --check
python3 -m http.server 8000
~~~

Anschließend http://localhost:8000 öffnen und Erfassung, Preisänderungen, Budget, Karte und Suchprofile mit eigenen Testdaten prüfen. file:// kann die JSON-Anbindung blockieren.
