---
id: F-201
name: "Chia sẻ KCHTGT Trạm Radar"
slug: chia-se-kchtgt-tram-radar
module-id: M-018
status: proposed
classification: local
priority: critical
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Chia sẻ KCHTGT Trạm Radar

## Description
Chia sẻ dữ liệu từ các trạm Radar giám sát giao thông đường thủy bao gồm thông tin phát hiện tàu thuyền, vị trí, tốc độ, hướng di chuyển và các cảnh báo va chạm tiềm năng. Dữ liệu radar được chuẩn hóa và phân phối qua trục LGSP đến các hệ thống điều hành, báo cáo và hỗ trợ ra quyết định.

## Business Intent
Tính năng cho phép chia sẻ thông tin quan trắc radar một cách đồng bộ, chính xác đến toàn bộ các bên liên quan trong hệ thống quản lý giao thông đường thủy, hỗ trợ công tác giám sát, cảnh báo và chỉ đạo điều hành tàu thuyền qua lại vùng biển, cảng biển và khu vực ven bờ.

## Flow Summary
Dữ liệu radar được thu thập tự động từ các trạm Radar dọc theo tuyến hàng hải và vùng biển trọng điểm, sau đó được chuyển vào hệ thống xử lý trung tâm để chuẩn hóa định dạng và lọc nhiễu. Dữ liệu đã được xử lý được chia sẻ qua trục LGSP (RESTful API, JSON, HTTPS) đến các hệ thống đích như Trung tâm VTS, hệ thống AIS, SCADA và các đơn vị quản lý liên quan. Quy trình bao gồm xác thực JWT, kiểm tra IP whitelist và ghi nhận log giao dịch để đảm bảo an ninh, truy vết.

## Acceptance Criteria
1. Dữ liệu quan trắc Radar từ các trạm được chia sẻ thành công qua trục LGSP với định dạng JSON trên HTTPS.
2. Hệ thống xác thực JWT và kiểm tra IP whitelist đúng quy định cho mọi yêu cầu tiếp nhận dữ liệu radar.
3. Dữ liệu radar được phân phối đến các hệ thống đích trong vòng 10 giây sau khi thu thập từ trạm.
4. Thông tin phát hiện tàu thuyền bao gồm đầy đủ: vị trí (tọa độ), tốc độ, hướng di chuyển, mã tàu (MMSI/SIG).
5. Lỗi thu thập hoặc chia sẻ dữ liệu radar được ghi nhận log và gửi cảnh báo đến quản trị viên.

## In Scope
- Chia sẻ dữ liệu quan trắc Radar qua trục LGSP (RESTful API, JSON, HTTPS)
- Xác thực JWT và IP whitelist
- Chuẩn hóa định dạng dữ liệu radar
- Phân phối đến các hệ thống đích
- Ghi nhận log và cảnh báo lỗi

## Out of Scope
- Điều khiển trực tiếp trạm Radar (chỉ chia sẻ dữ liệu đã thu thập)
- Xử lý tín hiệu radar thô ở cấp độ phần cứng
- Tích hợp với hệ thống Radar hiện có — chỉ chia sẻ dữ liệu sau xử lý

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người quan sát | Xem dữ liệu Radar đã công khai |
| Vận hành Radar | Xem, tiếp nhận dữ liệu Radar từ các trạm; xuất báo cáo |
| Quản trị viên | Xem, cấu hình trạm Radar; quản lý IP whitelist; xóa dữ liệu |

## Architecture Notes
- Tương tác qua trục LGSP sử dụng RESTful API chuẩn với dữ liệu JSON trên kênh HTTPS.
- Xác thực sử dụng JWT token kết hợp với danh sách IP whitelist.
- Dữ liệu radar được đánh dấu thời gian chuẩn UTC và bao gồm metadata: id trạm, độ chính xác, chế độ hoạt động.
- Tích hợp với các hệ thống: VTS điều hành (F-200), AIS (F-202), CCTV (F-203), SCADA (F-204), VHF (F-205), Truyền dẫn (F-206), Phụ trợ VTS (F-207).

## Entities
- **DuLieuRadar**: id, tramRadar_id, toaDo_x, toaDo_y, tocDo, huongDiChuyen, maTau, trangThai, thoiGianThuThap, created_at
- **TramRadar**: id, tenTram, viTri, trangThaiHoatDong, ipAddress, created_at, updated_at
- **DanhSachIPWhitelist**: id, diaChiIP, moTa, created_by, created_at

## Business Rules
1. Dữ liệu radar chỉ được chia sẻ qua trục LGSP đã được chứng nhận bảo mật quốc gia.
2. Chỉ những địa chỉ IP thuộc whitelist mới được phép tiếp nhận dữ liệu radar.
3. Dữ liệu radar phải được đánh dấu thời gian chuẩn UTC với độ chính xác tối thiểu 1 giây.
4. Thông tin phát hiện tàu thuyền có tốc độ vượt ngưỡng cảnh báo phải được ưu tiên phân phối trong vòng 3 giây.
5. Mọi truy vấn và chia sẻ dữ liệu radar phải được ghi nhận log đầy đủ để phục vụ truy vết.

## Testing Strategy
- Test tích hợp: Xác thực end-to-end việc chia sẻ dữ liệu Radar qua trục LGSP với dữ liệu thu thập mẫu từ trạm.
- Test bảo mật: Kiểm tra JWT token hết hạn, IP không thuộc whitelist bị từ chối.
- Test hiệu năng: Đo thời gian phân phối dữ liệu radar (mục tiêu <10 giây).
- Test validate schema: Đảm bảo dữ liệu radar tuân thủ schema chuẩn ngành giao thông đường thủy.
- Test hồi quy: Đảm bảo các tính năng chia sẻ trước đó vẫn hoạt động đúng.
