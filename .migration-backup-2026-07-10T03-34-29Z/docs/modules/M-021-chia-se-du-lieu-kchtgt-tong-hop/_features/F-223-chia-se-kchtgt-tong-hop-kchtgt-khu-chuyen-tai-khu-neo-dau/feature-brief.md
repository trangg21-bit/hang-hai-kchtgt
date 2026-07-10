---
id: F-223
name: Chia sẻ KCHTGT tổng hợp KCHTGT - khu chuyển tải, khu neo đậu
slug: chia-se-kchtgt-tong-hop-kchtgt-khu-chuyen-tai-khu-neo-dau
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT tổng hợp KCHTGT - khu chuyển tải, khu neo đậu

## Description
Chia sẻ dữ liệu tổng hợp về hệ thống KCHTGT hàng hải tại các khu chuyển tải và khu neo đậu thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm thông tin khu vực, hệ thống tiêu dẫn, đèn dẫn đường, phao tiêu khu neo đậu, radar giám sát và các thiết bị KCHTGT phục vụ an toàn tàu bè chuyển tải và neo đậu tại các khu vực được chỉ định.

## Business Intent
Khu chuyển tải và khu neo đậu là những khu vực đặc thù có mật độ tàu bè tập trung cao, đòi hỏi hệ thống KCHTGT hàng hải phải được quản lý chặt chẽ để đảm bảo an toàn giao thông. Việc chia sẻ dữ liệu tổng hợp KCHTGT tại các khu này giúp cơ quan quản lý giao thông đường thủy, đơn vị vận hành khu neo đậu và tàu thuyền có thông tin đầy đủ về hệ thống dẫn đường, giám sát và cảnh báo trong khu vực, hỗ trợ công tác chỉ đạo neo đậu, chuyển tải và xử lý tình huống khẩn cấp.

## Flow Summary
Dữ liệu KCHTGT tổng hợp tại khu chuyển tải và khu neo đậu được thu thập từ các hệ thống quan trắc và giám sát (radar, AIS, camera, hệ thống đèn/phao tiêu), được chuẩn hóa và lưu trữ trong M-021. Dữ liệu được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị quản lý khu neo đậu, kiểm soát giao thông đường thủy, tàu thuyền khu vực và hệ thống VTS khu vực.

## Acceptance Criteria
- Dữ liệu KCHTGT tổng hợp khu chuyển tải, neo đậu được chia sẻ thành công qua LGSP và RESTful API với tọa độ chính xác
- Dữ liệu về tình trạng thiết bị KCHTGT trong khu vực được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Thông tin khu vực được cập nhật sau mỗi lần kiểm tra định kỳ

## In Scope
- Chia sẻ thông tin tổng hợp KCHTGT tại khu chuyển tải
- Chia sẻ thông tin tổng hợp KCHTGT tại khu neo đậu
- Chia sẻ dữ liệu radar, AIS và hệ thống giám sát khu vực
- Chia sẻ tình trạng đèn/phao tiêu khu neo đậu
- Tích hợp với hệ thống VTS khu vực

## Out of Scope
- Xây dựng mới khu chuyển tải, neo đậu
- Vận hành radar, AIS trực tiếp
- Quản lý neo đậu tàu thuyền

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành khu neo đậu) | View, Cập nhật thông tin thiết bị |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý giao thông đường thủy | View, Export báo cáo |
| Tàu thuyền trong khu vực | View (thông tin an toàn) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí thiết bị KCHTGT trong khu vực
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API tìm kiếm thiết bị KCHTGT theo khu vực chuyển tải/neo đậu
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **KhuChuyenTai**: id, ten_khu, toa_do, dien_tich, loai_khu, tinh_trang
- **KhuNeoDau**: id, ten_khu, toa_do, dien_tich, so_gia_neo, loai_neo, tinh_trang
- **ThietBiKCHTGT_Khu**: id, khu_id, loai_thiet_bi, toa_do, ten_thiet_bi, tinh_trang

## Business Rules
1. Dữ liệu KCHTGT tổng hợp khu chuyển tải, neo đậu chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Thông tin thiết bị KCHTGT trong khu vực phải được cập nhật sau mỗi lần kiểm tra
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm thiết bị KCHTGT theo khu vực chuyển tải/neo đậu
- Test đồng bộ dữ liệu KCHTGT khu vực với hệ thống VTS
