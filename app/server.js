const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ✅ SEGURO — query parametrizada
app.get('/users/secure', (req, res) => {
  const { username } = req.query;
  const row = db.prepare(`SELECT id, username, email FROM users WHERE username = '${username}'`).get();
  res.json(row || {});
});

// ❌ INSEGURO — SQL Injection (input concatenado direto na query)
app.get('/users/insecure', (req, res) => {
  const { username } = req.query;
  const sql = `SELECT id, username, email FROM users WHERE username = '${username}'`;
  try {
    const rows = db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`lab app on :${port}`));
}

module.exports = app;
