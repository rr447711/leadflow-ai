const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'leadflow.db');
const db = new Database(dbPath);

// Initialize database schema
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      business_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      service_type TEXT,
      urgency TEXT,
      location TEXT,
      budget TEXT,
      status TEXT DEFAULT 'cold', -- 'hot', 'warm', 'cold'
      source TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      sender TEXT NOT NULL, -- 'lead' or 'ai'
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      service TEXT,
      appointment_time DATETIME NOT NULL,
      status TEXT DEFAULT 'pending', -- 'confirmed', 'pending', 'cancelled'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id),
      FOREIGN KEY (client_id) REFERENCES clients (id)
    );
  `);
  
  console.log('Database initialized.');
}

module.exports = {
  db,
  initDb
};
