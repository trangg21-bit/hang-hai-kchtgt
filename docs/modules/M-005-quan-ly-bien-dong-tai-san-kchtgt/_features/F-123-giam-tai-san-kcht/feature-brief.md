---
id: F-123
name: "Giảm tài sản KCHT"
slug: giam-tai-san-kcht
module-id: M-005
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Giảm tài sản KCHT

## Description
Quản lý việc giảm nguyên giá tài sản kết cấu hạ tầng công nghệ giao thông (KCHTGT) do các nguyên nhân giải thể, hư hỏng, phá bỏ hoặc hết hạn sử dụng. Hệ thống ghi nhận nguyên nhân, tính toán giá trị hao mòn lũy kế và giá trị còn lại, đồng thời tự động cập nhật sổ kế toán tài sản.

## Business Intent
Đảm bảo việc giảm tài sản được ghi nhận chính xác, đầy đủ về nguyên nhân và giá trị, giúp duy trì tính trung thực của sổ sách kế toán tài sản và hỗ trợ ra quyết định thay thế, sửa chữa hoặc loại bỏ tài sản. Tránh tình trạng tài sản đã ngừng hoạt động vẫn được ghi nhận trên sổ sách, gây sai lệch số liệu quản lý.

## Flow Summary
Quy trình bắt đầu khi đơn vị quản lý phát hiện tài sản có nhu cầu giảm nguyên giá do giải thể, hư hỏng nặng hoặc hết hạn sử dụng. Người dùng tạo yêu cầu giảm tài sản, chọn nguyên nhân giảm, nhập biên bản kiểm tra hoặc báo cáo hư hỏng, và hệ thống tự động tính toán giá trị hao mòn lũy kế cùng giá trị còn lại dựa trên phương pháp tính hao mòn đã được cấu hình. Sau khi hoàn thành, hệ thống lưu hồ sơ giảm tài sản và chuyển sang quy trình phê duyệt (F-127) để lãnh đạo quyết định trước khi thực hiện nghiệp vụ giảm trên sổ kế toán.

## Acceptance Criteria
1. Người dùng có thể tạo yêu cầu giảm tài sản với đầy đủ thông tin bắt buộc (nguyên nhân, ngày giảm, biên bản kiểm tra).
2. Hệ thống tự động tính toán chính xác giá trị hao mòn lũy kế và giá trị còn lại của tài sản theo phương pháp đã được cấu hình.
3. Giá trị giảm không được vượt quá giá trị còn lại thực tế của tài sản.
4. Yêu cầu giảm tài sản được chuyển tự động sang quy trình phê duyệt F-127 sau khi đăng ký hoàn tất.

## In Scope
- Tạo mới yêu cầu giảm tài sản KCHTGT (giải thể, hư hỏng, phá bỏ, hết hạn)
- Tự động tính toán hao mòn lũy kế và giá trị còn lại
- Nhập và lưu nguyên nhân giảm cùng tài liệu kèm theo
- Tự động cập nhật sổ kế toán tài sản sau khi phê duyệt
- Chuyển yêu cầu giảm tài sản sang quy trình phê duyệt

## Out of Scope
- Quy trình bảo trì, sửa chữa tài sản (thuộc module khác)
- Thanh lý tài sản sau khi giảm (F-124)
- Tính toán hao mòn mới cho tài sản đã giảm
- Tích hợp với hệ thống kế toán tổng hợp

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên quản lý tài sản | Tạo, Xem yêu cầu giảm tài sản |
| Kế toán | Xem, Xác nhận giá trị hao mòn |
| Trưởng phòng | Xem, Sửa yêu cầu giảm tài sản chưa phê duyệt |
| Lãnh đạo | Xem yêu cầu giảm tài sản để phê duyệt |
| Admin hệ thống | Quản lý cấu hình phương pháp tính hao mòn |

## Entities
- **TaiSanKCHT**: id, loaiTaiSan, viTri, giaTriBanDau, HaoMonLucKe, GiaTriConLai, trangThai, createdAt, updatedAt
- **YeuCauGiamTaiSan**: id, taiSanId, NguyenNhanGiam, NgayGiam, BienBanKiemTra, haoMonLucKe, giaTriConLai, trangThai, createdAt, updatedAt

## Business Rules
1. Nguyên nhân giảm tài sản phải được chọn từ danh mục đã được quy định (giải thể, hư hỏng, phá bỏ, hết hạn sử dụng).
2. Hao mòn lũy kế phải được tính theo phương pháp đã được cấu hình cho từng loại tài sản và không được vượt quá nguyên giá.
3. Giá trị còn lại sau khi tính hao mòn phải luôn là số không hoặc dương.
4. Tài sản chỉ được giảm nếu đã được phê duyệt bởi lãnh đạo có thẩm quyền.

## Testing Strategy
Kiểm thử tính toán hao mòn với dữ liệu mẫu cho từng loại tài sản và từng phương pháp tính. Kiểm thử trường hợp biên: tài sản hư hỏng nặng giảm 100%, tài sản hết hạn với hao mòn gần bằng nguyên giá. Kiểm thử tích hợp luồng tạo yêu cầu giảm tài sản và chuyển sang phê duyệt. Sử dụng dữ liệu thực tế từ sổ kế toán để đối chiếu kết quả tính toán tự động của hệ thống.
