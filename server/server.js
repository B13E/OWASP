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

// Middleware zum Schutz des Dashboards
async function checkAdmin(req, res, next) {
    const email = req.query.email || req.body.email; 

    if (!email) {
        return res.status(403).json({ error: "Kein Zugriff - Keine Admin-E-Mail übermittelt!" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || !user.isAdmin) {
            console.error(`[PROTECT] Zugriff verweigert für ${email}`);
            return res.status(403).json({ error: "Kein Zugriff - Kein Admin!" });
        }
        next();
    } catch (err) {
        console.error("[PROTECT] Fehler beim Prüfen des Admin-Status:", err);
        res.status(500).json({ error: "Fehler beim Überprüfen der Berechtigung." });
    }
}

// API: Neuen Benutzer speichern (Registrierung)
app.post('/add-user', async (req, res) => {
    console.log("[POST] /add-user - Request empfangen:", req.body);

    const { email, password, isAdmin } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "E-Mail und Passwort dürfen nicht leer sein." });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Diese E-Mail wird bereits verwendet." });
        }

        console.log(`[POST] /add-user - Neuer Benutzer wird gespeichert (${email})...`);
        const newUser = new User({ email, password, isAdmin: isAdmin || false });
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
        return res.status(400).json({ error: "E-Mail und Passwort erforderlich." });
    }

    try {
        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Ungültige E-Mail oder Passwort." });
        }

        console.log(`[POST] /login - Erfolgreich angemeldet: ${email}`);

        if (user.isAdmin) {
            return res.status(200).json({ message: "Login erfolgreich!", redirect: `/dashboard.html?email=${email}` });
        }

        return res.status(200).json({ message: "Login erfolgreich!", redirect: `/userlist.html?email=${email}` });

    } catch (err) {
        console.error("[POST] /login - Fehler:", err);
        res.status(500).json({ error: "Serverfehler, bitte erneut versuchen." });
    }
});

// API: Zugriff auf Dashboard (nur für Admins)
app.get('/dashboard', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// API: Alle Benutzer abrufen (Admin & User)
app.get('/users', async (req, res) => {
    console.log("[GET] /users - Abruf der Benutzerdaten...");
    try {
        const users = await User.find({}, { password: 0 });
        console.log(`[GET] /users - Anzahl Benutzer: ${users.length}`);
        res.json(users);
    } catch (err) {
        console.error("[GET] /users - Fehler beim Abruf:", err);
        res.status(500).json({ error: "Fehler beim Abrufen der Daten." });
    }
});

// API: Benutzer aktualisieren (Passwort ändern)
app.put('/update-user/:email', async (req, res) => {
    const email = req.params.email;
    const { password } = req.body;

    console.log(`[PUT] /update-user - Benutzer aktualisieren: ${email}`);

    if (!password) {
        return res.status(400).json({ error: "Neues Passwort darf nicht leer sein." });
    }

    try {
        const updatedUser = await User.findOneAndUpdate({ email }, { password }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "Benutzer nicht gefunden." });
        }

        console.log(`[PUT] /update-user - Benutzer erfolgreich aktualisiert (${email})`);
        res.json({ message: "Benutzer erfolgreich aktualisiert." });
    } catch (err) {
        console.error("[PUT] /update-user - Fehler beim Aktualisieren:", err);
        res.status(500).json({ error: "Fehler beim Aktualisieren des Benutzers." });
    }
});

// API: Benutzer löschen (nur Admins)
app.delete('/delete-user/:email', checkAdmin, async (req, res) => {
    const emailToDelete = req.params.email;
    const adminEmail = req.query.email || req.body.email;

    console.log(`[DELETE] /delete-user - Admin ${adminEmail} löscht Benutzer: ${emailToDelete}`);

    if (emailToDelete === adminEmail) {
        return res.status(403).json({ error: "Ein Admin kann sich nicht selbst löschen!" });
    }

    try {
        const deletedUser = await User.findOneAndDelete({ email: emailToDelete });

        if (!deletedUser) {
            return res.status(404).json({ error: "Benutzer nicht gefunden." });
        }

        console.log(`[DELETE] /delete-user - Benutzer erfolgreich gelöscht (${emailToDelete})`);
        res.json({ message: "Benutzer erfolgreich gelöscht." });
    } catch (err) {
        console.error("[DELETE] /delete-user - Fehler beim Löschen:", err);
        res.status(500).json({ error: "Fehler beim Löschen des Benutzers." });
    }
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf http://localhost:${PORT}`));
