---
id: AM-5d7871a141e73934
kind: gotcha
topic: intake-tripwire-permissions-ts
tags: []
importance: 0.7
agent: 
created: 2026-08-21T09:28:13.210Z
updated: 2026-08-21T09:28:13.210Z
---

Tripwire chặn ghi vào frontend/src/constants/permissions.ts vì là one-way-door (auth/security surface) → floor C3 full pipeline dù sửa 1 dòng. Sau khi re-run intake_triage (record TRI-*.json tồn tại), edit được phép. PortListPage.tsx và AppLayout.tsx không phải one-way-door — edit inline OK.
