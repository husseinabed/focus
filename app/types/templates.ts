export type TemplateLocaleEntry = {
  subject?: string;
  body: string;
};

export interface Template {
  id: string;
  workspace_id: string;
  key: string;
  title: string;
  category: 'outreach' | 'followup' | 'reply' | 'qualification' | 'proposal' | 'system';
  channel: 'whatsapp' | 'sms' | 'email' | 'in_app';
  status: 'draft' | 'active' | 'archived';
  locales: Record<string, TemplateLocaleEntry>;
  variants: Record<string, any>;
  variables_schema: Record<string, any>;
  defaults: Record<string, any>;
  rules: Record<string, any>;
  compliance: Record<string, any>;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}
