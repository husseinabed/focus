-- ============================================================
-- Brandi Auth + Multi-tenant Workspaces (Supabase)
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Profiles (public.user_profiles) ----------
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

create policy "read own profile"
on public.user_profiles
for select
using (user_id = auth.uid());

create policy "update own profile"
on public.user_profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ---------- Workspaces ----------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  default_locale text not null default 'he' check (default_locale in ('he','ar','en')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

-- ---------- Workspace Members ----------
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','agent','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx
on public.workspace_members (user_id, workspace_id);

alter table public.workspace_members enable row level security;

-- User can read membership rows that include them
create policy "read my memberships"
on public.workspace_members
for select
using (user_id = auth.uid());

-- Owners/Admins can manage members in their workspace
create policy "owners_admins manage members"
on public.workspace_members
for all
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
);

-- ---------- Invites ----------
create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','agent','viewer')),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists workspace_invites_workspace_idx
on public.workspace_invites (workspace_id);

alter table public.workspace_invites enable row level security;

create policy "workspace members read invites"
on public.workspace_invites
for select
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_invites.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
);

create policy "workspace members manage invites"
on public.workspace_invites
for all
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_invites.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_invites.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
);

-- ============================================================
-- 2) JWT helper: current workspace id for RLS
-- You will set this claim in your app by selecting workspace
-- and storing it in the user's session via custom claims (recommended)
-- OR by using a DB function that checks workspace_members using auth.uid().
-- ============================================================

create or replace function public.is_workspace_member(wid uuid)
returns boolean
language sql stable
as $$
  select exists(
    select 1
    from public.workspace_members wm
    where wm.workspace_id = wid
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_role(wid uuid, roles text[])
returns boolean
language sql stable
as $$
  select exists(
    select 1
    from public.workspace_members wm
    where wm.workspace_id = wid
      and wm.user_id = auth.uid()
      and wm.role = any(roles)
  );
$$;

-- ============================================================
-- 3) Example: applying workspace RLS to business tables
-- (Use this pattern for leads, conversations, messages, etc.)
-- ============================================================

-- Example for leads:
-- create policy "workspace members can read leads"
-- on public.leads
-- for select
-- using (public.is_workspace_member(workspace_id));

-- create policy "workspace members can insert leads"
-- on public.leads
-- for insert
-- with check (public.is_workspace_member(workspace_id));

-- create policy "workspace members can update leads"
-- on public.leads
-- for update
-- using (public.is_workspace_member(workspace_id))
-- with check (public.is_workspace_member(workspace_id));


create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  wid uuid;
begin
  insert into public.user_profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do nothing;

  insert into public.workspaces (name, created_by)
  values ('My Workspace', new.id)
  returning id into wid;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (wid, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.accept_workspace_invite(invite_token text)
returns uuid
language plpgsql
security definer
as $$
declare
  inv record;
begin
  select *
    into inv
  from public.workspace_invites
  where token = invite_token
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  update public.workspace_invites
    set status = 'accepted'
  where id = inv.id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, auth.uid(), inv.role)
  on conflict do nothing;

  return inv.workspace_id;
end;
$$;



alter table public.content_template_usages enable row level security;

create policy "workspace read"
on public.content_template_usages
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.content_template_usages
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.content_template_usages
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));


alter table public.content_templates enable row level security;

create policy "workspace read"
on public.content_templates
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.content_templates
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.content_templates
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

alter table public.conversations enable row level security;

create policy "workspace read"
on public.conversations
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.conversations
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.conversations
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

alter table public.lead_qualifications enable row level security;

create policy "workspace read"
on public.lead_qualifications
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.lead_qualifications
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.lead_qualifications
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));


alter table public.leads enable row level security;

create policy "workspace read"
on public.leads
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.leads
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.leads
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

alter table public.meetings enable row level security;

create policy "workspace read"
on public.meetings
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.meetings
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.meetings
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

alter table public.message_approvals enable row level security;

create policy "workspace read"
on public.message_approvals
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.message_approvals
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.message_approvals
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));


alter table public.messages enable row level security;

create policy "workspace read"
on public.messages
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.messages
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.messages
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));


alter table public.workflow_runs enable row level security;

create policy "workspace read"
on public.workflow_runs
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.workflow_runs
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.workflow_runs
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));


alter table public.workflow_steps enable row level security;

create policy "workspace read"
on public.workflow_steps
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.workflow_steps
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.workflow_steps
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

alter table public.workflows enable row level security;

create policy "workspace read"
on public.workflows
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.workflows
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.workflows
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

alter table public.workspace_invites enable row level security;

create policy "workspace read"
on public.workspace_invites
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.workspace_invites
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.workspace_invites
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

alter table public.workspace_members enable row level security;

create policy "workspace read"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace write"
on public.workspace_members
for insert
with check (public.is_workspace_member(workspace_id));

create policy "workspace update"
on public.workspace_members
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));