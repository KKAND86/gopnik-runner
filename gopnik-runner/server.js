const express = require('express');
const path = require('path');
const app = express();
const port = 5174;

// Статические файлы из корня (index.html, phaser.min.js, src/)
app.use(express.static(__dirname));

// SPA fallback
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});
