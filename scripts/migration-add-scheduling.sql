-- Migration to add scheduling and publishing status to journeys table
-- Run this in your Supabase SQL Editor if columns are not already present

ALTER TABLE journeys
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz NULL;

-- Create an index to quickly lookup scheduled journeys
CREATE INDEX IF NOT EXISTS idx_journeys_status_scheduled_publish_at 
ON journeys (status, scheduled_publish_at);
