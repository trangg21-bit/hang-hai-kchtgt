---
id: AM-d21d3b1d5844ef02
kind: fact
topic: port-detail-csv-gaps
tags: []
importance: 0.7
agent: 
created: 2026-08-20T10:12:43.001Z
updated: 2026-08-20T10:12:43.001Z
---

Spec CSV QL cảng biển có 5 nhóm trường read-only (34-49): Kết cấu hạ tầng cầu cảng, Quy hoạch, Vận hành khai thác, Bảo trì, Sự cố — CHƯA có nguồn backend: PortPlanning/OperationPlan/MaintenancePlan/Incident (package document, F-129/130/131/132) không có cột portId và field khác tên CSV (vd PortPlanning có projectName/approvalAuthority thay vì số QĐ). Các tab hiển thị '—' tới khi có liên kết dữ liệu.
