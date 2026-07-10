---
id: F-204
name: "Chia sẻ KCHTGT Hệ thống SCADA"
slug: chia-se-kchtgt-he-thong-scada
module-id: M-018
status: proposed
classification: local
priority: critical
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Chia sẻ KCHTGT Hệ thống SCADA

## Description
Chia sẻ dữ liệu từ hệ thống SCADA (Supervisory Control and Data Acquisition) bao gồm thông tin giám sát và điều khiển từ xa các thiết bị hạ tầng giao thông đường thủy như đèn biển, phao tiêu, cửa đập, trạm bơm, hệ thống thông tin liên lạc. Dữ liệu SCADA được chuẩn hóa và phân phối qua trục LGSP đến các hệ thống điều hành, báo cáo và hỗ trợ ra quyết định.

## Business Intent
Tính năng cho phép chia sẻ thông tin vận hành và trạng thái thiết bị từ hệ thống SCADA một cách đồng bộ, hỗ trợ công tác giám sát, điều khiển từ xa và bảo trì dự phòng các thiết bị hạ tầng giao thông đường thủy, góp phần nâng cao độ tin cậy và an toàn của hệ thống hạ tầng kỹ thuật công nghệ giao thông.

## Flow Summary
Dữ liệu SCADA được thu thập tự động từ các trạm điều khiển và thiết bị đo lường dọc theo hệ thống hạ tầng giao thông đường thủy (đèn biển, phao tiêu, cửa đập, trạm bơm, hệ thống thông tin), sau đó được chuyển vào hệ thống xử lý trung tâm để chuẩn hóa định dạng, lọc nhiễu và tính toán các chỉ số vận hành. Dữ liệu đã được xử lý được chia sẻ qua trục LGSP (RESTful API, JSON, HTTPS) đến các hệ thống đích như Trung tâm VTS, hệ thống báo cáo, các đơn vị vận hành và bảo trì. Quy trình bao gồm xác thực JWT, kiểm tra IP whitelist và ghi nhận log giao dịch.

## Acceptance Criteria
1. Dữ liệu SCADA từ các trạm điều khiển được chia sẻ thành công qua trục LGSP với định dạng JSON trên HTTPS.
2. Hệ thống xác thực JWT và kiểm tra IP whitelist đúng quy định cho mọi yêu cầu tiếp nhận dữ liệu SCADA.
3. Dữ liệu SCADA bao gồm đầy đủ: tên thiết bị, loại thiết bị, giá trị đo lường, trạng thái, ngưỡng cảnh báo, thời gian cập nhật.
4. Dữ liệu SCADA được phân phối đến các hệ thống đích trong vòng 10 giây sau khi thu thập.
5. Cảnh báo từ thiết bị SCADA được ưu tiên phân phối đến các hệ thống liên quan trong vòng 2 giây.

## In Scope
- Chia sẻ dữ liệu SCADA qua trục LGSP (RESTful API, JSON, HTTPS)
- Xác thực JWT và IP whitelist
- Chuẩn hóa định dạng dữ liệu SCADA (tag-based metadata)
- Phân phối đến các hệ thống đích
- Ghi nhận log và cảnh báo lỗi

## Out of Scope
- Điều khiển trực tiếp thiết bị SCADA (chỉ chia sẻ dữ liệu đã thu thập)
- Xử lý tín hiệu analog/digital ở cấp độ PLC/RTU
- Tích hợp với hệ thống SCADA hiện có — chỉ chia sẻ dữ liệu sau chuẩn hóa

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người quan sát | Xem dữ liệu SCADA đã công khai (giá trị đo, trạng thái) |
| Vận hành SCADA | Xem, tiếp nhận dữ liệu SCADA; xuất báo cáo vận hành |
| Quản trị viên | Xem, cấu hình thiết bị SCADA; quản lý IP whitelist; xóa dữ liệu |

## Architecture Notes
- Tương tác qua trục LGSP sử dụng RESTful API chuẩn với dữ liệu JSON trên kênh HTTPS.
- Xác thực sử dụng JWT token kết hợp với danh sách IP whitelist.
- Dữ liệu SCADA được đánh dấu thời gian chuẩn UTC, bao gồm metadata: id thiết bị, loại tag, đơn vị đo, giá trị, trạng thái.
- Tích hợp với các hệ thống: VTS điều hành (F-200), Radar (F-201), AIS (F-202), CCTV (F-203), VHF (F-205), Truyền dẫn (F-206), Phụ trợ VTS (F-207).

## Entities
- **DuLieuSCADA**: id, thietBi_id, tenThietBi, loaiThietBi, giaTri, donViDo, trangThai, nguongCanhBao, thoiGianCapNhat, created_at
- **ThietBiSCADA**: id, tenThietBi, loaiThietBi, viTri, ipDevice, trangThaiHoatDong, created_at, updated_at
- **DanhSachIPWhitelist**: id, diaChiIP, moTa, created_by, created_at

## Business Rules
1. Dữ liệu SCADA chỉ được chia sẻ qua trục LGSP đã được chứng nhận bảo mật quốc gia.
2. Chỉ những địa chỉ IP thuộc whitelist mới được phép tiếp nhận và gửi dữ liệu SCADA.
3. Dữ liệu SCADA phải được đánh dấu thời gian chuẩn UTC với độ chính xác tối thiểu 1 giây.
4. Cảnh báo từ thiết bị SCADA khi vượt ngưỡng phải được ưu tiên phân phối trong vòng 2 giây.
5. Mọi truy vấn và chia sẻ dữ liệu SCADA phải được ghi nhận log đầy đủ để phục vụ truy vết và phân tích vận hành.

## Testing Strategy
- Test tích hợp: Xác thực end-to-end việc chia sẻ dữ liệu SCADA qua trục LGSP với dữ liệu đo mẫu từ thiết bị.
- Test bảo mật: Kiểm tra JWT token hết hạn, IP không thuộc whitelist bị từ chối.
- Test hiệu năng: Đo thời gian phân phối dữ liệu SCADA (mục tiêu <10 giây), cảnh báo SCADA <2 giây.
- Test validate schema: Đảm bảo dữ liệu SCADA tuân thủ schema chuẩn ngành giao thông đường thủy.
- Test hồi quy: Đảm bảo các tính năng chia sẻ trước đó vẫn hoạt động đúng.
