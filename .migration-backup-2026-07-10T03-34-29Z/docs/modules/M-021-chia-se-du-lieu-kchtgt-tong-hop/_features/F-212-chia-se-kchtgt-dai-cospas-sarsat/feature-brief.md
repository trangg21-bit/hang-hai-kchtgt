---
id: F-212
name: Chia sẻ KCHTGT đài Cospas-Sarsat
slug: chia-se-kchtgt-dai-cospas-sarsat
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT đài Cospas-Sarsat

## Description
Chia sẻ dữ liệu và thông tin kỹ thuật của hệ thống đài Cospas-Sarsat thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm thông tin trạm thu tín hiệu EPIRB/PLB vệ tinh, phạm vi phát hiện, chế độ hoạt động và tích hợp với hệ thống tìm kiếm cứu nạn quốc tế, phục vụ cảnh báo và điều phối hoạt động SAR hàng hải.

## Business Intent
Hệ thống Cospas-Sarsat là mạng lưới tìm kiếm cứu nạn vệ tinh quốc tế, giúp phát hiện và định vị tín hiệu EPIRB (Emergency Position Indicating Radio Beacon) và PLB (Personal Locator Beacon) từ tàu biển hoặc tàu nhỏ gặp sự cố. Việc chia sẻ dữ liệu KCHTGT đài Cospas-Sarsat giúp cơ quan chỉ huy SAR quốc gia có thông tin về khả năng phủ sóng, tình trạng vận hành và lịch sử cảnh báo của từng trạm, góp phần rút ngắn thời gian phản ứng và nâng cao hiệu quả cứu nạn.

## Flow Summary
Dữ liệu KCHTGT đài Cospas-Sarsat được thu thập từ hệ thống quản lý hạ tầng vệ tinh SAR, bao gồm vị trí trạm thu, loại beacon phát hiện được, độ nhạy và lịch sử cảnh báo. Dữ liệu được chuẩn hóa và lưu trữ trong M-2021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến trung tâm chỉ huy SAR quốc gia, cơ quan quản lý an toàn hàng hải và các đối tác SAR quốc tế.

## Acceptance Criteria
- Dữ liệu KCHTGT đài Cospas-Sarsat được chia sẻ thành công qua LGSP và RESTful API với thông tin trạm thu chính xác
- Dữ liệu về lịch sử cảnh báo EPIRB và định vị beacon được đồng bộ đầy đủ với hệ thống SAR quốc gia
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Cảnh báo EPIRB được chuyển tiếp đến trung tâm SAR trong vòng 5 phút sau khi tiếp nhận

## In Scope
- Chia sẻ thông tin trạm thu tín hiệu Cospas-Sarsat
- Chia sẻ dữ liệu cảnh báo EPIRB/PLB và vị trí phát hiện
- Đồng bộ với hệ thống chỉ huy SAR quốc gia
- Tích hợp với trục LGSP

## Out of Scope
- Vận hành trạm thu Cospas-Sarsat
- Xử lý tín hiệu beacon trực tiếp
- Quản lý beacon EPIRB trên tàu

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành trạm) | View, Nhập liệu cảnh báo |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Trung tâm SAR | View, Điều phối SAR |
| Đối tác quốc tế | View (theo thỏa thuận) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian trạm Cospas-Sarsat
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ kết nối API với hệ thống Cospas-Sarsat International Distress Safety Information System (IDS)
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **CospasSarsatTram**: id, ten_tram, toa_do, quoc_gia, loai_tram, che_do_hoat_dong, don_vien_quan_ly
- **CanBaoEPIRB**: id, epirb_id, toa_do, thoi_gian, beac_type, hinh_thuc_can_bao, don_vi_dieu_phoi
- **DanhSachBecon**: id, becon_id, loai_becon, toa_do_ghi_nhan, tinh_trang, don_vi_phan_bo

## Business Rules
1. Dữ liệu KCHTGT đài Cospas-Sarsat chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Cảnh báo EPIRB phải được chuyển tiếp ngay lập tức đến trung tâm SAR
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test chuyển tiếp cảnh báo EPIRB đến trung tâm SAR
- Test đồng bộ dữ liệu Cospas-Sarsat với hệ thống SAR quốc gia
