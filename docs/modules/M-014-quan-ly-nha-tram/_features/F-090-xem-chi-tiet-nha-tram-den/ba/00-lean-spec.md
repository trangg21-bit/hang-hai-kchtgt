---
feature-id: F-090
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xem chi tiết Nhà trạm đèn

## Summary

Tính năng cho phép người dùng có quyền `beaconstation:read` xem chi tiết hồ sơ Nhà trạm đèn (`BeaconStation`, `@Table beacon_light`) qua `GET /api/beacon-stations/{id}`. Màn chi tiết hiển thị theo field map Excel sheet "QL Đèn biển và nhà trạm": thông tin chung #1-#8, kỹ thuật đèn biển #9-#22, thông tin nhà trạm #23-#28, GIS #29-#33, file đính kèm #34, vận hành/bảo trì/sự cố #35-#46 (read-only), xử lý & theo dõi #47-#57 (read-only). Response kèm `unitName`. Admin Cục xem metadata nhạy cảm qua `view_sensitive`. Data scope theo `orgUnitId`.

## Scope

| | Items |
|---|---|
| In scope | GET chi tiết 1 hồ sơ; hiển thị các nhóm #1-#57 đúng trạng thái read-only; trả `unitName`; danh sách file đính kèm; metadata phê duyệt; Admin Cục xem metadata nhạy cảm; data scope theo `orgUnitId`; phân quyền `beaconstation:read`. |
| Out of scope | Sửa (F-087); duyệt (F-089); lịch sử (F-091); export; migration. |
| Assumptions | User đăng nhập có `beaconstation:read`; hồ sơ thuộc phạm vi; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Đèn biển và nhà trạm" (line ~113). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

| # | Label | Technical field | Control | Required | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã đèn biển | `code` | Input (disabled, tự sinh `DBNT-%06d`) | Không (auto) | Có | Có | Có | Có | Có |
| 2 | Tên đèn biển | `name` | InputTextArea | **Có** | Có | Có | Có | Có | Có |
| 3 | Đơn vị quản lý | `orgUnitId` (+ `unitName`) | SelectOrgCode | **Có** | Có | Có | Có | Có | Có |
| 4 | Thuộc cảng biển | `seaportId` | SelectKcht (CB) | Không | Có | Có | Có | Có | Có |
| 5 | Đơn vị vận hành | `operator` / `unitId` | SelectCateOther | Không | Có | Có | Có | Có | Có |
| 6 | Địa điểm (Tỉnh/TP) | `provinceId` | SelectCateOther | Không | Có | Có | Có | Có | Có |
| 7 | Địa điểm chi tiết | `detailedLocation` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 8 | Tình trạng | `status`/`operationalStatus` | SelectAppParams | Không | Có | Có | Có | Có | Có |
| 9 | Chủng loại đèn chính | `primaryLightModel` | Input | Không | Không | Có | Có | Có | Có |
| 10 | Chủng loại đèn dự phòng | `backupLightModel` | Input | Không | Không | Không | Có | Có | Có |
| 11 | Cấp trạm đèn | `type` | SelectAppParams | Không | Có | Có | Có | Có | Có |
| 12 | Địa bàn | `region` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 13 | Đặc điểm nhận dạng | `identifyingFeature` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 14 | Hình dạng | `shape` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 15 | Chiều cao tháp đèn (m) | `towerHeight` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 16 | Chiều cao tâm sáng (m) | `lightHeight` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 17 | Tầm hiệu lực địa lý | `geographicRange` | Input | Không | Không | Không | Có | Có | Có |
| 18 | Tầm hiệu lực ánh sáng | `lightRange` | Input | **Có** | Không | Không | Có | Có | Có |
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
| 31 | Hệ quy chiếu (GIS) | `coordinateSystem` | SelectAppParams | Không | Không | Không | Có | Có | Có |
| 32 | Quy tắc hiển thị (GIS) | `displayRule` | SelectAppParams | Không | Không | Không | Có | Có | Có |
| 33 | Tọa độ (GIS) | `coordinates` (qua `spatialId`) | LongLatTable | Không | Không | Không | Có | Có | Có |
| 34 | Danh sách file | `attachments` | UploadFileTable | Không | Không | Không | Có | Có | Có |
| 35-38 | Thông tin vận hành khai thác | plan* (read-only) | Text (read-only) | — | Không | Không | Có | Không | Không |
| 39-42 | Thông tin bảo trì | plan* (read-only) | Text (read-only) | — | Không | Không | Có | Không | Không |
| 43-46 | Thông tin sự cố | incident* (read-only) | Text (read-only) | — | Không | Không | Có | 46: Có | Không |
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
| 57 | Trạng thái | `approvalStatus` | Select (Dropdown) | — | Có | Có | Có | Không | Không |

> \* Entity `BeaconStation` thiếu cột level1/level2/sent — nguồn từ history hoặc bổ sung (SA chốt, xem F-089 drift).

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-090-01 | Người xem | Xem toàn bộ thông tin hồ sơ nhà trạm đèn | Tra cứu đầy đủ ngữ cảnh | Must Have |
| US-090-02 | Admin Cục | Xem metadata nhạy cảm | Theo dõi trách nhiệm | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-090-01 | US-090-01 | Hiển thị đầy đủ field map | Given user có `beaconstation:read` + hồ sơ tồn tại; When GET `/api/beacon-stations/{id}`; Then trả về đủ #1-#57, read-only đúng nhóm | Không placeholder |
| AC-090-02 | US-090-01 | Trả unitName | Given hồ sơ có đơn vị; When GET; Then response kèm `unitName` | `OrgUnitCacheService` |
| AC-090-03 | US-090-01 | File đính kèm | Given hồ sơ có attachment; When GET; Then trả danh sách file | UploadFileTable |
| AC-090-04 | US-090-02 | Admin Cục xem metadata | Given Admin Cục/`view_sensitive`; When xem; Then thấy `createdBy/createdAt/updatedBy/updatedAt` | Người khác không thấy |
| AC-090-05 | US-090-01 | Data scope | Given hồ sơ ngoài phạm vi; When GET; Then 403/404 | `org_unit_id` filter |
| AC-090-06 | US-090-01 | Phân quyền | Given thiếu `beaconstation:read`; When GET; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-090-01 | Màn chi tiết hiển thị đúng field map #1-#57 theo sheet "QL Đèn biển và nhà trạm" | AC-090-01 | Không |
| BR-090-02 | Response trả cả `unitId`/`unitName` (qua `OrgUnitCacheService`) | AC-090-02 | Không |
| BR-090-03 | Metadata nhạy cảm chỉ hiển thị cho Admin Cục/`view_sensitive` | AC-090-04 | Không |
| BR-090-04 | Không gán dữ liệu giả khi nguồn rỗng | AC-090-01 | Không |
| BR-090-05 | Data scope `org_unit_id`; Cục full | AC-090-05 | `orgunit:scope_all`/`admin:all` |
| BR-090-06 | Permission `beaconstation:read` (fallback `data:read`) | AC-090-06 | ROLE_SYSTEM_ADMIN vượt qua |

## Domain Model

Cùng entity `BeaconStation` như F-086. Các trường #49-#56 phụ thuộc quyết định SA về cột level1/level2/sent.

## 2-level approval flow

Không áp dụng trực tiếp — hiển thị kết quả luồng duyệt (#47-#57) read-only.

## Validation Rules

- GET `{id}` không tồn tại/đã soft-delete → 404.
- Ngoài data scope → 403/404.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-090-01 | AC-090-01 | Happy path: GET chi tiết trả đủ 6 nhóm #1-#57 | Integration |
| TS-090-02 | AC-090-02 | Happy path: response có `unitName` | Integration |
| TS-090-03 | AC-090-04 | Security: Admin Cục thấy metadata nhạy cảm | Security |
| TS-090-04 | AC-090-05 | Security: GET ngoài phạm vi → 403/404 | Security |
| TS-090-05 | AC-090-06 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Cần DTO chi tiết gộp GIS, attachments, metadata duyệt. |
| Architecture affected? | Low | `GET /api/beacon-stations/{id}` đã tồn tại; bổ sung unitName + view_sensitive. |
| Implementation clear? | Yes | Field map, read-only groups, data scope rõ ràng (trừ #49-#56 chờ SA). |
| Documentation risk | Medium | Feature-brief F-090 dẫn `GET /api/v1/beacons/{id}` — drift: endpoint `/api/beacon-stations/{id}`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa nội dung màn chi tiết, unitName, view_sensitive và data scope. |
