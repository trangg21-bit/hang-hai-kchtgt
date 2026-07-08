---
id: F-095
name: "Phê duyệt Đài TTDH"
slug: phe-duyet-dai-ttdh
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-07T03:32:57Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Đài TTDH

## Description

Tính năng phê duyệt cho Đài Thông tin Duyên hải (VTS) thực hiện quy trình phê duyệt 2 cấp (two-level approval), bao gồm các thao tác: phê duyệt cấp 1 (Approved L1), phê duyệt cấp 2 (Approved L2 / Published) và từ chối (Rejected). Đài TTDH sau khi được tạo với trạng thái DRAFT sẽ được operator gửi phê duyệt. Approver cấp 1 xem xét và phê duyệt (chuyển sang APPROVED_L1) hoặc từ chối kèm lý do. Sau đó approver cấp 2 phê duyệt lần cuối (chuyển sang PUBLISHED) hoặc từ chối. Trạng thái phê duyệt được quản lý qua StationStatus (DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, DELETED) và StationApprovalStatus (PENDING, APPROVED_L1, APPROVED_L2, REJECTED).

## Business Intent

Đảm bảo mọi Đài TTDH được đưa vào vận hành chính thức đều trải qua quy trình kiểm tra và phê duyệt chặt chẽ 2 cấp, đáp ứng yêu cầu quản lý nhà nước về thông tin hàng hải. Cơ chế phê duyệt này đảm bảo tính chính xác, đầy đủ của dữ liệu trước khi công bố và ngăn chặn việc đưa thông tin chưa được kiểm duyệt vào hệ thống chính thức.

## Flow Summary

Operator tạo/ cập nhật Đài TTDH (trạng thái DRAFT) → Operator gửi yêu cầu phê duyệt (chuyển sang PENDING_APPROVAL) → Approver L1 truy cập danh sách chờ duyệt → Xem chi tiết đài → Nếu đạt: phê duyệt L1 (gọi POST /{id}/approve với LevelEnum.L1, chuyển sang APPROVED_L1) → Approver L2 xem xét → Nếu đạt: phê duyệt L2 (gọi POST /{id}/approve với LevelEnum.L2, chuyển sang PUBLISHED) → Nếu không đạt ở bất kỳ bước nào: gọi POST /{id}/reject với lý do từ chối, chuyển sang REJECTED. Mỗi hành động phê duyệt/từ chối đều được ghi nhận vào lịch sử.

## Acceptance Criteria

- **AC-01**: Approver L1 phê duyệt Đài TTDH đang ở trạng thái PENDING_APPROVAL thành công, chuyển trạng thái sang APPROVED_L1.
- **AC-02**: Approver L2 phê duyệt Đài TTDH đang ở trạng thái APPROVED_L1 thành công, chuyển trạng thái sang PUBLISHED.
- **AC-03**: Khi từ chối phê duyệt ở bất kỳ cấp nào, hệ thống yêu cầu nhập lý do từ chối (rejectionReason) và chuyển trạng thái sang REJECTED.
- **AC-04**: Phê duyệt L1 khi đài chưa ở trạng thái PENDING_APPROVAL hoặc phê duyệt L2 khi đài chưa ở APPROVED_L1 đều bị từ chối (HTTP 400).

## In Scope

- Phê duyệt cấp 1 (L1) qua POST /{id}/approve
- Phê duyệt cấp 2 (L2) qua POST /{id}/approve
- Từ chối phê duyệt qua POST /{id}/reject
- Kiểm tra trạng thái hiện tại trước khi phê duyệt/từ chối
- Ghi nhận lịch sử phê duyệt

## Out of Scope

- Gửi thông báo khi thay đổi trạng thái
- Tích hợp quy trình phê duyệt qua email
- Đồng bộ GIS M-007 (áp dụng cho beacon, không áp dụng cho stations)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Full CRUD + approval | Có thể phê duyệt cả L1 và L2 |
| operator | CRUD + submit | Có thể tạo và gửi phê duyệt, không phê duyệt |
| approver_L1 | Read + Approve L1 | Chỉ phê duyệt cấp 1 hoặc từ chối |
| approver_L2 | Read + Approve L2 | Chỉ phê duyệt cấp 2 hoặc từ chối |
| viewer | Read | Không có quyền phê duyệt |

## Entities

- **CoastalStationVTS**: Sử dụng StationStatus (DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, DELETED) và StationApprovalStatus (PENDING, APPROVED_L1, APPROVED_L2, REJECTED).
- **CoastalStationVTSApprovalRequest**: DTO chứa trường approved (LevelEnum) cho phê duyệt và rejectionReason cho từ chối.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-010 | Phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL | CoastalStationVTS.status | Service implementation |
| BR-011 | Phê duyệt L2 yêu cầu entity đã được phê duyệt L1 (APPROVED_L1) | CoastalStationVTS.status | Service implementation |
| BR-012 | Từ chối (reject) yêu cầu lý do từ chối (rejectionReason) | CoastalStationVTS.rejectionReason | @RequestParam String rejectReason |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT | CoastalStationVTS.status | @Builder.Default |

## Testing Strategy

(populated by qa stage)
