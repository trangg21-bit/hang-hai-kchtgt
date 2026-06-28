# F-139: Quản lý thông tin KCHT trên bản đồ — BA Complete

> **Status:** in_design (BA stage complete, ready for SA/design)

## In Scope

- Hiển thị các lớp đối tượng KCHT trên bản đồ GIS (point, line, polygon layers)
- Bật/tắt hiển thị từng lớp đối tượng (layer toggle: cổng biển, đèn biển, phao tiêu, đường bờ biển, luồng hàng hải, khu neo đậu, v.v.)
- Quản lý thứ tự hiển thị layers (layer ordering: bring to front, send to back)
- Quản lý opacity/độ trong suốt của từng layer
- Quản lý style hiển thị layer (màu sắc, độ dày đường, bán kính điểm)
- Zoom/pan đến vùng hiển thị từng đối tượng cụ thể
- Hiển thị thông tin chi tiết đối tượng khi click trên bản đồ (popup info)
- Tìm kiếm đối tượng và highlight trên bản đồ
- Lọc hiển thị layer theo trạng thái phê duyệt (chỉ PUBLISHED)
- Xuất bản đồ hiện tại dưới dạng hình ảnh (PNG) hoặc PDF
- Lưu layout bản đồ (preset view) cho việc quay lại nhanh
- Quản lý overlay từ GeoServer (WMS layer) — hiển thị hải đồ nền
- Phân quyền hiển thị theo role: user doanh nghiệp chỉ xem layer đã phê duyệt

## Out of Scope

- Chỉnh sửa geometry đối tượng trực tiếp trên bản đồ (map editing) — chỉ xem trên bản đồ
- Publish/update GeoServer layers từ giao diện web — chỉ quản lý metadata trong DB
- Tạo mới bản đồ từ đầu (map canvas creation) — sử dụng bản đồ nền cố định
- Tích hợp real-time data stream (AIS, VTS tracking) — thuộc module khác
- Phân tích không gian nâng cao (buffer, overlay, proximity analysis) — thuộc module M-012
- Quản lý CRS/projection — không thuộc phạm vi GIS module này
- In ấn bản đồ chuyên nghiệp (print layout) — chỉ xuất PNG/PDF cơ bản
- Tích hợp trực tiếp với hải đồ S-57/S-63 — thuộc module M-012

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full layer management + Style control | Quản lý tất cả layers, thay đổi style/opacity/ordering, bật/tắt layer hệ thống |
| admin (Cục/Chi cục/Cảng vụ chuyên viên) | Layer management + View | Bật/tắt layer, thay đổi opacity/ordering cho layer của mình, xem popup info, lưu preset view |
| user (Doanh nghiệp cảng/Người dùng tại cảng) | Read-only (PUBLISHED layers only) | Chỉ xem các layer đã được phê duyệt; không có quyền thay đổi style, order, opacity |

## Entities

- **MapLayer**: Bảng quản lý lớp hiển thị trên bản đồ (id, name, code, layerType, source, visible, opacity, order, styleConfig, status, createdBy, createdDate, updatedDate)
- **MapStyle**: Cấu hình style cho từng layer (id, layerId, fillColor, strokeColor, strokeWidth, pointRadius, iconSize, opacity, minZoom, maxZoom)
- **MapView**: Layout bản đồ đã lưu (id, name, user, centerLon, centerLat, zoom, visibleLayers, layerOrder, styleConfigs, createdAt)
- **MapOverlay**: Overlay từ GeoServer/WMS (id, name, url, layerName, format, visible, opacity, zIndex, createdAt)
- **MapEvent**: Nhật ký tương tác bản đồ (id, userId, action, targetObjectId, targetObjectType, timestamp)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-139-01 | Chỉ các đối tượng có trạng thái `PUBLISHED` mới hiển thị trên bản đồ cho mọi user | Hiển thị layer | Nghiệp vụ |
| BR-139-02 | Layer mặc định luôn hiển thị: bản đồ nền (basemap), đường bờ biển; các layer khác ẩn theo default | Layer default | Nghiệp vụ |
| BR-139-03 | Thứ tự layers: bản đồ nền ở dưới cùng; các layer KCHT chồng lên trên; layer cao nhất có thể thay đổi | Layer ordering | Thiết kế |
| BR-139-04 | Khi click vào đối tượng trên bản đồ, popup hiển thị: tên, mã, loại, tọa độ, trạng thái, đơn vị quản lý | Popup info | URD §7 |
| BR-139-05 | Tất cả tương tác bản đồ (zoom, pan, click, search) được ghi vào MapEvent — lưu 5 nhóm nhật ký theo RAW §5.1 | Logging | RAW §5.1 |
| BR-139-06 | User doanh nghiệp chỉ xem được layer thuộc đơn vị mình được phân quyền + layer công khai | Phân quyền hiển thị | URD §5, Survey §2 |
| BR-139-07 | Style layer được lưu trong MapStyle; không lưu trực tiếp vào GeoServer SLD file | Style management | Kiến trúc |
| BR-139-08 | Overlay từ GeoServer chỉ đọc (read-only) — không chỉnh sửa layer trên server | GeoServer integration | Kiến trúc |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra filter chỉ PUBLISHED objects hiển thị trên layer (BR-139-01)
  - Kiểm tra layer ordering logic: default basemap ở dưới cùng (BR-139-02, BR-139-03)
  - Kiểm tra MapStyle config validation: fillColor, strokeColor format, min/max zoom bounds
  - Kiểm tra MapView save/load: center, zoom, visibleLayers, layerOrder persisted correctly
  - Kiểm tra MapEvent logging: tất cả tương tác được ghi (BR-139-05)
  - Kiểm tra RBAC layer visibility theo role (BR-139-06)

- **Integration Testing (Backend)**:
  - Test flow: tạo layer → set style → toggle visible → save map view → load map view
  - Test GeoServer overlay integration: URL, layer name, format, opacity
  - Test DB constraints: duplicate layer code, foreign key integrity
  - Test layer ordering reorder: drag-and-sync order values

- **E2E Testing (Frontend + Backend)**:
  - Test hiển thị layers trên bản đồ với toggle checkbox
  - Test thay đổi opacity slider cho từng layer
  - Test thay đổi layer order (drag-and-drop hoặc buttons up/down)
  - Test click vào đối tượng trên bản đồ → popup info hiển thị đúng fields
  - Test zoom/pan đến đối tượng
  - Test search → highlight trên bản đồ
  - Test export bản đồ dưới dạng PNG
  - Test lưu/load preset view
  - Test permission UI: user doanh nghiệp chỉ thấy PUBLISHED layers

- **Security Testing**:
  - Kiểm tra RBAC enforcement cho layer visibility (BR-139-06)
  - Kiểm tra GeoServer URL validation: chỉ chấp nhận internal URLs
  - Kiểm tra XSS trong popup info (render user-provided data safely)

- **UI/UX Testing**:
  - Responsive layer panel (sidebar trái) trên mobile (collapse toggle)
  - Layer toggle với checkbox + opacity slider + drag handle
  - Popup info đẹp, closeable, auto-dismiss after timeout
  - Loading state khi load layers từ GeoServer
  - Map view preset với thumbnail preview
  - Zoom controls, pan controls, full-screen toggle

## UI/UX Requirements

### Layout & Navigation
- Sidebar trái: Layer panel với danh sách layers, checkbox toggle, opacity slider, reorder handle
- Header trên cùng: công cụ zoom, pan, full-screen, export, preset views
- Khu vực chính: bản đồ GIS (Leaflet/OpenLayers)
- Popup info hiển thị khi click đối tượng trên bản đồ

### Design Style
- Giao diện bản đồ chuyên nghiệp, tối giản
- Layer panel: danh sách với icon phân loại (point/line/polygon), màu theo category
- Popup info: card-style với ảnh thumbnail, thông tin chi tiết, nút "Xem chi tiết"
- Màu sắc consistent với theme hệ thống (xanh/trang/đen)

### States & Feedback
- **Loading**: Spinner khi đang load layers từ GeoServer/DB
- **Empty State**: "Chưa có layer nào. Nhấn 'Thêm layer' để bắt đầu."
- **Error State**: Hiển thị thông báo lỗi khi GeoServer không phản hồi
- **Action Feedback**: Toast notification cho save preset view, export, layer toggle

### Specific Features
- **Layer Panel**: Danh sách layers theo nhóm (Point, Line, Polygon); mỗi layer có checkbox, opacity slider (0-100%), button up/down cho reorder
- **Popup Info**: Hiển thị khi click đối tượng; thông tin: tên, mã, loại, tọa độ, trạng thái, đơn vị quản lý, nút "Xem chi tiết"
- **Search & Highlight**: Search box trên header; kết quả search highlight trên bản đồ (vòng tròn cho point, stroke cho line/polygon)
- **Export**: Button "Xuất PNG" xuất bản đồ hiện tại (bao gồm layers visible)
- **Preset Views**: Dropdown list preset views; mỗi preset có tên, thumbnail, center/zoom/layer config

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS + Leaflet/OpenLayers (GIS library)
- Database: MSSQL 2022
- GIS: GeoServer (WMS overlay), WGS84 coordinates
