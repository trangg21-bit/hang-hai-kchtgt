-- Widen access_logs columns to prevent data truncation errors like 'value too long for type character varying(100)'
ALTER TABLE access_logs ALTER COLUMN target_resource TYPE VARCHAR(500);
ALTER TABLE access_logs ALTER COLUMN request_path TYPE VARCHAR(1000);
ALTER TABLE access_logs ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE access_logs ALTER COLUMN org_unit TYPE VARCHAR(255);
ALTER TABLE access_logs ALTER COLUMN action TYPE VARCHAR(100);
ALTER TABLE access_logs ALTER COLUMN module TYPE VARCHAR(100);
ALTER TABLE access_logs ALTER COLUMN session_id TYPE VARCHAR(100);
