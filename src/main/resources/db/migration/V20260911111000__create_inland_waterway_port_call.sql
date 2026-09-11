-- V20260911110000: Tạo bảng inland_waterway_port_call cho Báo cáo chi tiết phương tiện thủy nội địa ra, vào cảng biển (F-162 / BCDL_177).
CREATE TABLE IF NOT EXISTS public.inland_waterway_port_call (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                 UUID,
    updated_by                 UUID,
    deleted_at                 TIMESTAMP,
    deleted_by                 UUID,

    org_unit_id                UUID NOT NULL,
    report_date                DATE,
    report_code                VARCHAR(100),
    report_name                VARCHAR(500),
    report_period              VARCHAR(50),

    boat_name                  VARCHAR(255),
    registration_number        VARCHAR(50),
    boat_type                  INTEGER,
    boat_grade                 VARCHAR(20),
    length                     NUMERIC(19, 4),
    dwt                        NUMERIC(19, 4),
    gross_tonnage              NUMERIC(19, 4),

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
    enterprise_code            VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_inland_waterway_port_call_org_unit
    ON public.inland_waterway_port_call (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_inland_waterway_port_call_report_date
    ON public.inland_waterway_port_call (report_date);
CREATE INDEX IF NOT EXISTS idx_inland_waterway_port_call_arrival_date
    ON public.inland_waterway_port_call (arrival_date);
CREATE INDEX IF NOT EXISTS idx_inland_waterway_port_call_departure_date
    ON public.inland_waterway_port_call (departure_date);
CREATE INDEX IF NOT EXISTS idx_inland_waterway_port_call_deleted_at
    ON public.inland_waterway_port_call (deleted_at) WHERE deleted_at IS NULL;
