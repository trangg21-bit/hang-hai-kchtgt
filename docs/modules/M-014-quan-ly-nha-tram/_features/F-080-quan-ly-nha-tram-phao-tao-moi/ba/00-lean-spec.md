---
feature-id: F-080
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Nhà trạm phao

## Summary

Tính năng cho phép Chuyên viên có quyền `buoystation:create` tạo mới hồ sơ Nhà trạm phao. Entity đích là `BuoyStation` (`station/entity/BuoyStation.java`, `@Table(name = "buoy_station")`, trước đây `nha_tram_phao`), controller `BuoyStationController` (`@RequestMapping("/api/v1/buoy-station")`). Nguồn trường theo Excel sheet **"QL Nhà trạm phao tiêu"** — sheet gần nhất khớp 100% field map của `BuoyStation`; **KHÔNG có sheet riêng "QL Nhà trạm phao"**, sự thay thế này được ghi nhận làm nguồn cho cả F-080..F-085. Mã tự sinh theo pattern `NT-{seq}` (`BuoyStationService.generateCode`, service đếm toàn bộ bản ghi có code prefix `NT-`, không phụ thuộc prefix cảng). Bản ghi tạo mới lưu trạng thái `approvalStatus` mặc định theo cột `approval_status smallint default 0` (`DRAFT`), người dùng tự chọn lưu tạm hoặc gửi phê duyệt 2 cấp C1 (Cảng vụ/Chi cục) → C2 (Cục).

## Scope

| | Items |
|---|---|
| In scope | Tạo mới hồ sơ Nhà trạm phao theo field map `BuoyStation` (sheet "QL Nhà trạm phao tiêu" làm nguồn thay thế); tự sinh mã `NT-{seq}`; nhập thông tin chung, chỉ số tổng hợp, GIS (objectType/icon/coordinateSystem/displayFormat + tọa độ), file đính kèm; lưu tạm (`DRAFT`) hoặc lưu và gửi phê duyệt; phân quyền `buoystation:create`; data scope theo `unitId` (`@Filter(orgUnitFilter)` condition `unit_id IN (...)`, controller `@DataScope`). |
| Out of scope | Sửa code/schema trong lượt BA; phê duyệt (thuộc F-083); xóa (F-082); lịch sử (F-085); cập nhật bản ghi `Buoy` con (thuộc module khác, chỉ hiển thị read-only); migration. |
| Assumptions | User đã đăng nhập và có quyền `buoystation:create` hoặc `data:create`; danh mục Đơn vị quản lý, Cảng biển, Luồng hàng hải, Tuyến luồng, Tỉnh/TP, Tình trạng, Loại đối tượng, Biểu tượng đã có nguồn; Cục/`orgunit:scope_all` xem full theo data scope; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (thay thế cho sheet "QL Nhà trạm phao" không tồn tại). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

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
| 28-31 | Thông tin vận hành khai thác (Mã/Tên kế hoạch, Ngày bắt đầu/Kết thúc) | `operationPlanCode`/`operationPlanName`/`operationStartDate`/`operationEndDate` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 32-35 | Thông tin bảo trì (Mã/Tên kế hoạch, Thời gian bắt đầu/Kết thúc) | `maintenancePlanCode`/`maintenancePlanName`/`maintenanceStartTime`/`maintenanceEndTime` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 36-39 | Thông tin sự cố (Mã/Loại/Địa điểm/Thời gian) | `incidentCode`/`incidentType`/`incidentLocation`/`incidentTime` | Text (read-only) | — | Không | Không | Có | Không | Không |
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
| US-080-01 | Chuyên viên | Tạo mới hồ sơ Nhà trạm phao với đủ thông tin #1-#22 | Ghi nhận đúng hồ sơ nhà trạm theo đơn vị quản lý | Must Have |
| US-080-02 | Chuyên viên | Mã nhà trạm tự sinh `NT-{seq}` không cần nhập tay | Tránh trùng lặp và lỗi nhập mã | Must Have |
| US-080-03 | Chuyên viên | Nhập tọa độ GIS và file đính kèm khi tạo | Hoàn thiện hồ sơ bản đồ và tài liệu | Should Have |
| US-080-04 | Chuyên viên | Lưu tạm hoặc lưu và gửi phê duyệt ngay | Linh hoạt quy trình nhập liệu | Must Have |
| US-080-05 | Người xem | Thấy các trường xử lý/theo dõi #40-#50 chỉ đọc ở chi tiết | Không chỉnh sửa sai metadata phê duyệt | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-080-01 | US-080-01 | Hiển thị đúng field map | Given user có `buoystation:create`; When mở form Tạo mới Nhà trạm phao; Then hiển thị các trường #1-#22 theo control Excel, không cho nhập các trường read-only #23-#50 | Nguồn sheet "QL Nhà trạm phao tiêu" (sheet thay thế) |
| AC-080-02 | US-080-02 | Mã tự sinh | Given chưa nhập mã; When lưu; Then `code` được sinh theo `NT-{seq}` tăng dần, không trùng, disabled trên UI | Service `generateCode` đếm toàn bộ bản ghi prefix `NT-` |
| AC-080-03 | US-080-01 | Tạo mới thành công | Given request hợp lệ; When POST `/api/v1/buoy-station`; Then tạo bản ghi `BuoyStation`, `approvalStatus` khởi tạo theo hành động lưu/gửi, audit từ session | Field read-only không nhận từ client |
| AC-080-04 | US-080-04 | Lưu tạm vs gửi duyệt | Given payload có `action=draft` hoặc `action=submit`; When lưu; Then `DRAFT` nếu lưu tạm, chuyển `PENDING_APPROVAL` + ghi `sentApprovedBy/Date` nếu gửi duyệt | Không tự chuyển trạng thái khi user chọn lưu tạm |
| AC-080-05 | US-080-03 | Lưu GIS và file | Given payload có `geometryType`/`coordinates`/`attachments`; When tạo mới; Then lưu đúng tọa độ và danh sách file; không gán dữ liệu giả nếu thiếu | Upload theo kiểm soát file hệ thống |
| AC-080-06 | US-080-01 | Data scope | Given user thuộc đơn vị giới hạn; When tạo; Then `unitId` phải nằm trong phạm vi user, ngoài phạm vi trả 403 | `OrgUnitScopeService.validateAllowedOrgUnit` |
| AC-080-07 | US-080-01 | Phân quyền | Given user thiếu `buoystation:create`/`data:create`; When gọi POST; Then 403 và UI không hiện nút Tạo mới | `@PreAuthorize` trên controller |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-080-01 | Source of truth của F-080 là field map `BuoyStation` từ sheet "QL Nhà trạm phao tiêu" (sheet gần nhất, không có sheet "QL Nhà trạm phao" riêng); không dùng field cũ ngoài Excel làm yêu cầu đích | AC-080-01 | Không |
| BR-080-02 | Khi tạo mới bắt buộc: `name`, `unitId`, `operatingOrgId`, `waterwayId`, `province`/`provinceId`, `condition`, `staffCount` (theo dấu "bắt buộc" Excel); các field còn lại optional/read-only | AC-080-01 | SA có thể thêm validation kỹ thuật nhưng không làm trái Excel |
| BR-080-03 | `code` là mã tự sinh `NT-{seq}`, disabled trên UI; client gửi code cũng bị service sinh lại (`request.setCode(generateCode(...))`) | AC-080-02 | Không |
| BR-080-04 | `unitId` là nguồn data scope; create phải validate đơn vị trong phạm vi user (`validateAllowedOrgUnit`), cấm để NULL vì #3 bắt buộc | AC-080-06 | Admin Cục/Cục full scope |
| BR-080-05 | Text input phải `.trim()` trước khi gửi API và lưu | AC-080-03 | Không |
| BR-080-06 | Các trường #23-#50 read-only trong create; nếu client gửi, server bỏ qua hoặc trả lỗi validation rõ nghĩa | AC-080-05 | Không |
| BR-080-07 | Các bảng con coordinates/attachments (nếu có) lưu cùng transaction với hồ sơ chính | AC-080-05 | Không |
| BR-080-08 | Permission `buoystation:create` (hoặc `data:create`) kiểm soát thao tác; `ROLE_SYSTEM_ADMIN` vượt qua theo cơ chế hệ thống | AC-080-07 | Không |
| BR-080-09 | Không gán placeholder/dữ liệu giả cho các trường chưa có nguồn (vận hành/bảo trì/sự cố, danh sách phao tiêu) | AC-080-05 | Không |

## Domain Model

- **BuoyStation** (`@Table buoy_station`, `@SQLRestriction("deleted_at IS NULL")`, `@FieldNameConstants`): code, name, description, unitId, operatingOrgId, portId, waterwayId, waterwayRouteId, province, address, constructionDate, totalArea, usableArea, staffCount, lastMaintenanceYear, note, objectType, icon, coordinateSystem, displayFormat, spatialId, isActive, condition, status (StationStatus), approvalStatus, approvalLevel, approvedBy/Date, level1ApprovedBy/Date, level2ApprovedBy/Date, sentApprovedBy/Date, rejectionReason, level1/level2ApprovalContent, operationPlan*, maintenancePlan*, incident* (read-only).
- **Enum lưu trữ — drift ghi nhận:** `approvalStatus` và `status` của `BuoyStation` lưu **ORDINAL + smallint** (`@Enumerated(EnumType.ORDINAL)`, `columnDefinition = "smallint default 0"`) — ĐÚNG theo convention AGENTS.md (INT + ORDINAL). Ngược lại `BeaconStation` (F-086..F-091) lưu **STRING** — xem drift tại F-086. Không bịa INT storage cho BeaconStation.
- **Buoy** (child, `@Table buoy`, FK `buoy_station_id`): chỉ hiển thị read-only ở tab "Danh sách phao tiêu" (#23-#27); là entity của module khác, KHÔNG author spec.
- Data scope: `@Filter(name = "orgUnitFilter", condition = "unit_id IN (:orgUnitIds)")` + controller `@DataScope`.

## 2-level approval flow (tham chiếu cho bước gửi duyệt khi tạo)

Theo `docs/conventions/approval-2-level-spec.md` mục 3: tạo mới → `DRAFT` (lưu tạm) hoặc `PENDING_APPROVAL` (gửi duyệt ngay). Người gửi cấp Cục (theo `OrgUnit.level`) bỏ qua vòng 1, vào thẳng `APPROVED_LEVEL1` (chờ Cục). Re-submit sau reject luôn quay lại vòng 1. Chi tiết vòng duyệt thuộc F-083.

## Validation Rules

- Bắt buộc khi tạo: `name`, `unitId`, `operatingOrgId`, `waterwayId`, `province`, `condition`, `staffCount` (Excel #2/#3/#4/#6/#8/#11/#14).
- `code`: auto-sinh, không nhận giá trị client, không trùng (`@NotBlank` trong DTO nhưng bị service ghi đè).
- Số liệu `totalArea`/`usableArea`/`staffCount` không âm (đề xuất, SA chốt).
- Text trim trước khi lưu; tọa độ theo định dạng hệ thống GIS.
- Thông báo lỗi bằng tiếng Việt có dấu.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-080-01 | AC-080-01 | Happy path: user có `buoystation:create` mở form và thấy đúng nhóm field #1-#22, không nhập được #23-#50 | Integration |
| TS-080-02 | AC-080-02 | Happy path: tạo hợp lệ, `code` sinh `NT-{seq}` tăng dần, field read-only không lấy từ client | Integration |
| TS-080-03 | AC-080-02 | Negative: gửi `code` trùng tự sinh → sinh mã mới, không lỗi trùng | Integration |
| TS-080-04 | AC-080-04 | Boundary: `action=draft` giữ `DRAFT`; `action=submit` chuyển `PENDING_APPROVAL` + ghi sentApproved* | Integration |
| TS-080-05 | AC-080-06 | Security: user chọn `unitId` ngoài phạm vi → 403 và không tạo bản ghi | Security |
| TS-080-06 | AC-080-07 | Security: user thiếu permission gọi POST → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | `BuoyStation` là target; cần đối chiếu field map Excel với entity hiện tại; sheet "QL Nhà trạm phao tiêu" là nguồn thay thế cho "QL Nhà trạm phao". |
| Architecture affected? | Low/Medium | Endpoint `/api/v1/buoy-station` + permission `buoystation:*` + Data Scope đã có; SA chốt schema target/migration. |
| Implementation clear? | Yes | Field matrix, required fields, auto-code `NT-{seq}`, approval states, data scope và permissions rõ ràng. |
| Documentation risk | Medium | Feature-brief F-080 dẫn `/api/v1/buoys` + `buoy_stations` — drift so với thực tế `/api/v1/buoy-station` + `buoy_station`; ghi nhận trong spec, KHÔNG sửa feature-brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa target field map, auto-code, trạng thái khởi tạo, data scope và permission boundary. |
