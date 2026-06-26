---
id: F-214
name: Chia sẻ KCHTGT đài TT hàng hải HN
slug: chia-se-kchtgt-dai-tt-hang-hai-hn
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT đài TT hàng hải HN

## Description
Chia sẻ dữ liệu và thông tin kỹ thuật của hệ thống đài Thông tin Hàng hải khu vực Hà Nội thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm thông tin đài thông tin hàng hải khu vực phía Bắc, phạm vi phủ sóng, chế độ làm việc và các thông tin liên quan phục vụ quản lý thông tin liên lạc hàng hải nội địa và ven biển tại khu vực Hà Nội và các tỉnh lân cận.

## Business Intent
Đài Thông tin Hàng hải Hà Nội đóng vai trò trung tâm chỉ đạo thông tin hàng hải khu vực phía Bắc, chịu trách nhiệm phổ biến cảnh báo thời tiết, thông báo hàng hải và điều phối thông tin liên lạc trong khu vực. Việc chia sẻ dữ liệu KCHTGT đài TT hàng hải HN giúp cơ quan quản lý và các đơn vị liên quan có thông tin đầy đủ về tình trạng hoạt động, phạm vi phủ sóng và các thông báo hàng hải quan trọng để đảm bảo an toàn hàng hải khu vực.

## Flow Summary
Dữ liệu KCHTGT đài TT hàng hải HN được thu thập từ hệ thống quản lý thông tin liên lạc hàng hải khu vực, bao gồm thông tin đài, phạm vi phủ sóng, lịch phát thông báo hàng hải và cảnh báo thời tiết. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị quản lý hàng hải khu vực phía Bắc, các đài thông tin hàng hải thành viên và hệ thống thông báo hàng hải.

## Acceptance Criteria
- Dữ liệu KCHTGT đài TT hàng hải HN được chia sẻ thành công qua LGSP và RESTful API với thông tin đài và lịch phát chính xác
- Dữ liệu về phạm vi phủ sóng và thông báo hàng hải được đồng bộ đầy đủ với các hệ thống đầu cuối
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Thông báo hàng hải và cảnh báo thời tiết được cập nhật theo thời gian thực

## In Scope
- Chia sẻ thông tin đài TT hàng hải HN (vị trí, thông số kỹ thuật)
- Chia sẻ lịch phát thông báo hàng hải và cảnh báo thời tiết
- Chia sẻ dữ liệu về các thông báo hàng hải hiện hành
- Tích hợp với trục LGSP

## Out of Scope
- Phát sóng thông báo hàng hải
- Vận hành đài TT hàng hải HN
- Xử lý truyền thông vô tuyến

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đài TT hàng hải) | View, Nhập thông báo hàng hải |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý khu vực phía Bắc | View, Export báo cáo |
| Tàu thuyền khu vực | View (thông báo hàng hải) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí đài TT hàng hải HN
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API nhận thông báo hàng hải theo thời gian thực
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **DaiTTHangHaiHN**: id, ten_dai, toa_do, tan_so_phat, pham_vi_phu_song, tinh_trang_hoat_dong, don_vien_quan_ly
- **ThongBaoHangHai**: id, dai_id, loai_thong_bao, noi_dung, thoi_gian_phat, hieu_luc
- **CanhBaoThoiTiet**: id, dai_id, loai_canh_bao, mien_bien, noi_dung, thoi_gian_cap_nhat

## Business Rules
1. Dữ liệu KCHTGT đài TT hàng hải HN chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Tất cả thông báo hàng hải và cảnh báo thời tiết đều phải được phê duyệt trước khi phát
4. Thông tin đài phải được cập nhật ít nhất mỗi ngày một lần

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test cập nhật thông báo hàng hải theo thời gian thực
- Test đồng bộ dữ liệu với các đài TT hàng hải khu vực phía Bắc
