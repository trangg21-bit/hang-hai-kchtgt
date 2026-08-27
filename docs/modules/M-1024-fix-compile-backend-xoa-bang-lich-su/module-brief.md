---
module-id: M-1024
module-name: "Sửa lỗi biên dịch backend do refactor xóa 3 bảng lịch sử"
slug: fix-compile-backend-xoa-bang-lich-su
canonical-source: docs/intel/_snapshot.md
generated-at: "2026-08-26T09:16:08Z"
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

# Module Brief: Sửa lỗi biên dịch backend do refactor xóa 3 bảng lịch sử

## Purpose

Xóa code chết tham chiếu 3 bảng đã drop (approval_logs/change_logs/station_history) để backend biên dịch sạch (mvn compile exit 0), không đổi luồng phê duyệt 2 cấp và lịch sử infrastructure_history.

## Scope

| Dimension | Value |
|---|---|
| Module ID | M-1024 |
| Slug | fix-compile-backend-xoa-bang-lich-su |
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
