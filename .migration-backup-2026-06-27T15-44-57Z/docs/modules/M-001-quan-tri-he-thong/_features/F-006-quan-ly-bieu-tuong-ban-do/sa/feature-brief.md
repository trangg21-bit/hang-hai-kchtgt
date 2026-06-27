---
id: F-006
name: Quan ly bieu tuong ban do
slug: quan-ly-bieu-tuong-ban-do
module-id: M-001
stage: system-architect
status: completed
created: 2026-06-17T00:00:00Z
last-updated: 2026-06-17T04:00:00Z
---

# SA Stage: F-006 — Quản lý biểu tượng bản đồ

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 MapSymbol

```java
@Entity
@Table(name = "map_symbols", indexes = {
    @Index(name = "idx_map_symbols_name", columnList = "name"),
    @Index(name = "idx_map_symbols_code", columnList = "code", unique = true),
    @Index(name = "idx_map_symbols_type", columnList = "symbol_type"),
    @Index(name = "idx_map_symbols_status", columnList = "status")
})
public class MapSymbol {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "name", length = 200, nullable = false) private String name;
    @Column(name = "code", length = 100, nullable = false) private String code;

    @Column(name = "symbol_type", length = 30, nullable = false,
        columnDefinition = "VARCHAR(30)")
    private String symbolType; // cau | cang | den-bien | phao-tieu | tram-radar | other

    @Column(name = "shape", length = 30, columnDefinition = "VARCHAR(30)")
    private String shape; // circle | square | triangle | cross | custom

    @Column(name = "color", length = 7) private String color; // hex: #FF5733
    @Column(name = "size") private Integer size; // pixel size (8–128)
    @Column(name = "width") private Integer width;
    @Column(name = "height") private Integer height;

    @Column(name = "svg_data", columnDefinition = "NVARCHAR(MAX)")
    private String svgData; // base64-encoded or raw SVG XML

    @Column(name = "preview_url", length = 500) private String previewUrl;
    // Thumbnail URL stored in blob storage / GeoServer layer

    @Column(name = "status", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    private String status; // active | inactive | deprecated

    @Column(name = "reference_count") private Integer referenceCount; // derived from SymbolUsage
    // Pre-computed to avoid JOIN on delete check

    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;

    @PrePersist void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (referenceCount == null) referenceCount = 0;
    }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

### 1.2 SymbolUsage

```java
@Entity
@Table(name = "symbol_usages", indexes = {
    @Index(name = "idx_symbol_usage_symbol_id", columnList = "symbol_id"),
    @Index(name = "idx_symbol_usage_object_id", columnList = "object_id"),
    @Index(name = "idx_symbol_usage_object_type", columnList = "object_type")
})
public class SymbolUsage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "symbol_id", nullable = false)
    private MapSymbol symbol;

    @Column(name = "object_id", length = 50, nullable = false) private String objectId;
    // OID of GIS feature (e.g., bridge_id, port_id)

    @Column(name = "object_type", length = 50, nullable = false)
    private String objectType; // bridge | port | buoy | radar_station | ...

    @Column(name = "used_at") private LocalDateTime usedAt;
    @Column(name = "used_by") private Long usedBy; // user_id

    @PrePersist void onCreate() {
        usedAt = LocalDateTime.now();
        if (usedBy == null) usedBy = getCurrentUserId();
    }
}
```

### 1.3 SymbolLibrary

```java
@Entity
@Table(name = "symbol_libraries", indexes = {
    @Index(name = "idx_symbol_lib_format", columnList = "format"),
    @Index(name = "idx_symbol_lib_uploaded_at", columnList = "uploaded_at")
})
public class SymbolLibrary {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "format", length = 10, nullable = false) private String format; // svg | png

    @Column(name = "file_name", length = 255, nullable = false) private String fileName;
    @Column(name = "file_path", length = 500, nullable = false) private String filePath;
    // Path in file storage (blob / local disk / GeoServer styles)

    @Column(name = "file_size") private Long fileSize;

    @Column(name = "uploaded_at") private LocalDateTime uploadedAt;
    @Column(name = "uploaded_by") private Long uploadedBy;

    @Column(name = "status", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    private String status; // active | corrupted | removed
}
```

### 1.4 Relationship Diagram

```
MapSymbol 1──N SymbolUsage
MapSymbol N──1 SymbolLibrary (svg_data reference)
SymbolUsage N──1 MapSymbol (many-to-one via symbol_id)
```

## 2. API Endpoints

All endpoints prefixed with `/api/v1/`. Authentication via JWT Bearer token.

### MapSymbol CRUD

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/map-symbols` | Danh sách biểu tượng | system-admin |
| GET | `/api/v1/map-symbols/{id}` | Chi tiết biểu tượng | system-admin |
| POST | `/api/v1/map-symbols` | Tạo biểu tượng mới | system-admin |
| PUT | `/api/v1/map-symbols/{id}` | Chỉnh sửa biểu tượng | system-admin |
| DELETE | `/api/v1/map-symbols/{id}` | Xóa (check reference_count) | system-admin |

### Symbol Preview & GIS Integration

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/map-symbols/{id}/preview` | Preview SVG/PNG thumbnail | JWT |
| POST | `/api/v1/map-symbols/{id}/publish` | Đăng lên GeoServer layer | system-admin |
| GET | `/api/v1/map-symbols/{id}/geoserver-layer` | URL layer GeoServer | JWT |
| PATCH | `/api/v1/map-symbols/{id}/sync-geoserver` | Đồng bộ style GeoServer | system-admin |

### Symbol Assignment

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/map-symbols/{id}/assign` | Gán biểu tượng cho đối tượng GIS | system-admin |
| GET | `/api/v1/map-symbols/{id}/usages` | Danh sách đối tượng đã gán | system-admin |
| DELETE | `/api/v1/map-symbols/{id}/usages/{objectId}` | Bỏ gán biểu tượng | system-admin |

### Symbol Search & Import

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/map-symbols/search?query=&type=` | Tìm kiếm biểu tượng | system-admin |
| GET | `/api/v1/map-symbols?symbolType=&color=` | Bộ lọc theo loại/màu | system-admin |
| POST | `/api/v1/map-symbols/import` | Import SVG/PNG vào thư viện | system-admin |
| GET | `/api/v1/map-symbols/export?format=svg` | Export biểu tượng (ZIP) | system-admin |

### Symbol Library Management

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/symbol-libraries` | Thư viện file biểu tượng | system-admin |
| POST | `/api/v1/symbol-libraries/upload` | Upload file SVG/PNG | system-admin |
| DELETE | `/api/v1/symbol-libraries/{id}` | Xóa file thư viện | system-admin |

## 3. Architecture Notes

### 3.1 Component Interactions

```
ReactJS (GIS Admin UI)
    │
    ├── MapSymbolController
    │       ├── MapSymbolService ──► MapSymbolRepository ──► MSSQL
    │       ├── SymbolValidator (SVG XML validation, color hex, size)
    │       └── SymbolExportService (ZIP bundling)
    │
    ├── GeoServerIntegrationService
    │       ├── GeoServer REST API (HttpClient / RestTemplate)
    │       ├── Publishes SLD styles to GeoServer
    │       └── Manages GeoServer symbol layers
    │
    └── SymbolLibraryService ──► FileStorageService ──► Blob Storage / Disk
```

**Key interactions:**
- `SymbolValidator` validates SVG is well-formed XML (javax.xml.validation), color is valid hex (#RRGGBB), size in [8, 128]
- `GeoServerIntegrationService` pushes SLD (Styled Layer Descriptor) files to GeoServer REST API on symbol create/update
- `SymbolUsage` tracks which GIS objects reference each symbol — used for delete protection (BR-030)
- SVG data stored as `NVARCHAR(MAX)` in MSSQL for direct rendering in React SVG components

### 3.2 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `MapSymbolRepository` with `findBySymbolType()` and `findWithReferenceCount()` |
| **DTO Pattern** | `SymbolCreateDTO`, `SymbolUpdateDTO`, `SymbolAssignDTO`, `SymbolPreviewDTO` |
| **Adapter Pattern** | `GeoServerAdapter` — adapts Spring HTTP client to GeoServer REST API |
| **Specification Pattern** | Filter by type, color, size range |
| **Factory Pattern** | `SLDFactory` — generates GeoServer SLD XML from symbol properties |
| **Facade Pattern** | `SymbolImportFacade` — validates → stores → creates MapSymbol → publishes to GeoServer |

### 3.3 GeoServer Integration

```java
@Component
public class GeoServerIntegrationService {
    private final RestTemplate restTemplate;
    private final String geoserverUrl; // from application.yml
    private final String geoserverUser;
    private final String geoserverPassword;

    public void publishSymbolToGeoServer(MapSymbol symbol) {
        String sldXml = sldFactory.generate(symbol);

        String url = geoserverUrl + "/rest/workspaces/{ws}/styles/{name}.sld";
        restTemplate.put(url, sldXml,
            Map.of("ws", "hang_hai", "name", symbol.getCode()),
            new HttpEntity<>(sldXml, authHeaders()));
    }

    public String getGeoServerLayerUrl(MapSymbol symbol) {
        return geoserverUrl + "/wms?REQUEST=GetMap&LAYERS=hang_hai:" + symbol.getCode();
    }
}
```

**SLD Generation (simplified):**
```xml
<StyledLayerDescriptor>
  <NamedLayer>
    <Name>{symbol.code}</Name>
    <UserStyle>
      <PointSymbolizer>
        <Graphic>
          <Mark>
            <WellKnownName>{symbol.shape}</WellKnownName>
            <Fill><CssParameter name="fill">{symbol.color}</CssParameter></Fill>
          </Mark>
          <Size>{symbol.size}</Size>
        </Graphic>
      </PointSymbolizer>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
```

### 3.4 Validation & Business Rules Enforcement

```
SymbolValidator.validate(dto):
  1. Code unique → ConstraintViolationException
  2. SVG valid XML (if svgData provided) → SVGValidationException
  3. Color valid hex (#RRGGBB) → ColorFormatException
  4. Size in [8, 128] → SizeValidationException

MapSymbolService.delete(id):
  1. Load reference_count from MapSymbol
  2. If reference_count > 0 → SymbolInUseException("Biểu tượng đang được tham chiếu")
  3. Soft delete (set deletedAt)
  4. Remove from GeoServer layer (cleanup)
```

### 3.5 Transaction Boundaries

- `@Transactional` on `MapSymbolService.create()` — create entity + SymbolUsage init + publish to GeoServer
- `@Transactional` on `SymbolService.assign()` — create SymbolUsage + increment reference_count
- `@Transactional(readOnly = true)` on list/search queries

### 3.6 Database Indexes & Performance

- Unique index on `(code)` — prevents duplicate codes
- Index on `(symbol_type, status)` for type-based queries
- Index on `(object_type, object_id)` in SymbolUsage for GIS object lookups
- `reference_count` materialized column — avoids JOIN on delete checks
- SVG data: `NVARCHAR(MAX)` — consider blob storage for large SVGs (>100KB)

### 3.7 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-data-jpa` | ORM + MSSQL |
| `spring-boot-starter-web` | HTTP client for GeoServer REST |
| `spring-boot-starter-validation` | Bean validation |
| `jaxb-api` + `javax.xml.validation` | SVG XML validation |
| `commons-io` | File handling for upload/export |
| `zip4j` | ZIP bundling for export |
