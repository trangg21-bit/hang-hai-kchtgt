---
id: F-283
name: Phê duyệt & Tình trạng khai thác
slug: phe-duyet-tinh-trang
module-id: M-022
status: proposed
stage: intake
priority: medium
---
# Feature: Phê duyệt & Tình trạng khai thác (Phase 4)

## Description
Hai khối: (1) Thanh progress cho "Kết cấu hạ tầng" và "Tài sản" với % phê duyệt, kèm dòng tóm tắt số chờ duyệt (vàng) và từ chối (đỏ). (2) Biểu đồ thanh ngang chồng (horizontal stacked bar) hiển thị tình trạng khai thác theo loại hạ tầng: Đang khai thác, Chưa khai thác, Dừng khai thác.

## Business Intent
Hiển thị trực quan tiến độ phê duyệt và trạng thái khai thác, giúp người quản lý nắm được điểm nghẽn và ưu tiên xử lý.

## Acceptance Criteria
1. Progress bar hiển thị % phê duyệt cho KCHT và Tài sản
2. Dòng tóm tắt: số chờ duyệt (vàng #EDA100) + số từ chối (đỏ #E34948)
3. Horizontal stacked bar: mỗi hàng = 1 loại KCHT, 3 phân đoạn màu
4. Màu sắc nhất quán với bảng ngữ nghĩa toàn trang
