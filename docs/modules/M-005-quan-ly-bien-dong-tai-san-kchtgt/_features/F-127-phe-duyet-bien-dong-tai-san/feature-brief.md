---
id: F-127
name: "Phê duyệt biến động tài sản"
slug: phe-duyet-bien-dong-tai-san
module-id: M-005
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt biến động tài sản

## Description
Quản lý quy trình phê duyệt tất cả các loại biến động tài sản kết cấu hạ tầng công nghệ giao thông (KCHTGT) bao gồm tăng tài sản, giảm tài sản, xử lý tài sản và kiểm kê. Hệ thống hỗ trợ tạo luồng phê duyệt đa cấp, phân công người phê duyệt theo thẩm quyền, theo dõi tiến độ và ghi nhận kết quả phê duyệt, từ đó kích hoạt các nghiệp vụ kế toán và quản lý tài sản tương ứng.

## Business Intent
Đảm bảo mọi biến động về tài sản KCHTGT đều được xem xét, kiểm tra và phê duyệt bởi người có thẩm quyền theo đúng quy định pháp luật và nội bộ. Duy trì tính minh bạch, trách nhiệm giải trình và tuân thủ trong quản lý tài sản, đồng thời tạo lịch sử phê duyệt đầy đủ để phục vụ kiểm toán, thanh tra sau này.

## Flow Summary
Quy trình bắt đầu khi một yêu cầu biến động tài sản (tăng F-122, giảm F-123, xử lý F-124 hoặc kiểm kê F-125) được tạo và chuyển đến hệ thống phê duyệt. Hệ thống tự động phân loại biến động, xác định luồng phê duyệt tương ứng dựa trên loại biến động và giá trị tài sản liên quan. Người có thẩm quyền nhận được thông báo, xem xét hồ sơ kèm đầy đủ chứng từ, thực hiện phê duyệt hoặc từ chối kèm lý do. Trường hợp bị từ chối, yêu cầu được chuyển ngược lại cho người tạo để chỉnh sửa. Khi được phê duyệt, hệ thống tự động kích hoạt nghiệp vụ tương ứng (cập nhật sổ sách, trạng thái tài sản, báo cáo) và ghi nhận lịch sử phê duyệt. Hệ thống hỗ trợ phê duyệt đa cấp: từ Trưởng phòng, Kế toán trưởng đến Lãnh đạo phụ trách tùy theo loại và giá trị biến động.

## Acceptance Criteria
1. Hệ thống tự động phân loại biến động tài sản và xác định đúng luồng phê duyệt theo giá trị và loại nghiệp vụ.
2. Người có thẩm quyền nhận được thông báo phê duyệt và có thể xem toàn bộ hồ sơ kèm chứng từ trước khi ra quyết định.
3. Hệ thống hỗ trợ cả phê duyệt và từ chối kèm lý do, tự động chuyển yêu cầu bị từ chối ngược lại cho người tạo.
4. Khi được phê duyệt, hệ thống tự động kích hoạt nghiệp vụ tương ứng (cập nhật sổ sách, trạng thái tài sản) và ghi nhận lịch sử phê duyệt.

## In Scope
- Phân loại tự động biến động tài sản (tăng, giảm, xử lý, kiểm kê)
- Xác định và cấu hình luồng phê duyệt đa cấp theo loại và giá trị
- Thông báo và phân công người phê duyệt tự động
- Phê duyệt hoặc từ chối kèm lý do
- Chuyển yêu cầu bị từ chối ngược lại cho người tạo
- Kích hoạt nghiệp vụ tương ứng sau khi phê duyệt
- Ghi nhận lịch sử phê duyệt đầy đủ

## Out of Scope
- Tạo yêu cầu biến động tài sản (F-122, F-123, F-124, F-125)
- Thanh lý, bán tài sản (thuộc module khác)
- Tích hợp với hệ thống chữ ký số
- Báo cáo quản trị tổng hợp đa module

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên quản lý tài sản | Tạo yêu cầu, Xem tiến độ phê duyệt |
| Kế toán trưởng | Xem, Phê duyệt yêu cầu giảm, kiểm kê |
| Trưởng phòng | Xem, Phê duyệt yêu cầu giá trị nhỏ |
| Lãnh đạo | Xem, Phê duyệt tất cả yêu cầu biến động |
| Admin hệ thống | Cấu hình luồng phê duyệt, phân quyền |

## Entities
- **YeuCauBienDong**: id, loaiBienDong, tieuDe, NguoiTao, NgayTao, TrangThai, createdAt, updatedAt
- **LuuPheDuyet**: id, yeuCauId, CapPheDuyet, NguoiPheDuyet, KetQua, LyDo, NgayPheDuyet, createdAt
- **TaiSanKCHT**: id, loaiTaiSan, viTri, giaTriBanDau, HaoMonLucKe, GiaTriConLai, trangThai, createdAt, updatedAt

## Business Rules
1. Luồng phê duyệt được xác định tự động dựa trên loại biến động và giá trị tài sản liên quan.
2. Tất cả yêu cầu phê duyệt phải có đầy đủ hồ sơ và chứng từ kèm theo mới được xem xét.
3. Người có thẩm quyền phải xem xét và ra quyết định trong thời gian quy định (tối đa 5 ngày làm việc).
4. Yêu cầu bị từ chối phải có lý do rõ ràng và được chuyển ngược lại cho người tạo để chỉnh sửa.
5. Chỉ khi được phê duyệt bởi tất cả các cấp theo luồng, nghiệp vụ mới được tự động kích hoạt.
6. Mọi quyết định phê duyệt hoặc từ chối phải được ghi nhận lịch sử đầy đủ.

## Testing Strategy
Kiểm thử từng luồng phê duyệt theo loại biến động và giá trị (giá trị nhỏ, trung bình, lớn). Kiểm thử trường hợp từ chối kèm lý do và chuyển ngược lại cho người tạo. Kiểm thử phê duyệt đa cấp: phê duyệt đúng thứ tự các cấp, thử bỏ sót một cấp, thử phê duyệt sai cấp. Kiểm thử tự động kích hoạt nghiệp vụ sau khi phê duyệt thành công. Sử dụng dữ liệu mẫu cho từng loại biến động (tăng, giảm, xử lý, kiểm kê) để đảm bảo tính tổng quát của quy trình phê duyệt.
