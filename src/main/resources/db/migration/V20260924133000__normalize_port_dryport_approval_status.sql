-- V20260924133000: Normalize approval_status for ports and dry_ports to 1-level approval (DRAFT, APPROVED, ARCHIVED)

DO $$
BEGIN
  -- 1. Ports: chuyển các trạng thái trung gian về APPROVED (5)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ports') THEN
    UPDATE ports
    SET approval_status = 5
    WHERE approval_status IN (2, 3);

    UPDATE ports
    SET approval_status = 0
    WHERE approval_status IN (8, 9, 6); -- REJECTED_LEVEL1, REJECTED_LEVEL2, REJECTED -> DRAFT
  END IF;

  -- 2. Dry Ports: chuyển các trạng thái trung gian về APPROVED (5)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dry_ports') THEN
    UPDATE dry_ports
    SET approval_status = 5
    WHERE approval_status IN (2, 3);

    UPDATE dry_ports
    SET approval_status = 0
    WHERE approval_status IN (8, 9, 6); -- REJECTED_LEVEL1, REJECTED_LEVEL2, REJECTED -> DRAFT
  END IF;
END $$;
