# Automated Banking Email System

A full-stack **PERN** (PostgreSQL, Express, React, Node.js) application that automates transactional banking emails — account balance updates, transaction summaries, and low-balance alerts.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│  React Admin │────▶│  Express API     │────▶│  PostgreSQL  │
│  Dashboard   │     │  (Port 4000)     │     │  (Supabase)  │
│  (Port 5173) │     │                  │     │              │
└──────────────┘     │  ┌────────────┐  │     └─────────────┘
                     │  │ Scheduler  │  │
                     │  │ (node-cron)│  │     ┌─────────────┐
                     │  └─────┬──────┘  │────▶│  SMTP/Brevo  │
                     │        │         │     │  Email Relay  │
                     └────────┼─────────┘     └─────────────┘
                              │
                     Cron Jobs:
                     • Email queue   → every 2 min
                     • Daily summary → 9:00 AM
                     • Low balance   → every 6 hrs
```

## Features

- **Automated Emails**: Balance updates, transaction summaries, low-balance alerts
- **Email Templates**: HTML templates via Handlebars with responsive design
- **Scheduling**: Cron-based job scheduling for daily/weekly/monthly summaries
- **Queue System**: Email queue with retry logic (exponential backoff, 3 retries)
- **Logging**: File + console logging with timestamps and log levels
- **Admin Dashboard**: React frontend for monitoring and manual email triggers
- **Audit Trail**: All transactions logged in audit_logs table

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (Supabase) |
| Email | Nodemailer + Brevo SMTP |
| Scheduling | node-cron |
| Templates | Handlebars |

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)
- SMTP credentials (Brevo or similar)

### 1. Clone & Install

```bash
git clone https://github.com/Saiweb1718/automated-bank-mailer.git
cd automated-bank-mailer

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment

Copy `server/.env` and update the following:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-user
DB_PASSWORD=your-password

# SMTP (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password

# Scheduling
DAILY_SUMMARY_CRON=0 9 * * *
EMAIL_RETRY_ATTEMPTS=3
```

### 3. Initialize Database

Run the schema against your PostgreSQL database:

```bash
psql -f server/schema.sql
```

### 4. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- **API**: http://localhost:4000
- **Dashboard**: http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/v1/customers` | List all customers |
| `GET` | `/api/v1/customers/:id` | Customer details + accounts + preferences |
| `PUT` | `/api/v1/customers/:id/preferences` | Update email preferences |
| `GET` | `/api/v1/accounts/:id` | Account details |
| `GET` | `/api/v1/accounts/:id/balance` | Account balance |
| `POST` | `/api/v1/transactions` | Create transaction |
| `GET` | `/api/v1/transactions/:id/history` | Transaction history |
| `GET` | `/api/v1/emails/dashboard` | Dashboard stats |
| `GET` | `/api/v1/emails/notifications` | All email notifications |
| `POST` | `/api/v1/emails/send-balance/:cid/:aid` | Queue balance email |
| `POST` | `/api/v1/emails/send-summary/:cid/:aid` | Queue summary email |
| `POST` | `/api/v1/emails/process-queue` | Process pending email queue |

## Database Schema

6 tables: `customers`, `accounts`, `transactions`, `email_notifications`, `email_preferences`, `audit_logs`

See [schema.sql](server/schema.sql) for full DDL with indexes, triggers, and constraints.

## Project Structure

```
automated-bank-mailer/
├── client/                  # React frontend
│   └── src/
│       ├── pages/           # Dashboard, Customers, Emails
│       ├── api.js           # API client
│       └── App.jsx          # Main app with routing
├── server/                  # Express backend
│   ├── schema.sql           # Database DDL
│   └── src/
│       ├── config/          # DB, Email, Logger config
│       ├── controllers/     # Request handlers
│       ├── middlewares/      # Validation, error handling
│       ├── routes/           # API route definitions
│       ├── services/         # Email, notification, scheduler
│       └── utils/            # Templates, helpers
```

## Team

Built collaboratively by a team of 3 developers.