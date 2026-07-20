---
id: F-101
name: "Phê duyệt Đài Inmarsat"
slug: phe-duyet-dai-inmarsat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-07-07T03:33:06Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Đài Inmarsat

## Description

Tính năng phê duyệt cho Đài Inmarsat thực hiện quy trình phê duyệt 2 cấp, bao gồm: phê duyệt cấp 1 (Approved L1), phê duyệt cấp 2 (Approved L2 / Published) và từ chối (Rejected). Đài Inmarsat sau khi tạo với trạng thái DRAFT sẽ được operator gửi phê duyệt. Approver L1 xem xét và phê duyệt (chuyển APPROVED_L1) hoặc từ chối kèm lý do. Approver L2 phê duyệt lần cuối (PUBLISHED) hoặc từ chối. Sử dụng StationStatus và StationApprovalStatus. API: POST /{id}/approve, POST /{id}/reject.

## Business Intent

Đảm bảo mọi Đài Inmarsat được đưa vào vận hành chính thức đều qua quy trình kiểm tra và phê duyệt 2 cấp, đáp ứng yêu cầu quản lý nhà nước về thông tin vệ tinh hàng hải và phối hợp tìm kiếm cứu nạn (SAR).

## Flow Summary

Operator gửi phê duyệt (PENDING_APPROVAL) → Approver L1 xem xét → Phê duyệt L1 (APPROVED_L1) hoặc từ chối → Approver L2 phê duyệt cuối (PUBLISHED) hoặc từ chối → Mỗi bước ghi nhận lịch sử.

## Acceptance Criteria

- **AC-01**: Approver L1 phê duyệt Đài Inmarsat ở PENDING_APPROVAL thành công, chuyển sang APPROVED_L1.
- **AC-02**: Approver L2 phê duyệt Đài Inmarsat ở APPROVED_L1 thành công, chuyển sang PUBLISHED.
- **AC-03**: Từ chối yêu cầu nhập lý do, chuyển sang REJECTED.
- **AC-04**: Phê duyệt sai trạng thái bị từ chối (HTTP 400).

## In Scope

- Phê duyệt L1, L2, từ chối
- Kiểm tra trạng thái trước khi phê duyệt
- Ghi lịch sử phê duyệt

## Out of Scope

- Gửi thông báo
- Tích hợp email

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Full CRUD + approval | Phê duyệt L1 và L2 |
| operator | CRUD + submit | Gửi phê duyệt |
| approver_L1 | Read + Approve L1 | Phê duyệt cấp 1 |
| approver_L2 | Read + Approve L2 | Phê duyệt cấp 2 |
| viewer | Read | Không có quyền |

## Entities

- **CoastalStationInmarsat**: StationStatus, StationApprovalStatus.
- **CoastalStationInmarsatApprovalRequest**: DTO chứa approved (LevelEnum) và rejectionReason.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-010 | Phê duyệt L1 yêu cầu PENDING_APPROVAL | CoastalStationInmarsat.status | Service |
| BR-011 | Phê duyệt L2 yêu cầu APPROVED_L1 | CoastalStationInmarsat.status | Service |
| BR-012 | Từ chối yêu cầu rejectionReason | CoastalStationInmarsat | @RequestParam |

## Testing Strategy

(populated by qa stage)
