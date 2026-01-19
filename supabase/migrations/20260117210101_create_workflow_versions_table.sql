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
