---
id: AM-e9ca4181ee10845a
kind: gotcha
topic: port-detail-reload-list
tags: []
importance: 0.7
agent: 
created: 2026-08-22T04:01:36.054Z
updated: 2026-08-22T04:24:58.588Z
---

PortListPage (Cảng biển) các action mở popup từng bọc fetch trong setIsLoading(true/false) → FilterTableLayout loading + nhánh render '!isLoading && ...' unmount/remount toàn bộ bảng → danh sách bị 'load lại' dù chưa thay đổi dữ liệu. Đã sửa 2026-08-22 cả 2: (1) Chi tiết: callback openDetail() mở drawer NGAY với dòng hiện tại, fetch fresh + files ở nền; (2) Chỉnh sửa: mở update modal NGAY (setSelectedRecord(record) + setUpdateModalVisible(true)), fetch fetchCangBienById + infra/files/gps ở nền rồi setFieldsValue, lỗi thì toast + đóng modal. Cả 2 KHÔNG đụng setIsLoading — đúng pattern BerthListPage (setEditBerthId/ openDetailDrawer). Màn khác bị 'load lại khi mở popup' nghi ngờ pattern setLoading quanh fetchById.
