---
id: AM-351716eedd9d0ebb
kind: gotcha
topic: frontend-build-tooling
tags: []
importance: 0.8
agent: 
created: 2026-08-21T09:28:12.735Z
updated: 2026-08-21T09:28:12.735Z
---

Frontend dùng npm (npm run build/lint trong frontend/) — máy KHÔNG có bun dù workspace_health khuyến nghị bun. api.ts export DEFAULT api (import api from '../services/api'), không phải named export.
