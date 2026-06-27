---
id: F-134
name: "Cập nhật quy hoạch bến cảng"
slug: cap-nhat-quy-hoach-ben-cang
module-id: M-006
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:29Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Cập nhật quy hoạch bến cảng

## Description

Hệ thống cập nhật quy hoạch bến cảng hàng hải, cho phép quản lý quy hoạch các thay đổi, bổ sung hoặc điều chỉnh quy hoạch bến cảng đã được phê duyệt, bao gồm việc đăng ký điều chỉnh quy hoạch, đánh giá tác động, phê duyệt thay đổi và cập nhật bản quy hoạch hiện hành với đầy đủ hồ sơ pháp lý và kỹ thuật đi kèm.

## Business Intent

Đảm bảo mọi thay đổi đối với quy hoạch bến cảng đã được phê duyệt đều được quản lý chặt chẽ, có đầy đủ hồ sơ pháp lý và kỹ thuật, tránh tình trạng điều chỉnh quy hoạch thiếu kiểm soát gây xung đột với quy hoạch tổng thể, giúp ban lãnh đạo cảng và cơ quan nhà nước có thẩm quyền kiểm soát chặt chẽ mọi thay đổi trong quá trình phát triển bến cảng hàng hải.

## Flow Summary

Người đăng ký cập nhật quy hoạch với lý do điều chỉnh (mở rộng bến, thay đổi công năng, nâng cấp thiết bị), mô tả chi tiết nội dung thay đổi và phạm vi ảnh hưởng. Hệ thống tự động tạo báo cáo đánh giá tác động sơ bộ, gửi phê duyệt theo quy trình多层次 (trưởng phòng → phòng kỹ thuật → giám đốc). Sau khi phê duyệt, hệ thống cập nhật quy hoạch hiện hành, lưu quy hoạch cũ làm lịch sử và gắn kèm toàn bộ hồ sơ phê duyệt thay đổi. Người dùng có thể xem lịch sử các lần điều chỉnh đã được phê duyệt của từng quy hoạch.

## Acceptance Criteria

- Người dùng có thể đăng ký điều chỉnh quy hoạch với đầy đủ thông tin (lý do, nội dung thay đổi, phạm vi ảnh hưởng)
- Hệ thống tự động sinh báo cáo đánh giá tác động sơ bộ khi đăng ký điều chỉnh
- Quy trình phê duyệt多层次 hoạt động đúng theo phân quyền (trưởng phòng → phòng kỹ thuật → giám đốc)
- Sau phê duyệt, hệ thống tự động cập nhật quy hoạch hiện hành và lưu lịch sử
- Người dùng có thể xem lịch sử điều chỉnh quy hoạch đã được phê duyệt

## In Scope

- Đăng ký điều chỉnh, bổ sung hoặc thay đổi quy hoạch bến cảng
- Sinh báo cáo đánh giá tác động sơ bộ tự động
- Quản lý quy trình phê duyệt多层次 thay đổi quy hoạch
- Cập nhật quy hoạch hiện hành sau khi phê duyệt
- Lưu trữ lịch sử điều chỉnh quy hoạch

## Out of Scope

- Tự động vẽ lại bản đồ quy hoạch sau điều chỉnh
- Tích hợp với hệ thống quản lý dự án đầu tư xây dựng
- Quản lý hồ sơ xin phép điều chỉnh với cơ quan nhà nước
- Tự động kiểm tra tính tuân thủ điều chỉnh với quy định môi trường

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem lịch sử điều chỉnh, Xem thông tin quy hoạch |
| Planner | Đăng ký điều chỉnh, Đính kèm tài liệu đánh giá tác động |
| DepartmentHead | Phê duyệt điều chỉnh ở mức trưởng phòng |
| TechnicalDirector | Phê duyệt điều chỉnh ở mức phòng kỹ thuật |
| Director | Phê duyệt cuối cùng, Cập nhật quy hoạch hiện hành |
| Admin | Xóa, Vô hiệu hóa hồ sơ điều chỉnh, Quản lý phân quyền |

## Entities

- **DieuChinhQuyHoach**: id, quyHoachId, loaiDieuChinh, lyDo, moTaChiTiet, phamViAnhHuong, tinhTrang, nguoiDangKy, ngayDangKy, nguoiSuaDoi, ngaySuaDoi
- **PheDuyetDieuChinh**: id, dieuChinhId, capPheDuyet, trangThai, nguoiPheDuyet, ngayPheDuyet, ghiChu
- **BaoCaoDanhGiaTacDong**: id, dieuChinhId, moTa, phuThuong, thoiGianThucHien, duongDanFile, nguoiTao, ngayTao

## Business Rules

1. Điều chỉnh quy hoạch phải có lý do và mô tả chi tiết trước khi gửi phê duyệt
2. Quy trình phê duyệt phải đi theo đúng thứ tự: trưởng phòng → phòng kỹ thuật → giám đốc
3. Chỉ sau khi có đủ 3 chữ ký phê duyệt, quy hoạch mới được tự động cập nhật
4. Mọi điều chỉnh quy hoạch đều phải có báo cáo đánh giá tác động đi kèm
5. Quy hoạch cũ được lưu tự động vào lịch sử khi quy hoạch mới được phê duyệt

## Testing Strategy

- Test đơn vị hàm đăng ký điều chỉnh quy hoạch và sinh báo cáo đánh giá tác động
- Test tích hợp quy trình phê duyệt多层次 với bộ dữ liệu điều chỉnh mẫu
- Test tự động cập nhật quy hoạch hiện hành sau khi phê duyệt đầy đủ
- Test lưu lịch sử điều chỉnh với nhiều lần điều chỉnh cho cùng quy hoạch
- Test phân quyền: Planner không được phép phê duyệt, từng cấp chỉ phê duyệt đúng quyền của mình
