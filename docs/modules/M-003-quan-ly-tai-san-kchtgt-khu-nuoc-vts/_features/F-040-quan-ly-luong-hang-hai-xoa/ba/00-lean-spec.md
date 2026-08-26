---
feature-id: F-040
document: lean-spec
output-mode: lean
last-updated: 2026-08-26
---
# Xóa Luồng hàng hải

> ### ⚠️ ĐÍNH CHÍNH 26/08/2026 — Điều kiện xóa mềm (quy tắc 11)
>
> Bản trước quy định "chỉ xóa mềm hồ sơ `APPROVED`". Quy định đó **HẾT HIỆU LỰC**: nó không
> xuất phát từ nghiệp vụ mà được viết ngược lại từ code đang chạy (chính ô *Assumptions* của
> tài liệu này ghi "…là đối tượng được phép xóa **theo code hiện tại**").
>
> Nguồn có thẩm quyền — `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`, nói nhất quán ở bốn chỗ:
>
> | Vị trí | Nội dung |
> | :--- | :--- |
> | Bảng 7 trạng thái | "Đã xóa (lịch sử) — Hồ sơ đã bị xóa (**chỉ xóa được khi đang "Lưu tạm"**)" |
> | Sơ đồ trạng thái | `Nhap --> DaXoa: Xóa` — chỉ một mũi tên vào "Đã xóa", xuất phát từ "Lưu tạm" |
> | Ca dùng 9 — Xóa hồ sơ nháp | Người thực hiện: **Người nhập hồ sơ** · Điều kiện trước: **Hồ sơ đang "Lưu tạm"** |
> | Bảng chuyển trạng thái (mục 7) | `Lưu tạm │ Xóa │ Đã xóa (lịch sử) │ Người nhập` — không có dòng `Đã duyệt → Xóa` |
>
> Và **Case test bắt buộc** của tài liệu gốc ghi thẳng: *"không được xóa hồ sơ khi không ở
> trạng thái "Lưu tạm""*. Chuẩn hóa tại `docs/conventions/approval-2-level-spec.md` **mục 3.6**.
>
> **Quy tắc đúng:** chỉ xóa mềm được hồ sơ **`DRAFT` (Lưu tạm)**, do **người nhập** thực hiện,
> cần quyền `navigationchannel:delete`. Mọi trạng thái khác — kể cả `APPROVED` — đều **từ chối**.
>
> **Vì sao quy định cũ sai về hệ quả:**
> 1. Hồ sơ **Lưu tạm** (bản nháp gõ dở, chưa ai duyệt) không xóa được → tồn đọng vĩnh viễn.
> 2. Hồ sơ **Đã duyệt** đang có hiệu lực, đã qua 2 cấp ký, lại xóa được chỉ với quyền
>    `navigationchannel:delete` — không cần quyền phê duyệt nào. Trong khi *sửa* hồ sơ đó
>    (quy tắc 12) đòi `approvec2`. Xóa nặng hơn sửa mà lại dễ hơn.
> 3. Backend dùng chung `InfrastructureApprovalService.assertDeletable()`; frontend chỉ hiện
>    nút Xóa khi `approvalStatus === 'DRAFT'`.



## Summary

Hệ thống cho phép người nhập có `navigationchannel:delete` xóa mềm hồ sơ Luồng hàng hải **đang ở trạng thái Lưu tạm** (`DRAFT` = 0). Hệ thống gán `deletedAt`/`deletedBy` từ session người thao tác, xóa đối tượng GIS nếu có, và hồ sơ bị xóa biến mất khỏi danh sách/tìm kiếm/chi tiết nhờ filter `deleted_at IS NULL`. Hồ sơ ở trạng thái khác `APPROVED` bị từ chối. Code hiện tại KHÔNG ghi dòng history `DELETE` (utility `ApprovalHistoryUtils.recordSoftDelete` chưa có caller) — điểm lệch với kỳ vọng work order ban đầu, cần PMO chốt (brief mục 3 đã ghi chú).

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm hồ sơ `DRAFT`; gán `deletedAt`/`deletedBy` từ session; xóa GIS spatial object khi có; ẩn hồ sơ đã xóa khỏi đọc; từ chối xóa hồ sơ không ở trạng thái `DRAFT` hoặc không tồn tại/đã xóa; endpoint `DELETE /api/v1/navigation-channel/{id}` với quyền `navigationchannel:delete`. |
| Out of scope | Xóa cứng (physical delete); ghi history `DELETE` (chờ PMO chốt — nếu chốt làm sẽ là task dev riêng dùng `ApprovalHistoryUtils.recordSoftDelete`); xóa hàng loạt; khôi phục hồ sơ đã xóa qua UI. |
| Assumptions | Cơ chế soft delete và audit `deleted_at`/`deleted_by` có sẵn từ `BaseEntity`. Điều kiện trạng thái lấy từ `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (Ca dùng 9 + bảng chuyển trạng thái mục 7), **không** suy ra từ code. |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1 | Thời điểm xóa | `deletedAt` | — | Hệ thống ghi | Gán `LocalDateTime.now()` khi xóa mềm (BaseEntity.java:111-115). |
| 2 | Người xóa | `deletedBy` | — | Hệ thống ghi | Lấy từ session (`operatorId`), không nhận từ client. |
| 3 | Trạng thái — điều kiện xóa | `approvalStatus` | — | Hệ thống kiểm tra | Chỉ `DRAFT` (0) được xóa; khác → từ chối qua `InfrastructureApprovalService.assertDeletable()` (NavigationChannelService.java:341). |
| 4 | Đối tượng bản đồ | `spatialId` | — | Hệ thống xử lý | Nếu có, xóa `GisSpatialObject` tương ứng (NavigationChannelService.java:344-347). |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-040-01 | Người nhập hồ sơ | Xóa mềm hồ sơ nháp nhập nhầm hoặc không dùng nữa | Danh sách không tồn đọng bản nháp rác | Must Have |
| US-040-02 | Người quản lý | Truy vết người xóa và thời điểm | Kiểm soát trách nhiệm | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-040-01 | US-040-01 | Xóa hồ sơ nháp | Given hồ sơ `DRAFT`, user có `navigationchannel:delete`; When gọi DELETE `/{id}`; Then `deletedAt`/`deletedBy` được gán từ session và API trả thành công | DB: `deleted_at` khác NULL. |
| AC-040-02 | US-040-01 | Xóa hồ sơ không đúng trạng thái | Given hồ sơ khác `DRAFT` (vd `APPROVED`, `PENDING_APPROVAL`); When gọi DELETE `/{id}`; Then API từ chối, dữ liệu không đổi | Message "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm". |
| AC-040-03 | US-040-02 | Ẩn khỏi đọc | Given hồ sơ đã xóa mềm; When gọi danh sách/tìm kiếm; Then hồ sơ không xuất hiện | Filter `deleted_at IS NULL`. |
| AC-040-04 | US-040-02 | Truy cập trực tiếp | Given hồ sơ đã xóa mềm; When gọi GET/PUT/DELETE `/{id}`; Then lỗi "Không tìm thấy luồng hàng hải với id" | HTTP 400-family. |
| AC-040-05 | US-040-01 | Xóa kèm GIS | Given hồ sơ `DRAFT` có `spatialId`; When gọi DELETE `/{id}`; Then đối tượng GIS bị xóa cùng | Không còn bản ghi spatial tương ứng. |
| AC-040-06 | US-040-01 | Phân quyền | Given user thiếu `navigationchannel:delete`; When gọi DELETE; Then HTTP 403; UI không hiển thị nút Xóa | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-040-01 | Chỉ xóa mềm hồ sơ `DRAFT` (0) — quy tắc 11, `approval-2-level-spec.md` mục 3.6; trạng thái khác (kể cả `APPROVED`) → lỗi | AC-040-02 | Không. |
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
| TS-040-01 | AC-040-01 | Happy path: xóa hồ sơ `DRAFT` → `deleted_at`/`deleted_by` được ghi | Integration |
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
| Implementation clear? | Yes | Guard trạng thái `DRAFT` qua `assertDeletable()`, soft delete, GIS cleanup và filter đọc là observable và đã implement. |
| Documentation risk | Medium | (1) Điều kiện xóa đã đính chính về `DRAFT` theo tài liệu nền (đợt rà soát 26/08/2026); (2) chưa ghi history `DELETE` — đã ghi chú ở brief mục 3, chờ PMO chốt. |
| **Verdict** | `Ready for Solution Designer review` | BA spec mô tả đúng behavior code hiện tại với anchor; điểm lệch đã nêu rõ để PMO quyết định. |
