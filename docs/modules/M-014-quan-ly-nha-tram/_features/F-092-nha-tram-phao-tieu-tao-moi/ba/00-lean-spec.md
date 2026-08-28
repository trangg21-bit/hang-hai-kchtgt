---
feature-id: F-092
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Nhà trạm phao tiêu

## Summary

Tính năng cho phép người dùng có quyền `buoystation:create` tạo mới hồ sơ Nhà trạm phao tiêu. **ĐÃ XÁC MINH:** feature dùng **CÙNG entity `BuoyStation`** (`@Table buoy_station`) và **CÙNG controller `/api/v1/buoy-station`** với F-080..F-085 — Excel sheet "QL Nhà trạm phao tiêu" (~line 740, 50 trường) khớp chính xác field map `BuoyStation`. Đây là sheet GỐC (không phải sheet thay thế như F-080..F-085). **DRIFT (feature-brief):** F-092 brief dẫn `/api/v1/buoy-beacon-stations` + entity `BuoyBeaconStation` + bảng `buoy_beacon_stations` — là tên thiết kế cũ; thực tế `/api/v1/buoy-station` + `BuoyStation` + `buoy_station`. Mã tự sinh `NT-{seq}` (`BuoyStationService.generateCode`). Tab "Danh sách phao tiêu" (#23-#27) hiển thị child `Buoy` (`@Table buoy`, FK `buoy_station_id`) — context-only, không author spec cho Buoy. Trạng thái: `approvalStatus` ORDINAL smallint (default 0 = DRAFT).

## Scope

| | Items |
|---|---|
| In scope | Tạo mới hồ sơ Nhà trạm phao tiêu theo sheet "QL Nhà trạm phao tiêu" (50 trường, sheet gốc); tự sinh mã `NT-{seq}`; nhập thông tin chung #1-#16, GIS #17-#21, file #22; hiển thị read-only danh sách phao tiêu #23-#27 (child `Buoy`); lưu tạm/gửi duyệt; phân quyền `buoystation:create`; data scope theo `unitId`. |
| Out of scope | Sửa code/schema; phê duyệt/xóa/lịch sử (không có feature riêng trong nhóm F-092..F-095 — xem ghi chú Pipeline Triage); author spec cho entity `Buoy`; migration. |
| Assumptions | User đăng nhập có quyền; danh mục đã có nguồn; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (~line 740) — sheet gốc của feature này. Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

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
| US-092-01 | Chuyên viên | Tạo mới hồ sơ Nhà trạm phao tiêu với đủ #1-#22 | Ghi nhận đúng hồ sơ | Must Have |
| US-092-02 | Chuyên viên | Mã tự sinh `NT-{seq}` | Tránh trùng mã | Must Have |
| US-092-03 | Chuyên viên | Xem danh sách phao tiêu child trong tab | Ngữ cảnh phao tiêu thuộc trạm | Should Have |
| US-092-04 | Chuyên viên | Lưu tạm hoặc gửi duyệt | Linh hoạt quy trình | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-092-01 | US-092-01 | Hiển thị đúng field map | Given user có `buoystation:create`; When mở form Tạo mới; Then hiển thị #1-#22, không cho nhập read-only #23-#50 | Sheet "QL Nhà trạm phao tiêu" (gốc) |
| AC-092-02 | US-092-02 | Mã tự sinh | Given chưa nhập mã; When lưu; Then `code` sinh `NT-{seq}` tăng dần | `generateCode` đếm prefix `NT-` |
| AC-092-03 | US-092-01 | Tạo mới thành công | Given request hợp lệ; When POST `/api/v1/buoy-station`; Then tạo `BuoyStation`, trạng thái theo hành động lưu/gửi, audit từ session | Field read-only không nhận từ client |
| AC-092-04 | US-092-04 | Lưu tạm vs gửi duyệt | Given payload hợp lệ; When lưu; Then `DRAFT` nếu lưu tạm, `PENDING_APPROVAL` + sentApproved* nếu gửi | Không tự chuyển trạng thái |
| AC-092-05 | US-092-03 | Danh sách phao tiêu child | Given trạm có Buoy con; When tạo/CT; Then tab #23-#27 hiển thị read-only từ `Buoy` (FK `buoy_station_id`) | Buoy thuộc module khác, chỉ đọc |
| AC-092-06 | US-092-01 | Data scope | Given user đơn vị giới hạn; When tạo; Then `unitId` trong phạm vi, ngoài 403 | `validateAllowedOrgUnit` |
| AC-092-07 | US-092-01 | Phân quyền | Given thiếu `buoystation:create`; When POST; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-092-01 | Source of truth là sheet "QL Nhà trạm phao tiêu" (50 trường) — sheet GỐC khớp field map `BuoyStation` | AC-092-01 | Không |
| BR-092-02 | **DRIFT (brief):** F-092 dẫn `/api/v1/buoy-beacon-stations` + entity `BuoyBeaconStation` + bảng `buoy_beacon_stations` — thực tế `/api/v1/buoy-station` + `BuoyStation` + `buoy_station`; ghi nhận, không sửa brief | AC-092-03 | Không |
| BR-092-03 | `code` tự sinh `NT-{seq}`, disabled; client gửi code bị service sinh lại | AC-092-02 | Không |
| BR-092-04 | Bắt buộc: `name`, `unitId`, `operatingOrgId`, `waterwayId`, `province`, `condition`, `staffCount` (dấu bắt buộc Excel) | AC-092-01 | SA thêm validation kỹ thuật |
| BR-092-05 | `unitId` là nguồn data scope; validate đơn vị trong phạm vi | AC-092-06 | Admin Cục/Cục full |
| BR-092-06 | Danh sách phao tiêu #23-#27 là child `Buoy` read-only — không tạo/sửa/xóa từ feature này | AC-092-05 | Không |
| BR-092-07 | Enum `approvalStatus` ORDINAL + smallint (đúng AGENTS.md — khác BeaconStation STRING) | AC-092-04 | Không |
| BR-092-08 | Text trim; read-only #23-#50 bỏ qua nếu client gửi | AC-092-03, AC-092-05 | Không |
| BR-092-09 | Permission `buoystation:create` (fallback `data:create`) | AC-092-07 | ROLE_SYSTEM_ADMIN vượt qua |

## Domain Model

- **BuoyStation** (`@Table buoy_station`): như F-080 — code/name/unitId/operatingOrgId/portId/waterwayId/waterwayRouteId/province/address/constructionDate/totalArea/usableArea/staffCount/lastMaintenanceYear/note/objectType/icon/coordinateSystem/displayFormat/spatialId/condition/status/approvalStatus(ORDINAL smallint)/approvalLevel/approved*/level1*/level2*/sentApproved*/rejectionReason/operationPlan*/maintenancePlan*/incident*.
- **Buoy** (child, `@Table buoy`, FK `buoy_station_id`): chỉ hiển thị read-only (#23-#27); entity module khác.
- Data scope: `@Filter(orgUnitFilter, unit_id IN)` + controller `@DataScope`.

## 2-level approval flow (góc độ tạo)

Tạo mới → `DRAFT` (lưu tạm) hoặc `PENDING_APPROVAL` (gửi duyệt); người gửi cấp Cục bỏ vòng 1. Nhóm F-092..F-095 không có feature phê duyệt riêng — luồng C1/C2 dùng chung cơ chế của `BuoyStation` (như F-083) khi hồ sơ được submit.

## Validation Rules

- Bắt buộc: `name`, `unitId`, `operatingOrgId`, `waterwayId`, `province`, `condition`, `staffCount`.
- `code` auto `NT-{seq}`; trim text; số liệu không âm (đề xuất).
- Thông báo lỗi tiếng Việt có dấu.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-092-01 | AC-092-01 | Happy path: mở form thấy đúng #1-#22 | Integration |
| TS-092-02 | AC-092-02 | Happy path: code sinh NT-{seq} tăng dần | Integration |
| TS-092-03 | AC-092-03 | Happy path: POST /api/v1/buoy-station tạo thành công | Integration |
| TS-092-04 | AC-092-04 | Boundary: action=draft giữ DRAFT; action=submit chuyển PENDING | Integration |
| TS-092-05 | AC-092-05 | Happy path: tab phao tiêu hiển thị child Buoy read-only | Integration |
| TS-092-06 | AC-092-06 | Security: unitId ngoài phạm vi → 403 | Security |
| TS-092-07 | AC-092-07 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Cùng target `BuoyStation`; brief dùng tên cũ `BuoyBeaconStation` — SA chốt thống nhất. |
| Architecture affected? | Low/Medium | Endpoint `/api/v1/buoy-station` + `buoystation:*` đã có. |
| Implementation clear? | Yes | Field map, auto-code, child buoy read-only, data scope rõ ràng. |
| Documentation risk | Medium | Brief F-092 dẫn endpoint/entity/bảng cũ (`buoy-beacon-stations`, `BuoyBeaconStation`, `buoy_beacon_stations`) — drift lớn so với code; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa field map 50 trường, auto-code NT-{seq}, child buoy read-only và data scope. |
