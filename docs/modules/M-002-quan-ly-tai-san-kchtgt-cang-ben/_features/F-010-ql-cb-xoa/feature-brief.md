---
id: F-010
name: Quản lý Cảng biển - Xóa
slug: ql-cb-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng biển - Xóa

## Description

Tính năng cho phép người dùng có thẩm quyền xóa một Cảng biển khỏi hệ thống, áp dụng cơ chế xóa mềm (soft delete) để bảo tồn dữ liệu lịch sử. Giao diện CangBienDeleteConfirm cung cấp confirmation dialog với child guard check — kiểm tra số lượng BenCang/VungNuoc liên kết trước khi cho phép xóa, yêu cầu nhập chính xác tên cảng hoặc "XÓA" để xác nhận có chủ đích.

## Business Intent

Việc xóa Cảng biển khỏi hệ thống chỉ được thực hiện khi cảng chấm dứt hoạt động vĩnh viễn; cơ chế xóa mềm giúp duy trì tính toàn vẹn của dữ liệu lịch sử, phục vụ công tác kiểm toán và báo cáo thống kê, đồng thời cho phép khôi phục nếu có sai sót.

## Flow Summary

### BE Flow
Người dùng chọn Cảng biển cần xóa, hệ thống hiển thị thông tin kèm cảnh báo. Người dùng xác nhận bằng cách nhập tên Cảng biển. Hệ thống kiểm tra điều kiện: không có dữ liệu liên quan chưa xử lý, không nằm trong quá trình phê duyệt. Nếu vượt qua, đánh dấu "đã xóa" (soft delete), ghi nhật ký.

### UI Flow
Người dùng (Leadership) click "Xóa" từ danh sách (F-068) hoặc chi tiết (F-069). Hệ thống gọi GET /api/v1/cang-bien/:id/children — nếu BenCang/VungNuoc > 0, trả HTTP 409 "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa". Nếu không có con, hiển thị confirmation dialog với thông tin cảng, yêu cầu nhập "XÓA" hoặc tên cảng. Xác nhận đúng → DELETE /api/v1/cang-bien/:id → server set deletedAt = now() → toast "Đã xóa thành công" → về danh sách.

## Acceptance Criteria

1. Chỉ Admin và Lãnh đạo mới có thể thực hiện thao tác xóa.
2. Hệ thống yêu cầu xác nhận bằng cách nhập tên Cảng biển hoặc "XÓA" trước khi xóa.
3. Hệ thống kiểm tra điều kiện ràng buộc: nếu có BenCang/VungNuoc liên kết, ngăn xóa và hiển thị cảnh báo.
4. Sau khi xóa, Cảng biển không hiển thị trong danh sách mặc định nhưng vẫn được lưu trữ với trạng thái "đã xóa".
5. [UI] Child guard check trước xóa → HTTP 409 nếu có con.
6. [UI] Confirmation dialog yêu cầu nhập "XÓA" hoặc tên cảng.
7. [UI] Soft delete: DELETE → set deletedAt = now() → toast "Đã xóa thành công" → về danh sách.

## In Scope

- Giao diện chọn và xác nhận xóa Cảng biển
- Kiểm tra điều kiện ràng buộc (dữ liệu liên quan, trạng thái)
- Xác nhận xóa bằng cách nhập tên Cảng biển hoặc "XÓA"
- Xóa mềm (soft delete) với ghi nhật ký
- Khôi phục Cảng biển đã xóa trong thời hạn 90 ngày
- Child guard check (BenCang/VungNuoc)
- Confirmation dialog
- Toast thông báo

## Out of Scope

- Xóa cứng Cảng biển khỏi cơ sở dữ liệu
- Xóa hàng loạt nhiều Cảng biển cùng lúc
- Xóa Cảng biển kèm dữ liệu liên quan (cascade delete)
- Phê duyệt xóa bởi cấp quản lý cao hơn (thuộc F-011)

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Xóa, Xem, Khôi phục |
| Lãnh đạo | Xóa, Xem, Khôi phục |
| Chuyên viên Cục | Không có quyền xóa |
| Chuyên viên Cảng vụ | Không có quyền xóa |
| Doanh nghiệp cảng | Không có quyền xóa |
| Nhân viên vận hành | Xem (không xóa) |

## Entities

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanhPho (string), viDo (BigDecimal), kinhDo (BigDecimal), dienTich (BigDecimal), khaNangTiepNhan (BigDecimal), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), deletedAt (timestamp, nullable), deletedBy (UUID, nullable)
- **BenCang**: id (UUID), cangBienId (UUID) — foreign key
- **VungNuoc**: id (UUID), cangBienId (UUID) — foreign key

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Xóa mềm (soft delete) — trạng thái "da_xoa", deletedAt và deletedBy tự động điền | Xóa | Entity spec |
| BR-002 | Không cho phép xóa nếu có dữ liệu liên quan chưa xử lý hoặc đang phê duyệt | Child guard | F-010, F-093 |
| BR-003 | Có thể khôi phục trong 90 ngày kể từ ngày xóa | Khôi phục | Entity spec |
| BR-004 | Chỉ Admin và Lãnh đạo mới có quyền xóa mềm | RBAC | F-010, F-093 |

## UI Scope

- **Component:** `CangBienDeleteConfirm` — confirmation dialog + child guard check
- **API endpoints:** `GET /api/v1/cang-bien/:id/children` (kiểm tra con), `DELETE /api/v1/cang-bien/:id` (soft delete)
- **Child guard:** Trước khi xóa, kiểm tra BenCang và VungNuoc. Nếu tồn tại ≥1 bản ghi con, API trả HTTP 409 "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa"
- **Confirmation dialog:** Yêu cầu nhập chính xác tên cảng hoặc gõ "XÓA" để xác nhận có chủ đích
- **Soft delete:** DELETE → server set `deletedAt = now()` (không xóa bản ghi, chỉ đánh dấu)
- **Post-delete flow:** Toast "Đã xóa thành công" → điều hướng về danh sách (F-068)
- **RBAC:** Chỉ Admin và Lãnh đạo mới thấy nút "Xóa"

## Testing Strategy

### BE Testing
Kiểm thử đơn vị cho quy tắc xóa mềm và kiểm tra điều kiện ràng buộc; kiểm thử tích hợp cho luồng xóa với các trường hợp: xóa thành công, xóa bị chặn do dữ liệu liên quan, xóa khi không có quyền.

### UI Testing
React Testing Library: confirmation dialog, validation xác nhận, xử lý 409. Cypress E2E: đăng nhập Leadership → chi tiết cảng → click Xóa → confirmation dialog → nhập tên chính xác → xác nhận → toast "Đã xóa thành công" → về danh sách. Negative: cảng có con → 409 → toast lỗi; nhập sai tên → không xóa; nhân viên vận hành không thấy nút xóa.

## Consolidation Note

Merged with UI feature F-093 (ui-ql-cb-xoa) — 2026-07-28
