---
id: AM-25b8aaa8659a9c76
kind: gotcha
topic: pmo-dispatch-verify-and-source-paths-gates
tags: []
importance: 0.85
agent: 
created: 2026-08-14T05:03:55.825Z
updated: 2026-08-14T05:03:55.825Z
---

PMO dispatch: task verify field only accepts package.json scripts (npm/pnpm run X); mvn commands are rejected as 'not runnable' (no root package.json/mvnw). For backend work put `mvn clean compile` in the prompt and set verify='npm run build' as placeholder. Also dev_wave_anchor_floor gate needs the feature's source-paths to declare a test file that IMPORTS a source file (same-package Java test fails 'test-no-production-import'; a test with a hardcoded mock password trips secret_scan), and C2 refit drops the design stage but leaves the stale design plan whose anchors brief_contract_resolution still scans (fix via solution-designer).
