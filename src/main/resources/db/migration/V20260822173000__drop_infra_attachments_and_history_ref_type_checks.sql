-- Drop restrictive check constraints on ref_type to support all InfrastructureType values (including VTS_OPERATION_CENTER and AIS_SYSTEM)
ALTER TABLE infrastructure_attachments DROP CONSTRAINT IF EXISTS infrastructure_attachments_ref_type_check;
ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_ref_type_check;
