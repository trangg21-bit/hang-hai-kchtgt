---
id: AM-fa0d35611afc740c
kind: gotcha
topic: ledger-init-duplicate-module-id-blocks-claim
tags: []
importance: 0.8
agent: 
created: 2026-08-20T04:57:32.908Z
updated: 2026-08-20T04:57:32.908Z
---

Claim-ledger bootstrap (`ai-kit-claim init`) refuses with SDLC_E_DUPLICATE_MODULE_ID when parallel-scaffold collisions exist on disk: M-1003, M-1004, M-1005 each have TWO folders authoring the same feature-id. This blocks sdlc_claim for ANY module scaffolded after the last ledger snapshot (e.g. M-1017 → 'not in ledger'). Fix is `ai-kit sdlc state update --op delete_module ... --cascade orphan` (CLI/human-only, destructive-scope) to drop the stray folder, then re-run init.
