---
feature-id: F-076
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Phao tiêu

## Summary

Hệ thống cho phép người dùng có quyền `buoy:delete` xóa (mềm) hồ sơ Phao tiêu. Xóa là soft delete: bản ghi đánh dấu `deleted_at` (SQLRestriction `deleted_at IS NULL` của `Buoy`), không xóa vật lý; bản ghi biến mất khỏi danh sách, ẩn khỏi bản đồ (`pointObjectSyncService.hideFromMapBuoy`), không thao tác tiếp được. Mỗi lần xóa ghi history `SOFT_DELETE` + `ChangeHistoryService.insertChangeRecord("Buoy", ..., "Đã xóa")`.

> ⚠ **Drift tài liệu:** brief cũ mô tả entity `Beacon`; hiện trạng là `Buoy` (`/api/buoys`, DELETE `/{id}`), permission `buoy:delete`. Không lan truyền nội dung cũ; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Soft delete `Buoy`; ẩn khỏi bản đồ (hideFromMapBuoy); chặn truy cập bản ghi đã xóa; ghi history `SOFT_DELETE` + change record "Đã xóa"; phân quyền `buoy:delete`; data scope. |
| Out of scope | Hard delete; khôi phục; phê duyệt (F-077); lịch sử (F-079). |
| Assumptions | Soft delete theo cơ chế chung `BaseEntity`; trạng thái phê duyệt sau xóa mục tiêu `ARCHIVED` (xem BR-076-03); section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — ma trận đầy đủ tại F-074)

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 46 | Trạng thái | `approvalStatus` | Badge | Không | Sau xóa: mục tiêu `ARCHIVED` (7); hiện trạng code ghi history `SOFT_DELETE` + soft delete (BR-076-03). |
| — | Đã xóa lúc | `deletedAt` (BaseEntity) | — | Hệ thống ghi | Soft delete; loại khỏi truy vấn. |
| — | Người xóa | `deletedBy` | — | Hệ thống ghi | Từ session. |
| — | Ẩn bản đồ | spatial object (Gis) | — | Hệ thống ghi | `hideFromMapBuoy(entity)` khi xóa. |
| — | Lịch sử xóa | `BeaconHistory` (`SOFT_DELETE`) | — | Hệ thống ghi | + `insertChangeRecord("Buoy", ..., "Trạng thái", null, "Đã xóa", "system")`. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-076-01 | Chuyên viên | Xóa phao tiêu hết hiệu lực/nhập sai | Dọn dữ liệu, giữ vết kiểm toán | Must Have |
| US-076-02 | Chuyên viên | Phao tiêu đã xóa không hiện danh sách, không hiện bản đồ | Tránh thao tác dữ liệu đã xóa | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-076-01 | US-076-01 | Xóa thành công | Given bản ghi tồn tại, user có `buoy:delete`, trong phạm vi; When DELETE `/api/buoys/{id}`; Then soft delete + ẩn khỏi bản đồ | Không xóa vật lý. |
| AC-076-02 | US-076-02 | Không còn hiển thị | Given đã xóa; When danh sách/bản đồ/chi tiết; Then không xuất hiện | SQLRestriction + hideFromMap. |
| AC-076-03 | US-076-01 | Ghi history | When xóa; Then history `SOFT_DELETE` + change record "Đã xóa" | Audit đầy đủ. |
| AC-076-04 | US-076-01 | Phân quyền + scope | Given thiếu `buoy:delete` hoặc ngoài phạm vi; When xóa; Then HTTP 403 / không xóa | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-076-01 | Xóa là soft delete (`deleted_at`), không xóa vật lý; loại khỏi mọi truy vấn | AC-076-01/02 | Không. |
| BR-076-02 | Xóa phải ẩn phao tiêu khỏi bản đồ (`hideFromMapBuoy`) | AC-076-01/02 | Không. |
| BR-076-03 | Ghi history `SOFT_DELETE` + change record; mục tiêu `approvalStatus=ARCHIVED` sau xóa — SA chốt giá trị ghi | AC-076-03 | Không. |
| BR-076-04 | Permission `buoy:delete` (fallback `data:delete`) + data scope | AC-076-04 | ROLE_SYSTEM_ADMIN. |
| BR-076-05 | Bản ghi đã xóa không cập nhật, không duyệt, không gửi duyệt | AC-076-02 | Không. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Soft delete + hide map + history trong transaction | Không bản ghi xóa lửng. |
| Security | RBAC + data scope | 403 khi vi phạm. |
| Auditability | `deletedBy`/`deletedAt` + history | Truy vết. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-076-01 | AC-076-01 | Happy path: xóa → soft delete + ẩn bản đồ | Integration |
| TS-076-02 | AC-076-02 | Negative: bản ghi đã xóa không hiện danh sách/chi tiết | Integration |
| TS-076-03 | AC-076-03 | Happy path: history `SOFT_DELETE` + "Đã xóa" | Integration |
| TS-076-04 | AC-076-04 | Security: thiếu permission / ngoài scope → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Soft delete `BaseEntity` + spatial sync hiện có. |
| Architecture affected? | No | DELETE `/api/buoys/{id}` + `hideFromMapBuoy` đã implement. |
| Implementation clear? | Yes | Soft delete + hide map + history observable. |
| Documentation risk | Medium | Drift brief cũ; SA chốt trạng thái sau xóa. |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BuoyService` soft delete + `hideFromMapBuoy`. |
