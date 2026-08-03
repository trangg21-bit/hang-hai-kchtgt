---
id: F-027
name: Quản lý Cảng cạn - Cập nhật
slug: ql-cct-cap-nhat
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:06Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng cạn - Cập nhật

## Description
Cập nhật thông tin của Cảng cạn đã tồn tại trong hệ thống, bao gồm thay đổi địa chỉ, năng lực, dịch vụ, các trường kỹ thuật và giấy tờ pháp lý liên quan, với lịch sử biến động được ghi nhận tự động.

## Business Intent
Cho phép cập nhật thông tin Cảng cạn khi có thay đổi về điều kiện vận hành, mở rộng năng lực, thay đổi địa chỉ hoặc điều chỉnh giấy tờ pháp lý. Việc cập nhật đúng quy trình đảm bảo cơ sở dữ liệu luôn chính xác và cập nhật, hỗ trợ công tác quản lý và ra quyết định. Mọi thay đổi đều được ghi nhận lịch sử để phục vụ kiểm toán và追溯 nguồn gốc.

## Flow Summary
Người dùng chọn một Cảng cạn từ danh sách, truy cập giao diện "Cập nhật" và điền thông tin cần thay đổi. Hệ thống so sánh giá trị trước và sau khi cập nhật, ghi nhận lịch sử thay đổi chi tiết. Sau khi lưu, nếu thay đổi ảnh hưởng đến điều kiện phê duyệt (ví dụ: thay đổi năng lực xử lý), hệ thống tự động chuyển trạng thái sang "cần phê duyệt lại" và gửi yêu cầu phê duyệt mới. Người dùng có thể cập nhật nhiều trường cùng lúc trong một lần.

## Acceptance Criteria
1. Người dùng có thể chọn một Cảng cạn và truy cập giao diện cập nhật
2. Hệ thống hiển thị giá trị hiện tại và cho phép chỉnh sửa các trường cần thay đổi
3. Hệ thống tự động ghi nhận lịch sử thay đổi sau khi lưu
4. Thay đổi quan trọng kích hoạt yêu cầu phê duyệt lại
5. Dữ liệu được kiểm tra hợp lệ trước khi lưu

## In Scope
- Form cập nhật thông tin Cảng cạn
- Hiển thị giá trị hiện tại và giá trị mới
- Ghi nhận lịch sử thay đổi tự động
- Kiểm tra hợp lệ dữ liệu trước khi lưu
- Kích hoạt phê duyệt lại khi thay đổi quan trọng

## Out of Scope
- Tạo mới Cảng cạn (thuộc F-026)
- Xóa Cảng cạn (thuộc F-028)
- Xem chi tiết Cảng cạn (thuộc F-030)
- Xem lịch sử thay đổi (thuộc F-031)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Cập nhật (khi Cảng cạn không khóa) |
| Trưởng phòng QL Cảng | Cập nhật, Phê duyệt lại |
| Quản trị viên | Cập nhật, Khóa/Mở khóa |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, ghiChu, createdAt, updatedAt
- **LichSuCangCan**: id, cangCanId, ngayThayDoi, nguoiThucHien, loaiThayDoi, noiDungTruoc, noiDungSau, ghiChu, createdAt

## Business Rules
1. Chỉ Cảng cạn ở trạng thái "chờ phê duyệt", "bị từ chối" hoặc "đã kích hoạt" mới được cập nhật
2. Các trường: tên, địa chỉ và loại hình là bắt buộc khi cập nhật
3. Thay đổi năng lực xử lý hoặc loại hình phải được phê duyệt lại
4. Lịch sử thay đổi được ghi nhận tự động cho mọi cập nhật
5. Người cập nhật được ghi nhận tự động từ tài khoản đăng nhập

## Testing Strategy
Kiểm thử cập nhật từng trường đơn lẻ và nhiều trường cùng lúc, kiểm thử ghi nhận lịch sử thay đổi, kiểm thử kích hoạt phê duyệt lại khi thay đổi quan trọng, kiểm thử hợp lệ dữ liệu đầu vào, kiểm thử khi Cảng cạn bị khóa.

## UI Specification

Giao diện cập nhật Cảng cạn (CangCan) cho phép người dùng có quyền chỉnh sửa thông tin của một cảng cạn đã tồn tại trong hệ thống. Form được điền sẵn (pre-filled) với dữ liệu hiện tại của cảng cạn thông qua API GET /api/v1/cang-can/:id. Trường maCangCan được khóa (readonly) để đảm bảo tính toàn vẹn của mã định danh duy nhất. Người dùng có thể chỉnh sửa tenCangCan, diaChi, tinhThanh và ghiChu. Trường tinhThanh được hiển thị dưới dạng dropdown danh sách các tỉnh/thành Việt Nam. Khi người dùng bấm nút "Lưu", hệ thống gọi PUT /api/v1/cang-can/:id với payload chứa các trường đã cập nhật. Backend ghi nhận thay đổi vào bảng LichSuThayDoi và đặt lại trangThaiPheDuyet về CHO_PHE_DUYET để yêu cầu phê duyệt lại. Sau khi cập nhật thành công, hệ thống hiển thị toast "Cập nhật thành công, chờ phê duyệt lại" và giữ nguyên trang cho người dùng tiếp tục thao tác hoặc quay về danh sách.

**Business Intent**

Cho phép người dùng có thẩm quyền duy trì và cập nhật thông tin cảng cạn đã tồn tại, đảm bảo mọi thay đổi đều được ghi nhận lịch sử và phải trải qua quy trình phê duyệt lại nhằm bảo toàn tính toàn vẹn và trách nhiệm giải trình của dữ liệu tài sản.

**Flow Summary**

Người dùng truy cập trang Chi tiết Cảng cạn (F-084) hoặc chọn nút "Sửa" từ danh sách (F-083), hệ thống điều hướng đến trang Cập nhật (F-086) với entityId tương ứng. Form được pre-filled với toàn bộ thông tin hiện tại của cảng cạn. Trường maCangCan hiển thị ở chế độ readonly không thể chỉnh sửa. Người dùng sửa các trường tenCangCan, diaChi, tinhThanh (từ dropdown), ghiChu theo nhu cầu. Khi bấm "Lưu", hệ thống gọi PUT /api/v1/cang-can/:id. Backend ghi nhận thay đổi vào LichSuThayDoi record, đặt lại trangThaiPheDuyet=CHO_PHE_DUYET. Nếu thành công, toast "Cập nhật thành công, chờ phê duyệt lại" hiển thị. Nếu có lỗi validation hoặc trùng mã (không thể xảy ra vì maCangCan readonly), hiển thị thông báo lỗi tương ứng. Người dùng có thể bấm "Hủy" để đóng form mà không lưu thay đổi.

**Acceptance Criteria (UI)**

1. Khi mở form Cập nhật, hệ thống gọi GET /api/v1/cang-can/:id và điền đầy đủ dữ liệu hiện tại vào form; trường maCangCan hiển thị ở chế độ readonly không thể chỉnh sửa.
2. Trường tenCangCan, diaChi là các trường bắt buộc — nếu người dùng xóa nội dung và nhấn Lưu, hệ thống hiển thị thông báo lỗi "Đây là trường bắt buộc" tại trường tương ứng.
3. Trường tinhThanh hiển thị dưới dạng dropdown danh sách các tỉnh/thành; giá trị mặc định là giá trị hiện tại của cảng cạn đang được chỉnh sửa.
4. Khi bấm "Lưu" với tất cả dữ liệu hợp lệ, hệ thống gọi PUT /api/v1/cang-can/:id với payload chứa các trường đã sửa; backend trả về 200, ghi nhận LichSuThayDoi record và đặt lại trangThaiPheDuyet=CHO_PHE_DUYET.
5. Sau khi cập nhật thành công, hệ thống hiển thị toast "Cập nhật thành công, chờ phê duyệt lại" và người dùng vẫn ở trên trang form để tiếp tục chỉnh sửa nếu cần.
6. Nếu người dùng bấm "Hủy" hoặc nhấn Esc, form đóng lại, quay về trang trước đó (F-083 hoặc F-084) mà không lưu bất kỳ thay đổi nào.
7. Nếu người dùng thay đổi một trường (ví dụ: tenCangCan) và sau đó hủy — hệ thống không gọi API PUT, LichSuThayDoi không có bản ghi mới.
8. Chỉ vai trò có quyền update mới thấy nút "Sửa" trên trang Danh sách (F-083) và trang Chi tiết (F-084).

**In Scope (UI)**

- Form pre-filled với dữ liệu hiện tại của cảng cạn
- Trường maCangCan ở chế độ readonly
- Chỉnh sửa: tenCangCan, diaChi, tinhThanh (dropdown), ghiChu
- Gửi PUT /api/v1/cang-can/:id
- Backend ghi nhận LichSuThayDoi record
- Backend đặt lại trangThaiPheDuyet=CHO_PHE_DUYET
- Toast "Cập nhật thành công, chờ phê duyệt lại"
- Xử lý hủy và không lưu

**Out of Scope (UI)**

- Thay đổi maCangCan (bị khóa)
- Tạo mới Cảng cạn (thuộc F-085)
- Phê duyệt/reject (thuộc F-087)
- Xóa cảng cạn (thuộc F-099)
- Lịch sử thay đổi (thuộc F-100)
- Tệp đính kèm
- Phê duyệt tự động — cần lãnh đạo phê duyệt lại

**Roles + Permissions (UI)**

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Không có quyền cập nhật; chỉ xem danh sách, chi tiết và lịch sử |
| QuanTriCuc | read, update | Xem, chỉnh sửa Cảng cạn; xem danh sách, chi tiết, lịch sử |
| LanhDaoCuc | read, update, approve | Xem, chỉnh sửa Cảng cạn, phê duyệt/từ chối; xem lịch sử |
| QuanTriHeThong | read, update, delete, approve | Toàn quyền: xem, tạo, sửa, xóa, phê duyệt, xem lịch sử |

**UI Entities**

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| UpdatePayload | tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(string) |
| LichSuThayDoi | id(UUID), cangCanId(UUID), field(string), oldValue(string), newValue(string), changedBy(UUID), changedAt(timestamp), actionType(enum) |

**UI Business Rules**

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-086-01 | maCangCan không được phép chỉnh sửa — luôn hiển thị ở chế độ readonly trên form cập nhật | F-086 | Spec |
| BR-086-02 | Khi cập nhật Cảng cạn, trangThaiPheDuyet được đặt lại về CHO_PHE_DUYET để chờ phê duyệt lại | F-086 | Spec |
| BR-086-03 | Mọi thay đổi trên form cập nhật phải được ghi nhận vào LichSuThayDoi record bởi backend | F-086, INT-003 | Spec |
| BR-086-04 | tenCangCan, diaChi là các trường bắt buộc không được để trống khi cập nhật | F-086 | Spec |
| BR-086-05 | Soft-delete: CangCan không có thực thể con nên khi xóa chỉ cần đặt deletedAt, không cần kiểm tra guard | F-099 | Spec |

**Testing Strategy (UI)**

Kiểm thử đơn vị (unit test) tập trung vào component form cập nhật: pre-fill đúng dữ liệu từ mock API response, maCangCan ở chế độ readonly không cho phép sửa, các trường tenCangCan, diaChi, tinhThanh, ghiChu có thể chỉnh sửa. Component dropdown tinhThanh hiển thị đúng danh sách tỉnh/thành và giá trị mặc định là giá trị hiện tại. Validation client-side: lỗi bắt buộc cho tenCangCan, diaChi khi để trống. Kiểm thử tích hợp (integration test): gọi PUT /api/v1/cang-can/:id với payload hợp lệ, xác nhận phản hồi 200; kiểm tra backend tạo LichSuThayDoi record cho từng trường thay đổi và đặt lại trangThaiPheDuyet=CHO_PHE_DUYET. Kiểm thử nghiệp vụ: thay đổi 2 trường và hủy — xác nhận không có LichSuThayDoi mới được tạo; thay đổi 1 trường và lưu — xác nhận toast "chờ phê duyệt lại" và kiểm tra lại chi tiết sau đó cho thấy trạng thái đã chuyển về CHO_PHE_DUYET. Kiểm thử RBAC: chỉ QuanTriCuc, LanhDaoCuc, QuanTriHeThông thấy nút Sửa; NhanVien không thấy.

## Implementation Status
| Layer | Status | Notes |
|-------|--------|-------|
| Backend (API) | Done | API endpoints fully implemented |
| Frontend (UI) | Pending | UI specs exist in merged feature scope; pending implementation |
