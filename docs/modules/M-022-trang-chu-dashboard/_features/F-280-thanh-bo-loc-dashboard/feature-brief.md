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

Thanh bộ lọc full-width đặt ở đầu trang Dashboard: 3 dropdown Ant Design (Năm 2020–2026 mặc định 2026, Tỉnh/TP 6 maritime provinces + "Tất cả", Loại KCHT 7 types + "Tất cả") + timestamp "Cập nhật lúc HH:mm" bên phải. State đồng bộ hai chiều với URL query params qua FilterContext + useSearchParams (replace:true). Khi Năm thay đổi → trigger `dashboardApi.fetchWithFallback()` gọi 9 API endpoints song song qua `Promise.allSettled`, mỗi block fallback về MOCK_DATA độc lập nếu API lỗi. Province và InfraType là cosmetic-only trong v1 (deferred sang v2 pending G-007/G-008). Toàn bộ màu sắc/spacing/font từ `tokens-dashboard.ts` — cấm hardcode hex.

## Business Intent

Người dùng thao tác một điểm điều khiển duy nhất để lọc dữ liệu toàn trang Dashboard thay vì lọc rải rác từng khối. URL có thể chia sẻ: người khác mở đúng link là thấy cùng bộ lọc. Timestamp cho biết dữ liệu được cập nhật khi nào.

## Acceptance Criteria

1. FilterBar hiển thị 3 dropdown + timestamp, nền surfacePage, border-radius radiusSm, border borderDefault, full width, flexWrap responsive
2. Dropdown Năm mặc định 2026, chọn giá trị khác → URL cập nhật `?year=`, timestamp làm mới, dữ liệu dashboard fetch lại từ backend (hoặc fallback MOCK_DATA)
3. Dropdown Tỉnh/TP mặc định "Tất cả", chọn tỉnh → URL cập nhật `?province=`, không trigger refetch (cosmetic-only)
4. Dropdown Loại KCHT mặc định "Tất cả", chọn loại → URL cập nhật `?type=`, không trigger refetch (cosmetic-only)
5. Timestamp hiển thị thời điểm thay đổi filter cuối cùng, định dạng HH:mm 24h, nằm ở góc phải (marginLeft: auto)
6. URL sync hai chiều: truy cập `/?year=2025&province=Đà+Nẵng` → FilterBar khởi tạo đúng giá trị
7. Responsive: flexWrap wrap cho phép dropdown xuống dòng trên màn hình hẹp
8. API lỗi từng block → fallback MOCK_DATA độc lập cho block đó, tag "Dữ liệu mẫu" hiển thị
9. Toàn bộ style dùng token từ tokens-dashboard.ts — zero hardcoded hex/spacing/font

## Business Rules

1. Dropdown Năm mặc định 2026, danh sách cố định [2020..2026] — không thêm/xóa năm động
2. Dropdown Tỉnh/TP và Loại KCHT có tùy chọn "Tất cả" → giá trị state là `null`
3. Khi Năm thay đổi → trigger `dashboardApi.fetchWithFallback()` fetch lại toàn bộ dữ liệu dashboard
4. Province và InfraType là cosmetic-only trong v1 — thay đổi chỉ cập nhật UI, không trigger refetch (deferred sang v2 pending G-007/G-008)
5. URL sync dùng `setSearchParams(params, { replace: true })` — không tạo history entry mới, nút Back không quay lại filter cũ
6. Param `year` chỉ được set trên URL khi `year !== 2026` (mặc định bị bỏ qua để URL sạch)
7. Param `province` chỉ set khi `province !== null`, param `type` chỉ set khi `infraType !== null`
8. Timestamp `lastUpdated` cập nhật mỗi khi người dùng thay đổi bất kỳ dropdown nào
9. Toàn bộ màu sắc, spacing, font-size phải import từ `tokens-dashboard.ts` — cấm hardcode giá trị hex

## Dependencies

- tokens-dashboard.ts + tokens.ts: design token system
- react-router-dom (useSearchParams): URL sync
- antd (Select): dropdown components
- @ant-design/icons (FilterOutlined, ClockCircleOutlined): icon bộ lọc và timestamp
- dashboardApi.ts (fetchWithFallback): data fetch layer
- dashboardTypes.ts + dashboardMockData.ts: type definitions và fallback data
