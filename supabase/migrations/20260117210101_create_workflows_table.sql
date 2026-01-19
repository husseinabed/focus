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