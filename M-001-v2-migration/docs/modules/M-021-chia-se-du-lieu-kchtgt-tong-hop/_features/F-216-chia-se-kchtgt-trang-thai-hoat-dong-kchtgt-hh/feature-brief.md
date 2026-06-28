---
id: F-216
name: Chia sẻ KCHTGT trạng thái hoạt động KCHTGT HH
slug: chia-se-kchtgt-trang-thai-hoat-dong-kchtgt-hh
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT trạng thái hoạt động KCHTGT HH

## Description
Chia sẻ dữ liệu về trạng thái hoạt động của toàn bộ hệ thống KCHTGT Hàng hải (KCHTGT Hàng hải) thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông, bao gồm tình trạng vận hành, bảo trì, sự cố và khả năng phục vụ của từng hạng mục hệ thống, giúp cơ quan quản lý có cái nhìn toàn diện về tình trạng hạ tầng KCHTGT hàng hải trên toàn quốc.

## Business Intent
Trạng thái hoạt động của hệ thống KCHTGT Hàng hải là thông tin sống còn để đảm bảo vận hành liên tục các dịch vụ quan trọng như dẫn đường, thông tin liên lạc và cảnh báo thiên tai. Việc chia sẻ dữ liệu trạng thái hoạt động giúp cơ quan quản lý, đơn vị vận hành và các bên liên quan phát hiện sớm sự cố, lên kế hoạch bảo trì và ra quyết định dự phòng, giảm thiểu gián đoạn dịch vụ và nâng cao độ tin cậy của hệ thống KCHTGT hàng hải.

## Flow Summary
Dữ liệu trạng thái hoạt động KCHTGT Hàng hải được thu thập từ hệ thống SCADA, cảm biến IoT và báo cáo vận hành định kỳ, bao gồm tình trạng vận hành, bảo trì theo lịch và sự cố của từng hạng mục (đài vô tuyến, hệ thống tiêu dẫn, sensor quan trắc). Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị vận hành hệ thống KCHTGT, cơ quan quản lý và hệ thống giám sát hạ tầng.

## Acceptance Criteria
- Dữ liệu trạng thái hoạt động KCHTGT Hàng hải được chia sẻ thành công qua LGSP và RESTful API
- Thông tin về tình trạng vận hành, bảo trì và sự cố được đồng bộ đầy đủ với các hệ thống đầu cuối
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Dữ liệu trạng thái được cập nhật theo thời gian thực hoặc gần thời gian thực

## In Scope
- Chia sẻ trạng thái hoạt động của từng hạng mục KCHTGT hàng hải
- Chia sẻ lịch bảo trì và tình trạng bảo trì
- Chia sẻ thông tin sự cố và phương án khắc phục
- Tích hợp với hệ thống SCADA/IoT

## Out of Scope
- Xây dựng hệ thống SCADA
- Vận hành trực tiếp hệ thống KCHTGT hàng hải
- Bảo trì thiết bị thực tế

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành) | View, Cập nhật trạng thái |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý | View, Export báo cáo |
| Đơn vị bảo trì | View, Nhập báo cáo bảo trì |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian trạng thái hạ tầng
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API nhận dữ liệu trạng thái từ SCADA/IoT theo thời gian thực
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **TrangThaiHoatDong**: id, hinh_muc_id, loai_he_thong, trang_thai, thoi_gian_cap_nhat, don_vi_quan_ly
- **LichBaoTri**: id, hinh_muc_id, ngay_bao_tri, noi_dung, don_vien_thuc_hien, trang_thai
- **SuCo**: id, hinh_muc_id, loai_su_co, mo_ta, thoi_gian_phat_hien, phuong_an_khac_phuc

## Business Rules
1. Dữ liệu KCHTGT trạng thái hoạt động chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Dữ liệu trạng thái phải được cập nhật liên tục theo chu kỳ quy định
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test cập nhật trạng thái hoạt động theo thời gian thực
- Test đồng bộ dữ liệu với hệ thống SCADA/IoT
