---
feature-id: F-082
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xóa Nhà trạm phao

## Summary

Tính năng cho phép người dùng có quyền `buoystation:delete` xóa mềm hồ sơ Nhà trạm phao (`BuoyStation`, `@Table buoy_station`) qua `DELETE /api/v1/buoy-station/{id}`. Quy tắc xóa theo approval-2-level-spec mục 3.6: **chỉ xóa được hồ sơ `DRAFT`**, do người nhập thực hiện; mọi trạng thái khác — kể cả `APPROVED` — bị từ chối (403). Xóa là xóa mềm: `deletedAt`/`deletedBy` được set, bản ghi không biến mất khỏi database, `@SQLRestriction("deleted_at IS NULL")` ẩn khỏi mọi query; ghi nhật ký qua `ApprovalHistoryUtils.recordSoftDelete`. Nguồn field map: sheet "QL Nhà trạm phao tiêu" (sheet thay thế cho "QL Nhà trạm phao" không tồn tại).

## Scope

| | Items |
|---|---|
| In scope | Xóa mềm hồ sơ `DRAFT` qua DELETE; set `deletedAt`/`deletedBy` + audit `recordSoftDelete`; chặn xóa mọi trạng thái khác (403); xóa cả tọa độ GIS (`spatialId`) liên quan nếu có; data scope theo `unitId`; phân quyền `buoystation:delete`. |
| Out of scope | Xóa cứng vật lý; phê duyệt (F-083); sửa (F-081); lịch sử (F-085); xóa bản ghi `Buoy` con (module khác); migration. |
| Assumptions | User đăng nhập có quyền `buoystation:delete`; hồ sơ thuộc phạm vi đơn vị user; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (sheet thay thế cho "QL Nhà trạm phao"). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa. Với F-082 chỉ các cột hiển thị danh sách và trạng thái có vai trò quyết định; ma trận đầy đủ dùng chung F-080.

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
| US-082-01 | Chuyên viên | Xóa hồ sơ nhà trạm tạo nhầm khi đang `DRAFT` | Dọn dữ liệu nhập sai trước khi gửi duyệt | Must Have |
| US-082-02 | Chuyên viên | Không xóa được hồ sơ đã gửi duyệt/đã duyệt | Bảo toàn hồ sơ có hiệu lực pháp lý | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-082-01 | US-082-01 | Xóa hồ sơ DRAFT | Given hồ sơ `DRAFT` và user có `buoystation:delete`; When DELETE `/api/v1/buoy-station/{id}`; Then set `deletedAt`/`deletedBy`, ghi audit `recordSoftDelete`, bản ghi biến mất khỏi danh sách/tìm kiếm | Xóa mềm, không xóa vật lý |
| AC-082-02 | US-082-02 | Chặn xóa hồ sơ không phải DRAFT | Given hồ sơ `PENDING_APPROVAL`/`APPROVED_LEVEL1`/`APPROVED`/`ARCHIVED`; When DELETE; Then 403 "Chỉ xóa được hồ sơ ở trạng thái Lưu tạm"; UI ẩn nút Xóa | `InfrastructureApprovalService.assertDeletable` |
| AC-082-03 | US-082-01 | Xóa GIS đồng bộ | Given hồ sơ có `spatialId`; When xóa; Then `gisSpatialObjectService.delete(spatialId)` + `spatialId = null` | Đồng bộ tọa độ tập trung |
| AC-082-04 | US-082-01 | Data scope | Given hồ sơ ngoài phạm vi đơn vị user; When DELETE; Then 403 | `validateAllowedOrgUnit` |
| AC-082-05 | US-082-01 | Phân quyền | Given user thiếu `buoystation:delete`; When DELETE; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-082-01 | Chỉ xóa được hồ sơ `DRAFT`, do người nhập thực hiện, cần `buoystation:delete`; mọi trạng thái khác từ chối (403) | AC-082-02 | Không — hồ sơ hết giá trị thì đổi tình trạng hoạt động, không xóa |
| BR-082-02 | Xóa là xóa mềm: set `deletedAt`/`deletedBy`, không xóa khỏi CSDL; `@SQLRestriction("deleted_at IS NULL")` ẩn khỏi query | AC-082-01 | Không |
| BR-082-03 | Ghi audit qua `ApprovalHistoryUtils.recordSoftDelete(historyRepository, id, type, userId, "Xóa: " + name)` | AC-082-01 | Không |
| BR-082-04 | Nếu `spatialId != null` → xóa `gis_spatial_objects` qua `GisSpatialObjectService.delete` và set null | AC-082-03 | Không |
| BR-082-05 | Data scope: hồ sơ phải thuộc phạm vi đơn vị user khi xóa | AC-082-04 | Admin Cục/Cục full scope |
| BR-082-06 | Frontend: nút Xóa chỉ hiện khi `normalizeApprovalStatus(status) === 'DRAFT'` (`canDeleteApprovalRecord`) | AC-082-02 | Không |

## Domain Model

Cùng entity `BuoyStation` như F-080/F-081. Xóa mềm dựa trên `deletedAt`/`deletedBy` (kế thừa `BaseEntity`) + `@SQLRestriction`. Trạng thái xóa thể hiện qua `approvalStatus = ARCHIVED` theo mô hình 7 trạng thái (approval-2-level-spec mục 3.1) khi nghiệp vụ yêu cầu lưu lịch sử.

## 2-level approval flow (góc độ xóa)

Xóa không phải một bước của vòng duyệt: chỉ được xóa ở `DRAFT` (chưa vào vòng nào). Hồ sơ đã qua duyệt dùng "đổi tình trạng hoạt động" thay vì xóa.

## Validation Rules

- Trạng thái phải là `DRAFT`; ngược lại 403 với message tiếng Việt.
- Hồ sơ phải tồn tại và trong phạm vi đơn vị.
- Không nhận reason từ client (khác F-094 dùng reason — xem note tại F-094).

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-082-01 | AC-082-01 | Happy path: xóa `DRAFT` → soft delete, biến mất khỏi list/search, audit ghi nhận | Integration |
| TS-082-02 | AC-082-02 | Negative: DELETE hồ sơ `APPROVED` → 403 | Integration |
| TS-082-03 | AC-082-03 | Boundary: hồ sơ có `spatialId` → GIS bị xóa đồng bộ | Integration |
| TS-082-04 | AC-082-04 | Security: xóa hồ sơ ngoài phạm vi → 403 | Security |
| TS-082-05 | AC-082-05 | Security: thiếu `buoystation:delete` → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Soft-delete `BuoyStation` + đồng bộ GIS. |
| Architecture affected? | Low/Medium | `DELETE /api/v1/buoy-station/{id}` + `buoystation:delete` + `ApprovalHistoryUtils.recordSoftDelete` có sẵn. |
| Implementation clear? | Yes | Chỉ xóa `DRAFT`, soft delete, audit, xóa GIS là rõ ràng. |
| Documentation risk | Medium | Feature-brief F-082 dẫn `DELETE /api/v1/buoys/{id}` + bảng `buoy_stations`/`is_deleted` — drift: endpoint `/api/v1/buoy-station/{id}`, bảng `buoy_station`, soft delete qua `deleted_at`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa điều kiện xóa, soft-delete behavior và data scope. |
