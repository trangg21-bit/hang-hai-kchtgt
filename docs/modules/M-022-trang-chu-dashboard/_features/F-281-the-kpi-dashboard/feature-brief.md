---
id: F-281
name: Thẻ KPI Dashboard
slug: the-kpi-dashboard
module-id: M-022
status: done
classification: local
priority: high
created: 2026-07-09T00:00:00Z
last-updated: 2026-07-13T00:00:00Z
locked-fields: []
consumed_by_modules: []
stage: closed
---
# Feature: Thẻ KPI Dashboard

## Description

Hàng 6 card hiển thị chỉ số cốt lõi: 3 MiniKpiCard (Lượt tàu qua cảng, Lượt hành khách, KCHT đang vận hành), 2 ApprovalCard (Phê duyệt tài sản, Phê duyệt KCHT), 1 HeroCard (Sản lượng chủ đạo). HeroCard hiển thị giá trị lớn + sparkline trend + delta % so với năm trước. Card "Hồ sơ chờ duyệt" dùng action variant (xanh dương actionPrimary), không dùng warning variant (vàng). Grid: auto-fit minmax(180px, 1fr), gap spaceMd. Toàn bộ màu từ tokens-dashboard.ts.

## Business Intent

Người dùng "liếc" là thấy ngay các chỉ số cốt lõi, không cần đọc biểu đồ. Phân cấp thông tin rõ ràng: chỉ số quan trọng nhất nằm trên cùng.

## Acceptance Criteria

1. Hiển thị 6 card với đúng nhãn và giá trị từ DashboardData API
2. HeroCard: số lớn, đơn vị, ▲/▼ delta % so với năm trước, sparkline 12 tháng
3. MiniKpiCard 1-3: mũi tên tăng (statusOperational) / giảm (statusCritical) + sparkline
4. ApprovalCard: stacked status bar (approved/pending/rejected) với token màu approvalApproved/Pending/Rejected
5. Card action variant (xanh actionPrimary) — BA decision xác nhận đây là đúng
6. Số format toLocaleString('vi-VN'), % làm tròn 1 chữ số
7. Responsive grid tự điều chỉnh cột
8. Loading: skeleton | Empty: "Không có dữ liệu" | Error: Retry

## Dependencies

- F-280 (FilterBar): dữ liệu KPI phụ thuộc vào filter
- tokens-dashboard.ts: toàn bộ màu sắc
- ECharts: sparkline rendering
