# Chess House Club — FST Béni Mellal (`Club CHESS HOUSE BM`)

Official bilingual/trilingual (**FR** default, **EN**, **AR** with full RTL) web platform for **Chess House Club** at **Faculté des Sciences et Techniques de Béni Mellal (FST)**, **Université Sultan Moulay Slimane**, founded on **18 October 2025**.

Built to run on **Vercel Hobby (Free) + Supabase Free + Cloudflare Turnstile Free + Gemini API (`@google/genai`)**, with an automatic local preview parity layer (`server.ts` + in-memory store) when Supabase environment variables are not yet configured.

---

## 1. Architecture & Free-Tier Budget

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + `chess.js` + `vite-plugin-pwa`.
- **Backend (`/api/*`)**: 9 Vercel Serverless Functions (comfortably under the **12-function Vercel Hobby cap**):
  1. `GET /api/config` — Public tournament info, live seats left, weekly session focus, dynamic events/league clubs, daily challenge, activity feed, and public flags.
  2. `POST /api/register` — Transactional tournament registration (`register_player` Postgres RPC with trigram & token-sorted name matching).
  3. `POST /api/apply` — Membership, Partner, and Inter-University League applications.
  4. `POST /api/contact` — Contact enquiries.
  5. `POST /api/coach` — Authenticated AI Chess Coach powered by `@google/genai` with a DB-backed `30 requests / user / day` quota.
  6. `GET /api/standings` — Public Open & Women Swiss pairings and Buchholz/Sonneborn-Berger standings.
  7. `GET/POST /api/admin` — Board/Admin workspace (members CSV import/export, membership approval, Swiss round generation, Monday week assignment, Passport attendance/XP management, dynamic events & league standings).
  8. `GET/POST /api/passport` — Authenticated My Chess House dashboard & Chess House Passport gamification API (missions, badges, XP ledger, attendance history, match history, notifications, profile settings).
  9. `GET /api/keepalive` — Daily Vercel cron ping keeping Supabase active within the 7-day inactivity rule.
- **Database (`supabase/migrations/`)**: 5 ordered SQL migrations + `seed.sql`, strict Row-Level Security (public pages never read student IDs, emails, phones, members, registrations, or contact messages), `pg_trgm` + `unaccent` fuzzy Arabic/Latin matching.
- **Chess House Academy**: Lazy-loaded 8-week "backwards" curriculum (`week1.json`–`week8.json`: Endgames -> Middlegame -> Openings), 108 `chess.js`-validated tactical puzzles, Web Worker alpha-beta practice lab (3 strengths + endgame verdict), 5-category PGN mistake analyzer + heatmap + Weakness Radar, SM-2 spaced repetition, Guess-the-Move, client-side PDF cheat-sheets/certificates, and Socratic AI Coach.

---

## 2. Ordered Deployment Instructions (Vercel + Supabase + Turnstile + Gemini)

Follow these exact steps in order to go live:

### Step 1 — Create Supabase Project & Run SQL Migrations
1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase dashboard and run each file in order:
   - `supabase/migrations/001_extensions_and_helpers.sql`
   - `supabase/migrations/002_core_tables.sql`
   - `supabase/migrations/003_rls_policies.sql`
   - `supabase/migrations/004_register_player_rpc.sql`
   - `supabase/migrations/005_passport_and_dashboard.sql`
   - `supabase/migrations/006_google_auth_and_member_linking.sql`
   - `supabase/migrations/007_tournament_players.sql`
   - `supabase/seed.sql` (seeds the **30 November 2026** internal tournament, Passport XP defaults, and public settings).
3. Optional SQL test verification: run `supabase/test_register.sql` in a transaction/test branch to verify fuzzy matching, paid/unpaid checks, and capacity guards.

### Step 2 — Sign Up First Admin & Promote Role
1. Deploy or launch the app once (or create the user in **Supabase Auth -> Users** using e.g. `miloudmoustage@gmail.com` or club admin email).
2. Open `supabase/organiser.sql`, replace the email in the `UPDATE public.profiles` statement, and run it in the Supabase SQL Editor to grant `'admin'` (or `'board'`) access.

### Step 3 — Import Club Members
1. Sign in as Admin and open `/admin` -> **Members** tab -> **Import CSV** and upload `supabase/sample_members.csv` (or your real roster CSV formatted as `full_name,identifier,email,phone,department,fees_paid`).
2. Or import directly via **Supabase Table Editor -> `members` -> Import CSV** (note: triggers automatically compute `name_key` and `identifier_norm`).

### Step 4 — Create Cloudflare Turnstile Keys
1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com) -> **Turnstile** -> **Add Widget** (free tier).
2. Add your production domain (e.g. `*.vercel.app` and your custom domain) plus `localhost`.
3. Copy the **Site Key** (`VITE_TURNSTILE_SITE_KEY`) and **Secret Key** (`TURNSTILE_SECRET_KEY`).

### Step 5 — Configure Gemini API Key & Model
1. Obtain a Gemini API key from Google AI Studio.
2. Check which model alias you have enabled and set `GEMINI_API_KEY` (server-only) and optionally `GEMINI_MODEL` (defaults to `gemini-4-hydrogen`; verify against available Gemini models in your project if needed).

### Step 6 — Set Vercel Environment Variables & Deploy
1. Push this repository to GitHub/GitLab and import it into **Vercel (Hobby plan)**.
2. Add the environment variables from `.env.example` in **Vercel -> Project Settings -> Environment Variables**:
   - Client (`VITE_*`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY`
   - Server-only: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CRON_SECRET`, `SHOW_PERSONAL_CONTACT` (`false`)
3. Deploy! Vercel automatically builds with `npm run build` (which runs `tsx scripts/validate-puzzles.ts && vite build`) and schedules the daily `/api/keepalive` cron from `vercel.json`.

### Step 7 — Supabase Auth Redirect URLs, Google Sign-In & Pre-Signed-Up Students
1. In **Supabase -> Authentication -> URL Configuration**, set **Site URL** to your production URL and add `https://your-domain.vercel.app/**` (plus custom domain if connected) to **Redirect URLs**.
2. To enable **Continue with Google**: open **Supabase -> Authentication -> Providers -> Google**, enable it, and paste your Google OAuth Client ID and Secret from Google Cloud Console (set the Authorized Redirect URI in Google Cloud to `https://<your-project-ref>.supabase.co/auth/v1/callback`).
3. To pre-create accounts for already-signed-up students: open `/admin` -> **Members** -> click **Pre-Create Student Accounts** (or import your roster CSV first). Existing students are automatically linked to their Chess House Passport when they sign in with Google.
4. Replace placeholder assets in `/public/images/placeholders/*.svg` (update paths in `src/data/images.ts`) and `/public/docs/*.pdf` (see `src/data/docs.ts`).

### Step 8 — First Live Verification Checklist
- Open `/` and play moves on the Hero board; switch FR / EN / AR (verify RTL layout + LTR boards) and light/dark themes.
- Submit a test registration on `/tournaments` using a member from `members` (with reversed `Last First` name and a 1-letter typo) -> confirm `"You're in"` + `.ics` download.
- Submit a non-member name on `/tournaments` -> confirm `"You're one move away"` (`pending_not_member`).
- Sign in on `/account` -> visit `/admin` -> test **Promote Pending**, **Generate Round 1** (Open & Women), record a result, verify live standings on `/tournaments`, and click **Print Sheet**.

---

## 3. Organiser Guide (`/admin` & `supabase/organiser.sql`)

- **Check confirmed vs. pending tournament players**: Open `/admin` -> **Tournament & Swiss Runner** -> scroll to **Registrations Queue**, or run the queries in `supabase/organiser.sql`.
- **Promote a pending player**: When a non-member registers for a tournament, they appear as `pending_not_member`. Once they pay or verify eligibility, click **Promote to Confirmed** in `/admin` (or add them to `members` with `fees_paid = true` and ask them to click **Check again**).
- **Run a 9-round Swiss tournament**:
  1. Choose **Open** or **Women** in `/admin` -> **Tournament & Swiss Runner**.
  2. Click **Generate Round 1 / 9** (pairings are published immediately on `/tournaments` with Supabase Realtime updates).
  3. Enter results (`1-0`, `1/2-1/2`, `0-1`, `bye`, `forfeit-*`). Buchholz and Sonneborn-Berger recalculate automatically.
  4. Click **Print Sheet** before each round to print clean pairing sheets (headers/menus hidden automatically).
- **Export CSV backup before every event**: Always click **Export CSV** under **Members** and **Export Confirmed CSV** under **Tournament & Swiss Runner** before round 1 starts.
- **Set Monday training focus**: In `/admin` -> **Overview & Analytics**, change **Monday Training Assignment** (`Week 1`..`8`) so students see `"Today's Monday Session"` highlighted in `/academy`.

---

## 4. Things to Confirm (`// TODO-CONFIRM`)

Every provisional or editable club detail is tagged with `// TODO-CONFIRM` in `src/config/site.ts` and `supabase/seed.sql`:

1. **`showPersonalContact` (`false` by default)**: Confirm whether Miloud Moustage's personal email (`miloudmoustage@gmail.com`) and phone (`0634 262 883`) should stay hidden (`false`) or be shown on Contact/Legal pages (`SHOW_PERSONAL_CONTACT=true`).
2. **`entryFee` (`null` by default)**: Confirm whether the 30 November 2026 Internal Tournament has a fee in MAD (currently hidden when `null`).
3. **`integrationDayDate` (`2026-10-05`)**: Confirm 5 October 2026 (new club plan) vs. 24 September (earlier document).
4. **Weekly session rooms & expected turnout**: Confirm exact rooms in Block A (Monday 12:00–14:00, `~20–30`), Block C (Thursday 12:00–14:00, `~50–60` open play/practice), and online inter-university hour (`20:30–22:00`).
5. **Tournament registration deadline (`2026-11-29T18:00:00+01:00`)**: Defaults to the evening before the 30 November 2026 tournament.
6. **Categories (`['open', 'women']`)**: Confirm keeping separate Open and Women Swiss sections/standings.
7. **Chess Cinema 30 October 2026 title**: Currently `"Chess Cinema — Soirée Cinéma Halloween"`.
8. **Placeholder PDFs (`/public/docs/*.pdf`) & gallery/board/partner images (`/public/images/placeholders/*.svg`)**: Replace dummy files with real club documents and compressed photography before public launch.

---

## 5. Free-Tier Operational Notes

- **Supabase 7-Day Pause Prevention**: Free Supabase projects pause after 7 days without database activity. `vercel.json` runs `GET /api/keepalive` daily at `08:00 UTC` (set `CRON_SECRET` in Vercel) to run a lightweight `SELECT` query automatically.
- **500 MB Database Limit**: Keep photos and PDFs in `/public` (served via Vercel CDN) rather than storing binaries in Supabase.
- **Vercel Hobby Non-Commercial Terms**: Vercel Hobby (`12` functions max — this app uses `8`) is restricted to non-commercial projects, which fits a university student chess club.
- **Pre-Event Backups**: Export confirmed registrations and active members CSVs from `/admin` prior to every tournament.

---

## 6. Local Development & Testing

```bash
npm install
npm run test          # Vitest unit tests (normalization, Swiss, SM-2, PGN analyzer, 108 puzzles)
npm run build         # Validates all 108 puzzles + 8 week JSONs with chess.js, then builds Vite + PWA
npm run dev           # Starts Express + Vite dev server on port 3000 (local in-memory store if no Supabase env)
```
