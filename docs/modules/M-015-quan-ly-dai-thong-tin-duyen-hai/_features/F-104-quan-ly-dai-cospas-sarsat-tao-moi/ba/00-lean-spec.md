---
feature-id: F-104
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Đài Cospas-Sarsat (CoastalStationCospasSarsat)

## Summary

Tính năng tạo mới hồ sơ Đài Cospas-Sarsat. **ĐÃ XÁC MINH:** entity `CoastalStationCospasSarsat` (`@Table coastal_station_cospas_sarsat`, `@Filter(orgUnitFilter, condition = "unit_id IN (:orgUnitIds)")`) + controller `CoastalStationCospasSarsatController` (`@RequestMapping("/api/v1/stations/cospas-sarsat")`, `@DataScope`). Excel sheet "Đài Cospas-Sarsat" (~line 1725). **DRIFT #2/#6 (auto-code):** Excel ghi "Mã đài tự sinh SARSAT-{seq}" nhưng `CoastalStationCospasSarsatService` KHÔNG có `generateCode()` — `entity.setCode(request.getStationCode())` (mã từ request, bắt buộc client truyền). **DRIFT #1:** `status`/`approvalStatus` ORDINAL smallint (đúng convention INT); entity KHÔNG có `conditionStatus` (Tình trạng hiện dùng `isActive`) và không có `operatingOrgId`/`services`/`notes` — các cột Excel tương ứng chưa có trong entity (SA chốt). **OBSERVATION (permission):** controller Cospas chỉ có @PreAuthorize cho submit/approve-l1/approve-l2/approve/reject; GET/DELETE/PUT/POST /create không có @PreAuthorize method-level — chính sách quyền CRUD cần SA xác nhận. Tạo mới đặt DRAFT (@PrePersist setDefaultStatus). History CREATE.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-104-01 | Người nhập | Form "Tạo mới Đài Cospas-Sarsat" | Điền TAB1 (11 trường), GIS, file → Lưu tạm / gửi duyệt | Hồ sơ DRAFT, code (từ request), history CREATE |
| UC-104-02 | Hệ thống | POST /api/v1/stations/cospas-sarsat/create | createStation → FieldWriteGuard → save → history | 200 + entity |

## Scope

| | Items |
|---|---|
| In scope | Tạo mới theo Excel; trạng thái DRAFT; ghi history; validate bắt buộc; data scope unitId; quyền `coastalstationcospassarsat:create`. |
| Out of scope | Auto-code sinh server (chưa có — drift); duyệt (F-107); xóa (F-106); lịch sử (F-109); chi tiết (F-108). |
| Assumptions | Danh mục đã có nguồn; phần kỹ thuật đề xuất BA, SA chốt. |

## Field Coverage Matrix

Nguồn: Excel sheet "Đài Cospas-Sarsat" (~line 1725).

| # | Tên trường (Excel) | Technical field | Loại điều khiển | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Mã đài | `code` | Input (disabled, tự sinh SARSAT-{seq}) | T | T | T | T | T |
| 2 | Tên đài (bắt buộc) | `name` | InputTextArea | T | T | T | T | T |
| 3 | Đơn vị quản lý (bắt buộc) | `unitId` | SelectOrgCode | T | T | T | T | T |
| 4 | Đơn vị khai thác | — (chưa có cột; đề xuất `operatingOrgId`) | SelectCateOther | T | F | T | T | T |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | `provinceId` | SelectCateOther | T | T | T | T | T |
| 6 | Địa điểm chi tiết (bắt buộc) | `locationAddress` | InputTextArea | F | F | T | T | T |
| 7 | Tình trạng (bắt buộc) | `isActive` (Boolean) | SelectAppParams | T | T | T | T | T |
| 8 | Vùng phủ sóng | `coverageArea` | InputTextArea | F | F | T | T | T |
| 9 | Dịch vụ cung cấp | — (chưa có cột; đề xuất `servicesProvided`) | SelectAppParams (multi-select) | F | F | T | T | T |
| 10 | Tần số liên lạc | `frequency` | InputTextArea | F | F | T | T | T |
| 11 | Ghi chú | `description` | InputTextArea | F | F | T | T | T |
| TAB2 | Vị trí (GIS) | `objectType`/`symbol`/`coordinateSystem`/`displayRule`/`latitude`/`longitude` (+ `spatialId`) | Select/Text/LongLatTable | F | F | T | T | T |
| TAB3 | File đính kèm | attachment | UploadFileTable | F | F | T | T | T |
| TAB4 | Vận hành & bảo trì (read-only) | từ module VH&BT | Text (read-only) | F | F | T | F | F |
| TAB5 | Xử lý & theo dõi | `approvalStatus`/`updatedAt`/`submittedAt`/`approverLevel1/2`... | Badge/Text (read-only) | T/F | T/F | T | F | F |

> Entity Cospas còn có: `beaconProtocol`, `emergencyChannel`, `antennaType`, `signalRange`, `operatingMode`, `contactPerson`, `contactPhone` — trường đặc thù kỹ thuật chưa nằm trong Excel; hiển thị thêm ở CT nếu cần (SA chốt).

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-104-01 | Trạng thái khởi tạo DRAFT (approvalStatus + status) | AC-104-01 | @PrePersist setDefaultStatus |
| BR-104-02 | Mã bắt buộc duy nhất; trùng → 400 | AC-104-02 | findByCode |
| BR-104-03 | **DRIFT:** Excel tự sinh `SARSAT-{seq}` — code nhận từ request, chưa sinh server | AC-104-03 | SA chốt |
| BR-104-04 | Trường bắt buộc: Tên đài, Đơn vị quản lý, Địa điểm Tỉnh/TP, Địa điểm chi tiết, Tình trạng | AC-104-04 | |
| BR-104-05 | History CREATE | AC-104-05 | |
| BR-104-06 | Quyền `coastalstationcospassarsat:create` (fallback specialstation:create, data:create, admin:all) | AC-104-06 | |
| BR-104-07 | Data scope unitId; không để NULL | AC-104-07 | |

## Domain Model

`CoastalStationCospasSarsat` (`coastal_station_cospas_sarsat`): provinceId, code(50), name(255), description(1000), unitId (orgUnit — getOrgUnitId()), spatialId, isActive, status/approvalStatus (ORDINAL smallint), approvalLevel, submittedAt/By, approverLevel1/2 + approvedDateLevel1/2, approvedBy/Date, rejectionReason, frequency, coverageArea, beaconProtocol, emergencyChannel, antennaType, locationAddress(1000), contactPerson, contactPhone, signalRange, operatingMode. `@SQLRestriction("deleted_at IS NULL")`, `@Filter(unit_id IN (:orgUnitIds))`.

## Approval flow (2 cấp C1→C2)

Giống F-095 với `InfrastructureType.COSPAS_SARSAT_STATION`; endpoint `POST /api/v1/stations/cospas-sarsat/{id}/submit|approve-l1|approve-l2|reject` — **DRIFT #3:** tên approve-l1/l2.

## Validation Rules

- FieldWriteGuard.validateObject(request); mã trùng → 400; submit từ DRAFT/REJECTED_*; approve-l1 từ PENDING_APPROVAL; approve-l2 từ APPROVED_LEVEL1; reject ≥10 ký tự; 4-eyes trung tâm (InfrastructureApprovalService).

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-104-01 | POST /create hợp lệ → 200 + approvalStatus=DRAFT, status=DRAFT, isActive=true |
| AC-104-02 | Mã trùng → 400 |
| AC-104-03 | **Drift test:** không truyền code → server không tự sinh SARSAT (lỗi hoặc thiếu) — chờ SA chốt generateCode |
| AC-104-04 | Thiếu trường bắt buộc → chặn, thông báo tiếng Việt |
| AC-104-05 | History CREATE tồn tại |
| AC-104-06 | User thiếu quyền → 403 (nếu chính sách áp dụng — xem observation) |
| AC-104-07 | Gán unitId ngoài phạm vi → từ chối |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Thiếu cột operatingOrgId/services/conditionStatus so Excel; SA chốt |
| Architecture affected? | Medium | Thiếu generateCode (drift #2/#6); thiếu @PreAuthorize CRUD (observation) |
| Implementation clear? | Mostly | Create + DRAFT rõ; auto-code là drift |
| Documentation risk | Medium | Brief ghi "pending sau tạo" — sai với DRAFT (drift #5) |
| **Verdict** | `Ready for Solution Designer review` | Rõ; 3 drift + 1 observation ghi nhận |
