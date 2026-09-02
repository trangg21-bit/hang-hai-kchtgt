---
feature-id: F-084
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xem chi tiết Nhà trạm phao

## Summary

Tính năng cho phép người dùng có quyền `buoystation:read` xem chi tiết hồ sơ Nhà trạm phao (`BuoyStation`, `@Table buoy_station`) qua `GET /api/v1/buoy-station/{id}`. Màn chi tiết hiển thị đầy đủ các nhóm thông tin theo field map Excel sheet "QL Nhà trạm phao tiêu" (sheet thay thế cho "QL Nhà trạm phao" không tồn tại): thông tin chung #1-#16, GIS #17-#21, file đính kèm #22, danh sách phao tiêu #23-#27 (child `Buoy` read-only), vận hành/bảo trì/sự cố #28-#39 (read-only), xử lý & theo dõi #40-#50 (read-only). Admin Cục xem thêm metadata nhạy cảm (người tạo, người sửa cuối) qua quyền `view_sensitive`. Data scope theo `unitId`.

## Scope

| | Items |
|---|---|
| In scope | GET chi tiết 1 hồ sơ; hiển thị 6 nhóm thông tin #1-#50 theo đúng trạng thái read-only; trả về `unitName` cho đơn vị quản lý; danh sách file đính kèm; danh sách phao tiêu child; metadata phê duyệt; Admin Cục xem metadata nhạy cảm; data scope theo `unitId`; phân quyền `buoystation:read`. |
| Out of scope | Sửa (F-081); duyệt (F-083); lịch sử (F-085); export; migration. |
| Assumptions | User đăng nhập có `buoystation:read`; hồ sơ thuộc phạm vi đơn vị; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (sheet thay thế cho "QL Nhà trạm phao"). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

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
| 23 | Mã phao, tiêu | `buoy.code` (child) | Text (read-only) | — | Không | Không | Có | Không | Không |
| 24 | Tên phao, tiêu | `buoy.name` (child) | Text (read-only) | — | Không | Không | Có | Không | Không |
| 25 | Phân loại | `buoy.type` (child) | Text (read-only) | — | Có | Có | Có | Không | Không |
| 26 | Phân loại phao | `buoyType` (child) | Text (read-only) | — | Có | Có | Có | Không | Không |
| 27 | Phân loại tiêu | `buoy.beaconType` (child) | Text (read-only) | — | Có | Không | Có | Không | Không |
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
| US-084-01 | Người xem | Xem toàn bộ thông tin hồ sơ trong 1 màn chi tiết | Tra cứu đầy đủ ngữ cảnh hồ sơ | Must Have |
| US-084-02 | Admin Cục | Xem metadata nhạy cảm (người tạo, người sửa cuối, thời điểm) | Theo dõi trách nhiệm cập nhật | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-084-01 | US-084-01 | Hiển thị đầy đủ field map | Given user có `buoystation:read` và hồ sơ tồn tại; When GET `/api/v1/buoy-station/{id}`; Then trả về đủ #1-#50 theo nhóm, các trường read-only không cho sửa | Không placeholder khi nguồn rỗng |
| AC-084-02 | US-084-01 | Trả unitName | Given hồ sơ có `unitId`; When GET chi tiết; Then response kèm `unitName` (qua `OrgUnitCacheService`) | Không gọi API danh sách để map tên |
| AC-084-03 | US-084-01 | File đính kèm | Given hồ sơ có attachment; When GET chi tiết; Then trả danh sách file (tên, url, size, thời gian) | UploadFileTable |
| AC-084-04 | US-084-02 | Admin Cục xem metadata | Given user là Admin Cục/`buoystation:view_sensitive`; When xem chi tiết; Then thấy `createdBy/createdAt/updatedBy/updatedAt` | Người khác không thấy |
| AC-084-05 | US-084-01 | Data scope | Given hồ sơ ngoài phạm vi đơn vị; When GET; Then 403/404 và không lộ dữ liệu | `@Filter` orgUnitFilter + `@DataScope` |
| AC-084-06 | US-084-01 | Phân quyền | Given user thiếu `buoystation:read`; When GET; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-084-01 | Màn chi tiết hiển thị đúng field map #1-#50 theo sheet "QL Nhà trạm phao tiêu" (sheet thay thế); trường read-only chỉ hiển thị | AC-084-01 | Không |
| BR-084-02 | Response phải trả cả `unitId` và `unitName` (ánh xạ qua `OrgUnitCacheService`, không truy vấn từng bản ghi) | AC-084-02 | Không |
| BR-084-03 | Metadata nhạy cảm chỉ hiển thị cho Admin Cục/`view_sensitive` | AC-084-04 | Không |
| BR-084-04 | Không gán dữ liệu giả khi nguồn rỗng (vận hành/bảo trì/sự cố, danh sách phao tiêu) — hiển thị rỗng có kiểm soát | AC-084-01 | Không |
| BR-084-05 | Data scope: user chỉ xem hồ sơ trong phạm vi đơn vị (subtree), Cục full | AC-084-05 | `orgunit:scope_all`/`admin:all` |
| BR-084-06 | Permission `buoystation:read` (fallback `data:read`); Admin Cục thêm `view_sensitive` | AC-084-06 | ROLE_SYSTEM_ADMIN vượt qua |

## Domain Model

Cùng entity `BuoyStation` như F-080. Danh sách phao tiêu child lấy từ `Buoy` (`@Table buoy`, FK `buoy_station_id`) — read-only, thuộc module khác.

## 2-level approval flow

Không áp dụng trực tiếp — màn chi tiết hiển thị kết quả của luồng duyệt (#40, #43-#50) dạng read-only.

## Validation Rules

- GET `{id}` không tồn tại hoặc đã soft-delete → 404.
- Ngoài data scope → 403/404 (không lộ sự tồn tại).

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-084-01 | AC-084-01 | Happy path: GET chi tiết trả đủ 6 nhóm #1-#50 | Integration |
| TS-084-02 | AC-084-02 | Happy path: response có `unitName` map đúng đơn vị | Integration |
| TS-084-03 | AC-084-04 | Security: Admin Cục thấy metadata nhạy cảm, user thường không thấy | Security |
| TS-084-04 | AC-084-05 | Security: GET hồ sơ ngoài phạm vi → 403/404 | Security |
| TS-084-05 | AC-084-06 | Security: thiếu `buoystation:read` → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Cần DTO chi tiết gộp GIS, attachments, child buoy list, metadata duyệt. |
| Architecture affected? | Low | `GET /api/v1/buoy-station/{id}` đã tồn tại; bổ sung unitName + view_sensitive. |
| Implementation clear? | Yes | Field map, read-only groups, data scope và permissions rõ ràng. |
| Documentation risk | Medium | Feature-brief F-084 dẫn `GET /api/v1/buoys/{id}` — drift: endpoint thực tế `/api/v1/buoy-station/{id}`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa nội dung màn chi tiết, unitName, view_sensitive và data scope. |
