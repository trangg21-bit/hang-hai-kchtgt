---
id: F-028
name: Quản lý Cảng cạn - Xóa
slug: ql-cct-xoa
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:07Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng cạn - Xóa

## Description
Xóa Cảng cạn khỏi hệ thống khi không còn sử dụng, với cơ chế xóa mềm (soft delete) để bảo tồn dữ liệu lịch sử và hỗ trợ khôi phục nếu cần. Quy trình xóa yêu cầu xác nhận và được ghi nhận đầy đủ vào nhật ký hệ thống.

## Business Intent
Cho phép loại bỏ Cảng cạn không còn hoạt động hoặc đã sáp nhập khỏi danh sách khai thác, giúp hệ thống luôn phản ánh đúng thực tế quản lý. Việc xóa mềm đảm bảo dữ liệu không bị mất vĩnh viễn, hỗ trợ công tác kiểm toán và khôi phục trong trường hợp xóa nhầm. Quy trình xóa có xác nhận ngăn ngừa xóa vô tình hoặc xóa trái phép.

## Flow Summary
Người dùng chọn một Cảng cạn từ danh sách và chọn hành động "Xóa". Hệ thống hiển thị hộp thoại xác nhận với thông tin Cảng cạn và cảnh báo về hậu quả của việc xóa. Người dùng xác nhận bằng cách nhập mã Cảng cạn hoặc nhấn nút xác nhận. Hệ thống thực hiện xóa mềm — chuyển trạng thái Cảng cạn thành "đã xóa" thay vì xóa vĩnh viễn — ghi nhận người xóa, ngày giờ xóa và lưu vào nhật ký. Cảng cạn bị xóa không còn hiển thị trong danh sách khai thác nhưng vẫn可查看 trong lịch sử.

## Acceptance Criteria
1. Người dùng nhận được hộp thoại xác nhận trước khi xóa Cảng cạn
2. Cảng cạn bị xóa mềm (soft delete), không bị xóa vĩnh viễn khỏi cơ sở dữ liệu
3. Cảng cạn bị xóa không còn hiển thị trong danh sách khai thác chính
4. Nhật ký xóa được ghi nhận đầy đủ: người xóa, ngày giờ, lý do
5. Không thể xóa Cảng cạn đang có hoạt động logistics đang diễn ra

## In Scope
- Xóa mềm Cảng cạn (soft delete)
- Xác nhận xóa bằng hộp thoại
- Ghi nhật ký xóa vào hệ thống
- Không hiển thị Cảng cạn đã xóa trong danh sách chính
- Kiểm tra điều kiện xóa (không có hoạt động đang diễn ra)

## Out of Scope
- Xóa vĩnh viễn Cảng cạn khỏi cơ sở dữ liệu
- Khôi phục Cảng cạn đã xóa (thuộc chức năng quản lý khôi phục riêng)
- Xóa hàng loạt Cảng cạn
- Xóa tự động theo quy tắc thời gian

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Không có quyền xóa |
| Trưởng phòng QL Cảng | Xóa (có xác nhận) |
| Quản trị viên | Xóa, Khôi phục |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, daXoa, nguoiXoa, ngayXoa, createdAt, updatedAt
- **NhatKyXoa**: id, cangCanId, cangCanMa, cangCanTen, nguoiXoa, ngayXoa, lyDo, createdAt

## Business Rules
1. Chỉ người dùng vai trò Trưởng phòng hoặc Quản trị viên mới có quyền xóa
2. Phải có xác nhận bằng hộp thoại trước khi xóa
3. Không thể xóa Cảng cạn đang có hoạt động logistics đang diễn ra
4. Xóa là xóa mềm — dữ liệu vẫn được bảo tồn với cờ đã xóa
5. Nhật ký xóa phải ghi nhận đầy đủ người xóa và ngày giờ

## Testing Strategy
Kiểm thử xóa với Cảng cạn không có hoạt động (thành công), kiểm thử xóa với Cảng cạn đang có hoạt động (bị chặn), kiểm thử xác nhận xóa, kiểm thử xóa mềm và khôi phục, kiểm thử ghi nhật ký xóa, kiểm thử phân quyền xóa.

## UI Specification

Giao diện xóa Cảng cạn (CangCan) cho phép người dùng có vai trò Lãnh đạo hoặc Quản trị hệ thống thực hiện xóa mềm (soft-delete) một cảng cạn đã tồn tại. Thao tác xóa được kích hoạt từ trang Danh sách (F-083) bằng cách bấm nút "Xóa" trên dòng tương ứng, hoặc từ trang Chi tiết (F-084) bằng cách bấm nút "Xóa". Khi bấm nút Xóa, hệ thống hiển thị hộp thoại xác nhận (confirm dialog) với thông báo rõ ràng: "Bạn có chắc chắn muốn xóa cảng cạn [maCangCan] — [tenCangCan]? Hành động này không thể hoàn tác." và yêu cầu người dùng nhập lại mã cảng cạn để xác nhận (để tránh xóa nhầm). Nếu người dùng nhập đúng mã và bấm "Xác nhận xóa", hệ thống gọi DELETE /api/v1/cang-can/:id. Backend thực hiện xóa mềm bằng cách đặt trường deletedAt thành thời điểm hiện tại thay vì xóa bản ghi vật lý khỏi cơ sở dữ liệu. Sau khi xóa thành công, cảng cạn biến khỏi danh sách hiện tại, toast "Xóa thành công" hiển thị, và danh sách được làm mới.

**Business Intent**

Cho phép người dùng có thẩm quyền loại bỏ cảng cạn khỏi danh sách hoạt động thông qua cơ chế xóa mềm, đảm bảo dữ liệu vẫn được lưu trữ để phục vụ truy xuất lịch sử nhưng không còn xuất hiện trong các giao diện hoạt động chính, đồng thời yêu cầu xác nhận bằng mã để ngăn chặn xóa nhầm.

**Flow Summary**

Người dùng có quyền Leadership/Admin nhấp vào nút "Xóa" trên dòng cảng cạn trong danh sách (F-083) hoặc trên trang Chi tiết (F-084). Hệ thống mở hộp thoại xác nhận với tiêu đề "Xác nhận xóa", nội dung yêu cầu nhập mã cảng cạn để xác nhận, và hai nút "Hủy" + "Xác nhận xóa". Người dùng nhập chính xác mã cảng cạn (maCangCan) vào ô nhập, nếu đúng thì nút "Xác nhận xóa" được kích hoạt. Khi bấm nút này, hệ thống gọi DELETE /api/v1/cang-can/:id. Backend đặt deletedAt=now() và trả về 200. Toast "Xóa thành công" hiển thị, cảng cạn biến khỏi danh sách, và trang được làm mới. Nếu người dùng bấm "Hủy" hoặc nhấn Esc, hộp thoại đóng lại và không có thao tác xóa nào được thực hiện. Nếu mã nhập sai, nút "Xác nhận xóa" vẫn bị vô hiệu hóa.

**Acceptance Criteria (UI)**

1. Chỉ người dùng có vai trò Leadership (LanhDaoCuc) hoặc Admin (QuanTriHeThong) mới thấy nút "Xóa" trên trang Danh sách (F-083) và trang Chi tiết (F-084).
2. Khi bấm "Xóa" trên một dòng cảng cạn, hệ thống hiển thị hộp thoại xác nhận với nội dung: "Bạn có chắc chắn muốn xóa cảng cạn [maCangCan] — [tenCangCan]? Hành động này không thể hoàn tác."
3. Hộp thoại xác nhận yêu cầu người dùng nhập lại chính xác mã cảng cạn (maCangCan) — nút "Xác nhận xóa" chỉ được kích hoạt khi giá trị nhập vào khớp với maCangCan.
4. Khi người dùng nhập đúng maCangCan và bấm "Xác nhận xóa", hệ thống gọi DELETE /api/v1/cang-can/:id; backend đặt deletedAt=now() và trả về 200.
5. Sau khi xóa mềm thành công, toast "Xóa thành công" hiển thị, cảng cạn biến khỏi danh sách hiện tại, và danh sách được tự động làm mới.
6. Nếu người dùng bấm "Hủy" hoặc nhấn Esc, hộp thoại đóng lại — không có thay đổi nào được thực hiện trên dữ liệu.
7. Nếu maCangCan nhập vào không khớp, nút "Xác nhận xóa" vẫn bị vô hiệu hóa và không có API call nào được thực hiện.
8. Sau khi xóa mềm, cảng cạn không còn xuất hiện trong kết quả tìm kiếm mặc định (deletedAt != null được backend lọc ra).

**In Scope (UI)**

- Nút "Xóa" chỉ hiển thị cho Leadership/Admin
- Hộp thoại xác nhận với yêu cầu nhập lại mã cảng cạn
- Gọi DELETE /api/v1/cang-can/:id
- Xóa mềm: set deletedAt=now()
- Toast "Xóa thành công" sau khi xóa
- Làm mới danh sách sau xóa

**Out of Scope (UI)**

- Xóa cứng (hard-delete) dữ liệu
- Khôi phục cảng cạn đã xóa (restore)
- Xóa hàng loạt nhiều cảng cạn cùng lúc
- Lịch sử xóa chi tiết (thuộc F-100)
- Thông báo email cho người tạo khi bị xóa

**Roles + Permissions (UI)**

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Không có quyền xóa; chỉ xem danh sách, chi tiết và lịch sử |
| QuanTriCuc | read | Không có quyền xóa; chỉ xem, chỉnh sửa, xem lịch sử |
| LanhDaoCuc | read, delete | Xóa mềm Cảng cạn; xem danh sách, chi tiết, phê duyệt, lịch sử |
| QuanTriHeThong | read, update, delete, approve | Toàn quyền: xem, tạo, sửa, xóa, phê duyệt, xem lịch sử |

**UI Entities**

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| DeleteResponse | success(boolean), deletedAt(timestamp) |
| ConfirmDialog | entityMa(string), userEntry(string), isValid(boolean) |

**UI Business Rules**

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-099-01 | Soft-delete: xóa Cảng cạn chỉ đặt deletedAt=now() thay vì xóa vật lý; bản ghi vẫn tồn tại trong cơ sở dữ liệu | F-099 | Spec |
| BR-099-02 | CangCan không có thực thể con nên không cần kiểm tra guard xóa bản ghi con trước khi xóa | F-099 | Spec |
| BR-099-03 | maCangCan phải là duy nhất trong toàn hệ thống; không cho phép tạo mới hoặc sửa có trùng mã | F-099, F-085, F-086 | Spec |
| BR-099-04 | Khi cập nhật lại cảng cạn đã tạo, trangThaiPheDuyet được đặt lại về CHO_PHE_DUYET để chờ phê duyệt lại | F-086 | Spec |
| BR-099-05 | Chỉ Leadership/Admin mới có quyền xóa; các vai trò khác không thấy nút Xóa | F-099 | Spec |

**Testing Strategy (UI)**

Kiểm thử đơn vị (unit test) tập trung vào component nút Xóa: chỉ hiển thị cho vai trò Leadership/Admin, component hộp thoại xác nhận hiện ra đúng nội dung, yêu cầu nhập mã để xác nhận và nút "Xác nhận xóa" chỉ kích hoạt khi mã khớp. Kiểm thử tích hợp (integration test): gọi DELETE /api/v1/cang-can/:id cho một cảng cạn có deletedAt=null, xác nhận phản hồi 200 và deletedAt được set; gọi lại GET để xác nhận cảng cạn không còn xuất hiện trong kết quả (backend lọc deletedAt). Kiểm thử nghiệp vụ: tạo 1 cảng cạn, thử xóa với mã sai — không xóa được; thử xóa với mã đúng — xóa mềm thành công, toast hiện, danh sách làm mới. Kiểm thử RBAC: chỉ Leadership/Admin thấy nút Xóa; các vai trò khác không thấy.

## Implementation Status
| Layer | Status | Notes |
|-------|--------|-------|
| Backend (API) | Done | API endpoints fully implemented |
| Frontend (UI) | Pending | UI specs exist in merged feature scope; pending implementation |
