---
id: F-225
name: Chia sẻ KCHTGT tổng hợp KCHTGT - hệ thống đèn biển
slug: chia-se-kchtgt-tong-hop-kchtgt-he-thong-den-bien
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT tổng hợp KCHTGT - hệ thống đèn biển

## Description
Chia sẻ dữ liệu tổng hợp về hệ thống đèn biển (hải đăng, đèn dẫn đường) thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm thông tin vị trí, tầm chiếu, đặc tính ánh sáng, tình trạng vận hành, công suất và lịch sử bảo trì của toàn bộ hệ thống đèn biển dọc bờ biển và tại các đảo, phục vụ đảm bảo an toàn hàng hải và công tác duy tu hệ thống dẫn đường biển.

## Business Intent
Hệ thống đèn biển là xương sống của hệ thống dẫn đường hàng hải, giúp tàu thuyền xác định vị trí, tránh chướng ngại vật và tìm đường vào cảng an toàn trong mọi điều kiện thời tiết và ánh sáng. Việc chia sẻ dữ liệu tổng hợp KCHTGT về hệ thống đèn biển giúp cơ quan quản lý hàng hải, đơn vị vận hành đèn biển và tàu thuyền có thông tin toàn diện về tầm chiếu, tình trạng và phạm vi phủ sáng của từng đèn biển, góp phần duy trì chất lượng dẫn đường và cảnh báo sớm khi đèn biển có sự cố.

## Flow Summary
Dữ liệu KCHTGT tổng hợp về hệ thống đèn biển được thu thập từ hệ thống quản lý đèn biển, bao gồm vị trí, tầm chiếu, đặc tính ánh sáng, tình trạng hoạt động và lịch bảo trì. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến đơn vị quản lý đèn biển, cơ quan quản lý hàng hải, tàu thuyền và hệ thống thông tin hàng hải quốc gia.

## Acceptance Criteria
- Dữ liệu KCHTGT tổng hợp về hệ thống đèn biển được chia sẻ thành công qua LGSP và RESTful API với thông tin tầm chiếu và đặc tính ánh sáng chính xác
- Dữ liệu về tình trạng vận hành của từng đèn biển được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Đèn biển sự cố được cập nhật và cảnh báo trong vòng 2 giờ sau khi phát hiện

## In Scope
- Chia sẻ danh mục và vị trí toàn bộ đèn biển
- Chia sẻ thông tin tầm chiếu, đặc tính ánh sáng và công suất
- Chia sẻ tình trạng vận hành và lịch sử bảo trì
- Tích hợp với hệ thống quản lý đèn biển

## Out of Scope
- Vận hành đèn biển thực tế
- Bảo trì đèn biển tại hiện trường
- Xây dựng mới đèn biển

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành đèn biển) | View, Cập nhật tình trạng đèn |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan quản lý hàng hải | View, Export báo cáo |
| Tàu thuyền | View (thông tin dẫn đường) |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí đèn biển
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API tìm kiếm đèn biển theo tầm chiếu, đặc tính và khu vực
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **DenBien**: id, ten_den, toa_do, loai_den, tan_chieu, dac_tinh_anh_sang, cong_suat, tinh_trang
- **LichSuBaoTri_Den**: id, den_id, ngay_bao_tri, noi_dung, don_vi_thuc_hien, ket_qua
- **DenSuCo**: id, den_id, ngay_phat_hien, loai_su_co, don_vi_bao_cao, trang_thai

## Business Rules
1. Dữ liệu KCHTGT tổng hợp về hệ thống đèn biển chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Đèn biển sự cố phải được cập nhật và cảnh báo ngay lập tức
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tìm kiếm đèn biển theo tầm chiếu, đặc tính và khu vực
- Test cảnh báo đèn biển sự cố trong vòng 2 giờ
