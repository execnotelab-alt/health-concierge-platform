-- Migration: Add website_url and scheduling_notes to providers
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE providers ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS scheduling_notes TEXT;

-- Populate provider website URLs and scheduling notes
UPDATE providers SET 
  website_url = 'https://www.usdermatologypartners.com',
  scheduling_notes = 'Go to Request an Appointment page. Select Flower Mound location, then Dawn Wells PA-C. Existing patient flow asks for name + DOB.'
WHERE name = 'Dawn Wells';

UPDATE providers SET 
  website_url = 'https://www.totaleyecaredenton.com',
  scheduling_notes = 'Also available via Zocdoc: https://www.zocdoc.com/doctor/jodie-may-od-557875 — Zocdoc lets you pick provider and time slot as existing patient with name + DOB. Eye appt already booked for Jun 26 2026.'
WHERE name ILIKE '%Jodie May%' OR name ILIKE '%Kimberly Vang%';

UPDATE providers SET 
  website_url = 'https://www.divinedentaltx.com',
  scheduling_notes = 'Phone-only scheduling. Call to book. Sep 25 2026 appointment already scheduled.'
WHERE name ILIKE '%Divine Dental%';

UPDATE providers SET 
  website_url = 'https://www.questcare.com',
  scheduling_notes = 'Uses athenahealth portal for scheduling. Check website for public scheduling option first, fall back to portal.'
WHERE name ILIKE '%Amanda%Jimenez%';

UPDATE providers SET 
  website_url = 'https://www.texashealthflowermound.com',
  scheduling_notes = 'Texas Health MyChart (Epic). Specialist — next follow-up not until ~2036.'
WHERE name ILIKE '%Mehul Shah%';
