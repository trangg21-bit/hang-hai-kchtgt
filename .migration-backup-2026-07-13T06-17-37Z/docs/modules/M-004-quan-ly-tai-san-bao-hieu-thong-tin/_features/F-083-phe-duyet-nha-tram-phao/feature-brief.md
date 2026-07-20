---
id: F-083
name: "Phê duyệt Nhà trạm phao"
slug: phe-duyet-nha-tram-phao
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:42Z"
last-updated: "2026-07-07T03:32:42Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Nhà trạm phao

## Description

Quản lý quy trình phê duyệt 2 cấp (L1 và L2) cho nhà trạm phao, từ trạng thái nháp (DRAFT) đến khi được công bố chính thức (PUBLISHED). Quy trình bao gồm các bước: gửi phê duyệt (submitForApproval) chuyển từ DRAFT sang PENDING_APPROVAL, phê duyệt cấp 1 (approveL1) chuyển sang APPROVED_L1, phê duyệt cấp 2 (approveL2) chuyển sang APPROVED_L2 rồi PUBLISHED, và từ chối (reject) từ bất kỳ bước phê duyệt nào đưa về REJECTED kèm lý do. Mỗi bước đều ghi nhật ký lịch sử chi tiết (actionType: APPROVE_L1, APPROVE_L2, REJECT). Khi đạt đến PUBLISHED, dữ liệu nhà trạm phao được coi là đã công bố chính thức và không thể chỉnh sửa hoặc xóa.

## Business Intent

Thiết lập quy trình kiểm soát chất lượng dữ liệu nhà trạm phao qua hai cấp phê duyệt, đảm bảo thông tin tài sản báo hiệu hàng hải được thẩm định kỹ trước khi công bố chính thức. Phân chia trách nhiệm rõ ràng giữa cán bộ nghiệp vụ (gửi phê duyệt), phê duyệt viên cấp 1, và phê duyệt viên cấp 2.

## Flow Summary

Khi nhà trạm phao ở trạng thái DRAFT, operator gửi phê duyệt qua endpoint POST /{id}/submit-approval, hệ thống chuyển trạng thái sang PENDING_APPROVAL. Approver L1 xem xét và phê duyệt qua POST /{id}/approve-l1 (kèm approverId), trạng thái chuyển APPROVED_L1. Approver L2 phê duyệt qua POST /{id}/approve-l2, trạng thái chuyển APPROVED_L2 rồi PUBLISHED. Nếu từ chối tại bất kỳ bước nào, gọi POST /{id}/reject với rejectReason và approverId, trạng thái chuyển REJECTED. Mỗi bước ghi nhật ký lịch sử tương ứng. Yêu cầu: submitForApproval yêu cầu trạng thái DRAFT, approveL1 yêu cầu PENDING_APPROVAL, approveL2 yêu cầu APPROVED_L1, reject yêu cầu lý do từ chối.

## Acceptance Criteria

- AC-01: Gửi submit-approval cho nhà trạm phao ở trạng thái DRAFT, hệ thống chuyển sang PENDING_APPROVAL, ghi lịch sử với actionType=UPDATE (field=status).
- AC-02: Gửi approve-l1 cho nhà trạm phao ở PENDING_APPROVAL, hệ thống chuyển sang APPROVED_L1, ghi lịch sử actionType=APPROVE_L1.
- AC-03: Gửi approve-l2 cho nhà trạm phao ở APPROVED_L1, hệ thống chuyển sang PUBLISHED, ghi lịch sử actionType=APPROVE_L2.
- AC-04: Gửi reject với lý do từ chối cho nhà trạm phao ở PENDING_APPROVAL, hệ thống chuyển sang REJECTED, ghi lịch sử actionType=REJECT.
- AC-05: Gửi reject mà không có rejectReason, hệ thống trả về lỗi HTTP 400.
- AC-06: Gửi approve-l2 cho nhà trạm phao ở DRAFT (chưa qua L1), hệ thống trả về lỗi HTTP 400.

## In Scope

- Gửi phê duyệt (DRAFT → PENDING_APPROVAL)
- Phê duyệt cấp 1 (PENDING_APPROVAL → APPROVED_L1)
- Phê duyệt cấp 2 (APPROVED_L1 → PUBLISHED)
- Từ chối kèm lý do (PENDING_APPROVAL/APPROVED_L1 → REJECTED)
- Ghi lịch sử cho mỗi hành động phê duyệt

## Out of Scope

- CRUD nhà trạm phao (F-080, F-081, F-082)
- Thông báo email/push khi trạng thái thay đổi
- Tích hợp GIS (M-007) khi công bố

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | Full approval | Có thể thực hiện tất cả hành động phê duyệt |
| operator | Submit for approval | Chỉ gửi phê duyệt, không thể tự phê duyệt |
| approver_L1 | Approve L1 + Reject | Phê duyệt cấp 1, có thể từ chối |
| approver_L2 | Approve L2 + Reject | Phê duyệt cấp 2, có thể từ chối |
| viewer | Read | Không có quyền phê duyệt |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramPhao (nha_tram_phao) | Table | Cập nhật status, approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason |
| BaseNhaTram | Superclass | Các trường phê duyệt (status, approvalStatus, approvalLevel...) |
| NhaTramStatus | Enum | DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, DELETED, REJECTED |
| NhaTramApprovalStatus | Enum | PENDING, APPROVED, REJECTED |
| NhaTramHistory (nha_tram_history) | Table | Ghi nhật ký actionType=APPROVE_L1, APPROVE_L2, REJECT |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-010 | Phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL | NhaTramPhao.status | Service implementation |
| BR-011 | Phê duyệt L2 yêu cầu entity đã được phê duyệt L1 (APPROVED_L1) | NhaTramPhao.status | Service implementation |
| BR-012 | Từ chối (reject) yêu cầu lý do từ chối (rejectionReason) | NhaTramPhao.rejectionReason | @RequestParam String rejectReason |
| BR-015 | Không thể phê duyệt/từ chối nếu đã ở trạng thái PUBLISHED hoặc DELETED | NhaTramPhao.status | Service validation logic |

## Testing Strategy

(populated by qa stage)
