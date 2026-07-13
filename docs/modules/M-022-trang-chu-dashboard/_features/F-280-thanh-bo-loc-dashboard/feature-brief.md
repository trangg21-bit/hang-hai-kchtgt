---
id: F-280
name: Thanh bộ lọc Dashboard
slug: thanh-bo-loc-dashboard
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
# Feature: Thanh bộ lọc Dashboard

## Description

Thanh bộ lọc ngang nằm ở đầu trang Dashboard, gồm 3 dropdown (Năm, Tỉnh/TP, Loại KCHT) và timestamp "Cập nhật lúc HH:mm". State filter đồng bộ với URL query params qua FilterContext + useSearchParams. Province và InfraType là cosmetic-only trong v1 (deferred sang v2 pending backend G-007/G-008). Toàn bộ màu sắc dùng token từ tokens-dashboard.ts.

## Business Intent

Cung cấp một điểm điều khiển tập trung cho toàn bộ dashboard, loại bỏ các dropdown lọc rải rác ở từng khối như bản cũ. Người dùng có thể xem dữ liệu theo năm, địa điểm, loại hạ tầng mong muốn một cách nhất quán.

## Acceptance Criteria

1. Thanh lọc hiển thị ngay dưới header, full width, nền surfacePage, radiusSm, border borderDefault
2. Dropdown Năm mặc định 2026, danh sách các năm [2020..2026]
3. Dropdown Tỉnh/TP cho phép "Tất cả" (sets province=null), 6 tỉnh maritime
4. Dropdown Loại KCHT cho phép "Tất cả" (sets infraType=null), 7 loại
5. Timestamp "Cập nhật lúc {time}" hiển thị góc phải
6. State filter sync với URL query params (?year=&province=&type=)
7. Province và InfraType là cosmetic-only trong v1 — không trigger refetch dữ liệu
8. Responsive: flexWrap trên màn nhỏ
9. Zero hardcoded hex — toàn bộ token từ tokens-dashboard.ts

## Entities

- Không có entity riêng — sử dụng dữ liệu từ các module khác (danh sách tỉnh, loại KCHT)

## Dependencies

- tokens-dashboard.ts: design token system
- react-router-dom: URL query param sync
