---
id: AM-4ba07ac275279af6
kind: decision
topic: dia-diem-column-label-standard
tags: []
importance: 0.85
agent: 
created: 2026-08-26T06:32:05.856Z
updated: 2026-08-26T06:32:05.856Z
---

USER QUYẾT ĐỊNH (2026-08-26, sau 2 lần nhắn): label chuẩn cho cột tỉnh trên mọi màn danh sách KCHT là 'Địa điểm (Tỉnh/Thành phố)' — chữ 'phố' VIẾT THƯỜNG (lần đầu user gõ 'Thành Phố' hoa P nhưng lần sau đính chính về 'Thành phố' — khớp convention codebase sẵn có). Cảng biển (PortListPage.tsx) có 2 cột bị cắt header do DataTable nowrap+fixed+ellipsis-default-false: 'Địa điểm (Tỉnh/Thành phố)' width 220→280 và 'Phân cấp cảng biển' width 180→220. TRI-1787725751075-1001 (C2) đang được PMO pipeline xử lý.
