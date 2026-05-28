# Architecture

ScholarAI uses feature-sliced clean architecture.

## Main layers

- `app`: Next.js routes, layouts, and API endpoints.
- `components`: reusable UI and feature-facing components.
- `features`: product domains such as AI, chat, planner, files, and research.
- `lib`: shared infrastructure such as Supabase, security, rate limiting, and utility code.
- `supabase`: schema migrations and database policies.

## AI request flow

1. Browser sends a chat request to `app/api/chat/route.ts`.
2. Zod validates request shape.
3. User text is sanitized.
4. Memory rate limit checks abuse.
5. Academic-integrity policy detects cheating or plagiarism requests.
6. The strong ScholarAI system prompt is built server-side.
7. Vercel AI SDK streams the model response.

The system prompt is never trusted from the client. It is built on the server so
students cannot bypass behavior rules by changing browser code.

## Security notes

- RLS policies are enabled for user-owned tables.
- API input is validated with Zod.
- User text is sanitized before model use.
- Rate limiting is included as a starter. For production, replace in-memory
  rate limiting with Upstash Redis, Vercel KV, or Supabase-backed counters.
- Service role keys must never be exposed to the browser.
