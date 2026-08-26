---
id: AM-8cdb340dccac6d88
kind: fact
topic: cau-cang-pier-entity
tags: []
importance: 0.85
agent: 
created: 2026-08-21T07:40:33.749Z
updated: 2026-08-21T07:40:33.749Z
---

Cầu cảng = entity Pier (bảng piers, mã {berthCode}-CC, PierService.generatePierCode), Bến cảng = Berth. Tài liệu CSV 'QL Cầu cảng' phải đối chiếu với PierList.tsx + GET /api/v1/piers, KHÔNG phải BerthListPage. Luồng duyệt Pier chỉ 1 cấp (PierApprovalService.approve: PENDING→APPROVED) — không có cấp Cục nên cột department_approved_* luôn trống.
