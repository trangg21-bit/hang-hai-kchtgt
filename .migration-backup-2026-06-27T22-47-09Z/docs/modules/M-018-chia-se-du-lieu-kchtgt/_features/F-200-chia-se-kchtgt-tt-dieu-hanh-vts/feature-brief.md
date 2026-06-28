---
id: F-200
name: "Chia sẻ KCHTGT thông tin điều hành VTS"
slug: chia-se-kchtgt-tt-dieu-hanh-vts
module-id: M-018
status: proposed
classification: local
priority: critical
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Chia sẻ KCHTGT thông tin điều hành VTS

## Description
Chia sẻ thông tin, dữ liệu về cơ sở hạ tầng kỹ thuật công nghệ giao thông phục vụ điều hành hệ thống VTS (Vessel Traffic Service) bao gồm các nguồn tin tức, thông báo an toàn hàng hải, cảnh báo thời tiết, thông tin luồng lạch và các chỉ thị điều hành từ Trung tâm VTS đến các bên liên quan thông qua giao thức chuẩn hóa.

## Business Intent
Tính năng cho phép chia sẻ thông tin điều hành VTS một cách thống nhất, kịp thời đến toàn bộ hệ sinh thái hàng hải nhằm nâng cao hiệu quả quản lý giao thông đường thủy, đảm bảo an toàn cho tàu thuyền và hỗ trợ công tác chỉ đạo điều hành của cơ quan quản lý nhà nước về giao thông đường thủy.

## Flow Summary
Dữ liệu điều hành VTS được thu thập từ các nguồn thông tin nội bộ (trạm quan trắc, hệ thống cảnh báo, các đài VTS vùng) và được tổng hợp, chuẩn hóa qua API RESTful trên trục LGSP. Người dùng có thể truy cập và chia sẻ thông tin theo vai trò, cấp độ bảo mật. Dữ liệu sau khi được xác thực sẽ được phân phối tự động đến các hệ thống con liên quan (Radar, AIS, CCTV, SCADA, truyền dẫn, VHF, phụ trợ) thông qua cơ chế subscribe/publish, đảm bảo tính nhất quán và độ trễ thấp.

## Acceptance Criteria
1. Dữ liệu điều hành VTS được chia sẻ thành công qua trục LGSP với định dạng JSON trên giao thức HTTPS.
2. Hệ thống xác thực JWT và kiểm tra IP whitelist đúng quy định bảo mật cho mọi yêu cầu chia sẻ.
3. Các hệ thống con (Radar, AIS, CCTV, SCADA, VHF, truyền dẫn, phụ trợ) nhận được thông tin điều hành VTS trong vòng 5 giây sau khi đăng tải.
4. Lỗi chia sẻ được ghi nhận vào log hệ thống và gửi cảnh báo đến quản trị viên.
5. Người dùng có thể xem, lọc, tìm kiếm thông tin điều hành VTS theo ngày, vùng, loại tin tức.

## In Scope
- Chia sẻ thông tin điều hành VTS qua trục LGSP (RESTful API, JSON, HTTPS)
- Xác thực JWT và IP whitelist
- Phân phối thông tin đến các hệ thống con
- Ghi nhận log và cảnh báo lỗi
- Giao diện xem, lọc, tìm kiếm thông tin điều hành

## Out of Scope
- Quản lý nhân sự và phân quyền chi tiết (nằm ở M-010)
- Tích hợp với hệ thống VTS hiện có (chỉ chia sẻ dữ liệu chuẩn hóa)
- Xử lý dữ liệu thời gian thực (real-time streaming) — chỉ chia sẻ theo batch

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người quan sát | Xem thông tin điều hành VTS |
| Điều hành viên | Xem, tạo, cập nhật thông tin điều hành VTS |
| Quản trị viên | Xem, tạo, cập nhật, xóa thông tin điều hành VTS; quản lý IP whitelist |

## Architecture Notes
- Tương tác qua trục LGSP (Local Government Service Platform) sử dụng RESTful API chuẩn.
- Dữ liệu truyền tải ở định dạng JSON trên kênh mã hóa HTTPS.
- Xác thực sử dụng JWT token kết hợp với danh sách IP whitelist.
- Dữ liệu được đánh dấu thời gian chuẩn UTC, hỗ trợ tìm kiếm theo khoảng thời gian.
- Tích hợp với các hệ thống: Radar (F-201), AIS (F-202), CCTV (F-203), SCADA (F-204), VHF (F-205), Truyền dẫn (F-206), Phụ trợ VTS (F-207).

## Entities
- **ThongTinDieuHanhVTS**: id, tieuDe, noiDung, loaiThongTin, vungBien, nguonTin, trangThai, created_by, created_at, updated_at
- **DanhSachIPWhitelist**: id, diaChiIP, moTa, created_by, created_at

## Business Rules
1. Thông tin điều hành VTS chỉ được chia sẻ qua trục LGSP đã được chứng nhận bảo mật.
2. Chỉ những địa chỉ IP thuộc whitelist mới được phép tiếp nhận và gửi dữ liệu chia sẻ.
3. Mọi thay đổi về thông tin điều hành phải được ghi nhận log đầy đủ người thực hiện và thời điểm.
4. Thông tin khẩn cấp phải được ưu tiên phân phối đến tất cả các hệ thống con trong vòng 2 giây.
5. Dữ liệu chia sẻ phải tuân thủ định dạng chuẩn JSON quy định tại thông tư về trao đổi dữ liệu ngành giao thông.

## Testing Strategy
- Test tích hợp: Xác thực end-to-end việc chia sẻ thông tin qua trục LGSP với dữ liệu mẫu.
- Test bảo mật: Kiểm tra JWT token hết hạn, IP không thuộc whitelist bị từ chối truy cập.
- Test hiệu năng: Đo thời gian phân phối thông tin đến các hệ thống con (mục tiêu <5 giây).
- Test đơn vị: Kiểm tra các hàm chuyển đổi định dạng dữ liệu, validate schema JSON.
- Test hồi quy: Đảm bảo các tính năng chia sẻ trước đó vẫn hoạt động sau khi cập nhật.
