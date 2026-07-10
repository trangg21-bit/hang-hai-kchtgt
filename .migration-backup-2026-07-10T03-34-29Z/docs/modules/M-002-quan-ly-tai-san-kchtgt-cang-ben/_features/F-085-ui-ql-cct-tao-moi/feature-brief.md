---
id: F-085
name: "Tạo mới Cảng cạn"
slug: ui-ql-cct-tao-moi
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:39Z"
last-updated: "2026-07-01T04:08:39Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Tạo mới Cảng cạn

## Description

Giao diện tạo mới Cảng cạn (CangCan) cho phép người dùng có quyền tạo khai báo thông tin một cảng cạn mới vào hệ thống. Form bao gồm các trường: mã cảng cạn (maCangCan — bắt buộc, duy nhất), tên cảng cạn (tenCangCan — bắt buộc), địa chỉ (diaChi — bắt buộc), tỉnh/thành (tinhThanh — bắt buộc), và ghi chú (ghiChu — tùy chọn). Xác thực client-side được thực hiện trước khi gửi yêu cầu POST /api/v1/cang-can: maCangCan không được để trống và không được trùng với cảng cạn đã tồn tại; các trường bắt buộc không được bỏ trống. Khi gửi thành công, cảng cạn mới được tạo với trạng thái phê duyệt mặc định là CHO_PHE_DUYET và trạng thái hoạt động là HIEN_HANH. Sau khi tạo thành công, hệ thống hiển thị toast thông báo "Tạo mới thành công" và tự động chuyển hướng người dùng về trang Danh sách Cảng cạn (F-083).

## Business Intent

Cho phép người dùng có thẩm quyền khai báo cảng cạn mới vào hệ thống quản lý tài sản, đảm bảo thông tin được kiểm tra tính hợp lệ trước khi lưu và luôn đi qua quy trình phê duyệt để duy trì toàn vẹn dữ liệu tài sản giao thông vận tải biển.

## Flow Summary

Người dùng chọn mục "Tạo mới Cảng cạn" từ trang Danh sách (F-083), hệ thống mở form tạo mới. Người dùng nhập maCangCan — hệ thống thực hiện kiểm tra trùng mã ngay trên client bằng cách gọi API xác nhận duy nhất trước khi cho phép submit. Người dùng tiếp tục điền tenCangCan, diaChi, tinhThanh (các trường bắt buộc) và ghiChu (tùy chọn). Khi bấm nút "Lưu", hệ thống gọi POST /api/v1/cang-can với payload chứa toàn bộ trường đã nhập. Backend tạo bản ghi với trangThaiPheDuyet=CHO_PHE_DUYET, trangThaiHoatDong=HIEN_HANH, orgUnitId=gán tự động từ ngữ cảnh người dùng. Nếu thành công, toast "Tạo mới thành công" hiển thị và người dùng được chuyển hướng về F-083. Nếu maCangCan trùng, hệ thống hiển thị lỗi "Mã cảng cạn đã tồn tại" tại trường tương ứng.

## Acceptance Criteria

1. Khi mở form Tạo mới, tất cả các trường đều trống hoặc mặc định; trường maCangCan tập trung focus đầu tiên.
2. Trường maCangCan, tenCangCan, diaChi, tinhThanh là bắt buộc — nếu người dùng bỏ trống và nhấn Lưu, hệ thống hiển thị thông báo lỗi bên dưới trường tương ứng với nội dung "Đây là trường bắt buộc" và không gửi API request.
3. Người dùng nhập maCangCan đã tồn tại trong hệ thống — khi nhấn Lưu, hệ thống gọi API xác nhận duy nhất, nhận phản hồi trùng mã và hiển thị lỗi "Mã cảng cạn đã tồn tại" ngay tại trường maCangCan.
4. Khi tất cả trường bắt buộc hợp lệ và maCangCan chưa tồn tại, bấm nút Lưu gửi POST /api/v1/cang-can với payload đầy đủ; backend trả về 201 và hệ thống hiển thị toast "Tạo mới thành công".
5. Sau khi tạo thành công, hệ thống tự động chuyển hướng về trang Danh sách Cảng cạn (F-083) với bộ lọc được làm mới, cảng cạn mới hiển thị trên trang đầu tiên.
6. Nếu người dùng hủy thao tác (bấm Hủy hoặc nhấn Esc), form đóng lại và quay về trang trước đó mà không tạo bản ghi nào.
7. Người dùng không có quyền create không thấy nút "Tạo mới" trên trang Danh sách (F-083) — điều này được kiểm soát bởi RBAC ở cấp giao diện.

## In Scope

- Form tạo mới với các trường: maCangCan, tenCangCan, diaChi, tinhThanh, ghiChu
- Xác thực client-side: trường bắt buộc, maCangCan duy nhất
- Gửi POST /api/v1/cang-can
- Tạo bản ghi với trạng thái mặc định CHO_PHE_DUYET, HIEN_HANH
- Toast thông báo thành công
- Chuyển hướng về danh sách (F-083) sau khi tạo
- Xử lý lỗi trùng mã và lỗi trường bắt buộc

## Out of Scope

- Chỉnh sửa sau khi tạo (thuộc F-086)
- Phê duyệt/reject (thuộc F-087)
- Xóa cảng cạn (thuộc F-099)
- Lịch sử thay đổi (thuộc F-100)
- Tệp đính kèm khi tạo mới
- Phân trang, tìm kiếm, lọc (thuộc F-083)
- Tự động điền orgUnitId từ ngữ phục vụ backend

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Không có quyền tạo; chỉ xem danh sách và chi tiết |
| QuanTriCuc | create, read | Tạo mới Cảng cạn, xem danh sách, chi tiết, lịch sử |
| LanhDaoCuc | create, read, approve | Tạo mới Cảng cạn, xem danh sách, chi tiết, phê duyệt/từ chối |
| QuanTriHeThong | create, read, update, delete, approve | Toàn quyền: xem, tạo, sửa, xóa, phê duyệt, xem lịch sử |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| CreatePayload | maCangCan(string), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(string) |
| CreateResponse | id(UUID), maCangCan(string), trangThaiPheDuyet(string), trangThaiHoatDong(string) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-085-01 | maCangCan phải là duy nhất trong toàn hệ thống; nếu trùng khi tạo, hệ thống từ chối và hiển thị lỗi tại trường maCangCan | F-085, F-086 | Spec |
| BR-085-02 | Khi tạo mới, trangThaiPheDuyet mặc định là CHO_PHE_DUYET và trangThaiHoatDong mặc định là HIEN_HANH | F-085 | Spec |
| BR-085-03 | tenCangCan, diaChi, tinhThanh là các trường bắt buộc không được để trống khi tạo mới | F-085 | Spec |
| BR-085-04 | Soft-delete: CangCan không có thực thể con nên khi xóa chỉ cần đặt deletedAt, không cần kiểm tra guard | F-099 | Spec |
| BR-085-05 | Khi cập nhật lại cảng cạn đã tạo, trangThaiPheDuyet được đặt lại về CHO_PHE_DUYET để chờ phê duyệt lại | F-086 | Spec |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào component form: xác thực client-side cho từng trường bắt buộc (maCangCan, tenCangCan, diaChi, tinhThanh), hiển thị lỗi chính xác khi bỏ trống, và kiểm tra phản hồi khi gọi API xác nhận duy nhất cho maCangCan. Kiểm thử tích hợp (integration test) gửi POST /api/v1/cang-can với payload hợp lệ và xác nhận phản hồi 201 với trạng thái mặc định CHO_PHE_DUYET, HIEN_HANH; gửi payload maCangCan trùng để kiểm tra phản hồi lỗi 409 hoặc 422. Kiểm thử nghiệp vụ: tạo 3 cảng cạn với mã khác nhau, xác nhận toast "Tạo mới thành công" và chuyển hướng đúng về F-083; thử hủy form bằng nút Hủy và Esc, xác nhận không có bản ghi mới được tạo. Kiểm thử RBAC: vai trò NhanVien không thấy nút Tạo, trong khi QuanTriCuc, LanhDaoCuc và QuanTriHeThông đều thấy và tạo được.
