# Tech Lead Plan: F-139 — Quản lý thông tin KCHT trên bản đồ

> **Feature:** F-139 — Quản lý thông tin KCHT trên bản đồ
> **Module:** M-007 GIS / Bản đồ
> **Stage:** engineering-technical-lead
> **Date:** 2026-06-19

## 1. Feature Summary

Quản lý các lớp bản đồ GIS (MapLayer, MapOverlay, MapStyle, MapView):
- **MapLayer:** Định nghĩa lớp điểm/đường/vùng/basemap với nguồn URL, style config
- **MapOverlay:** WMS/WFS overlay với URL, layerName, format, opacity, zIndex
- **MapStyle:** Style cho từng lớp — fillColor, strokeColor, strokeWidth, pointRadius, opacity, zoom range
- **MapView:** Lưu giữ trạng thái viewport — zoom, center, các layer visible

**Codebase:** 13 files
- `layer/entity/`: MapLayer, MapOverlay, MapStyle, MapView (4 entities)
- `layer/repository/`: MapLayerRepository, MapOverlayRepository, MapStyleRepository, MapViewRepository (4 repos)
- `layer/dto/`: 8 DTOs — Create/Update/Response for each entity type
- `layer/service/`: MapLayerService (1 service)
- `layer/controller/`: MapLayerController (1 controller)

## 2. Wave Plan — F-139 Specific Tasks

### Wave 1 (Foundation) — Entity + Repository Verification

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 1.1 | F139-W1-01 | Verify MapLayer entity — 10 fields: id, name, code, layerType (ENUM), source, visible, opacity, order, styleConfig, status (ENUM ACTIVE/INACTIVE) | 1 | — | Dev C |
| 1.2 | F139-W1-02 | Verify MapOverlay entity — 7 fields: id, name, url, layerName, format, visible, opacity, zIndex | 0.5 | — | Dev C |
| 1.3 | F139-W1-03 | Verify MapStyle entity — 10 fields: id, layerId (FK), fillColor, strokeColor, strokeWidth, pointRadius, iconSize, opacity, minZoom, maxZoom | 0.5 | — | Dev C |
| 1.4 | F139-W1-04 | Verify MapView entity — viewport state: id, userId, centerLon, centerLat, zoom, visibleLayerIds | 0.5 | — | Dev C |
| 1.5 | F139-W1-05 | Review MapLayerRepository — CRUD + findByCode + findByType + findByStatus | 2 | F139-W1-01 | Senior Dev |
| 1.6 | F139-W1-06 | Review MapOverlayRepository — CRUD + findByLayerId (relation to MapLayer) | 1 | F139-W1-02 | Dev C |
| 1.7 | F139-W1-07 | Review MapStyleRepository — CRUD + findByLayerId (FK relation) | 1 | F139-W1-03 | Dev C |
| 1.8 | F139-W1-08 | Review MapViewRepository — CRUD + findByUserId + findByUserIdAndLayerId | 1 | F139-W1-04 | Dev C |
| 1.9 | F139-W1-09 | Verify Flyway V4 migration — map_layers, map_overlays, map_styles, map_views tables, FK relations | 1.5 | F139-W1-05 | Dev C |

**Wave 1 F-139 Total: ~9 hours**

---

### Wave 2 (Core) — Service + DTOs + Controller Review

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 2.1 | F139-W2-01 | Review 4 Create DTOs — CreateMapLayerRequest, CreateMapOverlayRequest, CreateMapStyleRequest, CreateMapViewRequest | 1.5 | F139-W1-01 | Dev C |
| 2.2 | F139-W2-02 | Review 4 Update DTOs — UpdateMapLayerRequest, UpdateMapOverlayRequest, UpdateMapStyleRequest, UpdateMapViewRequest | 1 | F139-W1-01 | Dev C |
| 2.3 | F139-W2-03 | Review 4 Response DTOs — MapLayerResponse, MapOverlayResponse, MapStyleResponse, MapViewResponse | 1 | F139-W1-01 | Dev C |
| 2.4 | F139-W2-04 | Review MapLayerService — CRUD for all 4 entity types + relation management (layer↔overlay, layer↔style, view↔layers) | 4 | F139-W1-05 | Dev C |
| 2.5 | F139-W2-05 | Verify MapLayerService — layerType validation (POINT/LINE/POLYGON/BASEMAP/OVERLAY), styleConfig JSON validation | 1.5 | F139-W2-04 | Dev C |
| 2.6 | F139-W2-06 | Verify MapLayerService — MapView layer aggregation (findAll visible layers with overlays + styles) | 1.5 | F139-W2-04 | Dev C |
| 2.7 | F139-W2-07 | Review MapLayerController — CRUD endpoints for all 4 entities + mapView aggregation endpoint | 2.5 | F139-W2-04 | Dev C |
| 2.8 | F139-W2-08 | Verify unique code constraint on MapLayer — Service throws on duplicate | 0.5 | F139-W2-04 | Dev C |

**Wave 2 F-139 Total: ~13.5 hours**

---

### Wave 3 (Advanced) — Integration with Other Features

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 3.1 | F139-W3-01 | Integrate with F-136 — MapLayer.layerType=POINT → link to PointObjectRepository | 1 | F139-W2-07 | Dev C |
| 3.2 | F139-W3-02 | Integrate with F-137 — MapLayer.layerType=LINE → link to LineObjectRepository | 1 | F139-W2-07 | Dev C |
| 3.3 | F139-W3-03 | Integrate with F-138 — MapLayer.layerType=POLYGON → link to PolygonObjectRepository | 1 | F139-W2-07 | Dev C |
| 3.4 | F139-W3-04 | MapView aggregation — verify aggregation query includes all layer types + overlays + styles | 1.5 | F139-W2-04 | Dev C |

**Wave 3 F-139 Total: ~4.5 hours**

---

### Wave 4 (QA) — Unit Tests for F-139

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 4.1 | F139-W4-01 | Unit test MapLayerService — CRUD for MapLayer (4 tests: create, update, delete, findById) | 2 | F139-W2-07 | QA B |
| 4.2 | F139-W4-02 | Unit test MapLayerService — CRUD for MapOverlay (4 tests) | 1.5 | F139-W4-01 | QA B |
| 4.3 | F139-W4-03 | Unit test MapLayerService — CRUD for MapStyle (4 tests) | 1.5 | F139-W4-01 | QA B |
| 4.4 | F139-W4-04 | Unit test MapLayerService — CRUD for MapView (4 tests) | 1.5 | F139-W4-01 | QA B |
| 4.5 | F139-W4-05 | Unit test MapLayerService — layer type validation, styleConfig validation | 2 | F139-W4-01 | QA B |
| 4.6 | F139-W4-06 | Unit test MapLayerService — MapView aggregation endpoint | 2 | F139-W4-01 | QA B |
| 4.7 | F139-W4-07 | Unit test MapLayerController — all CRUD endpoints + aggregation, ApiResponse wrapper | 3.5 | F139-W4-01 | QA B |
| 4.8 | F139-W4-08 | Integration test — Flyway migration, FK relations, layer↔overlay↔style relations | 2.5 | F139-W4-01 | QA A |
| 4.9 | F139-W4-09 | Edge-case tests — duplicate layer code rejection, invalid layerType, invalid styleConfig JSON | 2 | F139-W4-01 | QA B |

**Wave 4 F-139 Total: ~19.5 hours**

---

### Wave 5 (Integration) — E2E + Security for F-139

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 5.1 | F139-W5-01 | E2E: Create Layer (POINT type) → Add Overlay → Add Style → Create MapView → View full map | 3 | F139-W4-09 | QA A |
| 5.2 | F139-W5-02 | E2E: Create Layer (POLYGON type) → Link to PolygonObject → Display on MapView | 2.5 | F139-W5-01 | QA A |
| 5.3 | F139-W5-03 | E2E: Multiple layers with different types → Toggle visibility → Save MapView → Replay | 3 | F139-W5-01 | QA B |
| 5.4 | F139-W5-04 | Security: @PreAuthorize on create/update/delete — ADMIN only; GET — auth | 1.5 | F139-W5-01 | Senior Dev |

**Wave 5 F-139 Total: ~10 hours**

---

## 3. Total Estimated Effort for F-139

| Wave | Description | Hours |
|------|-------------|-------|
| Wave 1 | Entity + Repository Verification | 9 |
| Wave 2 | Service + DTOs + Controller Review | 13.5 |
| Wave 3 | Integration with Other Features | 4.5 |
| Wave 4 | Unit Tests | 19.5 |
| Wave 5 | E2E + Security | 10 |
| **Total** | **F-139** | **56.5 hours** |

## 4. API Routes

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/map-layers` | `MapLayerController.findAll()` | auth |
| GET | `/api/map-layers/{id}` | `MapLayerController.findById()` | auth |
| GET | `/api/map-layers/type/{layerType}` | `MapLayerController.findByType()` | auth |
| POST | `/api/map-layers` | `MapLayerController.createLayer()` | admin |
| PUT | `/api/map-layers/{id}` | `MapLayerController.updateLayer()` | admin |
| DELETE | `/api/map-layers/{id}` | `MapLayerController.deleteLayer()` | admin |
| GET | `/api/map-layers/overlays` | `MapLayerController.findAllOverlays()` | auth |
| POST | `/api/map-layers/overlays` | `MapLayerController.createOverlay()` | admin |
| PUT | `/api/map-layers/overlays/{id}` | `MapLayerController.updateOverlay()` | admin |
| DELETE | `/api/map-layers/overlays/{id}` | `MapLayerController.deleteOverlay()` | admin |
| GET | `/api/map-layers/styles` | `MapLayerController.findAllStyles()` | auth |
| POST | `/api/map-layers/styles` | `MapLayerController.createStyle()` | admin |
| PUT | `/api/map-layers/styles/{id}` | `MapLayerController.updateStyle()` | admin |
| DELETE | `/api/map-layers/styles/{id}` | `MapLayerController.deleteStyle()` | admin |
| GET | `/api/map-views` | `MapLayerController.findAllViews()` | auth |
| GET | `/api/map-views/user/{userId}` | `MapLayerController.findByUserId()` | auth |
| POST | `/api/map-views` | `MapLayerController.createMapView()` | admin |
| PUT | `/api/map-views/{id}` | `MapLayerController.updateMapView()` | admin |
| DELETE | `/api/map-views/{id}` | `MapLayerController.deleteMapView()` | admin |
| GET | `/api/map-layers/aggregation` | `MapLayerController.aggregateMapView()` | auth |

## 5. Dependencies

| Feature | Dependency | Type |
|---------|------------|------|
| F-139 → M-001 | `BaseEntity` (common module) | Hard |
| F-139 → M-001 | `ApiResponse<T>` (common module) | Hard |
| F-139 → F-136 | MapLayer.layerType=POINT → uses PointObjectRepository | Soft |
| F-139 → F-137 | MapLayer.layerType=LINE → uses LineObjectRepository | Soft |
| F-139 → F-138 | MapLayer.layerType=POLYGON → uses PolygonObjectRepository | Soft |

## 6. Business Rules

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-GIS-031 | Unique layer code | `MapLayerRepository.existsByCode()` + Service throws `IllegalArgumentException` |
| BR-GIS-032 | Layer type validation | MapLayerService validates layerType enum values |
| BR-GIS-033 | StyleConfig JSON validation | Service validates JSON structure before saving |
| BR-GIS-034 | Layer↔Overlay FK relation | MapOverlay references MapLayer via layerId |
| BR-GIS-035 | Layer↔Style FK relation | MapStyle references MapLayer via layerId |
| BR-GIS-036 | MapView aggregation | Service aggregates all visible layers with overlays + styles for given userId |

## 7. Open Items / TODOs

1. **Add pagination** to `findAll()` — currently returns all records
2. **Spring Security** — Add method-level security: ADMIN on create/update/delete, auth on GET (Wave 5)
3. **Layer type filtering** — Add endpoint to list point/line/polygon layers separately for frontend
4. **MapView persistence** — Consider user-specific vs global views distinction
5. **MapStyle validation** — Add range validation for minZoom/maxZoom (0-22), opacity (0-1)
