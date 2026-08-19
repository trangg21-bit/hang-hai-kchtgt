-- M-1004 Field-level Authorization PoC: policy table + one demo seed.
-- Enum columns are SMALLINT ordinals: subject_type 0=PERMISSION 1=GROUP 2=USER,
-- target_type 0=FIELD 1=GROUP 2=ALL, effect 0=HIDE 1=READONLY 2=ALLOW.

CREATE TABLE IF NOT EXISTS field_policy (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type SMALLINT NOT NULL,          -- 0=PERMISSION 1=GROUP 2=USER (ordinal)
    subject_id   VARCHAR(255) NOT NULL,       -- permission code | group UUID | user UUID
    resource     VARCHAR(100) NOT NULL,       -- feature key; '*' = all resources
    target_type  SMALLINT NOT NULL,           -- 0=FIELD 1=GROUP 2=ALL (ordinal)
    target_key   VARCHAR(255) NOT NULL,       -- JSON property name; '*' when target_type=ALL
    effect       SMALLINT NOT NULL,           -- 0=HIDE 1=READONLY 2=ALLOW (ordinal)
    priority     INT NOT NULL DEFAULT 0,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP,
    deleted_by   UUID,
    created_by   UUID,
    updated_by   UUID
);

CREATE INDEX IF NOT EXISTS idx_field_policy_resource_active ON field_policy (resource, active);
CREATE INDEX IF NOT EXISTS idx_field_policy_subject ON field_policy (subject_type, subject_id);

-- Seed: ONE demo policy (D6) — hide 'updatedDate' on resource 'vts' for holders of 'vts:read'.
-- target_type = 0 (FIELD) so ONLY 'updatedDate' is hidden, never the whole resource.
INSERT INTO field_policy (subject_type, subject_id, resource, target_type, target_key, effect, priority, active)
SELECT 0, 'vts:read', 'vts', 0, 'updatedDate', 0, 10, TRUE
WHERE NOT EXISTS (SELECT 1 FROM field_policy WHERE resource = 'vts' AND target_key = 'updatedDate' AND deleted_at IS NULL);
