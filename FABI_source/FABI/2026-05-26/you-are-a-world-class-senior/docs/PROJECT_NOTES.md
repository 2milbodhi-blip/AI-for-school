# ScholarAI Project Notes

Last reviewed: 2026-05-27

## Current Working Folder

`C:\Users\dawso\OneDrive\Documents\School Ai\FABI_source\FABI\2026-05-26\you-are-a-world-class-senior`

Use this folder for edits. It is the clean source-only extraction of `FABI.zip`, without the huge generated `.next` and original `node_modules` folders.

## How To Run

```powershell
cd "C:\Users\dawso\OneDrive\Documents\School Ai\FABI_source\FABI\2026-05-26\you-are-a-world-class-senior"
npm.cmd run dev
```

Open `http://localhost:3000`.

If port 3000 is busy:

```powershell
npm.cmd run dev -- -p 3010
```

Open `http://localhost:3010`.

## What Exists Now

- Next.js 15 app router project using React 19 and Tailwind CSS 4.
- Landing page at `/`.
- Login and signup pages using Supabase email/password auth.
- Protected pages handled by middleware for `/dashboard`, `/settings`, and planned feature routes.
- Dashboard now renders a fuller ScholarAI workspace with overview, AI tutor, planner, notes, flashcards, files, and research sections.
- Planner, notes, flashcards, files workflow notes, and research sources currently use browser local storage for fast front-end testing.
- Settings page saves learning profile fields to Supabase.
- AI chat API at `/api/chat`.
- AI provider switch supports OpenAI by default and Anthropic when `AI_PROVIDER=anthropic`.
- AI cost controls now trim chat context, cap output tokens by mode, pick cheaper models for lightweight modes, and enforce preview usage quotas.
- Academic-integrity guardrails live server-side.
- Supabase migration includes profiles, conversations, messages, uploaded files, and tasks tables with RLS.

## Important Env Setup

Do not commit or share `.env.local`; it contains real keys.

Expected shape:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=

AI_PROVIDER=openai
OPENAI_MODEL=
ANTHROPIC_MODEL=
AI_MAX_OUTPUT_TOKENS=
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for auth and persistence.
- `OPENAI_API_KEY` is required when `AI_PROVIDER=openai`.
- `ANTHROPIC_API_KEY` is required only when `AI_PROVIDER=anthropic`.
- `SUPABASE_SERVICE_ROLE_KEY` is present for future admin/server-only tasks, but the current app code does not use it.
- `OPENAI_MODEL`, `ANTHROPIC_MODEL`, and `AI_MAX_OUTPUT_TOKENS` are optional overrides for cost tuning.
- Never expose the service role key in browser code.

## Recent Fixes Already Made

- Added `eslint.config.mjs` so lint has an explicit config file instead of prompting.
- Tightened chat validation so clients can only send `user` and `assistant` messages. The server still owns the system prompt.
- Replaced the chat-only dashboard with `components/dashboard/scholar-workspace.tsx`.
- Added a polished app shell with sidebar navigation, dashboard stats, local task CRUD, saved notes, flashcards, file workflow placeholder, and research source tracking.
- Added AI context optimization in `features/ai/context/optimize.ts`.
- Added in-memory daily preview usage quotas in `lib/rate-limit/usage-quota.ts`.
- Added mode-based model and output-token controls in `features/ai/providers/model.ts`.

## Checks

Known successful check before this note:

```powershell
npm.cmd run build
```

Latest successful checks:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Known issue:

- `npm.cmd run lint` may still need script modernization because `next lint` is deprecated in newer Next versions.

## Best Next Build Step

Connect the new complete app interior to Supabase:

- Move planner task state from local storage to the existing `tasks` table.
- Add a notes table or reuse file summaries for saved notes.
- Add flashcard persistence tables.
- Add Supabase Storage upload flow for files.
- Add research source persistence and citation formatting.
- Add a conversation sidebar using `conversations` and `messages`.

Preferred approach:

1. Keep the current local-storage UX as the prototype behavior.
2. Add Supabase-backed server actions route by route.
3. Preserve the same teal, white, muted gray, and gold accent design language.
