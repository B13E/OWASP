// ✅ E-Mail-Validierung
function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email) ? null : "Die E-Mail-Adresse muss ein gültiges Format haben (z. B. name@example.com).";
}

// ✅ Passwort-Validierung (starkes Passwort erforderlich)
function validatePassword(password) {
    if (!/.{8,}/.test(password)) return "Passwort muss mindestens 8 Zeichen haben.";
    if (!/[A-Z]/.test(password)) return "Passwort muss mindestens einen Großbuchstaben enthalten.";
    if (!/[a-z]/.test(password)) return "Passwort muss mindestens einen Kleinbuchstaben enthalten.";
    if (!/\d/.test(password)) return "Passwort muss mindestens eine Zahl enthalten.";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) return "Passwort muss mindestens ein Sonderzeichen enthalten.";
    return null;
}

// ✅ Benutzer registrieren (mit Validierung)
async function saveData() {
    const emailInput = document.getElementById("email").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!emailInput || !passwordInput) {
        return alert("E-Mail und Passwort dürfen nicht leer sein.");
    }

    const emailError = validateEmail(emailInput);
    if (emailError) return alert(emailError);

    const passwordError = validatePassword(passwordInput);
    if (passwordError) return alert(passwordError);

    console.log("[Client] Sende Registrierungsanfrage:", { email: emailInput });

    try {
        const response = await fetch("/add-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailInput, password: passwordInput })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("[Client] Fehler beim Speichern:", result.error);
            return alert("Fehler beim Speichern: " + result.error);
        }

        alert("Benutzer erfolgreich registriert!");
        window.location.href = "/"; // Zurück zur Login-Seite
    } catch (error) {
        console.error("[Client] Netzwerkfehler:", error);
        alert("Netzwerk- oder Serverfehler. Siehe Konsole für Details.");
    }
}

// ✅ Benutzer Login mit JWT
async function login() {
    const emailInput = document.getElementById("email").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!emailInput || !passwordInput) {
        return alert("E-Mail und Passwort erforderlich.");
    }

    console.log("[Client] Login-Versuch:", { email: emailInput });

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailInput, password: passwordInput })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("[Client] Fehler beim Login:", result.error);
            return alert("Fehler beim Login: " + result.error);
        }

        alert("Login erfolgreich! Weiterleitung...");
        window.location.href = result.redirect;
    } catch (error) {
        console.error("[Client] Netzwerkfehler:", error);
        alert("Netzwerk- oder Serverfehler. Siehe Konsole für Details.");
    }
}

// ✅ Benutzerliste abrufen (mit Token-Sicherheit)
async function loadUsers() {
    try {
        const response = await fetch("/users", { credentials: "include" });

        if (!response.ok) throw new Error("Fehler beim Abrufen der Benutzerdaten.");

        const users = await response.json();
        const userList = document.getElementById("user-list");
        userList.innerHTML = "";

        users.forEach((user, index) => {
            const userCard = document.createElement("div");
            userCard.classList.add("user-card");
            userCard.innerHTML = `
                <p><strong>#${index + 1}</strong> ${user.email}</p>
                <div class="button-group">
                    <button class="edit-btn" onclick="openPopup('${user.email}')">Bearbeiten</button>
                    <button class="delete-btn" onclick="deleteUser('${user.email}')">Löschen</button>
                </div>
            `;
            userList.appendChild(userCard);
        });
    } catch (error) {
        console.error("[Client] Fehler beim Laden der Benutzerdaten:", error);
    }
}

// ✅ Benutzer löschen (nur Admins)
async function deleteUser(email) {
    if (!confirm(`Möchtest du den Benutzer ${email} wirklich löschen?`)) return;

    try {
        const response = await fetch(`/delete-user/${email}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (!response.ok) {
            console.error("[Client] Fehler beim Löschen.");
            return alert("Fehler beim Löschen des Benutzers.");
        }

        alert("Benutzer erfolgreich gelöscht.");
        loadUsers();
    } catch (error) {
        console.error("[Client] Fehler beim Löschen:", error);
    }
}

// ✅ Benutzer bearbeiten (Passwort ändern)
function openPopup(email) {
    document.getElementById("edit-email").value = email;
    document.getElementById("edit-popup").style.display = "block";
}

function closePopup() {
    document.getElementById("edit-popup").style.display = "none";
}

async function updateUser() {
    const newPassword = document.getElementById("edit-password").value;
    if (!newPassword) {
        alert("Bitte ein neues Passwort eingeben.");
        return;
    }

    try {
        const response = await fetch(`/update-user/${currentUserEmail}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${document.cookie.replace("token=", "")}` // 🔹 Token mitsenden
            },
            body: JSON.stringify({ password: newPassword })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Benutzer erfolgreich aktualisiert.");
            closePopup();
            loadUsers();
        } else {
            console.error("[Client] Fehler beim Aktualisieren:", result.error);
            alert("Fehler beim Aktualisieren: " + result.error);
        }
    } catch (error) {
        console.error("[Client] Netzwerk- oder Serverfehler:", error);
        alert("Netzwerk- oder Serverfehler. Siehe Konsole für Details.");
    }
}

// ✅ Logout (Token löschen)
async function logout() {
    try {
        await fetch("/logout", { method: "POST", credentials: "include" });
        alert("Erfolgreich ausgeloggt!");
        window.location.href = "/";
    } catch (error) {
        console.error("[Client] Fehler beim Logout:", error);
    }
}

// ✅ Falls auf Dashboard-Seite, lade Benutzer
if (window.location.pathname === "/dashboard.html") {
    loadUsers();
}
