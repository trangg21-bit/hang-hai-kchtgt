---
id: F-122
name: "Tăng tài sản KCHT"
slug: tang-tai-san-kcht
module-id: M-005
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Tăng tài sản KCHT

## Description
Quản lý việc bổ sung, tăng thêm tài sản kết cấu hạ tầng công nghệ giao thông (KCHTGT) mới vào hệ thống, bao gồm phao tiêu, trạm radar, đèn biển và các thiết bị phụ trợ khác. Hệ thống hỗ trợ đăng ký, kiểm tra hợp lệ, và ghi nhận nguyên giá ban đầu khi tài sản mới được đưa vào quản lý.

## Business Intent
Đảm bảo toàn bộ tài sản mới được bổ sung vào danh mục quản lý đều được ghi nhận đầy đủ, chính xác về thông tin kỹ thuật và giá trị ban đầu, tạo cơ sở cho việc theo dõi, khai thác và tính hao mòn sau này. Tránh tình trạng tài sản mới được đưa vào sử dụng nhưng không được ghi nhận trong hệ thống quản lý.

## Flow Summary
Quy trình bắt đầu khi đơn vị quản lý phát sinh nhu cầu bổ sung tài sản KCHTGT mới. Người dùng tạo yêu cầu tăng tài sản, nhập thông tin chi tiết bao gồm loại tài sản, vị trí lắp đặt, thông số kỹ thuật, nguồn kinh phí và nguyên giá ban đầu. Hệ thống tự động kiểm tra tính hợp lệ của các trường bắt buộc, sau đó lưu hồ sơ tài sản mới. Sau khi hoàn thành đăng ký, tài sản mới được chuyển sang trạng thái đang chờ phê duyệt và được chuyển đến quy trình phê duyệt biến động (F-127) để lãnh đạo xem xét, quyết định trước khi chính thức đưa vào quản lý.

## Acceptance Criteria
1. Người dùng có thể tạo yêu cầu tăng tài sản mới với đầy đủ thông tin bắt buộc (loại tài sản, vị trí, thông số kỹ thuật, nguyên giá).
2. Hệ thống tự động kiểm tra và báo lỗi nếu thông tin nhập vào thiếu hoặc không hợp lệ trước khi cho phép lưu.
3. Tài sản mới được tạo tự động cập nhật tổng nguyên giá của danh mục tài sản tương ứng.
4. Yêu cầu tăng tài sản mới được chuyển tự động sang quy trình phê duyệt F-127 sau khi đăng ký hoàn tất.

## In Scope
- Tạo mới yêu cầu tăng tài sản KCHTGT (phao tiêu, trạm radar, đèn biển, thiết bị phụ trợ)
- Nhập và lưu thông tin tài sản mới (loại, vị trí, thông số kỹ thuật, nguồn kinh phí, nguyên giá)
- Kiểm tra hợp lệ dữ liệu tự động trước khi lưu
- Tự động cập nhật tổng nguyên giá danh mục tài sản
- Chuyển yêu cầu tăng tài sản sang quy trình phê duyệt

## Out of Scope
- Quy trình mua sắm, đấu thầu tài sản mới (thuộc module khác)
- Sửa đổi thông tin tài sản đã được phê duyệt (F-124)
- Tính toán hao mòn tài sản mới sau khi phê duyệt
- Tích hợp với hệ thống quản lý kho vật tư

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên quản lý tài sản | Tạo, Xem yêu cầu tăng tài sản |
| Trưởng phòng | Xem, Sửa yêu cầu tăng tài sản chưa phê duyệt |
| Lãnh đạo | Xem yêu cầu tăng tài sản để phê duyệt |
| Admin hệ thống | Quản lý danh mục tài sản, phân quyền |

## Entities
- **TaiSanKCHT**: id, loaiTaiSan, viTri, thongSoKyThuat, nguonKinhPhi, giaTriBanDau, trangThai, createdAt, updatedAt
- **YeuCauTangTaiSan**: id, taiSanId, nguoiTao, ngayTao, moTa, trangThai, createdAt, updatedAt

## Business Rules
1. Tất cả các trường bắt buộc (loại tài sản, vị trí, nguyên giá) phải được điền đầy đủ trước khi hệ thống cho phép lưu yêu cầu tăng tài sản.
2. Nguyên giá tài sản phải là số dương và không được vượt quá ngưỡng ngân sách được phê duyệt cho năm hiện tại.
3. Một tài sản không được phép đăng ký tăng trùng lặp trong cùng một vị trí.
4. Yêu cầu tăng tài sản chỉ được chuyển sang trạng thái chờ phê duyệt khi tất cả thông tin hợp lệ.

## Testing Strategy
Kiểm thử theo từng giai đoạn: kiểm thử đơn vị (unit test) cho các hàm xác thực dữ liệu đầu vào, kiểm thử tích hợp (integration test) cho luồng tạo yêu cầu tăng tài sản và chuyển sang phê duyệt, kiểm thử chấp nhận (acceptance test) với dữ liệu mẫu của từng loại tài sản (phao tiêu, trạm radar, đèn biển). Sử dụng dữ liệu biên để kiểm tra giới hạn nguyên giá và trường hợp dữ liệu thiếu để đảm bảo cơ chế xác thực hoạt động đúng.
