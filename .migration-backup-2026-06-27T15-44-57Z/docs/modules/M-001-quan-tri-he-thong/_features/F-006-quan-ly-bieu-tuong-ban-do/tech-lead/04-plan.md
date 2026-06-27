# Tech Lead Plan: F-006 — Quản lý biểu tượng bản đồ

## 1. Implementation Tasks

### Backend Tasks (Estimated: 2.5–3.5 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 1.1 | Entity: `MapSymbol.java` | `src/main/java/vn/eg/haihang/model/entity/MapSymbol.java` | Medium |
| 1.2 | Entity: `SymbolUsage.java` | `src/main/java/vn/eg/haihang/model/entity/SymbolUsage.java` | Low |
| 1.3 | Entity: `SymbolLibrary.java` | `src/main/java/vn/eg/haihang/model/entity/SymbolLibrary.java` | Low |
| 1.4 | Repository: `MapSymbolRepository.java` | `src/main/java/vn/eg/haihang/repository/MapSymbolRepository.java` | Medium |
| 1.5 | Repository: `SymbolUsageRepository.java` | `src/main/java/vn/eg/haihang/repository/SymbolUsageRepository.java` | Medium |
| 1.6 | Repository: `SymbolLibraryRepository.java` | `src/main/java/vn/eg/haihang/repository/SymbolLibraryRepository.java` | Low |
| 1.7 | DTO: `SymbolCreateDTO`, `SymbolUpdateDTO`, `SymbolAssignDTO`, `SymbolPreviewDTO` | `src/main/java/vn/eg/haihang/dto/` | Medium |
| 1.8 | Service: `MapSymbolService.java` | `src/main/java/vn/eg/haihang/service/MapSymbolService.java` | High |
| 1.9 | Service: `SymbolUsageService.java` | `src/main/java/vn/eg/haihang/service/SymbolUsageService.java` | Medium |
| 1.10 | Service: `SymbolLibraryService.java` (file storage) | `src/main/java/vn/eg/haihang/service/SymbolLibraryService.java` | Medium |
| 1.11 | Adapter: `GeoServerAdapter.java` (REST client) | `src/main/java/vn/eg/haihang/adapter/GeoServerAdapter.java` | High |
| 1.12 | Service: `GeoServerIntegrationService.java` | `src/main/java/vn/eg/haihang/service/GeoServerIntegrationService.java` | High |
| 1.13 | Factory: `SLDFactory.java` (generate SLD XML) | `src/main/java/vn/eg/haihang/factory/SLDFactory.java` | High |
| 1.14 | Validator: `SymbolValidator.java` (SVG XML, hex color, size) | `src/main/java/vn/eg/haihang/validator/SymbolValidator.java` | Medium |
| 1.15 | Facade: `SymbolImportFacade.java` | `src/main/java/vn/eg/haihang/facade/SymbolImportFacade.java` | Medium |
| 1.16 | Controller: `MapSymbolController.java` | `src/main/java/vn/eg/haihang/controller/MapSymbolController.java` | High |
| 1.17 | Service: `SymbolExportService.java` (ZIP bundling) | `src/main/java/vn/eg/haihang/service/SymbolExportService.java` | Medium |
| 1.18 | Config: GeoServer URL, auth, file storage path | `src/main/resources/application.yml` | Low |

### Frontend Tasks (Estimated: 2–3 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 2.1 | API client: `mapSymbolApi.ts` | `src/services/api/mapSymbolApi.ts` | Medium |
| 2.2 | Type definitions: `mapSymbolTypes.ts` | `src/types/mapSymbolTypes.ts` | Medium |
| 2.3 | Hook: `useMapSymbols.ts` (pagination, filtering) | `src/hooks/useMapSymbols.ts` | Medium |
| 2.4 | Page: `MapSymbolListPage.tsx` | `src/pages/gis/MapSymbolListPage.tsx` | High |
| 2.5 | Page: `MapSymbolCreatePage.tsx` | `src/pages/gis/MapSymbolCreatePage.tsx` | Medium |
| 2.6 | Page: `MapSymbolDetailPage.tsx` | `src/pages/gis/MapSymbolDetailPage.tsx` | Medium |
| 2.7 | Page: `SymbolLibraryPage.tsx` | `src/pages/gis/SymbolLibraryPage.tsx` | Medium |
| 2.8 | Component: `SymbolTable.tsx` | `src/components/gis/SymbolTable.tsx` | Medium |
| 2.9 | Component: `SymbolForm.tsx` (SVG preview, color picker) | `src/components/gis/SymbolForm.tsx` | High |
| 2.10 | Component: `SymbolPreview.tsx` (SVG render) | `src/components/gis/SymbolPreview.tsx` | Medium |
| 2.11 | Component: `SymbolAssignModal.tsx` | `src/components/gis/SymbolAssignModal.tsx` | Medium |
| 2.12 | Component: `SymbolImportModal.tsx` (file upload) | `src/components/gis/SymbolImportModal.tsx` | Medium |
| 2.13 | Routing: add GIS routes in `App.tsx` | `src/App.tsx` | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/map-symbols` | `MapSymbolController.listSymbols()` | system-admin |
| GET | `/api/v1/map-symbols/{id}` | `MapSymbolController.getSymbolById()` | system-admin |
| POST | `/api/v1/map-symbols` | `MapSymbolController.createSymbol()` | system-admin |
| PUT | `/api/v1/map-symbols/{id}` | `MapSymbolController.updateSymbol()` | system-admin |
| DELETE | `/api/v1/map-symbols/{id}` | `MapSymbolController.deleteSymbol()` | system-admin |
| GET | `/api/v1/map-symbols/search` | `MapSymbolController.searchSymbols()` | system-admin |
| GET | `/api/v1/map-symbols/{id}/preview` | `MapSymbolController.getPreview()` | JWT |
| POST | `/api/v1/map-symbols/{id}/publish` | `MapSymbolController.publishToGeoServer()` | system-admin |
| GET | `/api/v1/map-symbols/{id}/geoserver-layer` | `MapSymbolController.getGeoServerLayerUrl()` | JWT |
| PATCH | `/api/v1/map-symbols/{id}/sync-geoserver` | `MapSymbolController.syncGeoServer()` | system-admin |
| POST | `/api/v1/map-symbols/{id}/assign` | `MapSymbolController.assignSymbol()` | system-admin |
| GET | `/api/v1/map-symbols/{id}/usages` | `MapSymbolController.getUsages()` | system-admin |
| DELETE | `/api/v1/map-symbols/{id}/usages/{objectId}` | `MapSymbolController.removeUsage()` | system-admin |
| POST | `/api/v1/map-symbols/import` | `MapSymbolController.importSymbol()` | system-admin |
| GET | `/api/v1/map-symbols/export` | `MapSymbolController.exportSymbols()` | system-admin |
| GET | `/api/v1/symbol-libraries` | `MapSymbolController.listLibraries()` | system-admin |
| POST | `/api/v1/symbol-libraries/upload` | `MapSymbolController.uploadLibraryFile()` | system-admin |
| DELETE | `/api/v1/symbol-libraries/{id}` | `MapSymbolController.deleteLibraryFile()` | system-admin |

---

## 3. Component Structure

```
src/
├── pages/
│   └── gis/
│       ├── MapSymbolListPage.tsx     ← Bảng biểu tượng với type/color filters
│       ├── MapSymbolDetailPage.tsx   ← Chi tiết + preview SVG + usages tab
│       ├── MapSymbolCreatePage.tsx   ← Form tạo biểu tượng + SVG upload
│       └── SymbolLibraryPage.tsx     ← Thư viện file SVG/PNG
├── components/
│   └── gis/
│       ├── SymbolTable.tsx           ← Bảng phân trang Ant Design
│       ├── SymbolForm.tsx            ← Form (name, code, type, shape, color, size, SVG)
│       ├── SymbolPreview.tsx         ← SVG preview component (dangerouslySetInnerHTML)
│       ├── SymbolAssignModal.tsx     ← Modal gán cho GIS object
│       └── SymbolImportModal.tsx     ← Modal upload file SVG/PNG
├── hooks/
│   └── useMapSymbols.ts              ← React Query hook (list, get, CRUD, publish, import)
├── services/
│   └── api/
│       └── mapSymbolApi.ts           ← axios instance + map symbol endpoints
├── types/
│   └── mapSymbolTypes.ts             ← MapSymbol, SymbolUsage, SymbolLibrary
└── App.tsx                           ← Router thêm routes gis/map-symbols/*
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-006_init_map_symbols.sql
```sql
-- Map Symbols table
CREATE TABLE map_symbols (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    symbol_type VARCHAR(30) NOT NULL CHECK (symbol_type IN (
        'cau', 'cang', 'den-bien', 'phao-tieu', 'tram-radar', 'other'
    )),
    shape VARCHAR(30) DEFAULT 'circle' CHECK (shape IN (
        'circle', 'square', 'triangle', 'cross', 'custom'
    )),
    color VARCHAR(7) DEFAULT '#3498db',  -- hex: #RRGGBB
    size INT DEFAULT 16 CHECK (size BETWEEN 8 AND 128),
    width INT,
    height INT,
    svg_data NVARCHAR(MAX),  -- raw SVG XML or base64
    preview_url NVARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    reference_count INT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    deleted_at DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX idx_map_symbols_code ON map_symbols(code);
CREATE INDEX idx_map_symbols_name ON map_symbols(name);
CREATE INDEX idx_map_symbols_type ON map_symbols(symbol_type);
CREATE INDEX idx_map_symbols_status ON map_symbols(status);

CREATE TRIGGER trg_map_symbols_updated
ON map_symbols
AFTER UPDATE
AS
BEGIN
    UPDATE map_symbols SET updated_at = SYSUTCDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO
```

### V2__F-006_init_symbol_usages.sql
```sql
-- Symbol Usage (which GIS objects reference which symbol)
CREATE TABLE symbol_usages (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    symbol_id BIGINT NOT NULL FOREIGN KEY REFERENCES map_symbols(id) ON DELETE CASCADE,
    object_id VARCHAR(50) NOT NULL,  -- OID of GIS feature
    object_type VARCHAR(50) NOT NULL,  -- bridge, port, buoy, radar_station
    used_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    used_by BIGINT FOREIGN KEY REFERENCES user_accounts(id)
);
GO

CREATE INDEX idx_symbol_usage_symbol_id ON symbol_usages(symbol_id);
CREATE INDEX idx_symbol_usage_object_id ON symbol_usages(object_id);
CREATE INDEX idx_symbol_usage_object_type ON symbol_usages(object_type);
```

### V3__F-006_init_symbol_libraries.sql
```sql
-- Symbol Library (file storage metadata)
CREATE TABLE symbol_libraries (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    format VARCHAR(10) NOT NULL CHECK (format IN ('svg', 'png')),
    file_name NVARCHAR(255) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    file_size BIGINT,
    uploaded_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    uploaded_by BIGINT FOREIGN KEY REFERENCES user_accounts(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'corrupted', 'removed'))
);
GO

CREATE INDEX idx_symbol_lib_format ON symbol_libraries(format);
CREATE INDEX idx_symbol_lib_uploaded_at ON symbol_libraries(uploaded_at);
```

---

## 5. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| GeoServer Integration | High | REST API client, SLD generation, layer management |
| SVG Validation | Medium | XML well-formedness check, hex color, size constraints |
| File Upload/Storage | Medium | Blob storage integration, file size limits |
| Import Facade | Medium | Multi-step: validate → store → create → publish |
| Frontend (SVG Preview) | Medium-High | SVG render, color picker, size slider, file upload |
| Frontend (CRUD + Library) | Medium | Table + form + library file management |
| **Overall** | **High** | GeoServer integration + SVG handling = unique complexity |

---

## 6. Sprint Breakdown (Wave 1)

| Sprint | Tasks | Deliverable |
|---|---|---|
| Sprint 1 (Days 1–2) | Entities, Repositories, DTOs, V1–V3 migrations | DB schema ready |
| Sprint 2 (Days 3–4) | MapSymbolService, SymbolValidator, SymbolLibraryService, MapSymbolController | Symbol CRUD + validation |
| Sprint 3 (Days 5–6) | GeoServerAdapter, SLDFactory, GeoServerIntegrationService | GeoServer publish working |
| Sprint 4 (Day 7) | SymbolUsageService, SymbolExportService, SymbolImportFacade | Usage tracking + import/export |
| Sprint 5 (Days 8–9) | Frontend: MapSymbolListPage, SymbolTable, SymbolForm, APIs | Symbol CRUD UI |
| Sprint 6 (Day 10) | Frontend: SymbolPreview, SymbolAssignModal, LibraryPage, ImportModal | Preview + library UI |
| Sprint 7 (Day 11) | Integration testing, GeoServer mock testing | Feature ready for QA |
