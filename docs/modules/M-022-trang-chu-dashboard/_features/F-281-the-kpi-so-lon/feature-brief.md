---
id: F-281
name: Thẻ KPI số lớn
slug: the-kpi-so-lon
module-id: M-022
status: proposed
stage: intake
priority: high
---
# Feature: Thẻ KPI số lớn (Phase 2)

## Description
5 thẻ KPI trong grid `repeat(auto-fit, minmax(120px, 1fr))`: Lượt tàu qua cảng, Hàng hóa (nghìn tấn), Lượt hành khách, KCHT đang vận hành, Hồ sơ chờ duyệt. Mỗi thẻ gồm 3 dòng: nhãn (12px) → số lớn (24px/500) → dòng so sánh (12px). Thẻ "Hồ sơ chờ duyệt" có nền vàng, clickable.

## Business Intent
Người dùng "liếc" là thấy ngay chỉ số cốt lõi, không phải "đọc" biểu đồ. Các chỉ số có so sánh với kỳ trước để thấy xu hướng.

## Acceptance Criteria
1. 5 thẻ KPI hiển thị đúng format: nhãn → số → so sánh
2. Số có phân tách hàng nghìn (112.480), % làm tròn 1 chữ số
3. Tăng = xanh (#1BAF7A) + mũi tên lên; Giảm = đỏ (#E34948) + mũi tên xuống
4. Thẻ "Hồ sơ chờ duyệt" nền vàng, clickable → điều hướng danh sách chờ duyệt
5. Responsive: tự wrap theo bề rộng màn hình
