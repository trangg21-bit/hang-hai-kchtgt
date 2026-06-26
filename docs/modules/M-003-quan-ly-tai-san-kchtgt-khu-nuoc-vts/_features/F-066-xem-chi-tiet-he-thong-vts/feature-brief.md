---
id: F-066
name: Xem chi tiết Hệ thống VTS
slug: xem-chi-tiet-he-thong-vts
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Hệ thống VTS

## Description
Tất cả các vai trò trong hệ thống có quyền xem chi tiết thông tin của từng bản ghi hệ thống VTS, bao gồm toàn bộ dữ liệu nhập liệu, thông tin phê duyệt theo từng cấp, lịch sử thay đổi và các văn bản đính kèm liên quan.

## Business Intent
Cho phép người dùng tra cứu, xem xét và nắm bắt đầy đủ thông tin về các hệ thống VTS tại khu nước VTS, hỗ trợ ra quyết định quản lý, lập báo cáo và theo dõi tiến độ công tác vận hành, bảo trì hệ thống dịch vụ thông tin giao thông đường thủy một cách minh bạch và kịp thời.

## Flow Summary
Người dùng truy cập danh sách hệ thống VTS, chọn bản ghi cần xem chi tiết hoặc tìm kiếm theo tiêu chí (tên hệ thống, vị trí, loại thiết bị). Hệ thống hiển thị đầy đủ thông tin chi tiết của bản ghi bao gồm các trường dữ liệu nhập liệu, thông tin người tạo, trạng thái phê duyệt theo từng cấp với tên người phê duyệt và ngày giờ, lịch sử thay đổi và các văn bản đính kèm (nếu có).

## Acceptance Criteria
- Tất cả vai trò đều có thể xem chi tiết bản ghi hệ thống VTS
- Giao diện hiển thị đầy đủ thông tin: dữ liệu nhập, người tạo, trạng thái phê duyệt, lịch sử
- Có thể tra cứu bản ghi theo tên, vị trí, loại thiết bị và trạng thái
- Hiển thị văn bản đính kèm nếu có (file upload)
- Thông tin phê duyệt cấp 1 và cấp 2 được hiển thị riêng biệt với người phê duyệt và ngày giờ

## In Scope
- Danh sách hệ thống VTS với bộ lọc và tìm kiếm
- Trang chi tiết hiển thị toàn bộ thông tin bản ghi
- Hiển thị thông tin phê duyệt theo từng cấp
- Hiển thị lịch sử thay đổi của bản ghi
- Tải xuống và xem các văn bản đính kèm
- Phân quyền xem dựa trên vai trò của người dùng

## Out of Scope
- Tạo mới, cập nhật, xóa bản ghi hệ thống VTS
- Phê duyệt bản ghi hệ thống VTS
- Xuất báo cáo tổng hợp thống kê
- In ấn bản ghi hệ thống VTS

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem chi tiết bản ghi của mình, Xem tất cả |
| Trưởng phòng | Xem chi tiết mọi bản ghi, Xem bản ghi cấp phòng |
| Cục trưởng | Xem chi tiết mọi bản ghi |
| Admin | Xem chi tiết mọi bản ghi, Quản lý hệ thống |

## Entities
- **HeThongVTS**: id, tenHeThong, viTri, loaiThietBi, phamViBaoPhu, congSuat, ngayVaoVanhHan, heSoHieuQua, nguoiQuanLy, ghiChu, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat, pheDuyetC1, nguoiPheDuyetC1, pheDuyetC2, nguoiPheDuyetC2, vanBanDinhKem
- **VanBanDinhKem**: id, heThongVTsId, tenFile, duongDan, kichThuoc, nguoiTaiLen, ngayTaiLen

## Business Rules
1. Tất cả vai trò đều có quyền đọc (view) các bản ghi hệ thống VTS
2. Thông tin phê duyệt chỉ hiển thị cho người dùng có quyền xem (trưởng phòng, cục trưởng)
3. Văn bản đính kèm chỉ hiển thị khi có file được upload lên hệ thống
4. Lịch sử thay đổi hiển thị cho tất cả các vai trò nhưng chỉ cho phép chỉnh sửa bởi chuyên viên và admin
5. Dữ liệu hiển thị phải được đồng bộ với trạng thái phê duyệt hiện tại

## Testing Strategy
Kiểm thử hiển thị thông tin chi tiết cho các vai trò khác nhau (chuyên viên, trưởng phòng, cục trưởng, admin). Kiểm thử tìm kiếm và lọc theo tên, vị trí, loại thiết bị, trạng thái. Kiểm thử hiển thị văn bản đính kèm và tải xuống. Kiểm thử tính nhất quán của dữ liệu hiển thị với cơ sở dữ liệu.
