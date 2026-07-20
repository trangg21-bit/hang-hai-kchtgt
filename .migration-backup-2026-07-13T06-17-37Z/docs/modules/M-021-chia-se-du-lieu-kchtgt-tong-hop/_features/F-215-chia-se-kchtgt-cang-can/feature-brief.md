---
id: F-215
name: Chia sẻ KCHTGT cảng cạn
slug: chia-se-kchtgt-cang-can
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT cảng cạn

## Description
Chia sẻ dữ liệu và thông tin kỹ thuật của hệ thống cảng cạn thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm vị trí, diện tích, công suất khai thác, thông tin thiết bị xếp dỡ, lịch sử vận hành và các thông tin liên quan phục vụ quản lý và phát triển hệ thống cảng cạn phục vụ giao thông thủy nội địa.

## Business Intent
Cảng cạn (Inland Container Depot - ICD) đóng vai trò quan trọng trong chuỗi logistics đường thủy nội địa, giúp giảm tải cho cảng biển, rút ngắn thời gian thông quan và nâng cao hiệu quả vận tải đa phương thức. Việc chia sẻ dữ liệu KCHTGT cảng cạn giúp cơ quan quản lý giao thông vận tải, đơn vị logistics và các đối tác thương mại có thông tin đầy đủ về năng lực, vị trí và tình trạng hoạt động của từng cảng cạn, hỗ trợ ra quyết định trong lựa chọn dịch vụ logistics đường thủy.

## Flow Summary
Dữ liệu KCHTGT cảng cạn được thu thập từ hệ thống quản lý hạ tầng cảng cạn, bao gồm thông tin vị trí địa lý, diện tích, năng lực thiết bị, loại hàng hóa phục vụ và tình trạng khai thác. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị logistics, cảng biển, cơ quan quản lý giao thông vận tải và hệ thống quản lý chuỗi cung ứng đường thủy.

## Acceptance Criteria
- Dữ liệu KCHTGT cảng cạn được chia sẻ thành công qua LGSP và RESTful API với thông tin cảng chính xác đến cấp tọa độ
- Dữ liệu về năng lực khai thác và loại hàng hóa phục vụ được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Thông tin cảng cạn được cập nhật định kỳ hàng tháng

## In Scope
- Chia sẻ thông tin cảng cạn (vị trí, diện tích, công suất)
- Chia sẻ thông tin thiết bị xếp dỡ và loại hàng hóa
- Chia sẻ lịch sử vận hành và tình trạng khai thác
- Tích hợp với hệ thống quản lý cảng biển

## Out of Scope
- Xây dựng mới cảng cạn
- Vận hành cảng cạn
- Quản lý thủ tục thông quan

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành cảng) | View, Cập nhật thông tin cảng |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý GTVT | View, Export báo cáo |
| Đơn vị logistics | View, Tìm kiếm cảng |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí cảng cạn
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Dữ liệu không gian lưu trữ trong PostGIS
- Hỗ trợ API tìm kiếm cảng cạn theo vùng và năng lực

## Entities
- **CangCan**: id, ten_cang, toa_do, tinh_thanh, dien_tich_m2, cong_suat_teu_nam, loai_hang_hoa, tinh_trang_khai_thac
- **ThietBiXepDo**: id, cang_can_id, loai_thiet_bi, nang_luat, trang_thai
- **LichSuVanHanh**: id, cang_can_id, ngay, so_teu, so_tuan_hang, loai_hang_hoa

## Business Rules
1. Dữ liệu KCHTGT cảng cạn chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Thông tin cảng cạn phải được cập nhật định kỳ hàng tháng
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm cảng cạn theo vùng và năng lực
- Test đồng bộ dữ liệu cảng cạn với hệ thống cảng biển
