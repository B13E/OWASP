const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./database");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(cookieParser());
app.use(helmet()); // Security Headers
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // CORS mit Restriktionen

console.log("📌 Express-Server wird gestartet...");
logToFile("📌 Express-Server wird gestartet...");

// ✅ Logging-Funktion für Sicherheitsvorfälle
function logToFile(message) {
    const now = new Date();
    const formattedTimestamp = `[${now.toISOString()}]`;
    fs.appendFileSync("logs.txt", `${formattedTimestamp} ${message}\n`, "utf8");
}

// ✅ Rate-Limiting für Login-Schutz (max. 5 Versuche pro 15 Min)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 5,
    message: "Zu viele Login-Versuche. Bitte warte 15 Minuten!",
});

// ✅ Middleware: JWT-Authentifizierung
function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Token aus HTTP-Only Cookie

    if (!token) {
        return res.status(401).json({ error: "Kein Token, Zugriff verweigert!" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Ungültiger Token, Zugriff verweigert!" });
        }
        req.user = decoded;
        next();
    });
}

// ✅ Middleware: Admin-Prüfung
function checkAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Kein Zugriff - Kein Admin!" });
    }
    next();
}

// ✅ Benutzerregistrierung (sicher mit bcrypt)
app.post("/add-user", async (req, res) => {
    console.log("[POST] /add-user - Request empfangen:", req.body);

    const { email, password, isAdmin } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "E-Mail und Passwort dürfen nicht leer sein." });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Diese E-Mail wird bereits verwendet!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, isAdmin: isAdmin || false });
        await newUser.save();

        res.status(201).json({ message: "Benutzer erfolgreich registriert!" });
    } catch (err) {
        console.error("[POST] /add-user - Fehler:", err);
        res.status(500).json({ error: "Datenbankfehler, bitte erneut versuchen." });
    }
});

// ✅ Login mit JWT & bcrypt
app.post("/login", loginLimiter, async (req, res) => {
    console.log("[POST] /login - Login-Anfrage erhalten:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "E-Mail und Passwort erforderlich." });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`[POST] /login - Fehler: Benutzer nicht gefunden für E-Mail: ${email}`);
            return res.status(401).json({ error: "Ungültige E-Mail oder Passwort." });
        }

        console.log(`[POST] /login - Gefundener Benutzer:`, user);

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.error(`[POST] /login - Fehler: Passwort stimmt nicht überein.`);
            return res.status(401).json({ error: "Ungültige E-Mail oder Passwort." });
        }

        console.log(`[POST] /login - Erfolgreich angemeldet: ${email}`);

        const token = jwt.sign({ email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
            expiresIn: "15m",
        });

        res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "Strict" });
        res.status(200).json({ message: "Login erfolgreich!", redirect: user.isAdmin ? "/dashboard.html" : "/userlist.html" });

    } catch (err) {
        console.error("[POST] /login - Serverfehler:", err);
        res.status(500).json({ error: "Serverfehler, bitte erneut versuchen." });
    }
});

// ✅ Logout (Cookie entfernen)
app.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Erfolgreich ausgeloggt!" });
});

// ✅ Benutzerliste abrufen (Token-geschützt)
app.get("/users", authenticateToken, async (req, res) => {
    console.log("[GET] /users - Abruf der Benutzerdaten...");
    try {
        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (err) {
        console.error("[GET] /users - Fehler:", err);
        res.status(500).json({ error: "Fehler beim Abrufen der Daten." });
    }
});

app.put('/update-user/:email', authenticateToken, async (req, res) => {
    const email = req.params.email;
    const { password } = req.body;

    console.log(`[PUT] /update-user - Benutzer aktualisieren: ${email}`);

    if (!password) {
        console.error("[PUT] /update-user - Fehler: Neues Passwort fehlt.");
        return res.status(400).json({ error: "Neues Passwort darf nicht leer sein." });
    }

    try {
        // 🔹 Prüfen, ob Benutzer existiert
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`[PUT] /update-user - Fehler: Benutzer nicht gefunden (${email})`);
            return res.status(404).json({ error: "Benutzer nicht gefunden." });
        }

        // 🔹 Passwort hashen
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 🔹 Passwort in der DB aktualisieren
        user.password = hashedPassword;
        await user.save();

        console.log(`[PUT] /update-user - Benutzer erfolgreich aktualisiert (${email})`);
        res.json({ message: "Benutzer erfolgreich aktualisiert." });
    } catch (err) {
        console.error("[PUT] /update-user - Fehler beim Aktualisieren:", err);
        res.status(500).json({ error: "Fehler beim Aktualisieren des Benutzers." });
    }
});


// ✅ Benutzer löschen (nur Admin)
app.delete("/delete-user/:email", authenticateToken, checkAdmin, async (req, res) => {
    const emailToDelete = req.params.email;
    console.log(`[DELETE] /delete-user - Admin löscht Benutzer: ${emailToDelete}`);

    try {
        const deletedUser = await User.findOneAndDelete({ email: emailToDelete });

        if (!deletedUser) {
            return res.status(404).json({ error: "Benutzer nicht gefunden." });
        }

        res.json({ message: "Benutzer erfolgreich gelöscht." });
    } catch (err) {
        console.error("[DELETE] /delete-user - Fehler:", err);
        res.status(500).json({ error: "Fehler beim Löschen des Benutzers." });
    }
});

// ✅ Server starten
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf http://localhost:${PORT}`));
