create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  grade_level text default 'high-school',
  subjects text[] default '{}',
  learning_preferences jsonb default '{}'::jsonb,
  writing_style text default 'natural',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  mode text not null default 'homework-helper',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  parsed_text text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  subject text,
  due_at timestamptz,
  reminder_at timestamptz,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.tasks enable row level security;

create policy "profiles are owned by user"
on public.profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "conversations are owned by user"
on public.conversations for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "messages are owned by user"
on public.messages for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "files are owned by user"
on public.uploaded_files for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "tasks are owned by user"
on public.tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
