---
id: F-113
name: "Xoa Cang Bien"
slug: ui-ql-cb-xoa
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:50:01Z"
last-updated: "2026-07-01T07:50:01Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xoa Cang Bien

## Description

Giao diện xóa Cảng biển (CangBienDeletePage) cho phép các người dùng có vai trò Leadership (Admin, Lãnh đạo) thực hiện xóa mềm (soft delete) một cảng biển đã tồn tại trong hệ thống. Trước khi xóa, hệ thống gọi API để kiểm tra số lượng bản ghi con (BenCang và VungNuoc) liên kết với cảng biển đang được xóa. Nếu tồn tại ít nhất một bản ghi con, hệ thống trả về HTTP 409 Conflict với thông báo chi tiết về số lượng con, ngăn không cho xóa. Nếu không có bản ghi con, hệ thống hiển thị hộp thoại xác nhận với thông tin cảng biển sẽ bị xóa và yêu cầu người dùng xác nhận bằng cách nhập tên cảng biển hoặc gõ "XÓA" để đảm bảo thao tác có chủ đích. Khi xác nhận, hệ thống gọi DELETE /api/v1/cang-bien/:id, server set deletedAt = now() (soft delete pattern), không xóa bản ghi mà chỉ đánh dấu đã xóa. Hiển thị toast "Đã xóa thành công" và điều hướng về danh sách.

## Business Intent

Cho phép Leadership loại bỏ cảng biển không còn hoạt động khỏi hệ thống mà vẫn giữ lại dữ liệu để phục vụ kiểm toán và truy vết. Soft delete đảm bảo dữ liệu lịch sử không bị mất, đồng thời ngăn xóa nhầm bằng cơ chế kiểm tra con (child guard) và xác nhận có chủ đích. Nếu cảng vẫn có dữ liệu con (BenCang/VungNuoc), xóa mềm bị chặn để bảo toàn tính toàn vẹn tham chiếu.

## Flow Summary

Người dùng (Leadership) điều hướng đến trang chi tiết (F-109) hoặc danh sách (F-108) và click "Xóa". Hệ thống gọi kiểm tra child count (GET /api/v1/cang-bien/:id/children) — nếu BenCang/VungNuoc > 0, trả về HTTP 409 với thông báo "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa". Nếu không có con, hiển thị confirmation dialog với thông tin: mã cảng, tên cảng, ngày tạo, yêu cầu xác nhận (nhập "XÓA" hoặc tên cảng). Xác nhận đúng → gọi DELETE /api/v1/cang-bien/:id → server set deletedAt = now() → toast "Đã xóa thành công" → điều hướng về danh sách. Xác nhận sai → dialog đóng, không xóa.

## Acceptance Criteria

1. Chỉ Admin và Lãnh đạo mới thấy và thực hiện được hành động "Xóa" — các role khác không thấy nút xóa.
2. Trước khi xóa, hệ thống kiểm tra số lượng bản ghi con (BenCang/VungNuoc) — nếu > 0, hiển thị toast lỗi 409 "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa".
3. Nếu không có bản ghi con, hiển thị confirmation dialog yêu cầu xác nhận (nhập "XÓA" hoặc tên cảng).
4. Xác nhận đúng → gọi DELETE /api/v1/cang-bien/:id → server set deletedAt = now() (soft delete) → toast "Đã xóa thành công" → điều hướng về danh sách (F-108).
5. Xác nhận sai hoặc đóng dialog → không thực hiện xóa, không có thay đổi nào.
6. Soft delete pattern: bản ghi vẫn tồn tại trong DB với deletedAt != null, không xuất hiện trong danh sách mặc định.

## In Scope

- Kiểm tra child count (BenCang/VungNuoc) trước xóa
- Confirmation dialog với xác nhận có chủ đích
- Soft delete (DELETE /:id → set deletedAt = now)
- HTTP 409 nếu tồn tại bản ghi con
- Toast thông báo thành công/lỗi
- Điều hướng về danh sách sau xóa

## Out of Scope

- Xóa cứng (hard delete) — chỉ soft delete được hỗ trợ
- Xóa hàng loạt (bulk delete)
- Khôi phục bản ghi đã xóa (restore)
- Xóa các bản ghi con cùng lúc (cascade delete)
- Thông báo email khi xóa

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full + Xóa | Xóa mềm tất cả Cảng biển |
| Lãnh đạo | Full + Xóa | Xóa mềm tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Không có quyền xóa |
| Chuyên viên Cảng vụ | CRUD | Không có quyền xóa |
| Doanh nghiệp cảng | CRUD | Không có quyền xóa |
| Nhân viên vận hành | Read-only | Không có quyền xóa |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable — soft delete)
- **BenCang**: id (UUID), cangBienId (UUID), ... (foreign key)
- **VungNuoc**: id (UUID), cangBienId (UUID), ... (foreign key)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Chỉ Admin và Lãnh đạo mới có quyền xóa mềm Cảng biển | Xóa | F-113, RBAC |
| BR-002 | Nếu tồn tại BenCang hoặc VungNuoc liên kết, xóa mềm bị chặn (HTTP 409) | Child guard | F-113, F-010 |
| BR-003 | Soft delete: set deletedAt = now() thay vì xóa bản ghi khỏi DB | Xóa mềm | F-113 |
| BR-004 | Cần xác nhận có chủ đích (nhập "XÓA" hoặc tên cảng) trước khi xóa | Xác nhận | F-113 |

## Testing Strategy

Giao diện xóa Cảng biển được kiểm thử bằng React Testing Library cho việc hiển thị đúng confirmation dialog, validation xác nhận (chỉ cho phép xóa khi đúng tên/mã cảng hoặc nhập "XÓA"), và xử lý response 409 khi tồn tại bản ghi con. Cypress thực hiện end-to-end test: đăng nhập Leadership → điều hướng đến chi tiết một cảng → click "Xóa" → xác minh confirmation dialog hiển thị → nhập tên chính xác → xác nhận → toast "Đã xóa thành công" → xác nhận điều hướng về danh sách với cảng không còn trong danh sách. Negative test: click "Xóa" trên cảng có BenCang/VungNuoc con → 409 → toast lỗi "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa"; nhập sai tên trong dialog → không xóa. Test nhân viên vận hành: xác minh không thấy nút xóa.
