---
id: F-224
name: Chia sẻ KCHTGT tổng hợp KCHTGT - phao tiêu
slug: chia-se-kchtgt-tong-hop-kchtgt-phao-tieu
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT tổng hợp KCHTGT - phao tiêu

## Description
Chia sẻ dữ liệu tổng hợp về hệ thống phao tiêu hàng hải thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm vị trí, loại, màu sắc, đặc tính ánh sáng, tình trạng vận hành, lịch sử thay thế và bảo trì của toàn bộ hệ thống phao tiêu trên các luồng hàng hải, cửa biển và khu vực neo đậu, phục vụ đảm bảo an toàn hàng hải và công tác duy tu hệ thống tiêu dẫn.

## Business Intent
Hệ thống phao tiêu là công cụ dẫn đường cơ bản và không thể thiếu cho tàu thuyền trong mọi điều kiện thời tiết, đặc biệt trong điều kiện thời tiết xấu hoặc ban đêm khi các hệ thống dẫn đường điện tử có thể gặp sự cố. Việc chia sẻ dữ liệu tổng hợp KCHTGT về phao tiêu giúp đơn vị quản lý luồng, đơn vị duy tu và tàu thuyền có thông tin chính xác về vị trí, tình trạng và đặc tính của từng phao tiêu, từ đó đảm bảo hệ thống tiêu dẫn luôn hoạt động hiệu quả và cảnh báo kịp thời khi có phao tiêu mất hoặc hư hỏng.

## Flow Summary
Dữ liệu KCHTGT tổng hợp về phao tiêu được thu thập từ hệ thống quản lý phao tiêu, đơn vị duy tu và báo cáo thực địa, bao gồm vị trí GPS, loại phao tiêu (theo quy ước IALA), đặc tính ánh sáng, tình trạng và lịch sử bảo trì. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị quản lý luồng, đơn vị duy tu, tàu thuyền và hệ thống thông tin hàng hải quốc gia.

## Acceptance Criteria
- Dữ liệu KCHTGT tổng hợp về phao tiêu được chia sẻ thành công qua LGSP và RESTful API với vị trí GPS chính xác
- Dữ liệu về loại, đặc tính ánh sáng và tình trạng vận hành của từng phao tiêu được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Phao tiêu mất hoặc hư hỏng được cập nhật và cảnh báo trong vòng 2 giờ sau khi phát hiện

## In Scope
- Chia sẻ danh mục và vị trí toàn bộ phao tiêu hàng hải
- Chia sẻ thông tin loại, màu sắc và đặc tính ánh sáng
- Chia sẻ tình trạng vận hành và lịch sử bảo trì
- Tích hợp với hệ thống quản lý phao tiêu

## Out of Scope
- Lắp đặt, thay thế phao tiêu thực tế
- Đo đạc vị trí phao tiêu từ biển
- Sản xuất phao tiêu

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị duy tu phao tiêu) | View, Cập nhật tình trạng phao |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý luồng | View, Export báo cáo |
| Tàu thuyền | View (thông tin tiêu dẫn) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí từng phao tiêu
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API tìm kiếm phao tiêu theo loại, trạng thái và khu vực
- Dữ liệu không gian lưu trữ trong PostGIS, hỗ trợ truy vấn vị trí theo bán kính

## Entities
- **PhaoTieu**: id, ma_phao, toa_do, loai_phao, mau_sac, dac_tinh_anh_sang, khu_vuc, tinh_trang
- **LichSuBaoTri_Phat**: id, phao_id, ngay_bao_tri, noi_dung, don_vi_thuc_hien, ket_qua
- **PhaoMat**: id, phao_id, ngay_phat_hien, don_vi_bao_cao, loai_phao, khu_vuc

## Business Rules
1. Dữ liệu KCHTGT tổng hợp về phao tiêu chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Phao tiêu mất hoặc hư hỏng phải được cập nhật và cảnh báo ngay lập tức
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm phao tiêu theo loại, trạng thái và khu vực
- Test cảnh báo phao tiêu mất trong vòng 2 giờ
