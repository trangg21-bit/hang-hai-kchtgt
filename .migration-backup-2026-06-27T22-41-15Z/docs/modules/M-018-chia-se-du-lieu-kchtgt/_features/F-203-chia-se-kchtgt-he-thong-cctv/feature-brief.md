---
id: F-203
name: "Chia sẻ KCHTGT Hệ thống CCTV"
slug: chia-se-kchtgt-he-thong-cctv
module-id: M-018
status: proposed
classification: local
priority: critical
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Chia sẻ KCHTGT Hệ thống CCTV

## Description
Chia sẻ dữ liệu hình ảnh và video từ hệ thống Camera quan sát (CCTV) bao gồm các trạm camera giám sát giao thông đường thủy, cảng biển, khu vực cảng, vùng biển trọng điểm. Dữ liệu video được chuyển đổi thành metadata và thông tin sự kiện để chia sẻ qua trục LGSP, hỗ trợ giám sát trực quan và phân tích sự kiện.

## Business Intent
Tính năng cho phép chia sẻ thông tin giám sát trực quan từ hệ thống CCTV một cách đồng bộ đến các bên liên quan trong hệ thống quản lý giao thông đường thủy, hỗ trợ công tác giám sát an ninh, phát hiện sự cố, hỗ trợ tìm kiếm cứu nạn và phân tích hành vi giao thông trên các tuyến hàng hải và khu vực cảng biển.

## Flow Summary
Dữ liệu video từ các trạm CCTV được thu thập và chuyển đổi thành các sự kiện (event-based metadata) bao gồm: loại sự kiện (xe/cá nhân vượt biên, tàu不按 quy định, phát hiện khói/lửa...), vị trí camera, thời gian, đường dẫn video lưu trữ. Các sự kiện được chuẩn hóa và chia sẻ qua trục LGSP (RESTful API, JSON, HTTPS) đến các hệ thống giám sát, điều hành và báo cáo. Quy trình bao gồm xác thực JWT, kiểm tra IP whitelist, ghi nhận log và cơ chế stream video theo yêu cầu.

## Acceptance Criteria
1. Dữ liệu sự kiện CCTV từ các trạm quan sát được chia sẻ thành công qua trục LGSP với định dạng JSON trên HTTPS.
2. Hệ thống xác thực JWT và kiểm tra IP whitelist đúng quy định cho mọi yêu cầu tiếp nhận dữ liệu CCTV.
3. Metadata sự kiện CCTV bao gồm đầy đủ: loại sự kiện, vị trí camera, thời gian, đường dẫn video lưu trữ, độ tin cậy phát hiện.
4. Dữ liệu sự kiện CCTV được phân phối đến các hệ thống đích trong vòng 3 giây sau khi phát hiện.
5. Video theo yêu cầu (on-demand) được cung cấp thông qua URL bảo mật có thời hạn.

## In Scope
- Chia sẻ metadata và sự kiện CCTV qua trục LGSP (RESTful API, JSON, HTTPS)
- Xác thực JWT và IP whitelist
- Chuyển đổi dữ liệu video thành event-based metadata
- Cung cấp URL video on-demand bảo mật có thời hạn
- Ghi nhận log và cảnh báo lỗi

## Out of Scope
- Lưu trữ video dài hạn (chỉ cung cấp metadata và URL tham chiếu)
- Điều khiển trực tiếp camera PTZ (pan-tilt-zoom)
- Xử lý hình ảnh/video ở cấp độ AI/ML nhận diện (chỉ chia sẻ metadata sự kiện)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người quan sát | Xem danh sách sự kiện CCTV đã công khai |
| Giám sát | Xem video trực tiếp và video lưu trữ theo URL; xem chi tiết sự kiện |
| Quản trị viên | Xem, cấu hình camera; quản lý IP whitelist; xóa sự kiện |

## Architecture Notes
- Tương tác qua trục LGSP sử dụng RESTful API chuẩn với metadata JSON trên kênh HTTPS.
- Xác thực sử dụng JWT token kết hợp với danh sách IP whitelist.
- Video on-demand được cung cấp qua URL bảo mật có thời hạn (token-based access).
- Dữ liệu sự kiện CCTV được đánh dấu thời gian chuẩn UTC.
- Tích hợp với các hệ thống: VTS điều hành (F-200), Radar (F-201), AIS (F-202), SCADA (F-204), VHF (F-205), Truyền dẫn (F-206), Phụ trợ VTS (F-207).

## Entities
- **SuKienCCTV**: id, camera_id, loaiSuKien, viTri, thoiGianPhatHien, duongDanVideo, doTinCay, trangThai, created_at
- **CameraCCTV**: id, tenCamera, viTri, loaiCamera, ipCamera, trangThaiHoatDong, created_at, updated_at
- **DanhSachIPWhitelist**: id, diaChiIP, moTa, created_by, created_at

## Business Rules
1. Dữ liệu sự kiện CCTV chỉ được chia sẻ qua trục LGSP đã được chứng nhận bảo mật quốc gia.
2. Chỉ những địa chỉ IP thuộc whitelist mới được phép tiếp nhận và truy vấn dữ liệu CCTV.
3. URL video on-demand phải có thời hạn sử dụng tối đa 30 phút và bị vô hiệu hóa sau khi sử dụng.
4. Sự kiện CCTV thuộc cấp độ khẩn cấp phải được ưu tiên phân phối đến tất cả hệ thống đích trong vòng 1 giây.
5. Mọi truy vấn video và sự kiện CCTV phải được ghi nhận log đầy đủ để phục vụ truy vết và kiểm toán.

## Testing Strategy
- Test tích hợp: Xác thực end-to-end việc chia sẻ metadata sự kiện CCTV qua trục LGSP với dữ liệu mẫu.
- Test bảo mật: Kiểm tra JWT token hết hạn, IP không thuộc whitelist bị từ chối, URL video hết hạn bị từ chối.
- Test hiệu năng: Đo thời gian phân phối metadata sự kiện CCTV (mục tiêu <3 giây).
- Test on-demand video: Xác nhận URL video có thời hạn và bị vô hiệu hóa sau khi hết hạn.
- Test hồi quy: Đảm bảo các tính năng chia sẻ trước đó vẫn hoạt động đúng.
