const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const csurf = require("csurf");
const helmet = require("helmet");
const sqlite3 = require("sqlite3").verbose();
const xss = require("xss");

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

// Routes
app.get("/", (req, res) => {
  res.redirect("/sign-in");
});

// Sign-in form
app.get("/sign-in", (req, res) => {
  res.render("sign-in", { csrfToken: req.csrfToken(), error: null });
});

app.post("/sign-in", (req, res) => {
  const { username, password } = req.body;
  const sanitizedUsername = xss(username);

  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [sanitizedUsername, password],
    (err, user) => {
      if (err || !user) {
        res.render("sign-in", { csrfToken: req.csrfToken(), error: "Invalid credentials" });
      } else {
        req.session.userId = user.id;
        res.redirect("/transfer");
      }
    }
  );
});

// Sign-up form
app.get("/sign-up", (req, res) => {
  res.render("sign-up", { csrfToken: req.csrfToken(), error: null });
});

app.post("/sign-up", (req, res) => {
  const { username, password } = req.body;
  const sanitizedUsername = xss(username);

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [sanitizedUsername, password],
    (err) => {
      if (err) {
        res.render("sign-up", { csrfToken: req.csrfToken(), error: "Username already exists" });
      } else {
        res.redirect("/sign-in");
      }
    }
  );
});

// Transfer form
app.get("/transfer", (req, res) => {
  if (!req.session.userId) return res.redirect("/sign-in");
  res.render("transfer", { csrfToken: req.csrfToken(), error: null });
});

app.post("/transfer", (req, res) => {
  if (!req.session.userId) return res.redirect("/sign-in");

  const { recipient, amount } = req.body;
  const sanitizedRecipient = xss(recipient);

  // Log transfer (or process it in real applications)
  console.log(`Transfer ${amount} to ${sanitizedRecipient}`);
  res.render("transfer", {
    csrfToken: req.csrfToken(),
    error: `Transfer to ${sanitizedRecipient} successful`,
  });
});

// Server setup
// Server setup
const PORT = 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.error("Error starting server:", err.message);
  } else {
    console.log(`Localhost running at port ${PORT}`);
  }
});

