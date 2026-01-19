-- Create workspace_integrations table
CREATE TABLE public.workspace_integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    provider text NOT NULL CHECK (provider IN (
        'twilio',
        'zoom',
        'google'
    )),
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_enabled boolean DEFAULT FALSE NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (workspace_id, provider)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their workspace integrations
CREATE POLICY "Authenticated users can view their workspace integrations" ON public.workspace_integrations
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_integrations.workspace_id));

-- Policy for workspace owners/admins to manage their workspace integrations
CREATE POLICY "Workspace owners/admins can manage their workspace integrations" ON public.workspace_integrations
FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_integrations.workspace_id AND role IN ('owner', 'admin')))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_integrations.workspace_id AND role IN ('owner', 'admin')));

-- Optional: Add pgcrypto extension for encrypted at rest config field
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- For now, config is just jsonb. Encryption can be added later if needed.