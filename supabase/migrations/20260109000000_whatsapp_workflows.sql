-- Status of a workflow instance
CREATE TYPE workflow_instance_status AS ENUM ('active', 'paused', 'completed', 'failed');

-- Status of a specific node execution
CREATE TYPE node_execution_status AS ENUM ('pending_approval', 'executing', 'waiting', 'completed', 'failed');

-- Status of a pending approval
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow instances table
CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    current_node_id TEXT,
    status workflow_instance_status NOT NULL DEFAULT 'active',
    variables JSONB NOT NULL DEFAULT '{}',
    next_timeout_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow logs table
CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
    node_id TEXT,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pending approvals table
CREATE TABLE IF NOT EXISTS pending_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
    node_id TEXT,
    message_content TEXT,
    status approval_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_instances_lead_id ON workflow_instances(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status_timeout ON workflow_instances(status, next_timeout_at);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_instance_id ON workflow_logs(instance_id);

-- Enable Row Level Security (RLS)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Assuming authenticated access)
CREATE POLICY "Allow authenticated access to workflows" ON workflows FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to workflow_instances" ON workflow_instances FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to workflow_logs" ON workflow_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to pending_approvals" ON pending_approvals FOR ALL TO authenticated USING (true);
