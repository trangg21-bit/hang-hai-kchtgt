---
id: F-222
name: Chia sẻ KCHTGT tổng hợp KCHTGT - luồng hàng hải
slug: chia-se-kchtgt-tong-hop-kchtgt-luong-hang-hai
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT tổng hợp KCHTGT - luồng hàng hải

## Description
Chia sẻ dữ liệu tổng hợp về hệ thống KCHTGT hàng hải tại các luồng hàng hải thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm thông tin tuyến luồng, hệ thống tiêu dẫn, đèn luồng, phao tiêu, đo đạc độ sâu, chướng ngại vật ngầm và các thiết bị KCHTGT phục vụ an toàn hàng hải trên toàn bộ hệ thống luồng hàng hải quốc gia.

## Business Intent
Hệ thống luồng hàng hải là tuyến giao thông huyết mạch của nền kinh tế biển, nối liền cảng biển với vùng biển khơi. Việc chia sẻ dữ liệu tổng hợp KCHTGT tại luồng hàng hải giúp tàu thuyền, đơn vị quản lý luồng và cơ quan chỉ huy giao thông đường thủy có thông tin toàn diện về tình trạng đèn luồng, phao tiêu, độ sâu luồng và chướng ngại vật, từ đó lựa chọn lộ trình an toàn và báo cáo kịp thời các sự cố ảnh hưởng đến an toàn hàng hải.

## Flow Summary
Dữ liệu KCHTGT tổng hợp tại luồng hàng hải được thu thập từ các hệ thống quan trắc luồng (đo đạc thủy âm, hệ thống đèn luồng, phao tiêu AIS, radar), được chuẩn hóa và lưu trữ trong M-021. Dữ liệu được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị quản lý luồng, tàu thuyền, hệ thống VTS và cơ quan quản lý giao thông đường thủy quốc gia.

## Acceptance Criteria
- Dữ liệu KCHTGT tổng hợp luồng hàng hải được chia sẻ thành công qua LGSP và RESTful API với thông tin tuyến luồng chính xác
- Dữ liệu về tình trạng đèn luồng, phao tiêu và độ sâu luồng được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Dữ liệu luồng hàng hải được cập nhật định kỳ và ngay khi có sự cố

## In Scope
- Chia sẻ thông tin tổng hợp hệ thống KCHTGT trên luồng hàng hải
- Chia sẻ dữ liệu đèn luồng, phao tiêu và hệ thống tiêu dẫn
- Chia sẻ độ sâu luồng và chướng ngại vật ngầm
- Tích hợp với hệ thống VTS và quản lý luồng

## Out of Scope
- Đo đạc thủy âm trực tiếp
- Thay thế đèn luồng, phao tiêu thực tế
- Xây dựng mới tuyến luồng

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị quản lý luồng) | View, Cập nhật thông tin luồng |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý giao thông | View, Export báo cáo |
| Tàu thuyền trên luồng | View (thông tin an toàn) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí thiết bị KCHTGT trên luồng
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API tìm kiếm thông tin KCHTGT theo tuyến luồng
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **LuongHangHai**: id, ten_luong, toa_do_truc, chieu_dai, do_sau_thiet_ke, tinh_trang
- **ThietBiKCHTGT_Luong**: id, luong_id, loai_thiet_bi, toa_do, ten_thiet_bi, tinh_trang
- **DoSauLuong**: id, luong_id, toa_do, do_sau, ngay_do, don_vi_do

## Business Rules
1. Dữ liệu KCHTGT tổng hợp luồng hàng hải chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Thông tin đèn luồng, phao tiêu phải được cập nhật ngay khi có sự cố
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm thông tin KCHTGT theo tuyến luồng
- Test đồng bộ dữ liệu KCHTGT luồng với hệ thống VTS
