import type { Lead } from './leads';

export interface Conversation {
  id: string;
  lead_id: string;
  lead: Lead;
  last_message_preview: string;
  last_message_at: string;
  unread: boolean;
  needs_approval: boolean;
  stopped: boolean;
  status: 'open' | 'needs_approval' | 'replied' | 'closed';
  // Add any other relevant conversation fields
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'lead' | 'agent' | 'system';
  content: string;
  created_at: string;
  read_at?: string;
  delivered_at?: string;
  sent_at?: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  // Add any other relevant message fields
}
