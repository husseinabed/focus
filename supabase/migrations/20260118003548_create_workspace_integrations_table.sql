CREATE TABLE public.workspace_integrations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    provider text NOT NULL CHECK (provider IN ('twilio', 'zoom', 'google')),
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace integrations are viewable by members" ON public.workspace_integrations
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_integrations.workspace_id AND user_id = auth.uid()));

CREATE POLICY "Workspace integrations can be updated by admins" ON public.workspace_integrations
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_integrations.workspace_id AND user_id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "Workspace integrations can be inserted by owner" ON public.workspace_integrations
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_integrations.workspace_id AND user_id = auth.uid() AND role = 'owner'));

CREATE TRIGGER set_timestamps
BEFORE UPDATE ON public.workspace_integrations
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();