---
id: F-209
name: Chia sẻ KCHTGT luồng hàng hải
slug: chia-se-kchtgt-luong-hang-hai
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT luồng hàng hải

## Description
Chia sẻ dữ liệu và thông tin kỹ thuật của hệ thống luồng hàng hải thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT) bao gồm tuyến luồng, chướng ngại vật ngầm, độ sâu luồng, hệ thống tiêu dẫn hàng hải và các thông tin liên quan phục vụ công tác duy tu bảo dưỡng luồng và bảo đảm an toàn hàng hải.

## Business Intent
Luồng hàng hải là tuyến đường huyết mạch cho hoạt động vận tải biển và cảng biển. Việc chia sẻ dữ liệu KCHTGT luồng hàng hải giúp cơ quan quản lý luồng, đơn vị duy tu và tàu thuyền có thông tin chính xác về độ sâu, chướng ngại vật, và điều kiện hàng hải, từ đó giảm thiểu rủi ro tai nạn hàng hải và nâng cao hiệu quả khai thác hệ thống luồng.

## Flow Summary
Dữ liệu KCHTGT luồng hàng hải được thu thập từ đo đạc thủy âm, đo đạc địa hình đáy biển, hệ thống quan trắc thời tiết và hải văn, sau đó được xử lý, kiểm tra chất lượng và lưu trữ trong M-021. Dữ liệu sẽ được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và qua trục chia sẻ dữ liệu quốc gia LGSP đến các đơn vị quản lý luồng, cảng biển, kiểm soát giao thông đường thủy và hệ thống cảnh báo hàng hải.

## Acceptance Criteria
- Dữ liệu KCHTGT luồng hàng hải được chia sẻ thành công qua LGSP và RESTful API với độ chính xác tọa độ ± 0,5m
- Thông tin về độ sâu luồng, chướng ngại vật ngầm và hệ thống tiêu dẫn được đồng bộ đầy đủ với các hệ thống đầu cuối
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Cập nhật dữ liệu luồng hàng hải được phản ánh trong vòng 24 giờ sau khi đo đạc

## In Scope
- Chia sẻ dữ liệu tuyến luồng chính và phụ
- Chia sẻ dữ liệu chướng ngại vật ngầm, đá ngầm
- Chia sẻ dữ liệu độ sâu luồng và bản đồ địa hình đáy biển
- Chia sẻ thông tin hệ thống tiêu dẫn hàng hải

## Out of Scope
- Đo đạc thủy âm trực tiếp
- Xây dựng hệ thống quan trắc thời tiết
- Quản lý tàu thuyền trên luồng

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị đo đạc) | View, Upload dữ liệu đo đạc |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý luồng | View, Export báo cáo |
| Đơn vị bên thứ ba | View (theo ủy quyền) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP cho chia sẻ dữ liệu không gian luồng hàng hải
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Dữ liệu thủy âm được lưu trữ dưới định dạng chuẩn S-57/S-63 của IHO
- Hỗ trợ định dạng GIS (GeoJSON, Shapefile) cho dữ liệu không gian

## Entities
- **LuongHangHai**: id, ten_luong, toa_do_truc, chieu_dai, do_sau_thiet_ke, do_sau_thuc_te, loai_luong, tinh_trang
- **ThuongNgaiNgam**: id, ten_thuong_ngai, toa_do, chieu_sau, kich_thuoc, loai_thuong_ngai, ngay_phat_hien
- **HieuTuong**: id, ten_hieu_tuong, toa_do, loai_hieu_tuong, mauso, trang_thai

## Business Rules
1. Dữ liệu KCHTGT luồng hàng hải chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Dữ liệu độ sâu phải được cập nhật định kỳ theo chu kỳ đo đạc quy định
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test chuyển đổi định dạng dữ liệu thủy âm (S-57, GeoJSON, Shapefile)
- Test đồng bộ dữ liệu luồng hàng hải với các hệ thống chuyên ngành
