# Tech Lead Plan: M-007 — GIS / Bản đồ

## Module Overview

Module M-007 GIS / Bản đồ contains 5 features covering spatial data management (Point, Line, Polygon), map layer configurations, and GIS advanced search/querying for the Hàng Hải project.

**Tech Stack:**
- Backend: Spring Boot 3.x + Spring Data JPA + Hibernate Spatial + JTS (Java Topology Suite)
- Frontend: React 18 + Vite + TypeScript + Ant Design + OpenLayers
- Database: PostgreSQL 15+ with PostGIS extension
- Build: Maven, npm

---

## Feature Summary

| # | Feature | Slug | Complexity | Est. Effort |
|---|---|---|---|---|
| F-136 | Quản lý danh mục đối tượng điểm | quan-ly-danh-muc-doi-tuong-diem | Medium | 4 sprints (8 days) |
| F-137 | Quản lý danh mục đối tượng đường | quan-ly-danh-muc-doi-tuong-duong | Medium | 4 sprints (8 days) |
| F-138 | Quản lý danh mục đối tượng vùng | quan-ly-danh-muc-doi-tuong-vung | High | 5 sprints (10 days) |
| F-139 | Quản lý thông tin KCHT trên bản đồ | quan-ly-thong-tin-kcht-tren-ban-do | High | 6 sprints (12 days) |
| F-140 | Tra cứu KCHT trên bản đồ | tra-cuu-kcht-tren-ban-do | High | 5 sprints (10 days) |

**Total estimated effort: ~40-48 man-days**

---

## Implementation Order (Recommended)

### Wave 1: Core Spatial Objects (F-136, F-137, F-138)
1. **F-136** Point Object Management — Point coordinates, categories, attachments.
2. **F-137** Line Object Management — WKT LineStrings, routes, attachments.
3. **F-138** Polygon Object Management — Area boundaries, overlap checks, attachments.

### Wave 2: Layer & Map Configs (F-139)
4. **F-139** Map Layer Management — Overlays, Layer styling, custom user MapViews.

### Wave 3: Advanced Spatial Queries (F-140)
5. **F-140** GIS Search & Search History — Buffer queries, bounding-box queries, history caching.

---

## Backend Package Structure

```
src/main/java/com/hanghai/kchtg/gis/
├── point/
│   ├── controller/
│   │   └── PointObjectController.java
│   ├── dto/
│   │   ├── CreatePointObjectRequest.java
│   │   ├── UpdatePointObjectRequest.java
│   │   └── PointObjectResponse.java
│   ├── entity/
│   │   ├── PointObject.java
│   │   ├── ObjectCategory.java
│   │   └── PointAttachment.java
│   ├── repository/
│   │   ├── PointObjectRepository.java
│   │   └── ObjectCategoryRepository.java
│   └── service/
│       └── PointObjectService.java
├── line/
│   ├── controller/
│   │   └── LineObjectController.java
│   ├── dto/
│   │   ├── CreateLineObjectRequest.java
│   │   ├── UpdateLineObjectRequest.java
│   │   └── LineObjectResponse.java
│   ├── entity/
│   │   ├── LineObject.java
│   │   ├── LineCategory.java
│   │   └── LineAttachment.java
│   ├── repository/
│   │   ├── LineObjectRepository.java
│   │   └── LineCategoryRepository.java
│   └── service/
│       └── LineObjectService.java
├── polygon/
│   ├── controller/
│   │   └── PolygonObjectController.java
│   ├── dto/
│   │   ├── CreatePolygonObjectRequest.java
│   │   ├── UpdatePolygonObjectRequest.java
│   │   └── PolygonObjectResponse.java
│   ├── entity/
│   │   ├── PolygonObject.java
│   │   ├── PolygonCategory.java
│   │   └── PolygonAttachment.java
│   ├── repository/
│   │   ├── PolygonObjectRepository.java
│   │   └── PolygonCategoryRepository.java
│   └── service/
│       └── PolygonObjectService.java
├── layer/
│   ├── controller/
│   │   └── MapLayerController.java
│   ├── dto/
│   │   ├── CreateMapLayerRequest.java
│   │   ├── CreateMapOverlayRequest.java
│   │   ├── CreateMapViewRequest.java
│   │   └── ... (remaining DTOs)
│   ├── entity/
│   │   ├── MapLayer.java
│   │   ├── MapOverlay.java
│   │   └── MapView.java
│   ├── repository/
│   │   ├── MapLayerRepository.java
│   │   ├── MapOverlayRepository.java
│   │   └── MapViewRepository.java
│   └── service/
│       └── MapLayerService.java
└── search/
    ├── controller/
    │   └── SearchController.java
    ├── dto/
    │   ├── SearchRequest.java
    │   ├── SearchResponse.java
    │   └── SearchHistoryResponse.java
    ├── entity/
    │   └── SearchQuery.java
    ├── repository/
    │   └── SearchQueryRepository.java
    └── service/
        └── SearchService.java
```

---

## Frontend Package Structure

```
src/pages/gis/
├── PointObjectList.tsx         # F-136
├── PointObjectForm.tsx         # F-136
├── LineObjectList.tsx          # F-137
├── LineObjectForm.tsx          # F-137
├── PolygonObjectList.tsx       # F-138
├── PolygonObjectForm.tsx       # F-138
├── MapLayerList.tsx            # F-139
├── MapLayerForm.tsx            # F-139
└── GISSearch.tsx               # F-140
```

---

## Shared Database Schema Summary

| Table | Feature | Key |
|---|---|---|
| `gis_point_objects` | F-136 | Point geometry, code, name, status, attributes |
| `gis_point_categories` | F-136 | Category code, display name, symbol references |
| `gis_point_attachments`| F-136 | File attachments linked to point objects |
| `gis_line_objects` | F-137 | LineString geometry, code, name, status |
| `gis_line_categories` | F-137 | Category definitions for line objects |
| `gis_polygon_objects` | F-138 | Polygon geometry, code, name, boundary |
| `gis_polygon_categories`| F-138 | Category definitions for polygon objects |
| `gis_map_layers` | F-139 | Layer definitions, source URLs, type, configuration |
| `gis_map_overlays` | F-139 | WMS/WFS map overlays overlays configuration |
| `gis_map_views` | F-139 | Preserved user map zoom/center settings |
| `gis_search_queries` | F-140 | Query history and logging for user searches |

---

## Shared API Base Path

All GIS REST endpoints use prefix: `/api/v1/`

### Authenticated Endpoints
- `GET/POST/PUT/DELETE /api/v1/gis/points` (F-136)
- `GET/POST/PUT/DELETE /api/v1/gis/lines` (F-137)
- `GET/POST/PUT/DELETE /api/v1/gis/polygons` (F-138)
- `GET/POST/PUT/DELETE /api/v1/gis/map-layers` (F-139)
- `GET/POST/PUT/DELETE /api/v1/gis/map-views` (F-139)
- `POST /api/v1/gis/search` (F-140)
- `GET /api/v1/gis/search/history` (F-140)

---

## Sprint Timeline (Consolidated)

```
Week 1: F-136 & F-137 Core Setup — Point & Line entities, WKT serialization, standard REST APIs
Week 2: F-138 (Polygons) — Polygon overlaps, spatial JTS validation checks, CRUD UI
Week 3: F-139 (Layers) — WMS/WFS configurations, styles, User MapView persistence
Week 4: F-140 (Search) — Buffer/Radius search, GeoJSON boundary intersections, history logging
Week 5: E2E Integration and OpenLayers interactive verification
```

---

## Detailed Plans

Per-feature detailed plans:

1. [F-136 Tech Lead Plan](../_features/F-136-quan-ly-danh-muc-doi-tuong-diem/tech-lead/04-plan.md)
2. [F-137 Tech Lead Plan](../_features/F-137-quan-ly-danh-muc-doi-tuong-duong/tech-lead/04-plan.md)
3. [F-138 Tech Lead Plan](../_features/F-138-quan-ly-danh-muc-doi-tuong-vung/tech-lead/04-plan.md)
4. [F-139 Tech Lead Plan](../_features/F-139-quan-ly-thong-tin-kcht-tren-ban-do/tech-lead/04-plan.md)
5. [F-140 Tech Lead Plan](../_features/F-140-tra-cuu-kcht-tren-ban-do/tech-lead/04-plan.md)
