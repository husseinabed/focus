CREATE TABLE public.workspace_invites (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    token text UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    expires_at timestamptz NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    accepted_at timestamptz,
    accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace invites are viewable by invited users" ON public.workspace_invites
  FOR SELECT USING ((token = request.jwt() ->> 'invite_token')::text IS NOT NULL OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_invites.workspace_id AND user_id = auth.uid()));

CREATE POLICY "Workspace invites can be created by members with appropriate role" ON public.workspace_invites
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_invites.workspace_id AND user_id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "Workspace invites can be updated by invited user" ON public.workspace_invites
  FOR UPDATE USING (auth.uid() IS NOT NULL AND (token = request.jwt() ->> 'invite_token')::text IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL AND (token = request.jwt() ->> 'invite_token')::text IS NOT NULL);

CREATE POLICY "Workspace invites can be deleted by admins" ON public.workspace_invites
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_invites.workspace_id AND user_id = auth.uid() AND role IN ('admin', 'owner')));

CREATE TRIGGER set_timestamps
BEFORE UPDATE ON public.workspace_invites
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();