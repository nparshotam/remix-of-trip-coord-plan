-- Delete World Cup events from 2025 (they should be in 2026)
DELETE FROM travel_events WHERE title ILIKE '%world cup%' AND date >= '2025-06-10' AND date <= '2025-07-18';