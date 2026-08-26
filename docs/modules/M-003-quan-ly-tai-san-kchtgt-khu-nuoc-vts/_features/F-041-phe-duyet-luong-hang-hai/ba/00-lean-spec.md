---
feature-id: F-041
document: lean-spec
output-mode: lean
last-updated: 2026-08-26
---
# Phê duyệt Luồng hàng hải

## Summary

Hệ thống cung cấp quy trình phê duyệt 2 cấp cho hồ sơ Luồng hàng hải: gửi phê duyệt (submit), phê duyệt/trả về cấp Cảng vụ/Chi cục (C1, quyền `navigationchannel:approvec1`), phê duyệt/trả về cấp Cục (C2, quyền `navigationchannel:approvec2`). Người duyệt xác định từ Authentication (session), không nhận từ body. Quy trình tuân thủ 4-eyes principle (người tạo không tự duyệt; C2 ≠ C1) và Rule 14 (người gửi cấp Cục → vào thẳng `APPROVED_LEVEL1`). Trả về bắt buộc có lý do; mỗi bước ghi history vào `approval_history` (chi tiết F-043). Trạng thái lưu dạng số theo enum `ApprovalStatus`.

## Scope

| | Items |
|---|---|
| In scope | Submit (`POST /{id}/submit-approval`); approve/reject C1 (`/approve/c1`, `/reject-level-1`); approve/reject C2 (`/approve/c2`, `/reject-level-2`); state machine 2 cấp; Rule 14; 4-eyes; lý do bắt buộc khi trả về; ghi #50-#57 từ workflow/session; ghi history; phân quyền `navigationchannel:approvec1`/`approvec2`/`update`. |
| Out of scope | Sửa code approval service (dùng chung `InfrastructureApprovalService`); thay đổi enum `ApprovalStatus`; thông báo email/SMS; màn chi tiết (F-042); lịch sử (F-043). |
| Assumptions | Cơ chế `InfrastructureApprovalService` dùng chung đã implement và đúng với M-1006; hồ sơ đã có từ F-038/F-039; user đã đăng nhập. |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1 | Quyết định | `status` | Select | Có | `@NotBlank` "Trạng thái không được để trống"; `APPROVED`/`APPROVE` = duyệt, `REJECTED`/`REJECT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` = trả về. |
| 2 | Lý do / nội dung | `reason` | TextArea | Có khi trả về | "Lý do từ chối là bắt buộc"; lưu vào `rejectionReason` + `level1/2ApprovalContent`. |
| 3 | Cấp phê duyệt | `approvalLevel` | Enum | Không | Endpoint reject-level-1/2 quyết định cấp cố định; payload không quyết định. |
| 4 | Người duyệt | `userId` | — | — | Không có trong DTO; lấy từ `Authentication` (NavigationChannelController.java:63-72). |
| 5 | Field hệ thống ghi (#50-#57) | `submittedAt`, `submittedBy`, `level1ApprovedAt`, `level1ApprovedBy`, `level1ApprovalContent`, `level2ApprovedAt`, `level2ApprovedBy`, `level2ApprovalContent`, `approverLevel1/2`, `approvedDateLevel1/2`, `rejectionReason` | — | Hệ thống ghi | Read-only; ghi theo workflow, không nhận từ client. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-041-01 | Chuyên viên | Gửi hồ sơ đi phê duyệt | Thay đổi dữ liệu được kiểm soát 2 cấp | Must Have |
| US-041-02 | Lãnh đạo Cảng vụ/Chi cục | Duyệt hoặc trả về cấp 1 (kèm lý do) | Kiểm soát nghiệp vụ trước khi gửi Cục | Must Have |
| US-041-03 | Lãnh đạo Cục/Admin Cục | Duyệt hoặc trả về cấp 2 | Quyết định cuối cùng + truy vết trách nhiệm | Must Have |
| US-041-04 | Người thao tác | Hệ thống chặn tự duyệt và trùng C1/C2 | Đảm bảo nguyên tắc 4 mắt | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-041-01 | US-041-01 | Submit từ Cảng vụ/Chi cục | Given hồ sơ `DRAFT`, user cấp Cảng vụ/Chi cục, có `navigationchannel:update`; When gọi submit-approval; Then hồ sơ → `PENDING_APPROVAL`, ghi #50-#51, history `PROPOSED` | DB: `approval_status`=2. |
| AC-041-02 | US-041-01 | Submit từ cấp Cục (Rule 14) | Given hồ sơ `DRAFT`, user cấp Cục; When gọi submit-approval; Then hồ sơ → `APPROVED_LEVEL1` | DB: `approval_status`=3. |
| AC-041-03 | US-041-02 | Duyệt C1 | Given hồ sơ `PENDING_APPROVAL`, user có `navigationchannel:approvec1`, không phải người tạo; When approve/c1 `status=APPROVED`; Then → `APPROVED_LEVEL1`, ghi #52-#54, history `APPROVED` level 1 | 4-eyes. |
| AC-041-04 | US-041-02 | Trả về C1 thiếu lý do | Given hồ sơ `PENDING_APPROVAL`; When reject-level-1 không có `reason`; Then từ chối "Lý do từ chối là bắt buộc", trạng thái không đổi | — |
| AC-041-05 | US-041-04 | Chống tự duyệt | Given người gọi là người tạo hồ sơ; When approve/c1; Then từ chối "Bạn không thể phê duyệt bản do chính mình gửi (4-eyes principle)" | — |
| AC-041-06 | US-041-02 | Trả về C1 có lý do | Given hồ sơ `PENDING_APPROVAL`; When reject-level-1 có `reason`; Then → `REJECTED_LEVEL1`, ghi #54, history `REJECTED` level 1 | DB: `approval_status`=8. |
| AC-041-07 | US-041-04 | C2 ≠ C1 | Given hồ sơ `APPROVED_LEVEL1`, người duyệt C2 trùng C1; When approve/c2; Then từ chối "Người phê duyệt C2 không được trùng với người phê duyệt C1 (4-eyes principle)" | — |
| AC-041-08 | US-041-03 | Duyệt C2 | Given hồ sơ `APPROVED_LEVEL1`, user có `navigationchannel:approvec2`, thỏa 4-eyes; When approve/c2 `status=APPROVED`; Then → `APPROVED`, ghi #55-#57, history `APPROVED` level 2 | DB: `approval_status`=5. |
| AC-041-09 | US-041-03 | Trả về C2 | Given hồ sơ `APPROVED_LEVEL1`; When reject-level-2 có `reason`; Then → `REJECTED_LEVEL2`, history `REJECTED` level 2 | DB: `approval_status`=9. |
| AC-041-10 | US-041-01 | Gửi lại sau trả về | Given hồ sơ `REJECTED_LEVEL1`/`REJECTED_LEVEL2`; When submit lại; Then gửi được, #50-#51 refresh, reset approver | — |
| AC-041-11 | US-041-02/03 | Phân quyền | Given user thiếu `navigationchannel:approvec1`/`approvec2`; When gọi endpoint tương ứng; Then HTTP 403 | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-041-01 | Submit chỉ từ DRAFT/PROPOSED/REJECTED_LEVEL1/REJECTED_LEVEL2/REJECTED | AC-041-01/02/10 | Không. |
| BR-041-02 | Rule 14: submit cấp Cục → thẳng `APPROVED_LEVEL1` | AC-041-02 | Không. |
| BR-041-03 | Duyệt C1 chỉ từ `PENDING_APPROVAL` (hoặc `PROPOSED`) | AC-041-03/06 | Không. |
| BR-041-04 | Duyệt C2 chỉ từ `APPROVED_LEVEL1` | AC-041-08/09 | Không. |
| BR-041-05 | 4-eyes: người tạo không tự duyệt; C2 ≠ C1 | AC-041-05/07 | ROLE_SYSTEM_ADMIN vượt qua kiểm tra quyền nhưng vẫn bị chặn bởi 4-eyes theo code (check theo userId). |
| BR-041-06 | Người duyệt từ `Authentication`, không nhận từ body | AC-041-03/08 | Không. |
| BR-041-07 | Trả về bắt buộc có lý do; lưu trim vào `rejectionReason` + `level1/2ApprovalContent` | AC-041-04/06/09 | Không. |
| BR-041-08 | Mỗi bước ghi history `PROPOSED`/`APPROVED`/`REJECTED` kèm `approvalLevel` | AC-041-01/03/06/08/09 | Không. |
| BR-041-09 | `level1/2ApprovalContent` ghi cả nhánh duyệt (nội dung) và trả về (lý do trim) | AC-041-03/06/08/09 | Không. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Security | RBAC theo cấp (`approvec1`/`approvec2`) + data scope đọc + 4-eyes | HTTP 403/400 khi vi phạm; không có hành động phê duyệt sai cấp. |
| Auditability | Người duyệt từ session; #50-#57 ghi theo workflow | Truy vết đầy đủ người/thời điểm/nội dung từng cấp. |
| Data integrity | Ghi trạng thái + field phê duyệt + history trong transaction | Không nửa bước phê duyệt. |
| UX | Message tiếng Việt có dấu; dialog trả về bắt buộc lý do | Không hardcode màu/spacing/font. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-041-01 | AC-041-01/02 | Approval: submit từ cấp Cảng vụ/Chi cục → `PENDING_APPROVAL`; cấp Cục → `APPROVED_LEVEL1` (Rule 14) | Integration |
| TS-041-02 | AC-041-03 | Approval: duyệt C1 → `APPROVED_LEVEL1` + #52-#54 + history | Integration |
| TS-041-03 | AC-041-04 | Negative: reject C1 thiếu lý do → bị chặn | Integration |
| TS-041-04 | AC-041-05 | Negative: người tạo tự duyệt → bị chặn 4-eyes | Integration |
| TS-041-05 | AC-041-06 | Negative: reject C1 có lý do → `REJECTED_LEVEL1` + history | Integration |
| TS-041-06 | AC-041-07 | Negative: C2 trùng C1 → bị chặn 4-eyes | Integration |
| TS-041-07 | AC-041-08 | Approval: duyệt C2 → `APPROVED` + #55-#57 + history | Integration |
| TS-041-08 | AC-041-10 | Boundary: gửi lại sau reject → submit thành công, timestamp refresh | Integration |
| TS-041-09 | AC-041-11 | Security: thiếu `approvec1`/`approvec2` → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Dùng `InfrastructureApprovalService` + `ApprovalStatus`/`ApprovalHistory` hiện có; không thêm field mới. |
| Architecture affected? | No | 5 endpoint approve/reject/submit đã tồn tại (NavigationChannelController.java:71-113); permission đã seed. |
| Implementation clear? | Yes | State machine, 4-eyes, Rule 14, lý do bắt buộc, nguồn người duyệt từ session — tất cả observable và đã implement. |
| Documentation risk | Low | Không có điểm lệch hành vi so với code; lưu ý nhỏ: sự kiện history dùng `APPROVED`/`REJECTED` + `approvalLevel` thay vì code `APPROVE_C1`… (chi tiết F-043). |
| **Verdict** | `Ready for Solution Designer review` | BA spec khớp code hiện tại với anchor từng bước; không có blocker. |
