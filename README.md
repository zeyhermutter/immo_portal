# ImmoRadar – Immobilien-Cockpit

Statisches Recherchewerkzeug für **85622 Feldkirchen bei München (100 km)**. Es werden **keine erfundenen Angebote** angezeigt.

## Suchbenachrichtigungen aus E-Mails auswerten

Neu: Der Tab **„E-Mail-Treffer“** verarbeitet von dir selbst exportierte **ImmoScout24-Suchbenachrichtigungen** direkt im Browser. Es gibt **keine Gmail-Verbindung** im Webportal und aktuell keine automatische Hintergrundauswertung des E-Mail-Postfachs.

1. Eine ImmoScout24-Benachrichtigung in deinem E-Mail-Programm öffnen. In Gmail bietet das Nachrichtenmenü „Nachricht herunterladen“ eine \`.eml\`-Datei. Alternative Mailprogramme können ebenfalls \`.eml\` exportieren.
2. ImmoRadar öffnen, Tab **E-Mail-Treffer** wählen, eine oder mehrere EML-Dateien auswählen (maximal 30 pro Import und je 2 MB).
3. Auf **„Anzeigenlinks auslesen“** klicken. Die Datei wird ausschließlich lokal verarbeitet; es wird **kein Netzwerkabruf** gestartet. Gespeichert werden nur kanonische \`https://www.immobilienscout24.de/expose/NUMMER\`-Links sowie das lokale Importdatum, Wiederholungszähler und der Prüffortschritt. **Nicht gespeichert werden** vollständige E-Mail, Absender, Betreff, Preisangaben, Trackingparameter oder Konto-/Suchauftrags-IDs.
4. Direkt auf **„Anzeige öffnen“** klicken, um das Angebot im Portal zu prüfen. Mit **„Objekt erfassen“** öffnet sich ein vorbefüllter Datensatz für eigene Preis-, Flächen- und Marktwertannahmen. Ohne von dir eingegebenen Marktwert wird kein Schnäppchen-Score ausgegeben.
5. Gesehene Links als geprüft markieren oder die gesamte lokale Linkliste löschen.

Grenzen: Der Importer erkennt **direkte** ImmoScout24-Exposé-URLs in Text-, HTML-, MIME-, quoted-printable- und Base64-EML-Nachrichten. Werden statt der Original-URL nur Tracking-/Redirect-Links verschickt, wird diesen **nicht automatisch gefolgt**; die Datei kann dann 0 erkennbare Exposé-Links ergeben. Die Authentizität der E-Mail und der Status der Anzeige werden nicht automatisiert geprüft. „Neu“ heißt *neu in deinem lokalen Browser*, nicht unbedingt frisch bei ImmoScout24 veröffentlicht. Das ist keine Live-Datenbank, kein automatisches Postfach-Monitoring und keine vertragliche Erlaubnis zur Massenauswertung. Die gespeicherten Links sind gerätespezifisch und verschwinden, wenn der Browser-Speicher gelöscht wird.

**Datenschutz:** ImmoRadar speichert keine Zugangsdaten, versendet weder E-Mail-Inhalte noch personenbezogene Suchauftragsinformationen an GitHub und kontaktiert beim EML-Import keine externen Server. Der Benutzer öffnet die Originalanzeige nur durch eigenen Klick. Die restliche Website kann externe Karten- und Schriftressourcen laden.

**ChatGPT-Mailverbindung:** Eine separat vom Nutzer freigegebene Gmail- oder Outlook-Verbindung in ChatGPT kann bei Bedarf für die Suche nach entsprechenden E-Mails in ChatGPT verwendet werden. Sie wird **nicht automatisch an diese statische GitHub-Pages-Website weitergereicht**. Vollautomatische regelmäßige Postfachverarbeitung würde zusätzliche OAuth-Freigaben und einen sicheren serverseitigen Dienst erfordern.

Test: \`node tests/email-parser.test.mjs\` (synthetische, nicht persönliche Beispiel-E-Mails).

## ImmoScout24-Suchauftrag Feldkirchen

Unter **Portale durchsuchen → ImmoScout24 · dein Suchauftrag** gibt es jetzt direkte Suchlinks für **Häuser kaufen** mit Mittelpunkt **48.14786 / 11.72973**:

- **50 km:** Die Entfernung aus dem übermittelten Suchauftrag.
- **100 km:** Die auf das ImmoRadar-Projektziel erweiterte Entfernung.

Die öffentlich in `saved-search.js` hinterlegten Such-URLs enthalten **keine** persönliche gespeicherte Suchauftrag-ID, E-Mail-Marketingparameter oder Tracking-ID. Die neue 100-km-Websuche aktualisiert **nicht** die Einstellungen oder E-Mail-Benachrichtigungen des gespeicherten Suchauftrags bei ImmoScout24.

Wer seinen vollständigen persönlichen Suchauftragslink direkt im Portal öffnen möchte, kann ihn **bewusst im eigenen Browser** hinterlegen. Der vollständige Link bleibt ausschließlich in `localStorage` auf dem jeweiligen Gerät und wird nicht ins GitHub-Repository, einen Server oder in `data/listings.json` geschrieben. Es werden nur HTTPS-Suchlinks der ImmoScout24-Domains akzeptiert; über die Funktion erfolgt **kein automatisiertes Auslesen** der Trefferliste. Entfernen ist über denselben Bereich möglich.

Eine gespeicherte Suche mit E-Mail-Benachrichtigungen bietet noch keinen API-Zugriff. Ein späterer E-Mail-Workflow benötigt die ausdrückliche Verbindung der Mailbox und muss die Nutzungsbedingungen des Portals beachten.

## Funktionen

- Externe Suchlinks zu 6 Immobilienportalen: Sanierungsobjekte, Preisreduzierungen, Privatverkauf, Versteigerung. Die Links sind **keine Live-API** und die Entfernung ist im Originalportal zu prüfen.
- Eigene Immobilien erfassen, favorisieren, filtern und als CSV/JSON importieren.
- Cockpit mit Übersicht und nachvollziehbarem Chancen-Score, wenn Kaufpreis und geschätzter Marktwert vorliegen.
- Interaktive Leaflet-/OpenStreetMap-Karte mit 100-km-Ring und Markern nur für Objekte mit Koordinaten.
- Sanierungsbudget für Dach, Fenster, Heizung, Elektrik, Innenausbau, Energie, sonstige Posten und Puffer.
- Preisverlauf aus lokal beobachteten Preisänderungen derselben Anzeigen-URL.
- Suchprofile, lokale Preisänderungshinweise, Objektakten mit Notizen und Besichtigungs-Checklisten.
- Analyse-CSV-Export.
- **API-Anbindungen:** neue Übersicht zu ImmoScout24, immowelt, Kleinanzeigen, Immonet und freigegebenen Maklerfeeds. Es handelt sich ausdrücklich um eine Zugangs-/Lizenzübersicht, nicht um bereits laufende Portal-API-Verbindungen. Dokumentation: [docs/PORTAL_ACCESS.md](docs/PORTAL_ACCESS.md).

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
2. In config/feeds.json einen Feed hinterlegen; Bedingungen über termsApproved: true, redistributionApproved: true, analysisApproved: true und retentionApproved: true bestätigen, aber nur wenn diese Erlaubnisse tatsächlich vorliegen. enabled muss true sein. Format ist momentan ausschließlich json.
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
      "analysisApproved": true,
      "retentionApproved": true,
      "auth": "none",
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

**Zugangsschutz:** Für ausdrücklich freigegebene HTTPS-JSON-Feeds mit Bearer-Token kann `auth: "bearer-env"` aktiviert werden. Der geheime Token liegt ausschließlich als GitHub Actions Secret `IMMO_FEED_TOKEN`, niemals in GitHub Pages oder config/feeds.json. Portale wie ImmoScout24 oder immowelt benötigen einen gesondert genehmigten Vertrag und ggf. andere Authentifizierung; die generische Schnittstelle umgeht dies nicht.

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
node --check portal-access.js
node --check email-parser.js
node --check email-alerts.js
node tests/email-parser.test.mjs
node tests/market-check.mjs
node scripts/sync-feeds.mjs --check
python3 -m http.server 8000
~~~

Anschließend http://localhost:8000 öffnen und Erfassung, Preisänderungen, Budget, Karte und Suchprofile mit eigenen Testdaten prüfen. file:// kann die JSON-Anbindung blockieren.

## OpenStreetMap-Karte und einklappbare Filter

Oben im Dashboard befindet sich eine interaktive OpenStreetMap-Karte mit dem aus der gespeicherten Suche bekannten Mittelpunkt **85622 Feldkirchen (48.14786, 11.72973)** und einem **100-km-Suchradius**. Der Ausschnitt lässt sich mit „100-km-Gebiet anzeigen“ zurücksetzen. Die Karte verwendet Leaflet 1.9.4 und Kartenkacheln von `tile.openstreetmap.org`. Beim Öffnen wird eine Verbindung zu externen Servern (Leaflet von unpkg.com, Tiles von OpenStreetMap) aufgebaut. Die OpenStreetMap-Urheberhinweise erscheinen in der Karte.

**Zwei klar getrennte Markertypen:** (1) Einzelmarker nur mit numerischen Feldern `lat` und `lon` innerhalb des 100-km-Gebiets (die Herkunft/Genauigkeit der Koordinaten ist vor Verwendung separat zu prüfen). (2) **Bernsteinfarbene Ortsgruppenmarker** an öffentlich dokumentierten Ortsmittelpunkten (GeoNames, CC BY 4.0), wenn der Angebotsort eindeutig einem bekannten Ort oder Münchner Stadtbereich zugeordnet werden kann. Solche Marker sind **keine Objektadressen** und ein Klick zeigt die Anzeigen in der Ortsgruppe mit dieser ausdrücklichen Warnung. Angebote ohne verwertbare Ortsangabe werden nicht auf der Karte platziert. Derzeit ist die Georeferenz-Tabelle bewusst unvollständig. Es erfolgt **keine automatische Geokodierung** durch Besuchende. Filteränderungen aktualisieren beide Markertypen. Ortsdaten: https://www.geonames.org/ (CC BY 4.0); ergänzend Kartenkacheln OpenStreetMap.

Alle Filter sind innerhalb der nativen, tastaturbedienbaren HTML-`details`-Komponente standardmäßig vollständig eingeklappt und bleiben nach dem Öffnen funktionsfähig. Karten- und Filtertests laufen in `.github/workflows/tests.yml`.

**Kartensynchronisierung:** Die interaktive Karte rendert OpenStreetMap-Kacheln und Immobilien-Pins ausschließlich in derselben Leaflet-Kartenprojektion. Eine zusätzliche eingebettete Karte darf nicht unabhängig unter den Pins geschwenkt oder gezoomt werden, weil sonst falsche Positionen angezeigt würden. Wenn die primären Tiles nicht geladen werden, versucht die Karte einen alternativen OSM-basierten Kacheldienst von CARTO (mit Attribution). Falls Leaflet selbst nicht geladen werden kann, erscheint die fixierte, nicht separat verschiebbare OpenStreetMap-Ersatzkarte; eine Ortsgruppenauswahl steuert deren Kartenausschnitt mitsamt den eingeblendeten Pins. Für eine frei bewegliche Karte muss Leaflet verfügbar sein. Die einklappbare **Ortsgruppenliste** und der rechts oben platzierte Sammelpunkt für Wohnungen ohne Standort bleiben in beiden Ansichten erhalten. Der 100-km-Kreis wird in Leaflet angezeigt; das eingebettete Ersatzkartenbild zeigt nur den entsprechenden Kartenausschnitt.

### Einzelpins, Cluster und Spinnenbein-Ansicht

Für **jedes gefilterte Angebot** mit eindeutiger Ortsangabe zeichnet ImmoRadar einen eigenen logischen Pin: bei vorhandenen Koordinatenfeldern nach diesen Daten, ansonsten am **ungefähren Ortsmittelpunkt** (nicht an der Immobilie). Zoombedingt nahe Pins werden nach Pixelabstand gemeinsam als Cluster angezeigt. Ein Klick auf die Zahl klappt **alle Einzelpins** über Verbindungslinien („Spiderfy“) auf, sodass jedes Objekt unabhängig anklickbar bleibt; beim Zoomen, erneutem Clusterklick oder Klicken außerhalb wird die Gruppe geschlossen. Die Gruppierung wird bei jeder Filteränderung neu berechnet.

Wohnungen ohne zuordenbaren Ort werden **nicht mit erfundenen Koordinaten auf einer echten Kartenposition dargestellt**. Stattdessen steht **rechts oben über der Karte** ein fest verankertes rotes Feld „Ohne Standort“ mit der aktuellen Anzahl. Ein Klick öffnet eine scrollbar angeordnete Liste **aller** entsprechenden Wohnungen samt Analyse-Schaltfläche. Nicht zuordenbare Häuser sind zusätzlich in der Ortsgruppenliste unter „Ohne Standort“ abrufbar. Die Ortsgruppenliste unter der Karte bleibt auch dann nutzbar, wenn der interaktive Kartenanbieter nicht geladen werden kann. Anzahl und Einträge folgen den aktiven Filtern.

### Positionsgenauigkeit bei Zoom auf Ortsgruppen

Die eingebettete OpenStreetMap-HTML-Karte besitzt einen eigenen, nicht von ImmoRadar kontrollierbaren Zoomfaktor und passt ihren Bildausschnitt an die Größe des Iframes an. Die bisherigen überlagerten „Fallback-Pins“ waren deshalb nach einem Ortsgruppen-Zoom **nicht geografisch deckungsgleich**; beispielsweise erschien Moosach optisch bei Fürstenfeldbruck. Diese Überlagerung wurde entfernt.

In der **interaktiven Leaflet-Karte** gehören Kartenkacheln, Marker und Spinnenbein-Linien zur **selben Projektion**. Falls die primäre Leaflet-Bibliothek nicht erreichbar ist, wird sie alternativ von cdnjs.cloudflare.com geladen; auch das CSS hat zwei CDN-Quellen. Ist Leaflet trotzdem nicht verfügbar, zeigt die fixierte OpenStreetMap-Ersatzkarte **keine geographischen Einzelpins**; die Ortsgruppenliste und der Sammelpunkt für Wohnungen ohne Standort bleiben verfügbar. Das verhindert falsche räumliche Aussagen. Cache-Versionierung in der Startseite stellt sicher, dass nach dem Deployment die aktualisierten Dateien verwendet werden.
