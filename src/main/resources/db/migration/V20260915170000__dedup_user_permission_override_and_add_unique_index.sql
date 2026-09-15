-- Deduplicate active user permission overrides keeping the newest record
DELETE FROM public.user_permission_override a
USING public.user_permission_override b
WHERE a.user_id = b.user_id
  AND LOWER(a.permission_code) = LOWER(b.permission_code)
  AND a.deleted_at IS NULL
  AND b.deleted_at IS NULL
  AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id));

-- Re-create unique index on (user_id, LOWER(permission_code)) for active records
DROP INDEX IF EXISTS public.uq_user_permission_override_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_permission_override_active
    ON public.user_permission_override(user_id, LOWER(permission_code))
    WHERE deleted_at IS NULL;
