# F-140: Tra cứu KCHT trên bản đồ — BA Complete

> **Status:** in_design (BA stage complete, ready for SA/design)

## In Scope

- Tìm kiếm đối tượng KCHT theo tên, mã, loại trên bản đồ
- Lọc đối tượng theo danh mục, trạng thái, đơn vị quản lý
- Tra cứu theo vị trí (click trên bản đồ → tìm đối tượng gần nhất)
- Tra cứu trong bán kính (radius search) từ điểm click
- Tra cứu trong vùng (polygon search) — tìm đối tượng trong vùng vẽ
- Tra cứu theo tọa độ (lat/lon input → highlight đối tượng gần nhất)
- Hiển thị kết quả tra cứu trên bản đồ (highlight + list kết quả)
- Hiển thị thông tin chi tiết đối tượng từ kết quả tra cứu
- Sắp xếp kết quả tra cứu theo tên, ngày tạo, khoảng cách
- Lọc kết quả tra cứu theo loại đối tượng, trạng thái, đơn vị
- Xuất kết quả tra cứu dưới dạng Excel
- Lịch sử tra cứu gần nhất
- Phân quyền tra cứu: user doanh nghiệp chỉ xem đối tượng đã phê duyệt

## Out of Scope

- Tra cứu không gian nâng cao (spatial analysis, proximity buffer) — chỉ radius/polygon basic
- Tra cứu multi-criteria complex query — chỉ filter đơn giản (type, status, unit)
- Tra cứu theo thời gian (temporal query) — không hỗ trợ query theo ngày
- Tra cứu GIS từ xa (remote WMS/WFS query) — chỉ query từ DB nội bộ
- Tích hợp tìm kiếm thông minh (fuzzy search, NLP) — chỉ exact/prefix match
- Tra cứu ngược địa lý (reverse geocoding) — chỉ tìm đối tượng gần nhất theo tọa độ

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full search + Export + Filter | Tìm kiếm toàn bộ, filter theo tất cả fields, export Excel, xem lịch sử tra cứu |
| admin (Cục/Chi cục/Cảng vụ chuyên viên) | Search + Filter + Export | Tìm kiếm tất cả đối tượng (PUBLISHED + DRAFT của mình), filter theo các fields, export Excel |
| user (Doanh nghiệp cảng/Người dùng tại cảng) | Read-only search (PUBLISHED only) | Chỉ tìm kiếm và xem đối tượng đã được phê duyệt; không có quyền export, không thấy DRAFT |

## Entities

- **SearchQuery**: Lịch sử truy vấn (id, userId, queryType, queryText, queryParams, resultCount, executedAt, durationMs)
- **SearchResult**: Kết quả tra cứu tạm thời (id, queryId, objectId, objectType, name, code, distance, highlighted)
- **MapMarker**: Marker trên bản đồ cho kết quả tra cứu (id, searchResultId, layerType, coordinates, icon, label, createdAt)
- **GeoSearchFilter**: Tham số tra cứu không gian (id, searchType, centerLon, centerLat, radius, polygonCoords, layerTypes, statuses, unitId)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-140-01 | Tìm kiếm theo tên/mã: prefix match (không phân biệt hoa/thường); kết quả hiển thị tối đa 100 bản ghi | Search text | NFR §4.1 |
| BR-140-02 | Tìm kiếm theo vị trí click trên bản đồ: tìm đối tượng gần nhất trong bán kính 500m (point), trong polygon (line/polygon) | Search location | Nghiệp vụ |
| BR-140-03 | Tìm kiếm theo bán kính: user chọn điểm center + nhập bán kính (m), hệ thống trả về đối tượng trong bán kính | Search radius | Nghiệp vụ |
| BR-140-04 | Kết quả tra cứu chỉ bao gồm đối tượng có trạng thái `PUBLISHED` (hoặc DRAFT của admin đơn vị) | Filter | URD §7 |
| BR-140-05 | Thời gian tìm kiếm tối đa 10 giây; nếu quá thời gian → báo lỗi "Tìm kiếm quá lâu, vui lòng thu hẹp phạm vi" | Performance | RAW §5.2 |
| BR-140-06 | Lịch sử tra cứu được lưu tự động (tối đa 20 queries gần nhất); xóa sau 30 ngày | Logging | RAW §5.1 |
| BR-140-07 | User doanh nghiệp chỉ xem được kết quả tra cứu thuộc đơn vị mình được phân quyền + layer công khai | Phân quyền | URD §5, Survey §2 |
| BR-140-08 | Export Excel: chỉ export các kết quả đang hiển thị trên màn hình (đã filter); tối đa 1000 bản ghi/export | Export | Validation |
| BR-140-09 | Tọa độ tra cứu phải trong hệ thống WGS84 | Validation | Tech Brief §6 |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra text search: prefix match, case-insensitive, max 100 results (BR-140-01)
  - Kiểm tra location search: nearest object within 500m radius (BR-140-02)
  - Kiểm tra radius search: spatial query với center + radius (BR-140-03)
  - Kiểm tra filter chỉ PUBLISHED objects (BR-140-04)
  - Kiểm tra timeout 10s cho search query (BR-140-05)
  - Kiểm tra SearchQuery save: tối đa 20 entries, auto-delete after 30 days (BR-140-06)
  - Kiểm tra RBAC filter cho user doanh nghiệp (BR-140-07)

- **Integration Testing (Backend)**:
  - Test flow: search text → highlight on map → show popup info → view details
  - Test search by location click: click on map → nearest object found → highlighted
  - Test search by radius: click + radius → objects within radius → highlighted
  - Test search by polygon: draw polygon → objects inside → highlighted
  - Test export Excel: filter results → export → verify content
  - Test SearchQuery history: save query → list history → clear history

- **E2E Testing (Frontend + Backend)**:
  - Test tìm kiếm theo tên/mã với autocomplete suggestions
  - Test click trên bản đồ → hiển thị marker + popup nearest object
  - Test radius search UI: input center click + radius value
  - Test polygon search UI: draw polygon → search → highlight results
  - Test filter results by type/status/unit after search
  - Test sort results by name/created date/distance
  - Test export Excel từ kết quả tra cứu
  - Test xem lịch sử tra cứu gần nhất
  - Test permission UI: user doanh nghiệp chỉ thấy PUBLISHED results

- **Security Testing**:
  - Kiểm tra RBAC enforcement cho search results visibility (BR-140-07)
  - Kiểm tra search query length limit (1000 chars)
  - Kiểm tra SQL injection qua search text input
  - Kiểm tra export size limit (1000 records max) (BR-140-08)

- **UI/UX Testing**:
  - Responsive search input với autocomplete dropdown
  - Search results panel (sidebar phải) với list results + detail card
  - Map marker highlight: pulse animation cho kết quả được chọn
  - Loading skeleton khi đang tìm kiếm
  - Empty state: "Không tìm thấy kết quả. Thử tìm kiếm với từ khóa khác."
  - Error state: timeout message với gợi ý thu hẹp phạm vi (BR-140-05)
  - Export button visible only for eligible users

## UI/UX Requirements

### Layout & Navigation
- Header trên cùng: search input + search button + filter toggle + export button
- Khu vực chính: bản đồ GIS với markers/highlighted results
- Sidebar phải (khi có kết quả): list results + detail card
- Sidebar trái (optional): history of recent searches

### Design Style
- Giao diện search chuyên nghiệp, dễ sử dụng
- Search results: list format với thumbnail, tên, mã, loại, khoảng cách
- Map markers: icon phân biệt loại đối tượng, pulse animation cho selected result
- Colors: consistent với theme hệ thống, highlight color cho kết quả tìm kiếm

### States & Feedback
- **Loading**: Skeleton screen hoặc spinner khi đang tìm kiếm
- **Empty State**: "Không tìm thấy kết quả. Thử tìm kiếm với từ khóa khác hoặc mở rộng bán kính."
- **Error State**: Hiển thị thông báo timeout với gợi ý thu hẹp phạm vi (BR-140-05)
- **Action Feedback**: Toast notification cho export thành công

### Specific Features
- **Search Input**: Autocomplete với suggestions (tên, mã); debounce 300ms; max 10 suggestions
- **Search Results Panel**: List results với pagination (20 results/page); click vào result → highlight trên bản đồ + show popup
- **Map Interaction**: Click trên bản đồ → find nearest object (500m radius) → highlight + popup
- **Radius Search UI**: Input field cho bán kính (default 500m); min 50m, max 10km
- **Polygon Search UI**: Draw tool cho polygon (rectangle hoặc freehand); search sau khi vẽ xong
- **History Panel**: List 20 queries gần nhất; click để load lại query; clear all button
- **Export**: Button "Xuất Excel"; modal confirm trước khi export; progress indicator

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS + Leaflet/OpenLayers (GIS library)
- Database: MSSQL 2022 (spatial queries)
- GIS: GeoServer (WMS overlay), WGS84 coordinates
