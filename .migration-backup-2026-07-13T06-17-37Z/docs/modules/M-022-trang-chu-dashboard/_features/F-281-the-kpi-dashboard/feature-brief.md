---
id: F-281
name: Thẻ KPI Dashboard
slug: the-kpi-dashboard
module-id: M-022
status: proposed
classification: local
priority: high
created: 2026-07-09T00:00:00Z
last-updated: 2026-07-09T00:00:00Z
locked-fields: []
consumed_by_modules: []
stage: proposed
---
# Feature: Thẻ KPI Dashboard

## Description

Hàng 5 thẻ KPI hiển thị các chỉ số cốt lõi: Lượt tàu qua cảng, Hàng hóa (nghìn tấn), Lượt hành khách, KCHT đang vận hành, Hồ sơ chờ duyệt. Mỗi thẻ gồm 3 dòng: nhãn (12px), số lớn (24px/500), dòng so sánh/ghi chú (12px). Màu sắc theo ngữ nghĩa: tăng = xanh lá #1BAF7A, giảm = đỏ #E34948. Thẻ "Hồ sơ chờ duyệt" có nền vàng nhạt, clickable dẫn tới danh sách chờ duyệt.

Grid: `repeat(auto-fit, minmax(180px, 1fr))`, gap 12px. Số có phân cách hàng nghìn. % làm tròn 1 chữ số.

## Business Intent

Người dùng "liếc" là thấy ngay các chỉ số cốt lõi, không cần đọc biểu đồ. Phân cấp thông tin rõ ràng: chỉ số quan trọng nhất nằm trên cùng.

## Acceptance Criteria

1. Hiển thị 5 thẻ KPI với đúng nhãn và giá trị mock
2. Thẻ 1-3 có mũi tên tăng/giảm + % so năm trước
3. Thẻ 4 hiển thị "trên tổng {N}"
4. Thẻ 5 nền vàng, icon cảnh báo, clickable → navigate
5. Màu tăng = #1BAF7A, giảm = #E34948
6. Số format phân cách hàng nghìn (1.000.000 → 1.000.000)
7. Responsive grid tự điều chỉnh cột
8. Loading: skeleton
9. Empty: "Không có dữ liệu" 
10. Error: thông báo + Retry

## Dependencies

- F-280 (Thanh bộ lọc): dữ liệu KPI phụ thuộc vào filter
