CREATE TABLE meetings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    workflow_run_id uuid REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('qualification', 'proposal', 'followup')),
    provider text NOT NULL CHECK (provider IN ('zoom', 'google_meet', 'manual')),
    title text NOT NULL,
    description text,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    timezone text NOT NULL,
    meeting_url text,
    status text NOT NULL CHECK (status IN ('scheduled', 'completed', 'canceled', 'no_show')) DEFAULT 'scheduled',
    created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspaces can view their meetings" ON meetings
    FOR SELECT USING (auth.uid() IN (
        SELECT ws.user_id
        FROM public.workspace_members ws
        WHERE ws.workspace_id = meetings.workspace_id
    ));

CREATE POLICY "Workspaces can insert their meetings" ON meetings
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT ws.user_id
        FROM public.workspace_members ws
        WHERE ws.workspace_id = meetings.workspace_id
    ));

CREATE POLICY "Workspaces can update their meetings" ON meetings
    FOR UPDATE USING (auth.uid() IN (
        SELECT ws.user_id
        FROM public.workspace_members ws
        WHERE ws.workspace_id = meetings.workspace_id
    ));

CREATE POLICY "Workspaces can delete their meetings" ON meetings
    FOR DELETE USING (auth.uid() IN (
        SELECT ws.user_id
        FROM public.workspace_members ws
        WHERE ws.workspace_id = meetings.workspace_id
    ));

-- Add indexes for performance
CREATE INDEX meetings_workspace_id_idx ON meetings (workspace_id);
CREATE INDEX meetings_lead_id_idx ON meetings (lead_id);
CREATE INDEX meetings_workflow_run_id_idx ON meetings (workflow_run_id);
CREATE INDEX meetings_created_by_idx ON meetings (created_by);

-- Function to update updated_at timestamp
CREATE FUNCTION update_updated_at_meetings()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_meetings();
