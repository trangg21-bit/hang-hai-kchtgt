---
id: F-207
name: "Chia sẻ KCHTGT Hệ thống phụ trợ VTS"
slug: chia-se-kchtgt-he-thong-phu-tro-vts
module-id: M-018
status: proposed
classification: local
priority: critical
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Chia sẻ KCHTGT Hệ thống phụ trợ VTS

## Description
Chia sẻ dữ liệu từ hệ thống phụ trợ VTS (Vessel Traffic Service Support System) bao gồm thông tin về các thiết bị và dịch vụ hỗ trợ hoạt động VTS như hệ thống nguồn điện dự phòng, điều hòa không khí trung tâm, hệ thống PCCC, thiết bị đo môi trường, hệ thống UPS và các tiện ích hạ tầng khác phục vụ vận hành Trung tâm VTS.

## Business Intent
Tính năng cho phép chia sẻ thông tin về trạng thái và chất lượng hệ thống phụ trợ VTS một cách đồng bộ, hỗ trợ công tác giám sát, bảo trì và đảm bảo tính liên tục hoạt động của Trung tâm VTS, góp phần nâng cao độ tin cậy và an toàn cho toàn bộ hệ thống điều hành giao thông đường thủy.

## Flow Summary
Dữ liệu phụ trợ VTS được thu thập tự động từ các hệ thống hạ tầng hỗ trợ (nguồn điện dự phòng, điều hòa, PCCC, UPS, đo môi trường) trong và xung quanh Trung tâm VTS, bao gồm: trạng thái hoạt động, công suất, nhiệt độ, độ ẩm, chất lượng không khí, mức dung lượng pin UPS. Dữ liệu đã được xử lý được chuẩn hóa thành định dạng JSON và chia sẻ qua trục LGSP đến các hệ thống giám sát, điều hành và báo cáo. Quy trình bao gồm xác thực JWT, kiểm tra IP whitelist và ghi nhận log giao dịch.

## Acceptance Criteria
1. Dữ liệu phụ trợ VTS từ các hệ thống hạ tầng hỗ trợ được chia sẻ thành công qua trục LGSP với định dạng JSON trên HTTPS.
2. Hệ thống xác thực JWT và kiểm tra IP whitelist đúng quy định cho mọi yêu cầu tiếp nhận dữ liệu phụ trợ VTS.
3. Dữ liệu phụ trợ VTS bao gồm đầy đủ: tên thiết bị, loại hệ thống, giá trị đo lường, trạng thái, ngưỡng cảnh báo, thời gian cập nhật.
4. Dữ liệu phụ trợ VTS được phân phối đến các hệ thống đích trong vòng 10 giây sau khi thu thập.
5. Cảnh báo sự cố phụ trợ VTS (mất điện, quá nhiệt, cháy...) được ưu tiên phân phối đến các hệ thống liên quan trong vòng 2 giây.

## In Scope
- Chia sẻ dữ liệu phụ trợ VTS qua trục LGSP (RESTful API, JSON, HTTPS)
- Xác thực JWT và IP whitelist
- Chuẩn hóa định dạng dữ liệu phụ trợ (nguồn điện, điều hòa, PCCC, UPS, môi trường)
- Phân phối đến các hệ thống đích
- Ghi nhận log và cảnh báo lỗi

## Out of Scope
- Điều khiển trực tiếp thiết bị phụ trợ VTS (chỉ chia sẻ dữ liệu đã thu thập)
- Xử lý tín hiệu ở cấp độ phần cứng hoặc tầng vật lý
- Tích hợp với hệ thống phụ trợ hiện có — chỉ chia sẻ dữ liệu sau chuẩn hóa

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người quan sát | Xem dữ liệu phụ trợ VTS đã công khai (trạng thái, giá trị đo) |
| Vận hành phụ trợ | Xem, tiếp nhận dữ liệu phụ trợ VTS; xuất báo cáo vận hành |
| Quản trị viên | Xem, cấu hình thiết bị phụ trợ; quản lý IP whitelist; xóa dữ liệu |

## Architecture Notes
- Tương tác qua trục LGSP sử dụng RESTful API chuẩn với dữ liệu JSON trên kênh HTTPS.
- Xác thực sử dụng JWT token kết hợp với danh sách IP whitelist.
- Dữ liệu phụ trợ VTS được đánh dấu thời gian chuẩn UTC, bao gồm metadata: thiết bị, loại hệ thống, giá trị đo, trạng thái, ngưỡng.
- Tích hợp với các hệ thống: VTS điều hành (F-200), Radar (F-201), AIS (F-202), CCTV (F-203), SCADA (F-204), VHF (F-205), Truyền dẫn (F-206).

## Entities
- **DuLieuPhuTroVTS**: id, thietBi_id, loaiHeThong, giaTri, donViDo, trangThai, nguongCanhBao, thoiGianCapNhat, created_at
- **ThietBiPhuTroVTS**: id, tenThietBi, loaiHeThong, viTri, ipAddress, trangThaiHoatDong, created_at, updated_at
- **DanhSachIPWhitelist**: id, diaChiIP, moTa, created_by, created_at

## Business Rules
1. Dữ liệu phụ trợ VTS chỉ được chia sẻ qua trục LGSP đã được chứng nhận bảo mật quốc gia.
2. Chỉ những địa chỉ IP thuộc whitelist mới được phép tiếp nhận và gửi dữ liệu phụ trợ VTS.
3. Dữ liệu phụ trợ VTS phải được đánh dấu thời gian chuẩn UTC với độ chính xác tối thiểu 1 giây.
4. Cảnh báo sự cố phụ trợ VTS nghiêm trọng (mất điện, quá nhiệt, cháy) phải được ưu tiên phân phối trong vòng 2 giây.
5. Mọi truy vấn và chia sẻ dữ liệu phụ trợ VTS phải được ghi nhận log đầy đủ để phục vụ truy vết và phân tích vận hành.

## Testing Strategy
- Test tích hợp: Xác thực end-to-end việc chia sẻ dữ liệu phụ trợ VTS qua trục LGSP với dữ liệu mẫu từ các hệ thống hạ tầng.
- Test bảo mật: Kiểm tra JWT token hết hạn, IP không thuộc whitelist bị từ chối.
- Test hiệu năng: Đo thời gian phân phối dữ liệu phụ trợ VTS (mục tiêu <10 giây), cảnh báo sự cố <2 giây.
- Test validate schema: Đảm bảo dữ liệu phụ trợ VTS tuân thủ schema chuẩn ngành giao thông đường thủy.
- Test hồi quy: Đảm bảo các tính năng chia sẻ trước đó vẫn hoạt động đúng.
