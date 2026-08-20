---
id: AM-bd107c359e999036
kind: decision
topic: frontend-tsc-gate-no-new-errors
tags: []
importance: 0.9
agent: 
created: 2026-08-17T05:03:04.326Z
updated: 2026-08-17T05:03:04.326Z
---

Frontend tsc baseline is RED (~90 pre-existing files; tsconfig.app.json noUnusedLocals:true). For behavior-preserving refactors, the acceptance gate MUST be NO-NEW-ERRORS (npm run build exit 0 + zero NEW tsc errors in the changed files vs baseline), NOT whole-project tsc exit 0. In M-1003, the 'tsc exit 0' gate made 3+ dev seats self-block with Blocked verdicts on the pre-existing baseline, forcing a parent gate amendment. Whole-project tsc green is a separate ~90-file baseline-cleanup effort. Set the no-new-errors gate in every frontend dev/QA brief on this workspace.
