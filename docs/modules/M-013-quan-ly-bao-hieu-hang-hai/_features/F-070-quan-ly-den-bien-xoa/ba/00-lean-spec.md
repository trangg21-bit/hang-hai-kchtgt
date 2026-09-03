---
feature-id: F-070
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Đèn biển (và nhà trạm)

## Summary

Hệ thống cho phép người dùng có quyền `beaconstation:delete` xóa (mềm) hồ sơ Đèn biển. Xóa là soft delete: bản ghi được đánh dấu `deleted_at` (SQLRestriction `deleted_at IS NULL` của `BeaconStation`), không xóa vật lý khỏi database; bản ghi biến mất khỏi danh sách và không thể cập nhật (`"Đèn biển đã bị xóa"`). Mỗi lần xóa ghi history `SOFT_DELETE`. Không xóa được bản ghi ngoài phạm vi đơn vị (data scope).

> ⚠ **Drift tài liệu:** brief cũ mô tả entity `Beacon`; hiện trạng là `BeaconStation` (`/api/beacon-stations`, DELETE `/{id}`), permission `beaconstation:delete`. Không lan truyền nội dung cũ; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Soft delete `BeaconStation`; chặn truy cập bản ghi đã xóa (đọc/cập nhật); ghi history `SOFT_DELETE`; phân quyền `beaconstation:delete`; data scope theo đơn vị. |
| Out of scope | Xóa vật lý (hard delete); khôi phục bản ghi đã xóa; phê duyệt (F-071); lịch sử (F-073). |
| Assumptions | Soft delete theo cơ chế chung `BaseEntity`; trạng thái phê duyệt `ARCHIVED` là mục tiêu convention (xem BR-070-03); section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — ma trận đầy đủ tại F-068)

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 57 | Trạng thái (Trạng thái phê duyệt) | `approvalStatus` | Badge | Không | Sau xóa: mục tiêu `ARCHIVED` (7) theo convention; hiện trạng code ghi history `SOFT_DELETE` + soft delete (BR-070-03). |
| — | Đã xóa lúc | `deletedAt` (BaseEntity) | — | Hệ thống ghi | Soft delete; `SQLRestriction("deleted_at IS NULL")` loại khỏi mọi truy vấn. |
| — | Người xóa | `deletedBy` (BaseEntity) | — | Hệ thống ghi | Lấy từ session thao tác. |
| — | Lịch sử xóa | `BeaconHistory` (action `SOFT_DELETE`) | — | Hệ thống ghi | `BeaconHistoryActionType.SOFT_DELETE`; ghi cả `infrastructure_history` (status DELETED). |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-070-01 | Chuyên viên | Xóa hồ sơ Đèn biển nhập sai/không còn hiệu lực | Dọn dữ liệu mà vẫn giữ vết kiểm toán | Must Have |
| US-070-02 | Chuyên viên | Bản ghi đã xóa không xuất hiện trong danh sách, không sửa được | Tránh thao tác trên dữ liệu đã xóa | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-070-01 | US-070-01 | Xóa thành công | Given bản ghi tồn tại, user có `beaconstation:delete`, trong phạm vi; When DELETE `/api/beacon-stations/{id}`; Then bản ghi soft delete (`deleted_at`), không còn trong danh sách | Không xóa vật lý. |
| AC-070-02 | US-070-02 | Bản ghi đã xóa | Given bản ghi đã xóa; When đọc/cập nhật; Then không trả về / "Đèn biển đã bị xóa" | SQLRestriction + service check. |
| AC-070-03 | US-070-01 | Ghi history | When xóa; Then ghi history `SOFT_DELETE` (BeaconHistory/`infrastructure_history` DELETED) | Audit đầy đủ người/thời điểm. |
| AC-070-04 | US-070-01 | Phân quyền + scope | Given thiếu `beaconstation:delete` hoặc ngoài phạm vi; When xóa; Then HTTP 403 / không xóa | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-070-01 | Xóa là soft delete (đánh dấu `deleted_at`), không xóa vật lý; bản ghi bị loại khỏi mọi truy vấn qua `SQLRestriction("deleted_at IS NULL")` | AC-070-01/02 | Không. |
| BR-070-02 | Ghi history `SOFT_DELETE` với `changedBy`/`deletedBy` từ session; không nhận từ client | AC-070-03 | Không. |
| BR-070-03 | Trạng thái phê duyệt sau xóa: mục tiêu `ARCHIVED` (7) theo convention; hiện trạng code ghi history + soft delete — SA chốt giá trị `approvalStatus`/`status` ghi khi xóa | AC-070-01/03 | Không. |
| BR-070-04 | Permission `beaconstation:delete` (fallback `data:delete`) + data scope | AC-070-04 | ROLE_SYSTEM_ADMIN vượt qua. |
| BR-070-05 | Bản ghi đã xóa không cập nhật, không duyệt, không gửi duyệt lại | AC-070-02 | Không. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Soft delete trong transaction + history | Không mất bản ghi vật lý; có vết xóa. |
| Security | RBAC + data scope | 403 khi vi phạm. |
| Auditability | `deletedBy`/`deletedAt` + history `SOFT_DELETE` | Truy vết người xóa. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-070-01 | AC-070-01 | Happy path: xóa → bản ghi không còn trong danh sách, vẫn tồn tại trong DB (deleted_at) | Integration |
| TS-070-02 | AC-070-02 | Negative: đọc/cập nhật bản ghi đã xóa → không trả về / báo đã xóa | Integration |
| TS-070-03 | AC-070-03 | Happy path: history `SOFT_DELETE` được ghi với người xóa | Integration |
| TS-070-04 | AC-070-04 | Security: thiếu permission / ngoài scope → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Soft delete kế thừa `BaseEntity`; không thêm field. |
| Architecture affected? | No | DELETE `/api/beacon-stations/{id}` đã implement (`BeaconStationController.java:127-130`). |
| Implementation clear? | Yes | Soft delete + history `SOFT_DELETE` observable. |
| Documentation risk | Medium | Drift brief cũ; SA chốt giá trị trạng thái sau xóa (BR-070-03). |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BeaconStationService` soft delete + history `SOFT_DELETE`. |
