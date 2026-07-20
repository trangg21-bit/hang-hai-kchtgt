---
id: F-284
name: Bản đồ & Bảng chi tiết Dashboard
slug: ban-do-bang-chi-tiet-dashboard
module-id: M-022
status: proposed
priority: medium
created: 2026-07-09T00:00:00Z
stage: proposed
---
# Feature: Bản đồ & Bảng chi tiết Dashboard

## Description

Map placeholder (khu vực bản đồ KCHTGT) + bảng chi tiết dữ liệu. Bảng bỏ phân trang "1-20 trong 29", dùng scroll. Giữ cách tô màu ô đỏ/vàng/xanh của bản cũ cho cột trạng thái.

## Acceptance Criteria

1. Khu vực bản đồ placeholder (300px cao, nền xám, text + icon)
2. Bảng Ant Design với scroll Y 300px, không phân trang
3. Cột trạng thái có badge màu: xanh (đang vận hành), vàng (chưa khai thác), đỏ (dừng)
4. Mock data 10 dòng mẫu
5. Loading/Empty/Error states

## Dependencies

- F-280 (FilterBar)
