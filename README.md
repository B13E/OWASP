# OWASP MongoDB Projekt

## Überblick
Dieses Projekt ist eine einfache Webanwendung, die Benutzerdaten in einer MongoDB-Datenbank speichert. Es verwendet **Node.js**, **Express** und **Mongoose**, um eine REST-API zu erstellen. Das Frontend besteht aus einfachem HTML, CSS und JavaScript.

## Voraussetzungen
Um das Projekt lokal auszuführen, benötigst du:
- **VS Code** (oder einen anderen Editor)
- **Node.js** (mindestens Version 14)
- **MongoDB** (lokal installiert oder als Cloud-Dienst, z. B. MongoDB Atlas)

## Installation & Einrichtung

1. **Projekt herunterladen oder klonen**
   ```sh
   git clone <repository-url>
   cd OWASP
   ```

2. **Abhängigkeiten installieren**
   ```sh
   npm install
   ```

3. **MongoDB starten** (falls lokal installiert)
   ```sh
   mongod --dbpath=/path/to/data
   ```

4. **Server starten**
   - Normaler Start:
     ```sh
     npm start
     ```
   - Im Entwicklungsmodus (mit automatischem Neustart):
     ```sh
     npm run dev
     ```

5. **Anwendung im Browser aufrufen**
   - Gehe zu: [http://localhost:3000](http://localhost:3000)

## Verzeichnisstruktur
```
OWASP/
│-- public/          # Statische Dateien (HTML, CSS, JS)
│   ├── index.html   # Startseite
│   ├── script.js    # Clientseitiges JavaScript
│   ├── style.css    # Styling
│
│-- server/          # Backend Code
│   ├── database.js  # Verbindung zu MongoDB
│   ├── server.js    # Express-Server mit API-Routen
│
│-- package.json     # Node.js Projektdatei
│-- .gitignore       # Dateien, die nicht in Git hochgeladen werden sollen
│-- README.md        # Dokumentation
```

## API-Endpunkte

- **`POST /add-user`** - Speichert einen neuen Benutzer in der Datenbank
  ```json
  {
    "name": "Max Mustermann",
    "email": "max@example.com"
  }
  ```

- **`GET /users`** - Gibt eine Liste aller gespeicherten Benutzer zurück
  ```json
  [
    { "name": "Max Mustermann", "email": "max@example.com" },
    { "name": "Erika Muster", "email": "erika@example.com" }
  ]
  ```

## Projekt auf GitHub hochladen

1. **Repository initialisieren** (falls noch nicht geschehen)
   ```sh
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Remote-Repository hinzufügen**
   ```sh
   git remote add origin <repository-url>
   ```

3. **Code hochladen**
   ```sh
   git push -u origin main
   ```

## Probleme & Fehlerbehebung

Falls Probleme auftreten, prüfe:
- Ob **MongoDB** läuft (`mongod` Prozess aktiv?)
- Ob alle **Node.js-Abhängigkeiten** installiert sind (`npm install` ausführen)
- Ob **Port 3000** bereits belegt ist (ggf. in `server.js` einen anderen Port setzen)

