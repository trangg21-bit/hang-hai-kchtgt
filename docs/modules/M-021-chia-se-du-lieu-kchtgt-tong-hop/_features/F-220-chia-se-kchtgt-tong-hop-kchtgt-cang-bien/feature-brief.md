---
id: F-220
name: Chia sẻ KCHTGT tổng hợp KCHTGT - cảng biển
slug: chia-se-kchtgt-tong-hop-kchtgt-cang-bien
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT tổng hợp KCHTGT - cảng biển

## Description
Chia sẻ dữ liệu tổng hợp về hệ thống KCHTGT hàng hải tại các cảng biển thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm thông tin hệ thống tiêu dẫn, đèn biển, radar dẫn đường, hệ thống thông tin liên lạc và các thiết bị KCHTGT khác có tại cảng biển, phục vụ quản lý an toàn hàng hải tại cảng và điều phối hoạt động cảng.

## Business Intent
Cảng biển là điểm tập trung dày đặc các thiết bị KCHTGT hàng hải, đóng vai trò là cửa ngõ giao thông đường biển của quốc gia. Việc chia sẻ dữ liệu tổng hợp KCHTGT tại cảng biển giúp cơ quan quản lý cảng, đơn vị vận hành cảng và tàu thuyền có thông tin đầy đủ về tình trạng và khả năng vận hành của hệ thống dẫn đường, thông tin liên lạc và cảnh báo tại cảng, góp phần đảm bảo an toàn tàu bè ra vào cảng và nâng cao hiệu quả khai thác cảng.

## Flow Summary
Dữ liệu KCHTGT tổng hợp tại cảng biển được thu thập từ các hệ thống KCHTGT hiện hữu tại từng cảng (đèn biển, radar, AIS, VTS, đài thông tin), được chuẩn hóa và lưu trữ trong M-021. Dữ liệu được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị quản lý cảng, kiểm soát giao thông đường thủy, tàu thuyền đến cảng và hệ thống thông tin cảng biển quốc gia.

## Acceptance Criteria
- Dữ liệu KCHTGT tổng hợp cảng biển được chia sẻ thành công qua LGSP và RESTful API với thông tin hệ thống dẫn đường chính xác
- Dữ liệu về tình trạng vận hành và phạm vi phủ sóng của các thiết bị KCHTGT tại cảng được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Thông tin thiết bị KCHTGT tại cảng được cập nhật sau mỗi lần bảo trì hoặc thay đổi

## In Scope
- Chia sẻ thông tin tổng hợp hệ thống KCHTGT tại cảng biển
- Chia sẻ dữ liệu đèn biển, radar, AIS, VTS
- Chia sẻ tình trạng vận hành và phạm vi phủ sóng
- Tích hợp với hệ thống thông tin cảng biển

## Out of Scope
- Vận hành trực tiếp thiết bị KCHTGT tại cảng
- Quản lý khai thác cảng
- Xây dựng mới hệ thống KCHTGT tại cảng

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành cảng) | View, Cập nhật thông tin thiết bị |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý cảng | View, Export báo cáo |
| Tàu thuyền đến cảng | View, Tìm kiếm thông tin KCHTGT |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí thiết bị KCHTGT tại cảng
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API tìm kiếm thiết bị KCHTGT theo cảng
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **CangBien**: id, ten_cang, loai_cang, toa_do, so_dai_bien, so_radar, so_dai_tt, tinh_trang
- **ThietBiKCHTGT_Cang**: id, cang_id, loai_thiet_bi, ten_thiet_bi, toa_do, tinh_trang
- **DanhSachThietBiCang**: id, cang_id, ma_thiet_bi, loai, trang_thai, ngay_lap

## Business Rules
1. Dữ liệu KCHTGT tổng hợp cảng biển chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Thông tin thiết bị KCHTGT tại cảng phải được cập nhật sau mỗi lần bảo trì
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm thiết bị KCHTGT theo cảng
- Test đồng bộ dữ liệu KCHTGT cảng biển với hệ thống thông tin cảng
