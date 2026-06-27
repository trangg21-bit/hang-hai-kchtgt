---
id: F-285
name: Tích hợp hải đồ S-63
slug: tich-hop-hai-do-s-63
module-id: M-012
status: done
classification: local
priority: high
created: 2026-06-16T04:42:41Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp hải đồ S-63

## Description
Tích hợp và giải mã hải đồ S-63 — định dạng ENC được mã hóa của IHO sử dụng Blowfish ECB decryption. Feature quản lý vòng đời giấy phép S-63 (permit lifecycle) bao gồm đăng ký, kích hoạt, kiểm tra hết hạn và hủy giấy phép. Component S63Decryptor giải mã file nhị phân S-63, xác thực permit tồn tại và còn hiệu lực trước khi tiến hành giải mã, sau đó phân tích nội dung đã giải mã như hải đồ S-57 tiêu chuẩn.

## Business Intent
IHO S-63 là định chuẩn phân phối hải đồ điện tử ENC được mã hóa, yêu cầu giấy phép (permit) hợp lệ để giải mã. Hệ thống quản lý hàng hải cần khả năng tiếp nhận, xác thực giấy phép và giải mã các file ENC S-63 để tích hợp vào nền tảng GIS, cho phép các tàu thuyền tiếp cận dữ liệu hải đồ cập nhật theo chuẩn quốc tế với bảo mật đầy đủ.

## Flow Summary
Quy trình tích hợp S-63 gồm: (1) Admin đăng ký giấy phép S-63 qua API POST /api/gis/charts/permit/register với cellName và permitKey (chuỗi hex) — S63PermitRepository.findByCellName() kiểm tra trùng lặp; (2) Người dùng tải lên file ENC S-63 qua API /api/gis/charts/import-s63; (3) ChartIntegrationService.importS63() xác nhận permit tồn tại trong database và còn hiệu lực (active=true, expiryDate >= ngày hiện tại); (4) S63Decryptor.decrypt() kiểm tra header MOCK-S63-ENCRYPTED — nếu là file mock thì trả về nội dung S-57 giả lập, ngược lại thực hiện giải mã Blowfish ECB với key hex đã parse; (5) Nội dung đã giải mã được phân tích bởi S57Parser, persist ChartCell và ChartFeature; (6) syncToMapLayers() tạo MapLayer entries tương ứng. API DELETE /api/gis/charts/permit/{cellName} cho phép hủy giấy phép.

## Acceptance Criteria
1. Admin phải đăng ký được giấy phép S-63 hợp lệ (cellName unique, permitKey chuỗi hex, expiryDate trong tương lai) qua API /api/gis/charts/permit/register; hệ thống trả về HTTP 201 kèm S63PermitResponse.
2. Khi import file S-63 hợp lệ với permit còn hiệu lực, hệ thống phải giải mã thành công, persist ChartCell và ChartFeature, và trả về HTTP 200 kèm thông tin tế bào đã import.
3. Hệ thống phải từ chối import S-63 nếu: (a) permit không tồn tại trong database, hoặc (b) permit đã hết hạn (expiryDate < ngày hiện tại), hoặc (c) permit không còn active — trả về HTTP 400 với thông báo lỗi cụ thể.
4. API /api/gis/charts/permit/delete/{cellName} phải xóa mềm giấy phép S-63 và trả về HTTP 200 khi xóa thành công.

## In Scope
- Đăng ký, hủy và kiểm tra trạng thái giấy phép S-63 (permit CRUD)
- Giải mã file ENC S-63 bằng Blowfish ECB với permit key dạng hex string
- Kiểm tra permit tồn tại, còn active và chưa hết hạn trước khi giải mã
- Phân tích nội dung đã giải mã như S-57 thông qua S57Parser
- Persist Cell và Feature vào cơ sở dữ liệu qua ChartIntegrationService
- API endpoints: /api/gis/charts/permit/register, /api/gis/charts/permit/delete, /api/gis/charts/import-s63

## Out of Scope
- Tự động gia hạn giấy phép S-63
- Tích hợp hệ thống cấp phát giấy phép chính thức của IHO
- Chuyển đổi Blowfish ECB sang chế độ mã hóa mạnh hơn (CBC/GCM) — chỉ là ghi nhận khuyến nghị trong code review
- Hỗ trợ định dạng S-63 phiên bản mới ngoài S-63 Release 1

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User | Xem danh sách tế bào S-63, Xem chi tiết tế bào, Xem features |
| Admin | Đăng ký/Sửa/Hủy giấy phép S-63, Tải lên file S-63, Xóa tế bào |
| System | Tự động xác thực permit, Tự động giải mã, Tự động sync MapLayer |

## Entities
- **S63Permit**: id (UUID), cellName (unique, NotBlank, 100 chars), permitKey (NotBlank, 200 chars, hex string), expiryDate (NotNull, LocalDate), active (Boolean default true), deletedAt, createdAt, updatedAt
- **ChartCell**: id (UUID), cellName (unique), producer, edition, scale, updateNumber, releaseDate, isEncrypted, latitude, longitude, status (ACTIVE/INACTIVE), deletedAt, createdAt, updatedAt
- **ChartFeature**: id (UUID), cellId (UUID, NotNull), featureName (200 chars), featureCode (NotBlank, 50 chars), geometryType (POINT/LINE/POLYGON), coordinates (TEXT/WKT/GeoJSON), attributesJson (TEXT), deletedAt, createdAt, updatedAt
- **PermitRequest**: DTO cho POST /api/gis/charts/permit/register — cellName (NotBlank), permitKey (NotBlank), expiryDate (NotNull)

## Business Rules
1. Giấy phép S-63 phải có cellName duy nhất — không cho phép đăng ký nhiều giấy phép cho cùng một tế bào.
2. Permit chỉ được sử dụng để giải mã khi còn active (active=true) và chưa hết hạn (expiryDate >= LocalDate.now()).
3. Permit key phải ở định dạng chuỗi hex — hệ thống tự động loại bỏ prefix "0x" nếu có và xử lý chuỗi độ dài lẻ bằng cách thêm "0" ở đầu.
4. Nếu Blowfish decryption thất bại, hệ thống trả về nội dung mock S-57 thay vì gây lỗi — đây là cơ chế an toàn nhưng nên được ghi rõ trong tài liệu.
5. Tất cả các thao tác import S-63 phải được bao bọc trong @Transactional để đảm bảo tính nhất quán.

## Testing Strategy
Kiểm thử unit sử dụng JUnit 5 và Mockito: ChartIntegrationServiceTest.verifyImportS63Success() kiểm tra flow import với mock permit và bytes giả lập đã giải mã; testImportS63PermitNotFound() xác nhận hệ thống từ chối khi permit không tồn tại. S63Decryptor được kiểm thử gián tiếp qua service layer với mock Blowfish decryption. Kiểm thử REST controller xác nhận API register/delete/import hoạt động đúng theo HTTP status codes.
