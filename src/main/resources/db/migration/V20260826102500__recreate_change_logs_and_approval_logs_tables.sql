-- Migration: Recreate change_logs and approval_logs tables for entity audit and approval history
-- Version: V20260826102500

CREATE TABLE IF NOT EXISTS public.change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(36) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(36)
);

CREATE INDEX IF NOT EXISTS idx_change_logs_entity ON public.change_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_changed_at ON public.change_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_logs_changed_by ON public.change_logs(changed_by);

CREATE TABLE IF NOT EXISTS public.approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    reason TEXT,
    decided_by VARCHAR(36) NOT NULL,
    decided_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cap VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(36)
);

CREATE INDEX IF NOT EXISTS idx_approval_logs_entity ON public.approval_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_logs_decided_at ON public.approval_logs(decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_logs_decided_by ON public.approval_logs(decided_by);
