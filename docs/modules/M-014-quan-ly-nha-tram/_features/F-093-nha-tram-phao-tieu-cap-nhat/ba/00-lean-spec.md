---
feature-id: F-093
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Nhà trạm phao tiêu

## Summary

Tính năng cho phép người dùng có quyền `buoystation:update` cập nhật hồ sơ Nhà trạm phao tiêu qua `PUT /api/v1/buoy-station/{id}` — **cùng entity `BuoyStation`** (`@Table buoy_station`) với F-080..F-085 và F-092. Nguồn field map: sheet "QL Nhà trạm phao tiêu" (sheet GỐC). Quy tắc sửa theo trạng thái (approval-2-level-spec mục 3.9): `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` → sửa + gửi lại; `PENDING_APPROVAL`/`APPROVED_LEVEL1`/`ARCHIVED` → cấm (403); `APPROVED` → "Lưu và phê duyệt" với `buoystation:approvec2`, giữ `APPROVED`. Cập nhật qua `EntityUpdateUtils.copyPropertiesIfPresent`, ghi diff. **DRIFT (brief):** F-093 dẫn `/api/v1/buoy-beacon-stations/{id}` + bảng `buoy_beacon_station_changes` — thực tế `/api/v1/buoy-station/{id}` + nhật ký `infrastructure_history`.

## Scope

| | Items |
|---|---|
| In scope | Cập nhật field map #1-#22; kiểm tra trạng thái; cập nhật GIS/file; "Lưu và phê duyệt" hồ sơ `APPROVED`; ghi diff; data scope theo `unitId`; phân quyền `buoystation:update`. |
| Out of scope | Sửa code/schema; tạo (F-092); xóa (F-094); chi tiết (F-095); author spec `Buoy`; migration. |
| Assumptions | User đăng nhập có quyền; hồ sơ thuộc phạm vi; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (~line 740) — sheet gốc. Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

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
| 23-27 | Danh sách phao tiêu | `buoy.*` (child read-only) | Text (read-only) | — | 25,26: Có | 25,26: Có | Có | Không | Không |
| 28-39 | Vận hành/bảo trì/sự cố | `operationPlan*`, `maintenancePlan*`, `incident*` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 40 | Trạng thái | `approvalStatus` | Badge (read-only) | — | Có | Có | Có | Không | Không |
| 41 | Ngày cập nhật | `updatedAt` | Text (read-only) | — | Có | Có | Có | Không | Không |
| 42 | Cán bộ cập nhật | `updatedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 43-50 | Thông tin gửi/phê duyệt C1/C2 | `sentApproved*`, `level1/level2Approved*`, `level1/level2ApprovalContent` | Text (read-only) | — | 43-46,48,49: Có | Không | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-093-01 | Chuyên viên | Sửa hồ sơ `DRAFT`/bị trả về | Hoàn thiện hồ sơ | Must Have |
| US-093-02 | Chuyên viên | Sửa + gửi lại sau reject | Không tắc quy trình | Must Have |
| US-093-03 | Người có quyền C2 | Sửa hồ sơ `APPROVED` qua "Lưu và phê duyệt" | Cập nhật hồ sơ hiệu lực | Must Have |
| US-093-04 | Người dùng | Không sửa được hồ sơ chờ duyệt | Bảo toàn nội dung | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-093-01 | US-093-01 | Sửa DRAFT | Given hồ sơ `DRAFT` + `buoystation:update`; When PUT `/api/v1/buoy-station/{id}`; Then cập nhật field present, diff ghi nhật ký | Không ghi đè NULL |
| AC-093-02 | US-093-04 | Cấm sửa khi chờ duyệt | Given `PENDING_APPROVAL`/`APPROVED_LEVEL1`; When PUT; Then 403; UI ẩn nút | Ma trận T12 |
| AC-093-03 | US-093-02 | Sửa và gửi lại | Given `REJECTED_LEVEL1`/`REJECTED_LEVEL2`; When PUT kèm submit; Then về `PENDING_APPROVAL` | Re-submit về vòng 1 |
| AC-093-04 | US-093-03 | Lưu và phê duyệt | Given `APPROVED` + quyền C2; When PUT; Then giữ `APPROVED`, bản cũ ghi nhật ký | Không hạ về DRAFT |
| AC-093-05 | US-093-01 | Data scope | Given hồ sơ ngoài phạm vi; When PUT; Then 403 | `validateAllowedOrgUnit` |
| AC-093-06 | US-093-01 | Field read-only | Given payload gửi metadata; When PUT; Then bỏ qua/trả lỗi | Không cho client ghi metadata |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-093-01 | Ma trận sửa theo trạng thái (mục 3.9): DRAFT/REJECTED_* sửa được; PENDING/APPROVED_LEVEL1/ARCHIVED cấm; APPROVED chỉ qua "Lưu và phê duyệt" | AC-093-02, AC-093-04 | Không |
| BR-093-02 | Dùng `EntityUpdateUtils.copyPropertiesIfPresent` | AC-093-01 | Không |
| BR-093-03 | `code` không sửa qua PUT (`NT-{seq}` cố định) | AC-093-01 | Không |
| BR-093-04 | `unitId` thay đổi trong phạm vi user | AC-093-05 | Admin Cục/Cục full |
| BR-093-05 | Metadata duyệt + vận hành/bảo trì/sự cố read-only | AC-093-06 | Không |
| BR-093-06 | "Lưu và phê duyệt" giữ `APPROVED`, ghi bản cũ vào nhật ký | AC-093-04 | Không |
| BR-093-07 | **DRIFT (brief):** F-093 dẫn `PUT /api/v1/buoy-beacon-stations/{id}` + `buoy_beacon_station_changes` — thực tế `/api/v1/buoy-station/{id}` + `infrastructure_history`; ghi nhận, không sửa brief | AC-093-01 | Không |
| BR-093-08 | Permission `buoystation:update` (fallback `data:update`); C2 cho "Lưu và phê duyệt" | AC-093-01, AC-093-04 | ROLE_SYSTEM_ADMIN vượt qua |

## Domain Model

Cùng entity `BuoyStation` như F-092 (`@Table buoy_station`, filter `unit_id`, approvalStatus ORDINAL smallint). Child `Buoy` read-only.

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
| TS-093-01 | AC-093-01 | Happy path: sửa DRAFT thành công, diff ghi nhật ký | Integration |
| TS-093-02 | AC-093-02 | Negative: PUT hồ sơ PENDING_APPROVAL → 403 | Integration |
| TS-093-03 | AC-093-03 | Boundary: sửa + gửi lại từ REJECTED_LEVEL2 → PENDING_APPROVAL | Integration |
| TS-093-04 | AC-093-04 | Approval: "Lưu và phê duyệt" giữ APPROVED | Integration |
| TS-093-05 | AC-093-05 | Security: ngoài phạm vi → 403 | Security |
| TS-093-06 | AC-093-06 | Negative: payload gửi approvalStatus bị bỏ qua | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Cùng target `BuoyStation`. |
| Architecture affected? | Low/Medium | `PUT /api/v1/buoy-station/{id}` + `buoystation:update` đã có. |
| Implementation clear? | Yes | Ma trận trạng thái, copyPropertiesIfPresent, giữ APPROVED rõ ràng. |
| Documentation risk | Medium | Brief F-093 dẫn endpoint/bảng cũ (`buoy-beacon-stations`, `buoy_beacon_station_changes`) — drift; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa ma trận sửa, behavior lưu và phê duyệt, data scope. |
