---
feature-id: F-023
document: business-context
last-updated: 2026-06-27
---
# Business Context: Phê duyệt Cầu cảng (F-023)

## Context Summary

| Attribute | Value |
|---|---|
| Module | M-002 — Quản lý tài sản KCHTGT Cảng & Bến |
| Asset type | Cầu cảng (614 objects, ~12,280 fields) |
| Pattern | Approval workflow — reuses F-011 (Phê duyệt Cảng biển) pattern |
| Primary actor | A-002 Lãnh đạo (ROLE_LEADER) |
| Trigger features | F-020 (Tạo mới Cầu cảng), F-021 (Cập nhật Cầu cảng) |

## Business Context Narrative

Hệ thống KCHTGTHH quản lý 614 Cầu cảng trên toàn quốc. Mỗi Cầu cảng sau khi tạo mới hoặc cập nhật bởi Chuyên viên/Người dùng tại Cảng phải được Lãnh đạo phê duyệt trước khi có hiệu lực. Đây là yêu cầu kiểm soát chất lượng dữ liệu bắt buộc theo quy trình nghiệp vụ của Cục Hàng hải Việt Nam, nhằm đảm bảo tính chính xác và trách nhiệm giải trình đối với dữ liệu tài sản công.

## State Machine

| From State | Action | To State | Actor |
|---|---|---|---|
| Chờ phê duyệt | Chấp thuận | Hiện hành | A-002 |
| Chờ phê duyệt | Từ chối | Chỉnh sửa | A-002 |
| Chỉnh sửa | Tái trình (F-021) | Chờ phê duyệt | A-003 / A-004 |

## Actors & Permissions

| Actor | Role | Permission | Notes |
|---|---|---|---|
| Lãnh đạo | A-002 / ROLE_LEADER | APPROVE_CAU_CANG | Hoặc per-user override tường minh |
| Chuyên viên | A-003 / ROLE_SPECIALIST | Nhận thông báo only | Không được phê duyệt |
| Người dùng tại Cảng | A-004 / ROLE_PORT_OPERATOR | Nhận thông báo only | Không được phê duyệt |
| Quản trị hệ thống | A-001 / ROLE_SYSTEM_ADMIN | Không có quyền phê duyệt nghiệp vụ | Theo BR-006 |

## Key Business Rules (summary)

| BR-ID | Rule |
|---|---|
| BR-001 | Cầu cảng phải qua trạng thái "Chờ phê duyệt" trước khi hoạt động |
| BR-002 | Lý do từ chối là bắt buộc |
| BR-003 | Một cấp phê duyệt duy nhất |
| BR-004 | PheDuyetLog bất biến — không xóa/sửa |
| BR-006 | Chỉ ROLE_LEADER hoặc ủy quyền tường minh được phê duyệt |
