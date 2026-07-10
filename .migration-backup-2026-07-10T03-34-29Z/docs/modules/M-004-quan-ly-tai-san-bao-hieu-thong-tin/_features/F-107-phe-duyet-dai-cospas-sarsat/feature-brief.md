---
id: F-107
name: "Phê duyệt Đài COSPAS-SARSAT"
slug: phe-duyet-dai-cospas-sarsat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-07-07T03:33:14Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Đài COSPAS-SARSAT

## Description

Tính năng phê duyệt 2 cấp cho Đài COSPAS-SARSAT: phê duyệt L1, L2 (Published) và từ chối. Đài sau khi tạo (DRAFT) được operator gửi phê duyệt. Approver L1 phê duyệt (APPROVED_L1) hoặc từ chối. Approver L2 phê duyệt cuối (PUBLISHED) hoặc từ chối. Sử dụng StationStatus và StationApprovalStatus. API: POST /{id}/approve, POST /{id}/reject.

## Business Intent

Đảm bảo mọi Đài COSPAS-SARSAT — hệ thống quan trọng cho tìm kiếm cứu nạn — được kiểm tra và phê duyệt 2 cấp trước khi đưa vào vận hành chính thức, đáp ứng yêu cầu quản lý nhà nước về an toàn hàng hải.

## Flow Summary

Operator gửi phê duyệt → Approver L1 phê duyệt hoặc từ chối → Approver L2 phê duyệt cuối hoặc từ chối → Ghi lịch sử.

## Acceptance Criteria

- **AC-01**: Approver L1 phê duyệt thành công, chuyển APPROVED_L1.
- **AC-02**: Approver L2 phê duyệt thành công, chuyển PUBLISHED.
- **AC-03**: Từ chối yêu cầu lý do, chuyển REJECTED.
- **AC-04**: Phê duyệt sai trạng thái bị từ chối (HTTP 400).

## In Scope

- Phê duyệt L1, L2, từ chối
- Kiểm tra trạng thái

## Out of Scope

- Gửi thông báo

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Full CRUD + approval | L1 và L2 |
| operator | CRUD + submit | Gửi duyệt |
| approver_L1 | Read + Approve L1 | Cấp 1 |
| approver_L2 | Read + Approve L2 | Cấp 2 |
| viewer | Read | Không |

## Entities

- **CoastalStationCospasSarsat**: StationStatus, StationApprovalStatus.
- **CoastalStationCospasSarsatApprovalRequest**: DTO approval.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-010 | L1 yêu cầu PENDING_APPROVAL | CoastalStationCospasSarsat.status | Service |
| BR-011 | L2 yêu cầu APPROVED_L1 | CoastalStationCospasSarsat.status | Service |
| BR-012 | Từ chối yêu cầu rejectionReason | CoastalStationCospasSarsat | @RequestParam |

## Testing Strategy

(populated by qa stage)
