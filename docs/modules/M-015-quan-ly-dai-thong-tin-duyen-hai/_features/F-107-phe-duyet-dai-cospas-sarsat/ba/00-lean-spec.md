---
feature-id: F-107
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Đài Cospas-Sarsat (CoastalStationCospasSarsat)

## Summary

Tính năng phê duyệt 2 cấp C1→C2 cho Đài Cospas-Sarsat. **ĐÃ XÁC MINH:** `CoastalStationCospasSarsatService` submit/approveLevel1/approveLevel2/reject → `InfrastructureApprovalService.submit/approveC1/approveC2` với `InfrastructureType.COSPAS_SARSAT_STATION`; endpoint `POST /api/v1/stations/cospas-sarsat/{id}/submit|approve-l1|approve-l2|reject`. **DRIFT #3:** tên endpoint approve-l1/l2. Service KHÔNG có validateNotSelfApproval cục bộ nhưng trung tâm `InfrastructureApprovalService` vẫn chặn tự duyệt (4-eyes). Quyền: `coastalstationcospassarsat:approvec1/approvec2/reject` (+ approve legacy). State machine 7 trạng thái như F-095.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-107-01 | Người nhập | Submit DRAFT | POST /{id}/submit | PENDING_APPROVAL |
| UC-107-02 | Cảng vụ/Chi cục | approve-l1 | POST /{id}/approve-l1 | APPROVED_LEVEL1 |
| UC-107-03 | Cảng vụ/Chi cục | reject | POST /{id}/reject (reason) | REJECTED_LEVEL1 |
| UC-107-04 | Cục | approve-l2 | POST /{id}/approve-l2 | APPROVED |
| UC-107-05 | Cục | reject | POST /{id}/reject (reason) | REJECTED_LEVEL2 |
| UC-107-06 | Người gửi cấp Cục | Submit trực tiếp | POST /{id}/submit | APPROVED_LEVEL1 |

## Scope

| | Items |
|---|---|
| In scope | 4 endpoint duyệt + submit; 7 trạng thái; 4-eyes; reject ≥10 ký tự; phân cấp; history; quyền. |
| Out of scope | CRUD (F-104..106); lịch sử (F-109). |

## Field Coverage Matrix

TAB5 "Xử lý & theo dõi" (sheet "Đài Cospas-Sarsat" ~line 1725) — giống F-095: Trạng thái (T T T), Ngày cập nhật (T T T), Cán bộ cập nhật (T F T), Ngày gửi phê duyệt (T F T), Cán bộ gửi phê duyệt (T F T), Ngày phê duyệt Cảng vụ/Chi cục (T F T), Cán bộ phê duyệt Cảng vụ/Chi cục (T F T), Nội dung phê duyệt (F F T), Ngày phê duyệt Cục (T F T), Cán bộ phê duyệt Cục (T F T), Nội dung phê duyệt (F F T) — read-only.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-107-01 | Submit chỉ từ DRAFT/REJECTED_* → PENDING_APPROVAL | AC-107-01 | |
| BR-107-02 | approve-l1 từ PENDING_APPROVAL → APPROVED_LEVEL1 | AC-107-02 | |
| BR-107-03 | approve-l2 từ APPROVED_LEVEL1 → APPROVED | AC-107-03 | |
| BR-107-04 | 4-eyes: duyệt viên ≠ người tạo; C2 ≠ C1 ≠ người tạo (trung tâm) | AC-107-04 | |
| BR-107-05 | Reject ≥10 ký tự | AC-107-05 | |
| BR-107-06 | Người gửi cấp Cục → thẳng APPROVED_LEVEL1 | AC-107-06 | |
| BR-107-07 | Quyền approvec1/approvec2/reject | AC-107-07 | Có @PreAuthorize |
| BR-107-08 | History APPROVE_L1/APPROVE_L2/REJECT | AC-107-08 | |

## Domain Model / Approval flow / Validation Rules / Acceptance Criteria / Pipeline Triage

Giống F-095 với resource `coastalstationcospassarsat` + `InfrastructureType.COSPAS_SARSAT_STATION`. Drift #3 (approve-l1/l2) ghi nhận; AC tương đương AC-095-01..09.
