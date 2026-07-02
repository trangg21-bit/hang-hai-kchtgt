---
id: F-091
name: "Cập nhật Vùng nước"
slug: ui-ql-vn-cap-nhat
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:47Z"
last-updated: "2026-07-01T04:08:47Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Cập nhật Vùng nước

## Description

Tính năng Cập nhật Vùng nước cung cấp giao diện form để người dùng chỉnh sửa thông tin của một vùng nước đã tồn tại trong hệ thống. Trang mở từ nút "Chỉnh sửa" trên trang Danh sách Vùng nước (F-088) hoặc trang Chi tiết (F-089). Form được pre-filled với toàn bộ dữ liệu hiện tại của vùng nước từ API `GET /api/v1/vung-nuoc/{id}`. Trường maVungNuoc được hiển thị dưới dạng readonly (không cho phép chỉnh sửa) để đảm bảo tính duy nhất của mã. Các trường còn lại (tenVungNuoc, loaiVungNuoc, cangBienId, dienTich, doSauMax, doSauTrungBinh, trangThaiHoatDong) cho phép chỉnh sửa theo cùng quy tắc validation như khi tạo mới (F-090): cangBienId dropdown chỉ hiển thị cảng có `trangThaiHoatDong = HIEN_HANH`, các trường số (dienTich, doSauMax, doSauTrungBinh) phải là giá trị BigDecimal hợp lệ. Khi click nút "Cập nhật", hệ thống gọi API `PUT /api/v1/vung-nuoc/{id}`. Sau khi cập nhật thành công, hệ thống tự động tạo bản ghi LichSuThayDoi (INT-003) ghi nhận các trường bị thay đổi, reset `trangThaiPheDuyet` về `CHỜ_PHÊ_DUYỆT` (vùng nước cần phê duyệt lại), hiển thị toast "Cập nhật thành công — chờ phê duyệt lại", và redirect về trang Danh sách Vùng nước (F-088).

## Business Intent

Cho phép người dùng cập nhật thông tin của một vùng nước đã tồn tại (tên, loại, diện tích, độ sâu, hoặc cảng mẹ), với quy trình phê duyệt lại tự động đảm bảo mọi thay đổi đều được kiểm tra trước khi có hiệu lực chính thức.

## Flow Summary

Người dùng click nút "Chỉnh sửa" từ trang Danh sách Vùng nước hoặc trang Chi tiết. Hệ thống gọi API `GET /api/v1/vung-nuoc/{id}` để lấy thông tin hiện tại và pre-fill form. Người dùng chỉnh sửa các trường cần thay đổi (maVungNuoc readonly). Client-side validation thực hiện khi mất focus (blur) cho từng trường: maVungNuoc (unique check qua API), cangBienId (tồn tại + HIEN_HANH), các trường số (dienTich, doSauMax, doSauTrungBinh) phải là giá trị hợp lệ. Sau khi điền xong, người dùng click nút "Cập nhật". Hệ thống gọi `PUT /api/v1/vung-nuoc/{id}` — nếu thành công, hệ thống tự động tạo bản ghi LichSuThayDoi (INT-003) ghi nhận các thay đổi, reset trạng thái phê duyệt về CHỜ_PHÊ_DUYỆT, hiển thị toast "Cập nhật thành công — chờ phê duyệt lại", và redirect về trang Danh sách Vùng nước. Nếu lỗi (duplicate maVungNuoc sau khi đổi, cangBienId không hợp lệ), toast lỗi hiển thị và form giữ lại dữ liệu.

## Acceptance Criteria

1. Khi mở trang, form được pre-filled với toàn bộ dữ liệu của vùng nước từ API `GET /api/v1/vung-nuoc/{id}`; trường maVungNuoc hiển thị dưới dạng readonly (disabled input).
2. Dropdown cangBienId chỉ hiển thị các cảng biển có `trangThaiHoatDong = HIEN_HANH`, giá trị hiện tại của cangBienId được pre-selected.
3. Client-side validation: khi thay đổi maVungNuoc (nếu cho phép) và mất focus, hệ thống gọi API kiểm tra tính duy nhất; nếu mã đã tồn tại ở vùng nước khác, hiển thị lỗi "Mã vùng nước đã tồn tại".
4. Client-side validation: các trường số (dienTich, doSauMax, doSauTrungBinh) không phải giá trị hợp lệ hiển thị lỗi tương ứng và không cho phép submit.
5. Sau khi click "Cập nhật" và dữ liệu hợp lệ, hệ thống gọi `PUT /api/v1/vung-nuoc/{id}` — sau khi thành công, toast "Cập nhật thành công — chờ phê duyệt lại" được hiển thị.
6. Sau khi cập nhật, `trangThaiPheDuyet` được reset về `CHỜ_PHÊ_DUYỆT` và một bản ghi LichSuThayDoi được tự động tạo (INT-003) ghi nhận các trường thay đổi.
7. Sau khi toast hiển thị, hệ thống tự động redirect về trang Danh sách Vùng nước (F-088).
8. Nếu cập nhật thất bại (lỗi server, duplicate mã, v.v.), toast lỗi hiển thị và form giữ lại toàn bộ dữ liệu đã nhập.

## In Scope

- Form cập nhật vùng nước với dữ liệu pre-filled từ API
- Trường maVungNuoc readonly (không cho phép chỉnh sửa)
- Validation tương tự tạo mới (cangBienId HIEN_HANH, các trường số dienTich/doSauMax/doSauTrungBinh phải là giá trị hợp lệ)
- API PUT /api/v1/vung-nuoc/{id}
- Tự động tạo bản ghi LichSuThayDoi (INT-003) ghi nhận thay đổi
- Reset trangThaiPheDuyet về CHỜ_PHÊ_DUYỆT
- Toast thông báo và redirect về danh sách

## Out of Scope

- Tạo mới vùng nước (thuộc F-090)
- Xóa vùng nước (thuộc F-101)
- Phê duyệt/từ chối vùng nước (thuộc F-092)
- Xem lịch sử thay đổi chi tiết (thuộc F-102)
- Undo/hoàn tác thay đổi sau khi đã cập nhật

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Read + Update | Có quyền cập nhật thông tin tất cả vùng nước của cảng |
| NhanVienCangBien (Nhân viên cảng) | Read + Update | Có quyền cập nhật, vùng nước cần phê duyệt lại sau khi thay đổi |
| LeDuan (Lãnh đạo) | Read + Update + Approve | Có quyền cập nhật và phê duyệt/từ chối vùng nước |
| QuanTramMien (Quan tra miền) | Read only | Không có quyền cập nhật vùng nước |

## Entities

| Entity | Fields |
|---|---|
| VungNuoc | id (UUID), maVungNuoc (string, unique, length≤50), tenVungNuoc (string, length≤255), cangBienId (UUID, parent), dienTich (BigDecimal, precision 15 scale 2), doSauMax (BigDecimal, precision 10 scale 2), doSauTrungBinh (BigDecimal, precision 10 scale 2), loaiVungNuoc (string, length≤100), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |
| LichSuThayDoi (change history) | id (UUID), vungNuocId (UUID), field (string), oldValue (text), newValue (text), changedBy (UUID), changedAt (datetime) |
| CangBien (parent) | id (UUID), tenCangBien (string), trangThaiHoatDong (string) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | maVungNuoc không cho phép chỉnh sửa trên form cập nhật (readonly field) | PUT | Entity constraint |
| BR-02 | Cảng mẹ (cangBienId) phải có `trangThaiHoatDong = HIEN_HANH` — dropdown chỉ hiển thị cảng hợp lệ | PUT | Parent guard |
| BR-03 | Các trường số (dienTich, doSauMax, doSauTrungBinh) phải là giá trị BigDecimal hợp lệ theo precision/scale quy định | PUT | Type validation |
| BR-04 | Sau khi cập nhật thành công, `trangThaiPheDuyet` được reset về `CHỜ_PHÊ_DUYỆT` và bản ghi LichSuThayDoi được tạo (INT-003) | PUT | INT-003 |
| BR-05 | Chỉ người dùng có quyền update (`@auth.check(authentication, 'vungnuoc:update')`) mới thực hiện được | PUT | RBAC |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào backend: API PUT /api/v1/vung-nuoc/{id} xác nhận maVungNuoc không cho phép đổi (hoặc nếu đổi thì phải unique), validate cangBienId tồn tại và HIEN_HANH, validate các trường số (dienTich, doSauMax, doSauTrungBinh) đúng precision/scale, và đảm bảo trạng thái được reset về CHỜ_PHÊ_DUYỆT. Kiểm thử tích hợp xác nhận bản ghi LichSuThayDoi được tạo chính xác sau khi PUT (INT-003), ghi nhận đúng các trường thay đổi với oldValue/newValue. Kiểm thử E2E/UI sử dụng browser automation để verify: form pre-filled đúng dữ liệu từ API, maVungNuoc readonly, validation hiển thị lỗi chính xác khi nhập sai (số không hợp lệ, duplicate), nút "Cập nhật" chỉ hoạt động khi form hợp lệ, toast "chờ phê duyệt lại" xuất hiện sau khi update thành công, redirect đúng về danh sách, và bản ghi thay đổi được ghi nhận trong LichSuThayDoi.
