---
id: AM-698e2cb9f80cb89a
kind: gotcha
topic: frontend-build-command
tags: []
importance: 0.8
agent: 
created: 2026-08-20T07:06:53.878Z
updated: 2026-08-20T07:06:53.878Z
---

bun/bunx KHÔNG có trên máy (frontend build/lint phải dùng npm/npx: npm run build, npx eslint). workspace_health gợi ý lệnh bun sẽ fail ngay với 'bun is not recognized'.
