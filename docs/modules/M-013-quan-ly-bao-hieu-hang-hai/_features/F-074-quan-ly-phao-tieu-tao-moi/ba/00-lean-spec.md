---
feature-id: F-074
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Phao tiêu

## Summary

Hệ thống cho phép người dùng có thẩm quyền tạo mới hồ sơ Phao tiêu theo spec Excel sheet "QL Phao tiêu" gồm 56 trường. Form tạo mới nhập TAB 1 Thông tin chung (#1-#27), TAB 2 Vị trí GIS (#28-#32), TAB 3 File đính kèm (#33); nhóm #34-#45 (vận hành, bảo trì, sự cố) và #46-#56 (xử lý & theo dõi) là read-only. Mã phao, tiêu tự sinh `{mã nhà trạm}-PT-{seq 3 số}` (khi đã chọn nhà trạm) hoặc `PT-{seq 6 số}` (dự phòng), disabled trên UI. Bắt buộc khi tạo theo Excel + code: Tên phao tiêu (`name`), Phân loại (`classification`), Đơn vị quản lý (`orgUnitId`/`unitId`), Thuộc nhà trạm (`buoyStationId`), Tình trạng (`condition`), Chiều cao tâm sáng (`lightHeight`); code còn bắt buộc `range` (Phạm vi chiếu sáng). Hành động tạo: `draft` (→ `DRAFT`) / `submit` (→ `PENDING_APPROVAL`) / `approved` (→ `PUBLISHED`, duyệt thẳng). Trạng thái lưu dạng số (enum `ApprovalStatus`).

> ⚠ **Drift tài liệu (ghi nhận, không lan truyền):** feature-brief.md cũ mô tả entity `Beacon`; hiện trạng code là entity `Buoy` (@Table `buoy`, `orgUnitId` + `@Filter(orgUnitFilter)`), controller `BuoyController` (`/api/buoys`), permission `buoy:*`. Lean-spec này lấy Excel + code hiện tại làm nguồn; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Tạo mới hồ sơ Phao tiêu theo 56 trường Excel; tự sinh mã `{stationCode}-PT-%03d` (fallback `PT-%06d`); validation bắt buộc theo Excel + code; lưu nháp (`DRAFT`) / gửi duyệt (`PENDING_APPROVAL` + `submittedForApproval*`) / duyệt thẳng (`PUBLISHED`); GIS tọa độ ngay khi tạo (WKT POINT, `GisSpatialObjectType.POINT_BUOY`, `InfrastructureType.BUOY`); file đính kèm; ghi history `CREATE`; phân quyền `buoy:create`; data scope theo đơn vị. |
| Out of scope | Cập nhật (F-075); xóa (F-076); phê duyệt (F-077); xem chi tiết (F-078); lịch sử (F-079); thay đổi schema/code trong lượt BA này. |
| Assumptions | Người dùng đã đăng nhập; danh mục Phân loại, Nhà trạm phao tiêu, Tỉnh/TP, Tình trạng, Biểu tượng GIS đã có nguồn; `unitId` fallback đơn vị user khi không gửi; section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility (DS/Lọc/CT/Tạo/Sửa) |
|---|---|---|---|---|---|
| 1 | Mã phao, tiêu | `code` | Input (disabled, tự sinh `{mã nhà trạm}-PT-{seq}`) | Có (tự sinh) | DS/Lọc/CT/Tạo/Sửa; `BuoyService.generateCode`: prefix `{stationCode}-PT-` + `%03d`; fallback `PT-%06d` khi chưa chọn nhà trạm; dedupe cả bảng `buoy` lẫn `beacon_light`. |
| 2 | Tên phao, tiêu (bắt buộc) | `name` | InputTextArea | Có | DS/Lọc/CT/Tạo/Sửa; `@NotBlank` "Tên phao tiêu không được để trống", max 255. |
| 3 | Phân loại (bắt buộc) | `classification` | SelectAppParams | Có | CT/Tạo/Sửa; `@NotNull` "Phân loại không được để trống", max 100. |
| 4 | Phân loại phao | `classificationBuoy` | SelectAppParams | Không | CT/Tạo/Sửa; max 100; nguồn IALA (Hướng/Phân khu/Đặc biệt/Vùng nước an toàn/Nguy hiểm cô lập — tham chiếu `BuoyType`). |
| 5 | Phân loại tiêu | `classificationMark` | SelectAppParams | Không | CT/Tạo/Sửa; max 100. |
| 6 | Đơn vị quản lý (bắt buộc khi tạo) | `orgUnitId` / `unitId` | SelectOrgCode | Có | DS/Lọc/CT/Tạo/Sửa; fallback đơn vị user; data scope qua `@Filter(orgUnitFilter)`; hiện trạng code gán `unitId` (request hoặc fallback) — SA chốt gán `orgUnitId`. |
| 7 | Thuộc nhà trạm QLVH phao, tiêu (bắt buộc) | `buoyStationId` | SelectKcht (ATHH, NT) | Có | DS/Lọc/CT/Tạo/Sửa; dùng để sinh mã (lấy `code` của nhà trạm); response kèm `buoyStationName`. |
| 8 | Địa điểm (Tỉnh/TP) | `provinceId` | SelectCateOther | Không | DS/Lọc/CT/Tạo/Sửa. |
| 9 | Địa điểm chi tiết | `locationDetail` | InputTextArea | Không | CT/Tạo/Sửa; max 500. |
| 10 | Tình trạng (bắt buộc) | `condition` | SelectAppParams | Có | DS/Lọc/CT/Tạo/Sửa; `@NotNull` "Tình trạng không được để trống", max 100. |
| 11 | Hình dáng | `shape` | InputTextArea | Không | CT/Tạo/Sửa; max 50. |
| 12 | Kết cấu | `structure` | InputTextArea | Không | CT/Tạo/Sửa; max 2000. |
| 13 | Diện tích (m²) | `area` | InputDecimal | Không | CT/Tạo/Sửa. |
| 14 | Chiều cao thân phao (m) | `bodyHeight` | InputDecimal | Không | CT/Tạo/Sửa. |
| 15 | Đường kính phao (m) | `diameter` | InputDecimal | Không | CT/Tạo/Sửa. |
| 16 | Đèn biển | `beaconLight` | SelectAppParams | Không | CT/Tạo/Sửa; max 100. |
| 17 | Chiều cao tháp đèn | `towerHeight` | InputDecimal | Không | CT/Tạo/Sửa. |
| 18 | Chiều cao tâm sáng (hải đồ) (bắt buộc) | `lightHeight` | InputDecimal | Có | CT/Tạo/Sửa; `@NotNull` "Chiều cao tâm sáng không được để trống". |
| 19 | Chủng loại đèn (Thiết bị báo hiệu) | `lightModel` | Input | Không | CT/Tạo/Sửa; max 100. |
| 20 | Màu sắc bên ngoài của tháp đèn | `towerColor` | InputTextArea | Không | CT/Tạo/Sửa; max 200. |
| 21 | Nguồn cung cấp năng lượng cho đèn | `powerSupply` | InputTextArea | Không | CT/Tạo/Sửa; max 500. |
| 22 | Phạm vi chiếu sáng | `range` | Input | Có (code) | CT/Tạo/Sửa; `@NotNull @DecimalMin("0.01") @DecimalMax("100.0")`. |
| 23 | Thời điểm đưa vào sử dụng | `commissionedDate` | DatePicker | Không | CT/Tạo/Sửa. |
| 24 | Thời điểm sửa chữa gần nhất | `lastRepairDate` | DatePicker | Không | CT; Excel Sửa=false. |
| 25 | Màu sắc (đặc tính ánh sáng) | `lightColor` | Input | Không | CT/Tạo/Sửa; max 50. |
| 26 | Kiểu chớp | `flashType` | Input | Không | CT/Tạo/Sửa; max 50. |
| 27 | Chu kỳ | `period` | Input | Không | CT/Tạo/Sửa; max 50. |
| 28 | Tọa độ GIS | `coordinates` / `longitude`+`latitude` | LocationInformationForm | Không | CT/Tạo/Sửa; tạo WKT `POINT(lon lat)`, lưu `GisSpatialObject` (spatial_id); validate kinh độ -180..180, vĩ độ -90..90. |
| 29 | Loại đối tượng | `geometryType` | Select (Điểm/Đường/Vùng) | Không | CT/Tạo/Sửa; max 20. |
| 30 | Biểu tượng | `mapSymbolId` | Select | Không | CT/Tạo/Sửa. |
| 31 | Hệ quy chiếu | `coordinateSystem` | Text | Không | CT/Tạo/Sửa; Integer. |
| 32 | Quy tắc hiển thị | `displayRule` | Text | Không | CT/Tạo/Sửa; max 255. |
| 33 | File đính kèm | `attachments` | UploadFileTable | Không | CT/Tạo/Sửa; entityType `BUOY`. |
| 34 | Mã kế hoạch (vận hành) | `operationPlanCode` | Text (read-only) | Không | CT; nguồn kế hoạch vận hành liên quan. |
| 35 | Tên kế hoạch (vận hành) | `operationPlanName` | Text (read-only) | Không | CT. |
| 36 | Ngày bắt đầu (vận hành) | `operationStartDate` | Text (read-only) | Không | CT. |
| 37 | Ngày kết thúc (vận hành) | `operationEndDate` | Text (read-only) | Không | CT. |
| 38 | Mã kế hoạch (bảo trì) | `maintenancePlanCode` | Text (read-only) | Không | CT. |
| 39 | Tên kế hoạch (bảo trì) | `maintenancePlanName` | Text (read-only) | Không | CT. |
| 40 | Thời gian bắt đầu (bảo trì) | `maintenanceStartTime` | Text (read-only) | Không | CT. |
| 41 | Thời gian kết thúc (bảo trì) | `maintenanceEndTime` | Text (read-only) | Không | CT. |
| 42 | Mã sự cố | `incidentCode` | Text (read-only) | Không | CT. |
| 43 | Loại sự cố | `incidentType` | Text (read-only) | Không | CT. |
| 44 | Địa điểm (sự cố) | `incidentLocation` | Text (read-only) | Không | CT. |
| 45 | Thời gian (sự cố) | `incidentTime` | Text (read-only) | Không | CT. |
| 46 | Trạng thái | `approvalStatus` | Badge (read-only) | Không | DS/Lọc/CT; lưu số enum `ApprovalStatus`. |
| 47 | Ngày cập nhật | `updatedAt` | Text (read-only) | Không | DS/Lọc/CT. |
| 48 | Cán bộ cập nhật | `updatedBy` | Text (read-only) | Không | DS/CT. |
| 49 | Ngày gửi phê duyệt | `submittedForApprovalAt` | Text (read-only) | Không | DS/CT; hệ thống ghi. |
| 50 | Cán bộ gửi phê duyệt | `submittedForApprovalBy` | Text (read-only) | Không | DS/CT; hệ thống ghi. |
| 51 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedDate` | Text (read-only) | Không | DS/CT; hệ thống ghi. |
| 52 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedBy` | Text (read-only) | Không | DS/CT; hệ thống ghi. |
| 53 | Nội dung phê duyệt (C1) | `level1ApprovalContent` | Text (read-only) | Không | CT; hệ thống ghi (trim). |
| 54 | Ngày phê duyệt cấp Cục | `level2ApprovedDate` | Text (read-only) | Không | DS/CT; hệ thống ghi. |
| 55 | Cán bộ phê duyệt cấp Cục | `level2ApprovedBy` | Text (read-only) | Không | DS/CT; hệ thống ghi. |
| 56 | Nội dung phê duyệt (C2) | `level2ApprovalContent` | Text (read-only) | Không | CT; hệ thống ghi (trim). |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-074-01 | Chuyên viên | Tạo mới hồ sơ Phao tiêu đủ thông tin Excel #1-#33 | Ghi nhận đúng phao tiêu theo đơn vị quản lý | Must Have |
| US-074-02 | Chuyên viên | Mã tự sinh theo nhà trạm `{mã nhà trạm}-PT-{seq}` | Định danh chuẩn theo nhà trạm quản lý | Must Have |
| US-074-03 | Chuyên viên | Lưu nháp / gửi duyệt / duyệt thẳng khi tạo | Linh hoạt luồng thao tác | Must Have |
| US-074-04 | Chuyên viên | Nhập tọa độ GIS và file đính kèm ngay khi tạo | Hoàn thiện hồ sơ bản đồ | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-074-01 | US-074-01 | Hiển thị đúng trường | Given user có `buoy:create`; When mở form Tạo mới Phao tiêu; Then hiển thị #1-#33 để nhập, không cho nhập #34-#56 | Trường read-only chỉ ở CT. |
| AC-074-02 | US-074-02 | Tự sinh mã | Given đã chọn nhà trạm; When hệ thống sinh mã; Then `{stationCode}-PT-%03d`; chưa chọn → `PT-%06d`; không trùng bảng `buoy`/`beacon_light` | Disabled UI. |
| AC-074-03 | US-074-01 | Validation bắt buộc | Given thiếu `name`/`classification`/`condition`/`lightHeight`/`range`/đơn vị; When Lưu; Then chặn với thông báo tiếng Việt | Theo Excel + DTO. |
| AC-074-04 | US-074-03 | Lưu nháp | Given hợp lệ `action=draft`; When lưu; Then `status=DRAFT`, `approvalStatus=PROPOSED`, history `CREATE` | — |
| AC-074-05 | US-074-03 | Lưu và gửi duyệt | Given hợp lệ `action=submit`; When lưu; Then `PENDING_APPROVAL` + `submittedForApprovalBy/At` + `approvalLevel=1` | — |
| AC-074-06 | US-074-03 | Lưu và phê duyệt | Given hợp lệ `action=approved`; When lưu; Then `PUBLISHED` + `APPROVED` + ghi đủ `level1/2Approved*` + `approvedBy/Date` | Hành động đặc thù Buoy. |
| AC-074-07 | US-074-04 | GIS + file | Given payload có `coordinates`/`longitude`/`latitude`; When tạo; Then validate tọa độ + tạo `GisSpatialObject` (`POINT_BUOY`, `InfrastructureType.BUOY`), gán `spatialId` | Kinh độ -180..180, vĩ độ -90..90; "Tọa độ không được để trống". |
| AC-074-08 | US-074-01 | Data scope | Given tạo với đơn vị ngoài phạm vi; When lưu; Then từ chối, không tạo bản ghi | Cục full scope. |
| AC-074-09 | US-074-01 | Phân quyền | Given thiếu `buoy:create`; When POST `/api/buoys`; Then HTTP 403 | Fallback `data:create`. |
| AC-074-10 | US-074-01 | Trùng mã | Given mã đã tồn tại ở `buoy` hoặc `beacon_light`; When tạo; Then từ chối "Đã tồn tại: {code}" | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-074-01 | Source of truth F-074 là Excel sheet "QL Phao tiêu" 56 trường; không dùng field cũ của brief `Beacon` làm yêu cầu đích | AC-074-01 | Không. |
| BR-074-02 | Mã tự sinh `{stationCode}-PT-%03d` (chọn nhà trạm) hoặc `PT-%06d` (fallback); disabled; kiểm tra trùng cả `buoy` lẫn `beacon_light` | AC-074-02/10 | Không. |
| BR-074-03 | Bắt buộc khi tạo: `name`, `classification`, `condition`, `lightHeight`, `range` (code) + đơn vị quản lý + nhà trạm (Excel) | AC-074-03 | SA bổ sung validation kỹ thuật không trái Excel. |
| BR-074-04 | `orgUnitId`/`unitId` là nguồn data scope; fallback đơn vị user khi không gửi; không để NULL; validate phạm vi | AC-074-08 | Cục/Admin Cục full scope. |
| BR-074-05 | `action` chỉ nhận `draft`/`submit`/`approved`; `submit` → `PENDING_APPROVAL`; `approved` → `PUBLISHED` + ghi đủ field duyệt | AC-074-04/05/06 | Không. |
| BR-074-06 | GIS tạo ngay khi create nếu có tọa độ; validate kinh độ -180..180, vĩ độ -90..90; không tạo placeholder tọa độ | AC-074-07 | Khác Đèn biển (F-068) — ghi nhận cho SA. |
| BR-074-07 | Text input trim trước khi lưu | AC-074-03 | Không. |
| BR-074-08 | Trường #34-#56 read-only; không nhận từ client | AC-074-01 | Không. |
| BR-074-09 | Permission `buoy:create` (fallback `data:create`) | AC-074-09 | ROLE_SYSTEM_ADMIN. |
| BR-074-10 | Trạng thái lưu số enum `ApprovalStatus`; không lưu chuỗi | AC-074-04/05/06 | Không. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Tạo `Buoy` + spatial object + history trong transaction | Không bản ghi mồ côi. |
| Security | RBAC `buoy:create` + data scope | 403 khi vi phạm. |
| Auditability | History `CREATE` + `ChangeHistoryService.recordChanges("Buoy", ...)` với người thao tác từ session | Truy vết người/thời điểm. |
| UX | Label tiếng Việt có dấu; technical keys English | Không hardcode UI. |
| Performance | DS/Lọc trên #1/#2/#6/#7/#8/#10/#46/#47 phản hồi ổn định | SA/Dev chốt. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-074-01 | AC-074-01 | Happy path: form hiển thị #1-#33, không nhập được #34-#56 | Integration |
| TS-074-02 | AC-074-02 | Happy path: sinh mã `{stationCode}-PT-001`; fallback `PT-000001`; không trùng | Integration |
| TS-074-03 | AC-074-03 | Negative: thiếu trường bắt buộc → chặn tiếng Việt | Integration |
| TS-074-04 | AC-074-04/05/06 | Boundary: `draft`→DRAFT; `submit`→PENDING_APPROVAL; `approved`→PUBLISHED | Integration |
| TS-074-05 | AC-074-07 | Happy path: tạo với tọa độ → spatial object + `spatialId` | Integration |
| TS-074-06 | AC-074-10 | Negative: mã trùng → "Đã tồn tại: {code}" | Integration |
| TS-074-07 | AC-074-08/09 | Security: ngoài scope / thiếu permission → từ chối / 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Entity `Buoy` (table `buoy`) đã implement #1-#56 (cả operation/maintenance/incident read-only fields). |
| Architecture affected? | Low | `/api/buoys` + permission `buoy:*` đã seed (`PermissionSeeder.java:670-683`); data scope `@DataScope` + `@Filter(orgUnitFilter)`. |
| Implementation clear? | Yes | Field matrix, required, auto-code, action draft/submit/approved, GIS on create — observable từ code. |
| Documentation risk | Medium | Brief cũ lệch entity `Beacon`; ghi nhận drift, không lan truyền; SA chốt gán `orgUnitId` trên create (hiện trạng gán `unitId`). |
| **Verdict** | `Ready for Solution Designer review` | BA spec khớp code hiện tại (`Buoy`/`BuoyService`/`BuoyController`) + Excel 56 trường; drift rõ ràng. |
