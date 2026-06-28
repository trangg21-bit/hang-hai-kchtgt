---
id: F-211
name: Chia sẻ KCHTGT đài Inmarsat
slug: chia-se-kchtgt-dai-inmarsat
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT đài Inmarsat

## Description
Chia sẻ dữ liệu và thông tin kỹ thuật của hệ thống đài vệ tinh Inmarsat thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT) phục vụ liên lạc hàng hải quốc tế, bao gồm thông tin trạm mặt đất Inmarsat (LES), trạm vệ tinh, tình trạng kết nối và phạm vi phủ sóng, hỗ trợ công tác quản lý thông tin liên lạc viễn thông hàng hải.

## Business Intent
Vệ tinh Inmarsat là hệ thống liên lạc không thể thiếu cho tàu biển ở vùng biển xa bờ, đặc biệt trong công tác tìm kiếm cứu nạn và báo cáo an toàn hàng hải. Việc chia sẻ dữ liệu KCHTGT đài Inmarsat giúp cơ quan quản lý và các bên liên quan có cái nhìn tổng quan về tình trạng hoạt động, phạm vi phủ sóng và khả năng dự phòng của toàn bộ hạ tầng Inmarsat trong khu vực, đảm bảo thông tin liên lạc hàng hải được duy trì liên tục.

## Flow Summary
Dữ liệu KCHTGT đài Inmarsat được thu thập từ hệ thống quản lý hạ tầng viễn thông vệ tinh, bao gồm thông tin LES, trạm mặt đất, tình trạng kết nối vệ tinh và chất lượng tín hiệu. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị quản lý viễn thông hàng hải, trung tâm chỉ huy SAR và các tàu biển được trang bị thiết bị Inmarsat.

## Acceptance Criteria
- Dữ liệu KCHTGT đài Inmarsat được chia sẻ thành công qua LGSP và RESTful API với thông tin LES và tình trạng kết nối chính xác
- Dữ liệu về phạm vi phủ sóng vệ tinh và chất lượng tín hiệu được đồng bộ đầy đủ với các hệ thống đầu cuối
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Dữ liệu tình trạng kết nối Inmarsat được cập nhật định kỳ theo chu kỳ quy định

## In Scope
- Chia sẻ thông tin trạm mặt đất Inmarsat (LES)
- Chia sẻ tình trạng kết nối vệ tinh và chất lượng tín hiệu
- Chia sẻ phạm vi phủ sóng vệ tinh Inmarsat
- Tích hợp với hệ thống quản lý viễn thông hàng hải

## Out of Scope
- Vận hành trạm vệ tinh Inmarsat
- Quản lý thuê bao Inmarsat
- Xử lý truyền thông dữ liệu qua vệ tinh

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành LES) | View, Cập nhật tình trạng LES |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý viễn thông | View, Export báo cáo |
| Tàu biển (thành viên) | View, Báo cáo tình trạng kết nối |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian trạm Inmarsat
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API lấy thông tin kết nối vệ tinh theo thời gian thực
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **InmarsatLES**: id, ten_les, ma_les, toa_do_vi_tri, quoc_gia, danh_bai_truyen, tinh_trang_hoat_dong
- **TramMatDat**: id, ten_tram, toa_do, loai_tram, tang_cuong_tin_hieu, don_vien_quan_ly
- **KetNoiVST**: id, les_id, vst_id, trang_thai, chat_luong_tin_hieu, thoi_gian_cap_nhat

## Business Rules
1. Dữ liệu KCHTGT đài Inmarsat chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Tất cả thay đổi về tình trạng kết nối đều phải có xác thực JWT hợp lệ
4. Thông tin LES phải được cập nhật ít nhất mỗi ngày một lần

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test cập nhật thông tin kết nối vệ tinh Inmarsat
- Test đồng bộ dữ liệu Inmarsat với hệ thống quản lý viễn thông hàng hải
