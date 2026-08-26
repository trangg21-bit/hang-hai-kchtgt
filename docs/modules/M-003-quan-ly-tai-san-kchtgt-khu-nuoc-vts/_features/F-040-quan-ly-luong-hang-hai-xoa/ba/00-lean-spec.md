---
feature-id: F-040
document: lean-spec
output-mode: lean
last-updated: 2026-08-26
---
# Xóa Luồng hàng hải

## Summary

Hệ thống cho phép người dùng có `navigationchannel:delete` xóa mềm hồ sơ Luồng hàng hải **đã được duyệt xong** (`APPROVED` = 5). Hệ thống gán `deletedAt`/`deletedBy` từ session người thao tác, xóa đối tượng GIS nếu có, và hồ sơ bị xóa biến mất khỏi danh sách/tìm kiếm/chi tiết nhờ filter `deleted_at IS NULL`. Hồ sơ ở trạng thái khác `APPROVED` bị từ chối. Code hiện tại KHÔNG ghi dòng history `DELETE` (utility `ApprovalHistoryUtils.recordSoftDelete` chưa có caller) — điểm lệch với kỳ vọng work order ban đầu, cần PMO chốt (brief mục 3 đã ghi chú).

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm hồ sơ `APPROVED`; gán `deletedAt`/`deletedBy` từ session; xóa GIS spatial object khi có; ẩn hồ sơ đã xóa khỏi đọc; từ chối xóa hồ sơ không ở trạng thái `APPROVED` hoặc không tồn tại/đã xóa; endpoint `DELETE /api/v1/navigation-channel/{id}` với quyền `navigationchannel:delete`. |
| Out of scope | Xóa cứng (physical delete); ghi history `DELETE` (chờ PMO chốt — nếu chốt làm sẽ là task dev riêng dùng `ApprovalHistoryUtils.recordSoftDelete`); xóa hàng loạt; khôi phục hồ sơ đã xóa qua UI. |
| Assumptions | Cơ chế soft delete và audit `deleted_at`/`deleted_by` có sẵn từ `BaseEntity`; hồ sơ đã duyệt (`APPROVED`) là đối tượng được phép xóa theo code hiện tại. |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1 | Thời điểm xóa | `deletedAt` | — | Hệ thống ghi | Gán `LocalDateTime.now()` khi xóa mềm (BaseEntity.java:111-115). |
| 2 | Người xóa | `deletedBy` | — | Hệ thống ghi | Lấy từ session (`operatorId`), không nhận từ client. |
| 3 | Trạng thái — điều kiện xóa | `approvalStatus` | — | Hệ thống kiểm tra | Chỉ `APPROVED` (5) được xóa; khác → từ chối (NavigationChannelService.java:341). |
| 4 | Đối tượng bản đồ | `spatialId` | — | Hệ thống xử lý | Nếu có, xóa `GisSpatialObject` tương ứng (NavigationChannelService.java:344-347). |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-040-01 | Chuyên viên/Lãnh đạo có quyền | Xóa mềm hồ sơ đã duyệt không còn giá trị sử dụng | Danh sách luôn phản ánh hiện trạng | Must Have |
| US-040-02 | Người quản lý | Truy vết người xóa và thời điểm | Kiểm soát trách nhiệm | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-040-01 | US-040-01 | Xóa hồ sơ đã duyệt | Given hồ sơ `APPROVED`, user có `navigationchannel:delete`; When gọi DELETE `/{id}`; Then `deletedAt`/`deletedBy` được gán từ session và API trả thành công | DB: `deleted_at` khác NULL. |
| AC-040-02 | US-040-01 | Xóa hồ sơ không đúng trạng thái | Given hồ sơ khác `APPROVED` (vd `DRAFT`); When gọi DELETE `/{id}`; Then API từ chối, dữ liệu không đổi | Message "Chỉ có luồng hàng hải đã duyệt mới có thể xóa mềm". |
| AC-040-03 | US-040-02 | Ẩn khỏi đọc | Given hồ sơ đã xóa mềm; When gọi danh sách/tìm kiếm; Then hồ sơ không xuất hiện | Filter `deleted_at IS NULL`. |
| AC-040-04 | US-040-02 | Truy cập trực tiếp | Given hồ sơ đã xóa mềm; When gọi GET/PUT/DELETE `/{id}`; Then lỗi "Không tìm thấy luồng hàng hải với id" | HTTP 400-family. |
| AC-040-05 | US-040-01 | Xóa kèm GIS | Given hồ sơ `APPROVED` có `spatialId`; When gọi DELETE `/{id}`; Then đối tượng GIS bị xóa cùng | Không còn bản ghi spatial tương ứng. |
| AC-040-06 | US-040-01 | Phân quyền | Given user thiếu `navigationchannel:delete`; When gọi DELETE; Then HTTP 403; UI không hiển thị nút Xóa | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-040-01 | Chỉ xóa mềm hồ sơ `APPROVED` (5); trạng thái khác → lỗi | AC-040-02 | Không. |
| BR-040-02 | Gán `deletedAt`/`deletedBy` từ session; không xóa cứng | AC-040-01 | Không. |
| BR-040-03 | Xóa GIS spatial object khi có `spatialId` | AC-040-05 | Không. |
| BR-040-04 | Hồ sơ đã xóa ẩn khỏi mọi màn đọc; truy cập trực tiếp → lỗi | AC-040-03, AC-040-04 | Không. |
| BR-040-05 | User thiếu `navigationchannel:delete` → 403 | AC-040-06 | ROLE_SYSTEM_ADMIN vượt qua. |
| BR-040-06 | Hiện tại không ghi history `DELETE` (lệch kỳ vọng work order — chờ PMO chốt) | toàn bộ | Quyết định PMO; nếu bổ sung dùng `ApprovalHistoryUtils.recordSoftDelete`. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Xóa mềm + xóa GIS trong cùng thao tác | Không spatial object mồ côi. |
| Security | RBAC `navigationchannel:delete` + data scope đọc | HTTP 403 khi thiếu quyền hoặc ngoài phạm vi. |
| Auditability | `deletedBy` từ session | Truy vết được người xóa. |
| Reliability | Không xóa cứng; có thể khôi phục qua DB khi cần | Dữ liệu không mất vĩnh viễn. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-040-01 | AC-040-01 | Happy path: xóa hồ sơ `APPROVED` → `deleted_at`/`deleted_by` được ghi | Integration |
| TS-040-02 | AC-040-02 | Negative: xóa hồ sơ `DRAFT` → từ chối với message tiếng Việt, DB không đổi | Integration |
| TS-040-03 | AC-040-03 | Negative: hồ sơ đã xóa không còn trong danh sách/tìm kiếm | Integration |
| TS-040-04 | AC-040-04 | Negative: GET/PUT/DELETE hồ sơ đã xóa → "Không tìm thấy" | Integration |
| TS-040-05 | AC-040-05 | Boundary: xóa hồ sơ có `spatialId` → GIS bị xóa cùng | Integration |
| TS-040-06 | AC-040-06 | Security: thiếu `navigationchannel:delete` → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Dùng `deleted_at`/`deleted_by` từ `BaseEntity`; không thay đổi schema. |
| Architecture affected? | No | Endpoint DELETE `/api/v1/navigation-channel/{id}` đã tồn tại (NavigationChannelController.java:66-71); permission đã seed. |
| Implementation clear? | Yes | Guard trạng thái `APPROVED`, soft delete, GIS cleanup và filter đọc là observable và đã implement. |
| Documentation risk | Medium | 2 điểm lệch với kỳ vọng work order: (1) chỉ xóa được `APPROVED` chứ không nhiều trạng thái; (2) chưa ghi history `DELETE` — đã ghi chú ở brief mục 3, chờ PMO chốt. |
| **Verdict** | `Ready for Solution Designer review` | BA spec mô tả đúng behavior code hiện tại với anchor; điểm lệch đã nêu rõ để PMO quyết định. |
