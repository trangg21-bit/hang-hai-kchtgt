---
feature-id: F-113
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Đài LRIT (CoastalStationLRIT)

## Summary

Tính năng phê duyệt 2 cấp C1→C2 cho Đài LRIT. **ĐÃ XÁC MINH:** `CoastalStationLRITService` submit/approveLevel1/approveLevel2/reject → `InfrastructureApprovalService.submit/approveC1/approveC2` với `InfrastructureType.LRIT_STATION`; endpoint `POST /api/v1/stations/lrit/{id}/submit|approve-c1|approve-c2|reject` — **tên endpoint ĐÚNG chuẩn approve-c1/c2** (không drift #3). Service có `validateNotSelfApproval` + `countsByStatus` cho tab đếm trạng thái. State machine 7 trạng thái như F-095. Quyền `coastalstationlrit:approvec1/approvec2/approve`.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-113-01 | Người nhập | Submit DRAFT | POST /{id}/submit | PENDING_APPROVAL |
| UC-113-02 | Cảng vụ/Chi cục | approve-c1 | POST /{id}/approve-c1 | APPROVED_LEVEL1 |
| UC-113-03 | Cảng vụ/Chi cục | reject | POST /{id}/reject (reason) | REJECTED_LEVEL1 |
| UC-113-04 | Cục | approve-c2 | POST /{id}/approve-c2 | APPROVED |
| UC-113-05 | Cục | reject | POST /{id}/reject (reason) | REJECTED_LEVEL2 |
| UC-113-06 | Người gửi cấp Cục | Submit trực tiếp | POST /{id}/submit | APPROVED_LEVEL1 |

## Scope

| | Items |
|---|---|
| In scope | 4 endpoint duyệt + submit; 7 trạng thái; 4-eyes; reject ≥10 ký tự; phân cấp; history; quyền; tab đếm (counts). |
| Out of scope | CRUD (F-110..112); lịch sử (F-115). |

## Field Coverage Matrix

TAB5 "Xử lý & theo dõi" (sheet "Đài LRIT" ~line 1674) — giống F-095 (Trạng thái T T T; Ngày cập nhật T T T; Cán bộ cập nhật T F T; Ngày gửi phê duyệt T F T; Cán bộ gửi phê duyệt T F T; Ngày phê duyệt Cảng vụ/Chi cục T F T; Cán bộ phê duyệt Cảng vụ/Chi cục T F T; Nội dung phê duyệt F F T; Ngày phê duyệt Cục T F T; Cán bộ phê duyệt Cục T F T; Nội dung phê duyệt F F T) — read-only.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-113-01 | Submit chỉ từ DRAFT/REJECTED_* → PENDING_APPROVAL | AC-113-01 | |
| BR-113-02 | approve-c1 từ PENDING_APPROVAL → APPROVED_LEVEL1 | AC-113-02 | |
| BR-113-03 | approve-c2 từ APPROVED_LEVEL1 → APPROVED | AC-113-03 | |
| BR-113-04 | 4-eyes: validateNotSelfApproval cục bộ + trung tâm (C2 ≠ C1 ≠ người tạo) | AC-113-04 | |
| BR-113-05 | Reject ≥10 ký tự | AC-113-05 | |
| BR-113-06 | Người gửi cấp Cục → thẳng APPROVED_LEVEL1 | AC-113-06 | |
| BR-113-07 | Quyền approvec1/approvec2/approve (fallback specialstation:approve, data:approve, admin:all) | AC-113-07 | |
| BR-113-08 | History APPROVE_L1/APPROVE_L2/REJECT | AC-113-08 | |
| BR-113-09 | GET /counts trả draft/pending/approvedL1/approved/rejected; Tất cả = tổng | AC-113-09 | countsByStatus |

## Domain Model / Approval flow / Validation Rules / Acceptance Criteria / Pipeline Triage

Giống F-095 với resource `coastalstationlrit` + `InfrastructureType.LRIT_STATION`. Endpoint approve-c1/c2 đã chuẩn. AC tương đương AC-095-01..09 + counts.
