---
id: F-089
name: Phê duyệt Nhà trạm đèn
slug: phe-duyet-nha-tram-den
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Nhà trạm đèn

## Description
Tính năng cho phép Lãnh đạo (Trưởng phòng và Lãnh đạo Cục) xem xét, phê duyệt hoặc từ chối các nhà trạm đèn mới tạo hoặc cập nhật. Quy trình phê duyệt gồm 2 cấp: Trưởng phòng phê duyệt tầng 1, sau đó Lãnh đạo Cục phê duyệt tầng 2. Nếu một cấp từ chối, bản ghi quay lại trạng thái chờ chỉnh sửa cho Chuyên viên.

## Business Intent
Quy trình phê duyệt 2 cấp đảm bảo tính chính xác và đầy đủ của dữ liệu nhà trạm đèn trước khi đưa vào hệ thống chính thức. Cấp phòng kiểm tra thông tin chi tiết, cấp Cục xác nhận và cho phép đưa vào vận hành, tạo cơ chế kiểm soát chéo.

## Flow Summary
Trưởng phòng đăng nhập hệ thống, truy cập mục "Chờ phê duyệt" để xem danh sách nhà trạm đèn cần duyệt. Trưởng phòng mở chi tiết, kiểm tra thông tin, chọn "Phê duyệt" hoặc "Từ chối" kèm lý do (nếu từ chối). Nếu phê duyệt, bản ghi chuyển sang trạng thái "chờ duyệt cấp 2" và thông báo cho Lãnh đạo Cục. Lãnh đạo Cục xem lại và thực hiện phê duyệt cấp 2. Nếu cả 2 cấp đều phê duyệt, bản ghi chuyển sang trạng thái "đã duyệt" và thông báo cho Chuyên viên tạo/cập nhật.

## Acceptance Criteria
- Trưởng phòng và Lãnh đạo Cục có thể truy cập danh sách nhà trạm đèn chờ phê duyệt.
- Mỗi cấp phê duyệt phải nhập lý do (tùy chọn, nhưng bắt buộc nếu từ chối).
- Quy trình phê duyệt tuân theo 2 cấp: Trưởng phòng → Lãnh đạo Cục.
- Nếu cấp 1 từ chối, bản ghi quay về trạng thái "chờ chỉnh sửa" và thông báo cho Chuyên viên.
- Sau khi cấp 2 phê duyệt, bản ghi chuyển sang "đã duyệt" và thông báo cho người tạo.

## In Scope
- Danh sách nhà trạm đèn chờ phê duyệt (cho từng cấp)
- Giao diện xem chi tiết bản ghi chờ duyệt (form read-only)
- Hành động "Phê duyệt" và "Từ chối" kèm lý do
- Chuyển trạng thái theo luồng 2 cấp (pending → approved_by_dept → approved)
- Thông báo cho người tạo về kết quả phê duyệt/từ chối

## Out of Scope
- Tạo mới nhà trạm đèn (thuộc F-086)
- Cập nhật nhà trạm đèn (thuộc F-087)
- Xóa nhà trạm đèn (thuộc F-088)
- Xem lịch sử thay đổi chi tiết (thuộc F-091)
- Cấu hình workflow phê duyệt động (fix 2 cấp)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem, Chờ duyệt (không phê duyệt) |
| Trưởng phòng | Phê duyệt cấp 1, Từ chối cấp 1, Xem chi tiết |
| Lãnh đạo Cục | Phê duyệt cấp 2, Từ chối cấp 2, Xem chi tiết |
| Admin hệ thống | Xem, Xem tất cả trạng thái |

## Architecture Notes
- State machine: `PENDING_APPROVAL` → `APPROVED_BY_DEPT` (cấp 1) → `APPROVED` (cấp 2). Từ chối quay về `NEEDS_REVISION`.
- API: POST `/api/v1/beacons/{id}/approve` và POST `/api/v1/beacons/{id}/reject` với body chứa `reason`.
- Notification: Hệ thống gửi thông báo nội bộ (in-app notification) và email (nếu cấu hình) khi trạng thái thay đổi.
- Audit trail: Ghi lại từng hành động phê duyệt/từ chối vào bảng `approval_audit_log`.

## Entities
- **BeaconStation**: id, approvalLevel, currentApprover, approvalStatus, approvedByLevel1, approvedByLevel2, approvedAt
- **ApprovalAuditLog**: id, beaconStationId, approverId, action (approve/reject), reason, level, timestamp

## Business Rules
1. Quy trình phê duyệt bắt buộc gồm 2 cấp: Trưởng phòng (cấp 1) và Lãnh đạo Cục (cấp 2).
2. Cấp 2 chỉ có thể phê duyệt khi cấp 1 đã phê duyệt trước đó.
3. Nếu cấp nào từ chối, bản ghi quay về trạng thái "chờ chỉnh sửa" và không thể tiếp tục phê duyệt cho đến khi Chuyên viên sửa và gửi lại.
4. Lý do từ chối là bắt buộc; lý do phê duyệt là tùy chọn.
5. Thời gian phê duyệt từng cấp được ghi nhận trong audit log để tính SLA.

## Testing Strategy
- Unit test: Kiểm tra state machine chuyển trạng thái đúng theo luồng approve/reject ở từng cấp.
- Integration test: Gọi API approve ở cấp 1 → trạng thái chuyển thành approved_by_dept; gọi lại approve ở cấp 2 → thành approved. Gọi reject → quay về needs_revision.
- E2E test: Tạo nhà trạm đèn → phê duyệt cấp 1 (Trưởng phòng) → phê duyệt cấp 2 (Lãnh đạo Cục) → xác nhận trạng thái "đã duyệt" và thông báo đến Chuyên viên. Test trường hợp từ chối ở từng cấp.
