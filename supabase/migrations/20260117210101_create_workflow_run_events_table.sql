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