const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./database');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // Stellt HTML & JS bereit

console.log("📌 Express-Server wird gestartet...");
logToFile("📌 Express-Server wird gestartet...");

// Funktion zum Speichern von Logs in einer Datei mit verbessertem Zeitformat
function logToFile(message) {
    const now = new Date();
    const formattedTimestamp = `Date: ${now.toISOString().split("T")[0]} Time: ${now.toTimeString().split(" ")[0]}`;
    const logMessage = `[${formattedTimestamp}] ${message}\n`;
    fs.appendFileSync("logs.txt", logMessage, "utf8");
}

// Ersetzt `console.log` und `console.error`, um Logs in Datei zu speichern
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
    originalConsoleLog(...args);
    logToFile(args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" "));
};

console.error = (...args) => {
    originalConsoleError(...args);
    logToFile("[ERROR] " + args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" "));
};

function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return "Die E-Mail-Adresse muss ein gültiges Format haben (z. B. name@example.com).";
    }
    return null;
}

function validatePassword(password) {
    const minLength = /.{8,}/;
    const hasUpper = /[A-Z]/;
    const hasLower = /[a-z]/;
    const hasNumber = /\d/;
    const hasSpecial = /[!@#$%^&*(),.?\":{}|<>]/;

    if (!minLength.test(password)) return "Passwort muss mindestens 8 Zeichen haben.";
    if (!hasUpper.test(password)) return "Passwort muss mindestens einen Großbuchstaben enthalten.";
    if (!hasLower.test(password)) return "Passwort muss mindestens einen Kleinbuchstaben enthalten.";
    if (!hasNumber.test(password)) return "Passwort muss mindestens eine Zahl enthalten.";
    if (!hasSpecial.test(password)) return "Passwort muss mindestens ein Sonderzeichen enthalten.";

    return null;
}

// API: Neuen Benutzer speichern (Registrierung)
app.post('/add-user', async (req, res) => {
    console.log("[POST] /add-user - Request empfangen:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        console.error("[POST] /add-user - Fehler: E-Mail und Passwort dürfen nicht leer sein.");
        return res.status(400).json({ error: "E-Mail und Passwort dürfen nicht leer sein." });
    }

    const emailError = validateEmail(email);
    if (emailError) {
        console.error("[POST] /add-user - Fehler:", emailError);
        return res.status(400).json({ error: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        console.error("[POST] /add-user - Fehler:", passwordError);
        return res.status(400).json({ error: passwordError });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.error("[POST] /add-user - Fehler: Diese E-Mail wird bereits verwendet.");
            return res.status(400).json({ error: "Diese E-Mail wird bereits verwendet." });
        }

        console.log("[POST] /add-user - Neuer Benutzer wird gespeichert...");
        const newUser = new User({ email, password });
        await newUser.save();
        console.log("[POST] /add-user - Benutzer erfolgreich gespeichert!");
        res.status(201).json({ message: "Gespeichert" });
    } catch (err) {
        console.error("[POST] /add-user - Fehler beim Speichern:", err);
        res.status(500).json({ error: "Datenbankfehler, bitte erneut versuchen." });
    }
});

// API: Login-Prüfung
app.post('/login', async (req, res) => {
    console.log("[POST] /login - Login-Anfrage erhalten:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        console.error("[POST] /login - Fehler: E-Mail und Passwort erforderlich.");
        return res.status(400).json({ error: "E-Mail und Passwort erforderlich." });
    }

    try {
        const user = await User.findOne({ email, password });  // KLARTEXT-VERGLEICH!
        if (!user) {
            console.error("[POST] /login - Fehler: Ungültige E-Mail oder Passwort.");
            return res.status(401).json({ error: "Ungültige E-Mail oder Passwort." });
        }

        console.log("[POST] /login - Erfolgreich angemeldet!");
        res.status(200).json({ message: "Login erfolgreich!", redirect: "/dashboard.html" });
    } catch (err) {
        console.error("[POST] /login - Fehler:", err);
        res.status(500).json({ error: "Serverfehler, bitte erneut versuchen." });
    }
});

// API: Benutzer aktualisieren (Passwort ändern)
app.put('/update-user/:email', async (req, res) => {
    const email = req.params.email;
    const { password } = req.body;

    console.log(`[PUT] /update-user - Benutzer aktualisieren: ${email}`);

    try {
        const updatedUser = await User.findOneAndUpdate({ email }, { password }, { new: true });

        if (!updatedUser) {
            console.error(`[PUT] /update-user - Fehler: Benutzer nicht gefunden (${email})`);
            return res.status(404).json({ error: "Benutzer nicht gefunden." });
        }

        console.log(`[PUT] /update-user - Benutzer erfolgreich aktualisiert (${email})`);
        res.json({ message: "Benutzer erfolgreich aktualisiert." });
    } catch (err) {
        console.error("[PUT] /update-user - Fehler beim Aktualisieren:", err);
        res.status(500).json({ error: "Fehler beim Aktualisieren des Benutzers." });
    }
});

// API: Benutzer löschen
app.delete('/delete-user/:email', async (req, res) => {
    const email = req.params.email;
    console.log(`[DELETE] /delete-user - Lösche Benutzer: ${email}`);

    try {
        const deletedUser = await User.findOneAndDelete({ email });

        if (!deletedUser) {
            console.error(`[DELETE] /delete-user - Fehler: Benutzer nicht gefunden (${email})`);
            return res.status(404).json({ error: "Benutzer nicht gefunden." });
        }

        console.log(`[DELETE] /delete-user - Benutzer erfolgreich gelöscht (${email})`);
        res.json({ message: "Benutzer erfolgreich gelöscht." });
    } catch (err) {
        console.error("[DELETE] /delete-user - Fehler beim Löschen:", err);
        res.status(500).json({ error: "Fehler beim Löschen des Benutzers." });
    }
});

// API: Alle Benutzer abrufen
app.get('/users', async (req, res) => {
    console.log("[GET] /users - Abruf der Benutzerdaten...");
    try {
        const users = await User.find();
        console.log(`[GET] /users - Anzahl Benutzer: ${users.length}`);
        res.json(users);
    } catch (err) {
        console.error("[GET] /users - Fehler beim Abruf:", err);
        res.status(500).json({ error: "Fehler beim Abrufen der Daten." });
    }
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf http://localhost:${PORT}`));
