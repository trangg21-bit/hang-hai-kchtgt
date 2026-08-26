---
id: AM-dd0237fa804bc329
kind: decision
topic: buoy-station-no-default-orgunit
tags: []
importance: 0.6
agent: 
created: 2026-08-20T01:20:10.794Z
updated: 2026-08-20T01:20:10.794Z
---

2026-08-20: Form TẠO MỚI nhà trạm phao tiêu bỏ tự chọn mặc định Đơn vị quản lý — đã xóa effect gọi GET /users/me rồi form.setFieldsValue({orgUnitId: p.orgUnitId}) trong BuoyStationFormContent (create mode). Giờ ô Đơn vị quản lý trống khi mở form mới; chọn thủ công vẫn tải cảng + sinh mã. Edit mode giữ nguyên (prefill từ bản ghi, Select disabled). Form phao tiêu (BuoyFormContent) vốn KHÔNG có tự chọn — defaultOrgUnitId trong BuoyListPage chỉ dùng cho bộ lọc list. Gate: npm run build exit 0.
