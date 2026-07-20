---
id: F-213
name: Chia sẻ KCHTGT đài LRIT
slug: chia-se-kchtgt-dai-lrit
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT đài LRIT

## Description
Chia sẻ dữ liệu và thông tin kỹ thuật của hệ thống đài Nhận dạng và Theo dõi khoảng cách xa (LRIT - Long Range Identification and Tracking) thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm vị trí tàu theo thời gian thực, lịch sử di chuyển và thông tin nhận dạng tàu, phục vụ công tác giám sát giao thông đường biển và an ninh hàng hải.

## Business Intent
Hệ thống LRIT là công cụ giám sát tàu biển tầm xa theo quy định của SOLAS, giúp cơ quan quản lý nhà nước theo dõi vị trí và hoạt động của tàu thuộc quyền quản lý. Việc chia sẻ dữ liệu KCHTGT đài LRIT giúp cơ quan quản lý giao thông đường biển, hải quan và kiểm ngư có thông tin liên tục về vị trí tàu, hỗ trợ công tác giám sát, ngăn chặn vi phạm và tăng cường an ninh hàng hải trong vùng biển chủ quyền.

## Flow Summary
Dữ liệu LRIT được thu thập từ vệ tinh thông tin liên lạc hàng hải (Inmarsat, Iridium), được xử lý, chuẩn hóa và lưu trữ trong M-021. Dữ liệu bao gồm vị trí tàu theo chu kỳ 6 giờ (hoặc yêu cầu đặc biệt), thông tin nhận dạng (IMO, MMSI, tên tàu), hướng đi và tốc độ. Dữ liệu được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các cơ quan quản lý nhà nước có thẩm quyền giám sát tàu biển.

## Acceptance Criteria
- Dữ liệu KCHTGT đài LRIT được chia sẻ thành công qua LGSP và RESTful API với vị trí tàu chính xác đến ± 1nm
- Dữ liệu vị trí tàu được cập nhật theo chu kỳ 6 giờ hoặc yêu cầu đặc biệt
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Lịch sử di chuyển tàu được lưu trữ và truy xuất đầy đủ theo quy định

## In Scope
- Chia sẻ dữ liệu vị trí tàu LRIT theo thời gian thực
- Chia sẻ thông tin nhận dạng tàu (IMO, MMSI, tên, quốc tịch)
- Chia sẻ lịch sử di chuyển và xu hướng航线
- Tích hợp với hệ thống giám sát giao thông đường biển

## Out of Scope
- Thu thập dữ liệu LRIT từ vệ tinh
- Vận hành trạm LRIT mặt đất
- Xử lý tín hiệu vệ tinh

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị quản lý tàu) | View, yêu cầu vị trí đặc biệt |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý nhà nước | View, Yêu cầu vị trí, Export báo cáo |
| Hải quan / Kiểm ngư | View (theo thẩm quyền) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí tàu LRIT
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Dữ liệu LRIT lưu trữ trong cơ sở dữ liệu hỗ trợ truy vấn vị trí theo thời gian (Time-Geospatial DB)
- Hỗ trợ API yêu cầu vị trí đặc biệt (special request) theo SOLAS

## Entities
- **ThongTinLRIT**: id, mmsi, imo, ten_tau, quoc_tich, toa_do_cuoi_cung, thoi_gian, huong_di, toc_do
- **LichSuDiChuyen**: id, mmsi, toa_do, thoi_gian, huong_di, toc_do
- **YeuCauViTri**: id, mmsi, loai_yeu_cau, don_yeu_cau, trang_thai, thoi_gian_nhan

## Business Rules
1. Dữ liệu KCHTGT đài LRIT chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Dữ liệu LRIT chỉ được truy cập bởi cơ quan có thẩm quyền theo quy định pháp luật
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test truy xuất vị trí tàu theo chu kỳ và yêu cầu đặc biệt
- Test đồng bộ dữ liệu LRIT với hệ thống giám sát giao thông đường biển
