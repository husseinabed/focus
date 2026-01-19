-- Create workspace_settings table
CREATE TABLE public.workspace_settings (
    workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    default_locale text DEFAULT 'en' NOT NULL,
    timezone text DEFAULT 'Asia/Jerusalem' NOT NULL,
    brand_color text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their workspace settings
CREATE POLICY "Authenticated users can view their workspace settings" ON public.workspace_settings
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_settings.workspace_id));

-- Policy for workspace owners/admins to update their workspace settings
CREATE POLICY "Workspace owners/admins can update their workspace settings" ON public.workspace_settings
FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_settings.workspace_id AND role IN ('owner', 'admin')))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = public.workspace_settings.workspace_id AND role IN ('owner', 'admin')));