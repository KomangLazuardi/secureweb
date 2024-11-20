const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Route untuk menampilkan form
app.get('/form', (req, res) => {
    res.send(`
        <form action="/submit" method="POST">
            <input type="text" name="data" placeholder="Enter some data" required>
            <button type="submit">Submit</button>
        </form>
    `);
});

// Route untuk menangani form submission (tanpa CSRF protection)
app.post('/submit', (req, res) => {
    // Proses data yang diterima
    console.log(req.body.data);
    res.send('Data received without CSRF protection!');
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
