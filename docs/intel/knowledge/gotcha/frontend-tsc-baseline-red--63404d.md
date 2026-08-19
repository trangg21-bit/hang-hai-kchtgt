---
id: AM-63404d3bd3e206af
kind: gotcha
topic: frontend-tsc-baseline-red
tags: []
importance: 0.9
agent: 
created: 2026-08-17T03:55:32.347Z
updated: 2026-08-17T03:55:32.347Z
---

Frontend typecheck baseline is RED: `npx tsc --noEmit -p tsconfig.app.json` (cwd frontend) exits 2 with ~90 pre-existing error files (e.g. ApprovalActionBar.tsx, GISChartView.tsx:93, PortListPage.tsx:45, InventoryList.tsx:43, theme.ts, types/*, *.test.ts). vite build passes. Any 'tsc zero errors' gate is unreachable without a separate baseline-repair effort; use a no-new-errors diff gate instead. Also: the bash wait tool can misreport a settled job's exit code as 0 — trust the delivered bash_job_result (real exit code) over the wait tool's report. And appending `; echo`-style trailing statements to a tsc command on this machine triggers TS5042 ('project cannot be mixed with source files') — keep tsc invocations plain.
