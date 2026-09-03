---
feature-id: F-095
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Đài TTDH (CoastalStationVTS)

## Summary

Tính năng phê duyệt 2 cấp C1→C2 cho Đài TTDH. **ĐÃ XÁC MINH:** `CoastalStationVTSService` submit/approveLevel1/approveLevel2/reject gọi `InfrastructureApprovalService.submit/approveC1/approveC2` với `InfrastructureType.COASTAL_RADIO_STATION`; endpoint `POST /api/v1/stations/coastal/{id}/submit|approve-l1|approve-l2|reject`. **DRIFT #3 (endpoint naming):** VTS dùng `approve-l1`/`approve-l2` trong khi LRIT/Haiphong dùng `approve-c1`/`approve-c2` — cùng service approveC1/approveC2, chỉ lệch tên URL. State machine theo `approval-2-level-spec.md` §3.1-3.4: 7 trạng thái (`DRAFT`=0, `PENDING_APPROVAL`=2, `APPROVED_LEVEL1`=3, `REJECTED_LEVEL1`=8, `REJECTED_LEVEL2`=9, `APPROVED`=5, `ARCHIVED`=7); 4-eyes chống tự duyệt; reject bắt buộc lý do ≥10 ký tự; submit từ cấp Cục → thẳng APPROVED_LEVEL1 (bỏ vòng 1). Phân cấp theo `OrgUnit.level`. History `APPROVE_L1`/`APPROVE_L2`/`REJECT`.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-095-01 | Người nhập | Gửi duyệt hồ sơ DRAFT | `POST /{id}/submit` | `PENDING_APPROVAL` + `submittedAt/submittedBy`; history SUBMIT (CREATE/UPDATE trail) |
| UC-095-02 | Cảng vụ/Chi cục | Duyệt vòng 1 | `POST /{id}/approve-l1` | `APPROVED_LEVEL1` + `approverLevel1/approvedDateLevel1`; history APPROVE_L1 |
| UC-095-03 | Cảng vụ/Chi cục | Từ chối vòng 1 | `POST /{id}/reject` (reason) | `REJECTED_LEVEL1` + `rejectionReason`; history REJECT |
| UC-095-04 | Cục | Duyệt vòng 2 | `POST /{id}/approve-l2` | `APPROVED` + `approverLevel2/approvedDateLevel2/approvedBy`; history APPROVE_L2 |
| UC-095-05 | Cục | Từ chối vòng 2 | `POST /{id}/reject` (reason) | `REJECTED_LEVEL2`; history REJECT |
| UC-095-06 | Người gửi cấp Cục | Submit trực tiếp | `POST /{id}/submit` | Thẳng `APPROVED_LEVEL1` (bỏ vòng 1) |

## Scope

| | Items |
|---|---|
| In scope | 4 endpoint duyệt + submit; state machine 7 trạng thái; 4-eyes; reject ≥10 ký tự; phân cấp theo đơn vị gửi; ghi history; quyền `coastalstation:approvec1/approvec2/reject`; tab/timeline phê duyệt UI. |
| Out of scope | CRUD (F-092..094); lịch sử đầy đủ (F-097); thay đổi code. |

## Field Coverage Matrix

Phê duyệt dùng TAB5 "Xử lý & theo dõi" (read-only) + trường phê duyệt trên entity: `submittedAt/submittedBy`, `approverLevel1/approvedDateLevel1`, `approverLevel2/approvedDateLevel2`, `approvedBy/approvedDate`, `rejectionReason`, `approvalStatus` (Badge). Ma trận Excel TAB5 (Đài TTDH ~line 1510): Trạng thái (DS T, Lọc T, CT T), Ngày cập nhật (T T T), Cán bộ cập nhật (T F T), Ngày gửi phê duyệt (T F T), Cán bộ gửi phê duyệt (T F T), Ngày phê duyệt cấp Cảng vụ/Chi cục (T F T), Cán bộ phê duyệt cấp Cảng vụ/Chi cục (T F T), Nội dung phê duyệt (F F T), Ngày phê duyệt cấp Cục (T F T), Cán bộ phê duyệt cấp Cục (T F T), Nội dung phê duyệt (F F T). Các trường này chỉ đọc, không nhập.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-095-01 | Submit chỉ từ DRAFT/REJECTED_* → PENDING_APPROVAL (không nhảy vòng) | AC-095-01 | `approvalService.submit` |
| BR-095-02 | approve-l1 chỉ từ PENDING_APPROVAL → APPROVED_LEVEL1 | AC-095-02 | |
| BR-095-03 | approve-l2 chỉ từ APPROVED_LEVEL1 → APPROVED | AC-095-03 | |
| BR-095-04 | 4-eyes: người duyệt ≠ người tạo (`approveC1`); C2 ≠ C1 ≠ người tạo | AC-095-04 | "Bạn không thể tự phê duyệt bản ghi do chính mình tạo" |
| BR-095-05 | Reject bắt buộc `rejectionReason` ≥ 10 ký tự | AC-095-05 | |
| BR-095-06 | Người gửi cấp Cục (`OrgUnit.level`) → submit thẳng APPROVED_LEVEL1 | AC-095-06 | Bỏ vòng 1 |
| BR-095-07 | Quyền: `coastalstation:approvec1` / `approvec2` / `reject` (fallback station:*, data:*, admin:all) | AC-095-07 | |
| BR-095-08 | Mỗi bước ghi history APPROVE_L1/APPROVE_L2/REJECT kèm người + thời điểm | AC-095-08 | |
| BR-095-09 | Badge/tab trạng thái dùng `ApprovalStatusBadge`/`normalizeApprovalStatus` (7 trạng thái chuẩn) | AC-095-09 | Không lòi mã legacy |

## Domain Model

`CoastalStationVTS`: `approvalStatus` (ApprovalStatus ORDINAL smallint), `status` (StationStatus ORDINAL), `approvalLevel` (ApprovalLevel), `submittedAt/submittedBy`, `approverLevel1/approvedDateLevel1`, `approverLevel2/approvedDateLevel2`, `approvedBy/approvedDate`, `rejectionReason`. History qua bảng chung với `StationHistoryActionType`.

## Approval flow (2 cấp C1→C2)

| Từ | Hành động | Sang | Ai |
|---|---|---|---|
| DRAFT (0) | submit | PENDING_APPROVAL (2) | Người nhập |
| PENDING_APPROVAL (2) | approve-l1 | APPROVED_LEVEL1 (3) | Cảng vụ/Chi cục |
| PENDING_APPROVAL (2) | reject | REJECTED_LEVEL1 (8) | Cảng vụ/Chi cục |
| APPROVED_LEVEL1 (3) | approve-l2 | APPROVED (5) | Cục |
| APPROVED_LEVEL1 (3) | reject | REJECTED_LEVEL2 (9) | Cục |
| REJECTED_* (8/9) | sửa + gửi lại | PENDING_APPROVAL (2) | Người nhập |

## Validation Rules

- Trạng thái nguồn bắt buộc đúng (BR-095-01..03) — vi phạm → IllegalStateException (400/409).
- `rejectionReason` trim, ≥10 ký tự.
- Chống tự duyệt (BR-095-04) → IllegalStateException.
- Approver lấy từ session (`SecurityUtils`); thiếu quyền → 403.

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-095-01 | Given DRAFT, When POST /submit, Then approvalStatus=PENDING_APPROVAL + submittedAt/By set |
| AC-095-02 | Given PENDING_APPROVAL, When POST /approve-l1, Then APPROVED_LEVEL1 + approverLevel1/approvedDateLevel1 |
| AC-095-03 | Given APPROVED_LEVEL1, When POST /approve-l2, Then APPROVED + approverLevel2/approvedDateLevel2 |
| AC-095-04 | Given user = người tạo, When POST /approve-l1, Then chặn tự duyệt (4-eyes) |
| AC-095-05 | Given reject thiếu lý do hoặc <10 ký tự, When POST /reject, Then 400 |
| AC-095-06 | Given người gửi thuộc cấp Cục, When submit, Then APPROVED_LEVEL1 (bỏ vòng 1) |
| AC-095-07 | Given user không có quyền duyệt, When approve, Then 403 |
| AC-095-08 | History có APPROVE_L1/APPROVE_L2/REJECT tương ứng (GET /{id}/history) |
| AC-095-09 | Badge hiển thị nhãn tiếng Việt chuẩn (VD "Chờ Cảng vụ duyệt", "Đã duyệt") — không lòi mã enum |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Cột phê duyệt đầy đủ |
| Architecture affected? | Low | DRIFT #3 tên endpoint approve-l1/l2 vs approve-c1/c2 — chỉ rename/alias, SA chốt |
| Implementation clear? | Yes | InfrastructureApprovalService dùng chung |
| Documentation risk | Low | Khớp approval-2-level-spec |
| **Verdict** | `Ready for Solution Designer review` | State machine đầy đủ; ghi nhận drift tên endpoint |
