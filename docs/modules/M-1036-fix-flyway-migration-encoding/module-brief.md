---
module-id: M-1036
module-name: "Sửa lỗi encoding 2 file migration Flyway chặn khởi động backend"
slug: fix-flyway-migration-encoding
canonical-source: docs/intel/_snapshot.md
generated-at: "2026-09-04T02:48:50Z"
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

# Module Brief: Sửa lỗi encoding 2 file migration Flyway chặn khởi động backend

## Purpose

Khắc phục Flyway không khởi động được do 2 file migration bị lưu sai encoding (comment tiếng Việt chứa byte không hợp lệ, không phải UTF-8) gây MalformedInputException khi tính checksum. Xóa toàn bộ comment tiếng Việt khỏi 2 file, chỉ giữ nguyên phần SQL.

## Scope

| Dimension | Value |
|---|---|
| Module ID | M-1036 |
| Slug | fix-flyway-migration-encoding |
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
