-- Migration: Convert infrastructure_history.ref_type from VARCHAR to INTEGER (matching InfrastructureType ordinal)
-- Version: V20260911143500

DO $$ 
BEGIN 
  IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'infrastructure_history' AND column_name = 'ref_type' 
        AND data_type LIKE '%character%'
  ) THEN 
    ALTER TABLE infrastructure_history ALTER COLUMN ref_type DROP DEFAULT; 
    ALTER TABLE infrastructure_history ALTER COLUMN ref_type TYPE INTEGER USING (
      CASE 
        WHEN ref_type ~ '^[0-9]+$' THEN ref_type::integer
        WHEN upper(trim(ref_type)) IN ('SEAPORT', 'CANGBIEN', 'PORT') THEN 0
        WHEN upper(trim(ref_type)) IN ('PORT_TERMINAL', 'BENCANG', 'BERTH') THEN 1
        WHEN upper(trim(ref_type)) IN ('PIER', 'CAUCANG') THEN 2
        WHEN upper(trim(ref_type)) IN ('DRY_PORT', 'CANGCAN') THEN 3
        WHEN upper(trim(ref_type)) IN ('WATER_AREA', 'VUNGNUOC') THEN 4
        WHEN upper(trim(ref_type)) IN ('DIKE_REVETMENT', 'DEKE') THEN 5
        WHEN upper(trim(ref_type)) IN ('NAVIGATION_CHANNEL', 'LUONGHANGHAI') THEN 6
        WHEN upper(trim(ref_type)) IN ('SHIP_REPAIR_FACILITY', 'COSO_SUACHUA') THEN 7
        WHEN upper(trim(ref_type)) IN ('LIGHTHOUSE', 'DENBIEN') THEN 8
        WHEN upper(trim(ref_type)) IN ('BUOY', 'PHAOTIEU') THEN 9
        WHEN upper(trim(ref_type)) IN ('VTS_SYSTEM', 'HE_THONG_VTS') THEN 10
        WHEN upper(trim(ref_type)) IN ('RADAR_STATION_LEGACY') THEN 11
        WHEN upper(trim(ref_type)) IN ('RADAR_STATION', 'TRAM_RADAR', 'RADAR') THEN 12
        WHEN upper(trim(ref_type)) IN ('BUOY_BERTH', 'BENPHAO') THEN 13
        WHEN upper(trim(ref_type)) IN ('SHIP_REPAIR_YARD') THEN 14
        WHEN upper(trim(ref_type)) IN ('ANCHORAGE_AREA', 'KHUNEO_DAU') THEN 15
        WHEN upper(trim(ref_type)) IN ('TRANSSHIPMENT_AREA', 'KHUCHUYEN_TAI') THEN 16
        WHEN upper(trim(ref_type)) IN ('STORM_SHELTER_AREA', 'KHUTRANH_TRU_BAO') THEN 17
        WHEN upper(trim(ref_type)) IN ('DAI_TTDH') THEN 18
        WHEN upper(trim(ref_type)) IN ('COASTAL_RADIO_STATION', 'HAIPHONG_STATION', 'COASTAL_STATION_HAIPHONG') THEN 19
        WHEN upper(trim(ref_type)) IN ('INMARSAT_STATION', 'COASTAL_STATION_INMARSAT') THEN 20
        WHEN upper(trim(ref_type)) IN ('COSPAS_SARSAT_STATION') THEN 21
        WHEN upper(trim(ref_type)) IN ('LRIT_STATION', 'COASTAL_STATION_LRIT') THEN 22
        WHEN upper(trim(ref_type)) IN ('HANOI_STATION') THEN 23
        WHEN upper(trim(ref_type)) IN ('BUOY_STATION') THEN 24
        WHEN upper(trim(ref_type)) IN ('LEGAL_DOCUMENT') THEN 25
        WHEN upper(trim(ref_type)) IN ('VTS_OPERATION_CENTER') THEN 26
        WHEN upper(trim(ref_type)) IN ('AIS_SYSTEM') THEN 27
        WHEN upper(trim(ref_type)) IN ('CCTV') THEN 28
        WHEN upper(trim(ref_type)) IN ('VHF') THEN 29
        WHEN upper(trim(ref_type)) IN ('SCADA') THEN 30
        WHEN upper(trim(ref_type)) IN ('TRANSMISSION') THEN 31
        WHEN upper(trim(ref_type)) IN ('VTS_ASSIST') THEN 32
        WHEN upper(trim(ref_type)) IN ('SEAPORT_THROUGHPUT') THEN 33
        WHEN upper(trim(ref_type)) IN ('VTS_ZONE') THEN 34
        ELSE 0
      END
    ); 
  END IF; 
END $$;

DROP INDEX IF EXISTS idx_infra_history_ref;
CREATE INDEX IF NOT EXISTS idx_infra_history_ref ON infrastructure_history(ref_type, ref_id, approved_date DESC);
