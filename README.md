# AI Lead Follow-Up Assistant

An AI-powered lead follow-up automation that reads new leads from Google Sheets, generates personalized follow-up emails using Gemini, and creates Gmail drafts for human review.

![Demo](demo/Demo_GIF.gif)

## Multi-User Backend

The project now runs as an authenticated Node.js API backed by MongoDB. Each application user connects their own Google account through OAuth 2.0; its encrypted refresh token is used only to read that user's configured Google Sheet and create drafts in that same user's Gmail account. The application never sends an email.

### Setup

1. Copy `.env.example` to `.env` and provide the required values.
2. Create a Google OAuth **Web application** client and register `http://localhost:5000/api/auth/google/callback` as an authorized redirect URI.
3. Start MongoDB and run `npm start`.
4. Visit `GET /api/auth/google` to sign in and connect Google.
5. Process a selected Sheet with authenticated `POST /api/leads/process`:

```json
{
  "spreadsheetId": "your-google-spreadsheet-id",
  "sheetName": "Sheet1"
}
```

### API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `GET` | `/api/auth/google` | Begin Google OAuth sign-in/connection |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |
| `POST` | `/api/auth/logout` | End the application session |
| `GET` | `/api/users/me` | Current user and usage information |
| `PUT` | `/api/users/spreadsheet` | Save the current user's Google Sheet configuration |
| `POST` | `/api/leads/process` | Create drafts for the current user's unprocessed leads |

The processing endpoint uses an HttpOnly JWT cookie (or `Authorization: Bearer <token>` for API clients). It does not accept a `userId`, Google token, or Gmail address, so one user cannot direct it to another user's Google account.

`POST /api/leads/process` requires this request body:

```json
{
  "spreadsheetId": "your-google-spreadsheet-id",
  "sheetName": "Sheet1"
}
```

The header row must contain `Name`, `Email`, `Company`, and `Status`. Optional `Website` and `Message`, `Context`, or `Requirement` columns are used to personalize the email. Invalid rows are marked `Failed`; rows with successful Gmail draft creation are marked `Draft Created`.

Free accounts have a 20-draft monthly allowance. Draft capacity is atomically reserved before Gemini is called and released if draft creation fails. The configured Sheet is updated only after Gmail confirms its draft; if a final Sheet update fails, a later run repairs the status without creating another draft.

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

`TOKEN_ENCRYPTION_KEY` encrypts each Google refresh token before it is stored in MongoDB. Keep API keys, OAuth values, JWT secrets, and this encryption key in environment variables only. Do not expose them to a frontend.

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
