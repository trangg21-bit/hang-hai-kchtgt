---
module-id: M-026
module-name: "Quản lý Bến phao"
slug: quan-ly-ben-phao
canonical-source: docs/intel/_snapshot.md
generated-at: "2026-08-28T06:24:38Z"
generator-version: "v1-mcp"
scope:
  modules: []
  features: []
  depends-on: ["M-002","M-003"]
metrics:
  features-in-scope: 6
  primary-service: ""
  total-entities-in-scope: 0
  total-rules-in-scope: 0
---

# Module Brief: Quản lý Bến phao

## Purpose

Quản lý Bến phao (buoy berth) thuộc cảng biển — hồ sơ KCHTGT với phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục), GIS POLYGON_BUOY_BERTH, file đính kèm, mã tự sinh {portCode}-BP-{seq}.

## Scope

| Dimension | Value |
|---|---|
| Module ID | M-026 |
| Slug | quan-ly-ben-phao |
| Primary service | `—` |
| Depends-on | M-002, M-003 |
| Modules in scope | — |

## Features in scope

| ID | Feature | Status |
|---|---|---|
| F-318 | Quản lý Bến phao - Tạo mới | planned |
| F-319 | Quản lý Bến phao - Cập nhật | planned |
| F-320 | Quản lý Bến phao - Xóa | planned |
| F-321 | Phê duyệt Bến phao | planned |
| F-322 | Xem danh sách & Chi tiết Bến phao | planned |
| F-323 | Quản lý Bến phao - Lịch sử | planned |

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
