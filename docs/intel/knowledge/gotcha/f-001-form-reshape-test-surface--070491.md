---
id: AM-070491268325d4cf
kind: gotcha
topic: F-001-form-reshape-test-surface
tags: []
importance: 0.7
agent: 
created: 2026-08-14T06:05:24.923Z
updated: 2026-08-14T06:05:24.923Z
---

F-001 form-reshape review (2026-08-14): frontend test surface is unrunnable — frontend/package.json has NO test script and vitest is NOT installed (no node_modules/vitest); frontend/src/services/userService.test.ts is stale (calls getAllUsers/createUser/lockAccount which current userService does not export) — pre-existing, unmodified by the change. mapUser (userService.ts:18) still contains read-side fallback String(item.status || 'ACTIVE') — not a create-path hardcode; QA grep for 'ACTIVE' must scope to create(). WO-01 design task 5 (UserServiceTest extension for create-status) was NOT implemented due to dev write boundary; only controller @Valid guards null status (UserController.java:134).
