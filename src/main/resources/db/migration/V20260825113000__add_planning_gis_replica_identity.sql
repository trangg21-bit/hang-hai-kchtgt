-- qhcb_all contains the persisted planning GIS features in the new system.
-- These tables are part of a logical replication publication, so UPDATE needs
-- a stable replica identity. A source feature is uniquely identified by the
-- originating schema, table and fid.

ALTER TABLE qhcb_all.area
    ALTER COLUMN schema_name SET NOT NULL,
    ALTER COLUMN table_name SET NOT NULL,
    ALTER COLUMN fid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_qhcb_area_source_feature
    ON qhcb_all.area (schema_name, table_name, fid);

ALTER TABLE qhcb_all.area
    REPLICA IDENTITY USING INDEX uq_qhcb_area_source_feature;

ALTER TABLE qhcb_all.line
    ALTER COLUMN schema_name SET NOT NULL,
    ALTER COLUMN table_name SET NOT NULL,
    ALTER COLUMN fid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_qhcb_line_source_feature
    ON qhcb_all.line (schema_name, table_name, fid);

ALTER TABLE qhcb_all.line
    REPLICA IDENTITY USING INDEX uq_qhcb_line_source_feature;

ALTER TABLE qhcb_all.point
    ALTER COLUMN schema_name SET NOT NULL,
    ALTER COLUMN table_name SET NOT NULL,
    ALTER COLUMN fid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_qhcb_point_source_feature
    ON qhcb_all.point (schema_name, table_name, fid);

ALTER TABLE qhcb_all.point
    REPLICA IDENTITY USING INDEX uq_qhcb_point_source_feature;
