---
id: F-072
name: "Phê duyệt Cảng biển"
slug: ui-phe-duyet-cb
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:13Z"
last-updated: "2026-07-01T04:08:13Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Cảng biển

## Description

Giao diện phê duyệt Cảng biển (CangBienApprovalPage) dành riêng cho Lãnh đạo, cho phép xem danh sách các cảng biển đang chờ phê duyệt (trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT) và thực hiện hành động Phê duyệt hoặc Từ chối. Khi Phê duyệt được thực hiện, trạng thái chuyển thành ĐƯỢC_PHÊ_DUYỆT, một bản ghi PheDuyetLog được tạo tự động ghi nhận người phê duyệt, thời gian và trạng thái. Khi Từ chối, trạng thái chuyển thành TỪ_CHỐI và người phê duyệt bắt buộc phải nhập lý do từ chối (tối thiểu 10 ký tự); bản ghi PheDuyetLog với trạng thái TỪ_CHỐI và lý do được tạo tự động. Trước khi thực hiện bất kỳ hành động nào, hệ thống hiển thị hộp thoại xác nhận (confirmation dialog) để tránh thao tác nhầm.

## Business Intent

Đảm bảo mọi cảng biển được đăng ký hoặc cập nhật thông tin đều phải trải qua quy trình phê duyệt của Lãnh đạo trước khi được đưa vào hoạt động. PheDuyetLog lưu trữ lịch sử phê duyệt/từ chối để phục vụ kiểm toán và truy vết quyết định. Đây là mắt xích quan trọng trong quy trình quản lý tài sản cảng biển, đảm bảo tính chính xác và hợp lệ của dữ liệu.

## Flow Summary

Người dùng (Lãnh đạo) điều hướng đến trang "Phê duyệt" từ menu hoặc danh sách. Trang tải danh sách các cảng biển có trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT qua API GET /api/v1/cang-bien?status=CHO_PHE_DUYET. Mỗi bản ghi hiển thị thông tin tóm tắt (maCang, tenCang, tinhThanhPho, ngày tạo, ngày cập nhật). Người dùng chọn một bản ghi và click "Phê duyệt" hoặc "Từ chối". Nhấp "Phê duyệt" → confirmation dialog → xác nhận → gọi POST /:id/approve → trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT + PheDuyetLog được tạo + toast "Đã phê duyệt thành công". Nhấp "Từ chối" → form nhập lý do (required ≥10 ký tự) → confirmation dialog → xác nhận → gọi POST /:id/reject?reason=... → trangThaiPheDuyet = TỪ_CHỐI + PheDuyetLog được tạo + toast "Đã từ chối". Sau mỗi hành động, danh sách được làm mới.

## Acceptance Criteria

1. Trang chỉ hiển thị các bản ghi có trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT (pending list filter).
2. Nhấp "Phê duyệt" → confirmation dialog → gọi POST /:id/approve → trạng thái chuyển ĐƯỢC_PHÊ_DUYỆT, PheDuyetLog được tạo (trạng thái = DUOC_PHE_DUYỆT), toast "Đã phê duyệt thành công".
3. Nhấp "Từ chối" → form nhập lý do (required, tối thiểu 10 ký tự) → confirmation dialog → gọi POST /:id/reject?reason=... → trạng thái chuyển TỪ_CHỐI, PheDuyetLog được tạo (trạng thái = TỪ_CHỐI + lý do), toast "Đã từ chối".
4. Lý do từ chối tối thiểu 10 ký tự — nếu ít hơn, hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự".
5. Chỉ người dùng có vai trò Lãnh đạo mới thấy và thực hiện được các hành động Phê duyệt/Từ chối (RBAC @auth.check('cangbien:approve')).
6. PheDuyetLog được lưu trữ bền vững với thông tin: cangBienId, nguoiPheDuyet, trangThai, lyDo (nếu từ chối), createdAt.

## In Scope

- Danh sách cảng biển chờ phê duyệt (filter status = CHỜ_PHÊ_DUYỆT)
- Hành động Phê duyệt (POST /:id/approve)
- Hành động Từ chối (POST /:id/reject, reason ≥ 10 ký tự)
- Confirmation dialog trước mỗi hành động
- PheDuyetLog tự động tạo khi phê duyệt hoặc từ chối
- Reset trạng thái phê duyệt sau hành động
- Toast thông báo thành công/lỗi
- Làm mới danh sách sau mỗi hành động

## Out of Scope

- Chỉnh sửa thông tin cảng (thuộc F-071)
- Xóa mềm cảng (thuộc F-093)
- Xem lịch sử thay đổi chi tiết (thuộc F-094)
- Từ chối mà không nhập lý do (bị chặn validation)
- Phê duyệt hàng loạt (bulk approve)
- Thông báo email khi phê duyệt/từ chối

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full + Phê duyệt | Xem danh sách chờ, Phê duyệt, Từ chối tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Xem danh sách chờ, Phê duyệt, Từ chối tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Không thấy hành động Phê duyệt/Từ chối, chỉ xem danh sách |
| Chuyên viên Cảng vụ | CRUD | Không thấy hành động Phê duyệt/Từ chối, chỉ xem danh sách |
| Nhân viên vận hành | Read-only | Không thấy danh sách chờ, không có quyền phê duyệt |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)
- **PheDuyetLog**: id (UUID), cangBienId (UUID), nguoiPheDuyet (UUID), trangThai (DUOC_PHE_DUYỆT/TU_CHOI), lyDo (text, ≥10 ký tự khi TU_CHOI), createdAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Chỉ Lãnh đạo/Admin mới thực hiện được hành động Phê duyệt/Từ chối | Phê duyệt | F-072, RBAC |
| BR-002 | Phê duyệt → trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT, tạo PheDuyetLog (DUOC_PHE_DUYỆT) | Phê duyệt | F-072, F-011 |
| BR-003 | Từ chối → trangThaiPheDuyet = TỪ_CHỐI, tạo PheDuyetLog (TU_CHOI + lý do ≥ 10 ký tự) | Từ chối | F-072, F-011 |
| BR-004 | PheDuyetLog được lưu trữ bền vững, truy vấn được qua GET /:id/history | Lịch sử phê duyệt | F-072, F-013 |

## Testing Strategy

Giao diện phê duyệt Cảng biển được kiểm thử bằng React Testing Library cho việc filter danh sách hiển thị đúng các bản ghi CHỜ_PHÊ_DUYỆT, validation lý do từ chối ≥ 10 ký tự, và xử lý response API (approve/reject). Cypress thực hiện end-to-end test: đăng nhập với tài khoản Leadership → điều hướng đến trang "Phê duyệt" → xác minh danh sách chỉ hiển thị bản ghi pending → click "Phê duyệt" trên một bản ghi → xác nhận confirmation dialog → xác nhận → toast "Đã phê duyệt thành công" → xác nhận bản ghi chuyển sang ĐƯỢC_PHÊ_DUYỆT. Negative test: click "Từ chối" → nhập lý do < 10 ký tự → lỗi validation → toast lỗi "Lý do từ chối phải có ít nhất 10 ký tự". Test PheDuyetLog: click "Lịch sử" → xác nhận log phê duyệt được tạo và hiển thị đúng thông tin người phê duyệt và thời gian.
