---
id: AM-ca5fe57943df62d0
kind: fact
topic: port-form-implementations
tags: []
importance: 0.8
agent: 
created: 2026-08-18T06:15:05.414Z
updated: 2026-08-18T06:15:05.414Z
---

Port (Cảng biển) có 3 bộ form: bộ đang hoạt động là Tabs inline trong PortListPage.tsx (Drawer create/edit); PortFormContent.tsx (4 tabs) được import ở PortListPage dòng 81 nhưng KHÔNG bao giờ render; PortCreatePage.tsx (1244 dòng) và PortUpdatePage.tsx (915 dòng) không được route/import ở đâu — cả 3 đều là dead code. Sửa form Cảng biển phải sửa trong PortListPage.
