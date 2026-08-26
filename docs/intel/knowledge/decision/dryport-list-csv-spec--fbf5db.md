---
id: AM-fbf5dbd4443c39fc
kind: decision
topic: dryport-list-csv-spec
tags: []
importance: 0.8
agent: 
created: 2026-08-22T04:09:48.172Z
updated: 2026-08-22T04:09:48.172Z
---

Màn Quản lý Cảng cạn khớp đặc tả CSV (HH_Tính năng & danh sách các trường): list có STT/Mã/Tên/ĐVQL/ĐV khai thác/Khu vực/Hành lang/Trạng thái duyệt + cột Người cập nhật & Ngày cập nhật chỉ cho isAuditViewer (admin:manage||admin:operation). Filter thêm Khu vực (region), Tình trạng (portStatus 0/1/2 = NOT_YET_OPERATIONAL/OPERATIONAL/SUSPENDED), Trạng thái duyệt (đồng bộ tab), Ngày cập nhật (updatedFrom/To) — backend DryPortController/Service/Repository đã hỗ trợ. PORT_STATUS_OPTIONS đã đủ 3 option (trước chỉ có value 0).
