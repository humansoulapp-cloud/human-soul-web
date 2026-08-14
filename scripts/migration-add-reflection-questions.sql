-- Migration to add end-of-journey reflection questions to the journeys table
-- Run this in your Supabase SQL Editor if the column is not already present

ALTER TABLE journeys
ADD COLUMN IF NOT EXISTS reflection_questions jsonb NULL;
