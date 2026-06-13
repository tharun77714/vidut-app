-- Add export columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS export_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS export_url TEXT,
ADD COLUMN IF NOT EXISTS export_error TEXT;
