---
id: F-077
name: "Phê duyệt Phao tiêu"
slug: phe-duyet-phao-tieu
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:33Z"
last-updated: "2026-07-07T03:32:33Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Phao tiêu

## Description

Quản lý quy trình phê duyệt 2 cấp cho phao tiêu, bao gồm 4 thao tác: (1) Gửi phê duyệt — operator gửi phao tiêu từ DRAFT lên PENDING_APPROVAL; (2) Phê duyệt L1 — approver_L1 xem xét và phê duyệt cấp 1, đưa lên APPROVED_L1; (3) Phê duyệt L2 — approver_L2 phê duyệt cấp cuối, đưa lên PUBLISHED và đồng bộ lên GIS M-007; (4) Từ chối — bất kỳ approver nào cũng có thể từ chối với lý do, đưa về DRAFT. Người phê duyệt không thể tự phê duyệt bản ghi do mình tạo. Mỗi bước đều ghi lịch sử và gửi thông báo.

## Business Intent

Đảm bảo chất lượng dữ liệu phao tiêu thông qua quy trình phê duyệt 2 cấp, phân tách trách nhiệm giữa người tạo dữ liệu (operator), người kiểm tra cấp 1 (approver_L1) và người công bố cấp 2 (approver_L2). Với 1.452 phao tiêu, quy trình này đảm bảo thông tin hiển thị trên bản đồ hàng hải luôn chính xác và đã qua kiểm duyệt.

## Flow Summary

Operator tạo hoặc sửa phao tiêu, gửi phê duyệt qua endpoint POST /api/buoys/{id}/submit-approval — phao tiêu chuyển từ DRAFT sang PENDING_APPROVAL. Approver_L1 kiểm tra thông tin, phê duyệt L1 hoặc từ chối với lý do ≥ 10 ký tự. Nếu được duyệt L1, phao tiêu chuyển sang APPROVED_L1. Approver_L2 kiểm tra lại và phê duyệt L2 — phao tiêu chuyển sang PUBLISHED và được đồng bộ lên GIS M-007 (PointObjectSyncService.syncToMapBuoy). Nếu bị từ chối, phao tiêu quay về DRAFT. Hệ thống kiểm tra người phê duyệt không trùng với người tạo.

## Acceptance Criteria

- AC-01: Operator có thể gửi phê duyệt phao tiêu ở trạng thái DRAFT — chuyển sang PENDING_APPROVAL, ghi lịch sử.
- AC-02: Approver_L1 phê duyệt thành công phao tiêu ở trạng thái PENDING_APPROVAL — chuyển sang APPROVED_L1.
- AC-03: Approver_L1 không thể phê duyệt phao tiêu do chính mình tạo — trả về lỗi.
- AC-04: Approver_L2 phê duyệt thành công phao tiêu ở trạng thái APPROVED_L1 — chuyển sang PUBLISHED và đồng bộ lên GIS.
- AC-05: Từ chối với lý do ≥ 10 ký tự — phao tiêu quay về DRAFT, ghi lịch sử REJECT.
- AC-06: Từ chối với lý do < 10 ký tự — bị từ chối với lỗi validate.

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
| Buoy | buoy | Thực thể chính, cập nhật status/approvalStatus theo từng bước phê duyệt |
| BeaconHistory | beacon_history | Ghi lịch sử APPROVE_L1, APPROVE_L2, REJECT |
| PointObject (M-007) | point_objects | Đồng bộ lên GIS khi đạt PUBLISHED |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-010 | Phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL | Buoy.status | Service check trong approveL1() |
| BR-011 | Phê duyệt L2 yêu cầu entity đã được phê duyệt L1 (APPROVED_L1) | Buoy.status | Service check trong approveL2() |
| BR-012 | Từ chối yêu cầu lý do từ chối tối thiểu 10 ký tự | Buoy | Validate length |
| BR-013 | Sau khi phê duyệt L2, Buoy được đồng bộ lên GIS M-007 | Buoy + M-007 | `PointObjectSyncService.syncToMapBuoy()` |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT | Buoy.status | `@Builder.Default status = DRAFT` |
| (extra) | Người phê duyệt không thể phê duyệt bản ghi do chính mình tạo | Buoy | Service check |

## Testing Strategy

(populated by qa stage)
