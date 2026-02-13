-- Redesign: Add review_notes and decision_source to public.message_approvals

ALTER TABLE public.message_approvals
ADD COLUMN review_notes text NULL,
ADD COLUMN decision_source text NULL DEFAULT 'manual'
CHECK (decision_source in ('manual','auto_policy'));