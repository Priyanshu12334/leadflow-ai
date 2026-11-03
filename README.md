# LeadFlow

LeadFlow is an AI-powered lead follow-up tool that transforms Google Sheets data into personalized Gmail drafts using Google's Gemini AI. It analyzes lead information to generate relevant email subjects and messages, then saves them directly to Gmail Drafts for review and sending.

Each draft stays in Gmail for human review. LeadFlow does not send emails automatically.

**Live Demo:** [Try LeadFlow](https://get-ai-leadflow.vercel.app)  
**GitHub Repository:** [View Source Code](https://github.com/Priyanshu12334/leadflow-ai)

## Features

- Google OAuth sign-in, reconnect, logout, and Google account disconnection.
- Per-user Google credentials and spreadsheet settings, with encrypted refresh tokens and PostgreSQL-backed account and processing records.
- Configure a spreadsheet and tab, browse its leads, search and paginate the lead directory, and open the configured sheet.
- Generate personalized email subject and body from available sheet fields, then create a Gmail draft.
- Process rows marked `New`, skip already-tracked drafts and ineligible rows, report per-row outcomes, and record draft IDs and status back to supported sheet columns.
- Per-user draft quota with an individual 30-day cycle (20 drafts by default for the free plan), plus dashboard usage information.
- Dashboard, account settings, light/dark theme, and public terms and privacy pages.

## How processing works

1. The user connects Google and configures a spreadsheet ID and tab.
2. LeadFlow reads the sheet using that user's Google grant. `Name` and `Email` are required; `Company`, `Website`, and context columns such as `Message`, `Context`, or `Requirement` are optional. Other populated fields may also inform the email.
3. Rows with status `New` are validated and sent to Gemini for a concise, personalized email.
4. LeadFlow creates a Gmail draft and records its IDs and processing state. If the sheet has matching `Status`, `Draft ID`, `Gmail Message ID`, or `Gmail Thread ID` columns, those values are updated too.
5. The user reviews and sends the draft in Gmail.

Processing records are unique per user, spreadsheet, tab, and row. A lead already associated with a tracked draft is skipped on subsequent runs. Spreadsheet access remains subject to Google permissions.

## Tech stack and architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Axios.
- **Backend:** Node.js, Express 5, TypeScript, Google APIs, Gemini API (`@google/genai`).
- **Data:** PostgreSQL 17 and Prisma 7.
- **Authentication:** Google OAuth 2.0; the API issues an HttpOnly session cookie. Google refresh tokens are encrypted before storage.

The frontend communicates with the authenticated Express API. The API obtains the user identity from the verified session, accesses Sheets and Gmail on that user's behalf, generates content with Gemini, and stores account, quota, and processing data in PostgreSQL.

## Local setup

Prerequisites: Node.js/npm, Docker Compose (for the included PostgreSQL service) or a local PostgreSQL database, and Google Cloud and Gemini credentials.

1. Configure backend environment:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

   Set unique values for `POSTGRES_PASSWORD`, `DATABASE_URL`, `DATABASE_URL_DOCKER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`, and `JWT_SECRET`. Generate `TOKEN_ENCRYPTION_KEY` as 32 random bytes encoded in base64:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Keep secrets backend-only. `DATABASE_URL` should point to your local database (the Compose example publishes PostgreSQL on port `5433`).

2. In Google Cloud, enable the Gmail API and Google Sheets API. Create an OAuth 2.0 **Web application** client with the redirect URI `http://localhost:5000/api/auth/google/callback` and JavaScript origin `http://localhost:5173`. Add test users to the OAuth consent screen while it is in testing mode.

3. Start PostgreSQL with the included Compose file, from the backend directory:

   ```powershell
   cd backend
   docker compose up -d leadflow-postgres
   ```

   Or use a local PostgreSQL instance and set `DATABASE_URL` accordingly.

4. Install dependencies, apply migrations, and start the API:

   ```powershell
   npm ci
   npx prisma migrate deploy
   npm run dev
   ```

5. In a second terminal, start the frontend:

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

6. Open `http://localhost:5173`, sign in with Google, configure a spreadsheet ID and tab name, then process leads from the dashboard. The Vite development server proxies `/api` requests to `http://localhost:5000`.

For production, set `NODE_ENV=production`, configure the deployed frontend origin, callback URI, and success URL to their HTTPS addresses, and store secrets in a managed secret store. The backend `npm start` command applies pending Prisma migrations before starting the API. The included backend Docker Compose service uses the Docker-specific database URL and OAuth callback variables in `.env`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/auth/google` | Begin Google sign-in or reconnect |
| `GET` | `/api/auth/google/callback` | Complete OAuth sign-in |
| `POST` | `/api/auth/logout` | Clear the LeadFlow session |
| `GET` | `/api/users/me` | Current account and usage |
| `PUT` | `/api/users/spreadsheet` | Save and validate spreadsheet settings |
| `GET` | `/api/users/spreadsheet/open-link` | Get the configured sheet link |
| `DELETE` | `/api/users/google` | Disconnect Google access |
| `GET` | `/api/leads` | List leads in the configured sheet |
| `POST` | `/api/leads/process` | Process eligible leads and create drafts |

Private routes require the authenticated session cookie or bearer token. They use the identity from the verified session; clients cannot choose another user's records.

## Testing

Run the backend suite from `backend`:

```powershell
npm test
```

The two-user PostgreSQL isolation integration test runs only when `TEST_DATABASE_URL` points to a dedicated test database with migrations applied. Set `DATABASE_URL` to the same test database before running `npx prisma migrate deploy` and `npm test`. The regular backend tests do not require that integration database.

## Author

**Priyanshu Suyal**  
Full Stack Developer

- **Email:** suyalpriyanshu2@gmail.com
- **Portfolio:** [View Portfolio](https://portfolio-ten-blond-87.vercel.app)
- **LinkedIn:** [Connect on LinkedIn](https://www.linkedin.com/in/priyanshu-suyal-5732b224a)
- **GitHub:** [Priyanshu12334](https://github.com/Priyanshu12334)