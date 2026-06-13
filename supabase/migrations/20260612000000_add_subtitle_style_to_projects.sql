-- Add subtitle_style JSONB column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS subtitle_style JSONB NOT NULL DEFAULT '{
  "fontFamily": "Inter",
  "fontSize": 24,
  "fontWeight": 700,
  "textColor": "#FFFFFF",
  "backgroundColor": "rgba(0, 0, 0, 0.75)",
  "strokeColor": "#000000",
  "strokeWidth": 0,
  "shadowColor": "rgba(0, 0, 0, 0.5)",
  "shadowBlur": 4,
  "alignment": "center",
  "position": "bottom"
}'::jsonb;
