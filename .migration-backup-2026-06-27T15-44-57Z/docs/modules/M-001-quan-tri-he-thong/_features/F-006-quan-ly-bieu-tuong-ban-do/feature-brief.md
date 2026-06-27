---
id: F-006
name: Quản lý biểu tượng bản đồ
slug: quan-ly-bieu-tuong-ban-do
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý biểu tượng bản đồ

## Description

Quản lý thư viện biểu tượng đối tượng GIS trên bản đồ theo từng loại (cầu, cảng, đèn biển, phao tiêu...), bao gồm tạo mới, chỉnh sửa, xóa, import/export biểu tượng SVG/PNG, preview trong GeoServer WMS và phân loại biểu tượng theo đối tượng địa lý với hỗ trợ tùy chỉnh màu sắc, kích thước và hình dáng.

## Business Intent

Hệ thống GIS cần cơ chế quản lý biểu tượng bản đồ chuẩn hóa, cho phép cán bộ kỹ thuật và chuyên viên tạo, duy trì và phân loại biểu tượng trực quan — phục vụ việc hiển thị chính xác các đối tượng địa lý (cơ sở hạ tầng biển, công trình giao thông) trên bản đồ điện tử, đảm bảo tính nhất quán về hình ảnh và màu sắc theo tiêu chuẩn kỹ thuật.

## Flow Summary

Chuyên viên hoặc Admin truy cập module Quản lý biểu tượng bản đồ từ sidebar → chọn tạo biểu tượng mới hoặc quản lý biểu tượng hiện có → điền thông tin (tên, mã biểu tượng unique, loại, màu sắc hex, kích thước, hình dáng) → upload dữ liệu SVG (tối đa 10KB) hoặc PNG (tối đa 500KB) → hệ thống validate SVG (XML validity) và màu sắc (hex code chuẩn WGS84) → biểu tượng được lưu và hiển thị preview trong bản đồ GIS (GeoServer WMS) → cho phép import/export hàng loạt biểu tượng (SVG/PNG) → hiển thị danh sách biểu tượng với lọc theo tên, loại, màu sắc và phân trang.

## Acceptance Criteria

- Thêm/sửa/xóa biểu tượng bản đồ thành công với mã biểu tượng unique, dữ liệu SVG/PNG hợp lệ và kích thước trong giới hạn (SVG ≤10KB, PNG ≤500KB, kích thước 8-128px)
- Gán biểu tượng cho đối tượng GIS và preview trong bản đồ GeoServer WMS chính xác
- Import/export biểu tượng hàng loạt thành công với validate định dạng SVG/XML

## In Scope

- Tạo biểu tượng bản đồ mới (tên, mã, loại, hình dáng, màu sắc, kích thước)
- Chỉnh sửa biểu tượng (tên, màu, kích thước, hình dáng)
- Xóa biểu tượng (không xóa nếu đang được tham chiếu)
- Xem danh sách biểu tượng với bộ lọc (tên, loại, màu)
- Tìm kiếm biểu tượng (theo tên hoặc mã)
- Phân trang danh sách biểu tượng
- Import/export biểu tượng (SVG, PNG)
- Preview biểu tượng trong bản đồ GIS (GeoServer)
- Phân loại biểu tượng theo đối tượng (cầu, cảng, đèn biển, phao tiêu...)
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận

## Out of Scope

- Tự động sinh biểu tượng từ dữ liệu thực địa
- Biểu tượng 3D
- Custom annotation layer trong GeoServer

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full access | Tạo, sửa, xóa, import/export biểu tượng |
| Chuyen vien | View + Edit | Xem và chỉnh sửa biểu tượng, import/export |
| Lanh dao | View | Chỉ xem biểu tượng |
| Can bo | View + Create | Xem và tạo mới, không xóa |

## Entities

- **MapSymbol**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), symbolType(VARCHAR 30 NOT NULL), shape(VARCHAR 30 DEFAULT 'custom'), color(VARCHAR 7 DEFAULT '#4a90d9'), size(INT DEFAULT 32), svgData(TEXT), pngData(LONGBLOB NULL), status(VARCHAR 20 DEFAULT 'active'), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), deletedAt(TIMESTAMP NULL)
- **SymbolUsage**: id(BIGINT PK), symbolId(BIGINT FK→MapSymbol), objectId(VARCHAR 100 NOT NULL), objectType(VARCHAR 50 NOT NULL), usedAt(TIMESTAMP), usedBy(BIGINT FK→UserAccount)
- **SymbolLibrary**: id(BIGINT PK), format(VARCHAR 10 NOT NULL), fileName(VARCHAR 255 NOT NULL), fileSize(BIGINT NOT NULL), uploadedBy(BIGINT FK→UserAccount), uploadedAt(TIMESTAMP), filePath(VARCHAR 500 NULL)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/symbols | Danh sách biểu tượng (phân trang) | JWT |
| GET | /api/v1/symbols/{id} | Chi tiết biểu tượng | JWT |
| POST | /api/v1/symbols | Tạo biểu tượng mới | Admin |
| PUT | /api/v1/symbols/{id} | Chỉnh sửa biểu tượng | Admin, Chuyen vien |
| DELETE | /api/v1/symbols/{id} | Xóa biểu tượng | Admin |
| POST | /api/v1/symbols/import | Import biểu tượng (SVG/PNG) | Admin, Chuyen vien |
| GET | /api/v1/symbols/export | Export biểu tượng | Admin |
| GET | /api/v1/symbols/{id}/preview | Preview trong GIS (GeoServer WMS) | JWT |
| GET | /api/v1/users | Danh sách người dùng | JWT |
| GET | /api/v1/groups | Danh sách nhóm | JWT |
| GET | /api/v1/roles | Danh sách vai trò | JWT |
| GET | /api/v1/connections | Danh sách kết nối liên thông | Admin |

## Architecture Notes

- **Pattern**: Repository Pattern + Factory Pattern cho symbol type
- **GIS Integration**: GeoServer REST API để publish symbol layer (WMS/WFS)
- **SVG Storage**: Lưu svgData trong TEXT column, render trên client (SVG in React)
- **PNG Storage**: Optional pngData trong BLOB column cho client không hỗ trợ SVG
- **Validation**: SVG parser (jsdom) để validate XML validity trước khi lưu
- **Color Format**: Hex color validation (#RRGGBB), fallback to default
- **Size Limits**: SVG ≤ 10KB, PNG ≤ 500KB, size 8-128px
- **Soft Delete**: deleted_at TIMESTAMP NULL, không xóa cứng nếu đang được tham chiếu

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-029 | Mã biểu tượng phải unique | Create/Update Symbol | UC-023 |
| BR-030 | Không được xóa biểu tượng đang được tham chiếu | Delete Symbol | UC-025 |
| BR-031 | SVG data phải hợp lệ (valid XML) | Import | UC-024 |
| BR-032 | Màu sắc phải theo chuẩn WGS84 (hex color code) | Color Standard | UC-023 |
| BR-033 | Kích thước tối thiểu 8×8px, tối đa 128×128px | Size Limits | UC-023 |

## Testing Strategy

- Unit tests: SVG validation, color code format, size validation
- Integration tests: CRUD MapSymbol with usage associations
- E2E tests: Create symbol → preview in GIS → assign to object → verify
- UI tests: Responsive sidebar, sticky header, pagination, search, import/export, symbol preview
