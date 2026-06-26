---
id: F-284
name: Tích hợp hải đồ S-57
slug: tich-hop-hai-do-s-57
module-id: M-012
status: done
classification: local
priority: high
created: 2026-06-16T04:42:41Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp hải đồ S-57

## Description
Tích hợp và phân tích hải đồ điện tử S-57 (ENC - Electronic Navigational Chart) theo tiêu chuẩn IHO, hỗ trợ cả đường dẫn phân tích nhị phân ISO 8211 và đường dẫn giả lập MOCK-S57 cho mục đích kiểm thử unit. Component S57Parser đọc file nhị phân, trích xuất metadata tế bào (cellName, producer, edition, scale, updateNumber, releaseDate) và danh sách các đối tượng địa lý (features) dưới dạng ChartFeature entities.

## Business Intent
Hệ thống quản lý hàng hải cần khả năng tiếp nhận và phân tích hải đồ điện tử S-57 từ các nguồn cung cấp dữ liệu (VMS-N/VMS-S) để tích hợp vào nền tảng GIS hiển thị hải đồ. Điều này cho phép các tàu thuyền và nhân viên kiểm soát giao thông biển tiếp cận thông tin hải đồ cập nhật theo chuẩn quốc tế, đảm bảo an toàn hàng hải và tuân thủ quy định của Tổ chức Hàng hải Quốc tế (IHO).

## Flow Summary
Quy trình tích hợp S-57 bao gồm: (1) Người dùng tải lên file ENC S-57 qua API /api/gis/charts/import-s57 hoặc thông qua tích hợp tự động với VMS-N/VMS-S; (2) ChartIntegrationService.importS57() nhận file và truyền vào S57Parser.parse(); (3) S57Parser kiểm tra header — nếu phát hiện MOCK-S57 thì sử dụng đường dẫn phân tích giả lập, ngược lại cố gắng phân tích nhị phân ISO 8211; (4) Metadata tế bào được lưu vào entity ChartCell, danh sách features được persist vào ChartFeature repository; (5) Sau khi persist, ChartIntegrationService.syncToMapLayers() tự động tạo các MapLayer entries tương ứng để sẵn sàng hiển thị; (6) Toàn bộ quy trình được đảm bảo tính nhất quán thông qua @Transactional.

## Acceptance Criteria
1. Khi tải lên file S-57 hợp lệ (hoặc MOCK-S57), hệ thống phải phân tích thành công, tạo ChartCell record với đầy đủ metadata (cellName, producer, edition, scale, updateNumber, releaseDate) và persist các ChartFeature entities.
2. S57Parser phải phân tích được tối thiểu 6 loại feature code IHO S-57 (BOYSPP, LIGHTS, DEPCNT, ACHARE, LNDARE, RESARE) và ánh xạ đúng geometry type (POINT, LINE, POLYGON).
3. API endpoint /api/gis/charts/import-s57 phải trả về HTTP 200 kèm response chứa cellName và số lượng features đã phân tích; trả về HTTP 400 với thông báo lỗi tiếng Việt nếu file không hợp lệ hoặc quá nhỏ (dưới 24 byte).
4. Sau khi import thành công, MapLayer tương ứng phải được tự động tạo thông qua syncToMapLayers() với status ACTIVE.

## In Scope
- Phân tích file S-57 ENC (đường dẫn MOCK-S57 và nhị phân ISO 8211)
- Trích xuất metadata tế bào (cellName, producer, edition, scale, updateNumber, releaseDate)
- Phân tích danh sách features từ file S-57, ánh xạ thành ChartFeature entities
- Persist ChartCell và ChartFeature vào cơ sở dữ liệu thông qua JPA repositories
- Tự động đồng bộ hóa với MapLayer sau khi import thành công
- API endpoint /api/gis/charts/import-s57

## Out of Scope
- Phân tích đầy đủ tất cả 200+ feature codes của IHO S-57 (chỉ hỗ trợ 6 loại phổ biến)
- Giải mã file S-57 được bảo vệ (P-SENCOD)
- Tích hợp trực tiếp với hệ thống VMS-N/VMS-S cho việc tự động tải file
- Cập nhật incremental các tế bào ENC đã tồn tại
- Chuyển đổi tọa độ trong quá trình phân tích S-57

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User | Xem danh sách tế bào, Xem chi tiết tế bào, Xem features |
| Admin | Tải lên file S-57, Xem phân tích, Xóa tế bào |
| System | Tự động phân tích S-57, Tự động sync MapLayer |

## Entities
- **ChartCell**: id (UUID), cellName (unique, 100 chars), producer, edition, scale, updateNumber, releaseDate, isEncrypted, latitude, longitude, status (ACTIVE/INACTIVE), deletedAt, createdAt, updatedAt
- **ChartFeature**: id (UUID), cellId (UUID, NotNull), featureName (200 chars), featureCode (50 chars, NotBlank), geometryType (POINT/LINE/POLYGON), coordinates (TEXT/WKT/GeoJSON), attributesJson (TEXT), deletedAt, createdAt, updatedAt
- **ParsedCellData**: inner class của S57Parser — cellName, producer, edition, scale, updateNumber, releaseDate, features (List<ChartFeature>)

## Business Rules
1. Tế bào ChartCell phải có cellName duy nhất — không cho phép hai tế bào có cùng cellName trong hệ thống.
2. File S-57 nhỏ hơn 24 byte sẽ bị từ chối ngay lập tức với lỗi IOException vì không đạt kích thước tối thiểu của header ISO 8211.
3. Tất cả các thao tác import S-57 phải được bao bọc trong @Transactional để đảm bảo tính nhất quán: nếu persist Cell thành công nhưng persist Features thất bại, toàn bộ giao dịch phải được rollback.
4. Trạng thái tế bào mặc định sau khi import thành công là ACTIVE.
5. Đường dẫn phân tích MOCK-S57 chỉ được kích hoạt khi file bắt đầu bằng header "MOCK-S57".

## Testing Strategy
Kiểm thử unit sử dụng JUnit 5 và Mockito: ChartIntegrationServiceTest.verifyImportS57Success() kiểm tra toàn bộ flow import với dữ liệu mock S-57 header và 3 feature giả lập; S57Parser được kiểm thử gián tiếp qua service layer. Kiểm thử integration với mock repository xác nhận ChartCell và ChartFeature được persist chính xác. Dữ liệu kiểm thử sử dụng file mock S-57 với header chuẩn ISO 8211 và danh sách features mẫu dạng text phân tách bằng dấu "|".
