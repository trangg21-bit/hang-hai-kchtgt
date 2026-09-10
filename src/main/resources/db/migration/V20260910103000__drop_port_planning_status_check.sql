-- =====================================================================
-- V20260910103000__drop_port_planning_status_check.sql
-- F-132/133/134: drop stale check constraint `port_planning_status_check`.
--
-- Root cause: the legacy constraint enforces
--   status::text IN ('HIEN_HANH', 'DA_THAY_THE', 'LICH_SU')
-- while V20260905110000__x_port_planning_update.sql (design plan D6)
-- converted `port_planning.status` from VARCHAR to ORDINAL INT
-- (0=DRAFT, 1=EFFECTIVE, 2=REPLACED, 3=HISTORY). Any INSERT with
-- status != one of the three legacy VN strings now violates the check,
-- surfacing as the generic "Dữ liệu đã tồn tại hoặc không hợp lệ".
--
-- House style: guarded DROP (peers drop stale *_status_check constraints
-- after enum -> INT conversion).
-- =====================================================================

ALTER TABLE public.port_planning
    DROP CONSTRAINT IF EXISTS port_planning_status_check;
