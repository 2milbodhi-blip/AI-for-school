# ScholarAI

ScholarAI is a trustworthy AI tutor and study companion for homework guidance,
research support, essay coaching, notes, flashcards, and planning.

This starter is intentionally beginner-friendly: first get it running locally,
then connect Supabase, then deploy to Vercel.

## What you need

- A normal laptop or desktop
- VS Code
- Node.js LTS from https://nodejs.org
- A Supabase account from https://supabase.com
- A Vercel account from https://vercel.com
- An OpenAI API key or Anthropic API key

You do not need a dedicated device running all the time. Your computer is only
for building. Once deployed, Vercel runs the website and Supabase stores data.

## First-time setup

Install dependencies:

```bash
npm install
```

Copy the environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_key
AI_PROVIDER=openai
```

Start the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Paste and run `supabase/migrations/0001_initial_schema.sql`.
4. Copy your project URL and anon key into `.env.local`.

The migration enables row-level security so students can only access their own
profiles, messages, files, and tasks.

## AI setup

For the cheapest learning setup, use OpenAI with a small spending limit.

1. Create an API key.
2. Add it to `.env.local` as `OPENAI_API_KEY`.
3. Keep `AI_PROVIDER=openai`.

ScholarAI includes server-side AI guardrails in:

- `features/ai/prompts/system.ts`
- `features/ai/policies/academic-integrity.ts`
- `app/api/chat/route.ts`

These files enforce honest tutoring, natural writing, level adaptation, and
refusal/redirection for cheating requests.

## Deploying later

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables in Vercel.
4. Deploy.

After deployment, your computer can be turned off. Vercel and Supabase keep the
app online.

## Beginner debugging

If `npm` is not recognized, install Node.js LTS and reopen your terminal.

If the chat does not answer, check:

- `.env.local` exists
- `OPENAI_API_KEY` is filled in
- your OpenAI account has billing or credits
- the terminal does not show an error

If `node` says "Access is denied" or `npm` is not recognized:

1. Install Node.js LTS from https://nodejs.org.
2. Close every PowerShell, Command Prompt, and VS Code window.
3. Reopen VS Code from the Start menu.
4. Open this project folder again.
5. Run `node -v` and `npm -v`.

If that still fails, uninstall Node.js, reinstall the LTS version, and make sure
the installer option that adds Node.js to PATH is enabled.

## Next build steps

1. Persist conversations and messages.
2. Add file upload and document parsing.
3. Add planner task CRUD.
4. Add saved notes and flashcards.
5. Add tests for the AI policy layer.
