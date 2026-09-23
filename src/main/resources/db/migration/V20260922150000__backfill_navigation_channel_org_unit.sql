-- F-038 (Luồng hàng hải): backfill navigation_channel.org_unit_id đang NULL từ người tạo.
--
-- Bản ghi tạo trước khi có DataScope (hoặc tạo qua API không gửi 'Đơn vị quản lý') để
-- org_unit_id NULL ⇒ Hibernate global filter `orgUnitFilter` (org_unit_id IN (:orgUnitIds))
-- không bao giờ khớp ⇒ tài khoản bị giới hạn phạm vi không thấy bản ghi; đồng thời luồng GHI
-- trước đây còn bị chặn 403 vì allows(null) = false.
-- Backfill gán đơn vị của người tạo: navigation_channel.created_by → app_users.org_unit_id.
--
-- An toàn + idempotent: CHỈ UPDATE các dòng đang NULL, không ghi đè giá trị đã có ⇒ chạy lại là no-op.
-- Lưu ý tên bảng: entity User map tới `app_users` (KHÔNG phải `users`).
-- Dòng không khôi phục được (created_by NULL, hoặc người tạo chưa gán đơn vị) giữ nguyên NULL —
-- sẽ được gán khi người dùng sửa hồ sơ (NavigationChannelService.update fallback về đơn vị người thao tác).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'navigation_channel')
     AND EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'app_users')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'org_unit_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'created_by')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'org_unit_id') THEN
    EXECUTE '
      UPDATE navigation_channel nc
      SET org_unit_id = u.org_unit_id
      FROM app_users u
      WHERE nc.org_unit_id IS NULL
        AND nc.created_by IS NOT NULL
        AND nc.created_by = u.id
        AND u.org_unit_id IS NOT NULL
    ';
  END IF;
END $$;
