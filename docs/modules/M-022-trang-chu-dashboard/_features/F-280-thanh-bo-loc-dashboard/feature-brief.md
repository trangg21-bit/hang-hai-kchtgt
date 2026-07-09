---
id: F-280
name: Thanh bộ lọc Dashboard
slug: thanh-bo-loc-dashboard
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
# Feature: Thanh bộ lọc Dashboard

## Description

Thanh bộ lọc ngang nằm ở đầu trang Dashboard, là nguồn điều khiển duy nhất cho toàn bộ dữ liệu trang. Gồm các dropdown: Năm (mặc định năm hiện tại 2026), Địa điểm (Tỉnh/TP), Loại kết cấu hạ tầng. Góc phải hiển thị timestamp cập nhật dữ liệu gần nhất. Khi thay đổi bất kỳ filter nào, tất cả khối bên dưới (KPI, biểu đồ) refetch/tính lại theo bộ tham số mới. State filter được lưu vào URL query params để chia sẻ và F5 giữ nguyên.

## Business Intent

Cung cấp một điểm điều khiển tập trung cho toàn bộ dashboard, loại bỏ các dropdown lọc rải rác ở từng khối như bản cũ. Người dùng có thể xem dữ liệu theo năm, địa điểm, loại hạ tầng mong muốn một cách nhất quán.

## Acceptance Criteria

1. Thanh lọc hiển thị ngay dưới header, full width, nền #F8F9FA, radius 12px
2. Dropdown Năm mặc định 2026, danh sách các năm có dữ liệu
3. Dropdown Tỉnh/TP cho phép "Tất cả"
4. Dropdown Loại KCHT cho phép "Tất cả"
5. Timestamp "Cập nhật lúc {time}" hiển thị góc phải
6. State filter sync với URL query params (?year=...&province=...&type=...)
7. Các khối KPI và biểu đồ phụ thuộc vào state filter này
8. Responsive: wrap trên màn nhỏ
9. Loading state: không ảnh hưởng (dropdown có sẵn dữ liệu tĩnh ban đầu)
10. Error state: nếu không load được danh sách filter, hiển thị thông báo lỗi + nút Retry

## Entities

- Không có entity riêng — sử dụng dữ liệu từ các module khác (danh sách tỉnh, loại KCHT)

## Dependencies

- M-002 (Cảng bến): danh sách loại KCHT
- M-008 (Báo cáo thống kê): dữ liệu năm
