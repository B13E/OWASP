const request = require("supertest");
const app = require("../server/server"); // Stelle sicher, dass dies dein Server ist

describe("🚀 Teste API Endpunkte", () => {
    it("🔹 Test: Server läuft", async () => {
        const res = await request(app).get("/users");
        expect(res.status).toBe(401); // Weil kein Token
    });

    it("🔹 Test: Registrierung", async () => {
        const res = await request(app).post("/add-user").send({
            email: "testuser@example.com",
            password: "Test1234!",
        });
        expect(res.status).toBe(201);
    });
});
