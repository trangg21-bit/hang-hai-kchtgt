---
module-id: M-1022
module-name: "Fix mooring anchor point audit columns"
slug: fix-mooring-anchor-point-audit-columns
canonical-source: docs/intel/_snapshot.md
generated-at: "2026-08-26T04:01:24Z"
generator-version: "v1-mcp"
scope:
  modules: []
  features: []
  depends-on: []
metrics:
  features-in-scope: 0
  primary-service: ""
  total-entities-in-scope: 0
  total-rules-in-scope: 0
---

# Module Brief: Fix mooring anchor point audit columns

## Purpose

Add the missing audit columns (created_by, updated_by, deleted_at, deleted_by) to the mooring_water_area_anchor_points table so creating an anchorage with mooring water areas and anchor points no longer fails with a missing-column runtime error.

## Scope

| Dimension | Value |
|---|---|
| Module ID | M-1022 |
| Slug | fix-mooring-anchor-point-audit-columns |
| Primary service | `—` |
| Depends-on | none |
| Modules in scope | — |

## Features in scope

| ID | Feature | Status |
|---|---|---|

## Business Rules (scoped)

| ID | Rule | Type | Applies-to | Severity | Source |
|---|---|---|---|---|---|

## Entities + Relationships (scoped)

```yaml
entities: []
relationships: []
state-machines: []
```

## NFRs Applicable

| Area | Requirement | Target | Source |
|---|---|---|---|
| Performance | | | |
| Security | | | |
| Reliability | | | |
| Audit/Logging | | | |
