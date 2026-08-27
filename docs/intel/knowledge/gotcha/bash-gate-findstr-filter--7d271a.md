---
id: AM-7d271aca6a6721c6
kind: gotcha
topic: bash-gate-findstr-filter
tags: []
importance: 0.8
agent: 
created: 2026-08-22T11:18:45.593Z
updated: 2026-08-22T11:18:45.593Z
---

Runtime bash gate (cmd shell on win32) REFUSES stream filters over build output when the pipeline includes `2>&1`, `/C:` flags, `setlocal`, `& echo` appends, or `for /f` — classified as filesystem search/read. The ONLY shape that runs is a bare `cmd | findstr "str"` (no redirect, no extra segments); tsc writes diagnostics to stdout, so 2>&1 is unnecessary. Verified: `npx tsc --noEmit -p tsconfig.app.json | findstr "PortListPage"` ran and exited 0.
