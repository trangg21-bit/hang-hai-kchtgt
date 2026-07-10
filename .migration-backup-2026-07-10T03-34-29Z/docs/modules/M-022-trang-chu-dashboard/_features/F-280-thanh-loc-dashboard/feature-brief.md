---
id: F-280
name: Thanh bộ lọc Dashboard
slug: thanh-loc-dashboard
module-id: M-022
status: proposed
stage: intake
priority: high
---
# Feature: Thanh bộ lọc Dashboard (Phase 1)

## Description
Thanh lọc ngang nằm dưới header, full-width, gồm: dropdown Năm (mặc định 2026), dropdown Địa điểm (Tỉnh/TP, mặc định "Tất cả"), dropdown Loại KCHT (mặc định "Tất cả"), và nhãn "Cập nhật lúc {timestamp}". Đây là nguồn điều khiển DUY NHẤT cho toàn bộ dữ liệu trang Dashboard. State filter được lưu vào URL query params.

## Business Intent
Người dùng cần lọc dữ liệu tổng quan theo năm, địa điểm và loại hạ tầng để xem chỉ số phù hợp với phạm vi quản lý. Thanh lọc tập trung giúp tránh phải chọn lại bộ lọc ở từng khối.

## Acceptance Criteria
1. Thanh lọc hiển thị 3 dropdown + timestamp
2. Khi đổi filter, toàn bộ dữ liệu trang (KPI, biểu đồ, bảng) tự động cập nhật
3. State filter lưu vào URL query (?year=...&province=...&type=...)
4. Reload trang vẫn giữ nguyên bộ lọc đã chọn
5. Responsive: wrap xuống dòng trên màn hẹp
