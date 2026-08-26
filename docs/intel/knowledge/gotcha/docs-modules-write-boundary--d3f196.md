---
id: AM-d3f196f84320d0d1
kind: gotcha
topic: docs-modules-write-boundary
tags: []
importance: 0.8
agent: 
created: 2026-08-21T07:40:34.336Z
updated: 2026-08-21T07:40:34.336Z
---

Session không được dispatch cho SDLC module sẽ BỊ CHẶN ghi docs/modules/** (stage artifacts chỉ pipeline agent viết được) — muốn đồng bộ feature-brief/ui-spec phải dispatch pipeline (BA seat) hoặc nhờ user cho phép.
