---
id: F-202
name: "Chia sẻ KCHTGT Hệ thống AIS"
slug: chia-se-kchtgt-he-thong-ais
module-id: M-018
status: proposed
classification: local
priority: critical
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Chia sẻ KCHTGT Hệ thống AIS

## Description
Chia sẻ dữ liệu từ hệ thống AIS (Automatic Identification System) bao gồm thông tin nhận dạng tàu thuyền tự động, vị trí GPS, tốc độ, hướng di chuyển, loại tàu, điểm xuất phát và điểm đến. Dữ liệu AIS được chuẩn hóa và phân phối qua trục LGSP đến các hệ thống giám sát giao thông đường thủy và các cơ quan quản lý liên quan.

## Business Intent
Tính năng cho phép chia sẻ thông tin nhận dạng và theo dõi tàu thuyền tự động từ hệ thống AIS một cách thống nhất, hỗ trợ công tác giám sát, quản lý luồng tàu, cảnh báo va chạm và hỗ trợ công tác tìm kiếm cứu nạn trên các tuyến hàng hải, vùng biển và khu vực cảng biển.

## Flow Summary
Dữ liệu AIS được thu thập tự động từ các trạm tiếp nhận AIS dọc theo tuyến hàng hải và vùng biển trọng điểm, sau đó được chuyển vào hệ thống xử lý trung tâm để chuẩn hóa, kết hợp với dữ liệu radar và các nguồn khác. Dữ liệu đã được xử lý được chia sẻ qua trục LGSP (RESTful API, JSON, HTTPS) đến các hệ thống đích như Trung tâm VTS, hệ thống SCADA, CCTV và các đơn vị quản lý liên quan. Quy trình bao gồm xác thực JWT, kiểm tra IP whitelist và ghi nhận log giao dịch.

## Acceptance Criteria
1. Dữ liệu AIS từ các trạm tiếp nhận được chia sẻ thành công qua trục LGSP với định dạng JSON trên HTTPS.
2. Hệ thống xác thực JWT và kiểm tra IP whitelist đúng quy định cho mọi yêu cầu tiếp nhận dữ liệu AIS.
3. Thông tin nhận dạng tàu thuyền bao gồm đầy đủ: MMSI, tên tàu, loại tàu, vị trí GPS, tốc độ, hướng di chuyển, điểm đi/đến.
4. Dữ liệu AIS được phân phối đến các hệ thống đích trong vòng 5 giây sau khi tiếp nhận.
5. Lỗi tiếp nhận hoặc chia sẻ dữ liệu AIS được ghi nhận log và gửi cảnh báo đến quản trị viên.

## In Scope
- Chia sẻ dữ liệu AIS qua trục LGSP (RESTful API, JSON, HTTPS)
- Xác thực JWT và IP whitelist
- Chuẩn hóa định dạng dữ liệu AIS theo chuẩn IMO
- Phân phối đến các hệ thống đích
- Ghi nhận log và cảnh báo lỗi

## Out of Scope
- Vận hành trực tiếp trạm tiếp nhận AIS (chỉ chia sẻ dữ liệu đã tiếp nhận)
- Xử lý tín hiệu AIS ở cấp độ phần cứng hoặc tầng vật lý
- Tích hợp với thiết bị AIS trên tàu — chỉ chia sẻ dữ liệu từ trạm tiếp nhận đất liền

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người quan sát | Xem dữ liệu AIS đã công khai |
| Vận hành AIS | Xem, tiếp nhận dữ liệu AIS; xuất báo cáo theo dõi tàu |
| Quản trị viên | Xem, cấu hình trạm AIS; quản lý IP whitelist; xóa dữ liệu |

## Architecture Notes
- Tương tác qua trục LGSP sử dụng RESTful API chuẩn với dữ liệu JSON trên kênh HTTPS.
- Xác thực sử dụng JWT token kết hợp với danh sách IP whitelist.
- Dữ liệu AIS được đánh dấu thời gian chuẩn UTC, tuân thủ chuẩn IMO AIS Performance Standards.
- Tích hợp với các hệ thống: VTS điều hành (F-200), Radar (F-201), CCTV (F-203), SCADA (F-204), VHF (F-205), Truyền dẫn (F-206), Phụ trợ VTS (F-207).

## Entities
- **DuLieuAIS**: id, mmsi, tenTau, loaiTau, toaDo_x, toaDo_y, tocDo, huongDiChuyen, diemXuatPhat, diemDen, trangThai, thoiGianGanNhat, created_at
- **TramAIS**: id, tenTram, viTri, trangThaiHoatDong, ipAddress, created_at, updated_at
- **DanhSachIPWhitelist**: id, diaChiIP, moTa, created_by, created_at

## Business Rules
1. Dữ liệu AIS chỉ được chia sẻ qua trục LGSP đã được chứng nhận bảo mật quốc gia.
2. Chỉ những địa chỉ IP thuộc whitelist mới được phép tiếp nhận và gửi dữ liệu AIS.
3. Dữ liệu AIS phải tuân thủ chuẩn thông tin AIS của Tổ chức Hàng hải Quốc tế (IMO).
4. Thông tin tàu thuyền mất tín hiệu AIS quá 30 phút phải được cảnh báo đến VTS điều hành.
5. Mọi truy vấn và chia sẻ dữ liệu AIS phải được ghi nhận log đầy đủ để phục vụ truy vết và phân tích.

## Testing Strategy
- Test tích hợp: Xác thực end-to-end việc chia sẻ dữ liệu AIS qua trục LGSP với dữ liệu mẫu chuẩn IMO.
- Test bảo mật: Kiểm tra JWT token hết hạn, IP không thuộc whitelist bị từ chối.
- Test hiệu năng: Đo thời gian phân phối dữ liệu AIS (mục tiêu <5 giây).
- Test validate schema: Đảm bảo dữ liệu AIS tuân thủ schema chuẩn IMO AIS Performance Standards.
- Test hồi quy: Đảm bảo các tính năng chia sẻ trước đó vẫn hoạt động đúng.
