---
id: F-132
name: "Quản lý quy hoạch bến cảng"
slug: quan-ly-quy-hoach-ben-cang
module-id: M-006
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:29Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý quy hoạch bến cảng

## Description

Hệ thống quản lý quy hoạch bến cảng hàng hải, bao gồm việc tiếp nhận, lưu trữ, quản lý phiên bản và theo dõi tiến độ thực hiện các kế hoạch quy hoạch bến cảng, bao gồm quy hoạch tổng thể, quy hoạch chi tiết, bản đồ hiện trạng và các đồ án quy hoạch được cơ quan nhà nước có thẩm quyền phê duyệt.

## Business Intent

Đảm bảo công tác quy hoạch bến cảng được thực hiện bài bản, có hệ thống theo đúng trình tự phê duyệt của cơ quan nhà nước, giúp ban lãnh đạo cảng và các bên liên quan dễ dàng tra cứu, theo dõi tiến độ và ra quyết định đầu tư dựa trên quy hoạch đã được phê duyệt, tránh xung đột giữa các hạng mục đầu tư mới và quy hoạch hiện hành.

## Flow Summary

Quản lý quy hoạch tiếp nhận đồ án quy hoạch bến cảng từ cơ quan có thẩm quyền, đăng ký với đầy đủ thông tin (tên đồ án, cơ quan phê duyệt, ngày phê duyệt, phạm vi áp dụng, tỷ lệ bản đồ). Hệ thống lưu trữ các file bản đồ, đồ án và cho phép gắn kèm biên bản phê duyệt. Người dùng xem được tiến độ thực hiện từng hạng mục trong quy hoạch, so sánh quy hoạch hiện hành với quy hoạch đã phê duyệt. Khi có quy hoạch mới, hệ thống lưu trữ quy hoạch cũ làm lịch sử và đánh dấu quy hoạch hiện hành.

## Acceptance Criteria

- Người dùng có thể đăng ký quy hoạch bến cảng mới với đầy đủ thông tin (tên đồ án, cơ quan phê duyệt, ngày phê duyệt, phạm vi áp dụng)
- Hệ thống cho phép upload và lưu trữ file bản đồ, đồ án quy hoạch và biên bản phê duyệt
- Người dùng có thể xem danh sách quy hoạch theo tình trạng (hiện hành, đã thay thế, lịch sử)
- Hệ thống tự động đánh dấu quy hoạch hiện hành khi quy hoạch mới được phê duyệt
- Chỉ Admin mới được phép xóa hoặc thay thế quy hoạch hiện hành

## In Scope

- Đăng ký và quản lý các đồ án quy hoạch bến cảng hàng hải
- Upload và lưu trữ file bản đồ, đồ án quy hoạch, biên bản phê duyệt
- Theo dõi tiến độ thực hiện các hạng mục trong quy hoạch
- Quản lý phiên bản quy hoạch (hiện hành, đã thay thế, lịch sử)
- So sánh quy hoạch hiện hành với quy hoạch đã thay thế

## Out of Scope

- Tự động vẽ bản đồ quy hoạch hoặc xử lý bản đồ GIS
- Tích hợp với quy hoạch tổng thể phát triển kinh tế - xã hội địa phương
- Quản lý đấu thầu các dự án quy hoạch
- Tự động kiểm tra tính tuân thủ quy hoạch với quy định môi trường

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem quy hoạch hiện hành, Xem thông tin quy hoạch |
| Planner | Tạo, Chỉnh sửa quy hoạch, Upload file bản đồ và đồ án |
| Admin | Phê duyệt, Đánh dấu hiện hành, Xóa, Vô hiệu hóa quy hoạch, Quản lý phân quyền |

## Entities

- **QuyHoachBenCang**: id, tenDoAn, coQuanPheDuyet, ngayPheDuyet, phamViApDung, tiLeBanDo, tinhTrang, duongDanFile, nguoiTao, ngayTao, nguoiSuaDoi, ngaySuaDoi
- **HamMucQuyHoach**: id, quyHoachId, tenHamMuc, donViTinh, giaTriKếHoach, giaTriThucTe, trangThai
- **FileQuyHoach**: id, quyHoachId, tenFile, loaiFile, duongDan, kichThuoc, ngayTaiLên

## Business Rules

1. Quy hoạch bến cảng phải có cơ quan phê duyệt và ngày phê duyệt hợp lệ
2. Một quy hoạch chỉ được đánh dấu là "hiện hành" nếu đã có biên bản phê duyệt đầy đủ
3. Khi đánh dấu quy hoạch mới là hiện hành, quy hoạch cũ tự động chuyển sang trạng thái "đã thay thế"
4. File bản đồ quy hoạch phải là định dạng được hệ thống hỗ trợ (PDF, DWG, SHP)

## Testing Strategy

- Test đơn vị hàm đăng ký quy hoạch và upload file bản đồ
- Test tích hợp luồng đăng ký → upload → phê duyệt → đánh dấu hiện hành
- Test quản lý phiên bản với bộ dữ liệu quy hoạch mẫu có nhiều phiên bản
- Test so sánh quy hoạch hiện hành với quy hoạch đã thay thế
- Test phân quyền: Planner không được phép đánh dấu hiện hành, Admin mới có quyền
