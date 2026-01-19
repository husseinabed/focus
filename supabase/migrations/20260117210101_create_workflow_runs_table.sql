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