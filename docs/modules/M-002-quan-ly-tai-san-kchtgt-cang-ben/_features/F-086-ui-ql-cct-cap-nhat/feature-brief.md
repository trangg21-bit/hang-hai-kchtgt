---
id: F-086
name: "Cập nhật Cảng cạn"
slug: ui-ql-cct-cap-nhat
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:40Z"
last-updated: "2026-07-01T04:08:40Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Cập nhật Cảng cạn

## Description

Giao diện cập nhật Cảng cạn (CangCan) cho phép người dùng có quyền chỉnh sửa thông tin của một cảng cạn đã tồn tại trong hệ thống. Form được điền sẵn (pre-filled) với dữ liệu hiện tại của cảng cạn thông qua API GET /api/v1/cang-can/:id. Trường maCangCan được khóa (readonly) để đảm bảo tính toàn vẹn của mã định danh duy nhất. Người dùng có thể chỉnh sửa tenCangCan, diaChi, tinhThanh và ghiChu. Trường tinhThanh được hiển thị dưới dạng dropdown danh sách các tỉnh/thành Việt Nam. Khi người dùng bấm nút "Lưu", hệ thống gọi PUT /api/v1/cang-can/:id với payload chứa các trường đã cập nhật. Backend ghi nhận thay đổi vào bảng LichSuThayDoi và đặt lại trangThaiPheDuyet về CHO_PHE_DUYET để yêu cầu phê duyệt lại. Sau khi cập nhật thành công, hệ thống hiển thị toast "Cập nhật thành công, chờ phê duyệt lại" và giữ nguyên trang cho người dùng tiếp tục thao tác hoặc quay về danh sách.

## Business Intent

Cho phép người dùng có thẩm quyền duy trì và cập nhật thông tin cảng cạn đã tồn tại, đảm bảo mọi thay đổi đều được ghi nhận lịch sử và phải trải qua quy trình phê duyệt lại nhằm bảo toàn tính toàn vẹn và trách nhiệm giải trình của dữ liệu tài sản.

## Flow Summary

Người dùng truy cập trang Chi tiết Cảng cạn (F-084) hoặc chọn nút "Sửa" từ danh sách (F-083), hệ thống điều hướng đến trang Cập nhật (F-086) với entityId tương ứng. Form được pre-filled với toàn bộ thông tin hiện tại của cảng cạn. Trường maCangCan hiển thị ở chế độ readonly không thể chỉnh sửa. Người dùng sửa các trường tenCangCan, diaChi, tinhThanh (từ dropdown), ghiChu theo nhu cầu. Khi bấm "Lưu", hệ thống gọi PUT /api/v1/cang-can/:id. Backend ghi nhận thay đổi vào LichSuThayDoi record, đặt lại trangThaiPheDuyet=CHO_PHE_DUYET. Nếu thành công, toast "Cập nhật thành công, chờ phê duyệt lại" hiển thị. Nếu có lỗi validation hoặc trùng mã (không thể xảy ra vì maCangCan readonly), hiển thị thông báo lỗi tương ứng. Người dùng có thể bấm "Hủy" để đóng form mà không lưu thay đổi.

## Acceptance Criteria

1. Khi mở form Cập nhật, hệ thống gọi GET /api/v1/cang-can/:id và điền đầy đủ dữ liệu hiện tại vào form; trường maCangCan hiển thị ở chế độ readonly không thể chỉnh sửa.
2. Trường tenCangCan, diaChi là các trường bắt buộc — nếu người dùng xóa nội dung và nhấn Lưu, hệ thống hiển thị thông báo lỗi "Đây là trường bắt buộc" tại trường tương ứng.
3. Trường tinhThanh hiển thị dưới dạng dropdown danh sách các tỉnh/thành; giá trị mặc định là giá trị hiện tại của cảng cạn đang được chỉnh sửa.
4. Khi bấm "Lưu" với tất cả dữ liệu hợp lệ, hệ thống gọi PUT /api/v1/cang-can/:id với payload chứa các trường đã sửa; backend trả về 200, ghi nhận LichSuThayDoi record và đặt lại trangThaiPheDuyet=CHO_PHE_DUYET.
5. Sau khi cập nhật thành công, hệ thống hiển thị toast "Cập nhật thành công, chờ phê duyệt lại" và người dùng vẫn ở trên trang form để tiếp tục chỉnh sửa nếu cần.
6. Nếu người dùng bấm "Hủy" hoặc nhấn Esc, form đóng lại, quay về trang trước đó (F-083 hoặc F-084) mà không lưu bất kỳ thay đổi nào.
7. Nếu người dùng thay đổi một trường (ví dụ: tenCangCan) và sau đó hủy — hệ thống không gọi API PUT, LichSuThayDoi không có bản ghi mới.
8. Chỉ vai trò có quyền update mới thấy nút "Sửa" trên trang Danh sách (F-083) và trang Chi tiết (F-084).

## In Scope

- Form pre-filled với dữ liệu hiện tại của cảng cạn
- Trường maCangCan ở chế độ readonly
- Chỉnh sửa: tenCangCan, diaChi, tinhThanh (dropdown), ghiChu
- Gửi PUT /api/v1/cang-can/:id
- Backend ghi nhận LichSuThayDoi record
- Backend đặt lại trangThaiPheDuyet=CHO_PHE_DUYET
- Toast "Cập nhật thành công, chờ phê duyệt lại"
- Xử lý hủy và không lưu

## Out of Scope

- Thay đổi maCangCan (bị khóa)
- Tạo mới Cảng cạn (thuộc F-085)
- Phê duyệt/reject (thuộc F-087)
- Xóa cảng cạn (thuộc F-099)
- Lịch sử thay đổi (thuộc F-100)
- Tệp đính kèm
- Phê duyệt tự động — cần lãnh đạo phê duyệt lại

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Không có quyền cập nhật; chỉ xem danh sách, chi tiết và lịch sử |
| QuanTriCuc | read, update | Xem, chỉnh sửa Cảng cạn; xem danh sách, chi tiết, lịch sử |
| LanhDaoCuc | read, update, approve | Xem, chỉnh sửa Cảng cạn, phê duyệt/từ chối; xem lịch sử |
| QuanTriHeThong | read, update, delete, approve | Toàn quyền: xem, tạo, sửa, xóa, phê duyệt, xem lịch sử |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| UpdatePayload | tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(string) |
| LichSuThayDoi | id(UUID), cangCanId(UUID), field(string), oldValue(string), newValue(string), changedBy(UUID), changedAt(timestamp), actionType(enum) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-086-01 | maCangCan không được phép chỉnh sửa — luôn hiển thị ở chế độ readonly trên form cập nhật | F-086 | Spec |
| BR-086-02 | Khi cập nhật Cảng cạn, trangThaiPheDuyet được đặt lại về CHO_PHE_DUYET để chờ phê duyệt lại | F-086 | Spec |
| BR-086-03 | Mọi thay đổi trên form cập nhật phải được ghi nhận vào LichSuThayDoi record bởi backend | F-086, INT-003 | Spec |
| BR-086-04 | tenCangCan, diaChi là các trường bắt buộc không được để trống khi cập nhật | F-086 | Spec |
| BR-086-05 | Soft-delete: CangCan không có thực thể con nên khi xóa chỉ cần đặt deletedAt, không cần kiểm tra guard | F-099 | Spec |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào component form cập nhật: pre-fill đúng dữ liệu từ mock API response, maCangCan ở chế độ readonly không cho phép sửa, các trường tenCangCan, diaChi, tinhThanh, ghiChu có thể chỉnh sửa. Component dropdown tinhThanh hiển thị đúng danh sách tỉnh/thành và giá trị mặc định là giá trị hiện tại. Validation client-side: lỗi bắt buộc cho tenCangCan, diaChi khi để trống. Kiểm thử tích hợp (integration test): gọi PUT /api/v1/cang-can/:id với payload hợp lệ, xác nhận phản hồi 200; kiểm tra backend tạo LichSuThayDoi record cho từng trường thay đổi và đặt lại trangThaiPheDuyet=CHO_PHE_DUYET. Kiểm thử nghiệp vụ: thay đổi 2 trường và hủy — xác nhận không có LichSuThayDoi mới được tạo; thay đổi 1 trường và lưu — xác nhận toast "chờ phê duyệt lại" và kiểm tra lại chi tiết sau đó cho thấy trạng thái đã chuyển về CHO_PHE_DUYET. Kiểm thử RBAC: chỉ QuanTriCuc, LanhDaoCuc, QuanTriHeThông thấy nút Sửa; NhanVien không thấy.
