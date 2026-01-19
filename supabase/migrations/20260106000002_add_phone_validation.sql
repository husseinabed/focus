-- Add E.164 phone validation constraint to leads table
ALTER TABLE leads
ADD CONSTRAINT leads_phone_check
CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{1,14}$');
