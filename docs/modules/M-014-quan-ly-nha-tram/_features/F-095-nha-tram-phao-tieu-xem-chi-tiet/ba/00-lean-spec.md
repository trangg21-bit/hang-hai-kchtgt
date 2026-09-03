---
feature-id: F-095
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xem chi tiết Nhà trạm phao tiêu

## Summary

Tính năng cho phép người dùng có quyền `buoystation:read` xem chi tiết hồ sơ Nhà trạm phao tiêu qua `GET /api/v1/buoy-station/{id}` — **cùng entity `BuoyStation`** (`@Table buoy_station`) với F-084. Màn chi tiết hiển thị theo field map Excel sheet "QL Nhà trạm phao tiêu" (sheet gốc): thông tin chung #1-#16, GIS #17-#21, file #22, danh sách phao tiêu #23-#27 (child `Buoy` read-only), vận hành/bảo trì/sự cố #28-#39 (read-only), xử lý & theo dõi #40-#50 (read-only). Response kèm `unitName`. Admin Cục xem metadata nhạy cảm qua `view_sensitive`. Data scope theo `unitId`. **DRIFT (brief):** F-095 dẫn `GET /api/v1/buoy-beacon-stations/{id}/detail` + composite DTO `BuoyBeaconStationDetail` (8 nhóm) + cache 5 phút — thực tế `GET /api/v1/buoy-station/{id}` + `BuoyStationResponse`; brief cũng dẫn các bảng `BuoyBeaconStationCoordinate`/`Attachment` không tồn tại.

## Scope

| | Items |
|---|---|
| In scope | GET chi tiết 1 hồ sơ; hiển thị các nhóm #1-#50 đúng trạng thái read-only; trả `unitName`; danh sách file; danh sách phao tiêu child; metadata phê duyệt; Admin Cục xem metadata nhạy cảm; data scope theo `unitId`; phân quyền `buoystation:read`. |
| Out of scope | Sửa (F-093); xóa (F-094); author spec `Buoy`; migration. |
| Assumptions | User đăng nhập có `buoystation:read`; hồ sơ thuộc phạm vi; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (~line 740) — sheet gốc. Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

| # | Label | Technical field | Control | Required | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã nhà trạm | `code` | Input (disabled, tự sinh `NT-{seq}`) | Không (auto) | Có | Có | Có | Có | Có |
| 2 | Tên nhà trạm | `name` | InputTextArea | **Có** | Có | Có | Có | Có | Có |
| 3 | Đơn vị quản lý | `unitId` (+ `unitName`) | SelectOrgCode | **Có (khi tạo)** | Có | Có | Có | Có | Có |
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
| 23 | Mã phao, tiêu | `buoy.code` (child read-only) | Text (read-only) | — | Không | Không | Có | Không | Không |
| 24 | Tên phao, tiêu | `buoy.name` (child read-only) | Text (read-only) | — | Không | Không | Có | Không | Không |
| 25 | Phân loại | `buoy.type` (child read-only) | Text (read-only) | — | Có | Có | Có | Không | Không |
| 26 | Phân loại phao | `buoyType` (child read-only) | Text (read-only) | — | Có | Có | Có | Không | Không |
| 27 | Phân loại tiêu | `buoy.beaconType` (child read-only) | Text (read-only) | — | Có | Không | Có | Không | Không |
| 28-31 | Thông tin vận hành khai thác | `operationPlanCode`/`operationPlanName`/`operationStartDate`/`operationEndDate` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 32-35 | Thông tin bảo trì | `maintenancePlanCode`/`maintenancePlanName`/`maintenanceStartTime`/`maintenanceEndTime` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 36-39 | Thông tin sự cố | `incidentCode`/`incidentType`/`incidentLocation`/`incidentTime` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 40 | Trạng thái | `approvalStatus` | Badge (read-only) | — | Có | Có | Có | Không | Không |
| 41 | Ngày cập nhật | `updatedAt` | Text (read-only) | — | Có | Có | Có | Không | Không |
| 42 | Cán bộ cập nhật | `updatedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 43 | Ngày gửi phê duyệt | `sentApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 44 | Cán bộ gửi phê duyệt | `sentApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 45 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 46 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 47 | Nội dung phê duyệt | `level1ApprovalContent` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 48 | Ngày phê duyệt cấp Cục | `level2ApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 49 | Cán bộ phê duyệt cấp Cục | `level2ApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 50 | Nội dung phê duyệt | `level2ApprovalContent` | Text (read-only) | — | Không | Không | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-095-01 | Người xem | Xem toàn bộ thông tin hồ sơ nhà trạm phao tiêu | Tra cứu đầy đủ ngữ cảnh | Must Have |
| US-095-02 | Người xem | Xem danh sách phao tiêu thuộc trạm | Ngữ cảnh phao tiêu | Should Have |
| US-095-03 | Admin Cục | Xem metadata nhạy cảm | Theo dõi trách nhiệm | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-095-01 | US-095-01 | Hiển thị đầy đủ field map | Given user có `buoystation:read` + hồ sơ tồn tại; When GET `/api/v1/buoy-station/{id}`; Then trả về đủ #1-#50, read-only đúng nhóm | Không placeholder |
| AC-095-02 | US-095-01 | Trả unitName | Given hồ sơ có đơn vị; When GET; Then response kèm `unitName` | `OrgUnitCacheService` |
| AC-095-03 | US-095-02 | Danh sách phao tiêu child | Given trạm có Buoy con; When GET; Then tab #23-#27 hiển thị read-only từ `Buoy` (FK `buoy_station_id`) | Buoy module khác, chỉ đọc |
| AC-095-04 | US-095-03 | Admin Cục xem metadata | Given Admin Cục/`view_sensitive`; When xem; Then thấy `createdBy/createdAt/updatedBy/updatedAt` | Người khác không thấy |
| AC-095-05 | US-095-01 | Data scope | Given hồ sơ ngoài phạm vi; When GET; Then 403/404 | `unit_id` filter |
| AC-095-06 | US-095-01 | Phân quyền | Given thiếu `buoystation:read`; When GET; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-095-01 | Màn chi tiết hiển thị đúng field map #1-#50 theo sheet "QL Nhà trạm phao tiêu" (sheet gốc) | AC-095-01 | Không |
| BR-095-02 | Response trả cả `unitId`/`unitName` (qua `OrgUnitCacheService`) | AC-095-02 | Không |
| BR-095-03 | Danh sách phao tiêu #23-#27 là child `Buoy` read-only | AC-095-03 | Không |
| BR-095-04 | Metadata nhạy cảm chỉ hiển thị cho Admin Cục/`view_sensitive` | AC-095-04 | Không |
| BR-095-05 | Không gán dữ liệu giả khi nguồn rỗng | AC-095-01 | Không |
| BR-095-06 | Data scope `unit_id`; Cục full | AC-095-05 | `orgunit:scope_all`/`admin:all` |
| BR-095-07 | **DRIFT (brief):** F-095 dẫn `GET /api/v1/buoy-beacon-stations/{id}/detail` + `BuoyBeaconStationDetail` 8 nhóm + cache 5 phút + bảng `BuoyBeaconStationCoordinate`/`Attachment` — thực tế `GET /api/v1/buoy-station/{id}` + `BuoyStationResponse`; coordinate/attachment là khái niệm cũ, tọa độ qua `spatialId`; ghi nhận, không sửa brief | AC-095-01 | Không |
| BR-095-08 | Permission `buoystation:read` (fallback `data:read`) | AC-095-06 | ROLE_SYSTEM_ADMIN vượt qua |

## Domain Model

Cùng entity `BuoyStation` như F-092. Danh sách phao tiêu child từ `Buoy` (`@Table buoy`, FK `buoy_station_id`) — read-only, module khác.

## 2-level approval flow

Không áp dụng trực tiếp — hiển thị kết quả luồng duyệt (#40, #43-#50) read-only.

## Validation Rules

- GET `{id}` không tồn tại/đã soft-delete → 404.
- Ngoài data scope → 403/404.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-095-01 | AC-095-01 | Happy path: GET chi tiết trả đủ 6 nhóm #1-#50 | Integration |
| TS-095-02 | AC-095-02 | Happy path: response có `unitName` | Integration |
| TS-095-03 | AC-095-03 | Happy path: tab phao tiêu hiển thị child Buoy read-only | Integration |
| TS-095-04 | AC-095-04 | Security: Admin Cục thấy metadata nhạy cảm | Security |
| TS-095-05 | AC-095-05 | Security: GET ngoài phạm vi → 403/404 | Security |
| TS-095-06 | AC-095-06 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Cần DTO chi tiết gộp GIS, attachments, child buoy list, metadata duyệt. |
| Architecture affected? | Low | `GET /api/v1/buoy-station/{id}` đã tồn tại; bổ sung unitName + view_sensitive. |
| Implementation clear? | Yes | Field map, read-only groups, child buoy, data scope rõ ràng. |
| Documentation risk | Medium | Brief F-095 dẫn endpoint/detail DTO/cache/bảng cũ — drift; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa nội dung màn chi tiết, unitName, child buoy và data scope. |
