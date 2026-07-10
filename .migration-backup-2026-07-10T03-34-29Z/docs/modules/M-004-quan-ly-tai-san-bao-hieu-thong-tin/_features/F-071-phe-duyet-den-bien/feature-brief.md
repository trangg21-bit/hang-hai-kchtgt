---
id: F-071
name: "Phê duyệt Đèn biển"
slug: phe-duyet-den-bien
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:17Z"
last-updated: "2026-07-07T03:32:17Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Đèn biển

## Description

Quản lý quy trình phê duyệt 2 cấp cho đèn biển, bao gồm 4 thao tác: (1) Gửi phê duyệt — operator gửi đèn biển từ DRAFT lên PENDING_APPROVAL; (2) Phê duyệt L1 — approver_L1 xem xét và phê duyệt cấp 1, đưa lên APPROVED_L1; (3) Phê duyệt L2 — approver_L2 phê duyệt cấp cuối, đưa lên PUBLISHED và đồng bộ lên GIS M-007; (4) Từ chối — bất kỳ approver nào cũng có thể từ chối với lý do, đưa về DRAFT. Quy trình đảm bảo mọi thay đổi thông tin đèn biển đều được kiểm duyệt trước khi công bố.

## Business Intent

Đảm bảo chất lượng dữ liệu đèn biển thông qua quy trình phê duyệt 2 cấp, phân tách trách nhiệm giữa người tạo dữ liệu (operator), người kiểm tra cấp 1 (approver_L1) và người công bố cấp 2 (approver_L2). Việc đồng bộ lên GIS sau phê duyệt L2 đảm bảo thông tin hiển thị trên bản đồ hàng hải luôn chính xác và đã được phê duyệt.

## Flow Summary

Operator tạo hoặc sửa đèn biển, sau đó gửi phê duyệt (submitForApproval) — đèn biển chuyển từ DRAFT sang PENDING_APPROVAL. Approver_L1 kiểm tra thông tin, có thể phê duyệt L1 hoặc từ chối với lý do. Nếu được phê duyệt L1, đèn biển chuyển sang APPROVED_L1. Approver_L2 kiểm tra lại và phê duyệt L2 — đèn biển chuyển sang PUBLISHED và được đồng bộ lên GIS M-007 (PointObjectSyncService.syncToMap). Nếu bị từ chối ở bất kỳ cấp nào, đèn biển quay về DRAFT và operator phải sửa lại. Hệ thống ghi lịch sử cho mỗi hành động phê duyệt và gửi thông báo.

## Acceptance Criteria

- AC-01: Operator có thể gửi phê duyệt đèn biển ở trạng thái DRAFT — chuyển sang PENDING_APPROVAL, ghi lịch sử.
- AC-02: Approver_L1 phê duyệt thành công đèn biển ở trạng thái PENDING_APPROVAL — chuyển sang APPROVED_L1.
- AC-03: Approver_L1 không thể phê duyệt đèn biển do chính mình tạo — trả về lỗi "Bạn không thể phê duyệt bản do chính mình gửi".
- AC-04: Approver_L2 phê duyệt thành công đèn biển ở trạng thái APPROVED_L1 — chuyển sang PUBLISHED và đồng bộ lên GIS.
- AC-05: Từ chối với lý do ≥ 10 ký tự — đèn biển quay về DRAFT, ghi lịch sử REJECT.
- AC-06: Từ chối với lý do < 10 ký tự — bị từ chối với lỗi "Lý do từ chối phải có ít nhất 10 ký tự".

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | approve | Có quyền thực hiện mọi thao tác phê duyệt |
| operator | submit | Có quyền gửi phê duyệt, không thể tự phê duyệt |
| approver_L1 | approve_l1 | Có quyền phê duyệt L1 và từ chối |
| approver_L2 | approve_l2 | Có quyền phê duyệt L2 và từ chối |
| viewer | none | Chỉ xem, không có quyền phê duyệt |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| BeaconLight | beacon_light | Thực thể chính, cập nhật status/approvalStatus theo từng bước phê duyệt |
| BeaconHistory | beacon_history | Ghi lịch sử APPROVE_L1, APPROVE_L2, REJECT |
| PointObject (M-007) | point_objects | Đồng bộ lên GIS khi đạt PUBLISHED |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-010 | Phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL | BeaconLight.status | Service check trong approveL1() |
| BR-011 | Phê duyệt L2 yêu cầu entity đã được phê duyệt L1 (APPROVED_L1) | BeaconLight.status | Service check trong approveL2() |
| BR-012 | Từ chối yêu cầu lý do từ chối (rejectionReason) tối thiểu 10 ký tự | BeaconLight | `@RequestParam String rejectReason`, validate length |
| BR-013 | Sau khi phê duyệt L2, BeaconLight được đồng bộ lên GIS M-007 | BeaconLight + M-007 | `PointObjectSyncService.syncToMap()` |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT | BeaconLight.status | `@Builder.Default status = DRAFT` |
| (extra) | Người phê duyệt không thể phê duyệt bản ghi do chính mình tạo | BeaconLight | Service check CreatorId == approverUserId |

## Testing Strategy

(populated by qa stage)
