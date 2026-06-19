# Tech Lead Plan: F-137 — Quản lý danh mục đối tượng đường

> **Feature:** F-137 — Quản lý danh mục đối tượng đường
> **Module:** M-007 GIS / Bản đồ
> **Stage:** engineering-technical-lead
> **Date:** 2026-06-19

## 1. Feature Summary

Quản lý đối tượng đường GIS (luồng, đê/kè, coastline, shipping route) với chuỗi tọa độ WKT, phân loại danh mục, attachments, và workflow phê duyệt đa cấp.

**Codebase:** 10 files
- `line/entity/`: LineObject, LineCategory, LineAttachment, LineHistory (4 entities)
- `line/repository/`: LineObjectRepository, LineCategoryRepository, LineHistoryRepository (3 repos)
- `line/dto/`: CreateLineObjectRequest, UpdateLineObjectRequest, LineObjectResponse (3 DTOs)
- `line/service/`: LineObjectService (1 service)
- `line/controller/`: LineObjectController (1 controller)

## 2. Wave Plan — F-137 Specific Tasks

### Wave 1 (Foundation) — Entity + Repository Verification

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 1.1 | F137-W1-01 | Verify LineObject entity — 15 fields: id, name, code, objectType, categoryId, lineSymbolId, coordinates, description, status, unitId, length, material, yearBuilt, approvalStatus, approvedBy/approvedDate | 1 | — | Dev B |
| 1.2 | F137-W1-02 | Verify LineCategory entity — 4 fields: name, code, description, sortOrder | 0.5 | — | Dev B |
| 1.3 | F137-W1-03 | Verify LineAttachment entity — file attachment linked to LineObject | 0.5 | — | Dev B |
| 1.4 | F137-W1-04 | Verify LineHistory entity — audit trail for LineObject changes | 0.5 | — | Dev B |
| 1.5 | F137-W1-05 | Review LineObjectRepository — CRUD + findByObjectType + findByStatus + search + length calculation | 2 | F137-W1-01 | Senior Dev |
| 1.6 | F137-W1-06 | Review LineCategoryRepository — CRUD + findByCode + existsByCode | 1 | F137-W1-02 | Dev B |
| 1.7 | F137-W1-07 | Verify Flyway V2 migration — line_objects, line_categories tables, spatial index on coordinates | 1.5 | F137-W1-05 | Dev C |
| 1.8 | F137-W1-08 | Verify BaseEntity inheritance — soft delete (@SQLRestriction), createdAt, updatedAt | 1 | F137-W1-01 | Senior Dev |

**Wave 1 F-137 Total: ~8 hours**

---

### Wave 2 (Core) — Service + DTOs + Controller Review

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 2.1 | F137-W2-01 | Review CreateLineObjectRequest — @NotBlank name/code, @NotNull objectType, coordinates TEXT | 1 | F137-W1-01 | Dev B |
| 2.2 | F137-W2-02 | Review UpdateLineObjectRequest — optional fields, partial update support | 0.5 | F137-W1-01 | Dev B |
| 2.3 | F137-W2-03 | Review LineObjectResponse — serialization, exclude internal fields | 0.5 | F137-W1-01 | Dev B |
| 2.4 | F137-W2-04 | Review LineObjectService — CRUD + approval workflow + coordinate string validation | 3 | F137-W1-05 | Dev B |
| 2.5 | F137-W2-05 | Verify coordinate string validation in Service — WKT format, non-empty linestring | 1 | F137-W2-04 | Dev B |
| 2.6 | F137-W2-06 | Verify approval workflow in Service — DRAFT→PENDING_APPROVAL transition | 1.5 | F137-W2-04 | Dev B |
| 2.7 | F137-W2-07 | Review LineObjectController — 9 REST endpoints, ApiResponse<T> wrapper | 2 | F137-W2-04 | Dev B |
| 2.8 | F137-W2-08 | Verify unique code constraint — Service throws IllegalArgumentException on duplicate | 0.5 | F137-W2-04 | Dev B |

**Wave 2 F-137 Total: ~10.5 hours**

---

### Wave 3 (Advanced) — Integration with Other Features

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 3.1 | F137-W3-01 | Verify Line search integration — F-140 SearchService uses LineObjectRepository | 1 | F137-W2-07 | Dev C |
| 3.2 | F137-W3-02 | Verify Layer line type — F-139 MapLayer uses LineObject for layerType=LINE | 0.5 | F137-W2-07 | Dev C |
| 3.3 | F137-W3-03 | Add approveL1()/approveL2() methods — current gap in approval workflow | 2 | F137-W2-04 | Senior Dev |

**Wave 3 F-137 Total: ~3.5 hours**

---

### Wave 4 (QA) — Unit Tests for F-137

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 4.1 | F137-W4-01 | Unit test LineObjectService — create/update/delete/findById (4 tests) | 2 | F137-W2-07 | QA B |
| 4.2 | F137-W4-02 | Unit test LineObjectService — findByObjectType, findByStatus, search (3 tests) | 2 | F137-W4-01 | QA B |
| 4.3 | F137-W4-03 | Unit test LineObjectService — submitForApproval, coordinate string validation (3 tests) | 2 | F137-W4-01 | QA B |
| 4.4 | F137-W4-04 | Unit test LineObjectController — all 9 REST endpoints with ApiResponse wrapper | 3 | F137-W4-01 | QA B |
| 4.5 | F137-W4-05 | Integration test — Flyway migration, unique constraint, check constraints | 2 | F137-W4-01 | QA A |
| 4.6 | F137-W4-06 | Edge-case tests — duplicate code rejection, invalid coordinate string, null name | 1.5 | F137-W4-01 | QA B |

**Wave 4 F-137 Total: ~12.5 hours**

---

### Wave 5 (Integration) — E2E + Security for F-137

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 5.1 | F137-W5-01 | E2E: Full approval flow — Create Line → Submit → Approve L1 → Approve L2 → Publish | 2.5 | F137-W4-06 | QA A |
| 5.2 | F137-W5-02 | Security: @PreAuthorize on approve endpoints — ADMIN only | 1.5 | F137-W5-01 | Senior Dev |

**Wave 5 F-137 Total: ~4 hours**

---

## 3. Total Estimated Effort for F-137

| Wave | Description | Hours |
|------|-------------|-------|
| Wave 1 | Entity + Repository Verification | 8 |
| Wave 2 | Service + DTOs + Controller Review | 10.5 |
| Wave 3 | Integration with Other Features | 3.5 |
| Wave 4 | Unit Tests | 12.5 |
| Wave 5 | E2E + Security | 4 |
| **Total** | **F-137** | **38.5 hours** |

## 4. API Routes

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/line-objects` | `LineObjectController.findAll()` | auth |
| GET | `/api/line-objects/{id}` | `LineObjectController.findById()` | auth |
| GET | `/api/line-objects/type/{objectType}` | `LineObjectController.findByObjectType()` | auth |
| GET | `/api/line-objects/status/{status}` | `LineObjectController.findByStatus()` | auth |
| GET | `/api/line-objects/search` | `LineObjectController.search()` | auth |
| POST | `/api/line-objects` | `LineObjectController.create()` | auth |
| PUT | `/api/line-objects/{id}` | `LineObjectController.update()` | auth |
| DELETE | `/api/line-objects/{id}` | `LineObjectController.delete()` | auth |
| POST | `/api/line-objects/{id}/submit-approval` | `LineObjectController.submitForApproval()` | auth |

## 5. Dependencies

| Feature | Dependency | Type |
|---------|------------|------|
| F-137 → M-001 | `BaseEntity` (common module) | Hard |
| F-137 → M-001 | `ApiResponse<T>` (common module) | Hard |
| F-140 | Depends on F-137 for line search results | Soft |
| F-139 | Depends on F-137 for layer type=LINE | Soft |

## 6. Business Rules

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-GIS-011 | Unique code | `LineObjectRepository.existsByCode()` + Service throws `IllegalArgumentException` |
| BR-GIS-012 | Coordinate string validation | `validateCoordinates()` — WKT LineString format, non-empty |
| BR-GIS-013 | Approval workflow | `submitForApproval()` — DRAFT→PENDING_APPROVAL, approvalStatus=PENDING |
| BR-GIS-014 | Soft delete | `delete()` — status=DELETED + `entity.softDelete()` (BaseEntity) |
| BR-GIS-015 | CRUD validation | `@Valid` on DTO fields, `@NotBlank`, `@Size` constraints |

## 7. Open Items / TODOs

1. **Approve L1/L2 endpoints** — Service has APPROVED_L1/APPROVED_L2 status but no methods to transition there (Wave 3)
2. **Add pagination** to `findAll()` and `search()` — currently returns all records
3. **Spring Security** — Add method-level security for approval actions (Wave 5)
4. **Length calculation** — Verify automatic length calculation from coordinates string
