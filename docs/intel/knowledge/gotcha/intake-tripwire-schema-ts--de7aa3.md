---
id: AM-de7aa3d162ff3445
kind: gotcha
topic: intake-tripwire-schema-ts
tags: []
importance: 0.7
agent: 
created: 2026-08-19T06:18:53.987Z
updated: 2026-08-19T06:18:53.987Z
---

Intake triage đánh frontend/src/services/buoy/schema.ts là one-way-door path (schema/package-boundary) → mọi write vào file này bị tripwire chặn ngay cả với thay đổi nhỏ (floor C3 = dispatch pmo-software-project-manager). Muốn thêm hằng/token cho module: định nghĩa local trong page file (như BerthList TAB_QUERY_MAP) hoặc re-triage với footprint đúng. File 'schema.ts' ở các module khác có thể cũng bị đánh dấu tương tự.
