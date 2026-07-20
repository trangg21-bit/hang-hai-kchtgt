---
id: F-282
name: Biểu đồ xu hướng Dashboard
slug: bieu-do-xu-huong-dashboard
module-id: M-022
status: proposed
priority: high
created: 2026-07-09T00:00:00Z
stage: proposed
---
# Feature: Biểu đồ xu hướng Dashboard

## Description

Hai biểu đồ hiển thị xu hướng dữ liệu theo tháng. Layout 2 cột tỷ lệ ~1.4:1, mỗi biểu đồ trong 1 card riêng, chiều cao vùng vẽ ~210px. Mỗi card có: tiêu đề (14px/500), legend HTML tùy chỉnh, canvas.

**Biểu đồ 1 — Hàng hóa qua cảng (stacked bar):** Trục X 12 tháng (01-12). 4 chuỗi chồng: Nội địa #2A78D6, Xuất khẩu #1BAF7A, Nhập khẩu #EDA100, Chuyển tải #E87BA4. Cột bo góc nhẹ đầu trên, khe 2px giữa các phân đoạn. Nếu dữ liệu chỉ có tới tháng hiện tại, chỉ vẽ tới đó.

**Biểu đồ 2 — Lượt hành khách (line):** Trục X 12 tháng. 2 đường: Đến cảng #1BAF7A (nét liền 2px), Rời cảng #E34948 (nét đứt 2px strokeDasharray). Đường bo mượt, crosshair + tooltip.

## Acceptance Criteria

1. Stacked bar 4 chuỗi đúng màu, bo góc, khe 2px
2. Line chart 2 đường: liền + đứt, bo mượt
3. Legend HTML tùy chỉnh (không dùng Recharts Legend)
4. Tooltip hiển thị giá trị khi hover
5. Xử lý empty: nếu tháng chưa có dữ liệu → không vẽ nửa biểu đồ trắng
6. Loading: skeleton | Empty: "Không có dữ liệu" | Error: Retry

## Dependencies

- F-280 (FilterBar): dữ liệu lọc theo filter
