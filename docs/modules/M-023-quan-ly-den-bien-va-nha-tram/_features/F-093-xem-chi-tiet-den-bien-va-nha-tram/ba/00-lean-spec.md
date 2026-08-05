---
feature-id: F-093
document: lean-spec
output-mode: lean
last-updated: 2026-08-05
---
# Xem chi tiết Đèn biển và nhà trạm gắn với Đèn biển

## Summary

Trang chi tiết hiển thị toàn bộ thông tin một DBNT ở chế độ read-only, tổ chức thành 7 nhóm (A-G) + nhóm Hành động (H) + 4 tab phụ. Người dùng từ danh sách bấm vào để xem đầy đủ dữ liệu trước khi quyết định sửa, duyệt, hoặc tham chiếu từ module khác.

## Scope

| | Items |
|---|---|
| In scope | 7 nhóm thông tin (A: Cơ bản, B: Kỹ thuật đèn, C: Nhà trạm, D: Trạng thái, E: GIS, F: File, G: Metadata); Nhóm H: Hành động (Sửa/Phê duyệt/Từ chối/Lịch sử); Tab Phê duyệt; Tab Vận hành/Bảo trì/Sự cố; Nút Xem vị trí → modal MyMap; Breadcrumb |
| Out of scope | Chỉnh sửa (F-094); Xóa (F-095); Tạo mới (F-092) |
| Assumptions | DBNT đã tồn tại; API detail đã có; User đã xác thực |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Người dùng | Xem toàn bộ thông tin chi tiết DBNT | Nắm đầy đủ dữ liệu | Must Have |
| US-002 | Người dùng | Xem vị trí trên bản đồ | Trực quan hóa tọa độ | Must Have |
| US-003 | Lãnh đạo/Cục | Thấy form phê duyệt trong màn chi tiết | Duyệt nhanh | Should Have |
| US-004 | Người dùng | Xem DS vận hành/bảo trì/sự cố liên quan | Theo dõi toàn diện | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given/When/Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Load chi tiết | Given user bấm "Xem chi tiết"; When GET detail; Then hiển thị form Detail với toàn bộ field readonly | 7 nhóm A-G |
| AC-002 | US-001 | Nhóm chính mở rộng, phụ thu gọn | Given trang chi tiết; When load; Then A-D mở rộng, E-G thu gọn | |
| AC-003 | US-002 | Xem vị trí | Given trang chi tiết; When bấm "Xem vị trí"; Then modal MyMap hiển thị tọa độ | |
| AC-004 | US-003 | Form phê duyệt | Given user có quyền + bản ghi S_2/S_3; Then hiển thị nút Duyệt/Từ chối + ô lý do | |
| AC-005 | US-004 | Tab vận hành/bảo trì/sự cố | Given trang chi tiết; When mở tab; Then bảng danh sách liên quan hiển thị | Lọc theo endPoint=qlkc_052 |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Trang chi tiết read-only; mọi sửa phải qua F-094 | AC-001 | |
| BR-002 | Dữ liệu làm mới mỗi lần truy cập, không cache | AC-001 | |
| BR-003 | Metadata (createdBy/updatedBy) chỉ hiển thị Admin Cục | Nhóm G | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Load trang ≤ 1 giây | |
| Security | RBAC server-side; metadata filter server-side | |
| UX | Skeleton form khi load; collapsible sections | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Bấm Xem chi tiết → hiển thị đủ 7 nhóm | Acceptance |
| TS-002 | AC-003 | Bấm Xem vị trí → modal Map | Integration |
| TS-003 | AC-004 | Lãnh đạo thấy form duyệt khi S_2 | Acceptance |
| TS-004 | AC-004 | User thường không thấy form duyệt | Acceptance |
| TS-005 | BR-003 | Admin Cục thấy createdBy; user thường không | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Read-only trên DBNT đã có |
| Architecture affected? | Yes | API detail, JOIN, field-level permission |
| Implementation clear? | No | Cần SA: API detail structure, tab component |
| **Verdict** | `Ready for solution architecture` | |
