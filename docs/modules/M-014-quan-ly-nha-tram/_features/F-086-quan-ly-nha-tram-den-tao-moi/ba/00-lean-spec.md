---
feature-id: F-086
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Nhà trạm đèn

## Summary

Tính năng cho phép người dùng có quyền `beaconstation:create` tạo mới hồ sơ Nhà trạm đèn (đèn biển + nhà trạm gắn liền). Entity đích là `BeaconStation` (`beacon/entity/BeaconStation.java`, `@Table(name = "beacon_light")`, trước đây `nha_tram_den`), controller `BeaconStationController` (`@RequestMapping("/api/beacon-stations")`). Nguồn trường theo Excel sheet **"QL Đèn biển và nhà trạm"** (~line 113) gồm 57 trường, phủ cả đèn biển và nhà trạm, khớp `BeaconStation`. Mã tự sinh theo pattern `DBNT-%06d` (`BeaconStationService.generateCode` — prefix `DBNT-` + 6 chữ số, không phải `NT-{seq}`). Lưu ý drift enum: `approvalStatus` của `BeaconStation` lưu **STRING** (`@Enumerated(EnumType.STRING)`) — TRÁI convention AGENTS.md (INT + ORDINAL), tài liệu này ghi nhận thực tế code, không bịa INT storage. Bản ghi mới được `@PrePersist` đặt `approvalStatus = PENDING_APPROVAL` nếu null.

## Scope

| | Items |
|---|---|
| In scope | Tạo mới hồ sơ Nhà trạm đèn theo field map `BeaconStation` (sheet "QL Đèn biển và nhà trạm"); tự sinh mã `DBNT-XXXXXX`; nhập thông tin chung, thông tin kỹ thuật đèn, thông tin nhà trạm, GIS (geometryType/mapSymbolId/coordinateSystem/displayRule + tọa độ), file đính kèm; lưu tạm hoặc gửi phê duyệt; phân quyền `beaconstation:create`; data scope theo `orgUnitId` (`@Filter(orgUnitFilter)` condition `org_unit_id IN (...)` — khác BuoyStation dùng `unit_id`). |
| Out of scope | Sửa code/schema; phê duyệt (F-089); xóa (F-088); lịch sử (F-091); migration. |
| Assumptions | User đăng nhập có `beaconstation:create`/`data:create`; danh mục cảng biển, Tỉnh/TP, Tình trạng, Cấp trạm đèn, Chủng loại đèn, GIS đã có nguồn; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Đèn biển và nhà trạm" (line ~113). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

| # | Label | Technical field | Control | Required | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã đèn biển | `code` | Input (disabled, tự sinh `DBNT-%06d`) | Không (auto) | Có | Có | Có | Có | Có |
| 2 | Tên đèn biển | `name` | InputTextArea | **Có** | Có | Có | Có | Có | Có |
| 3 | Đơn vị quản lý | `orgUnitId` | SelectOrgCode | **Có** | Có | Có | Có | Có | Có |
| 4 | Thuộc cảng biển | `seaportId` | SelectKcht (CB) | Không | Có | Có | Có | Có | Có |
| 5 | Đơn vị vận hành | `operator` / `unitId` | SelectCateOther | Không | Có | Có | Có | Có | Có |
| 6 | Địa điểm (Tỉnh/TP) | `provinceId` | SelectCateOther | Không | Có | Có | Có | Có | Có |
| 7 | Địa điểm chi tiết | `detailedLocation` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 8 | Tình trạng | `status`/`operationalStatus` | SelectAppParams | Không | Có | Có | Có | Có | Có |
| 9 | Chủng loại đèn chính | `primaryLightModel` | Input | Không | Không | Có | Có | Có | Có |
| 10 | Chủng loại đèn dự phòng | `backupLightModel` | Input | Không | Không | Không | Có | Có | Có |
| 11 | Cấp trạm đèn | `type` (loại/cấp trạm) | SelectAppParams | Không | Có | Có | Có | Có | Có |
| 12 | Địa bàn | `region` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 13 | Đặc điểm nhận dạng | `identifyingFeature` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 14 | Hình dạng | `shape` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 15 | Chiều cao tháp đèn (m) | `towerHeight` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 16 | Chiều cao tâm sáng (m) | `lightHeight` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 17 | Tầm hiệu lực địa lý | `geographicRange` | Input | Không | Không | Không | Có | Có | Có |
| 18 | Tầm hiệu lực ánh sáng | `lightRange` | Input | **Có** (DTO @NotNull) | Không | Không | Có | Có | Có |
| 19 | Màu sắc tháp đèn | `towerColor` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 20 | Nguồn năng lượng | `powerSupply` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 21 | Thời điểm đưa vào sử dụng | `commissionedDate` | DatePicker | Không | Không | Có | Có | Có | Có |
| 22 | Thời điểm sửa chữa gần nhất | `lastRepairDate` | DatePicker | Không | Không | Không | Có | Có | Có |
| 23 | Địa điểm đặt trạm đèn | `location` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 24 | Kết cấu | `structure` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 25 | Diện tích (m²) | `area` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 26 | Diện tích sử dụng trạm đèn (m²) | `stationArea` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 27 | Số lượng nhân sự bố trí | `staffCount` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 28 | Ghi chú | `note` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 29 | Loại đối tượng (GIS) | `geometryType` | SelectAppParams | Không | Không | Không | Có | Có | Có |
| 30 | Biểu tượng (GIS) | `mapSymbolId` | SelectIcon | Không | Không | Không | Có | Có | Có |
| 31 | Hệ quy chiếu (GIS) | `coordinateSystem` (Integer) | SelectAppParams | Không | Không | Không | Có | Có | Có |
| 32 | Quy tắc hiển thị (GIS) | `displayRule` | SelectAppParams | Không | Không | Không | Có | Có | Có |
| 33 | Tọa độ (GIS) | `coordinates` (qua `spatialId`) | LongLatTable | Không | Không | Không | Có | Có | Có |
| 34 | Danh sách file | `attachments` | UploadFileTable | Không | Không | Không | Có | Có | Có |
| 35-38 | Thông tin vận hành khai thác | plan* (read-only, nguồn ngoài) | Text (read-only) | — | Không | Không | Có | Không | Không |
| 39-42 | Thông tin bảo trì | plan* (read-only, nguồn ngoài) | Text (read-only) | — | Không | Không | Có | Không | Không |
| 43-46 | Thông tin sự cố | incident* (read-only, nguồn ngoài) | Text (read-only) | — | Không | Không | Có | 46: Có | Không |
| 47 | Ngày cập nhật | `updatedAt` | Textarea | — | Có | Có | Có | Không | Không |
| 48 | Cán bộ cập nhật | `updatedBy` | Textarea | — | Có | Có | Có | Không | Không |
| 49 | Ngày gửi phê duyệt | submittedAt (history) | Textarea | — | Có | Không | Có | Không | Không |
| 50 | Cán bộ gửi phê duyệt | submittedBy (history) | Textarea | — | Có | Không | Có | Không | Không |
| 51 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedDate`* | Textarea | — | Có | Không | Có | Không | Không |
| 52 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedBy`* | Textarea | — | Có | Không | Có | Không | Không |
| 53 | Nội dung phê duyệt | `level1ApprovalContent`* | Textarea | — | Không | Không | Có | Không | Không |
| 54 | Ngày phê duyệt cấp Cục | `level2ApprovedDate`* | Textarea | — | Có | Không | Có | Không | Không |
| 55 | Cán bộ phê duyệt cấp Cục | `level2ApprovedBy`* | Textarea | — | Có | Không | Có | Không | Không |
| 56 | Nội dung phê duyệt | `level2ApprovalContent`* | Textarea | — | Không | Không | Có | Không | Không |
| 57 | Trạng thái (Trạng thái phê duyệt) | `approvalStatus` | Select (Dropdown) | — | Có | Có | Có | Không | Không |

> \* Lưu ý: `BeaconStation` hiện chỉ có `approvedBy/approvedDate/rejectionReason`; các trường level1/level2 được lấy từ history hoặc bổ sung — SA chốt (xem drift F-089).

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-086-01 | Chuyên viên | Tạo mới hồ sơ Nhà trạm đèn với đủ thông tin #1-#34 | Ghi nhận đúng hồ sơ đèn biển + nhà trạm | Must Have |
| US-086-02 | Chuyên viên | Mã tự sinh `DBNT-XXXXXX` không cần nhập tay | Tránh trùng lặp mã | Must Have |
| US-086-03 | Chuyên viên | Nhập GIS, file đính kèm khi tạo | Hoàn thiện hồ sơ bản đồ | Should Have |
| US-086-04 | Chuyên viên | Lưu tạm hoặc gửi phê duyệt ngay | Linh hoạt quy trình | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-086-01 | US-086-01 | Hiển thị đúng field map | Given user có `beaconstation:create`; When mở form Tạo mới; Then hiển thị #1-#34 theo control Excel, không cho nhập read-only #35-#57 | Sheet "QL Đèn biển và nhà trạm" |
| AC-086-02 | US-086-02 | Mã tự sinh | Given chưa nhập mã; When lưu; Then `code` sinh `DBNT-%06d` tăng dần, disabled trên UI | `BeaconStationService.generateCode` |
| AC-086-03 | US-086-01 | Tạo mới thành công | Given request hợp lệ; When POST `/api/beacon-stations`; Then tạo bản ghi `BeaconStation`, `approvalStatus` theo `@PrePersist` (`PENDING_APPROVAL` nếu null), audit từ session | Field read-only không nhận từ client |
| AC-086-04 | US-086-04 | Lưu tạm vs gửi duyệt | Given payload hợp lệ; When lưu; Then trạng thái theo hành động lưu/gửi | Không tự chuyển trạng thái khi chọn lưu tạm |
| AC-086-05 | US-086-03 | Lưu GIS và file | Given payload có `geometryType`/`coordinates`/`attachments`; When tạo; Then lưu đúng tọa độ (qua `spatialId`) và file; không gán dữ liệu giả | Upload theo kiểm soát file hệ thống |
| AC-086-06 | US-086-01 | Data scope | Given user thuộc đơn vị giới hạn; When tạo; Then `orgUnitId` phải trong phạm vi user, ngoài phạm vi 403 | `@Filter` orgUnitFilter (`org_unit_id`) + `@DataScope` |
| AC-086-07 | US-086-01 | Phân quyền | Given user thiếu `beaconstation:create`; When POST; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-086-01 | Source of truth của F-086 là field map `BeaconStation` từ sheet "QL Đèn biển và nhà trạm" (57 trường, phủ đèn biển + nhà trạm) | AC-086-01 | Không |
| BR-086-02 | `code` tự sinh `DBNT-%06d`, disabled; client gửi code bị service sinh lại | AC-086-02 | Không |
| BR-086-03 | Bắt buộc khi tạo theo DTO: `code` (@NotBlank nhưng bị sinh lại), `name`, `type`, `lightRange` (@NotNull); Excel bắt buộc thêm `orgUnitId` (#3 data scope) | AC-086-01 | SA có thể thêm validation kỹ thuật |
| BR-086-04 | `orgUnitId` là nguồn data scope (`org_unit_id IN (:orgUnitIds)`); validate đơn vị trong phạm vi user | AC-086-06 | Admin Cục/Cục full scope |
| BR-086-05 | Enum storage drift: `approvalStatus` của `BeaconStation` lưu STRING (`@Enumerated(EnumType.STRING)`) — TRÁI AGENTS.md (INT + ORDINAL); tài liệu ghi nhận thực tế code | AC-086-03 | Không bịa INT storage |
| BR-086-06 | Text trim trước khi lưu; field read-only #35-#57 bỏ qua nếu client gửi | AC-086-03, AC-086-05 | Không |
| BR-086-07 | GIS đồng bộ `gis_spatial_objects` qua `spatialId` | AC-086-05 | Không |
| BR-086-08 | Permission `beaconstation:create` (fallback `data:create`); `ROLE_SYSTEM_ADMIN` vượt qua | AC-086-07 | Không |

## Domain Model

- **BeaconStation** (`@Table beacon_light`, `@SQLRestriction("deleted_at IS NULL")`, `@FieldNameConstants`, `@Filter(orgUnitFilter, condition = "org_unit_id IN (:orgUnitIds)")`): orgUnitId, provinceId, code, name, type, lightRange, towerColor, primaryLightModel, area, location, unitId, lastRepairDate, commissionedDate, isActive, status (String "DRAFT"), approvalStatus (@Enumerated STRING), approvalLevel (Integer), approvedBy/Date, rejectionReason, spatialId, shape, structure, towerHeight, lightHeight, geographicRange, backupLightModel, powerSupply, staffCount, stationArea, seaportId, operator, detailedLocation, operationalStatus (Integer), region, identifyingFeature, note, geometryType, mapSymbolId, coordinateSystem (Integer), displayRule.
- **Drift ghi nhận:** `approvalStatus` STRING (trái AGENTS.md INT+ORDINAL); `status` là String "DRAFT"; `@PrePersist` đặt `approvalStatus = PENDING_APPROVAL` nếu null — khác BuoyStation (ORDINAL smallint default 0 = DRAFT).

## 2-level approval flow (góc độ tạo)

Tạo mới → `DRAFT` (lưu tạm) hoặc `PENDING_APPROVAL` (gửi duyệt). Người gửi cấp Cục (theo `OrgUnit.level`) bỏ vòng 1. Chi tiết vòng duyệt thuộc F-089 — lưu ý drift: `BeaconStationController` hiện KHÔNG có endpoint `approve-l2` (chỉ approve-l1 + reject) — xem F-089.

## Validation Rules

- Bắt buộc: `name`, `type`, `lightRange` (DTO); `orgUnitId` theo data scope.
- `code` auto-sinh `DBNT-%06d`.
- Text trim; số liệu không âm (đề xuất).
- Thông báo lỗi tiếng Việt có dấu.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-086-01 | AC-086-01 | Happy path: mở form thấy đúng #1-#34, không nhập được #35-#57 | Integration |
| TS-086-02 | AC-086-02 | Happy path: code sinh `DBNT-%06d` tăng dần | Integration |
| TS-086-03 | AC-086-03 | Happy path: tạo thành công, `approvalStatus` theo @PrePersist | Integration |
| TS-086-04 | AC-086-06 | Security: `orgUnitId` ngoài phạm vi → 403 | Security |
| TS-086-05 | AC-086-07 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | `BeaconStation` là target; drift enum STRING cần SA chốt (đổi sang ORDINAL hay giữ STRING). |
| Architecture affected? | Low/Medium | Endpoint `/api/beacon-stations` + permission `beaconstation:*` + Data Scope đã có. |
| Implementation clear? | Yes | Field matrix, auto-code `DBNT-`, GIS, data scope rõ ràng. |
| Documentation risk | Medium | Feature-brief F-086 dẫn `POST /api/v1/beacons` + bảng `beacon_stations` — drift: endpoint `/api/beacon-stations`, bảng `beacon_light`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa field map 57 trường, auto-code, enum drift, data scope và permissions. |
