---
feature-id: F-094
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Nhà trạm phao tiêu

## Summary

Tính năng cho phép người dùng có quyền `buoystation:delete` xóa mềm hồ sơ Nhà trạm phao tiêu qua `DELETE /api/v1/buoy-station/{id}` — **cùng entity `BuoyStation`** (`@Table buoy_station`) với F-082. Quy tắc xóa theo approval-2-level-spec mục 3.6: **chỉ xóa được hồ sơ `DRAFT`**, do người nhập; trạng thái khác — kể cả `APPROVED` — từ chối (403). Xóa mềm: set `deletedAt`/`deletedBy`, `@SQLRestriction("deleted_at IS NULL")` ẩn khỏi query, ghi audit `recordSoftDelete`; xóa GIS `spatialId` nếu có. **DRIFT (brief):** F-094 dẫn `DELETE /api/v1/buoy-beacon-stations/{id}` + body `{"reason": "..."}` + soft delete toàn bộ cây dữ liệu (`BuoyBeaconStationCoordinate`/`Attachment`/`Change`) — thực tế endpoint `/api/v1/buoy-station/{id}`; entity thực tế không có bảng coordinate/change riêng (tọa độ qua `spatialId`/`coordinates`, nhật ký qua `infrastructure_history`). Nguồn field map: sheet "QL Nhà trạm phao tiêu" (sheet gốc).

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm hồ sơ `DRAFT`; set `deletedAt`/`deletedBy` + audit; chặn trạng thái khác (403); xóa GIS (`spatialId`) nếu có; data scope theo `unitId`; phân quyền `buoystation:delete`. |
| Out of scope | Xóa cứng; xóa `Buoy` con (module khác); phê duyệt; sửa (F-093); migration. |
| Assumptions | User đăng nhập có quyền; hồ sơ thuộc phạm vi; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (~line 740) — sheet gốc. Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa. Với F-094 chỉ trạng thái (#40) và danh sách quyết định; ma trận đầy đủ dùng chung F-092.

| # | Label | Technical field | Control | Required | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã nhà trạm | `code` | Input (disabled, tự sinh `NT-{seq}`) | Không (auto) | Có | Có | Có | Có | Có |
| 2 | Tên nhà trạm | `name` | InputTextArea | **Có** | Có | Có | Có | Có | Có |
| 3 | Đơn vị quản lý | `unitId` | SelectOrgCode | **Có (khi tạo)** | Có | Có | Có | Có | Có |
| 4 | Đơn vị khai thác | `operatingOrgId` | SelectCateOther | **Có** | Có | Không | Có | Có | Có |
| 5 | Thuộc cảng biển | `portId` | SelectKcht (CB) | Không | Có | Có | Có | Có | Có |
| 6 | Thuộc luồng hàng hải | `waterwayId` | SelectKcht (LHH) | **Có** | Có | Có | Có | Có | Có |
| 7 | Tuyến luồng hàng hải | `waterwayRouteId` | SelectKcht (LHH_TL) | Không | Không | Không | Có | Có | Có |
| 8 | Địa điểm (Tỉnh/TP) | `province` / `provinceId` | SelectCateOther | **Có** | Không | Có | Có | Có | Có |
| 9 | Địa điểm chi tiết | `address` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 10 | Thời điểm xây dựng | `constructionDate` | DatePicker | Không | Không | Không | Có | Có | Có |
| 11 | Tình trạng | `condition` (entity còn `status` StationStatus) | SelectAppParams | **Có** | Có | Có | Có | Có | Có |
| 12 | Tổng diện tích (m²) | `totalArea` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 13 | Diện tích sử dụng (m²) | `usableArea` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 14 | Số lượng nhân sự bố trí | `staffCount` | Input | **Có** | Không | Không | Có | Có | Có |
| 15 | Năm bảo trì gần nhất | `lastMaintenanceYear` | DatePicker (năm) | Không | Không | Không | Có | Có | Có |
| 16 | Ghi chú | `note` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 17 | Loại đối tượng | `objectType` / `geometryType` | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Có | Có |
| 18 | Biểu tượng | `icon` | Select | Không | Không | Không | Có | Có | Có |
| 19 | Hệ quy chiếu | `coordinateSystem` | Text | Không | Không | Không | Có | Có | Có |
| 20 | Quy tắc hiển thị | `displayFormat` | Text | Không | Không | Không | Có | Có | Có |
| 21 | Tọa độ GIS | `latitude`/`longitude`/`coordinates` | LocationInformationForm | Không | Không | Không | Có | Có | Có |
| 22 | File đính kèm | `attachments` | UploadFileTable | Không | Không | Không | Có | Có | Có |
| 23-39 | Phao tiêu + vận hành/bảo trì/sự cố | `buoy.*`, `operationPlan*`, `maintenancePlan*`, `incident*` | Text (read-only) | — | 25,26: Có | 25,26: Có | Có | Không | Không |
| 40 | Trạng thái | `approvalStatus` | Badge (read-only) | — | Có | Có | Có | Không | Không |
| 41 | Ngày cập nhật | `updatedAt` | Text (read-only) | — | Có | Có | Có | Không | Không |
| 42 | Cán bộ cập nhật | `updatedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 43-50 | Thông tin gửi/phê duyệt C1/C2 | `sentApproved*`, `level1/level2Approved*`, `level1/level2ApprovalContent` | Text (read-only) | — | 43-46,48,49: Có | Không | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-094-01 | Chuyên viên | Xóa hồ sơ tạo nhầm khi `DRAFT` | Dọn dữ liệu sai | Must Have |
| US-094-02 | Chuyên viên | Không xóa được hồ sơ đã duyệt | Bảo toàn hồ sơ có hiệu lực | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-094-01 | US-094-01 | Xóa DRAFT | Given hồ sơ `DRAFT` + `buoystation:delete`; When DELETE `/api/v1/buoy-station/{id}`; Then set `deletedAt`/`deletedBy`, ghi audit, biến mất khỏi list/search | Xóa mềm |
| AC-094-02 | US-094-02 | Chặn xóa không phải DRAFT | Given hồ sơ khác `DRAFT`; When DELETE; Then 403; UI ẩn nút | `assertDeletable` |
| AC-094-03 | US-094-01 | Xóa GIS | Given hồ sơ có `spatialId`; When xóa; Then xóa `gis_spatial_objects` + `spatialId=null` | Đồng bộ GIS |
| AC-094-04 | US-094-01 | Data scope | Given hồ sơ ngoài phạm vi; When DELETE; Then 403 | `unit_id` filter |
| AC-094-05 | US-094-01 | Phân quyền | Given thiếu `buoystation:delete`; When DELETE; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-094-01 | Chỉ xóa hồ sơ `DRAFT`, do người nhập, cần `buoystation:delete`; trạng thái khác 403 | AC-094-02 | Hồ sơ hết giá trị → đổi tình trạng hoạt động |
| BR-094-02 | Xóa mềm: set `deletedAt`/`deletedBy`, không xóa vật lý; `@SQLRestriction("deleted_at IS NULL")` ẩn khỏi query | AC-094-01 | Không |
| BR-094-03 | Ghi audit qua `ApprovalHistoryUtils.recordSoftDelete` | AC-094-01 | Không |
| BR-094-04 | Nếu `spatialId != null` → xóa GIS qua `GisSpatialObjectService.delete` | AC-094-03 | Không |
| BR-094-05 | Data scope `unit_id` khi xóa | AC-094-04 | Admin Cục/Cục full |
| BR-094-06 | **DRIFT (brief):** F-094 dẫn `DELETE /api/v1/buoy-beacon-stations/{id}` + body `reason` + soft delete cây dữ liệu (`Coordinate`/`Attachment`/`Change`) — thực tế `/api/v1/buoy-station/{id}` không nhận reason; coordinate/change không tồn tại như entity riêng (tọa độ qua `spatialId`, nhật ký qua `infrastructure_history`); ghi nhận, không sửa brief | AC-094-01 | Không |
| BR-094-07 | Frontend: nút Xóa chỉ hiện khi `normalizeApprovalStatus(status) === 'DRAFT'` | AC-094-02 | Không |

## Domain Model

Cùng entity `BuoyStation` như F-092. Soft delete qua `deletedAt`/`deletedBy` + `@SQLRestriction`. Trạng thái `ARCHIVED` khi cần lưu lịch sử.

## 2-level approval flow (góc độ xóa)

Chỉ xóa ở `DRAFT` (chưa vào vòng duyệt). Hồ sơ đã duyệt dùng "đổi tình trạng hoạt động".

## Validation Rules

- Trạng thái phải `DRAFT`; ngược lại 403 tiếng Việt.
- Hồ sơ tồn tại và trong phạm vi đơn vị.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-094-01 | AC-094-01 | Happy path: xóa DRAFT → soft delete + audit | Integration |
| TS-094-02 | AC-094-02 | Negative: DELETE hồ sơ APPROVED → 403 | Integration |
| TS-094-03 | AC-094-03 | Boundary: có spatialId → xóa GIS đồng bộ | Integration |
| TS-094-04 | AC-094-04 | Security: ngoài phạm vi → 403 | Security |
| TS-094-05 | AC-094-05 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Soft-delete `BuoyStation` + GIS; brief dùng cây entity cũ không tồn tại. |
| Architecture affected? | Low/Medium | `DELETE /api/v1/buoy-station/{id}` + `buoystation:delete` đã có. |
| Implementation clear? | Yes | Chỉ xóa DRAFT, soft delete, audit, xóa GIS rõ ràng. |
| Documentation risk | Medium | Brief F-094 dẫn endpoint/body/cây entity cũ — drift; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa điều kiện xóa, soft-delete và data scope. |
