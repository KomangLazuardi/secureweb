const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const csurf = require("csurf");
const helmet = require("helmet");
const sqlite3 = require("sqlite3").verbose();
const xss = require("xss");
const Joi = require("joi"); // Library untuk validasi input

const app = express();
const db = new sqlite3.Database("db.sqlite");

// Middleware
app.use(express.static("public")); // Untuk melayani file HTML dan aset statis
app.use(bodyParser.urlencoded({ extended: true })); // Parsing form data
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(csurf()); // Perlindungan CSRF
app.use(helmet()); // Perlindungan HTTP headers

// Database setup
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
});

// Validasi Joi
const userSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().alphanum(),
  password: Joi.string().min(6).required(),
});

// Routes
app.get("/", (req, res) => {
  res.redirect("/sign-in"); // Mengarahkan pengguna ke halaman sign-in
});

// Sign-in form
app.get("/sign-in", (req, res) => {
  res.sendFile(__dirname + "/public/sign-in.html"); // Menyajikan file HTML untuk sign-in
});

app.post("/sign-in", (req, res) => {
  const { username, password } = req.body;
  const sanitizedUsername = xss(username); // Membersihkan input untuk mencegah XSS

  // Validasi dengan Joi
  const { error } = userSchema.validate({ username: sanitizedUsername, password });
  if (error) {
    return res.send("Error: " + error.details[0].message); // Menampilkan pesan error validasi
  }

  // Verifikasi pengguna di database
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [sanitizedUsername, password],
    (err, user) => {
      if (err || !user) {
        return res.send("Invalid credentials"); // Tanggapan untuk kredensial yang salah
      } else {
        req.session.userId = user.id; // Simpan sesi pengguna
        res.redirect("/transfer");
      }
    }
  );
});

// Sign-up form
app.get("/sign-up", (req, res) => {
  res.sendFile(__dirname + "/public/sign-up.html"); // Menyajikan file HTML untuk sign-up
});

app.post("/sign-up", (req, res) => {
  const { username, password } = req.body;
  const sanitizedUsername = xss(username); // Membersihkan input untuk mencegah XSS

  // Validasi dengan Joi
  const { error } = userSchema.validate({ username: sanitizedUsername, password });
  if (error) {
    return res.send("Error: " + error.details[0].message); // Menampilkan pesan error validasi
  }

  // Tambahkan pengguna baru ke database
  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [sanitizedUsername, password],
    (err) => {
      if (err) {
        return res.send("Username already exists"); // Pesan error jika username sudah terdaftar
      } else {
        res.redirect("/sign-in"); // Redirect ke halaman sign-in
      }
    }
  );
});

// Transfer form
app.get("/transfer", (req, res) => {
  if (!req.session.userId) return res.redirect("/sign-in"); // Pastikan pengguna telah sign-in
  res.sendFile(__dirname + "/public/transfer.html"); // Menyajikan file HTML untuk transfer
});

app.post("/transfer", (req, res) => {
  if (!req.session.userId) return res.redirect("/sign-in"); // Pastikan pengguna telah sign-in

  const { recipient, amount } = req.body;
  const sanitizedRecipient = xss(recipient); // Membersihkan input untuk mencegah XSS

  // Log transfer (sebagai simulasi transfer)
  console.log(`Transfer ${amount} to ${sanitizedRecipient}`);
  res.send(`Transfer to ${sanitizedRecipient} successful`);
});

// Server setup
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



// tes git 


// ini zaki yg test