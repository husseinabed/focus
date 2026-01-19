-- Create workspace_invites table
CREATE TABLE public.workspace_invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    token text UNIQUE NOT NULL,
    role text DEFAULT 'member' NOT NULL,
    expires_at timestamptz NOT NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    accepted_at timestamptz,
    accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Policy for workspace owners/admins to create invites for their workspace
CREATE POLICY "Workspace owners/admins can create invites" ON public.workspace_invites
FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_invites.workspace_id AND role IN (
        'owner',
        'admin'
    )));

-- Policy for authenticated users to view relevant invites
CREATE POLICY "Authenticated users can view relevant invites" ON public.workspace_invites
FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_invites.workspace_id)
    OR
    (auth.uid() IS NULL AND expires_at > now()) -- This part is tricky for public invite links. Let's simplify for now if token is public
    -- OR auth.jwt() ->> 'email' = (SELECT email FROM public.profiles WHERE id = created_by) -- This would require email in token and profile
);

-- Policy for invitees to update (accept) their invite
CREATE POLICY "Invitee can accept their invite" ON public.workspace_invites
FOR UPDATE USING (auth.uid() IS NOT NULL AND accepted_at IS NULL AND expires_at > now())
WITH CHECK (auth.uid() IS NOT NULL AND accepted_at IS NOT NULL AND accepted_by = auth.uid());

-- Policy for workspace owners/admins to delete invites
CREATE POLICY "Workspace owners/admins can delete invites" ON public.workspace_invites
FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_invites.workspace_id AND role IN (
        'owner',
        'admin'
    )));