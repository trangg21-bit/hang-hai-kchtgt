---
feature-id: F-088
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Nhà trạm đèn

## Summary

Tính năng cho phép người dùng có quyền `beaconstation:delete` xóa mềm hồ sơ Nhà trạm đèn (`BeaconStation`, `@Table beacon_light`) qua `DELETE /api/beacon-stations/{id}`. Quy tắc xóa theo approval-2-level-spec mục 3.6: **chỉ xóa được hồ sơ `DRAFT`**, do người nhập thực hiện; mọi trạng thái khác — kể cả `APPROVED` — bị từ chối (403). Xóa là xóa mềm: `deletedAt`/`deletedBy` được set, `@SQLRestriction("deleted_at IS NULL")` ẩn khỏi query; ghi audit `recordSoftDelete`. Nguồn field map: sheet "QL Đèn biển và nhà trạm".

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm hồ sơ `DRAFT` qua DELETE; set `deletedAt`/`deletedBy` + audit; chặn xóa trạng thái khác (403); xóa GIS (`spatialId`) nếu có; data scope theo `orgUnitId`; phân quyền `beaconstation:delete`. |
| Out of scope | Xóa cứng; phê duyệt (F-089); sửa (F-087); lịch sử (F-091); migration. |
| Assumptions | User đăng nhập có quyền; hồ sơ thuộc phạm vi; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Đèn biển và nhà trạm" (line ~113). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa. Với F-088 chỉ trạng thái (#57) và danh sách quyết định; ma trận đầy đủ dùng chung F-086.

| # | Label | Technical field | Control | Required | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã đèn biển | `code` | Input (disabled, tự sinh `DBNT-%06d`) | Không (auto) | Có | Có | Có | Có | Có |
| 2 | Tên đèn biển | `name` | InputTextArea | **Có** | Có | Có | Có | Có | Có |
| 3 | Đơn vị quản lý | `orgUnitId` | SelectOrgCode | **Có** | Có | Có | Có | Có | Có |
| 4-8 | Thuộc cảng biển, đơn vị vận hành, địa điểm, tình trạng | `seaportId`, `operator`/`unitId`, `provinceId`, `status`/`operationalStatus` | Select | Không | Có | Có | Có | Có | Có |
| 9-28 | Kỹ thuật đèn + nhà trạm | `primaryLightModel`...`note` | Input/TextArea | 18: Có | 11: Có | 9,11,21: Có | Có | Có | Có |
| 29-33 | GIS | `geometryType`, `mapSymbolId`, `coordinateSystem`, `displayRule`, `coordinates` | Select/LongLatTable | Không | Không | Không | Có | Có | Có |
| 34 | Danh sách file | `attachments` | UploadFileTable | Không | Không | Không | Có | Có | Có |
| 35-46 | Vận hành/bảo trì/sự cố | plan*/incident* (read-only) | Text (read-only) | — | Không | Không | Có | 46: Có | Không |
| 47 | Ngày cập nhật | `updatedAt` | Textarea | — | Có | Có | Có | Không | Không |
| 48 | Cán bộ cập nhật | `updatedBy` | Textarea | — | Có | Có | Có | Không | Không |
| 49-56 | Thông tin gửi/phê duyệt | submitted/level1/level2 (history) | Textarea | — | 49,51,52,54,55: Có | Không | Có | Không | Không |
| 57 | Trạng thái | `approvalStatus` | Select (Dropdown) | — | Có | Có | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-088-01 | Chuyên viên | Xóa hồ sơ tạo nhầm khi `DRAFT` | Dọn dữ liệu sai | Must Have |
| US-088-02 | Chuyên viên | Không xóa được hồ sơ đã duyệt | Bảo toàn hồ sơ có hiệu lực | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-088-01 | US-088-01 | Xóa DRAFT | Given hồ sơ `DRAFT` + `beaconstation:delete`; When DELETE `/api/beacon-stations/{id}`; Then set `deletedAt`/`deletedBy`, ghi audit, biến mất khỏi list/search | Xóa mềm |
| AC-088-02 | US-088-02 | Chặn xóa không phải DRAFT | Given hồ sơ khác `DRAFT`; When DELETE; Then 403; UI ẩn nút | `assertDeletable` |
| AC-088-03 | US-088-01 | Xóa GIS | Given hồ sơ có `spatialId`; When xóa; Then xóa `gis_spatial_objects` + `spatialId=null` | Đồng bộ GIS |
| AC-088-04 | US-088-01 | Data scope | Given hồ sơ ngoài phạm vi; When DELETE; Then 403 | `org_unit_id` filter |
| AC-088-05 | US-088-01 | Phân quyền | Given thiếu `beaconstation:delete`; When DELETE; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-088-01 | Chỉ xóa hồ sơ `DRAFT`, do người nhập, cần `beaconstation:delete`; trạng thái khác 403 | AC-088-02 | Hồ sơ hết giá trị → đổi tình trạng hoạt động |
| BR-088-02 | Xóa mềm: set `deletedAt`/`deletedBy`, không xóa vật lý; `@SQLRestriction("deleted_at IS NULL")` ẩn khỏi query | AC-088-01 | Không |
| BR-088-03 | Ghi audit qua `ApprovalHistoryUtils.recordSoftDelete` | AC-088-01 | Không |
| BR-088-04 | Nếu `spatialId != null` → xóa GIS qua `GisSpatialObjectService.delete` | AC-088-03 | Không |
| BR-088-05 | Data scope `org_unit_id` khi xóa | AC-088-04 | Admin Cục/Cục full |
| BR-088-06 | Frontend: nút Xóa chỉ hiện khi `normalizeApprovalStatus(status) === 'DRAFT'` | AC-088-02 | Không |

## Domain Model

Cùng entity `BeaconStation` như F-086. Soft delete qua `deletedAt`/`deletedBy` + `@SQLRestriction`. Trạng thái `ARCHIVED` khi cần lưu lịch sử.

## 2-level approval flow (góc độ xóa)

Chỉ xóa ở `DRAFT` (chưa vào vòng duyệt). Hồ sơ đã duyệt dùng "đổi tình trạng hoạt động".

## Validation Rules

- Trạng thái phải `DRAFT`; ngược lại 403 tiếng Việt.
- Hồ sơ tồn tại và trong phạm vi đơn vị.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-088-01 | AC-088-01 | Happy path: xóa DRAFT → soft delete + audit | Integration |
| TS-088-02 | AC-088-02 | Negative: DELETE hồ sơ APPROVED → 403 | Integration |
| TS-088-03 | AC-088-03 | Boundary: có spatialId → xóa GIS đồng bộ | Integration |
| TS-088-04 | AC-088-04 | Security: ngoài phạm vi → 403 | Security |
| TS-088-05 | AC-088-05 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Soft-delete `BeaconStation` + GIS. |
| Architecture affected? | Low/Medium | `DELETE /api/beacon-stations/{id}` + `beaconstation:delete` đã có. |
| Implementation clear? | Yes | Chỉ xóa DRAFT, soft delete, audit, xóa GIS rõ ràng. |
| Documentation risk | Medium | Feature-brief F-088 dẫn `DELETE /api/v1/beacons/{id}` + bảng `beacon_stations`/`is_deleted` — drift: endpoint `/api/beacon-stations/{id}`, bảng `beacon_light`, soft delete qua `deleted_at`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa điều kiện xóa, soft-delete và data scope. |
