# Work & Travel Cockpit

Offline-fähige PWA für das Working Holiday Visa (Subclass 417): Tracker für die 88 bzw. 179 Tage specified work
und eine Reisekarte mit Orten und Fotos.
Alle Daten bleiben in IndexedDB auf deinem Handy. Nichts wird hochgeladen.

## Setup

Du brauchst Node.js 20 oder neuer.

```bash
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm test           # Unit-Tests (Vitest)
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen, inklusive Service Worker
npm run icons      # PNG-Icons aus public/favicon.svg neu erzeugen
npm run map        # Australien-Umriss aus Natural Earth neu erzeugen (nur nötig, wenn du den Kartenausschnitt änderst)
```

> **iCloud-Hinweis:** Das Projekt liegt in iCloud Drive. `node_modules` ist deshalb ein Link auf `node_modules.nosync`,
> den iCloud nicht synchronisiert. Auf einem neuen Rechner vor `npm install` einmal ausführen:
> `mkdir node_modules.nosync && ln -s node_modules.nosync node_modules`

## Postleitzahlen pflegen

Die Regional-Prüfung braucht die offiziellen Listen von
[immi.homeaffairs.gov.au](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417/specified-work).
Trag sie in `src/config/regionalPostcodes.ts` ein, als Einzelwerte oder Bereiche. Solange eine Liste leer ist,
zeigt die App „Ungeprüft“ an und zählt die Tage vorläufig mit.

## Aufs Handy bringen

Handys installieren eine PWA nur über **HTTPS**. `npm run dev` reicht dafür nicht. Am einfachsten:

**Netlify (automatisch)**: Die Seite ist mit diesem GitHub-Repository verbunden. Jeder Push auf `main` baut und veröffentlicht die App neu,
Einstellungen stehen in `netlify.toml`.

**GitHub Pages**: Repository anlegen, `dist/` veröffentlichen (z. B. mit der Action „Deploy static content to Pages“).
Die App nutzt relative Pfade und Hash-Routing, läuft also auch unter `benutzer.github.io/cockpit/`.

Auf dem Server liegt nur der App-Code, deine Daten bleiben auf dem Gerät.

### iPhone (Safari)
1. Adresse in **Safari** öffnen (nicht in Chrome).
2. Teilen-Knopf → **Zum Home-Bildschirm** → **Hinzufügen**.
3. App einmal vom Homescreen starten, solange du Internet hast. Danach funktioniert sie im Flugmodus.

### Android (Chrome)
1. Adresse in Chrome öffnen.
2. Menü (⋮) → **App installieren** bzw. **Zum Startbildschirm hinzufügen**.
3. Einmal online starten, danach läuft sie offline.

> Wichtig auf dem iPhone: Nur die installierte App ist vor dem automatischen Löschen durch Safari geschützt.
> Nutze die App vom Homescreen, nicht im Browser-Tab, und mach regelmäßig ein Backup (Mehr → Backup sichern).

## Offline testen

1. `npm run build && npm run preview`, Seite öffnen.
2. DevTools → Application → Service Workers: Der Worker ist aktiv.
3. Network → **Offline** anhaken (oder Flugmodus am Handy) und neu laden. Die App startet und speichert weiter.

## Wie gezählt wird

- Jeder Kalendertag mit Arbeit bei einem anrechenbaren Arbeitgeber zählt **einmal**, egal wie viele Einträge es an dem Tag gibt.
- Tage bei Arbeitgebern mit nicht regionaler Postleitzahl oder der Arbeitsart „Sonstiges“ zählen nicht. Die App warnt schon beim Erfassen.
- **Vollzeit** (Haken am Arbeitgeber): Arbeitest du in einer Woche (Mo–So) an mindestens 5 Tagen dort, zählt die ganze
  Woche als 7 Tage, begrenzt auf deine Beschäftigungsdauer und bis heute. Prüf auf der Home-Affairs-Seite, ob das für dich gilt.

Die Logik steht in `src/lib/dayCount.ts`, die Tests daneben.

## Orte und Karte

Unter **Orte** trägst du Stationen deiner Reise ein: Ort, Ankunft und Abreise, Notiz und Fotos.
Die Karte ist ein mitgelieferter Umriss von Australien (Natural Earth 1:50m) und braucht nie Internet.
Einen Ort setzt du per Tipp auf die Karte oder mit „Meinen Standort verwenden“ (GPS funktioniert auch offline,
braucht aber HTTPS oder localhost). Ein Finger verschiebt die Karte, zwei Finger zoomen.

Fotos werden vor dem Speichern auf 1600 px verkleinert (~300 KB pro Foto) und liegen in IndexedDB.

## Backup

**Mehr → Backup sichern** erzeugt eine JSON-Datei mit allen Daten, inklusive Fotos. Mit vielen Fotos wird sie entsprechend groß. Auf dem Handy öffnet sich das Teilen-Menü
(iCloud Drive, Google Drive, Mail), am Rechner wird sie heruntergeladen.
**Backup wiederherstellen** prüft die Datei vollständig und zeigt vorher, was ersetzt wird. Bei einem Fehler bleibt alles unverändert.

## Aufbau

```
src/
  app/          App, Routing, Layout, Bottom-Navigation
  features/     dashboard, workdays, employers, backup, settings
  components/   wiederverwendbare Bausteine (Button, Sheet, DateField …)
  db/           Dexie-Schema (versioniert), Typen, Repositories, Hooks
  lib/          reine Logik mit Tests: Datum, Tageszählung, Regional, ABN, Formate, Backup
  config/       regionalPostcodes.ts
  styles/       Farben und Typografie (Tailwind v4)
```

Datensätze haben UUIDs, `updatedAt` und `deletedAt` (Löschen markiert nur). So ist später ein Sync, z. B. mit Supabase, möglich.
Schema-Änderungen: in `src/db/schema.ts` eine neue `version(n)` anhängen, bestehende nie ändern.
