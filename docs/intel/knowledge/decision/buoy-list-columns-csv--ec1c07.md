---
id: AM-ec1c07500f04c745
kind: decision
topic: buoy-list-columns-csv
tags: []
importance: 0.8
agent: 
created: 2026-08-19T06:47:09.239Z
updated: 2026-08-19T06:47:09.239Z
---

Bảng Danh sách Quản lý phao tiêu ĐÃ sửa theo CSV đặc tả 56 trường (2026-08-19, user chốt tự làm không dùng PMO dù triage C3 vì migration one-way door): bảng giờ có STT + 15 cột đặc tả (Đơn vị quản lý, Thuộc nhà trạm QLVH, Mã, Tên, Địa điểm Tỉnh/TP, Tình trạng, Trạng thái, Ngày/Cán bộ cập nhật, Ngày/Cán bộ gửi phê duyệt, Ngày/Cán bộ duyệt Cảng vụ-Chi cục, Ngày/Cán bộ duyệt Cục); bỏ 11 cột kỹ thuật (Loại phao, Vĩ/Kinh độ, Màu, Hình dạng, Đặc tính AS, Phạm vi, Mô tả, KT gần nhất/kế tiếp, Hoạt động) — chúng vẫn còn ở Xem chi tiết. Backend Buoy + BuoyResponse + toResponse thêm submittedForApprovalBy/At (UUID/TIMESTAMP), set khi create action submit/approved + submitForApproval (SecurityUtils.getCurrentUserId()); migration V20260819090000__add_buoy_submitted_approval_columns.sql. BuoyDetailContent tab Phê duyệt thêm Người/Ngày gửi phê duyệt.
