---
id: F-099
name: "Xóa Cảng cạn"
slug: ui-ql-cct-xoa
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:12Z"
last-updated: "2026-07-01T04:09:12Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xóa Cảng cạn

## Description

Giao diện xóa Cảng cạn (CangCan) cho phép người dùng có vai trò Lãnh đạo hoặc Quản trị hệ thống thực hiện xóa mềm (soft-delete) một cảng cạn đã tồn tại. Thao tác xóa được kích hoạt từ trang Danh sách (F-083) bằng cách bấm nút "Xóa" trên dòng tương ứng, hoặc từ trang Chi tiết (F-084) bằng cách bấm nút "Xóa". Khi bấm nút Xóa, hệ thống hiển thị hộp thoại xác nhận (confirm dialog) với thông báo rõ ràng: "Bạn có chắc chắn muốn xóa cảng cạn [maCangCan] — [tenCangCan]? Hành động này không thể hoàn tác." và yêu cầu người dùng nhập lại mã cảng cạn để xác nhận (để tránh xóa nhầm). Nếu người dùng nhập đúng mã và bấm "Xác nhận xóa", hệ thống gọi DELETE /api/v1/cang-can/:id. Backend thực hiện xóa mềm bằng cách đặt trường deletedAt thành thời điểm hiện tại thay vì xóa bản ghi vật lý khỏi cơ sở dữ liệu. Sau khi xóa thành công, cảng cạn biến khỏi danh sách hiện tại, toast "Xóa thành công" hiển thị, và danh sách được làm mới. Không có kiểm tra guard xóa bản ghi con vì CangCan không có thực thể con.

## Business Intent

Cho phép người dùng có thẩm quyền loại bỏ cảng cạn khỏi danh sách hoạt động thông qua cơ chế xóa mềm, đảm bảo dữ liệu vẫn được lưu trữ để phục vụ truy xuất lịch sử nhưng không còn xuất hiện trong các giao diện hoạt động chính, đồng thời yêu cầu xác nhận bằng mã để ngăn chặn xóa nhầm.

## Flow Summary

Người dùng có quyền Leadership/Admin nhấp vào nút "Xóa" trên dòng cảng cạn trong danh sách (F-083) hoặc trên trang Chi tiết (F-084). Hệ thống mở hộp thoại xác nhận với tiêu đề "Xác nhận xóa", nội dung yêu cầu nhập mã cảng cạn để xác nhận, và hai nút "Hủy" + "Xác nhận xóa". Người dùng nhập chính xác mã cảng cạn (maCangCan) vào ô nhập, nếu đúng thì nút "Xác nhận xóa" được kích hoạt. Khi bấm nút này, hệ thống gọi DELETE /api/v1/cang-can/:id. Backend đặt deletedAt=now() và trả về 200. Toast "Xóa thành công" hiển thị, cảng cạn biến khỏi danh sách, và trang được làm mới. Nếu người dùng bấm "Hủy" hoặc nhấn Esc, hộp thoại đóng lại và không có thao tác xóa nào được thực hiện. Nếu mã nhập sai, nút "Xác nhận xóa" vẫn bị vô hiệu hóa.

## Acceptance Criteria

1. Chỉ người dùng có vai trò Leadership (LanhDaoCuc) hoặc Admin (QuanTriHeThong) mới thấy nút "Xóa" trên trang Danh sách (F-083) và trang Chi tiết (F-084).
2. Khi bấm "Xóa" trên một dòng cảng cạn, hệ thống hiển thị hộp thoại xác nhận với nội dung: "Bạn có chắc chắn muốn xóa cảng cạn [maCangCan] — [tenCangCan]? Hành động này không thể hoàn tác."
3. Hộp thoại xác nhận yêu cầu người dùng nhập lại chính xác mã cảng cạn (maCangCan) — nút "Xác nhận xóa" chỉ được kích hoạt khi giá trị nhập vào khớp với maCangCan.
4. Khi người dùng nhập đúng maCangCan và bấm "Xác nhận xóa", hệ thống gọi DELETE /api/v1/cang-can/:id; backend đặt deletedAt=now() và trả về 200.
5. Sau khi xóa mềm thành công, toast "Xóa thành công" hiển thị, cảng cạn biến khỏi danh sách hiện tại, và danh sách được tự động làm mới.
6. Nếu người dùng bấm "Hủy" hoặc nhấn Esc, hộp thoại đóng lại — không có thay đổi nào được thực hiện trên dữ liệu.
7. Nếu maCangCan nhập vào không khớp, nút "Xác nhận xóa" vẫn bị vô hiệu hóa và không có API call nào được thực hiện.
8. Sau khi xóa mềm, cảng cạn không còn xuất hiện trong kết quả tìm kiếm mặc định (deletedAt != null được backend lọc ra).

## In Scope

- Nút "Xóa" chỉ hiển thị cho Leadership/Admin
- Hộp thoại xác nhận với yêu cầu nhập lại mã cảng cạn
- Gọi DELETE /api/v1/cang-can/:id
- Xóa mềm: set deletedAt=now()
- Toast "Xóa thành công" sau khi xóa
- Làm mới danh sách sau xóa
- Không có guard xóa bản ghi con (CangCan không có thực thể con)

## Out of Scope

- Xóa cứng (hard-delete) dữ liệu
- Khôi phục cảng cạn đã xóa (restore)
- Xóa hàng loạt nhiều cảng cạn cùng lúc
- Lịch sử xóa chi tiết (thuộc F-100)
- Thông báo email cho người tạo khi bị xóa
- Khóa cảng cạn thay vì xóa (tam-ngung) — thuộc trạng thái hoạt động riêng

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Không có quyền xóa; chỉ xem danh sách, chi tiết và lịch sử |
| QuanTriCuc | read | Không có quyền xóa; chỉ xem, chỉnh sửa, xem lịch sử |
| LanhDaoCuc | read, delete | Xóa mềm Cảng cạn; xem danh sách, chi tiết, phê duyệt, lịch sử |
| QuanTriHeThong | read, update, delete, approve | Toàn quyền: xem, tạo, sửa, xóa, phê duyệt, xem lịch sử |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| DeleteResponse | success(boolean), deletedAt(timestamp) |
| ConfirmDialog | entityMa(string), userEntry(string), isValid(boolean) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-099-01 | Soft-delete: xóa Cảng cạn chỉ đặt deletedAt=now() thay vì xóa vật lý; bản ghi vẫn tồn tại trong cơ sở dữ liệu | F-099 | Spec |
| BR-099-02 | CangCan không có thực thể con nên không cần kiểm tra guard xóa bản ghi con trước khi xóa | F-099 | Spec |
| BR-099-03 | maCangCan phải là duy nhất trong toàn hệ thống; không cho phép tạo mới hoặc sửa có trùng mã | F-099, F-085, F-086 | Spec |
| BR-099-04 | Khi cập nhật lại cảng cạn đã tạo, trangThaiPheDuyet được đặt lại về CHO_PHE_DUYET để chờ phê duyệt lại | F-086 | Spec |
| BR-099-05 | Chỉ Leadership/Admin mới có quyền xóa; các vai trò khác không thấy nút Xóa | F-099 | Spec |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào component nút Xóa: chỉ hiển thị cho vai trò Leadership/Admin, component hộp thoại xác nhận hiện ra đúng nội dung, yêu cầu nhập mã để xác nhận và nút "Xác nhận xóa" chỉ kích hoạt khi mã khớp. Kiểm thử tích hợp (integration test): gọi DELETE /api/v1/cang-can/:id cho một cảng cạn có deletedAt=null, xác nhận phản hồi 200 và deletedAt được set; gọi lại GET để xác nhận cảng cạn không còn xuất hiện trong kết quả (backend lọc deletedAt). Kiểm thử nghiệp vụ: tạo 1 cảng cạn, thử xóa với mã sai — không xóa được; thử xóa với mã đúng — xóa mềm thành công, toast hiện, danh sách làm mới; tạo lại cảng cạn với cùng mã — thành công (vì soft-delete, mã có thể tái sử dụng nếu backend cho phép). Thử xóa cảng cạn đã bị xóa mềm trước đó — hệ thống hiển thị lỗi "Cảng cạn không tồn tại" hoặc 404. Kiểm thử RBAC: NhanVien và QuanTriCuc không thấy nút Xóa; LanhDaoCuc và QuanTriHeThông thấy và thực hiện được.
