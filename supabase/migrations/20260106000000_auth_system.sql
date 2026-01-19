-- ============================================================
-- Brandi Platform - Full Schema
-- Multi-tenant, RLS-secured
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- Helpers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1) LEADS
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  source text not null check (source in ('google_maps','manual','import','whatsapp_inbound')),
  status text not null default 'new'
    check (status in ('new','contacted','qualified','proposal','won','lost')),

  language text not null default 'auto' check (language in ('auto','he','ar','en')),

  full_name text,
  company_name text not null,
  phone text not null,
  phone_e164 text not null,
  email text,
  website text,
  city text,

  custom_fields jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_workspace_idx on public.leads (workspace_id);
create index if not exists leads_phone_idx on public.leads (workspace_id, phone_e164);
create index if not exists leads_status_idx on public.leads (workspace_id, status);

create trigger trg_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.leads enable row level security;
create policy "workspace read leads" on public.leads
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace insert leads" on public.leads
  for insert with check (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace update leads" on public.leads
  for update using (workspace_id::text = auth.jwt() ->> 'workspace_id')
  with check (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace delete leads" on public.leads
  for delete using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 2) CONVERSATIONS
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  lead_id uuid not null references public.leads(id) on delete cascade,

  status text not null default 'active'
    check (status in ('active','paused','closed')),

  approval_required boolean not null default true,

  last_inbound_at timestamptz,
  last_outbound_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists conversations_workspace_idx on public.conversations (workspace_id);
create index if not exists conversations_lead_idx on public.conversations (workspace_id, lead_id);

alter table public.conversations enable row level security;
create policy "workspace read conversations" on public.conversations
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace insert conversations" on public.conversations
  for insert with check (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace update conversations" on public.conversations
  for update using (workspace_id::text = auth.jwt() ->> 'workspace_id')
  with check (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace delete conversations" on public.conversations
  for delete using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 3) MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,

  direction text not null check (direction in ('inbound','outbound')),
  channel text not null default 'whatsapp' check (channel in ('whatsapp','sms','email','in_app')),

  body text not null,
  provider_message_id text,

  created_at timestamptz not null default now()
);

create index if not exists messages_workspace_idx on public.messages (workspace_id);
create index if not exists messages_conversation_idx on public.messages (workspace_id, conversation_id);

alter table public.messages enable row level security;
create policy "workspace read messages" on public.messages
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace insert messages" on public.messages
  for insert with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 4) MESSAGE APPROVALS (TRUST-FIRST)
-- ============================================================
create table if not exists public.message_approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  message_id uuid not null references public.messages(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),

  reviewed_by uuid,
  reviewed_at timestamptz,

  created_at timestamptz not null default now()
);

alter table public.message_approvals enable row level security;
create policy "workspace read approvals" on public.message_approvals
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace insert approvals" on public.message_approvals
  for insert with check (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace update approvals" on public.message_approvals
  for update using (workspace_id::text = auth.jwt() ->> 'workspace_id')
  with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 5) WORKFLOWS
-- ============================================================
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft','active','archived')),

  definition jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_workflows_updated_at
before update on public.workflows
for each row execute function public.set_updated_at();

alter table public.workflows enable row level security;
create policy "workspace read workflows" on public.workflows
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace insert workflows" on public.workflows
  for insert with check (workspace_id::text = auth.jwt() ->> 'workspace_id');
create policy "workspace update workflows" on public.workflows
  for update using (workspace_id::text = auth.jwt() ->> 'workspace_id')
  with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 6) WORKFLOW RUNS
-- ============================================================
create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  workflow_id uuid not null references public.workflows(id) on delete cascade,

  status text not null default 'running'
    check (status in ('running','completed','stopped','failed')),

  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.workflow_runs enable row level security;
create policy "workspace read workflow_runs" on public.workflow_runs
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 7) WORKFLOW STEPS
-- ============================================================
create table if not exists public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  run_id uuid not null references public.workflow_runs(id) on delete cascade,

  node_id text not null,
  status text not null check (status in ('pending','success','error','skipped')),
  output jsonb,

  created_at timestamptz not null default now()
);

alter table public.workflow_steps enable row level security;
create policy "workspace read workflow_steps" on public.workflow_steps
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 8) CONTENT TEMPLATES
-- ============================================================
create table if not exists public.content_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  key text not null,
  title text not null,
  category text not null,
  channel text not null,
  status text not null default 'draft',

  locales jsonb not null,
  variants jsonb not null,
  variables_schema jsonb not null,
  defaults jsonb not null,
  rules jsonb not null,
  compliance jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (workspace_id, key)
);

alter table public.content_templates enable row level security;
create policy "workspace read templates" on public.content_templates
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 9) TEMPLATE USAGES
-- ============================================================
create table if not exists public.content_template_usages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  template_id uuid not null references public.content_templates(id) on delete cascade,
  lead_id uuid,
  conversation_id uuid,

  rendered_text text not null,
  status text not null default 'rendered',

  created_at timestamptz not null default now()
);

alter table public.content_template_usages enable row level security;
create policy "workspace read template usages" on public.content_template_usages
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 10) LEAD QUALIFICATIONS
-- ============================================================
create table if not exists public.lead_qualifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  lead_id uuid not null references public.leads(id) on delete cascade,

  answers jsonb not null,
  total_score int not null,
  tier text not null check (tier in ('hot','warm','cold')),
  summary_text text,

  created_at timestamptz not null default now()
);

alter table public.lead_qualifications enable row level security;
create policy "workspace read lead_qualifications" on public.lead_qualifications
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- ============================================================
-- 11) MEETINGS / ZOOM BOOKINGS
-- ============================================================
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  lead_id uuid not null references public.leads(id) on delete cascade,

  type text not null check (type in ('qualification','proposal')),
  provider text not null default 'zoom',
  meeting_url text,
  scheduled_at timestamptz not null,

  created_at timestamptz not null default now()
);

alter table public.meetings enable row level security;
create policy "workspace read meetings" on public.meetings
  for select using (workspace_id::text = auth.jwt() ->> 'workspace_id');


  -- 2026-01-16_content_templates_and_qualification.sql
-- Brandi Platform: Content Template System + Lead Qualification storage
-- Assumes you already have auth + workspace_id in JWT: auth.jwt() ->> 'workspace_id'
-- Requires pgcrypto for gen_random_uuid()

-- Extensions
create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- Helpers: updated_at trigger
-- -------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------------
-- 1) content_templates
-- -------------------------------------------------------------------
create table if not exists public.content_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  key text not null,
  title text not null,
  category text not null check (category in ('outreach','followup','qualification','booking','proposal','system')),
  channel text not null check (channel in ('whatsapp','sms','email','in_app')),
  status text not null default 'draft' check (status in ('draft','active','archived')),

  -- Localized bodies/subjects per locale:
  -- { en: { subject?: string, body: string }, he: {...}, ar: {...} }
  locales jsonb not null default '{}'::jsonb,

  -- Variant metadata like short/standard/followup and limits
  variants jsonb not null default '{}'::jsonb,

  -- JSON Schema for allowed variables
  variables_schema jsonb not null default '{}'::jsonb,

  -- Default values/fallbacks for variables
  defaults jsonb not null default '{}'::jsonb,

  -- Channel + required vars + constraints
  rules jsonb not null default '{}'::jsonb,

  -- approval_required, flags, etc
  compliance jsonb not null default '{}'::jsonb,

  tags text[] not null default array[]::text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint content_templates_workspace_key_uniq unique (workspace_id, key)
);

create index if not exists content_templates_workspace_idx
  on public.content_templates (workspace_id);

create index if not exists content_templates_category_idx
  on public.content_templates (workspace_id, category);

create index if not exists content_templates_channel_idx
  on public.content_templates (workspace_id, channel);

drop trigger if exists trg_content_templates_updated_at on public.content_templates;
create trigger trg_content_templates_updated_at
before update on public.content_templates
for each row execute function public.set_updated_at();

-- RLS
alter table public.content_templates enable row level security;

drop policy if exists "workspace members can read content_templates" on public.content_templates;
create policy "workspace members can read content_templates"
on public.content_templates
for select
using (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can insert content_templates" on public.content_templates;
create policy "workspace members can insert content_templates"
on public.content_templates
for insert
with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can update content_templates" on public.content_templates;
create policy "workspace members can update content_templates"
on public.content_templates
for update
using (workspace_id::text = auth.jwt() ->> 'workspace_id')
with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can delete content_templates" on public.content_templates;
create policy "workspace members can delete content_templates"
on public.content_templates
for delete
using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- -------------------------------------------------------------------
-- 2) content_template_usages (audit/analytics)
-- -------------------------------------------------------------------
create table if not exists public.content_template_usages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  template_id uuid not null references public.content_templates(id) on delete cascade,
  lead_id uuid null,          -- reference if you have public.leads
  conversation_id uuid null,  -- reference if you have public.conversations

  channel text not null check (channel in ('whatsapp','sms','email','in_app')),
  locale text not null check (locale in ('en','he','ar')),
  variant text not null, -- short | standard | followup | custom

  variables jsonb not null default '{}'::jsonb,
  rendered_text text not null,
  rendered_subject text null,

  status text not null default 'rendered'
    check (status in ('rendered','queued_for_approval','approved','sent','failed')),

  provider_message_id text null,
  error_text text null,

  created_at timestamptz not null default now()
);

create index if not exists content_template_usages_workspace_idx
  on public.content_template_usages (workspace_id);

create index if not exists content_template_usages_template_idx
  on public.content_template_usages (workspace_id, template_id);

create index if not exists content_template_usages_lead_idx
  on public.content_template_usages (workspace_id, lead_id);

create index if not exists content_template_usages_conversation_idx
  on public.content_template_usages (workspace_id, conversation_id);

-- RLS
alter table public.content_template_usages enable row level security;

drop policy if exists "workspace members can read template usages" on public.content_template_usages;
create policy "workspace members can read template usages"
on public.content_template_usages
for select
using (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can insert template usages" on public.content_template_usages;
create policy "workspace members can insert template usages"
on public.content_template_usages
for insert
with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can update template usages" on public.content_template_usages;
create policy "workspace members can update template usages"
on public.content_template_usages
for update
using (workspace_id::text = auth.jwt() ->> 'workspace_id')
with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can delete template usages" on public.content_template_usages;
create policy "workspace members can delete template usages"
on public.content_template_usages
for delete
using (workspace_id::text = auth.jwt() ->> 'workspace_id');

-- -------------------------------------------------------------------
-- 3) lead_qualifications (stores your 6-question call results)
-- -------------------------------------------------------------------
create table if not exists public.lead_qualifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  lead_id uuid not null,          -- reference if you have public.leads
  conversation_id uuid null,      -- optional

  schema_version text not null default '6q_v1',

  answers jsonb not null default '{}'::jsonb,  -- { "core.goal": "more_leads", ... }
  total_score int not null default 0,
  max_score int not null default 30,
  tier text not null default 'cold' check (tier in ('hot','warm','cold')),

  summary_text text null, -- generated call summary for copy/paste

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_qualifications_workspace_idx
  on public.lead_qualifications (workspace_id);

create index if not exists lead_qualifications_lead_idx
  on public.lead_qualifications (workspace_id, lead_id);

drop trigger if exists trg_lead_qualifications_updated_at on public.lead_qualifications;
create trigger trg_lead_qualifications_updated_at
before update on public.lead_qualifications
for each row execute function public.set_updated_at();

-- RLS
alter table public.lead_qualifications enable row level security;

drop policy if exists "workspace members can read lead_qualifications" on public.lead_qualifications;
create policy "workspace members can read lead_qualifications"
on public.lead_qualifications
for select
using (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can insert lead_qualifications" on public.lead_qualifications;
create policy "workspace members can insert lead_qualifications"
on public.lead_qualifications
for insert
with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can update lead_qualifications" on public.lead_qualifications;
create policy "workspace members can update lead_qualifications"
on public.lead_qualifications
for update
using (workspace_id::text = auth.jwt() ->> 'workspace_id')
with check (workspace_id::text = auth.jwt() ->> 'workspace_id');

drop policy if exists "workspace members can delete lead_qualifications" on public.lead_qualifications;
create policy "workspace members can delete lead_qualifications"
on public.lead_qualifications
for delete
using (workspace_id::text = auth.jwt() ->> 'workspace_id');

