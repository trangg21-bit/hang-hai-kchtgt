-- V3: Seed lockout policy (safe insert)
INSERT INTO lockout_policies (id, max_failed_attempts, lockout_duration_minutes, window_minutes, is_enabled)
VALUES (1, 5, 30, 15, 1)
WHERE NOT EXISTS (SELECT 1 FROM lockout_policies WHERE id = 1);