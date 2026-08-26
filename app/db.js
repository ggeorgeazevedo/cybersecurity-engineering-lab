const Database = require('better-sqlite3');

const db = new Database(':memory:'); // banco em memória: zera a cada start

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL
  );
  INSERT INTO users (username, email) VALUES
    ('alice', 'alice@lab.local'),
    ('bob',   'bob@lab.local');
`);

module.exports = db;