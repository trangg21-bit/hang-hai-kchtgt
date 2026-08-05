ALTER TABLE approval_history ALTER COLUMN approved_date TYPE TIMESTAMP USING approved_date::timestamp;
