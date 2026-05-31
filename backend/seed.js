const { db, initDb } = require('./db');

function seed() {
  initDb();
  
  // Clear existing data
  db.exec('DELETE FROM bookings');
  db.exec('DELETE FROM conversations');
  db.exec('DELETE FROM leads');
  db.exec('DELETE FROM clients');

  // Insert a test client
  const clientInfo = db.prepare('INSERT INTO clients (name, email, phone, business_name) VALUES (?, ?, ?, ?)').run(
    'John Doe',
    'john@example.com',
    '555-0100',
    'Doe Roofing & Siding'
  );
  const clientId = clientInfo.lastInsertRowid;

  // Insert some test leads
  const lead1Info = db.prepare(`
    INSERT INTO leads (client_id, name, phone, email, service_type, urgency, status, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    clientId,
    'Alice Smith',
    '555-0201',
    'alice@gmail.com',
    'Roof Replacement',
    'Normal',
    'warm',
    'Interested in a new roof estimate.'
  );
  const lead1Id = lead1Info.lastInsertRowid;

  const lead2Info = db.prepare(`
    INSERT INTO leads (client_id, name, phone, email, service_type, urgency, status, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    clientId,
    'Bob Johnson',
    '555-0202',
    'bob@outlook.com',
    'Emergency Repair',
    'High',
    'hot',
    'Needs emergency leak repair ASAP.'
  );
  const lead2Id = lead2Info.lastInsertRowid;

  // Insert some messages
  db.prepare('INSERT INTO conversations (lead_id, sender, content) VALUES (?, ?, ?)').run(
    lead1Id,
    'lead',
    'Hi, I would like to get a quote for a roof replacement.'
  );
  db.prepare('INSERT INTO conversations (lead_id, sender, content) VALUES (?, ?, ?)').run(
    lead1Id,
    'ai',
    'Hello Alice! I can definitely help with that. What is the approximate square footage of your roof?'
  );

  db.prepare('INSERT INTO conversations (lead_id, sender, content) VALUES (?, ?, ?)').run(
    lead2Id,
    'lead',
    'My roof is leaking! Can someone come today?'
  );
  db.prepare('INSERT INTO conversations (lead_id, sender, content) VALUES (?, ?, ?)').run(
    lead2Id,
    'ai',
    'I understand this is an emergency, Bob. Let me check our availability for today.'
  );

  // Insert a booking
  db.prepare('INSERT INTO bookings (lead_id, client_id, service, appointment_time, status) VALUES (?, ?, ?, ?, ?)').run(
    lead2Id,
    clientId,
    'Emergency Leak Repair',
    new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    'confirmed'
  );

  console.log('Database seeded successfully.');
}

seed();
