-- V20260906120000: Tạo bảng ship_port_call cho Sổ tàu biển ra vào cảng biển (F-300).
-- Brand-new additive entity (C3 one-way door) — no backfill needed.
-- Version 20260906120000 > newest applied V20260905110000 (Flyway out-of-order=false).
-- Columns exactly as design plan §4 (50 business columns + BaseEntity audit columns);
-- org_unit_id UUID NOT NULL (data scope row identity). Binary enums (island_route,
-- dangerous_goods) stored SMALLINT; all open vocabularies stored VARCHAR (no invented enum).
CREATE TABLE IF NOT EXISTS public.ship_port_call (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at                 TIMESTAMP NOT NULL,
    updated_at                 TIMESTAMP NOT NULL,
    created_by                 UUID,
    updated_by                 UUID,
    deleted_at                 TIMESTAMP,
    deleted_by                 UUID,

    org_unit_id                UUID NOT NULL,
    report_date                DATE,
    report_code                VARCHAR(100),
    report_name                VARCHAR(500),
    report_period              VARCHAR(50),
    ship_name                  VARCHAR(255),
    call_sign                  VARCHAR(50),
    imo_number                 VARCHAR(50),
    nationality                VARCHAR(100),
    ship_type                  VARCHAR(255),
    length                     NUMERIC(19, 4),
    draft_arrival_departure    NUMERIC(19, 4),
    dwt                        NUMERIC(19, 4),
    gt                         NUMERIC(19, 4),
    air_draft_actual           NUMERIC(19, 4),
    export_tons                NUMERIC(19, 4),
    export_teus                NUMERIC(19, 4),
    export_empty_teus          NUMERIC(19, 4),
    import_tons                NUMERIC(19, 4),
    import_teus                NUMERIC(19, 4),
    import_empty_teus          NUMERIC(19, 4),
    domestic_in_tons           NUMERIC(19, 4),
    domestic_in_teus           NUMERIC(19, 4),
    domestic_in_empty_teus     NUMERIC(19, 4),
    domestic_out_tons          NUMERIC(19, 4),
    domestic_out_teus          NUMERIC(19, 4),
    domestic_out_empty_teus    NUMERIC(19, 4),
    transshipment_tons         NUMERIC(19, 4),
    transshipment_teus         NUMERIC(19, 4),
    transit_handling_tons      NUMERIC(19, 4),
    transit_handling_teus      NUMERIC(19, 4),
    transit_no_handling_tons   NUMERIC(19, 4),
    transit_no_handling_teus   NUMERIC(19, 4),
    passengers_arrival         INTEGER,
    passengers_departure       INTEGER,
    cargo_group                VARCHAR(255),
    cargo_type                 VARCHAR(255),
    cargo_name                 VARCHAR(500),
    last_port_of_call          VARCHAR(255),
    arrival_port_name          VARCHAR(255),
    arrival_port_code          VARCHAR(50),
    departure_port_name        VARCHAR(255),
    departure_port_code        VARCHAR(50),
    destination_port           VARCHAR(255),
    arrival_date               DATE,
    departure_date             DATE,
    island_route               SMALLINT,
    dangerous_goods            SMALLINT,
    ship_agent                 VARCHAR(255),
    enterprise_code            VARCHAR(100)
);

-- Indexes (mirror V20260905110000__x_port_planning_update.sql naming convention).
CREATE INDEX IF NOT EXISTS idx_ship_port_call_org_unit
    ON public.ship_port_call (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_ship_port_call_org_unit_created
    ON public.ship_port_call (org_unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ship_port_call_report_date
    ON public.ship_port_call (report_date);
