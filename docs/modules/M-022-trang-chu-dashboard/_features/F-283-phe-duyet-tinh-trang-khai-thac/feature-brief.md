---
id: F-283
name: Phê duyệt & Tình trạng khai thác
slug: phe-duyet-tinh-trang-khai-thac
module-id: M-022
status: proposed
priority: medium
created: 2026-07-09T00:00:00Z
stage: proposed
---
# Feature: Phê duyệt & Tình trạng khai thác

## Description

Hai khối thông tin bổ trợ. **Tỷ lệ phê duyệt:** thanh progress gọn cho "KCHT" và "Tài sản", mỗi cái 1 thanh + % bên phải, dòng tóm tắt bên dưới (số chờ duyệt vàng, số từ chối đỏ). **Tình trạng khai thác:** biểu đồ thanh ngang chồng (đang/chưa/dừng khai thác), mỗi hàng là 1 loại KCHT.

## Acceptance Criteria

1. 2 thanh Progress Ant Design: KCHT (92%) xanh, Tài sản (78%) vàng
2. Dòng tóm tắt: "23 chờ duyệt" (vàng) + "5 từ chối" (đỏ)
3. Bar ngang chồng 3 màu: #1BAF7A (đang), #EDA100 (chưa), #E34948 (dừng)
4. 5 hàng loại KCHT: Cảng biển, Khu neo đậu, Luồng HH, Bến cảng, Khu chuyển tải
5. Loading/Empty/Error states

## Dependencies

- F-280 (FilterBar)
