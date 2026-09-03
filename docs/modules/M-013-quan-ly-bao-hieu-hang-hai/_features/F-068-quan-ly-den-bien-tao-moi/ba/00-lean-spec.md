---
feature-id: F-068
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Đèn biển (và nhà trạm)

## Summary

Hệ thống cho phép người dùng có thẩm quyền tạo mới hồ sơ Đèn biển (và nhà trạm gắn liền) theo spec Excel sheet "QL Đèn biển và nhà trạm" gồm 57 trường. Form tạo mới nhập nhóm TAB 1 Thông tin chung (#1-#28), TAB 2 Vị trí GIS (#29-#33), TAB 3 File đính kèm (#34); nhóm #35-#46 (vận hành, bảo trì, sự cố) và #47-#57 (xử lý & theo dõi) là read-only. Mã đèn biển tự sinh prefix `DBNT-` + 6 số, disabled trên UI. Bắt buộc khi tạo theo code: `name` (Tên đèn biển), `type` (Loại đèn biển), `lightRange` (Tầm hiệu lực ánh sáng) + đơn vị quản lý trong phạm vi data scope. Hành động tạo: lưu nháp (`action=draft`, trạng thái `DRAFT`) hoặc lưu và gửi phê duyệt (`action=submit` → `PENDING_APPROVAL`). Trạng thái lưu dạng số (enum `ApprovalStatus`), không lưu chuỗi.

> ⚠ **Drift tài liệu (ghi nhận, không lan truyền):** feature-brief.md cũ mô tả entity `Beacon` + `POST /api/v1/beacons`; tech-spec/_state.md mô tả `BeaconLight`. Hiện trạng code là entity `BeaconStation` (@Table `beacon_light`), controller `BeaconStationController` (`/api/beacon-stations`), permission `beaconstation:*`. Lean-spec này lấy Excel + code hiện tại làm nguồn sự thật; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Tạo mới hồ sơ Đèn biển theo 57 trường Excel; tự sinh mã `DBNT-%06d`; validation bắt buộc `name`/`type`/`lightRange` + đơn vị trong phạm vi; lưu nháp (`DRAFT`) hoặc gửi duyệt (`PENDING_APPROVAL` + `approvalLevel=1`); nhập GIS + file đính kèm; ghi history `CREATE`; phân quyền `beaconstation:create`; data scope theo đơn vị. |
| Out of scope | Cập nhật (F-069); xóa (F-070); phê duyệt (F-071); xem chi tiết (F-072); lịch sử (F-073); thay đổi schema/code trong lượt BA này; tự sinh dữ liệu mẫu. |
| Assumptions | Người dùng đã đăng nhập; danh mục Cảng biển, Đơn vị, Tỉnh/TP, Tình trạng, Cấp trạm đèn, Biểu tượng GIS đã có nguồn dữ liệu; `unitId` fallback về đơn vị user thao tác khi không gửi; GIS tọa độ hiện không nằm trong payload create (spatial object tạo qua update — theo code); section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility (DS/Lọc/CT/Tạo/Sửa) |
|---|---|---|---|---|---|
| 1 | Mã đèn biển | `code` | Input (disabled) | Có (tự sinh) | DS/Lọc/CT/Tạo/Sửa; sinh `DBNT-%06d` (`BeaconStationService.generateBeaconStationCode`, prefix `DBNT-`); unique. |
| 2 | Tên đèn biển | `name` | InputTextArea | Có | DS/Lọc/CT/Tạo/Sửa; `@NotBlank` "Tên đèn biển không được để trống", max 200. |
| 3 | Đơn vị quản lý | `orgUnitId` / `unitId` | SelectOrgCode | Có (data scope) | DS/Lọc/CT/Tạo/Sửa; fallback đơn vị user; validate phạm vi `orgUnitScopeService.currentUserScope().allows(...)` → "Bạn không có quyền tạo đèn biển ngoài phạm vi đơn vị được phân quyền". |
| 4 | Thuộc cảng biển | `seaportId` | SelectKcht (CB) | Không | DS/Lọc/CT/Tạo/Sửa. |
| 5 | Đơn vị vận hành | `operator` | SelectCateOther | Không | DS/Lọc/CT/Tạo/Sửa; entity lưu String max 200. |
| 6 | Địa điểm (Tỉnh/TP) | `provinceId` | SelectCateOther | Không | DS/Lọc/CT/Tạo/Sửa. |
| 7 | Địa điểm chi tiết | `detailedLocation` | InputTextArea | Không | CT/Tạo/Sửa; max 500. |
| 8 | Tình trạng | `operationalStatus` | SelectAppParams | Không | DS/Lọc/CT/Tạo/Sửa; Integer. |
| 9 | Chủng loại đèn chính | `primaryLightModel` | Input | Không | Lọc/CT/Tạo/Sửa; max 100. |
| 10 | Chủng loại đèn dự phòng | `backupLightModel` | Input | Không | CT/Tạo/Sửa; max 100. |
| 11 | Cấp trạm đèn | `type` (loại đèn biển) | SelectAppParams | Có (code `@NotNull`) | DS/Lọc/CT/Tạo/Sửa; field `type` lưu loại đèn (Hải đăng/Đèn báo/Cọc tiêu theo `BeaconLightType`); "Loại đèn không được để trống". Excel gọi "Cấp trạm đèn" nhưng entity chưa có cột cấp trạm riêng — cần SA chốt ánh xạ. |
| 12 | Địa bàn | `region` | InputTextArea | Không | CT/Tạo/Sửa; max 255. |
| 13 | Đặc điểm nhận dạng | `identifyingFeature` | InputTextArea | Không | CT/Tạo/Sửa; max 500. |
| 14 | Hình dạng | `shape` | InputTextArea | Không | CT/Tạo/Sửa; max 255. |
| 15 | Chiều cao tháp đèn (m) | `towerHeight` | InputDecimal | Không | CT/Tạo/Sửa. |
| 16 | Chiều cao tâm sáng (m) | `lightHeight` | InputDecimal | Không | CT/Tạo/Sửa. |
| 17 | Tầm hiệu lực địa lý | `geographicRange` | Input | Không | CT/Tạo/Sửa; max 20. |
| 18 | Tầm hiệu lực ánh sáng | `lightRange` | InputDecimal | Có | CT/Tạo/Sửa; `@NotNull @DecimalMin("0.01") @DecimalMax("60.0")`. |
| 19 | Màu sắc tháp đèn | `towerColor` | InputTextArea | Không | CT/Tạo/Sửa; max 50 (cột length 500). |
| 20 | Nguồn năng lượng | `powerSupply` | InputTextArea | Không | CT/Tạo/Sửa; max 500. |
| 21 | Thời điểm đưa vào sử dụng | `commissionedDate` | DatePicker | Không | Lọc/CT/Tạo/Sửa. |
| 22 | Thời điểm sửa chữa gần nhất | `lastRepairDate` | DatePicker | Không | CT/Tạo/Sửa. |
| 23 | Địa điểm đặt trạm đèn | `location` | InputTextArea | Không | CT/Tạo/Sửa; max 500. |
| 24 | Kết cấu | `structure` | InputTextArea | Không | CT/Tạo/Sửa; max 2000. |
| 25 | Diện tích (m²) | `area` | InputDecimal | Không | CT/Tạo/Sửa; `0.01..100.0`. |
| 26 | Diện tích sử dụng trạm đèn (m²) | `stationArea` | InputDecimal | Không | CT/Tạo/Sửa. |
| 27 | Số lượng nhân sự bố trí | `staffCount` | InputTextArea | Không | CT/Tạo/Sửa; Integer. |
| 28 | Ghi chú | `note` | InputTextArea | Không | CT/Tạo/Sửa; max 1000. |
| 29 | Loại đối tượng (GIS) | `geometryType` | SelectAppParams | Không | CT/Tạo/Sửa; max 20 (Điểm/Đường/Vùng). |
| 30 | Biểu tượng (GIS) | `mapSymbolId` | SelectIcon | Không | CT/Tạo/Sửa. |
| 31 | Hệ quy chiếu (GIS) | `coordinateSystem` | SelectAppParams | Không | CT/Tạo/Sửa; Integer. |
| 32 | Quy tắc hiển thị (GIS) | `displayRule` | SelectAppParams | Không | CT/Tạo/Sửa; max 255. |
| 33 | Tọa độ (GIS) | `spatialId` / WKT POINT | LongLatTable | Không | CT/Tạo/Sửa; lưu `GisSpatialObject`; code hiện tại: tọa độ không đi trên create, tạo qua update (xem BR-068-07). |
| 34 | Danh sách file | `attachments` | UploadFileTable | Không | CT/Tạo/Sửa; endpoint `/api/beacon-stations/{id}/attachments`, entityType `BEACON_LIGHT`. |
| 35 | Mã kế hoạch (vận hành) | `operationPlanCode` | Text (read-only) | Không | CT; nguồn từ kế hoạch vận hành liên quan — entity hiện chưa có cột cho Đèn biển. |
| 36 | Tên kế hoạch (vận hành) | `operationPlanName` | Text (read-only) | Không | CT. |
| 37 | Ngày bắt đầu (vận hành) | `operationStartDate` | Text (read-only) | Không | CT. |
| 38 | Ngày kết thúc (vận hành) | `operationEndDate` | Text (read-only) | Không | CT. |
| 39 | Mã kế hoạch (bảo trì) | `maintenancePlanCode` | Text (read-only) | Không | CT. |
| 40 | Tên kế hoạch (bảo trì) | `maintenancePlanName` | Text (read-only) | Không | CT. |
| 41 | Thời gian bắt đầu (bảo trì) | `maintenanceStartTime` | Text (read-only) | Không | CT. |
| 42 | Thời gian kết thúc (bảo trì) | `maintenanceEndTime` | Text (read-only) | Không | CT. |
| 43 | Mã sự cố | `incidentCode` | Text (read-only) | Không | CT. |
| 44 | Loại sự cố | `incidentType` | Text (read-only) | Không | CT. |
| 45 | Địa điểm (sự cố) | `incidentLocation` | Text (read-only) | Không | CT. |
| 46 | Thời gian (sự cố) | `incidentTime` | Text (read-only) | Không | CT; Excel đánh Tạo=true nhưng control read-only — nghi vấn nhập Excel, đề xuất giữ read-only. |
| 47 | Ngày cập nhật | `updatedAt` | Textarea | Không | Read-only; DS/Lọc/CT. |
| 48 | Cán bộ cập nhật | `updatedBy` | Textarea | Không | Read-only; DS/Lọc/CT. |
| 49 | Ngày gửi phê duyệt | `submittedForApprovalAt` | Textarea | Không | Read-only; DS/CT; entity hiện chưa có cột cho Đèn biển — nguồn workflow, cần SA chốt. |
| 50 | Cán bộ gửi phê duyệt | `submittedForApprovalBy` | Textarea | Không | Read-only; DS/CT. |
| 51 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedDate` | Textarea | Không | Read-only; DS/CT. |
| 52 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedBy` | Textarea | Không | Read-only; DS/CT. |
| 53 | Nội dung phê duyệt (C1) | `level1ApprovalContent` | Textarea | Không | Read-only; CT. |
| 54 | Ngày phê duyệt cấp Cục | `level2ApprovedDate` | Textarea | Không | Read-only; DS/CT; endpoint approve-l2 chưa tồn tại cho Đèn biển (xem F-071). |
| 55 | Cán bộ phê duyệt cấp Cục | `level2ApprovedBy` | Textarea | Không | Read-only; DS/CT. |
| 56 | Nội dung phê duyệt (C2) | `level2ApprovalContent` | Textarea | Không | Read-only; CT. |
| 57 | Trạng thái (Trạng thái phê duyệt) | `approvalStatus` | Badge / Select | Không | Read-only; DS/Lọc/CT; lưu số theo enum `ApprovalStatus` (DRAFT=0, PROPOSED=1, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, REJECTED=6, ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9). |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-068-01 | Chuyên viên | Tạo mới hồ sơ Đèn biển đủ thông tin Excel #1-#34 | Ghi nhận đúng hồ sơ báo hiệu hàng hải theo đơn vị quản lý | Must Have |
| US-068-02 | Chuyên viên | Không nhập mã đèn biển — hệ thống tự sinh `DBNT-xxxxxx` | Tránh trùng mã, chuẩn hóa định danh | Must Have |
| US-068-03 | Chuyên viên | Lưu nháp hoặc gửi phê duyệt ngay khi tạo | Kiểm soát thời điểm đưa hồ sơ vào luồng duyệt | Must Have |
| US-068-04 | Chuyên viên | Nhập GIS, tọa độ và file đính kèm | Hoàn thiện thông tin bản đồ và hồ sơ số | Should Have |
| US-068-05 | Lãnh đạo Cảng vụ/Chi cục | Nhận hồ sơ mới để duyệt cấp 1 | Kiểm soát nghiệp vụ trước khi gửi Cục | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-068-01 | US-068-01 | Hiển thị đúng trường | Given user có `beaconstation:create`; When mở form Tạo mới Đèn biển; Then hiển thị #1-#34 để nhập theo control Excel, không cho nhập #35-#57 | Trường read-only chỉ xuất hiện ở CT. |
| AC-068-02 | US-068-02 | Tự sinh mã | Given user mở form; When hệ thống gọi `GET /api/beacon-stations/generate-code`; Then trả mã dạng `DBNT-%06d`, hiển thị disabled, không sửa được | Unique toàn hệ thống. |
| AC-068-03 | US-068-01 | Validation bắt buộc | Given thiếu `name`, `type` hoặc `lightRange`; When nhấn Lưu; Then chặn submit, hiển thị lỗi tiếng Việt tại trường | `@NotBlank`/`@NotNull` theo DTO. |
| AC-068-04 | US-068-03 | Lưu nháp | Given request hợp lệ `action=draft`; When lưu; Then bản ghi `BeaconStation` tạo với `status=DRAFT`, `approvalStatus` theo mặc định, ghi history `CREATE` | Không nhận trường read-only từ client. |
| AC-068-05 | US-068-03 | Lưu và gửi duyệt | Given request hợp lệ `action=submit`; When lưu; Then `status=PENDING_APPROVAL`, `approvalLevel=1`, gửi thông báo phê duyệt | Chỉ gửi khi đủ dữ liệu bắt buộc. |
| AC-068-06 | US-068-04 | GIS + file | Given payload có GIS hoặc file; When tạo; Then GIS/spatial object xử lý theo BR-068-07; file upload qua endpoint riêng `BEACON_LIGHT` | Không tạo `POINT(null null)`. |
| AC-068-07 | US-068-01 | Data scope | Given user cấp đơn vị; When tạo với đơn vị ngoài phạm vi; Then từ chối "Bạn không có quyền tạo đèn biển ngoài phạm vi đơn vị được phân quyền", không tạo bản ghi | Cục full scope qua `orgunit:scope_all`/`admin:all`. |
| AC-068-08 | US-068-01 | Phân quyền | Given user thiếu `beaconstation:create`; When gọi POST `/api/beacon-stations`; Then HTTP 403 | Fallback `data:create` theo `@PreAuthorize`. |
| AC-068-09 | US-068-05 | Không tự duyệt khi gửi | Given user tạo và tự gửi duyệt; When lưu `action=submit`; Then gửi thành công tới luồng C1 (kiểm tra 4-eyes thuộc bước duyệt F-071) | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-068-01 | Source of truth F-068 là Excel sheet "QL Đèn biển và nhà trạm" 57 trường; không dùng field cũ (`beaconCode`, `lightCharacteristic`, `powerSource`...) của brief `Beacon` làm yêu cầu đích | AC-068-01 | Không có ngoại lệ trong scope BA này. |
| BR-068-02 | Mã đèn biển tự sinh `DBNT-%06d` (prefix `DBNT-` + 6 số, tăng từ MAX(code)), disabled trên UI, unique; client không tự đặt mã | AC-068-02 | Không. |
| BR-068-03 | Bắt buộc khi tạo theo code: `name`, `type`, `lightRange`; theo Excel không đánh dấu "(bắt buộc)" riêng — nhóm bắt buộc lấy từ DTO/entity | AC-068-03 | SA có thể bổ sung validation kỹ thuật, không làm trái nguồn dữ liệu. |
| BR-068-04 | `orgUnitId`/`unitId` là nguồn data scope; khi tạo fallback đơn vị user nếu không gửi và phải validate trong phạm vi, không để NULL | AC-068-07 | Cục/Admin Cục full scope. |
| BR-068-05 | Text input phải trim trước khi gửi/lưu | AC-068-03/04 | Không. |
| BR-068-06 | `action` chỉ nhận `draft` (mặc định) hoặc `submit`; `submit` → `PENDING_APPROVAL` + `approvalLevel=1`; không có hành động khác | AC-068-04/05 | Không. |
| BR-068-07 | GIS: create hiện không nhận tọa độ trên payload (spatial object tạo qua update khi có vị trí thật); không ghi `POINT(null null)` | AC-068-06 | Buoy (F-074) nhận tọa độ ngay khi create — hành vi khác entity, ghi nhận cho SA. |
| BR-068-08 | File đính kèm qua endpoint riêng `/api/beacon-stations/{id}/attachments` (POST/GET/DELETE), entityType `BEACON_LIGHT` | AC-068-06 | Không. |
| BR-068-09 | Trường #35-#57 read-only; nếu client gửi, server không lưu như dữ liệu chỉnh sửa (server-side ignore) | AC-068-01/04 | Không. |
| BR-068-10 | Permission `beaconstation:create` (hoặc fallback `data:create`) kiểm soát thao tác tạo | AC-068-08 | ROLE_SYSTEM_ADMIN vượt qua kiểm tra theo cơ chế hệ thống. |
| BR-068-11 | Trạng thái lưu dạng số theo enum `ApprovalStatus`; không lưu chuỗi trạng thái trong database | AC-068-04/05 | Không. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Tạo `BeaconStation` + history trong transaction | Không bản ghi mồ côi khi lỗi. |
| Security | RBAC `beaconstation:create` + data scope theo đơn vị | HTTP 403 khi không có quyền hoặc ngoài phạm vi. |
| Auditability | Ghi history `CREATE` (BeaconHistory/`infrastructure_history`) với người thao tác từ session | Truy vết người và thời điểm tạo. |
| UX | Label tiếng Việt có dấu; technical keys English; control theo Excel | Không hardcode màu/spacing/font. |
| Performance | DS/Lọc trên #1/#2/#3/#4/#5/#6/#8/#47/#57 phản hồi ổn định | SA/Dev chốt chỉ số. |
| Reliability | Không tạo placeholder cho dữ liệu vận hành/bảo trì/sự cố khi nguồn rỗng | Hiển thị rỗng/null có kiểm soát. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-068-01 | AC-068-01 | Happy path: user có `beaconstation:create` mở form, thấy #1-#34, không nhập được #35-#57 | Integration |
| TS-068-02 | AC-068-02 | Happy path: `GET /generate-code` trả `DBNT-%06d`, tăng dần, unique | Integration |
| TS-068-03 | AC-068-03 | Negative: thiếu `name`/`type`/`lightRange` → chặn với thông báo tiếng Việt | Integration |
| TS-068-04 | AC-068-04/05 | Happy path: `action=draft` → `DRAFT`; `action=submit` → `PENDING_APPROVAL` + level 1 | Integration |
| TS-068-05 | AC-068-07 | Security: chọn đơn vị ngoài phạm vi → từ chối, không tạo bản ghi | Security |
| TS-068-06 | AC-068-08 | Security: thiếu permission → 403 | Security |
| TS-068-07 | AC-068-09 | Negative: payload create gửi #35-#57 → server không lưu như dữ liệu chỉnh sửa | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Entity `BeaconStation` (table `beacon_light`) đã implement đủ #1-#34; các trường #35-#57 read-only chưa có cột (xem drift) — SA chốt nguồn hiển thị. |
| Architecture affected? | Low | Endpoint `/api/beacon-stations` + permission `beaconstation:*` đã seed (`PermissionSeeder.java:638-651`); data scope qua `@DataScope` + `@Filter(orgUnitFilter)`. |
| Implementation clear? | Yes | Field matrix, required, auto-code, action draft/submit, data scope, permission — observable từ code. |
| Documentation risk | Medium | Brief/tech-spec cũ lệch entity `Beacon`/`BeaconLight`; lean-spec này ghi nhận drift, không lan truyền; SA cần chốt ánh xạ #11 Cấp trạm đèn và nguồn #35-#57. |
| **Verdict** | `Ready for Solution Designer review` | BA spec khớp code hiện tại (`BeaconStation`/`BeaconStationService`/`BeaconStationController`) + Excel 57 trường; drift được ghi nhận rõ ràng. |
