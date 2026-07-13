---
id: F-282
name: Biểu đồ xu hướng Dashboard
slug: bieu-do-xu-huong-dashboard
module-id: M-022
status: done
priority: high
created: 2026-07-09T00:00:00Z
last-updated: 2026-07-13T00:00:00Z
stage: closed
---
# Feature: Biểu đồ xu hướng Dashboard

## Description

Hai biểu đồ ECharts hiển thị xu hướng dữ liệu theo tháng. Layout 2 cột tỷ lệ ~1.4:1, mỗi biểu đồ trong 1 card riêng.

Biểu đồ 1 — Hàng hóa qua cảng (stacked bar): Trục X 12 tháng (01-12). 6 chuỗi chồng: Nội địa, Nhập khẩu, Xuất khẩu, Chuyển tải, Quá cảnh (bốc dỡ), Quá cảnh (K bốc dỡ). Màu từ cargoSeriesColors[0..5] tokens. Bar bo góc đầu trên (series cuối cùng). Tháng không có dữ liệu → hiển thị 0. Tháng đang trong tiến trình → giá trị lũy kế đến ngày hiện tại.

Biểu đồ 2 — Lượt hành khách (polar bar): Hệ tọa độ polar, 2 stacked bars: Đến cảng (gradient dataSea0→dataSea1) và Rời cảng (dataSea2). 12 tháng trên góc axis. Bo góc đầu trên.

Toàn bộ màu từ tokens-dashboard.ts. Legend dùng ECharts built-in.

## Acceptance Criteria

1. Stacked bar 6 chuỗi đúng màu từ cargoSeriesColors[0..5], bo góc, barWidth 58%
2. Polar bar 2 stacked bars đúng màu token, bo mượt
3. Tooltip hiển thị giá trị khi hover (custom HTML cho cargo, default cho passenger)
4. Legend ECharts built-in icon roundRect
5. Tháng chưa có dữ liệu → hiển thị 0 (không để trống). Tháng hiện tại → lũy kế đến ngày hiện tại
6. Loading: skeleton | Empty: "Không có dữ liệu" | Error: Retry

## Dependencies

- F-280 (FilterBar): dữ liệu lọc theo filter
- tokens-dashboard.ts: cargoSeriesColors, chartTooltip, chartGrid, chartTextStyle
- ECharts (echarts-for-react): thay thế Recharts từ Phase 1
