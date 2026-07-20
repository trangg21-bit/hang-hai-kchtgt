---
id: F-113
name: "Phê duyệt Đài LRIT"
slug: phe-duyet-dai-lrit
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-07T03:33:22Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Đài LRIT

## Description

Tính năng phê duyệt 2 cấp cho Đài LRIT: phê duyệt L1, L2 (Published) và từ chối. Đài LRIT sau tạo (DRAFT) gửi phê duyệt. Approver L1 phê duyệt (APPROVED_L1) hoặc từ chối. Approver L2 phê duyệt cuối (PUBLISHED) hoặc từ chối. StationStatus và StationApprovalStatus. API: POST /{id}/approve, /{id}/reject.

## Business Intent

Đảm bảo mọi Đài LRIT — hệ thống nhận dạng tầm xa theo SOLAS — được kiểm tra và phê duyệt 2 cấp trước khi đưa vào vận hành, đáp ứng yêu cầu quản lý nhà nước và công ước quốc tế.

## Flow Summary

Operator gửi duyệt → Approver L1 duyệt hoặc từ chối → Approver L2 duyệt cuối hoặc từ chối → Ghi lịch sử.

## Acceptance Criteria

- **AC-01**: L1 phê duyệt thành công, chuyển APPROVED_L1.
- **AC-02**: L2 phê duyệt thành công, chuyển PUBLISHED.
- **AC-03**: Từ chối yêu cầu lý do, chuyển REJECTED.
- **AC-04**: Sai trạng thái phê duyệt bị từ chối.

## In Scope

- Phê duyệt L1, L2, từ chối
- Kiểm tra trạng thái

## Out of Scope

- Gửi thông báo

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Full + approval | L1 và L2 |
| operator | CRUD + submit | Gửi duyệt |
| approver_L1 | Read + Approve L1 | Cấp 1 |
| approver_L2 | Read + Approve L2 | Cấp 2 |
| viewer | Read | Không |

## Entities

- **CoastalStationLRIT**: StationStatus, StationApprovalStatus.
- **CoastalStationLRITApprovalRequest**: DTO approval.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-010 | L1 yêu cầu PENDING_APPROVAL | CoastalStationLRIT.status | Service |
| BR-011 | L2 yêu cầu APPROVED_L1 | CoastalStationLRIT.status | Service |
| BR-012 | Từ chối yêu cầu rejectionReason | CoastalStationLRIT | @RequestParam |

## Testing Strategy

(populated by qa stage)
