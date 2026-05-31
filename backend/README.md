# LeadFlow AI Backend

The core backend infrastructure for LeadFlow AI, providing lead management, AI qualification, and booking capabilities for local service businesses.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: SQLite (via `better-sqlite3`)

## Getting Started
1. `npm install`
2. `npm run seed` (Initializes and populates the database with demo data)
3. `npm start` (Runs the server on http://0.0.0.0:3001)

## API Specification

All endpoints return a standardized JSON response:
```json
{
  "success": true,
  "data": ...,
  "error": null
}
```

### Lead Management
- `POST /api/leads` — Capture a new lead.
- `GET /api/leads` — List all leads. Supports filtering via query param: `?status=hot`.
- `GET /api/leads/:id` — Get detailed lead info including conversation history.
- `POST /api/leads/:id/qualify` — Trigger AI qualification logic based on conversation history. Tags lead as `hot`, `warm`, or `cold`.
- `POST /api/leads/:id/messages` — Record a new message in a conversation.
- `POST /api/leads/:id/booking` — Create a new appointment for a lead.

### Bookings
- `GET /api/bookings` — List all scheduled bookings.

### Clients
- `POST /api/clients/register` — Register a new business client.
- `POST /api/clients/login` — Simple login via email.

### Dashboard
- `GET /api/stats` — Retrieve summary statistics (total leads, conversion rate, etc.).

## Qualification Logic
- **Hot**: Mentions urgency keywords like `emergency`, `urgent`, `today`, `asap`, `leak`.
- **Warm**: Mentions project details/interest keywords like `quote`, `price`, `estimate`, `planning`.
- **Cold**: Default status for general inquiries.
