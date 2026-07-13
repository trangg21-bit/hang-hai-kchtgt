---
id: F-282
name: Biểu đồ xu hướng
slug: bieu-do-xu-huong
module-id: M-022
status: proposed
stage: intake
priority: high
---
# Feature: Biểu đồ xu hướng (Phase 3)

## Description
2 biểu đồ cạnh nhau (tỷ lệ ~1.4:1): (1) Stacked Bar chart — Hàng hóa qua cảng theo tháng với 4 chuỗi: Nội địa (#2A78D6), Xuất khẩu (#1BAF7A), Nhập khẩu (#EDA100), Chuyển tải (#E87BA4). (2) Line chart — Lượt hành khách qua cảng: Đến cảng (#1BAF7A, nét liền), Rời cảng (#E34948, nét đứt). Mỗi biểu đồ có legend HTML tùy chỉnh, tooltip, và xử lý trạng thái loading/empty/error.

## Business Intent
Hiển thị xu hướng dữ liệu theo thời gian để người dùng nắm bắt được bức tranh tổng quan về lưu lượng hàng hóa và hành khách.

## Acceptance Criteria
1. Stacked bar có 4 chuỗi màu đúng ngữ nghĩa, cột bo góc, khe 2px giữa các segment
2. Line chart có 2 đường: nét liền (Đến) + nét đứt (Rời), crosshair + tooltip
3. Nếu tháng chưa có dữ liệu → chỉ vẽ tới tháng có dữ liệu
4. Loading → skeleton, Empty → "Không có dữ liệu", Error → nút thử lại
