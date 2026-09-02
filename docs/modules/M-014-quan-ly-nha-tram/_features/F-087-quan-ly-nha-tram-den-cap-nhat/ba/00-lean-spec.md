---
feature-id: F-087
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Nhà trạm đèn

## Summary

Tính năng cho phép người dùng có quyền `beaconstation:update` cập nhật hồ sơ Nhà trạm đèn (`BeaconStation`, `@Table beacon_light`) qua `PUT /api/beacon-stations/{id}`. Quy tắc sửa theo trạng thái (approval-2-level-spec mục 3.9): `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` → cho sửa + gửi lại; `PENDING_APPROVAL`/`APPROVED_LEVEL1`/`ARCHIVED` → cấm sửa (403); `APPROVED` → chỉ người có quyền phê duyệt C2 sửa qua "Lưu và phê duyệt", giữ nguyên `APPROVED`. Cập nhật dùng `EntityUpdateUtils.copyPropertiesIfPresent`; ghi diff vào nhật ký. Nguồn field map: sheet "QL Đèn biển và nhà trạm".

## Scope

| | Items |
|---|---|
| In scope | Cập nhật field map `BeaconStation` #1-#34; kiểm tra trạng thái cho phép sửa; cập nhật GIS/file đính kèm; "Lưu và phê duyệt" hồ sơ `APPROVED`; ghi diff; data scope theo `orgUnitId`; phân quyền `beaconstation:update`. |
| Out of scope | Sửa code/schema; phê duyệt (F-089); xóa (F-088); lịch sử (F-091); migration. |
| Assumptions | User đăng nhập có quyền; hồ sơ thuộc phạm vi đơn vị; phần kỹ thuật là đề xuất BA, SA chốt. |

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
| 35-46 | Vận hành/bảo trì/sự cố | plan*/incident* (read-only) | Text (read-only) | — | Không | Không | Có | 46: Có | Không |
| 47 | Ngày cập nhật | `updatedAt` | Textarea | — | Có | Có | Có | Không | Không |
| 48 | Cán bộ cập nhật | `updatedBy` | Textarea | — | Có | Có | Có | Không | Không |
| 49-56 | Thông tin gửi/phê duyệt | submitted/level1/level2 (history) | Textarea | — | 49,51,52,54,55: Có | Không | Có | Không | Không |
| 57 | Trạng thái | `approvalStatus` | Select (Dropdown) | — | Có | Có | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-087-01 | Chuyên viên | Sửa hồ sơ `DRAFT`/bị trả về | Hoàn thiện hồ sơ trước khi duyệt | Must Have |
| US-087-02 | Chuyên viên | Sửa và gửi lại sau reject | Không tắc quy trình | Must Have |
| US-087-03 | Người có quyền C2 | Sửa hồ sơ `APPROVED` qua "Lưu và phê duyệt" | Cập nhật hồ sơ hiệu lực | Must Have |
| US-087-04 | Người dùng | Không sửa được hồ sơ đang chờ duyệt | Bảo toàn nội dung đã đọc | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-087-01 | US-087-01 | Sửa DRAFT | Given hồ sơ `DRAFT` + `beaconstation:update`; When PUT `/api/beacon-stations/{id}`; Then cập nhật field present, ghi diff | Không ghi đè NULL |
| AC-087-02 | US-087-04 | Cấm sửa khi chờ duyệt | Given `PENDING_APPROVAL`/`APPROVED_LEVEL1`; When PUT; Then 403; UI ẩn nút | Ma trận T12 |
| AC-087-03 | US-087-02 | Sửa và gửi lại | Given `REJECTED_LEVEL1`/`REJECTED_LEVEL2`; When PUT kèm submit; Then về `PENDING_APPROVAL` | Re-submit về vòng 1 |
| AC-087-04 | US-087-03 | Lưu và phê duyệt | Given `APPROVED` + user có quyền C2; When PUT; Then giữ `APPROVED`, bản cũ ghi nhật ký | Không hạ về `DRAFT` |
| AC-087-05 | US-087-01 | Data scope | Given hồ sơ ngoài phạm vi; When PUT; Then 403 | `org_unit_id` filter |
| AC-087-06 | US-087-01 | Field read-only | Given payload gửi `approvalStatus`/metadata; When PUT; Then bỏ qua/trả lỗi | Không cho client ghi metadata |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-087-01 | Ma trận sửa theo trạng thái (mục 3.9 approval-2-level-spec): DRAFT/REJECTED_* sửa được; PENDING/APPROVED_LEVEL1/ARCHIVED cấm; APPROVED chỉ qua "Lưu và phê duyệt" với quyền C2 | AC-087-02, AC-087-04 | Không |
| BR-087-02 | Dùng `EntityUpdateUtils.copyPropertiesIfPresent` | AC-087-01 | Không |
| BR-087-03 | `code` không sửa qua PUT (mã tự sinh `DBNT-%06d`) | AC-087-01 | Không |
| BR-087-04 | `orgUnitId` thay đổi phải trong phạm vi user | AC-087-05 | Admin Cục/Cục full |
| BR-087-05 | Metadata phê duyệt + vận hành/bảo trì/sự cố read-only | AC-087-06 | Không |
| BR-087-06 | "Lưu và phê duyệt" ghi bản cũ vào nhật ký, giữ `APPROVED` | AC-087-04 | Không |
| BR-087-07 | Permission `beaconstation:update` (fallback `data:update`); C2 cho "Lưu và phê duyệt" | AC-087-01, AC-087-04 | ROLE_SYSTEM_ADMIN vượt qua |

## Domain Model

Cùng entity `BeaconStation` như F-086 (`@Table beacon_light`, filter `org_unit_id`). Drift enum STRING giữ nguyên như F-086.

## 2-level approval flow (góc độ sửa)

- DRAFT/REJECTED_* → `Hủy` · `Lưu tạm` · `Lưu và gửi phê duyệt`.
- APPROVED → `Hủy` · `Lưu và phê duyệt` (giữ APPROVED).
- Dùng chung `canEditApprovalRecord()` + `InfrastructureApprovalService.assertEditable()`.

## Validation Rules

- Chặn PUT khi trạng thái không cho sửa (403).
- Không sửa `code`; không nhận metadata từ client.
- Trim text; số liệu không âm (đề xuất).
- Đơn vị mới trong phạm vi user.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-087-01 | AC-087-01 | Happy path: sửa DRAFT thành công, diff ghi nhật ký | Integration |
| TS-087-02 | AC-087-02 | Negative: PUT hồ sơ PENDING_APPROVAL → 403 | Integration |
| TS-087-03 | AC-087-03 | Boundary: sửa + gửi lại từ REJECTED_LEVEL2 → PENDING_APPROVAL | Integration |
| TS-087-04 | AC-087-04 | Approval: "Lưu và phê duyệt" giữ APPROVED | Integration |
| TS-087-05 | AC-087-05 | Security: ngoài phạm vi → 403 | Security |
| TS-087-06 | AC-087-06 | Negative: payload gửi approvalStatus bị bỏ qua | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Cùng target `BeaconStation`. |
| Architecture affected? | Low/Medium | `PUT /api/beacon-stations/{id}` + `beaconstation:update` đã có. |
| Implementation clear? | Yes | Ma trận trạng thái, copyPropertiesIfPresent, giữ APPROVED rõ ràng. |
| Documentation risk | Medium | Feature-brief F-087 dẫn `PUT /api/v1/beacons/{id}` + bảng `beacon_station_changes` — drift: endpoint `/api/beacon-stations/{id}`, nhật ký qua `infrastructure_history`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa ma trận sửa, behavior lưu và phê duyệt, data scope. |
