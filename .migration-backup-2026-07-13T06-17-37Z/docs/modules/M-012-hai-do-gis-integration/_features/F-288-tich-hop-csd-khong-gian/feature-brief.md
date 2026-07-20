---
id: F-288
name: Tích hợp CSDL không gian
slug: tich-hop-csd-khong-gian
module-id: M-012
status: done
classification: local
priority: high
created: 2026-06-16T04:42:41Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp CSDL không gian

## Description
Thiết kế và triển khai lớp thực thể cơ sở dữ liệu JPA cho dữ liệu hải đồ không gian, bao gồm 3 entities chính: ChartCell (tế bào hải đồ), ChartFeature (đối tượng địa lý trong tế bào) và S63Permit (giấy phép giải mã S-63). Mỗi entity sử dụng UUID làm primary key, kế thừa BaseEntity để có createdAt/updatedAt và cơ chế xóa mềm (@SQLRestriction "deleted_at IS NULL"). Repository layer sử dụng Spring Data JPA với derived query methods (findByCellName, findByCellId, findByFeatureCode, findByLayerType). ChartIntegrationService orchestrates toàn bộ CRUD operations cho các entities, tích hợp với S57Parser, S63Decryptor và MapLayerService.

## Business Intent
Cơ sở dữ liệu không gian là nền tảng lưu trữ dữ liệu hải đồ trong hệ thống quản lý hàng hải. Các tế bào ENC (ChartCell), đối tượng địa lý (ChartFeature) và giấy phép S-63 (S63Permit) cần được quản lý trong một hệ thống dữ liệu tin cậy, đảm bảo toàn vẹn tham chiếu, hỗ trợ tìm kiếm nhanh theo cellName và cellId, và cho phép xóa mềm để bảo tồn lịch sử dữ liệu. Việc thiết kế entity và repository đúng chuẩn JPA là điều kiện tiên quyết cho mọi hoạt động khác của module Hải đồ & GIS.

## Flow Summary
Quy trình tích hợp CSDL không gian gồm: (1) Khi import S-57, ChartIntegrationService.importS57() tạo ChartCell entity với metadata từ S57Parser, sau đó persist từng ChartFeature entity vào enc_features table; (2) Khi import S-63, ChartIntegrationService.importS63() xác thực S63Permit trước, giải mã file, sau đó tạo ChartCell và ChartFeature như trên; (3) ChartCellRepository.findByCellName() cho phép tra cứu tế bào theo tên; ChartFeatureRepository.findByCellId() trả về tất cả features trong một tế bào; (4) ChartIntegrationService.syncToMapLayers() đọc các tế bào mới import và tạo MapLayer entries tương ứng; (5) Tất cả các thao tác write được bao bọc trong @Transactional để đảm bảo ACID; (6) Xóa mềm được áp dụng thông qua BaseEntity.softDelete() cập nhật deletedAt timestamp.

## Acceptance Criteria
1. Entity ChartCell phải được persist thành công vào bảng enc_cells với đầy đủ các trường: cellName (unique), producer, edition, scale, updateNumber, releaseDate, latitude, longitude, status (ACTIVE/INACTIVE).
2. Entity ChartFeature phải được persist thành công vào bảng enc_features với cellId (UUID, NotNull), featureCode (NotBlank), geometryType (POINT/LINE/POLYGON), coordinates (WKT/GeoJSON), attributesJson (TEXT).
3. Entity S63Permit phải được persist vào bảng s63_permits với cellName (unique), permitKey (hex string), expiryDate (LocalDate), active (Boolean default true).
4. ChartCellRepository.findByCellName() phải trả về chính xác ChartCell entity với cellName được chỉ định, hoặc NoSuchElementException nếu không tìm thấy.
5. ChartFeatureRepository.findByCellId() phải trả về danh sách tất cả ChartFeature entities thuộc về một cellId cụ thể.

## In Scope
- 3 entities chính: ChartCell (enc_cells), ChartFeature (enc_features), S63Permit (s63_permits)
- UUID primary keys qua BaseEntity
- @Table với tên bảng chính xác (enc_cells, enc_features, s63_permits)
- @Column constraints: @NotBlank, @NotNull, @Size, @Length
- Unique constraints trên cellName (ChartCell và S63Permit)
- Enum types: Status (ACTIVE/INACTIVE), GeometryType (POINT/LINE/POLYGON) với EnumType.STRING
- Soft delete qua @SQLRestriction("deleted_at IS NULL") và BaseEntity.softDelete()
- 3 repositories: ChartCellRepository, ChartFeatureRepository, S63PermitRepository
- Spring Data JPA derived query methods (findByCellName, findByCellId, findByFeatureCode)
- @Builder/@Getter/@Setter từ Lombok
- @Transactional orchestration trong ChartIntegrationService

## Out of Scope
- Spatial database extension (PostGIS) — coordinates được lưu dưới dạng TEXT (WKT/GeoJSON) không có spatial indexing
- Cascade delete giữa ChartCell và ChartFeature — không có @OnDelete(action = OnDeleteAction.CASCADE)
- JPA relationship annotation (@ManyToOne/@JoinColumn) giữa ChartFeature.cellId và ChartCell
- Spatial query support (nearest-neighbor, containment, distance queries)
- Composite indexes (ví dụ: status + producer trên ChartCell)
- JSON schema validation cho attributesJson column

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User | Xem tế bào, Xem features trong tế bào |
| Admin | Tạo/Sửa/Xóa (soft) tế bào, Tạo/Sửa/Xóa (soft) feature, Tạo/Sửa/Xóa (soft) permit |
| System | Tự động persist ChartCell/ChartFeature khi import, Tự động delete soft khi xóa tế bào |

## Entities
- **ChartCell**: id (UUID), cellName (unique, NotBlank, 100 chars), producer, edition (int), scale (int), updateNumber (int), releaseDate (LocalDate), isEncrypted (Boolean), latitude (double), longitude (double), status (ACTIVE/INACTIVE), deletedAt, createdAt, updatedAt
- **ChartFeature**: id (UUID), cellId (UUID, NotNull), featureName (200 chars), featureCode (NotBlank, 50 chars), geometryType (POINT/LINE/POLYGON), coordinates (TEXT/WKT/GeoJSON), attributesJson (TEXT), deletedAt, createdAt, updatedAt
- **S63Permit**: id (UUID), cellName (unique, NotBlank, 100 chars), permitKey (NotBlank, 200 chars), expiryDate (NotNull, LocalDate), active (Boolean default true), deletedAt, createdAt, updatedAt
- **ChartIntegrationService**: orchestrator cho toàn bộ CRUD operations — importS57(), importS63(), registerPermit(), deletePermit(), syncToMapLayers()

## Business Rules
1. cellName phải là duy nhất trên toàn bộ hệ thống — không cho phép hai ChartCell hoặc hai S63Permit có cùng cellName.
2. ChartFeature.cellId phải luôn tham chiếu đến một ChartCell tồn tại — không cho phép persist feature với cellId không tồn tại.
3. Tất cả entities phải sử dụng xóa mềm (@SQLRestriction) — không bao giờ xóa vĩnh viễn dữ liệu khỏi database.
4. GeometryType chỉ được phép các giá trị enum: POINT, LINE, POLYGON — không cho phép giá trị khác.
5. Status của ChartCell chỉ được phép: ACTIVE hoặc INACTIVE — default là ACTIVE sau khi import.
6. S63Permit.expiryDate không được phép nhỏ hơn ngày hiện tại khi đăng ký mới.

## Testing Strategy
Kiểm thử unit sử dụng JUnit 5 và Mockito: ChartIntegrationServiceTest.verifyImportS57Success() và testImportS63Success() kiểm tra toàn bộ flow import với mock repositories. testImportS63PermitNotFound() xác nhận hệ thống từ chối khi permit không tồn tại. Repository layer được kiểm thử gián tiếp thông qua service layer — ChartCellRepository.findByCellName(), ChartFeatureRepository.findByCellId(), S63PermitRepository.findByCellName() được verify với Mockito.verify(). Entity validation được kiểm thử bằng cách tạo entities với dữ liệu null/empty và xác nhận JPA constraints được áp dụng đúng.
