---
id: F-089
name: "Phê duyệt Nhà trạm đèn"
slug: phe-duyet-nha-tram-den
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-07-07T03:32:49Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Nhà trạm đèn

## Description

Quản lý quy trình phê duyệt 2 cấp (L1 và L2) cho nhà trạm đèn, từ trạng thái nháp (DRAFT) đến khi được công bố chính thức (PUBLISHED). Quy trình bao gồm các bước: gửi phê duyệt (submitForApproval) chuyển từ DRAFT sang PENDING_APPROVAL, phê duyệt cấp 1 (approveL1) chuyển sang APPROVED_L1, phê duyệt cấp 2 (approveL2) chuyển sang APPROVED_L2 rồi PUBLISHED, và từ chối (reject) từ bất kỳ bước phê duyệt nào đưa về REJECTED kèm lý do. Mỗi bước đều ghi nhật ký lịch sử chi tiết với actionType tương ứng. Khi đạt đến PUBLISHED, nhà trạm đèn được coi là đã công bố chính thức và không thể chỉnh sửa hoặc xóa.

## Business Intent

Thiết lập quy trình kiểm soát chất lượng dữ liệu nhà trạm đèn qua hai cấp phê duyệt, đảm bảo thông tin tài sản báo hiệu hàng hải (đèn biển, hải đăng, cọc tiêu) được thẩm định kỹ trước khi công bố. Phân chia trách nhiệm rõ ràng giữa cán bộ nghiệp vụ, phê duyệt viên cấp 1 và cấp 2.

## Flow Summary

Khi nhà trạm đèn ở trạng thái DRAFT, operator gửi phê duyệt qua endpoint POST /{id}/submit-approval, hệ thống chuyển trạng thái sang PENDING_APPROVAL. Approver L1 xem xét và phê duyệt qua POST /{id}/approve-l1 (kèm approverId), trạng thái chuyển APPROVED_L1. Approver L2 phê duyệt qua POST /{id}/approve-l2, trạng thái chuyển APPROVED_L2 rồi PUBLISHED. Nếu từ chối tại bất kỳ bước nào, gọi POST /{id}/reject với rejectReason và approverId, trạng thái chuyển REJECTED. Yêu cầu: submitForApproval cần DRAFT, approveL1 cần PENDING_APPROVAL, approveL2 cần APPROVED_L1, reject yêu cầu lý do từ chối. Mỗi bước đều ghi nhật ký lịch sử tương ứng: APPROVE_L1, APPROVE_L2, REJECT.

## Acceptance Criteria

- AC-01: Gửi submit-approval cho nhà trạm đèn ở trạng thái DRAFT, hệ thống chuyển sang PENDING_APPROVAL.
- AC-02: Gửi approve-l1 cho nhà trạm đèn ở PENDING_APPROVAL, hệ thống chuyển sang APPROVED_L1, ghi lịch sử actionType=APPROVE_L1.
- AC-03: Gửi approve-l2 cho nhà trạm đèn ở APPROVED_L1, hệ thống chuyển sang PUBLISHED, ghi lịch sử actionType=APPROVE_L2.
- AC-04: Gửi reject với lý do từ chối cho nhà trạm đèn ở PENDING_APPROVAL, hệ thống chuyển sang REJECTED, ghi lịch sử actionType=REJECT.
- AC-05: Gửi approve-l2 cho nhà trạm đèn ở DRAFT (chưa qua L1), hệ thống trả về lỗi HTTP 400.

## In Scope

- Gửi phê duyệt (DRAFT → PENDING_APPROVAL)
- Phê duyệt cấp 1 (PENDING_APPROVAL → APPROVED_L1)
- Phê duyệt cấp 2 (APPROVED_L1 → PUBLISHED)
- Từ chối kèm lý do
- Ghi lịch sử cho mỗi hành động phê duyệt

## Out of Scope

- CRUD nhà trạm đèn (F-086, F-087, F-088)
- Thông báo khi trạng thái thay đổi
- Tích hợp GIS (M-007)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | Full approval | Tất cả hành động phê duyệt |
| operator | Submit for approval | Chỉ gửi phê duyệt |
| approver_L1 | Approve L1 + Reject | Phê duyệt cấp 1 |
| approver_L2 | Approve L2 + Reject | Phê duyệt cấp 2 |
| viewer | Read | Không có quyền phê duyệt |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramDen (nha_tram_den) | Table | Cập nhật status, approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason |
| BaseNhaTram | Superclass | Các trường phê duyệt |
| NhaTramStatus | Enum | DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, DELETED |
| NhaTramApprovalStatus | Enum | PENDING, APPROVED, REJECTED |
| NhaTramHistory (nha_tram_history) | Table | Ghi nhật ký actionType |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-010 | Phê duyệt L1 yêu cầu PENDING_APPROVAL | NhaTramDen.status | Service implementation |
| BR-011 | Phê duyệt L2 yêu cầu APPROVED_L1 | NhaTramDen.status | Service implementation |
| BR-012 | Từ chối yêu cầu lý do từ chối (rejectionReason) | NhaTramDen.rejectionReason | @RequestParam String rejectReason |
| BR-015 | Không thể phê duyệt/từ chối nếu đã PUBLISHED hoặc DELETED | NhaTramDen.status | Service validation logic |

## Testing Strategy

(populated by qa stage)
