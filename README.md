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

## Reale Fundstellen aus amtlicher Primärquelle (Stand 17.10.2026)

Im neuen Tab **Reale Fundstellen** sind drei konkrete veröffentlichte Verkäufe des Freistaats Bayern als **redaktionell geprüfte Originalverweise** hinterlegt. Sie sind keine automatisch heruntergeladenen oder neu veröffentlichten Exposés und kein Beleg für "unter Marktwert". Frist laut Quelle jeweils **22.11.2026**; nach Ablauf der Frist wird die Übernahmefunktion ausgegraut. Status und Angebotsfrist bitte auf der Originalseite erneut prüfen.

| Originalquelle | Amtliche Preisvorstellung | Wohnfläche laut Quelle |
|---|---:|---:|
| [Lechelstraße 10a, 80997 München](https://immobilien.bayern.de/immobilien/verkaeufe/rv1/grundstueck-mit-altbestand-lechelstrasse-10a/index.html) | 990.000 € | ca. 135 m² |
| [Weidmannstraße 48, 80997 München](https://immobilien.bayern.de/immobilien/verkaeufe/rv1/grundstueck-mit-altbestand-in-80997-muenchen-weidmannstrasse-48/index.html) | 2.450.000 € | ca. 215 m² |
| [Waldhornstraße 18, 80997 München](https://www.immobilien.bayern.de/immobilien/verkaeufe/rv1/grundstueck-mit-altbestand-in-80997-muenchen-waldhornstrasse-18/index.html) | 3.740.000 € | ca. 200 m² |

Die Links sind in data/research-links.json gespeichert. Nur kurze eigene Quellenhinweise und grundlegende Fakten, keine Exposébilder oder massenhaft vervielfältigten Beschreibungen. Vor jeder Entscheidung Originalseite und Rechtslage prüfen. In der Rechercheansicht gibt es "Zur eigenen Prüfung übernehmen": Dies kopiert auf **bewussten Klick** den öffentlich genannten Preis als Ausgangswert ins browserlokale Cockpit; **der Marktwert wird ausdrücklich auf 0 gesetzt und kein Gewinn behauptet**. Beim späteren Speichern werden eigene Marktwert- und Sanierungseingaben erhalten.

### Praxisprüfung der Rechnung

Die Preisvorstellung für Lechelstraße 10a beträgt laut Primärquelle 990.000 €. Um die Rechnung zu testen, wurden **frei angenommene, nicht verifizierte** Werte von 140.000 € Renovierung, 10 % Nebenkosten und 1.400.000 € Marktwert verwendet. Formel: 990.000 € + 99.000 € + 140.000 € = 1.229.000 € Gesamtkosten. 1.400.000 € − 1.229.000 € = 171.000 € rechnerische Differenz (12,21 % des angenommenen Marktwerts). **Diese Szenariowerte sind keine Wertermittlung und keine Anlageempfehlung.** Ohne tatsächliche Wertermittlung gibt es keinen belastbaren Schnäppchenbefund.

Regressionsprüfung: node tests/market-check.mjs.

### Echtdatenimport von kooperierenden Maklern (OpenImmo XML)

Die Rechercheansicht akzeptiert OpenImmo-XML-Dateien (maximal 5 MB / 1000 Objekte), die ein Immobilienanbieter **mit Verarbeitungserlaubnis** übermittelt. Die Datei wird ausschließlich lokal im Browser gelesen (kein Upload, kein Scraping). Kaufinserate ohne gültige Original-URL oder Preis werden nicht übernommen. Wenn ein bestätigtes URL-Schema vorliegt, kann optional eine Anbieter-Basis-URL mit der externen Objektnummer kombiniert werden. Ansonsten diese Eingabe leer lassen. Bestehende Objekte werden anhand der Original-URL zusammengeführt; Favoriten und eigene Marktwert-/Renovierungsannahmen bleiben erhalten.

OpenImmo ist ein **XML-Datenstandard, keine Sammlung frei verwendbarer Inserate**. Seine Dokumentation erlaubt die Nutzung der Struktur, ersetzt aber **nicht** die Freigabe durch den jeweiligen Dateninhaber: https://www.openimmo.de/go.php/p/12/cm_prinzip.htm und https://www.openimmo.de/go.php/p/24/download.htm.

Für unbeaufsichtigte regelmäßige Dateneingänge bleibt der bereits implementierte JSON-Feedweg über eine **explizit autorisierte Quelle** verfügbar.

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
node --check research.js
node tests/market-check.mjs
node scripts/sync-feeds.mjs --check
python3 -m http.server 8000
~~~

Anschließend http://localhost:8000 öffnen und Erfassung, Preisänderungen, Budget, Karte und Suchprofile mit eigenen Testdaten prüfen. file:// kann die JSON-Anbindung blockieren.
