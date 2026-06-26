---
id: F-205
name: "Chia sẻ KCHTGT Hệ thống thông tin VHF"
slug: chia-se-kchtgt-he-thong-thong-tin-vhf
module-id: M-018
status: proposed
classification: local
priority: critical
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Chia sẻ KCHTGT Hệ thống thông tin VHF

## Description
Chia sẻ dữ liệu từ hệ thống thông tin liên lạc VHF (Very High Frequency) bao gồm thông tin tần số, kênh liên lạc, nội dung thông báo phát thanh, nhật ký giao tiếp, và trạng thái các trạm phát VHF dọc theo tuyến hàng hải. Dữ liệu VHF được chuẩn hóa và phân phối qua trục LGSP đến các hệ thống điều hành, báo cáo và hỗ trợ ra quyết định.

## Business Intent
Tính năng cho phép chia sẻ thông tin liên lạc VHF một cách thống nhất, hỗ trợ công tác chỉ đạo điều hành, cảnh báo và thông báo an toàn hàng hải đến các tàu thuyền qua hệ thống thông tin liên lạc VHF, góp phần nâng cao hiệu quả giao tiếp và đảm bảo an toàn trên các tuyến hàng hải, vùng biển và khu vực cảng biển.

## Flow Summary
Dữ liệu liên lạc VHF được thu thập tự động từ các đài VHF dọc theo tuyến hàng hải và vùng biển trọng điểm, bao gồm: tần số, kênh liên lạc, nội dung thông báo (văn bản hóa), nhật ký giao tiếp, trạng thái trạm phát. Dữ liệu đã được xử lý được chuẩn hóa thành định dạng JSON và chia sẻ qua trục LGSP đến các hệ thống đích như Trung tâm VTS, hệ thống thông tin điều hành và các đơn vị quản lý liên quan. Quy trình bao gồm xác thực JWT, kiểm tra IP whitelist và ghi nhận log giao dịch.

## Acceptance Criteria
1. Dữ liệu liên lạc VHF từ các đài phát được chia sẻ thành công qua trục LGSP với định dạng JSON trên HTTPS.
2. Hệ thống xác thực JWT và kiểm tra IP whitelist đúng quy định cho mọi yêu cầu tiếp nhận dữ liệu VHF.
3. Dữ liệu VHF bao gồm đầy đủ: tần số, kênh liên lạc, nội dung thông báo, thời gian phát, đài phát, trạng thái.
4. Dữ liệu VHF được phân phối đến các hệ thống đích trong vòng 5 giây sau khi thu thập.
5. Lỗi thu thập hoặc chia sẻ dữ liệu VHF được ghi nhận log và gửi cảnh báo đến quản trị viên.

## In Scope
- Chia sẻ dữ liệu liên lạc VHF qua trục LGSP (RESTful API, JSON, HTTPS)
- Xác thực JWT và IP whitelist
- Chuẩn hóa định dạng dữ liệu liên lạc VHF
- Phân phối đến các hệ thống đích
- Ghi nhận log và cảnh báo lỗi

## Out of Scope
- Điều khiển trực tiếp đài phát VHF (chỉ chia sẻ dữ liệu đã thu thập)
- Xử lý tín hiệu vô tuyến ở cấp độ vật lý hoặc tầng truyền dẫn
- Tích hợp với thiết bị VHF trên tàu — chỉ chia sẻ dữ liệu từ đài mặt đất

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người quan sát | Xem dữ liệu VHF đã công khai (thông báo, tần số) |
| Vận hành VHF | Xem, tiếp nhận dữ liệu VHF; xuất báo cáo liên lạc |
| Quản trị viên | Xem, cấu hình đài VHF; quản lý IP whitelist; xóa dữ liệu |

## Architecture Notes
- Tương tác qua trục LGSP sử dụng RESTful API chuẩn với dữ liệu JSON trên kênh HTTPS.
- Xác thực sử dụng JWT token kết hợp với danh sách IP whitelist.
- Dữ liệu VHF được đánh dấu thời gian chuẩn UTC, bao gồm metadata: đài phát, tần số, kênh, nội dung, trạng thái.
- Tích hợp với các hệ thống: VTS điều hành (F-200), Radar (F-201), AIS (F-202), CCTV (F-203), SCADA (F-204), Truyền dẫn (F-206), Phụ trợ VTS (F-207).

## Entities
- **DuLieuVHF**: id, daiPhat_id, tanSo, kenhLienLac, noiDungThongBao, thoiGianPhat, trangThai, created_at
- **DaiVHF**: id, tenDai, viTri, tanSo, trangThaiHoatDong, ipAddress, created_at, updated_at
- **DanhSachIPWhitelist**: id, diaChiIP, moTa, created_by, created_at

## Business Rules
1. Dữ liệu liên lạc VHF chỉ được chia sẻ qua trục LGSP đã được chứng nhận bảo mật quốc gia.
2. Chỉ những địa chỉ IP thuộc whitelist mới được phép tiếp nhận và gửi dữ liệu VHF.
3. Dữ liệu VHF phải được đánh dấu thời gian chuẩn UTC với độ chính xác tối thiểu 1 giây.
4. Thông báo khẩn cấp qua VHF phải được ưu tiên phân phối đến tất cả hệ thống đích trong vòng 2 giây.
5. Mọi truy vấn và chia sẻ dữ liệu VHF phải được ghi nhận log đầy đủ để phục vụ truy vết và kiểm toán liên lạc.

## Testing Strategy
- Test tích hợp: Xác thực end-to-end việc chia sẻ dữ liệu VHF qua trục LGSP với dữ liệu liên lạc mẫu.
- Test bảo mật: Kiểm tra JWT token hết hạn, IP không thuộc whitelist bị từ chối.
- Test hiệu năng: Đo thời gian phân phối dữ liệu VHF (mục tiêu <5 giây), thông báo khẩn cấp <2 giây.
- Test validate schema: Đảm bảo dữ liệu VHF tuân thủ schema chuẩn ngành giao thông đường thủy.
- Test hồi quy: Đảm bảo các tính năng chia sẻ trước đó vẫn hoạt động đúng.
