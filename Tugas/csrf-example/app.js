const express = require('express');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const Joi = require('joi');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // Gunakan express.urlencoded() alih-alih body-parser
app.use(express.json()); // Gunakan express.json() alih-alih body-parser

// Transfer Schema
const transferSchema = Joi.object({
    _csrf: Joi.string().required(),
    to: Joi.string().alphanum().required(),
    amount: Joi.number().required()
});

// CSRF Protection Middleware
const csrfProtection = csrf({ cookie: true });

// Route untuk menampilkan form
app.get('/form', csrfProtection, (req, res) => {
    res.send(`
        <form action="/submit" method="POST">
            <input type="hidden" name="_csrf" value="${req.csrfToken()}">
            <input type="text" name="data" placeholder="Enter some data" required>
            <button type="submit">Submit</button>
        </form>
    `);
});

// Route untuk menampilkan form login dengan CSRF token
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login</title>
        </head>
        <body>
            <h1>Login</h1>
            <form action="/login" method="POST">
                <input type="hidden" name="_csrf" value="${req.csrfToken()}">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        </body>
        </html>
    `);
});

// Route untuk menangani login
app.post('/login', csrfProtection, (req, res) => {
    const { username, password } = req.body;

    // Proses autentikasi sederhana (hanya untuk ilustrasi)
    if (username === 'admin' && password === 'admin123') {
        // Set cookie token A001
        res.cookie('token', 'A001');
        res.send('Login successful!');
    } else {
        res.status(401).send('Invalid username or password');
    }
});

// Route untuk menampilkan form transfer dengan CSRF token
app.get('/transfer', csrfProtection, (req, res) => {
    const token = req.cookies.token;

    if (token === 'A001') {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Transfer</title>
            </head>  
            <body>
                <h1>Transfer</h1>
                <form action="/transfer" method="POST">
                    <input type="hidden" name="_csrf" value="${req.csrfToken()}">
                    <input type="text" name="to" placeholder="Input To" required>
                    <input type="number" name="amount" placeholder="Input Amount" required>
                    <button type="submit">Transfer</button>
                </form>
            </body>
            </html>
        `);
    } else {
        res.status(401).send('Please login');
    }
});

// Route untuk menangani form transfer
app.post('/transfer', csrfProtection, (req, res) => {
    const { error, value } = transferSchema.validate(req.body);

    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const { to, amount } = value;
    const token = req.cookies.token;

    if (token === 'A001') {
        console.log(`Transfer ${amount} to ${to}`);
        res.send('Transfer successful!');
    } else {
        res.status(401).send('Please login');
    }
});

// Route untuk menangani form submission
app.post('/submit', csrfProtection, (req, res) => {
    console.log(req.body.data);
    res.send('Data received and CSRF token verified!');
});

// Menangani error CSRF
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send('Invalid CSRF token');
    }
    next(err);
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
