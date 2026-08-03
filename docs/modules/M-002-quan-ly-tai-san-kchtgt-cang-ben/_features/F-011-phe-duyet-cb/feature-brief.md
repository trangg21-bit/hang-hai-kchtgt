---
id: F-011
name: Phê duyệt Cảng biển
slug: phe-duyet-cb
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Cảng biển

## Description

Tính năng cho phép Lãnh đạo phê duyệt thông tin Cảng biển mới được tạo hoặc cập nhật, bao gồm xem chi tiết, đánh giá tính hợp lệ, chấp thuận hoặc từ chối yêu cầu cùng lý do cụ thể. Giao diện PortApprovalPage hiển thị danh sách cảng chờ duyệt (approval_status = PENDING_APPROVAL), với hành động Phê duyệt/Từ chối kèm confirmation dialog. approval_log được tạo tự động để ghi nhận quyết định.

## Business Intent

Việc phê duyệt Cảng biển là bước kiểm soát chất lượng bắt buộc trước khi thông tin cảng được kích hoạt; quy trình này đảm bảo mọi Cảng biển đăng ký đều tuân thủ quy chuẩn kỹ thuật, có đủ thông tin pháp lý và kỹ thuật.

## Flow Summary

### BE Flow
Cảng biển sau khi tạo/cập nhật tự động chuyển trạng thái "Chờ phê duyệt". Lãnh đạo truy cập danh sách chờ duyệt, chọn Cảng cần xem xét. Hệ thống hiển thị đầy đủ thông tin kèm lịch sử thay đổi. Lãnh đạo chọn "Chấp thuận" hoặc "Từ chối" cùng lý do (bắt buộc khi từ chối). Hệ thống cập nhật trạng thái, ghi nhật ký và thông báo cho người tạo.

### UI Flow
Lãnh đạo vào trang "Phê duyệt", xem danh sách cảng PENDING_APPROVAL. Chọn một cảng → xem chi tiết → click "Phê duyệt" → confirmation dialog → xác nhận → `approval_status = APPROVED` → tạo approval_log → toast "Đã phê duyệt thành công". Hoặc click "Từ chối" → confirmation dialog → nhập lý do (tối thiểu 10 ký tự) → xác nhận → `approval_status = REJECTED` → tạo approval_log với lý do → toast "Đã từ chối".

## Acceptance Criteria

1. Chỉ Lãnh đạo mới thấy và thực hiện được danh sách Cảng biển chờ phê duyệt.
2. Hệ thống hiển thị đầy đủ thông tin Cảng biển chờ phê duyệt kèm lịch sử thay đổi.
3. Lý do từ chối là bắt buộc (tối thiểu 10 ký tự); lý do chấp thuận là tùy chọn.
4. Sau khi phê duyệt, trạng thái Cảng biển được cập nhật và người tạo nhận thông báo.
5. [UI] Confirmation dialog hiển thị trước mọi hành động phê duyệt/từ chối.
6. [UI] approval_log được tạo tự động, ghi nhận đầy đủ người duyệt, thời gian, quyết định, lý do.

## In Scope

- Danh sách Cảng biển chờ phê duyệt
- Trang chi tiết với đầy đủ thông tin
- Giao diện phê duyệt: chấp thuận hoặc từ chối
- Trường nhập lý do từ chối (bắt buộc, tối thiểu 10 ký tự)
- Cập nhật trạng thái sau phê duyệt
- Ghi nhật ký phê duyệt (approval_log)
- Thông báo kết quả đến người tạo
- Confirmation dialog

## Out of Scope

- Phê duyệt xóa Cảng biển
- Phê duyệt hàng loạt nhiều Cảng biển cùng lúc
- Tự động phê duyệt dựa trên quy tắc
- Phê duyệt bởi nhiều cấp (multi-level approval)

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Lãnh đạo | Phê duyệt (chấp thuận/từ chối), Xem |
| Admin | Phê duyệt (chấp thuận/từ chối), Xem |
| Người tạo | Xem trạng thái, không phê duyệt |
| Nhân viên vận hành | Xem |

## Entities

- **port**: id (UUID), port_code (string, unique), port_name (string), province_city (string), latitude (BigDecimal), longitude (BigDecimal), area (BigDecimal), max_vessel_capacity (BigDecimal), operational_status (string), approval_status (string: PENDING_APPROVAL/APPROVED/REJECTED), pending_approval (boolean), rejection_reason (text, nullable)
- **approval_log**: id (UUID), port_id (UUID), approved_by (UUID), decision (enum: approved, rejected), reason (text), approved_at (timestamp)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Cảng biển mới tạo có trạng thái "Chờ phê duyệt", chỉ chuyển thành "Hiện hành" sau khi được phê duyệt | Trạng thái | Entity spec |
| BR-002 | Lý do từ chối là trường bắt buộc, tối thiểu 10 ký tự | Từ chối | F-011, F-072 |
| BR-003 | Mỗi Cảng biển chỉ cần một lần phê duyệt duy nhất | Quy trình | Entity spec |
| BR-004 | Nhật ký phê duyệt được lưu trữ vĩnh viễn, không cho phép xóa hoặc sửa | Audit | Entity spec |

## UI Scope

- **Component:** `PortApprovalPage` — danh sách cảng chờ duyệt + hành động Phê duyệt/Từ chối
- **API endpoints:** `GET /api/v1/ports?approval_status=PENDING_APPROVAL` (danh sách), `POST /api/v1/ports/:id/approve` (phê duyệt), `POST /api/v1/ports/:id/reject` (từ chối)
- **Phê duyệt:** Chuyển `approval_status → APPROVED`, tạo `approval_log`, toast "Đã phê duyệt thành công"
- **Từ chối:** Chuyển `approval_status → REJECTED`, bắt buộc nhập lý do (tối thiểu 10 ký tự), tạo `approval_log` với lý do, toast "Đã từ chối"
- **Confirmation dialog:** Hiển thị trước mọi hành động để tránh thao tác nhầm
- **RBAC:** Chỉ Lãnh đạo mới thấy và thực hiện được hành động Phê duyệt/Từ chối

## Testing Strategy

### BE Testing
Kiểm thử đơn vị cho quy tắc kiểm tra quyền phê duyệt và validation lý do từ chối; kiểm thử tích hợp cho luồng phê duyệt: chấp thuận thành công, từ chối với lý do, từ chối không lý do (bị chặn).

### UI Testing
React Testing Library: danh sách chờ duyệt, confirmation dialog, validation lý do từ chối (min 10 chars). Cypress E2E: đăng nhập Lãnh đạo → danh sách chờ duyệt → chọn cảng → xem chi tiết → click Phê duyệt → xác nhận dialog → toast "Đã phê duyệt thành công". Negative: Từ chối không nhập lý do → bị chặn; nhân viên vận hành không thấy nút Phê duyệt.

## Consolidation Note

Merged with UI feature F-072 (ui-phe-duyet-cb) — 2026-07-28
