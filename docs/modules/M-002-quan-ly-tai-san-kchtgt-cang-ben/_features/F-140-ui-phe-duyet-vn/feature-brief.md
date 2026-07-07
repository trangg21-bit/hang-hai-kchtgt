---
id: F-140
name: "Phê duyệt Vùng nước"
slug: ui-phe-duyet-vn
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:52:13Z"
last-updated: "2026-07-01T07:52:13Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Vùng nước

## Description

Tính năng Phê duyệt Vùng nước cung cấp giao diện dành riêng cho người dùng có vai trò Lãnh đạo/Phê duyệt để xem, duyệt hoặc từ chối các vùng nước đang trong trạng thái chờ phê duyệt (`trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT`). Trang bao gồm hai phần: (1) Bảng danh sách các vùng nước chờ duyệt, hiển thị maVungNuoc, tenVungNuoc, tenLoaiVungNuoc, tên cảng mẹ, dienTich, doSauMax, doSauTrungBinh, ngày tạo — với tùy chọn lọc theo trạng thái và cảng mẹ; (2) Trang chi tiết phê duyệt cho từng vùng nước, hiển thị đầy đủ thông tin VungNuoc (tương tự F-137) cùng các nút "Phê duyệt" và "Từ chối". Khi click nút "Phê duyệt", hệ thống hiển thị hộp thoại xác nhận (confirmation dialog) có nút "Xác nhận" và "Hủy"; sau khi xác nhận, gọi API `POST /api/v1/vung-nuoc/{id}/approve` và chuyển trạng thái thành `ĐƯỢC_PHÊ_DUYỆT` kèm tạo bản ghi PheDuyetLog. Khi click nút "Từ chối", hệ thống hiển thị form nhập lý do từ chối (textfield, yêu cầu tối thiểu 10 ký tự) — sau khi xác nhận, gọi API `POST /api/v1/vung-nuoc/{id}/reject` với lý do, chuyển trạng thái thành `TỪ_CHỐI` kèm tạo bản ghi PheDuyetLog.

## Business Intent

Cho phép người dùng có thẩm quyền phê duyệt rà soát và quyết định chính thức về việc chấp thuận hoặc từ chối một vùng nước mới được đăng ký, đảm bảo mọi thay đổi hoặc thêm mới đều trải qua quy trình kiểm tra trước khi đi vào hoạt động chính thức.

## Flow Summary

Người dùng có quyền phê duyệt (LeDuan hoặc QuanTriCangBien) truy cập trang Phê duyệt Vùng nước từ menu. Trang hiển thị danh sách vùng nước có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` với các cột: mã, tên, loại vùng nước, cảng mẹ, diện tích, độ sâu max, độ sâu trung bình, ngày tạo. Người dùng có thể lọc theo cảng mẹ hoặc tìm kiếm theo mã/tên. Người dùng click vào một vùng nước trong danh sách để xem chi tiết và quyết định. Khi đã sẵn sàng phê duyệt, người dùng click nút "Phê duyệt" → hộp thoại xác nhận xuất hiện → click "Xác nhận" → hệ thống gọi `POST /api/v1/vung-nuoc/{id}/approve` → trạng thái chuyển thành `ĐƯỢC_PHÊ_DUYỆT`, bản ghi PheDuyetLog được tạo, toast "Đã phê duyệt thành công" xuất hiện, vùng nước biến mất khỏi danh sách chờ duyệt. Khi từ chối, người dùng click nút "Từ chối" → form nhập lý do (≥10 ký tự) → xác nhận → gọi `POST /api/v1/vung-nuoc/{id}/reject` → trạng thái thành `TỪ_CHỐI`, PheDuyetLog được tạo, toast "Đã từ chối" xuất hiện.

## Acceptance Criteria

1. Trang hiển thị danh sách vùng nước có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT`, các vùng nước đã được phê duyệt (ĐƯỢC_PHÊ_DUYỆT) hoặc bị từ chối (TỪ_CHỐI) không xuất hiện trong danh sách này.
2. Người dùng không có quyền phê duyệt (`@auth.check(authentication, 'vungnuoc:approve')`) không nhìn thấy tab hoặc nút "Phê duyệt" — giao diện chặn quyền truy cập trang Phê duyệt.
3. Khi click nút "Phê duyệt", hộp thoại xác nhận xuất hiện với tiêu đề "Xác nhận phê duyệt {tenVungNuoc}", mô tả "Bạn có chắc chắn muốn phê duyệt vùng nước này?", nút "Hủy" và "Xác nhận".
4. Sau khi click "Xác nhận" trong hộp thoại phê duyệt, hệ thống gọi `POST /api/v1/vung-nuoc/{id}/approve` — trạng thái chuyển thành `ĐƯỢC_PHÊ_DUYỆT`, bản ghi PheDuyetLog được tạo, toast "Đã phê duyệt thành công" xuất hiện, vùng nước biến khỏi danh sách chờ duyệt.
5. Khi click nút "Từ chối", form nhập lý do từ chối xuất hiện — trường lý do yêu cầu tối thiểu 10 ký tự, nếu nhập <10 ký tự hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự" và không cho phép submit.
6. Sau khi submit lý do từ chối hợp lệ, hệ thống gọi `POST /api/v1/vung-nuoc/{id}/reject` — trạng thái chuyển thành `TỪ_CHỐI`, bản ghi PheDuyetLog được tạo, toast "Đã từ chối" xuất hiện.
7. Nút "Phê duyệt" và "Từ chối" chỉ hiển thị cho vùng nước có trạng thái CHỜ_PHÊ_DUYỆT; các vùng nước đã ĐƯỢC_PHÊ_DUYỆT hoặc TỪ_CHỐI không hiển thị các nút này.
8. Click "Hủy" trong hộp thoại xác nhận đóng hộp thoại mà không thực hiện bất kỳ hành động nào.

## In Scope

- Bảng danh sách vùng nước chờ phê duyệt (status = CHỜ_PHÊ_DUYỆT)
- Lọc danh sách theo cảng mẹ và tìm kiếm theo mã/tên
- Hộp thoại xác nhận phê duyệt (confirm dialog)
- API POST /:id/approve → trạng thái ĐƯỢC_PHÊ_DUYỆT + PheDuyetLog
- Form nhập lý do từ chối (≥10 ký tự)
- API POST /:id/reject → trạng thái TỪ_CHỐI + PheDuyetLog
- Toast thông báo sau mỗi hành động
- RBAC chặn người dùng không có quyền approve

## Out of Scope

- Tạo mới vùng nước (thuộc F-138)
- Chỉnh sửa thông tin vùng nước (thuộc F-139)
- Xóa vùng nước (thuộc F-141)
- Xem lịch sử thay đổi (thuộc F-142)
- Batch approve/reject nhiều vùng nước cùng lúc
- Email thông báo khi phê duyệt/từ chối

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Read + Approve | Xem danh sách chờ duyệt, phê duyệt/từ chối vùng nước của cảng |
| LeDuan (Lãnh đạo) | Read + Approve | Xem danh sách chờ duyệt, phê duyệt/từ chối tất cả vùng nước |
| NhanVienCangBien (Nhân viên cảng) | Read | Chỉ xem danh sách chờ duyệt, không có quyền phê duyệt hoặc từ chối |
| QuanTramMien (Quan tra miền) | Read only | Chỉ xem, không có quyền phê duyệt hoặc từ chối |

## Entities

| Entity | Fields |
|---|---|
| VungNuoc | id (UUID), maVungNuoc (string, unique, length≤50), tenVungNuoc (string, length≤255), cangBienId (UUID, parent), dienTich (BigDecimal, precision 15 scale 2), doSauMax (BigDecimal, precision 10 scale 2), doSauTrungBinh (BigDecimal, precision 10 scale 2), loaiVungNuoc (string, length≤100), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable) |
| PheDuyetLog | id (UUID), vungNuocId (UUID), pheDuyetVienId (UUID), hanhDong (enum: APPROVE, REJECT), lyDo (text), pheDuyetThoiGian (datetime) |
| CangBien (parent) | id (UUID), tenCangBien (string), trangThaiHoatDong (string) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Chỉ vùng nước có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` mới được phê duyệt hoặc từ chối | POST /approve, POST /reject | State machine |
| BR-02 | Phê duyệt thành công chuyển trạng thái thành `DUOC_PHE_DUYET` và tạo bản ghi PheDuyetLog(hanhDong=APPROVE) | POST /approve | F-035 |
| BR-03 | Từ chối yêu cầu lý do tối thiểu 10 ký tự — chuyển trạng thái thành `TỪ_CHỐI` và tạo bản ghi PheDuyetLog(hanhDong=REJECT) | POST /reject | F-035 |
| BR-04 | Chỉ người dùng có quyền approve (`@auth.check(authentication, 'vungnuoc:approve')`) mới thấy và thực hiện được hành động phê duyệt/từ chối | Display, Action | RBAC |

## Testing Strategy

Kiểm thử đơn vị (unit test) xác nhận backend: API POST /:id/approve chuyển trạng thái thành ĐƯỢC_PHÊ_DUYỆT và tạo PheDuyetLog(hanhDong=APPROVE); API POST /:id/reject validate lý do ≥10 ký tự, chuyển trạng thái thành TỪ_CHỐI và tạo PheDuyetLog(hanhDong=REJECT). Kiểm thử tích hợp xác nhận trạng thái không cho phép approve/reject trên vùng nước đã ĐƯỢC_PHÊ_DUYỆT hoặc TỪ_CHỐI (state machine enforcement). Kiểm thử E2E/UI sử dụng browser automation để verify: danh sách chỉ hiển thị vùng nước có status = CHỜ_PHÊ_DUYỆT, người dùng không có quyền approve không thấy nút Phê duyệt/Từ chối, hộp thoại xác nhận xuất hiện đúng khi click Phê duyệt với nút Hủy/Xác nhận, sau approve trạng thái chuyển thành ĐƯỢC_PHÊ_DUYỆT và toast xuất hiện, form lý do từ chối yêu cầu ≥10 ký tự và hiển thị lỗi khi <10 ký tự, sau reject trạng thái chuyển thành TỪ_CHỐI, PheDuyetLog được tạo đúng, và vùng nước biến khỏi danh sách chờ duyệt sau khi được phê duyệt hoặc từ chối.
