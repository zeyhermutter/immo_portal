# Große Immobilienportale anbinden – Zugänge, Rechte und technische Umsetzung

**Stand: 17.10.2026.** Projekt: [ImmoRadar](https://github.com/zeyhermutter/immo_portal). Diese Hinweise ersetzen keine vertragliche oder rechtliche Prüfung. Änderungen bei Anbietern möglich.

## Tatsächliche Verfügbarkeit

| Anbieter | Offizielle Schnittstelle | Automatischer Suchabruf aller Angebote | Nutzbar für eigene Preis-/Schnäppchenanalysen? |
|---|---|---|---|
| **ImmoScout24** | Such- und Exposé-API mit OAuth 1.0a | Nur mit besonderer Content-Partner-Berechtigung, nicht für private Nutzung | **Nicht durch Standardbedingungen gedeckt.** §7 der API-Bedingungen schränkt Speicherung auf 24 Stunden ein und untersagt eigene Datenbanken und Analysen. Ausdrückliche abweichende Vereinbarung erforderlich. |
| **immowelt** | SOAP-API / Webservices (EstateService, EstateExpose) | API-Key, Partnervertrag; vereinbarter Umfang | Der öffentliche Zugang ist auf Partner und eigene Angebote ausgelegt. Mehrere Anbieter bzw. Analyseverwendung nur mit gesonderter Freigabe. |
| **Kleinanzeigen** | OpenImmo-Import für gewerbliche Anzeigenanbieter | Die dokumentierte Schnittstelle dient dem **Hochladen eigener Anzeigen**, nicht der allgemeinen Suche nach fremden Angeboten | Ohne gesonderte Vereinbarung keine automatische Übernahme fremder Anzeigen. |
| **Immonet** | Keine eigenständige Such-Schnittstelle in dieser Recherche bestätigt | Zugang individuell abklären | Nicht als freigegebene Datenquelle eingeplant. |
| **Makler mit eigenem Feed** | JSON / OpenImmo XML | Mit ausdrücklicher Export- und Verarbeitungserlaubnis | Möglich, sofern zusätzlich Speicherung, Veröffentlichung, Analyse und Zusammenführung mit anderen Quellen gestattet sind. |

**Wichtig:** Die Existenz einer API ist keine Freigabe ihrer Nutzung. **Das reguläre ImmoScout24-API-Produkt ist kein geeigneter Weg, ein eigenes portalübergreifendes Schnäppchen-/Preisarchiv zu füllen.** Kein Proxy-, Login-, Captcha- oder Webscraping-Workaround implementiert.

### Offizielle Quellen

- [ImmoScout24 – Search API](https://api.immobilienscout24.de/api-docs/search/introduction/)
- [ImmoScout24 – Entwickler-FAQ (kommerzieller API-Zugang)](https://api.immobilienscout24.de/more/faq/faq-developer/)
- [ImmoScout24 – API-Nutzungsbedingungen (insbesondere §6/7)](https://api.immobilienscout24.de/terms-of-use/de/)
- [ImmoScout24 – Sonderberechtigung beantragen](https://api.immobilienscout24.de/more/api-permission-request/)
- [immowelt – API/Webservice-Dokumentation](https://www.immowelt.de/anbieten/gewerbe/apitechdoku)
- [immowelt – API-Nutzungsbedingungen](https://www.immowelt.de/meineimmowelt/apinutzungsbedingungen.aspx)
- [Kleinanzeigen – Schnittstellen für Immobilienprofis](https://hilfe-gewerblich.kleinanzeigen.de/artikel/schnittstellen)
- [OpenImmo e.V.](https://www.openimmo.de/)

## Sichere Anbindung eines genehmigten JSON-Partners

Der bestehende Importer scripts/sync-feeds.mjs ruft **nur** konkret erlaubte HTTPS-JSON-Feeds ab. Die Verarbeitungsrechte müssen von einem tatsächlichen Vertrag oder einer schriftlichen Freigabe getragen werden.

Die Datei config/feeds.json kann bei vollständigen Rechten folgenden Eintrag enthalten (Beispieldomain; **kein echter aktivierter Feed**):

~~~json
{
  "feeds": [
    {
      "name": "Freigegebener Immobilienpartner",
      "enabled": true,
      "termsApproved": true,
      "redistributionApproved": true,
      "analysisApproved": true,
      "retentionApproved": true,
      "format": "json",
      "auth": "bearer-env",
      "url": "https://feeds.example.org/immobilien.json",
      "allowedHost": "feeds.example.org",
      "fields": {
        "title": "title",
        "url": "url",
        "price": "price",
        "location": "location",
        "kind": "kind",
        "description": "description",
        "area": "area",
        "lat": "lat",
        "lon": "lon"
      }
    }
  ]
}
~~~

Die vier Erlaubnisfelder bestätigen:

1. **termsApproved:** Automatisierte API-Abrufe für dieses Projekt gestattet.
2. **redistributionApproved:** Weitergabe/Anzeige der Angebotsfelder auf der öffentlichen ImmoRadar-Website gestattet.
3. **analysisApproved:** Preisvergleiche, Deal-Scores und Aggregation mit anderen Quellen gestattet.
4. **retentionApproved:** Speicherung und Preisverlauf im erlaubten Zeitraum gestattet.

Diese vier Checkboxen selbst schaffen **keine** Rechte. Schriftliche Freigabe und deren Laufzeit/Umfang müssen vor Aktivierung tatsächlich vorliegen. Falls Daten nur einige Stunden oder Tage gespeichert werden dürfen, reicht diese dauerhafte Public-JSON-Architektur **nicht** aus; die Anbindung braucht dann ein angepasstes TTL-/Löschkonzept. Ohne Erlaubnis zur Veröffentlichung keine Feed-Daten in data/listings.json speichern.

### Token als GitHub Actions Secret

1. Im Repository **Settings → Secrets and variables → Actions → New repository secret** öffnen.
2. Secret mit dem Namen **IMMO_FEED_TOKEN** anlegen. Den Wert **nicht** in Issues, Code, config/feeds.json, CSV, GitHub Pages oder Chat-Nachrichten eingeben.
3. Falls der autorisierte Anbieter Bearer-Authentifizierung verwendet, auth: "bearer-env" setzen. Der Importer verwendet den Token ausschließlich serverseitig im Authorization-Header. Bei fehlendem Token wird abgebrochen.
4. Ohne Authentifizierung auth: "none" verwenden.
5. Im Repository unter **Actions → Import explicitly approved property feeds → Run workflow** den Import auslösen. Der Workflow ist zusätzlich täglich geplant; nur bereits aktivierte freigegebene Feeds werden abgerufen.

Der Import akzeptiert ausschließlich JSON-Arrays oder Objekte mit items/results-Arrays, begrenzt Anzahl und Antwortgröße und folgt Weiterleitungen nicht. Nur die exakt konfigurierte HTTPS-Domain ist für die Abruf-URL zulässig. **SOAP, OAuth 1.0a, API-Key-Header und Partner-Exposé-APIs werden noch nicht direkt unterstützt.** Diese brauchen nach Vertragsprüfung jeweils einen eigenen Adapter.

### Status der jetzigen Integration

- **ImmoScout24:** keine Freigabe/keine API-Anmeldung im Projekt; kein automatisierter Abruf.
- **immowelt:** keine freigeschalteten API-Zugangsdaten; kein automatisierter Abruf.
- **Kleinanzeigen:** keine allgemeine Such-API angebunden.
- **Freigegebene JSON-Feeds:** Importtechnik inklusive Bearer-Token vorbereitet; in config/feeds.json derzeit 0 Feeds aktiviert.
- **OpenImmo-Dateien:** manueller Import mit Bestätigung der Verarbeitungserlaubnis in „Reale Fundstellen“ möglich.
- **Externe Portalsuche:** bestehende Links zur unabhängigen Recherche; daraus entsteht kein automatisches Portalarchiv.

## Was bei einer Partnerschaft angefragt werden sollte

Vor dem technischen Anschluss den Anbieter ausdrücklich über den vorgesehenen Zweck informieren: „Wir möchten Kaufangebote aus dem Raum 85622/100 km für ein Immobilien-Cockpit mit zusammengeführter Darstellung, dauerhafter Preishistorie, Kaufpreis-/Marktwertanalyse und eigenen Scores verwenden. Gestatten Sie ausdrücklich automatisierten Abruf, Speicherung, Veröffentlichung, Weiterverarbeitung und gemeinsame Darstellung mit Daten anderer Anbieter? Welche API, Zugangsart, Rate-Limits, Datenlöschfristen, Attributionspflichten und Preise gelten?“

Im Zweifel kein Abruf, sondern nur zum Originalangebot verlinken oder den Anbieter nach einem freigegebenen Export fragen.
