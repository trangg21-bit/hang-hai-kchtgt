---
id: F-218
name: Chia sẻ KCHTGT thông tin tổng hợp KCHTGT hàng hải
slug: chia-se-kchtgt-thong-tin-tong-hop-kchtgt-hang-hai
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT thông tin tổng hợp KCHTGT hàng hải

## Description
Chia sẻ dữ liệu tổng hợp và báo cáo tổng hợp về toàn bộ hệ thống KCHTGT Hàng hải thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông, bao gồm các chỉ số hiệu suất, thống kê hoạt động, xu hướng khai thác và báo cáo tổng hợp theo kỳ, phục vụ công tác quản lý điều hành và ra quyết định chiến lược cho hệ thống hạ tầng KCHTGT hàng hải quốc gia.

## Business Intent
Thông tin tổng hợp KCHTGT Hàng hải là công cụ hỗ trợ ra quyết định quan trọng cho lãnh đạo ngành giao thông vận tải và cơ quan quản lý nhà nước. Việc chia sẻ dữ liệu tổng hợp giúp lãnh đạo có cái nhìn toàn cảnh về tình hình vận hành, hiệu quả đầu tư, xu hướng phát triển và các chỉ số then chốt (KPI) của toàn bộ hệ thống KCHTGT hàng hải, từ đó lập kế hoạch chiến lược, phân bổ ngân sách và điều phối nguồn lực hiệu quả.

## Flow Summary
Dữ liệu tổng hợp KCHTGT Hàng hải được thu thập và xử lý từ các nguồn dữ liệu chi tiết đã được tích lũy trong M-021, bao gồm dữ liệu từ các đài thông tin, hệ thống quan trắc, cảng cạn, LRIT và các thành phần hạ tầng khác. Dữ liệu được tổng hợp theo các chỉ số KPI, báo cáo theo kỳ (tháng, quý, năm) và chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các cấp quản lý lãnh đạo, cơ quan hoạch định chính sách và hệ thống thông tin điều hành.

## Acceptance Criteria
- Dữ liệu tổng hợp KCHTGT Hàng hải được chia sẻ thành công qua LGSP và RESTful API với báo cáo chính xác, đầy đủ
- Các chỉ số KPI và xu hướng được tổng hợp đúng theo quy định
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Báo cáo tổng hợp được cập nhật định kỳ theo chu kỳ quy định (tháng, quý, năm)

## In Scope
- Chia sẻ thông tin tổng hợp toàn hệ thống KCHTGT hàng hải
- Chia sẻ báo cáo KPI và chỉ số hiệu suất
- Chia sẻ xu hướng và thống kê hoạt động
- Tích hợp với hệ thống thông tin điều hành quốc gia

## Out of Scope
- Thu thập dữ liệu thô từ các nguồn
- Xây dựng hệ thống báo cáo mới
- Phân tích dự báo phức tạp

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị tổng hợp) | View, Tạo báo cáo tổng hợp |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Lãnh đạo ngành GTVT | View, Export báo cáo tổng hợp |
| Cơ quan hoạch định chính sách | View, Phân tích xu hướng |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu tổng hợp và báo cáo
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ API lấy báo cáo tổng hợp theo kỳ và khoảng thời gian tùy chỉnh
- Dữ liệu tổng hợp lưu trữ trong cơ sở dữ liệu phân tích (OLAP)

## Entities
- **BaoCaoTongHop**: id, ky_bao_cao, loai_bao_cao, tong_so_hinh_muc, tong_so_dai_hoat_dong, tong_so_su_co, don_vi_phat_hanh
- **ChiSoKPI**: id, ten_chi_so, gia_tri, ky_so_sanh, xu_huong, don_vi_tinh
- **ThongKeHoatDong**: id, ky_thong_ke, so_tai_san_hoat_dong, so_tai_san_bao_tri, so_su_co, hieu_suat

## Business Rules
1. Dữ liệu KCHTGT thông tin tổng hợp chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Báo cáo tổng hợp phải được phê duyệt trước khi phát hành
4. Tất cả thay đổi dữ liệu đều phải có xác thực JWT hợp lệ

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test tổng hợp và báo cáo KPI theo kỳ
- Test đồng bộ dữ liệu tổng hợp với hệ thống thông tin điều hành
