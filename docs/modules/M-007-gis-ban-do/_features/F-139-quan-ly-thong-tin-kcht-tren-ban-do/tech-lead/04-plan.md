# Tech Lead Plan: F-139 — Quản lý thông tin KCHT trên bản đồ

## Context

Feature F-139 covers map layer management: MapLayer (layer definition with type, visibility, opacity, order, style), MapStyle, MapView (preset views), MapOverlay.
Code implements layer CRUD with type-based filtering and visibility ordering.
This feature is the integration layer that ties together point, line, and polygon objects into visual map representations.

## Derived Entity Design

| Entity | Table | Purpose |
|---|---|---|
| `MapLayer` | `map_layers` | Layer definition (type, visibility, opacity, order, style config) |

### MapLayer Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | Inherited from BaseEntity |
| `name` | String(100) | NOT NULL | Ten layer |
| `code` | String(50) | NOT NULL, UNIQUE | Ma layer |
| `layerType` | Enum | NOT NULL | POINT, LINE, POLYGON, BASEMAP, OVERLAY |
| `source` | String(200) | NULL | Data source reference |
| `visible` | Boolean | NOT NULL, default false | Co hien thi |
| `opacity` | Double | NOT NULL, default 1.0 | Do trong suot |
| `order` | Integer | NOT NULL, default 0 | Thu tu layer |
| `styleConfig` | TEXT | NULL | JSON style configuration |
| `status` | Enum | NOT NULL, default ACTIVE | ACTIVE/INACTIVE |

---

## 1. Implementation Tasks

### Backend Tasks (Estimated: 1–1.5 days)

Code has already been written. Task breakdown reflects verification and integration work.

| # | Task | File Path | Complexity | Status |
|---|---|---|---|---|
| 1.1 | Entity: `MapLayer.java` — validation, enum types, styleConfig JSON | `src/main/java/com/hanghai/kchtg/gis/layer/entity/MapLayer.java` | Medium | ✅ Written |
| 1.2 | Repository: `MapLayerRepository.java` — CRUD + type filter + visible ordering | `src/main/java/com/hanghai/kchtg/gis/layer/repository/MapLayerRepository.java` | Medium | ✅ Written |
| 1.3 | DTOs: `CreateMapLayerRequest`, `UpdateMapLayerRequest`, `MapLayerResponse` | `src/main/java/com/hanghai/kchtg/gis/layer/dto/` | Low | ✅ Written |
| 1.4 | Service: `MapLayerService.java` — CRUD + type filter + visible layers ordering | `src/main/java/com/hanghai/kchtg/gis/layer/service/MapLayerService.java` | Medium | ✅ Written |
| 1.5 | Controller: `MapLayerController.java` — 7 REST endpoints | `src/main/java/com/hanghai/kchtg/gis/layer/controller/MapLayerController.java` | Medium | ✅ Written |

### Verification Tasks

| # | Task | Complexity |
|---|---|---|
| 1.6 | Verify layer type enum values match F-136/137/138 object types | Low |
| 1.7 | Verify visible layers ordered by `order` field | Low |
| 1.8 | Verify styleConfig is valid JSON | Medium |
| 1.9 | Verify unique code constraint | Low |
| 1.10 | Verify soft delete pattern | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/map-layers` | `MapLayerController.findAll()` | auth |
| GET | `/api/map-layers/{id}` | `MapLayerController.findById()` | auth |
| GET | `/api/map-layers/type/{layerType}` | `MapLayerController.findByLayerType()` | auth |
| GET | `/api/map-layers/visible` | `MapLayerController.findVisibleLayers()` | auth |
| POST | `/api/map-layers` | `MapLayerController.create()` | auth |
| PUT | `/api/map-layers/{id}` | `MapLayerController.update()` | auth |
| DELETE | `/api/map-layers/{id}` | `MapLayerController.delete()` | auth |

---

## 3. Component Structure

```
src/main/java/com/hanghai/kchtg/gis/layer/
├── entity/
│   └── MapLayer.java               ← Layer definition (POINT/LINE/POLYGON/BASEMAP/OVERLAY)
├── repository/
│   └── MapLayerRepository.java     ← JpaRepository + findByType + findByVisible
├── dto/
│   ├── CreateMapLayerRequest.java
│   ├── UpdateMapLayerRequest.java
│   └── MapLayerResponse.java
├── service/
│   └── MapLayerService.java        ← CRUD + layer type filter + visible ordering
└── controller/
    └── MapLayerController.java     ← 7 REST endpoints
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-139_init_map_layers.sql

```sql
CREATE TABLE map_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name NVARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    layer_type VARCHAR(20) NOT NULL CHECK (layer_type IN ('POINT', 'LINE', 'POLYGON', 'BASEMAP', 'OVERLAY')),
    source VARCHAR(200) NULL,
    visible BOOLEAN NOT NULL DEFAULT FALSE,
    opacity DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "order" INT NOT NULL DEFAULT 0,
    style_config TEXT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_map_layers_layer_type ON map_layers(layer_type);
CREATE INDEX idx_map_layers_status ON map_layers(status);
CREATE INDEX idx_map_layers_visible_order ON map_layers(visible, "order") WHERE visible = true;
```

---

## 5. Business Rules Implementation

| Rule | Implementation |
|---|---|
| BR-GIS-030: Layer type enum | POINT/LINE/POLYGON map to F-136/137/138 object types |
| BR-GIS-031: Visible layers ordered | `findByVisibleTrueOrderByOrderAsc()` in Repository |
| BR-GIS-032: Style config JSON | `styleConfig` TEXT field, client-side JSON parsing |
| BR-GIS-033: Unique code | `existsByCode()` + Service validation |
| BR-GIS-034: Layer status | ACTIVE/INACTIVE — no approval workflow (config data, not content) |

---

## 6. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + DTOs | Low | Standard JPA + Lombok |
| Repository (CRUD + type filter) | Medium | Visible layers ordered query |
| Service (CRUD) | Low | No approval workflow needed |
| Controller | Low | Standard REST |
| **Overall** | **Low-Medium** | Simpler than object management features |

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
| F-139 → M-001 | `BaseEntity`, `ApiResponse<T>` | Hard |
| F-139 → F-136 | Layer type POINT references PointObject data | Soft |
| F-139 → F-137 | Layer type LINE references LineObject data | Soft |
| F-139 → F-138 | Layer type POLYGON references PolygonObject data | Soft |
| F-140 → F-139 | Search results need layer info for rendering | Soft |

---

## 9. QA Strategy

| Test Type | Scope |
|---|---|
| Unit: Service | CRUD operations, layer type filter, visible layers ordering |
| Unit: Repository | `findByLayerType()`, `findByVisibleTrueOrderByOrderAsc()` |
| Integration: Controller | All 7 endpoints, request validation |
| Integration: DB | Flyway migration, check constraints, unique constraint |
| E2E: Layer management | Create layers → Set visibility → Order → Get visible layers |
| Edge: Style config | JSON validation in styleConfig field |

---

## 10. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| No style rendering backend (only config) | Low | High | StyleConfig is JSON — frontend handles rendering |
| Missing MapView/MapOverlay entities | Medium | High | Module brief mentions these but only MapLayer implemented |
| Missing pagination | Medium | Medium | Add Pageable support |
| Missing Spring Security | Medium | Medium | Add `@PreAuthorize` annotations |

---

## 11. Open Items / TODOs

1. **MapView entity** — Module brief mentions preset views but not implemented
2. **MapOverlay entity** — Module brief mentions overlays but not implemented
3. **MapStyle entity** — Module brief mentions styles but not implemented
4. **Add pagination** to `findAll()` and `findByLayerType()`
5. **Spring Security** — Add method-level security
