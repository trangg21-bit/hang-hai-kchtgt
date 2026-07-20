---
id: F-226
name: Chia sẻ KCHTGT tổng hợp KCHTGT - hệ thống đê kè
slug: chia-se-kchtgt-tong-hop-kchtgt-he-thong-de-ke
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT tổng hợp KCHTGT - hệ thống đê kè

## Description
Chia sẻ dữ liệu tổng hợp về hệ thống đê kè (đê biển, đê sông, kè bảo vệ bờ) thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm thông tin vị trí, kích thước, loại kết cấu, tình trạng bảo vệ, lịch sử gia cố và các chỉ số an toàn đê kè, phục vụ quản lý và vận hành hệ thống đê kè ven biển, bảo vệ bờ biển và giảm thiểu tác động của biến đổi khí hậu và nước biển dâng.

## Business Intent
Hệ thống đê kè ven biển đóng vai trò then chốt trong bảo vệ an toàn cho các khu dân cư, hạ tầng giao thông và cảng biển trước tác động của sóng biển, xói lở bờ biển và nước biển dâng do biến đổi khí hậu. Việc chia sẻ dữ liệu tổng hợp KCHTGT về hệ thống đê kè giúp cơ quan quản lý đê điều, đơn vị vận hành và các bên liên quan có thông tin toàn diện về tình trạng an toàn, khu vực cần gia cố và khả năng phòng thủ của từng đoạn đê kè, hỗ trợ công tác lập kế hoạch bảo vệ bờ biển và ứng phó với thiên tai.

## Flow Summary
Dữ liệu KCHTGT tổng hợp về hệ thống đê kè được thu thập từ hệ thống quản lý đê điều, quan trắc địa chất và báo cáo kiểm tra thực địa, bao gồm vị trí, kích thước, loại kết cấu, tình trạng và các chỉ số an toàn. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến cơ quan quản lý đê điều, cơ quan phòng chống thiên tai, đơn vị vận hành và hệ thống cảnh báo thiên tai ven biển.

## Acceptance Criteria
- Dữ liệu KCHTGT tổng hợp về hệ thống đê kè được chia sẻ thành công qua LGSP và RESTful API với tọa độ chính xác
- Dữ liệu về tình trạng an toàn và kích thước kỹ thuật của từng đoạn đê kè được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Tình trạng đê kè được cập nhật sau mỗi lần kiểm tra thực địa và sau các sự kiện thời tiết đặc biệt

## In Scope
- Chia sẻ thông tin tổng hợp hệ thống đê kè ven biển và ven sông
- Chia sẻ dữ liệu về kích thước, loại kết cấu và tình trạng an toàn
- Chia sẻ lịch sử gia cố và sửa chữa đê kè
- Tích hợp với hệ thống quản lý đê điều và phòng chống thiên tai

## Out of Scope
- Xây dựng mới đê kè
- Gia cố đê kè thực tế
- Đo đạc địa chất bờ biển

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị quản lý đê) | View, Cập nhật tình trạng đê |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý đê điều | View, Export báo cáo |
| Cơ quan phòng chống thiên tai | View, Cảnh báo đê |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí đoạn đê kè
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API tìm kiếm đê kè theo tình trạng an toàn và khu vực
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **DeKe**: id, ten_doan_de, toa_do_dau, toa_do_cuoi, chieu_dai, chieu_cao, loai_ke, tinh_trang_an_toan
- **LichSuGiaCo**: id, de_id, ngay_gia_co, noi_dung, chi_phi, don_vi_thuc_hien
- **KiemTraDe**: id, de_id, ngay_kiem, nguoi_kiem, ket_qua, ghi_chu

## Business Rules
1. Dữ liệu KCHTGT tổng hợp về hệ thống đê kè chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Tình trạng đê kè phải được cập nhật sau mỗi lần kiểm tra và sự kiện thời tiết đặc biệt
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm đê kè theo tình trạng an toàn và khu vực
- Test đồng bộ dữ liệu đê kè với hệ thống quản lý đê điều
