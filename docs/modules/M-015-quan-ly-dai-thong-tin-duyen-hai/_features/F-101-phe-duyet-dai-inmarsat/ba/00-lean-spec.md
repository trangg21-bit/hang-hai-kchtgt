---
feature-id: F-101
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Đài Inmarsat (CoastalStationInmarsat)

## Summary

Tính năng phê duyệt 2 cấp C1→C2 cho Đài Inmarsat. **ĐÃ XÁC MINH:** `CoastalStationInmarsatService` submit/approveLevel1/approveLevel2/reject → `InfrastructureApprovalService.submit/approveC1/approveC2` với `InfrastructureType.INMARSAT_STATION`; endpoint `POST /api/v1/stations/inmarsat/{id}/submit|approve-l1|approve-l2|reject`. **DRIFT #3:** tên endpoint approve-l1/l2 (không phải approve-c1/c2). Service có `validateNotSelfApproval` (4-eyes cục bộ) + chặn trung tâm trong InfrastructureApprovalService. State machine 7 trạng thái như F-095. Quyền: `coastalstationinmarsat:approvec1/approvec2/reject` (+ approve legacy).

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-101-01 | Người nhập | Submit DRAFT | POST /{id}/submit | PENDING_APPROVAL |
| UC-101-02 | Cảng vụ/Chi cục | approve-l1 | POST /{id}/approve-l1 | APPROVED_LEVEL1 |
| UC-101-03 | Cảng vụ/Chi cục | reject | POST /{id}/reject (reason) | REJECTED_LEVEL1 |
| UC-101-04 | Cục | approve-l2 | POST /{id}/approve-l2 | APPROVED |
| UC-101-05 | Cục | reject | POST /{id}/reject (reason) | REJECTED_LEVEL2 |
| UC-101-06 | Người gửi cấp Cục | Submit trực tiếp | POST /{id}/submit | APPROVED_LEVEL1 (bỏ vòng 1) |

## Scope

| | Items |
|---|---|
| In scope | 4 endpoint duyệt + submit; 7 trạng thái; 4-eyes; reject ≥10 ký tự; phân cấp theo đơn vị; history APPROVE_L1/L2/REJECT; quyền. |
| Out of scope | CRUD (F-098..100); lịch sử (F-103). |

## Field Coverage Matrix

TAB5 "Xử lý & theo dõi" (sheet "Đài Inmarsat" ~line 1622): Trạng thái (T T T), Ngày cập nhật (T T T), Cán bộ cập nhật (T F T), Ngày gửi phê duyệt (T F T), Cán bộ gửi phê duyệt (T F T), Ngày phê duyệt cấp Cảng vụ/Chi cục (T F T), Cán bộ phê duyệt cấp Cảng vụ/Chi cục (T F T), Nội dung phê duyệt (F F T), Ngày phê duyệt cấp Cục (T F T), Cán bộ phê duyệt cấp Cục (T F T), Nội dung phê duyệt (F F T) — read-only.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-101-01 | Submit chỉ từ DRAFT/REJECTED_* → PENDING_APPROVAL | AC-101-01 | |
| BR-101-02 | approve-l1 từ PENDING_APPROVAL → APPROVED_LEVEL1 | AC-101-02 | |
| BR-101-03 | approve-l2 từ APPROVED_LEVEL1 → APPROVED | AC-101-03 | |
| BR-101-04 | 4-eyes: người duyệt ≠ người tạo; C2 ≠ C1 ≠ người tạo (validateNotSelfApproval + trung tâm) | AC-101-04 | |
| BR-101-05 | Reject ≥10 ký tự | AC-101-05 | |
| BR-101-06 | Người gửi cấp Cục → thẳng APPROVED_LEVEL1 | AC-101-06 | |
| BR-101-07 | Quyền approvec1/approvec2/reject (fallback specialstation:approve, data:approve, admin:all) | AC-101-07 | |
| BR-101-08 | History APPROVE_L1/APPROVE_L2/REJECT | AC-101-08 | |

## Domain Model / Approval flow / Validation Rules / Acceptance Criteria / Pipeline Triage

Giống F-095 với resource `coastalstationinmarsat` + `InfrastructureType.INMARSAT_STATION` + endpoint /api/v1/stations/inmarsat. Drift #3 (approve-l1/l2) ghi nhận.
