# Sichere E-Mail-Automatisierung für ImmoRadar

GitHub Pages ist ein öffentliches statisches Frontend und darf keine Gmail-Zugangsdaten, OAuth-Refresh-Tokens oder andere Secrets enthalten.

## Zielarchitektur

`Gmail Suchbenachrichtigung → privates OAuth-Backend → E-Mail-Parser → Datenschutz-/Allowlist-Filter → bereinigtes Listing-JSON → ImmoRadar`

Das Backend soll ausschließlich Suchbenachrichtigungen der freigegebenen Absender lesen, keine Nachrichten verändern und nur notwendige Immobilienfelder weitergeben: Portal, kanonische Original-URL, Titel, Preis, Wohn-/Grundstücksfläche, Zimmer, grobe Lage, Benachrichtigungszeit, erkannte Zustandsbegriffe sowie tatsächlich beobachtete Preisstände. Gmail Message-/Thread-IDs, Empfänger-/Absenderadressen, Saved-Search-IDs, Trackingparameter und OAuth-Daten dürfen nicht in das öffentliche Datenmodell gelangen.

## API-Grenze

Empfohlen ist ein privater Endpoint, der ein Array normalisierter Listings liefert. Vor Veröffentlichung müssen URL-Allowlist, Feldlängen, Zahlenbereiche, Dubletten und Trackingparameter serverseitig geprüft werden. Immowelt-Trackingredirects werden nicht aufgelöst oder geraten. ImmoScout-Expose-IDs dürfen nur in den bekannten kanonischen Originalpfad normalisiert werden.

## OAuth

OAuth-Client und Refresh-Token gehören ausschließlich in einen Secret-Store des privaten Backends. Minimale Gmail-Leserechte verwenden. Keine Schreib-, Lösch-, Archivierungs-, Reply- oder Label-Aktionen für diesen Workflow. Token-Rotation und Widerruf müssen möglich sein.

## Aktueller Stand

Die öffentliche Seite unterstützt weiterhin lokalen EML-Import. Eine dauerhafte Gmail-Verbindung ist bewusst nicht im GitHub-Pages-Frontend implementiert. Der bestehende `scripts/sync-feeds.mjs` bleibt für separat lizenzierte Immobilienfeeds zuständig und ist kein Gmail-Adapter.

Vor Inbetriebnahme eines privaten Backends müssen Hosting, OAuth-Client, erlaubte Redirect-URI, Secret-Store und die genaue Datenfreigabe eingerichtet werden.