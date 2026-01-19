import { z } from 'zod';

export interface Lead {
  id?: string;
  company_name: string;
  full_name?: string;
  phone: string;
  phone_e164?: string;
  language: 'auto' | 'he' | 'ar' | 'en';
  city?: string;
  source: 'manual' | 'import' | 'google_maps' | 'whatsapp_inbound';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  website?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const phoneRegex = /^\+\d{10,15}$/; // Example regex for E.164, adjust as needed

export const LeadSchema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required'),
  full_name: z.string().trim().optional(),
  phone: z.string().trim().min(1, 'Phone number is required').regex(phoneRegex, 'Invalid phone number format. Must be E.164.'),
  language: z.enum(['auto', 'he', 'ar', 'en']).default('auto'),
  city: z.string().trim().optional(),
  source: z.enum(['manual', 'import', 'google_maps', 'whatsapp_inbound']).default('manual'),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).default('new'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  website: z.string().trim().url('Invalid URL format').optional().or(z.literal('')), 
  email: z.string().trim().email('Invalid email format').optional().or(z.literal('')), 
  notes: z.string().trim().optional(),
  tags: z.array(z.string().trim()).max(8, 'Maximum 8 tags allowed').optional(),
});

export interface AggregatedCounts {
  total: number;
  new: number;
  pending_approval: number;
  replied_today: number;
}

export interface LeadQualification {
  id: string;
  lead_id: string;
  status: 'pending' | 'qualified' | 'disqualified';
  score?: number;
  summary?: string;
  answers?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  channel: 'whatsapp' | 'email' | 'phone';
  unread_count: number;
  last_message_at?: string;
  last_message_preview?: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  lead_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
