---
id: AM-6dde1d9e5097ac7a
kind: gotcha
topic: c2-triage-dev-footprint-and-acceptance-map
tags: []
importance: 0.8
agent: 
created: 2026-08-26T07:22:57.977Z
updated: 2026-08-26T07:22:57.977Z
---

Triage record dev_footprint='mixed' can misclassify a frontend-only change (all edit_target_files/impact_files are .tsx, packages=['frontend']) and mint a no-op engineering-backend-developer-wave-1. refit_lane keys on the dev_footprint FIELD (not the evidence block) and refuses to shed the backend wave — so the no-op wave must be dispatched as a documented no-op confirmation (Pass) rather than shed. Also: a C2 reduced pipeline release refuses without qa/acceptance-map.json (QA seat authors it, one entry per criterion with file+test_name); the frontend dev seat can drift out of scope (changing form section headers/labels/detail beyond the column) — PMO must grep the full diff vs pre-dispatch reads and reject scope-exceeding edits.
