-- F-001 instant permission revocation: monotonic version stamped into each JWT.
-- Bumped whenever a user's role assignment changes so previously-issued tokens
-- become stale and the user is forced to re-authenticate on the next request.
-- Compatible with both PostgreSQL (local/prod) and H2 (test).
ALTER TABLE app_users ADD COLUMN permission_version INTEGER NOT NULL DEFAULT 0;
