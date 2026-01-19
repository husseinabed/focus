# Workflow Module Database Migrations Plan

This document outlines the SQL migration scripts for implementing the database schema for the workflows module, as specified in the `data_model`. Each section provides the SQL content for a table, along with its suggested filename following the `YYYYMMDDHHmmss_description.sql` convention.

## 1. Workflows Table

**Suggested Filename:** `supabase/migrations/20260117210101_create_workflows_table.sql`

```sql
CREATE TABLE IF NOT EXISTS public.workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT TRUE NOT NULL,
    trigger_type text NOT NULL CHECK (trigger_type IN (
        'lead_added',
        'manual',
        'inbound_reply',
        'scheduled'
    )),
    created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to view workflows"
ON public.workflows FOR SELECT
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow authenticated workspace members to insert workflows"
ON public.workflows FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow authenticated workspace members to update workflows"
ON public.workflows FOR UPDATE
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow authenticated workspace members to delete workflows"
ON public.workflows FOR DELETE
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));
```

## 2. Workflow Versions Table

**Suggested Filename:** `supabase/migrations/20260117210101_create_workflow_versions_table.sql`

```sql
CREATE TABLE IF NOT EXISTS public.workflow_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    version int NOT NULL,
    graph jsonb NOT NULL,
    schema_version int NOT NULL,
    published boolean DEFAULT FALSE NOT NULL,
    created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (workflow_id, version)
);

ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to view workflow_versions"
ON public.workflow_versions FOR SELECT
USING (auth.uid() IS NOT NULL AND workflow_id IN ( SELECT workflows.id FROM public.workflows WHERE workflows.workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid())));

CREATE POLICY "Allow authenticated workspace members to insert workflow_versions"
ON public.workflow_versions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND workflow_id IN ( SELECT workflows.id FROM public.workflows WHERE workflows.workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid())));

CREATE POLICY "Allow authenticated workspace members to update workflow_versions"
ON public.workflow_versions FOR UPDATE
USING (auth.uid() IS NOT NULL AND workflow_id IN ( SELECT workflows.id FROM public.workflows WHERE workflows.workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid())));

CREATE POLICY "Allow authenticated workspace members to delete workflow_versions"
ON public.workflow_versions FOR DELETE
USING (auth.uid() IS NOT NULL AND workflow_id IN ( SELECT workflows.id FROM public.workflows WHERE workflows.workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid())));
```

## 3. Workflow Runs Table

**Suggested Filename:** `supabase/migrations/20260117210101_create_workflow_runs_table.sql`

```sql
CREATE TABLE IF NOT EXISTS public.workflow_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    workflow_version_id uuid NOT NULL REFERENCES public.workflow_versions(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN (
        'running',
        'paused',
        'completed',
        'failed',
        'stopped'
    )),
    stop_reason text,
    current_node_id text,
    started_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    finished_at timestamptz,
    created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to view workflow_runs"
ON public.workflow_runs FOR SELECT
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow authenticated workspace members to insert workflow_runs"
ON public.workflow_runs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow authenticated workspace members to update workflow_runs"
ON public.workflow_runs FOR UPDATE
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow authenticated workspace members to delete workflow_runs"
ON public.workflow_runs FOR DELETE
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));
```

## 4. Workflow Run Events Table

**Suggested Filename:** `supabase/migrations/20260117210101_create_workflow_run_events_table.sql`

```sql
CREATE TABLE IF NOT EXISTS public.workflow_run_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN (
        'node_started',
        'node_completed',
        'node_failed',
        'message_draft_created',
        'approval_requested',
        'sent',
        'reply_detected',
        'booking_created'
    )),
    node_id text,
    payload jsonb,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workflow_run_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to view workflow_run_events"
ON public.workflow_run_events FOR SELECT
USING (auth.uid() IS NOT NULL AND run_id IN ( SELECT workflow_runs.id FROM public.workflow_runs WHERE workflow_runs.workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid())));

CREATE POLICY "Allow authenticated workspace members to insert workflow_run_events"
ON public.workflow_run_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND run_id IN ( SELECT workflow_runs.id FROM public.workflow_runs WHERE workflow_runs.workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid())));

CREATE POLICY "Allow authenticated workspace members to update workflow_run_events"
ON public.workflow_run_events FOR UPDATE
USING (auth.uid() IS NOT NULL AND run_id IN ( SELECT workflow_runs.id FROM public.workflow_runs WHERE workflow_runs.workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid())));

CREATE POLICY "Allow authenticated workspace members to delete workflow_run_events"
ON public.workflow_run_events FOR DELETE
USING (auth.uid() IS NOT NULL AND run_id IN ( SELECT workflow_runs.id FROM public.workflow_runs WHERE workflow_runs.workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid())));
```
