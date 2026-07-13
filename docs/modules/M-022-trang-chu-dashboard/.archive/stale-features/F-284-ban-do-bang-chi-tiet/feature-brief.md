---
id: F-284
name: Bản đồ & Bảng chi tiết
slug: ban-do-bang-chi-tiet
module-id: M-022
status: proposed
stage: intake
priority: medium
---
# Feature: Bản đồ & Bảng chi tiết (Phase 5)

## Description
Khối bản đồ (placeholder) và bảng chi tiết danh sách KCHTGT. Bảng hiển thị: STT, Loại KCHT, Tên, Địa điểm, Trạng thái, Ghi chú. Trạng thái được tô màu: Đang vận hành (xanh), Chưa khai thác (vàng), Dừng khai thác (đỏ). Bỏ phân trang "1-20 của 29", dùng scroll.

## Business Intent
Cung cấp cái nhìn chi tiết về vị trí địa lý và trạng thái từng hạng mục KCHTGT, hỗ trợ ra quyết định vận hành.

## Acceptance Criteria
1. Placeholder bản đồ hiển thị (có thể là static image hoặc div)
2. Bảng có scroll, không phân trang
3. Cột Trạng thái dùng badge màu (xanh/vàng/đỏ)
4. Dữ liệu mock có ít nhất 10 dòng
