---
feature-id: F-094
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Đài TTDH (CoastalStationVTS)

## Summary

Tính năng xóa hồ sơ Đài TTDH. **ĐÃ XÁC MINH:** endpoint `DELETE /api/v1/stations/coastal/{id}` → `CoastalStationVTSService.deleteStation` → `approvalService.deleteDraft(entity, refType, userId)` → `assertDeletable` (chỉ DRAFT mới xóa được, mọi trạng thái khác — kể cả APPROVED — từ chối) → xóa mềm (`deleted_at` set, `@SQLRestriction("deleted_at IS NULL")` ẩn bản ghi) + ghi history `DELETE` (approval-2-level-spec.md §3.6). Lý do chốt: hồ sơ đã duyệt đang có hiệu lực — không cho xóa, đổi tình trạng hoạt động thay vì xóa. Quyền `coastalstation:delete`. **DRIFT #5** (brief ghi "pending sau khi tạo") — trạng thái thực là DRAFT, nên điều kiện xóa thực tế áp dụng đúng cho hồ sơ mới tạo.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-094-01 | Người nhập | Hồ sơ DRAFT → nút Xóa | Xác nhận → `deleteDraft` | Bản ghi `deleted_at` set (xóa mềm), history DELETE, ẩn khỏi list |
| UC-094-02 | Người nhập | Hồ sơ PENDING/APPROVED/REJECTED | Bấm Xóa | Chặn: "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm" |
| UC-094-03 | Frontend | Bất kỳ hồ sơ nào | Nút Xóa ẩn khi `approvalStatus !== DRAFT` (`canDeleteApprovalRecord`) | Không hiện nút |

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm hồ sơ DRAFT; history DELETE; kiểm tra trạng thái; quyền `coastalstation:delete`; data scope. |
| Out of scope | Xóa cứng; xóa hồ sơ đã duyệt; restore. |

## Field Coverage Matrix

Không có trường nhập liệu riêng cho xóa. Dùng trạng thái TAB5 (`approvalStatus`, Badge) làm điều kiện: chỉ DRAFT mới hiện nút Xóa. Ma trận đầy đủ giống F-092 (TAB1 11 trường, TAB2 GIS, TAB3 File, TAB4 VH&BT read-only, TAB5 Xử lý & theo dõi) — áp dụng cho context hồ sơ bị xóa.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-094-01 | Chỉ xóa hồ sơ `approvalStatus = DRAFT` — `assertDeletable` | AC-094-01 | Mọi trạng thái khác từ chối |
| BR-094-02 | Xóa mềm: set `deletedAt`, không xóa khỏi DB | AC-094-02 | `@SQLRestriction` ẩn bản ghi |
| BR-094-03 | Ghi history `StationHistoryActionType.DELETE` | AC-094-03 | |
| BR-094-04 | Quyền `coastalstation:delete` (fallback `station:delete`, `data:delete`, `admin:all`) | AC-094-04 | |
| BR-094-05 | Nút Xóa chỉ hiện khi DRAFT (frontend `canDeleteApprovalRecord`) | AC-094-05 | Không hiện nút khi thiếu quyền/trạng thái |

## Domain Model

`CoastalStationVTS.deletedAt` (LocalDateTime) + `softDelete()`; `@SQLRestriction("deleted_at IS NULL")`; history `DELETE` trong bảng history chung (`station_history`). Vận hành qua `InfrastructureApprovalService.deleteDraft`.

## Approval flow (2 cấp C1→C2)

Không tương tác với luồng duyệt — xóa độc lập, chỉ ở DRAFT. Hồ sơ đã qua C1/C2 không xóa được (đổi tình trạng hoạt động thay vì xóa).

## Validation Rules

- `assertDeletable` — 403/400 nếu không phải DRAFT.
- User phải có quyền delete + thuộc phạm vi đơn vị của hồ sơ.

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-094-01 | Given DRAFT, When DELETE /{id}, Then 200 + `deletedAt` set; Given APPROVED/PENDING, When DELETE, Then chặn |
| AC-094-02 | Kiểm tra DB: bản ghi còn tồn tại với deleted_at khác null (xóa mềm) |
| AC-094-03 | Lịch sử có bản ghi DELETE với người xóa + thời điểm |
| AC-094-04 | Given user không có `coastalstation:delete`, When DELETE, Then 403 |
| AC-094-05 | List: hồ sơ đã xóa không xuất hiện; nút Xóa không hiện cho trạng thái khác DRAFT |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | `deletedAt` đã có |
| Architecture affected? | Low | Xóa mềm chuẩn toàn hệ thống |
| Implementation clear? | Yes | deleteDraft + assertDeletable đã có |
| Documentation risk | Low | Khớp approval-2-level-spec §3.6 |
| **Verdict** | `Ready for Solution Designer review` | Rõ ràng, không drift mới |
