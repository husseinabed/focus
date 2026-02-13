CREATE TABLE IF NOT EXISTS public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    repo text,
    vercel_id text,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow workspace members to view projects"
ON public.projects FOR SELECT
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow workspace members to insert projects"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow workspace members to update projects"
ON public.projects FOR UPDATE
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE POLICY "Allow workspace members to delete projects"
ON public.projects FOR DELETE
USING (auth.uid() IS NOT NULL AND workspace_id IN ( SELECT workspace_members.workspace_id FROM public.workspace_members WHERE workspace_members.user_id = auth.uid()));

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
