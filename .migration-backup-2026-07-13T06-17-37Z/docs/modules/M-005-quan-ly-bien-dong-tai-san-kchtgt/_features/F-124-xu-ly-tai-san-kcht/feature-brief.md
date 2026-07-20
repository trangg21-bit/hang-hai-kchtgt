---
id: F-124
name: "Xử lý tài sản KCHT"
slug: xu-ly-tai-san-kcht
module-id: M-005
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Xử lý tài sản KCHT

## Description
Quản lý các nghiệp vụ xử lý tài sản kết cấu hạ tầng công nghệ giao thông (KCHTGT) sau khi giảm nguyên giá, bao gồm điều chuyển giữa các đơn vị, bàn giao cho bên nhận quản lý, thanh lý hoặc phá bỏ. Hệ thống hỗ trợ lập hồ sơ xử lý, kiểm tra điều kiện và thực hiện cập nhật trạng thái tài sản sau khi xử lý hoàn tất.

## Business Intent
Đảm bảo mọi nghiệp vụ xử lý tài sản sau giảm nguyên giá được thực hiện đúng quy trình, có đầy đủ hồ sơ pháp lý và được phê duyệt bởi người có thẩm quyền. Tránh tình trạng tài sản bị mất tích, sử dụng sai mục đích hoặc xử lý thiếu thủ tục, đồng thời duy trì tính minh bạch và trách nhiệm giải trình trong quản lý tài sản.

## Flow Summary
Quy trình bắt đầu khi đơn vị quản lý cần xử lý tài sản sau khi đã có yêu cầu giảm nguyên giá được phê duyệt. Người dùng tạo hồ sơ xử lý tài sản, chọn loại xử lý (điều chuyển, bàn giao, thanh lý, phá bỏ) và nhập thông tin liên quan như bên nhận, lý do xử lý, giá trị thanh lý. Hệ thống kiểm tra điều kiện xử lý, tạo hồ sơ xử lý với đầy đủ chứng từ kèm theo, sau đó chuyển sang quy trình phê duyệt (F-127). Sau khi phê duyệt, hệ thống tự động cập nhật trạng thái tài sản, ghi nhận giá trị thanh lý nếu có, và hoàn tất xử lý.

## Acceptance Criteria
1. Người dùng có thể tạo hồ sơ xử lý tài sản với đầy đủ thông tin bắt buộc (loại xử lý, bên nhận, lý do, chứng từ kèm theo).
2. Hệ thống kiểm tra điều kiện xử lý: tài sản phải có trạng thái giảm nguyên giá được phê duyệt trước khi cho phép tạo hồ sơ xử lý.
3. Hồ sơ xử lý được chuyển tự động sang quy trình phê duyệt F-127 sau khi hoàn thành đăng ký.
4. Sau khi phê duyệt, hệ thống tự động cập nhật trạng thái tài sản và ghi nhận các nghiệp vụ liên quan.

## In Scope
- Tạo hồ sơ xử lý tài sản (điều chuyển, bàn giao, thanh lý, phá bỏ)
- Nhập thông tin bên nhận, lý do xử lý và giá trị thanh lý (nếu có)
- Kiểm tra điều kiện xử lý tài sản tự động
- Chuyển hồ sơ xử lý sang quy trình phê duyệt
- Cập nhật trạng thái tài sản sau khi xử lý hoàn tất

## Out of Scope
- Quy trình mua bán tài sản (thuộc module khác)
- Tính toán hao mòn tài sản
- Quản lý hồ sơ pháp lý ban đầu của tài sản
- Tích hợp với hệ thống đấu thầu, mua sắm

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên quản lý tài sản | Tạo, Xem hồ sơ xử lý tài sản |
| Kế toán | Xem, Xác nhận giá trị thanh lý |
| Trưởng phòng | Xem, Sửa hồ sơ xử lý chưa phê duyệt |
| Lãnh đạo | Xem, Phê duyệt hồ sơ xử lý tài sản |
| Admin hệ thống | Quản lý danh mục loại xử lý, phân quyền |

## Entities
- **TaiSanKCHT**: id, loaiTaiSan, viTri, giaTriBanDau, HaoMonLucKe, GiaTriConLai, trangThai, createdAt, updatedAt
- **HoSoXuLyTaiSan**: id, taiSanId, loaiXuLy, benNhan, LyDoXuLy, GiaTriThanhLy, trangThai, createdAt, updatedAt

## Business Rules
1. Tài sản chỉ được xử lý khi đã có yêu cầu giảm nguyên giá được phê duyệt.
2. Loại xử lý phải được chọn từ danh mục đã được quy định (điều chuyển, bàn giao, thanh lý, phá bỏ).
3. Giá trị thanh lý không được vượt quá giá trị còn lại của tài sản.
4. Hồ sơ xử lý phải có đầy đủ chứng từ kèm theo (biên bản, quyết định, hợp đồng).
5. Trạng thái tài sản chỉ được cập nhật sau khi hồ sơ xử lý được phê duyệt.

## Testing Strategy
Kiểm thử từng loại xử lý (điều chuyển, bàn giao, thanh lý, phá bỏ) với dữ liệu mẫu khác nhau. Kiểm thử trường hợp biên: tài sản chưa được giảm nguyên giá nhưng cố gắng xử lý, hồ sơ thiếu chứng từ bắt buộc. Kiểm thử tích hợp luồng tạo hồ sơ xử lý, phê duyệt và cập nhật trạng thái tài sản tự động. Sử dụng dữ liệu thực tế để đối chiếu tính chính xác của giá trị thanh lý và trạng thái tài sản cuối cùng.
