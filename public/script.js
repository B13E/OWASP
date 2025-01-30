function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

async function saveData() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        console.error("[Client] Fehler: E-Mail und Passwort dürfen nicht leer sein.");
        alert("E-Mail und Passwort dürfen nicht leer sein.");
        return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
        console.error("[Client] Fehler: " + emailError);
        alert(emailError);
        return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        console.error("[Client] Fehler: " + passwordError);
        alert(passwordError);
        return;
    }

    console.log("[Client] Daten werden gesendet:", { email, password });

    try {
        const response = await fetch('/add-user', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("[Client] Fehler beim Speichern:", result.error);
            alert("Fehler beim Speichern: " + result.error);
        } else {
            console.log("[Client] Speichern erfolgreich!");
            alert("Gespeichert!");
            emailInput.value = "";  // Eingabe leeren
            passwordInput.value = ""; // Eingabe leeren
        }
    } catch (error) {
        console.error("[Client] Netzwerk- oder Serverfehler:", error);
        alert("Netzwerk- oder Serverfehler. Siehe Konsole für Details.");
    }
}

async function login() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        console.error("[Client] Fehler: E-Mail und Passwort erforderlich.");
        alert("E-Mail und Passwort erforderlich.");
        return;
    }

    console.log("[Client] Login wird versucht mit:", { email, password });

    try {
        const response = await fetch('/login', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("[Client] Login erfolgreich! Weiterleitung...");
            emailInput.value = "";  // Eingabe leeren
            passwordInput.value = ""; // Eingabe leeren
            window.location.href = result.redirect;
        } else {
            console.error("[Client] Fehler beim Login:", result.error);
            alert("Fehler beim Login: " + result.error);
        }
    } catch (error) {
        console.error("[Client] Netzwerk- oder Serverfehler:", error);
        alert("Netzwerk- oder Serverfehler. Siehe Konsole für Details.");
    }
}
