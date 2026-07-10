---
id: F-219
name: Chia sẻ KCHTGT thông tin bảo trì KCHTGT hàng hải
slug: chia-se-kchtgt-thong-tin-bao-tri-kchtgt-hang-hai
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT thông tin bảo trì KCHTGT hàng hải

## Description
Chia sẻ dữ liệu và thông tin về hoạt động bảo trì, sửa chữa của toàn bộ hệ thống KCHTGT Hàng hải thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông, bao gồm lịch bảo trì định kỳ, bảo trì theo yêu cầu, báo cáo sự cố, chi phí bảo trì, đơn vị thực hiện và kết quả nghiệm thu, giúp đảm bảo hệ thống hạ tầng KCHTGT hàng hải luôn trong tình trạng hoạt động tốt.

## Business Intent
Hoạt động bảo trì định kỳ và kịp thời là yếu tố then chốt để duy trì độ tin cậy của hệ thống KCHTGT Hàng hải, đặc biệt đối với các công trình, thiết bị quan trọng phục vụ an toàn hàng hải và tìm kiếm cứu nạn. Việc chia sẻ thông tin bảo trì KCHTGT giúp cơ quan quản lý, đơn vị vận hành và đối tác bảo trì có cái nhìn toàn diện về kế hoạch, tiến độ và chất lượng bảo trì, từ đó chủ động nguồn lực, dự phòng rủi ro và đảm bảo tuân thủ các yêu cầu bảo trì theo quy định.

## Flow Summary
Dữ liệu KCHTGT thông tin bảo trì được thu thập từ hệ thống quản lý bảo trì (CMMS), đơn vị bảo trì và báo cáo thực địa, bao gồm lịch bảo trì, nội dung công việc, chi phí và kết quả nghiệm thu. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị vận hành, đơn vị bảo trì, cơ quan quản lý và hệ thống quản lý bảo trì tập trung của ngành GTVT.

## Acceptance Criteria
- Dữ liệu KCHTGT thông tin bảo trì được chia sẻ thành công qua LGSP và RESTful API với lịch bảo trì chính xác
- Dữ liệu về chi phí, đơn vị thực hiện và kết quả nghiệm thu được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Thông tin bảo trì được cập nhật sau mỗi lần nghiệm thu hoàn thành

## In Scope
- Chia sẻ lịch bảo trì định kỳ và theo yêu cầu
- Chia sẻ báo cáo công việc bảo trì và nghiệm thu
- Chia sẻ chi phí và thông tin đơn vị bảo trì
- Tích hợp với hệ thống quản lý bảo trì tập trung

## Out of Scope
- Thực hiện công tác bảo trì thực tế
- Lập kế hoạch bảo trì tổng thể
- Thẩm định hợp đồng bảo trì

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành) | View, Yêu cầu bảo trì |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Đơn vị bảo trì | View, Nhập báo cáo bảo trì |
| Cơ quan quản lý | View, Export báo cáo |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí hạng mục bảo trì
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API yêu cầu bảo trì và theo dõi tiến độ
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **KeHoachBaoTri**: id, hinh_muc_id, loai_bao_tri, ngay_bat_dau, ngay_ket_thuc, don_vi_thuc_hien, chi_phi
- **BaoCaoBaoTri**: id, ke_hoach_id, noi_dung, ket_qua, ngay_nghiem_thu, nguoi_kiem_tra
- **YeuCauBaoTri**: id, hinh_muc_id, loai_su_co, mo_ta, don_yeu_cau, trang_thai

## Business Rules
1. Dữ liệu KCHTGT thông tin bảo trì chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Báo cáo bảo trì phải được nghiệm thu và ký xác nhận trước khi lưu vào hệ thống
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test yêu cầu bảo trì và theo dõi tiến độ
- Test đồng bộ dữ liệu bảo trì với hệ thống quản lý bảo trì tập trung
