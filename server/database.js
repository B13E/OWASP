const mongoose = require('mongoose');

console.log("📌 Verbindung zu MongoDB wird aufgebaut...");
mongoose.connect('mongodb://127.0.0.1:27017/mydatabase')
    .then(() => console.log("✅ MongoDB verbunden"))
    .catch(err => console.error("❌ MongoDB Fehler:", err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }  // ➜ Neu: Admin-Flag (false = normaler User, true = Admin)
});

const User = mongoose.model('User', userSchema);

console.log("📌 Mongoose-Modell 'User' wurde erstellt.");
module.exports = User;
