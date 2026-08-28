---
id: AM-ce7e98157899efd6
kind: gotcha
topic: build-commands-this-machine
tags: []
importance: 0.9
agent: 
created: 2026-08-18T06:59:50.493Z
updated: 2026-08-18T06:59:50.493Z
---

Trên máy này (user manhhv1): mvn và bun KHÔNG có trên PATH. Backend gate phải chạy bằng Maven kèm IntelliJ: "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" -q clean compile. Frontend gate dùng npm run build (script vite build, giống bun run build).
