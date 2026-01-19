-- Ensure trigger_set_timestamp function exists
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Authenticated users can view their workspace settings" ON public.workspace_settings;
DROP POLICY IF EXISTS "Workspace owners/admins can update their workspace settings" ON public.workspace_settings;

-- Create new RLS policies
CREATE POLICY "Workspace settings are viewable by members" ON public.workspace_settings
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_settings.workspace_id AND user_id = auth.uid()));

CREATE POLICY "Workspace settings can be updated by admins" ON public.workspace_settings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_settings.workspace_id AND user_id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "Workspace settings can be inserted by owner" ON public.workspace_settings
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_settings.workspace_id AND user_id = auth.uid() AND role = 'owner'));

-- Create a trigger to update 'updated_at' on each update
CREATE TRIGGER set_timestamps
BEFORE UPDATE ON public.workspace_settings
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();