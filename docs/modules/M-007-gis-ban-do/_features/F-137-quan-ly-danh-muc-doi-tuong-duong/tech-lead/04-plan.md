# Tech Lead Plan: F-137 — Quản lý danh mục đối tượng đường

## Context

Feature F-137 covers the management of GIS line objects (coastlines, shipping routes, waterways).
Code has been implemented following the standard pattern: Entity extends BaseEntity → Repository extends JpaRepository → Service with CRUD + approval workflow → REST Controller.
Additional entities: `LineCategory`, `LineAttachment`, `LineHistory`.

## Derived Entity Design

| Entity | Table | Purpose |
|---|---|---|
| `LineObject` | `line_objects` | Core line object (coastline, shipping route, waterway) |
| `LineCategory` | `line_categories` | Category master data for line classification |
| `LineAttachment` | `line_attachments` | Attached files/metadata for line objects |
| `LineHistory` | `line_histories` | Audit trail for line object modifications |

### LineObject Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | Inherited from BaseEntity |
| `name` | String(200) | NOT NULL | Ten doi tuong |
| `code` | String(50) | NOT NULL, UNIQUE | Ma doi tuong |
| `objectType` | Enum | NOT NULL | COASTLINE, SHIPPING_ROUTE, WATERWAY, OTHER |
| `categoryId` | Long | NULL | Category reference |
| `lineSymbolId` | Long | NULL | Map line symbol reference |
| `coordinates` | TEXT | NOT NULL | WKT (LINESTRING) or GeoJSON |
| `description` | String(1000) | NULL | Mo ta |
| `status` | Enum | NOT NULL, default DRAFT | Approval workflow state |
| `unitId` | Long | NULL | Thuoc don vi |
| `length` | Double | NULL | Chieu dai (km or m) |
| `material` | String(100) | NULL | Chat lieu (de/ke) |
| `yearBuilt` | Integer | NULL | Nam xay dung |
| `approvalStatus` | Enum | PENDING/APPROVED/REJECTED | Approval status |
| `approvedBy` | Long | NULL | Nguoi duyiet |
| `approvedDate` | LocalDateTime | NULL | Ngay duyiet |

### LineCategory Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | String(100) | Ten danh muc |
| `code` | String(50) | Ma danh muc, unique |
| `description` | String(500) | Mo ta |
| `sortOrder` | Integer | Thu tu hien thi |

---

## 1. Implementation Tasks

### Backend Tasks (Estimated: 1.5–2 days)

Code has already been written. Task breakdown reflects verification and integration work.

| # | Task | File Path | Complexity | Status |
|---|---|---|---|---|
| 1.1 | Entity: `LineObject.java` — validation, enum types, WKT coordinate format | `src/main/java/com/hanghai/kchtg/gis/line/entity/LineObject.java` | Medium | ✅ Written |
| 1.2 | Entity: `LineCategory.java` | `src/main/java/com/hanghai/kchtg/gis/line/entity/LineCategory.java` | Low | ✅ Written |
| 1.3 | Entity: `LineAttachment.java` | `src/main/java/com/hanghai/kchtg/gis/line/entity/LineAttachment.java` | Low | ✅ Written |
| 1.4 | Entity: `LineHistory.java` | `src/main/java/com/hanghai/kchtg/gis/line/entity/LineHistory.java` | Low | ✅ Written |
| 1.5 | Repository: `LineObjectRepository.java` — CRUD + search | `src/main/java/com/hanghai/kchtg/gis/line/repository/LineObjectRepository.java` | Medium | ✅ Written |
| 1.6 | DTOs: `CreateLineObjectRequest`, `UpdateLineObjectRequest`, `LineObjectResponse` | `src/main/java/com/hanghai/kchtg/gis/line/dto/` | Low | ✅ Written |
| 1.7 | Service: `LineObjectService.java` — CRUD + approval + WKT validation | `src/main/java/com/hanghai/kchtg/gis/line/service/LineObjectService.java` | Medium | ✅ Written |
| 1.8 | Controller: `LineObjectController.java` — 9 REST endpoints | `src/main/java/com/hanghai/kchtg/gis/line/controller/LineObjectController.java` | Medium | ✅ Written |

### Verification Tasks

| # | Task | Complexity |
|---|---|---|
| 1.9 | Verify WKT coordinate format validation (LINESTRING/GeoJSON) | Low |
| 1.10 | Verify approval workflow state transitions | Medium |
| 1.11 | Verify LineCategory relationship to LineObject | Low |
| 1.12 | Verify unique code constraint | Low |
| 1.13 | Verify soft delete pattern | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/line-objects` | `LineObjectController.findAll()` | auth |
| GET | `/api/line-objects/{id}` | `LineObjectController.findById()` | auth |
| GET | `/api/line-objects/type/{objectType}` | `LineObjectController.findByObjectType()` | auth |
| GET | `/api/line-objects/status/{status}` | `LineObjectController.findByStatus()` | auth |
| GET | `/api/line-objects/search` | `LineObjectController.search()` | auth |
| POST | `/api/line-objects` | `LineObjectController.create()` | auth |
| PUT | `/api/line-objects/{id}` | `LineObjectController.update()` | auth |
| DELETE | `/api/line-objects/{id}` | `LineObjectController.delete()` | auth |
| POST | `/api/line-objects/{id}/submit-approval` | `LineObjectController.submitForApproval()` | auth |

---

## 3. Component Structure

```
src/main/java/com/hanghai/kchtg/gis/line/
├── entity/
│   ├── LineObject.java             ← Core entity (LINESTRING coordinates)
│   ├── LineCategory.java           ← Category master data
│   ├── LineAttachment.java         ← Attachment metadata
│   └── LineHistory.java            ← Audit history
├── repository/
│   └── LineObjectRepository.java   ← JpaRepository + search queries
├── dto/
│   ├── CreateLineObjectRequest.java
│   ├── UpdateLineObjectRequest.java
│   └── LineObjectResponse.java
├── service/
│   └── LineObjectService.java      ← CRUD + approval + WKT validation
└── controller/
    └── LineObjectController.java   ← 9 REST endpoints
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-137_init_line_objects.sql

```sql
CREATE TABLE line_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    object_type VARCHAR(30) NOT NULL CHECK (object_type IN ('COASTLINE', 'SHIPPING_ROUTE', 'WATERWAY', 'OTHER')),
    category_id BIGINT NULL,
    line_symbol_id BIGINT NULL,
    coordinates TEXT NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2', 'PUBLISHED', 'REJECTED', 'DELETED')),
    unit_id BIGINT NULL,
    length DOUBLE PRECISION NULL,
    material VARCHAR(100) NULL,
    year_built INT NULL,
    approval_status VARCHAR(20) DEFAULT 'PENDING',
    approved_by BIGINT NULL,
    approved_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_line_objects_object_type ON line_objects(object_type);
CREATE INDEX idx_line_objects_status ON line_objects(status);
CREATE INDEX idx_line_objects_unit_id ON line_objects(unit_id);
CREATE INDEX idx_line_objects_name ON line_objects(name);

CREATE TABLE line_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name NVARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

---

## 5. Business Rules Implementation

| Rule | Implementation |
|---|---|
| BR-GIS-010: WKT coordinate format | `validateCoordinates()` — accepts LINESTRING/POLYGON/GeoJSON |
| BR-GIS-011: Unique code | `existsByCode()` + Service validation |
| BR-GIS-012: Approval workflow | `submitForApproval()` — DRAFT→PENDING_APPROVAL |
| BR-GIS-013: Soft delete | `delete()` — status=DELETED + softDelete() |
| BR-GIS-014: Category reference | `categoryId` FK to line_categories |

---

## 6. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + DTOs | Low | Standard JPA + Lombok |
| Repository (CRUD + search) | Medium | Standard JPQL queries |
| Service (CRUD + approval + WKT) | Medium | WKT format validation |
| Controller | Low | Standard REST |
| **Overall** | **Medium** | Coordinate format validation |

---

## 7. Wave Plan

**Single wave** — code is complete. Wave focuses on verification and QA handoff.

| Wave | Tasks | Deliverable |
|---|---|---|
| Wave 1 | Verify entities, DTOs, Service, Controller + DB migration + integration test | Feature ready for QA |

---

## 8. Dependencies

| Feature | Dependency | Type |
|---|---|---|
| F-137 → M-001 | `BaseEntity`, `ApiResponse<T>` | Hard |
| F-140 | Depends on F-137 for line search results | Soft |
| F-139 | Depends on F-137 for layer type="LINE" | Soft |

---

## 9. QA Strategy

| Test Type | Scope |
|---|---|
| Unit: Service | CRUD, approval workflow, WKT coordinate validation |
| Unit: Repository | JPQL search, unique code check |
| Integration: Controller | All 9 endpoints, WKT format validation |
| Integration: DB | Flyway migration, check constraints, unique constraint |
| E2E: Full flow | Create → Submit Approval → Published |
| Edge: WKT validation | Invalid format rejected (not LINESTRING/GeoJSON) |

---

## 10. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| WKT format validation incomplete | Medium | Medium | Validate against GeoJSON spec, not just prefix |
| No pagination on list endpoints | Medium | Medium | Add Pageable to Repository + Controller |
| Missing LineAttachment/LineHistory service layer | Medium | High | These entities exist but no CRUD service — TODO |
| Missing Spring Security | Medium | Medium | Add `@PreAuthorize` annotations |

---

## 11. Open Items / TODOs

1. **LineAttachment/LineHistory service** — Entities exist but no service/controller for them
2. **Add pagination** to `findAll()` and `search()`
3. **Spring Security** — Add method-level security for approval
4. **WKT/GeoJSON parser** — Consider using JTS library for proper geometry validation
