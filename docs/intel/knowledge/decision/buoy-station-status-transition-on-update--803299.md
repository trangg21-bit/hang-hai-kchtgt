---
id: AM-8032990bcd0b493a
kind: decision
topic: buoy-station-status-transition-on-update
tags: []
importance: 0.85
agent: 
created: 2026-08-20T08:51:41.834Z
updated: 2026-08-20T08:51:41.834Z
---

LUẬT TRẠNG THÁI MỚI (2026-08-20, user chốt): cập nhật bản ghi ĐÃ PHÊ DUYỆT (PUBLISHED/APPROVED_L1/L2) ở cả Nhà trạm Phao, tiêu (BuoyStationService.update) và Phao, tiêu (BuoyService.update) → status thành PENDING_APPROVAL (Chờ Cảng vụ duyệt) thay vì DRAFT như cũ; DRAFT sau cập nhật VẪN giữ DRAFT; update-reset còn refresh sentApprovedBy/Date (station) và submittedForApprovalBy/At (buoy) = current user/now. Guard submitForApproval 2 service đã nới cho phép PENDING_APPROVAL (re-submit idempotent) để nút 'Lưu và gửi phê duyệt'/'Lưu và phê duyệt' không throw sau khi update đã chuyển trạng thái. Toast sửa phao tiêu đổi 'Lưu nháp thành công' → 'Cập nhật thành công' (BuoyListPage).
