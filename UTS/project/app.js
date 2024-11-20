const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const csurf = require("csurf");
const helmet = require("helmet");
const sqlite3 = require("sqlite3").verbose();
const xss = require("xss");
const Joi = require("joi"); // Menggunakan Joi untuk validasi

const app = express();
const db = new sqlite3.Database("db.sqlite");

// Middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(csurf());
app.use(helmet());

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
  res.redirect("/sign-in");
});

// Sign-in form
app.get("/sign-in", (req, res) => {
  res.sendFile(__dirname + "/public/sign-in.html"); // Serve HTML form
});

app.post("/sign-in", (req, res) => {
  const { username, password } = req.body;
  const sanitizedUsername = xss(username);

  // Validasi dengan Joi
  const { error } = userSchema.validate({ username: sanitizedUsername, password });

  if (error) {
    return res.send("Error: " + error.details[0].message); // Menampilkan error validasi
  }

  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [sanitizedUsername, password],
    (err, user) => {
      if (err || !user) {
        return res.send("Invalid credentials");
      } else {
        req.session.userId = user.id;
        res.redirect("/transfer");
      }
    }
  );
});

// Sign-up form
app.get("/sign-up", (req, res) => {
  res.sendFile(__dirname + "/public/sign-up.html"); // Serve HTML form
});

app.post("/sign-up", (req, res) => {
  const { username, password } = req.body;
  const sanitizedUsername = xss(username);

  // Validasi dengan Joi
  const { error } = userSchema.validate({ username: sanitizedUsername, password });

  if (error) {
    return res.send("Error: " + error.details[0].message); // Menampilkan error validasi
  }

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [sanitizedUsername, password],
    (err) => {
      if (err) {
        return res.send("Username already exists");
      } else {
        res.redirect("/sign-in");
      }
    }
  );
});

// Transfer form
app.get("/transfer", (req, res) => {
  if (!req.session.userId) return res.redirect("/sign-in");
  res.sendFile(__dirname + "/public/transfer.html"); // Serve HTML form
});

app.post("/transfer", (req, res) => {
  if (!req.session.userId) return res.redirect("/sign-in");

  const { recipient, amount } = req.body;
  const sanitizedRecipient = xss(recipient);

  // Log transfer (or process it in real applications)
  console.log(`Transfer ${amount} to ${sanitizedRecipient}`);
  res.send(`Transfer to ${sanitizedRecipient} successful`);
});

// Server setup
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



// tes git 
