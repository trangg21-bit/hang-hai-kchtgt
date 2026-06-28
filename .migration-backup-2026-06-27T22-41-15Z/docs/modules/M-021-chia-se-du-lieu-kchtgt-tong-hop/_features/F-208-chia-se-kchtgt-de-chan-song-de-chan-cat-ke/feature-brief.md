---
id: F-208
name: Chia sẻ KCHTGT đê chắn sóng, đê chắn cát, kênh
slug: chia-se-kchtgt-de-chan-song-de-chan-cat-ke
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT đê chắn sóng, đê chắn cát, kênh

## Description
Chia sẻ dữ liệu quan trắc và thông tin kỹ thuật của hệ thống đê chắn sóng, đê chắn cát và kênh giao thông thủy thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT) ra các hệ thống, đơn vị có thẩm quyền phục vụ công tác quản lý và vận hành công trình phòng chống thiên tai, bảo đảm giao thông thủy nội địa và ven biển.

## Business Intent
Hệ thống đê chắn sóng và đê chắn cát đóng vai trò then chốt trong bảo vệ bờ biển và giảm thiểu tác động của biến đổi khí hậu, trong khi kênh giao thông thủy là huyết mạch vận tải hàng hải nội địa. Việc chia sẻ dữ liệu KCHTGT của các công trình này giúp các cơ quan quản lý, đơn vị vận hành có thông tin chính xác, kịp thời để ra quyết định duy tu, bảo dưỡng và ứng phó với thiên tai.

## Flow Summary
Dữ liệu KCHTGT đê chắn sóng, đê chắn cát và kênh được thu thập từ các hệ thống quan trắc tự động (remote sensing, GPS, sensor network), được xử lý, chuẩn hóa và lưu trữ trong cơ sở dữ liệu chung của M-021. Sau khi được kiểm tra chất lượng, dữ liệu sẽ được phân phối qua các API RESTful (JSON/HTTPS/JWT) và qua trục chia sẻ dữ liệu quốc gia LGSP đến các hệ thống đầu cuối như cơ quan quản lý nhà nước, đơn vị vận hành công trình, và các hệ thống cảnh báo thiên tai.

## Acceptance Criteria
- Dữ liệu KCHTGT đê chắn sóng, đê chắn cát và kênh được chia sẻ thành công qua LGSP và RESTful API với độ tin cậy ≥ 99,9%
- Tất cả các thông tin kỹ thuật (vị trí, kích thước, tình trạng, lịch sử bảo trì) của đê và kênh được đồng bộ đầy đủ giữa các hệ thống liên quan
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Thông tin chia sẻ được ghi nhận và kiểm toán (audit trail) đầy đủ

## In Scope
- Chia sẻ dữ liệu đê chắn sóng ven biển
- Chia sẻ dữ liệu đê chắn cát ven biển
- Chia sẻ dữ liệu kênh giao thông thủy
- Tích hợp với trục LGSP và RESTful API

## Out of Scope
- Xây dựng hệ thống quan trắc mới
- Xử lý sâu dữ liệu ảnh viễn thám
- Quản lý dự án đầu tư công trình đê

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành) | View, Upload dữ liệu quan trắc |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý nhà nước | View, Export báo cáo |
| Đơn vị bên thứ ba | View (theo ủy quyền) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP (Local Government Service Platform) để chia sẻ dữ liệu không gian với các cơ quan nhà nước
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền truy cập dữ liệu
- Lưu trữ dữ liệu trong cơ sở dữ liệu quan hệ hỗ trợ GIS (PostGIS hoặc tương đương)

## Entities
- **DeChanSong**: id, ten_de, toa_do_vi_tri, chieu_dai, chieu_cao, loai_de, tinh_trang, ngay_gia_han, so_lieu_kiem_tra
- **DeChanCat**: id, ten_de, toa_do_vi_tri, chieu_dai, chieu_cao, loai_de, tinh_trang, don_vien_quan_ly
- **KenhGiaoThong**: id, ten_kenh, toa_do_dau_dau, chieu_dai, do_sau_co_ban, loai_kenh, tình_trang_vận_hành

## Business Rules
1. Dữ liệu KCHTGT chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ
4. Dữ liệu chia sẻ phải tuân thủ định dạng chuẩn KCHTGT theo quy định của Bộ Giao thông Vận tải

## Testing Strategy
- Test tích hợp API với các đầu cuối giả lập (mock endpoints) và LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test đồng bộ dữ liệu giữa M-021 và các hệ thống đầu cuối
- Test hiệu năng với tải dữ liệu lớn (stress test)
