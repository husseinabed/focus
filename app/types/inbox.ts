import type { Lead } from './leads';

export interface Conversation {
  id: string;
  workspace_id: string;
  channel: 'whatsapp' | 'email' | 'sms';
  lead_id: string | null;
  lead?: Lead; // Optional, as it might be populated separately or via join
  status: 'open' | 'waiting' | 'snoozed' | 'closed' | 'needs_approval' | 'replied';
  priority: 'low' | 'medium' | 'high';
  unread_count: number;
  last_message_at: string;
  last_message_preview: string;
  assigned_to: string | null;
  tags: string[];
}

export interface ConversationFilters {
  q: string;
  status: 'all' | 'open' | 'waiting' | 'snoozed' | 'closed' | 'needs_approval' | 'replied';
  channel: 'all' | 'whatsapp' | 'email' | 'sms';
  intent: 'all' | 'sales' | 'support' | 'marketing' | 'other';
  unreadOnly: boolean;
}

export interface ConversationSort {
  sortBy: 'recent' | 'priority';
  sortDirection: 'asc' | 'desc';
}


export interface GetConversationsResponse {
  items: Conversation[];
  nextCursor: string | null;
}

// Message types
export interface BaseMessage {
  id: string;
  timestamp: string; // Added timestamp
  created_at: string;
  content: string;
  conversation_id: string;
  sender_type: "lead" | "agent";
  status: "sent" | "delivered" | "read" | "failed" | "pending" | "scheduled" | "needs_approval";
}

export interface RegularMessage extends BaseMessage {
  isOutbound: boolean; // For display purposes in UI
  isAiDraft?: boolean; // Indicates if it's an AI draft awaiting approval
}

export interface SystemMessage {
  id: string; // System messages might not have a database ID, but need a unique key for rendering
  created_at: string;
  content: string;
  type: "system" | "workflow";
}

export type Message = RegularMessage | SystemMessage;

