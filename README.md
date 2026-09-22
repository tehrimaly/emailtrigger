# AI Email Follow-up Agent

Detects sent Gmail threads that haven't gotten a reply and drafts follow-ups
with Gemini, in your tone of choice. Drafts are always saved to Gmail as
drafts — nothing is ever auto-sent.

Stack: Node.js + Express backend, React + Tailwind frontend, Gmail API
(OAuth 2.0), Gemini API (free tier). All free-tier infra, runs locally.

## Status

- [x] Project scaffolding (backend + frontend)
- [x] Gmail OAuth 2.0 flow + list-sent-mail sanity check
- [x] Awaiting-reply thread detection
- [x] Gemini-powered follow-up drafting
- [x] Full dashboard UI
- [x] Chat-command bar ("follow up with HR", thread Q&A, threshold updates)
- [x] Tasks board with reminders (chat-created tasks, today/tomorrow/overdue view, email reminders)

## 1. Google Cloud Console setup (do this first)

1. Go to https://console.cloud.google.com/ and create (or select) a project.
2. **APIs & Services -> Library**: enable the **Gmail API**.
3. **APIs & Services -> OAuth consent screen**:
   - User type: External (or Internal if you have Workspace).
   - Add your own Google account as a **test user** (required while the app
     is unpublished/in "Testing" status).
   - Add scopes: `gmail.readonly`, `gmail.compose`, `gmail.send`.
4. **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URI: `http://localhost:4000/auth/google/callback`
     (must match `GOOGLE_REDIRECT_URI` in `backend/.env` exactly).
   - Save the generated **Client ID** and **Client Secret**.
5. Get a free Gemini API key at https://aistudio.google.com/app/apikey and
   put it in `GEMINI_API_KEY` in `backend/.env`.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# paste GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from step 1 into .env
npm install
npm run dev
```

The server starts on `http://localhost:4000`.

### Verify OAuth end-to-end (do this before anything else)

1. Open `http://localhost:4000/auth/google` in a browser.
2. Sign in with the Google account you added as a test user, and approve
   the requested scopes.
3. You'll be redirected back and (once tokens are saved) can hit:
   - `GET http://localhost:4000/auth/status` -> `{ connected: true, email }`
   - `GET http://localhost:4000/api/gmail/sent` -> your recent sent messages

If both return real data, Gmail OAuth is working end-to-end.

Tokens are cached locally in `backend/data/tokens.json` (gitignored —
never commit this file, it contains your refresh token).

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Once Gmail is connected you get the full
dashboard: top bar (connection, sync, days-threshold slider), a chat
command bar, the awaiting-reply thread list, and the AI draft panel.

## Using it

- **Threshold slider** controls which threads show the "OVERDUE" badge
  (all awaiting-reply threads are listed regardless of the threshold).
- **Draft Follow-up** on a card generates an AI draft via Gemini and opens
  it in the right-hand panel; **Regenerate** re-runs it with the current
  tone; **Save draft** writes it to Gmail as a real draft (never sends);
  **Send** sends that saved draft (saving first if you haven't yet).
- **Chat bar** accepts free-text commands, e.g.:
  - `follow up with HR` — matches a thread and opens a generated draft
  - `which threads are overdue?` — answered from the current thread list
  - `change the threshold to 5 days` — updates the slider
  - `remind me to call the client tomorrow at 3pm` — adds a task with a due time
  - `what do I have today?` / `what haven't I done yet?` — answered from your open tasks (and overdue follow-ups)
- **Tasks tab** shows everything grouped into Overdue / Today / Tomorrow / Upcoming / Someday / Done —
  add tasks there directly or via the chat bar. A background check runs every minute and, once a
  task's due time passes, emails you a reminder (to your own connected address) using the same
  `gmail.send` scope already granted for drafts — no separate notification service required.

## Project layout

```
backend/
  src/
    config/googleClient.js    OAuth2 client + Gmail scopes
    services/tokenStore.js    local token persistence (single-user)
    services/gmailService.js  Gmail API calls (auth client, list sent mail)
    services/threadService.js awaiting-reply detection (thread-level)
    services/geminiClient.js  Gemini client factory
    services/geminiService.js draft generation + chat command parsing
    services/draftService.js  create/send Gmail drafts
    services/taskStore.js     local task persistence (single-user)
    services/taskService.js   task CRUD + today/tomorrow/overdue grouping
    services/reminderService.js  minute-interval check, emails due reminders
    middleware/requireAuth.js
    routes/auth.routes.js     /auth/google, /auth/google/callback, /auth/status
    routes/gmail.routes.js    /api/gmail/sent
    routes/threads.routes.js  /api/threads, /api/threads/:id/draft, /save-draft
    routes/drafts.routes.js   /api/drafts/:id/send
    routes/chat.routes.js     /api/chat/command
    routes/tasks.routes.js    /api/tasks (CRUD)
    server.js
  .env.example
frontend/
  src/
    App.jsx                   dashboard state + orchestration
    api.js                    backend fetch helpers
    components/TopBar.jsx     connection, sync, threshold slider
    components/ChatBar.jsx    chat command input + inline reply
    components/ThreadList.jsx / ThreadCard.jsx  awaiting-reply cards
    components/DraftPanel.jsx tone selector, editable draft, actions
    components/TasksBoard.jsx / TaskRow.jsx     tasks grouped by due date
  .env.example
```
