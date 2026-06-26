---
id: F-287
name: Quản lý lớp dữ liệu GIS
slug: quan-ly-lop-du-lieu-gis
module-id: M-012
status: done
classification: local
priority: medium
created: 2026-06-16T04:42:41Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý lớp dữ liệu GIS

## Description
Cung cấp hệ thống CRUD hoàn chỉnh cho 4 loại thực thể GIS: MapLayer (lớp bản đồ chính), MapView (quan điểm bản đồ của người dùng), MapOverlay (lớp phủ URL-based) và MapStyle (định dạng hiển thị per-layer). MapLayerService quản lý toàn bộ vòng đời với enum LayerType (POINT, LINE, POLYGON, BASEMAP, OVERLAY), Status (ACTIVE, INACTIVE), kiểm tra tính duy nhất của layer code, sắp xếp thứ tự (sort_order), và cơ chế xóa mềm (@SQLRestriction). Tích hợp tự động với ChartIntegrationService.syncToMapLayers() để tạo MapLayer entries mới mỗi khi hải đồ được import.

## Business Intent
Hệ thống quản lý hàng hải cần khả năng tổ chức và phân loại thông tin hải đồ thành các lớp (layers) có thể bật/tắt, sắp xếp theo thứ tự và định dạng riêng biệt. Điều này cho phép người dùng tùy chỉnh giao diện bản đồ theo nhu cầu: hiển thị hoặc ẩn các lớp phao, đèn, vùng nước, khu vực hạn chế; quản lý nhiều quan điểm bản đồ (views) khác nhau; thêm các lớp phủ bên ngoài (overlay URL) như hình vệ tinh hoặc bản đồ nền. Hệ thống lớp dữ liệu là nền tảng cho giao diện GIS trực quan và linh hoạt.

## Flow Summary
Quy trình quản lý lớp dữ liệu GIS gồm: (1) Admin tạo MapLayer mới qua API POST /api/gis/layers với name, code (unique), layerType (enum), sortOrder (default 0); (2) MapLayerService.create() kiểm tra code duy nhất qua MapLayerRepository.existsByCode(), sau đó persist entity; (3) Các lớp được sắp xếp theo sortOrder ascending thông qua MapLayerRepository.findByVisibleTrueOrderByOrderAsc(); (4) Admin tạo MapView cho người dùng với centerLon, centerLat, zoom và danh sách visibleLayers; (5) MapOverlay được thêm để hiển thị các lớp phủ URL (TILE, WMS, WMTS, GeoJSON); (6) MapStyle định dạng hiển thị per-layer (fillColor, strokeColor, strokeWidth, pointRadius, opacity, minZoom, maxZoom); (7) Khi import hải đồ S-57/S-63, ChartIntegrationService.syncToMapLayers() tự động tạo MapLayer entries; (8) Toàn bộ CRUD sử dụng xóa mềm (@SQLRestriction) và @Transactional(readOnly=true) ở class level.

## Acceptance Criteria
1. API POST /api/gis/layers phải tạo được MapLayer mới với name (NotBlank), code (unique), layerType (enum) và sortOrder (default 0); trả về HTTP 201 kèm MapLayerResponse.
2. API phải từ chối tạo MapLayer mới nếu code đã tồn tại — trả về HTTP 409 Conflict với thông báo "Layer code already exists".
3. API GET /api/gis/layers phải trả về danh sách các lớp với status ACTIVE, sắp xếp theo sortOrder ascending.
4. API DELETE /api/gis/layers/{id} phải thực hiện xóa mềm (soft delete, cập nhật deletedAt) và trả về HTTP 200 — lớp không bị xóa khỏi database mà chỉ bị ẩn khỏi kết quả query (do @SQLRestriction).

## In Scope
- CRUD đầy đủ cho 4 thực thể: MapLayer, MapView, MapOverlay, MapStyle
- Enum LayerType với 5 loại: POINT, LINE, POLYGON, BASEMAP, OVERLAY
- Enum Status với 2 trạng thái: ACTIVE, INACTIVE
- Kiểm tra tính duy nhất của layer code (existsByCode)
- Sắp xếp lớp theo sortOrder (OVERLAY layers mặc định order=100 cho z-index)
- Xóa mềm (@SQLRestriction "deleted_at IS NULL") cho tất cả entities
- Tự động tạo MapLayer từ quá trình import hải đồ (syncToMapLayers)
- API REST endpoints cho tất cả 4 entity types

## Out of Scope
- Pagination trên các phương thức findAll (trả về toàn bộ records)
- Validation JSON schema cho styleConfig (TEXT column)
- Kiểm tra format của MapOverlay.format field (TILE/WMS/WMTS/GeoJSON)
- Authorization/permission kiểm tra trên từng API endpoint
- Audit trail / change history cho các thay đổi lớp
- Import/export batch MapLayer configuration

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User | Xem danh sách lớp, Xem chi tiết lớp, Tạo MapView cá nhân |
| Admin | Tạo/Sửa/Xóa MapLayer, Tạo/Sửa/Xóa MapOverlay, Tạo/Sửa/Xóa MapStyle, Tạo/Sửa/Xóa MapView |
| System | Tự động sync MapLayer khi import hải đồ |

## Entities
- **MapLayer**: id (UUID), layerType (POINT/LINE/POLYGON/BASEMAP/OVERLAY), status (ACTIVE/INACTIVE), name (NotBlank, 100 chars), code (unique, NotBlank, 50 chars), source (unique), visible (Boolean), opacity (double), sortOrder (int default 0), styleConfig (TEXT), deletedAt, createdAt, updatedAt
- **MapView**: id (UUID), name (100 chars), userId (String), centerLon (double), centerLat (double), zoom (int), visibleLayers (TEXT JSON), layerOrder (TEXT JSON), styleConfigs (TEXT JSON), deletedAt, createdAt, updatedAt
- **MapOverlay**: id (UUID), name (100 chars), url (NotBlank), layerName, format, visible (Boolean), opacity (double), zIndex (int), deletedAt, createdAt, updatedAt
- **MapStyle**: id (UUID), layerId (UUID, NotNull), fillColor, strokeColor, strokeWidth (double), pointRadius (int), iconSize (int), opacity (double), minZoom (int), maxZoom (int), deletedAt, createdAt, updatedAt

## Business Rules
1. Layer code phải là duy nhất trong toàn bộ hệ thống — không cho phép hai MapLayer có cùng code.
2. Khi tạo MapLayer mới, nếu không cung cấp sortOrder, hệ thống tự động gán giá trị mặc định là 0.
3. Các OVERLAY layers nên có sortOrder >= 100 để đảm bảo hiển thị trên cùng (z-index precedence).
4. Xóa mềm (softDelete) phải được áp dụng cho tất cả entity types — không bao giờ xóa vĩnh viễn dữ liệu khỏi database.
5. MapLayerRepository.findByVisibleTrueOrderByOrderAsc() chỉ trả về các lớp có visible=true, sắp xếp theo sortOrder.
6. ChartIntegrationService.syncToMapLayers() tự động tạo MapLayer mới cho mỗi tế bào ENC được import, với layerType dựa trên loại dữ liệu chính của tế bào.

## Testing Strategy
Kiểm thử unit sử dụng JUnit 5 và Mockito: MapLayerServiceTest kiểm thử CRUD đầy đủ cho 4 entity types với dữ liệu mock; MapLayerControllerTest xác nhận REST endpoints trả về đúng HTTP status codes. Kiểm thử integration xác nhận: (a) unique code validation trong create(), (b) soft delete hoạt động đúng với @SQLRestriction, (c) orderByOrderAsc sắp xếp chính xác, (d) syncToMapLayers tạo MapLayer entries tự động khi import. 50+ test cases bao phủ các kịch bản happy path và edge cases.
