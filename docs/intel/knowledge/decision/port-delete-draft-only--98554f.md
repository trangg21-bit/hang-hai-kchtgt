---
id: AM-98554fc43a6825d7
kind: decision
topic: port-delete-draft-only
tags: []
importance: 0.8
agent: 
created: 2026-08-17T08:49:43.168Z
updated: 2026-08-17T08:49:43.168Z
---

Quy tắc xóa (M-1008, 2026-08-17): cảng biển/bến cảng/cầu cảng/cảng cạn CHỈ được xóa (soft delete) khi approvalStatus=DRAFT (legacy NHAP). Enforce backend: guard trong softDelete của PortService/BerthService/PierService/DryPortService (throw IllegalArgumentException 'Chỉ được xóa ... ở trạng thái Nháp'); frontend: nút Xóa chỉ hiện DRAFT/NHAP ở PortListPage, BerthList, DryPortList (PierList đã đúng từ trước).
