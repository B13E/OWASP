const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../server/server");
const User = require("../server/database");

let mongoServer;
let adminToken;
let userToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(); // 🔹 Doppelte Verbindung verhindern
    }

    await mongoose.connect(mongoUri);

    // 🔹 Test-Admin anlegen
    const hashedAdminPassword = await bcrypt.hash("Admin123*", 10);
    const adminUser = await User.create({
        email: "admin@example.com",
        password: hashedAdminPassword,
        isAdmin: true,
    });
    adminToken = jwt.sign(
        { email: adminUser.email, isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    // 🔹 Test-User anlegen
    const hashedUserPassword = await bcrypt.hash("User123*", 10);
    const normalUser = await User.create({
        email: "user@example.com",
        password: hashedUserPassword,
        isAdmin: false,
    });
    userToken = jwt.sign(
        { email: normalUser.email, isAdmin: false },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

// ✅ Test: Benutzer-Registrierung
describe("📌 Benutzer-Registrierung", () => {
    it("✅ sollte einen neuen Benutzer erfolgreich registrieren", async () => {
        const res = await request(app)
            .post("/add-user")
            .send({ email: "test@example.com", password: "Test123*" });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("Benutzer erfolgreich registriert!");
    });

    it("❌ sollte keine doppelte E-Mail zulassen", async () => {
        const res = await request(app)
            .post("/add-user")
            .send({ email: "admin@example.com", password: "Admin123*" });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Diese E-Mail wird bereits verwendet!");
    });
});

// ✅ Test: Benutzer-Login
describe("📌 Benutzer-Login", () => {
    it("✅ sollte Admin erfolgreich einloggen", async () => {
        const res = await request(app)
            .post("/login")
            .send({ email: "admin@example.com", password: "Admin123*" });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Login erfolgreich!");
    });

    it("❌ sollte bei falschem Passwort fehlschlagen", async () => {
        const res = await request(app)
            .post("/login")
            .send({ email: "admin@example.com", password: "FalschesPasswort" });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Ungültige E-Mail oder Passwort.");
    });
});

// ✅ Test: Zugriffskontrolle (Admin vs. User)
describe("📌 Zugriffskontrolle", () => {
    it("✅ sollte Admin auf Dashboard zugreifen können", async () => {
        const res = await request(app)
            .get("/dashboard")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
    });

    it("❌ sollte User keinen Zugriff auf das Dashboard haben", async () => {
        const res = await request(app)
            .get("/dashboard")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Kein Zugriff - Kein Admin!");
    });
});

// ✅ Test: Benutzerverwaltung (Admin kann löschen, User nicht)
describe("📌 Benutzerverwaltung durch Admin", () => {
    it("✅ sollte Admin einen Benutzer löschen können", async () => {
        const res = await request(app)
            .delete("/delete-user/user@example.com")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Benutzer erfolgreich gelöscht.");
    });

    it("❌ sollte User keinen Benutzer löschen können", async () => {
        const res = await request(app)
            .delete("/delete-user/admin@example.com")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Kein Zugriff - Kein Admin!");
    });
});
