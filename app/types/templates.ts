export interface Template {
  id: string;
  name: string;
  category: 'outreach' | 'followup' | 'reply' | 'qualification' | 'proposal';
  language: 'he' | 'ar' | 'en' | 'auto';
  body: string;
  variables: Record<string, { label: string; example: string }>;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}