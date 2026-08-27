---
id: AM-33d8afab628bbde7
kind: gotcha
topic: docs-modules-write-gate
tags: []
importance: 0.8
agent: 
created: 2026-08-21T06:41:37.137Z
updated: 2026-08-21T06:41:37.137Z
---

Session orchestrator (session chính, không phải dispatched specialist) BỊ REFUSE ghi bất kỳ file nào dưới docs/modules/** — runtime gate: 'stage artifacts are written by dispatched specialists — dispatch via task. This session was never dispatched for an SDLC module'. Muốn đồng bộ feature-brief/module docs (Auto-Sync) phải dispatch specialist có claim module; lặp lại 4 lần liên tiếp sẽ mở circuit-breaker.
