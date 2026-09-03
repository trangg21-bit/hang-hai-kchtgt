---
feature-id: F-119
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Đài TTXLTT Hà Nội (CoastalStationHaiphong)

## Summary

Tính năng phê duyệt 2 cấp C1→C2 cho Đài TTXLTT Hà Nội. **ĐÃ XÁC MINH:** `CoastalStationHaiphongService` submit/approveLevel1/approveLevel2/reject → `InfrastructureApprovalService.submit/approveC1/approveC2` với `InfrastructureType.HANOI_STATION`; endpoint `POST /api/v1/stations/haiphong/{id}/submit|approve-c1|approve-c2|reject` — **tên endpoint chuẩn approve-c1/c2**. Service có `validateNotSelfApproval` + `countsByStatus`. State machine 7 trạng thái như F-095. Quyền `coastalstationhaiphong:approvec1/approvec2/approve/reject`.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-119-01 | Người nhập | Submit DRAFT | POST /{id}/submit | PENDING_APPROVAL |
| UC-119-02 | Cảng vụ/Chi cục | approve-c1 | POST /{id}/approve-c1 | APPROVED_LEVEL1 |
| UC-119-03 | Cảng vụ/Chi cục | reject | POST /{id}/reject (reason) | REJECTED_LEVEL1 |
| UC-119-04 | Cục | approve-c2 | POST /{id}/approve-c2 | APPROVED |
| UC-119-05 | Cục | reject | POST /{id}/reject (reason) | REJECTED_LEVEL2 |
| UC-119-06 | Người gửi cấp Cục | Submit trực tiếp | POST /{id}/submit | APPROVED_LEVEL1 |

## Scope

| | Items |
|---|---|
| In scope | 4 endpoint duyệt + submit; 7 trạng thái; 4-eyes; reject ≥10 ký tự; phân cấp; history; quyền; tab đếm. |
| Out of scope | CRUD (F-116..118); lịch sử (F-121). |

## Field Coverage Matrix

TAB5 "Xử lý & theo dõi" (sheet "Đài TTXLTT Hà Nội" ~line 1777) — giống F-095 (Trạng thái T T T; Ngày cập nhật T T T; Cán bộ cập nhật T F T; Ngày gửi phê duyệt T F T; Cán bộ gửi phê duyệt T F T; Ngày phê duyệt Cảng vụ/Chi cục T F T; Cán bộ phê duyệt Cảng vụ/Chi cục T F T; Nội dung phê duyệt F F T; Ngày phê duyệt Cục T F T; Cán bộ phê duyệt Cục T F T; Nội dung phê duyệt F F T) — read-only.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-119-01 | Submit chỉ từ DRAFT/REJECTED_* → PENDING_APPROVAL | AC-119-01 | |
| BR-119-02 | approve-c1 từ PENDING_APPROVAL → APPROVED_LEVEL1 | AC-119-02 | |
| BR-119-03 | approve-c2 từ APPROVED_LEVEL1 → APPROVED | AC-119-03 | |
| BR-119-04 | 4-eyes: validateNotSelfApproval + trung tâm (C2 ≠ C1 ≠ người tạo) | AC-119-04 | |
| BR-119-05 | Reject ≥10 ký tự | AC-119-05 | |
| BR-119-06 | Người gửi cấp Cục → thẳng APPROVED_LEVEL1 | AC-119-06 | |
| BR-119-07 | Quyền approvec1/approvec2/reject | AC-119-07 | |
| BR-119-08 | History APPROVE_L1/APPROVE_L2/REJECT | AC-119-08 | |
| BR-119-09 | GET /counts trả đủ 5 tab; Tất cả = tổng | AC-119-09 | |

## Domain Model / Approval flow / Validation Rules / Acceptance Criteria / Pipeline Triage

Giống F-095 với resource `coastalstationhaiphong` + `InfrastructureType.HANOI_STATION`. Endpoint approve-c1/c2 chuẩn. AC tương đương AC-095-01..09 + counts.
