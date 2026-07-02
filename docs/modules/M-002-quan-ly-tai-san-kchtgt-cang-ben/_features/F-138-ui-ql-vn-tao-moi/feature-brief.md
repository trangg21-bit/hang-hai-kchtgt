---
id: F-138
name: "Tạo mới Vùng nước"
slug: ui-ql-vn-tao-moi
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:52:11Z"
last-updated: "2026-07-01T07:52:11Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Tạo mới Vùng nước

## Description

Tính năng Tạo mới Vùng nước cung cấp giao diện form nhập liệu để người dùng tạo một vùng nước mới trong hệ thống quản lý tài sản cảng biển. Form bao gồm các trường: mã vùng nước (maVungNuoc — chuỗi ký tự unique, bắt buộc, length≤50), tên vùng nước (tenVungNuoc — chuỗi ký tự, bắt buộc, length≤255), loại vùng nước (loaiVungNuoc — chuỗi ký tự, length≤100, không bắt buộc), cảng mẹ (cangBienId — dropdown chọn cảng biển, bắt buộc, danh sách chỉ hiển thị các CangBien có `trangThaiHoatDong = HIEN_HANH`), diện tích (dienTich — BigDecimal, precision 15 scale 2, không bắt buộc), độ sâu max (doSauMax — BigDecimal, precision 10 scale 2, không bắt buộc), độ sâu trung bình (doSauTrungBinh — BigDecimal, precision 10 scale 2, không bắt buộc), và trạng thái hoạt động (trangThaiHoatDong — chuỗi, không bắt buộc). Hệ thống thực hiện client-side validation trước khi submit: maVungNuoc phải unique (kiểm tra bằng API `GET /api/v1/vung-nuoc?maVungNuoc={value}`), cangBienId phải tồn tại và có trạng thái HIEN_HANH, các trường số phải là giá trị hợp lệ. Khi click nút "Tạo mới", hệ thống gọi API `POST /api/v1/vung-nuoc` với dữ liệu form. Sau khi tạo thành công, hệ thống hiển thị thông báo toast "Tạo mới vùng nước thành công — chờ phê duyệt", trạng thái mặc định là CHỜ_PHÊ_DUYỆT, và tự động chuyển hướng về trang Danh sách Vùng nước (F-136).

## Business Intent

Cho phép người dùng khai báo và đăng ký một vùng nước mới vào hệ thống quản lý tài sản cảng biển, với các ràng buộc về tính duy nhất của mã, các trường số hợp lệ, và cảng mẹ đang hoạt động, đảm bảo dữ liệu đầu vào luôn chất lượng trước khi đi qua quy trình phê duyệt.

## Flow Summary

Người dùng click nút "Thêm mới" từ trang Danh sách Vùng nước (F-136), hệ thống mở trang Tạo mới Vùng nước với form trống. Người dùng điền các trường bắt buộc: maVungNuoc (kiểm tra tính duy nhất real-time khi mất focus), tenVungNuoc, cangBienId (dropdown chỉ hiển thị cảng có trạng thái HIEN_HANH), và các trường tùy chọn: loaiVungNuoc, dienTich, doSauMax, doSauTrungBinh, trangThaiHoatDong. Client validation hiển thị thông báo lỗi ngay tại trường tương ứng khi người dùng nhập không đúng định dạng hoặc vượt quá giới hạn cho phép. Sau khi điền xong, người dùng click nút "Tạo mới". Hệ thống gọi API `POST /api/v1/vung-nuoc` — nếu thành công, hiển thị toast "Tạo mới thành công — chờ phê duyệt", reset form và redirect về trang Danh sách Vùng nước. Nếu lỗi (maVungNuoc đã tồn tại, cảng mẹ không hợp lệ, v.v.), hệ thống hiển thị toast thông báo lỗi và giữ lại dữ liệu đã nhập để người dùng có thể chỉnh sửa.

## Acceptance Criteria

1. Khi mở trang Tạo mới, form hiển thị toàn bộ các trường: maVungNuoc (input text, unique check, required, length≤50), tenVungNuoc (input text, required, length≤255), loaiVungNuoc (input text, optional, length≤100), cangBienId (dropdown, required), dienTich (input number, optional, BigDecimal precision 15 scale 2), doSauMax (input number, optional, BigDecimal precision 10 scale 2), doSauTrungBinh (input number, optional, BigDecimal precision 10 scale 2), trangThaiHoatDong (input text, optional).
2. Dropdown cangBienId chỉ hiển thị các cảng biển có `trangThaiHoatDong = HIEN_HANH`, API gọi `GET /api/v1/cang-bien?trangThaiHoatDong=HIEN_HANH`.
3. Khi người dùng nhập maVungNuoc và chuyển ra khỏi ô input (blur), hệ thống gọi API kiểm tra tính duy nhất; nếu mã đã tồn tại, hiển thị thông báo lỗi "Mã vùng nước đã tồn tại" bên dưới ô input.
4. Các trường số (dienTich, doSauMax, doSauTrungBinh) phải là giá trị số hợp lệ; nếu không phải số hoặc vượt quá precision/scale quy định, hệ thống hiển thị lỗi và không cho phép submit form.
5. cangBienId phải được chọn từ dropdown danh sách cảng biển; không cho phép submit nếu chưa chọn cảng mẹ.
6. Sau khi click "Tạo mới" và form hợp lệ, hệ thống gọi `POST /api/v1/vung-nuoc`; sau khi tạo thành công, hiển thị toast "Tạo mới vùng nước thành công — chờ phê duyệt" và redirect về trang Danh sách Vùng nước (F-136).
7. Nếu tạo thất bại (ví dụ maVungNuoc đã tồn tại, hoặc cangBienId không hợp lệ), hệ thống hiển thị toast thông báo lỗi cụ thể và giữ lại dữ liệu đã nhập trong form để người dùng có thể sửa.
8. Vùng nước mới được tạo có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` theo mặc định (trangThaiHoatDong do người dùng chọn).

## In Scope

- Form tạo mới vùng nước với đầy đủ các field của entity VungNuoc
- Client-side validation cho maVungNuoc (unique), cangBienId (tồn tại + HIEN_HANH), các trường số (dienTich, doSauMax, doSauTrungBinh) phải là giá trị hợp lệ
- Dropdown cangBienId chỉ hiển thị cảng mẹ có trạng thái HIEN_HANH
- API POST /api/v1/vung-nuoc với trạng thái mặc định CHỜ_PHÊ_DUYỆT
- Toast thông báo thành công/đánh bại, redirect về danh sách
- Giữ lại dữ liệu đã nhập khi submit thất bại

## Out of Scope

- Chỉnh sửa vùng nước đã tồn tại (thuộc F-139)
- Xóa vùng nước (thuộc F-141)
- Phê duyệt/từ chối vùng nước (thuộc F-140)
- Xem lịch sử thay đổi (thuộc F-142)
- Import hàng loạt nhiều vùng nước cùng lúc

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Create + Read | Có quyền tạo và xem tất cả vùng nước |
| NhanVienCangBien (Nhân viên cảng) | Create + Read | Có quyền tạo và xem vùng nước; không có quyền xóa hoặc phê duyệt |
| LeDuan (Lãnh đạo) | Create + Read + Approve | Có quyền tạo, xem và phê duyệt/từ chối vùng nước |
| QuanTramMien (Quan tra miền) | Read only | Không có quyền tạo vùng nước mới, chỉ xem |

## Entities

| Entity | Fields |
|---|---|
| VungNuoc | id (UUID), maVungNuoc (string, unique, length≤50), tenVungNuoc (string, length≤255), cangBienId (UUID, parent), dienTich (BigDecimal, precision 15 scale 2), doSauMax (BigDecimal, precision 10 scale 2), doSauTrungBinh (BigDecimal, precision 10 scale 2), loaiVungNuoc (string, length≤100), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |
| CangBien (parent) | id (UUID), tenCangBien (string), trangThaiHoatDong (string) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Mã vùng nước (`maVungNuoc`) phải là duy nhất — client-side check khi blur, server-side check khi POST | POST | Entity constraint |
| BR-02 | Cảng mẹ (`cangBienId`) phải tồn tại và có `trangThaiHoatDong = HIEN_HANH` — dropdown chỉ hiển thị cảng hợp lệ | POST | Parent guard |
| BR-03 | Các trường số (dienTich, doSauMax, doSauTrungBinh) phải là giá trị BigDecimal hợp lệ theo precision/scale quy định | POST | Type validation |
| BR-04 | `trangThaiPheDuyet` mặc định khi tạo mới là `CHỜ_PHÊ_DUYỆT` | POST | Default value |
| BR-05 | maVungNuoc không được để trống, tenVungNuoc không được để trống | POST | Required field |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào backend: API POST /api/v1/vung-nuoc xác nhận mã duy nhất, kiểm tra trạng thái cảng mẹ phải là HIEN_HANH, validate các trường số (dienTich, doSauMax, doSauTrungBinh) đúng precision/scale, và kiểm tra trạng thái mặc định. Kiểm thử tích hợp xác nhận toàn bộ luồng POST với dữ liệu hợp lệ và không hợp lệ (duplicate maVungNuoc, cangBienId không tồn tại, các trường số không hợp lệ). Kiểm thử E2E/UI sử dụng browser automation để verify: form hiển thị đúng các trường, dropdown cangBienId chỉ hiển thị cảng HIEN_HANH, client-side validation hiển thị lỗi chính xác tại từng trường (maVungNuoc duplicate, số không hợp lệ), nút "Tạo mới" chỉ hoạt động khi form hợp lệ, toast thông báo thành công xuất hiện đúng sau khi tạo, redirect về danh sách sau khi tạo thành công, và toast lỗi giữ lại dữ liệu form khi tạo thất bại.
