---
module-id: M-1003
module-name: "Fix AntD static message/Modal.confirm context warning"
slug: fix-antd-static-message-context-warning
canonical-source: docs/intel/_snapshot.md
generated-at: "2026-08-17T03:19:49Z"
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

# Module Brief: Fix AntD static message/Modal.confirm context warning

## Purpose

Eliminate the AntD v6 dev-only console warning "Static function can not consume context like dynamic theme" app-wide by routing all static message and Modal.confirm calls through the existing ToastNotification context bridge, and fix a latent ReferenceError in RadarStationForm. Behavior-preserving frontend-only refactor.

## Scope

| Dimension | Value |
|---|---|
| Module ID | M-1003 |
| Slug | fix-antd-static-message-context-warning |
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
