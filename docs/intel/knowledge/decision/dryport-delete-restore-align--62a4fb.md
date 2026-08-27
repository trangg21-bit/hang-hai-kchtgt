---
id: AM-62a4fbee85f54324
kind: decision
topic: dryport-delete-restore-align
tags: []
importance: 0.75
agent: 
created: 2026-08-17T04:23:22.357Z
updated: 2026-08-17T04:23:22.357Z
---

Cảng cạn (DryPortList.tsx) đã căn chỉnh theo cảng biển (2026-08-17): (1) nút Xóa hiện ở MỌI trạng thái (trước chỉ DRAFT/REJECTED), xác nhận bằng tên cảng HOẶC 'XÓA' không phân biệt hoa thường (so sánh toLowerCase, giống PortListPage); (2) backend thêm POST /api/v1/dry-ports/{id}/restore (DryPortService.restore giống PortService.restore: native query findDeletedDryPortById + restoreDryPortById, giới hạn 90 ngày, permission dryport:delete). CHƯA có UI restore cho cảng cạn — cảng biển cũng chưa có UI restore (chỉ backend).
