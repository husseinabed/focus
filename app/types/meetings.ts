export interface Meeting {
  id: string;
  workspace_id: string;
  lead_id: string;
  workflow_run_id?: string | null;
  type: 'qualification' | 'proposal' | 'followup';
  provider: 'zoom' | 'google_meet' | 'manual';
  title: string;
  description?: string | null;
  start_time: string; // ISO 8601 string
  end_time: string; // ISO 8601 string
  timezone: string;
  meeting_url?: string | null;
  status: 'scheduled' | 'completed' | 'canceled' | 'no_show';
  created_by: string;
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
}

export interface MeetingInsert {
  workspace_id: string;
  lead_id: string;
  workflow_run_id?: string | null;
  type: 'qualification' | 'proposal' | 'followup';
  provider: 'zoom' | 'google_meet' | 'manual';
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
  meeting_url?: string | null;
  status?: 'scheduled' | 'completed' | 'canceled' | 'no_show';
  created_by: string;
}

export interface MeetingUpdate {
  lead_id?: string;
  workflow_run_id?: string | null;
  type?: 'qualification' | 'proposal' | 'followup';
  provider?: 'zoom' | 'google_meet' | 'manual';
  title?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  meeting_url?: string | null;
  status?: 'scheduled' | 'completed' | 'canceled' | 'no_show';
}
