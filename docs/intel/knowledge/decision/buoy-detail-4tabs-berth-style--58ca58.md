---
id: AM-58ca58138d54b405
kind: decision
topic: buoy-detail-4tabs-berth-style
tags: []
importance: 0.8
agent: 
created: 2026-08-19T08:08:54.414Z
updated: 2026-08-19T08:08:54.414Z
---

BuoyDetailContent (chi tiết phao tiêu) ĐÃ viết lại theo đúng cấu trúc BerthDetailContent (2026-08-19, user chốt '4 tab + Thông tin hệ thống collapse trong Thông tin chung'): 4 tabs general/technical/gis/files (BỎ tab approval+audit — gom vào collapse); tab general = detail-grid 2 cột đầy đủ trường form (Đơn vị quản lý, Thuộc nhà trạm QLVH, Mã, Tên, Phân loại(+phao/tiêu), Tỉnh/TP (map VIETNAM_PROVINCE_OPTIONS mã TCTK), Địa điểm chi tiết, Tình trạng, Trạng thái badge) + toggle '▼ Thông tin hệ thống' (người tạo/cập nhật/gửi duyệt/duyệt L1/L2, cấp duyệt, lý do từ chối) giống BerthDetailContent; tab technical = đầy đủ trường kỹ thuật form (hình dạng→chu kỳ, thời điểm, kiểm tra, mô tả). Gis tab + files tab giữ nguyên.
