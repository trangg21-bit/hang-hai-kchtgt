---
id: F-206
name: "Chia sẻ KCHTGT Hệ thống truyền dẫn"
slug: chia-se-kchtgt-he-thong-truyen-dan
module-id: M-018
status: proposed
classification: local
priority: critical
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Chia sẻ KCHTGT Hệ thống truyền dẫn

## Description
Chia sẻ dữ liệu từ hệ thống truyền dẫn (transmission system) bao gồm thông tin trạng thái đường truyền, băng thông, chất lượng liên lạc, các trạm trung繼, thiết bị truyền dẫn quang và vô tuyến dọc theo hệ thống hạ tầng giao thông đường thủy. Dữ liệu truyền dẫn được chuẩn hóa và phân phối qua trục LGSP đến các hệ thống điều hành, giám sát và hỗ trợ bảo trì.

## Business Intent
Tính năng cho phép chia sẻ thông tin về trạng thái và chất lượng hệ thống truyền dẫn một cách đồng bộ, hỗ trợ công tác giám sát, phát hiện sự cố và bảo trì dự phòng hạ tầng truyền dẫn phục vụ hệ thống giao thông đường thủy, góp phần đảm bảo tính liên tục và độ tin cậy của toàn bộ mạng lưới truyền thông trong ngành.

## Flow Summary
Dữ liệu truyền dẫn được thu thập tự động từ các thiết bị và trạm trung继 truyền dẫn (cáp quang, vô tuyến microwave, vệ tinh) dọc theo hệ thống hạ tầng giao thông đường thủy, bao gồm: trạng thái kết nối, băng thông sử dụng, chất lượng tín hiệu, tỷ lệ lỗi, thời gian hoạt động. Dữ liệu đã được xử lý được chuẩn hóa thành định dạng JSON và chia sẻ qua trục LGSP đến các hệ thống đích như Trung tâm VTS, hệ thống quản lý hạ tầng và các đơn vị vận hành. Quy trình bao gồm xác thực JWT, kiểm tra IP whitelist và ghi nhận log giao dịch.

## Acceptance Criteria
1. Dữ liệu truyền dẫn từ các trạm trung继 được chia sẻ thành công qua trục LGSP với định dạng JSON trên HTTPS.
2. Hệ thống xác thực JWT và kiểm tra IP whitelist đúng quy định cho mọi yêu cầu tiếp nhận dữ liệu truyền dẫn.
3. Dữ liệu truyền dẫn bao gồm đầy đủ: tên thiết bị, loại đường truyền, trạng thái kết nối, băng thông, chất lượng tín hiệu, tỷ lệ lỗi, thời gian cập nhật.
4. Dữ liệu truyền dẫn được phân phối đến các hệ thống đích trong vòng 10 giây sau khi thu thập.
5. Cảnh báo sự cố truyền dẫn được ưu tiên phân phối đến các hệ thống liên quan trong vòng 2 giây.

## In Scope
- Chia sẻ dữ liệu truyền dẫn qua trục LGSP (RESTful API, JSON, HTTPS)
- Xác thực JWT và IP whitelist
- Chuẩn hóa định dạng dữ liệu truyền dẫn (cáp quang, vô tuyến, vệ tinh)
- Phân phối đến các hệ thống đích
- Ghi nhận log và cảnh báo lỗi

## Out of Scope
- Điều khiển trực tiếp thiết bị truyền dẫn (chỉ chia sẻ dữ liệu đã thu thập)
- Xử lý tín hiệu truyền dẫn ở cấp độ vật lý (layer 1)
- Tích hợp với hệ thống truyền dẫn hiện có — chỉ chia sẻ dữ liệu sau chuẩn hóa

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người quan sát | Xem dữ liệu truyền dẫn đã công khai (trạng thái, băng thông) |
| Vận hành truyền dẫn | Xem, tiếp nhận dữ liệu truyền dẫn; xuất báo cáo chất lượng |
| Quản trị viên | Xem, cấu hình thiết bị truyền dẫn; quản lý IP whitelist; xóa dữ liệu |

## Architecture Notes
- Tương tác qua trục LGSP sử dụng RESTful API chuẩn với dữ liệu JSON trên kênh HTTPS.
- Xác thực sử dụng JWT token kết hợp với danh sách IP whitelist.
- Dữ liệu truyền dẫn được đánh dấu thời gian chuẩn UTC, bao gồm metadata: thiết bị, loại đường truyền, trạng thái, băng thông, chất lượng.
- Tích hợp với các hệ thống: VTS điều hành (F-200), Radar (F-201), AIS (F-202), CCTV (F-203), SCADA (F-204), VHF (F-205), Phụ trợ VTS (F-207).

## Entities
- **DuLieuTruyenDan**: id, thietBi_id, loaiDuongTruyen, trangThaiKetNoi, banGhong, chatLuongTinHieu, tyLeLoi, thoiGianCapNhat, created_at
- **ThietBiTruyenDan**: id, tenThietBi, loaiThietBi, viTri, ipAddress, trangThaiHoatDong, created_at, updated_at
- **DanhSachIPWhitelist**: id, diaChiIP, moTa, created_by, created_at

## Business Rules
1. Dữ liệu truyền dẫn chỉ được chia sẻ qua trục LGSP đã được chứng nhận bảo mật quốc gia.
2. Chỉ những địa chỉ IP thuộc whitelist mới được phép tiếp nhận và gửi dữ liệu truyền dẫn.
3. Dữ liệu truyền dẫn phải được đánh dấu thời gian chuẩn UTC với độ chính xác tối thiểu 1 giây.
4. Cảnh báo sự cố truyền dẫn (mất kết nối, giảm chất lượng nghiêm trọng) phải được ưu tiên phân phối trong vòng 2 giây.
5. Mọi truy vấn và chia sẻ dữ liệu truyền dẫn phải được ghi nhận log đầy đủ để phục vụ truy vết và phân tích chất lượng.

## Testing Strategy
- Test tích hợp: Xác thực end-to-end việc chia sẻ dữ liệu truyền dẫn qua trục LGSP với dữ liệu mẫu từ thiết bị truyền dẫn.
- Test bảo mật: Kiểm tra JWT token hết hạn, IP không thuộc whitelist bị từ chối.
- Test hiệu năng: Đo thời gian phân phối dữ liệu truyền dẫn (mục tiêu <10 giây), cảnh báo sự cố <2 giây.
- Test validate schema: Đảm bảo dữ liệu truyền dẫn tuân thủ schema chuẩn ngành giao thông đường thủy.
- Test hồi quy: Đảm bảo các tính năng chia sẻ trước đó vẫn hoạt động đúng.
