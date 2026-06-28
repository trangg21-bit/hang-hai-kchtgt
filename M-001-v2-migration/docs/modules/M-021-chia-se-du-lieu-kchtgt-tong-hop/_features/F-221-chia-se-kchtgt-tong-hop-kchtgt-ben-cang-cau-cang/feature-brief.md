---
id: F-221
name: Chia sẻ KCHTGT tổng hợp KCHTGT - bến cảng, cầu cảng
slug: chia-se-kchtgt-tong-hop-kchtgt-ben-cang-cau-cang
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT tổng hợp KCHTGT - bến cảng, cầu cảng

## Description
Chia sẻ dữ liệu tổng hợp về hệ thống KCHTGT hàng hải tại các bến cảng và cầu cảng thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm thông tin bến cảng, cầu cảng, đèn dẫn đường vào bến, hệ thống tiêu dẫn cục bộ, thiết bị cầu tàu và các thiết bị KCHTGT phục vụ hoạt động an toàn tàu bè tại khu vực bến cảng và cầu cảng.

## Business Intent
Bến cảng và cầu cảng là khu vực có mật độ tàu bè qua lại dày đặc, đòi hỏi hệ thống KCHTGT hàng hải phải luôn trong tình trạng hoạt động tốt để đảm bảo an toàn neo đậu, cập bến và vận hành cầu cảng. Việc chia sẻ dữ liệu tổng hợp KCHTGT tại bến cảng và cầu cảng giúp đơn vị vận hành cảng, tàu thuyền và cơ quan quản lý có thông tin chính xác về hệ thống dẫn đường, tiêu dẫn và thiết bị an toàn tại từng bến, cầu cụ thể, hỗ trợ ra quyết định neo đậu và vận hành an toàn.

## Flow Summary
Dữ liệu KCHTGT tại bến cảng và cầu cảng được thu thập từ hệ thống quan trắc và quản lý hạ tầng bến cảng, bao gồm vị trí, thông số kỹ thuật, tình trạng vận hành và lịch bảo trì của từng thiết bị KCHTGT tại bến/cầu. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị vận hành bến cảng, tàu thuyền và hệ thống quản lý bến cảng.

## Acceptance Criteria
- Dữ liệu KCHTGT tổng hợp bến cảng, cầu cảng được chia sẻ thành công qua LGSP và RESTful API với vị trí chính xác
- Dữ liệu về tình trạng vận hành của hệ thống đèn dẫn đường và tiêu dẫn tại bến/cầu được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Thông tin thiết bị KCHTGT tại bến/cầu được cập nhật sau mỗi lần kiểm tra

## In Scope
- Chia sẻ thông tin tổng hợp KCHTGT tại bến cảng
- Chia sẻ thông tin tổng hợp KCHTGT tại cầu cảng
- Chia sẻ dữ liệu đèn dẫn đường, tiêu dẫn cục bộ tại bến/cầu
- Tích hợp với hệ thống quản lý bến cảng

## Out of Scope
- Xây dựng mới bến cảng, cầu cảng
- Vận hành trực tiếp thiết bị KCHTGT tại bến/cầu
- Quản lý khai thác bến/cầu

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành bến/cầu) | View, Cập nhật thông tin thiết bị |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý bến/cầu | View, Export báo cáo |
| Tàu thuyền cập bến | View (thông tin dẫn đường) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí thiết bị KCHTGT tại bến/cầu
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API tìm kiếm thiết bị KCHTGT theo bến/cầu cụ thể
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **BenCang**: id, ten_ben, toa_do, chieu_dai_ben, chieu_sau_cung, loai_ben, tinh_trang
- **CauCang**: id, ten_cau, toa_do, chieu_dai_cau, nang_luat, loai_cau, tinh_trang
- **ThietBiKCHTGT_BC**: id, ben_cang_id, cau_cang_id, loai_thiet_bi, toa_do, tinh_trang

## Business Rules
1. Dữ liệu KCHTGT tổng hợp bến cảng, cầu cảng chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Thông tin thiết bị KCHTGT tại bến/cầu phải được cập nhật sau mỗi lần kiểm tra
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm thiết bị KCHTGT theo bến/cầu
- Test đồng bộ dữ liệu KCHTGT bến/cầu với hệ thống quản lý bến cảng
