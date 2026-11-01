# AI Lead Follow-Up Assistant

An AI-powered lead follow-up automation that reads new leads from Google Sheets, generates personalized follow-up emails using Gemini, and creates Gmail drafts for human review.

![Demo](demo/Demo_GIF.gif)

## Multi-User Backend

LeadFlow uses an authenticated Node.js API and PostgreSQL through Prisma. Each Google identity maps to one LeadFlow user. That user's encrypted refresh token, spreadsheet settings, Gmail drafts, processing records and monthly quota are isolated by the authenticated user ID. The app creates Gmail drafts for review and never sends email.

### Local setup

1. Install PostgreSQL and create a database for LeadFlow.
2. Copy `backend/.env.example` to `backend/.env` and set the local values. Generate `TOKEN_ENCRYPTION_KEY` with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`; use a different long random value for `JWT_SECRET`.
3. In Google Cloud, enable the Gmail API and Google Sheets API, create an OAuth **Web application** client, add `http://localhost:5000/api/auth/google/callback` as an authorized redirect URI, and add `http://localhost:5173` as an authorized JavaScript origin. Add the required Google test accounts to the consent screen while the app is in testing mode.
4. Set up a Gemini API key in `GEMINI_API_KEY`.
5. Apply migrations and start the backend:

```powershell
cd backend
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
npm start
```

6. In another terminal, start the frontend:

```powershell
cd frontend
npm ci
npm run dev
```

7. Visit `http://localhost:5173`, sign in with Google, save a spreadsheet ID and tab name, then process leads from the dashboard.

### API and account lifecycle

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `GET` | `/api/auth/google` | Begin Google sign-in or reconnect |
| `GET` | `/api/auth/google/callback` | Validate OAuth state and finish sign-in |
| `POST` | `/api/auth/logout` | Clear the LeadFlow session cookie |
| `GET` | `/api/users/me` | Current user and usage information |
| `PUT` | `/api/users/spreadsheet` | Save the authenticated user's spreadsheet configuration |
| `DELETE` | `/api/users/google` | Revoke Google access where possible and disconnect it from LeadFlow |
| `POST` | `/api/leads/process` | Process the authenticated user's saved spreadsheet |

Private API routes require the HttpOnly session cookie or a bearer token. They derive the user ID from that verified session; clients cannot submit a target user ID, token or Gmail address. The processing endpoint uses the spreadsheet saved to that account. Spreadsheet ownership and access are still enforced by Google's own API permissions.

Disconnecting Google removes the encrypted credential and saved spreadsheet configuration while retaining the LeadFlow account, quota and processing history. Reconnect with the same Google identity; sign out before signing in as a different Google user. Logout ends the LeadFlow session and does not delete account data.

The sheet header must include `Name`, `Email` and `Company`. Optional `Status`, `Website`, and `Message`, `Context` or `Requirement` columns are used when present. Existing duplicate prevention is scoped by user, spreadsheet, tab and row. Free accounts have a 20-draft monthly allowance by default; quota reservation is atomic and per user.

### Production Google configuration

Use HTTPS origins and redirect URIs that exactly match the deployed application, set `NODE_ENV=production`, `FRONTEND_ORIGIN`, `CLIENT_SUCCESS_URL`, `GOOGLE_REDIRECT_URI`, and the frontend API URL for that deployment. Configure the OAuth consent screen with the production app name, support email, authorized domains, privacy policy and terms URL. Publish the consent screen and complete Google's verification for the Gmail/Sheets scopes before general availability; Google may require additional review based on the scopes and account type. Keep OAuth client secrets, Gemini keys, `JWT_SECRET` and `TOKEN_ENCRYPTION_KEY` in a managed secret store. Back up the encryption key securely: stored refresh tokens cannot be decrypted if that key is lost or changed without re-encrypting the data.

Production backend startup runs `prisma migrate deploy` before the API starts, applying any pending checked-in migrations without resetting the database. This includes the Docker image used by Render. Configure Render with the backend Dockerfile (or, for a native Node service, set its pre-deploy/release command to `npm run prisma:migrate:deploy`). Keep `DATABASE_URL` pointed at the intended production database and schema. For local schema development, use `npm run prisma:migrate` to create and apply a migration.

### Tests

Run the backend suite with `cd backend; npm test`. The PostgreSQL two-user isolation test is enabled only when `TEST_DATABASE_URL` points to a dedicated disposable test database with the migrations applied. In PowerShell:

```powershell
$env:TEST_DATABASE_URL = "postgresql://user:password@localhost:5432/leadflow_test?schema=public"
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npx prisma migrate deploy
npm test
```

The normal suite skips that database integration test when `TEST_DATABASE_URL` is unset.

## Overview

Following up with leads quickly is important for businesses, but manually writing personalized emails for every lead can be time-consuming.

This project automates the repetitive part of the process while keeping a human in the loop.

The system:

* Reads new leads from Google Sheets
* Uses Gemini to understand the lead's requirement
* Generates a personalized follow-up email
* Creates a Gmail draft instead of sending automatically
* Updates the lead status after processing

## Workflow

```text
Google Sheets
     ↓
Node.js Automation
     ↓
Gemini API
     ↓
Personalized Email
     ↓
Gmail Draft
     ↓
Human Review
     ↓
Status Updated
```

## Key Features

* Google Sheets API integration
* Gemini-powered personalized email generation
* Gmail API integration
* Automatic Gmail draft creation
* Lead processing based on status
* Prevents already-processed leads from being processed again
* Human-in-the-loop workflow
* Environment variable based configuration
* Simple Node.js automation without visual workflow builders

## Tech Stack

* Node.js
* Google Sheets API
* Gmail API
* Gemini API
* Google OAuth 2.0
* JavaScript

## Project Structure

```text
ai-lead-followup/
│
├── src/
│   ├── ai.js
│   ├── auth.js
│   ├── gmail.js
│   ├── index.js
│   └── sheets.js
│
├── screenshots/
├── demo/
├── .env
├── .gitignore
├── package.json
└── README.md
```

## How It Works

### 1. Lead Input

Leads are stored in Google Sheets with information such as:

* Name
* Email
* Company
* Requirement
* Budget
* Message
* Status

New leads are marked as `New`.

### 2. Lead Processing

The Node.js application reads the spreadsheet and identifies new leads.

Already processed leads with the status `Draft Created` are skipped.

### 3. AI Email Generation

The lead information is sent to Gemini with instructions to generate a short, relevant and personalized follow-up email.

The generated response contains:

* Email subject
* Email body

### 4. Gmail Draft Creation

The generated email is converted into a Gmail draft using the Gmail API.

The system does not automatically send the email.

This allows a human to review and edit the message before sending it.

### 5. Status Update

After successfully creating the Gmail draft, the lead's status is updated from:

```text
New
```

to:

```text
Draft Created
```

This prevents the same lead from being processed repeatedly.

## Example

### Lead

```text
Name: Neha Verma
Company: Example Technologies
Requirement: Website development
Budget: $5,000
Message: We are looking for a team to build a business website.
```

### AI Generated Follow-Up

Gemini generates a personalized email based on the lead's requirement and information.

The email is then saved as a Gmail draft for human review.


## Screenshots

### Google Sheets Lead Data

![Google Sheets Lead Data](screenshots/1_Google_Sheets.png)

### Google Sheets API Integration

![Google Sheets API](screenshots/2_sheets.js.png)

### Gemini AI Integration

![Gemini AI Integration](screenshots/3_Ai_Code.png)

### Automation Running

![Terminal](screenshots/4_Terminal.png)

### Gmail Draft Created

![Gmail Draft](screenshots/5_Gmail_Draft.png)

### Lead Status Updated

![Status Updated](screenshots/6_Status_Updated.png)


## Security

Sensitive credentials are not committed to the repository. The multi-user API uses Google OAuth web-client values from `.env`; the old local `credentials.json` desktop-client flow is no longer used by the application.

The following files are excluded using `.gitignore`:

```text
.env
credentials.json
token.json
node_modules/
```

`TOKEN_ENCRYPTION_KEY` encrypts each Google refresh token before it is stored in PostgreSQL. Keep API keys, OAuth values, JWT secrets, and this encryption key in environment variables only. Do not expose them to a frontend. The committed `.env.example` files contain placeholders only.

## Future Improvements

* Connect a website lead form directly to the workflow
* Add lead scoring and prioritization
* Add CRM integration
* Add follow-up reminders
* Add email response tracking
* Add analytics for lead conversion and follow-up performance

## What I Learned

This project helped me understand how AI can be combined with external APIs to automate a real business workflow while keeping humans involved in important decisions.

The main focus was not fully autonomous email sending, but creating a practical human-in-the-loop automation that reduces repetitive work.# ai-lead-follow-up-assistant
AI-powered lead follow-up automation using Gemini, Google Sheets, and Gmail API with human-in-the-loop email drafts.
