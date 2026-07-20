---
id: F-217
name: Chia sẻ KCHTGT thông tin tài sản KCHTGT HH
slug: chia-se-kchtgt-thong-tin-tai-san-kchtgt-hh
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT thông tin tài sản KCHTGT HH

## Description
Chia sẻ dữ liệu và thông tin kỹ thuật của toàn bộ tài sản thuộc hệ thống KCHTGT Hàng hải (KCHTGT Hàng hải) thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông, bao gồm thông tin đăng ký, định vị, giá trị, tuổi thọ, tình trạng và lịch sử bảo trì của từng loại tài sản (đài vô tuyến, hệ thống tiêu dẫn, sensor quan trắc, thiết bị viễn thông), phục vụ quản lý và khai thác tài sản nhà nước về giao thông đường biển.

## Business Intent
Tài sản KCHTGT Hàng hải là cơ sở hạ tầng trọng điểm của quốc gia, có giá trị đầu tư lớn và vai trò chiến lược trong bảo đảm an toàn hàng hải và phát triển giao thông vận tải. Việc chia sẻ thông tin tài sản KCHTGT giúp cơ quan quản lý nhà nước có cái nhìn tổng quan về tình trạng tài sản, hỗ trợ công tác lập kế hoạch đầu tư, bảo trì, thanh lý và tối ưu hóa khai thác, đồng thời đáp ứng yêu cầu báo cáo tài sản nhà nước.

## Flow Summary
Dữ liệu KCHTGT tài sản hàng hải được thu thập từ hệ thống quản lý tài sản, đăng ký nhà nước và báo cáo kiểm kê, bao gồm thông tin đăng ký, vị trí, giá trị, tuổi thọ và tình trạng. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các cơ quan quản lý tài sản nhà nước, đơn vị chủ quản, cơ quan kiểm toán và hệ thống quản lý tài sản công.

## Acceptance Criteria
- Dữ liệu KCHTGT tài sản hàng hải được chia sẻ thành công qua LGSP và RESTful API với thông tin đăng ký chính xác
- Dữ liệu về vị trí, giá trị và tình trạng tài sản được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Thông tin tài sản được cập nhật định kỳ theo chu kỳ quy định

## In Scope
- Chia sẻ thông tin đăng ký tài sản KCHTGT hàng hải
- Chia sẻ vị trí và thông số kỹ thuật tài sản
- Chia sẻ tình trạng, giá trị và lịch sử bảo trì
- Tích hợp với hệ thống quản lý tài sản nhà nước

## Out of Scope
- Đánh giá lại tài sản
- Thanh lý tài sản
- Đầu tư mới tài sản

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị chủ quản) | View, Cập nhật thông tin tài sản |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý tài sản | View, Export báo cáo |
| Cơ quan kiểm toán | View (thẩm tra) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí tài sản
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Dữ liệu không gian lưu trữ trong PostGIS
- Hỗ trợ API tìm kiếm tài sản theo vùng, loại và tình trạng

## Entities
- **TaiSanKCHTGT**: id, ma_tai_san, ten_tai_san, loai_tai_san, toa_do, gia_tri, ngay_mua, don_vi_quan_ly, tinh_trang
- **LichSuBaoTri_TS**: id, tai_san_id, ngay_bao_tri, noi_dung, chi_phi, don_vi_thuc_hien
- **KiemKeTaiSan**: id, tai_san_id, ngay_kiem_ke, nguoi_kiem_ke, ket_qua, ghi_chu

## Business Rules
1. Dữ liệu KCHTGT tài sản hàng hải chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Thông tin tài sản phải được cập nhật sau mỗi lần kiểm kê hoặc thay đổi trạng thái
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm tài sản theo vùng, loại và tình trạng
- Test đồng bộ dữ liệu tài sản với hệ thống quản lý tài sản nhà nước
