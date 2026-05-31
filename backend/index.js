require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDb, db } = require('./db');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://rr447711.github.io', 'http://localhost:8080', 'http://localhost:3000', 'https://leadflow-ai.com'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize Database
initDb();

// Helper for standardized response
const sendResponse = (res, success, data = null, error = null, status = 200) => {
  res.status(status).json({ success, data, error });
};

// Routes
app.get('/', (req, res) => {
  sendResponse(res, true, { message: 'LeadFlow AI Backend API' });
});

// --- CLIENTS ---
app.post('/api/clients/register', (req, res) => {
  try {
    const { name, email, phone, business_name } = req.body;
    if (!name || !email) return sendResponse(res, false, null, 'Name and email are required', 400);
    
    const info = db.prepare('INSERT INTO clients (name, email, phone, business_name) VALUES (?, ?, ?, ?)').run(name, email, phone, business_name);
    sendResponse(res, true, { id: info.lastInsertRowid }, null, 211);
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

app.post('/api/clients/login', (req, res) => {
  const { email } = req.body;
  const client = db.prepare('SELECT * FROM clients WHERE email = ?').get(email);
  if (client) {
    sendResponse(res, true, { client });
  } else {
    sendResponse(res, false, null, 'Invalid credentials', 401);
  }
});

// --- LEADS ---
app.post('/api/leads', (req, res) => {
  try {
    const { client_id, name, phone, email, service_type, urgency, location, budget, source, notes } = req.body;
    if (!client_id || !phone) return sendResponse(res, false, null, 'client_id and phone are required', 400);
    
    const info = db.prepare(`
      INSERT INTO leads (client_id, name, phone, email, service_type, urgency, location, budget, source, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(client_id, name, phone, email, service_type, urgency, location, budget, source, notes);
    
    const newLeadId = info.lastInsertRowid;
    sendResponse(res, true, { id: newLeadId }, null, 201);
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

app.get('/api/leads', (req, res) => {
  try {
    const { status } = req.query;
    let leads;
    if (status) {
      leads = db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC').all(status);
    } else {
      leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    }
    sendResponse(res, true, leads);
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

app.get('/api/leads/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return sendResponse(res, false, null, 'Lead not found', 404);
    
    const messages = db.prepare('SELECT * FROM conversations WHERE lead_id = ? ORDER BY timestamp ASC').all(req.params.id);
    lead.conversations = messages;
    
    sendResponse(res, true, lead);
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

app.post('/api/leads/:id/qualify', (req, res) => {
  try {
    const lead_id = req.params.id;
    const messages = db.prepare('SELECT content FROM conversations WHERE lead_id = ?').all(lead_id);
    
    let combinedContent = messages.map(m => m.content.toLowerCase()).join(' ');
    let newStatus = 'cold';
    
    const hotKeywords = ['emergency', 'urgent', 'today', 'asap', 'leak', 'ready to book', 'broken'];
    const warmKeywords = ['quote', 'price', 'estimate', 'how much', 'planning', 'next week'];
    
    const isHot = hotKeywords.some(kw => combinedContent.includes(kw));
    const isWarm = warmKeywords.some(kw => combinedContent.includes(kw));
    
    if (isHot) newStatus = 'hot';
    else if (isWarm) newStatus = 'warm';
    
    db.prepare('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, lead_id);
    
    sendResponse(res, true, { status: newStatus });
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

app.post('/api/leads/:id/booking', (req, res) => {
  try {
    const lead_id = req.params.id;
    const { client_id, service, appointment_time } = req.body;
    
    const info = db.prepare('INSERT INTO bookings (lead_id, client_id, service, appointment_time) VALUES (?, ?, ?, ?)').run(
      lead_id, client_id, service, appointment_time
    );
    
    sendResponse(res, true, { id: info.lastInsertRowid });
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

// --- BOOKINGS ---
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, l.name as lead_name, l.phone as lead_phone 
      FROM bookings b 
      JOIN leads l ON b.lead_id = l.id 
      ORDER BY b.appointment_time ASC
    `).all();
    sendResponse(res, true, bookings);
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

// --- STATS ---
app.get('/api/stats', (req, res) => {
  try {
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const hotLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'hot'").get().count;
    const bookedJobs = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status != 'cancelled'").get().count;
    
    // Simple conversion rate: Booked / Total
    const conversionRate = totalLeads > 0 ? ((bookedJobs / totalLeads) * 100).toFixed(1) + '%' : '0%';
    
    sendResponse(res, true, {
      totalLeads,
      hotLeads,
      bookedJobs,
      conversionRate,
      averageResponseTime: '< 60 seconds' // Placeholder as per target
    });
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

// --- CONVERSATIONS (helper for testing) ---
app.post('/api/leads/:id/messages', (req, res) => {
  try {
    const { sender, content } = req.body;
    const lead_id = req.params.id;
    db.prepare('INSERT INTO conversations (lead_id, sender, content) VALUES (?, ?, ?)').run(lead_id, sender, content);
    sendResponse(res, true, { message: 'Message recorded' });
  } catch (err) {
    sendResponse(res, false, null, err.message, 500);
  }
});

// Start Server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
