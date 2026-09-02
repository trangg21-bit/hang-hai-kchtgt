---
feature-id: F-110
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Đài LRIT (CoastalStationLRIT)

## Summary

Tính năng tạo mới hồ sơ Đài LRIT. **ĐÃ XÁC MINH:** entity `CoastalStationLRIT` (`@Table coastal_station_lrit`, `@Filter(orgUnitFilter, condition = "org_unit_id IN (:orgUnitIds)")`) + controller `CoastalStationLRITController` (`@RequestMapping("/api/v1/stations/lrit")`, `@DataScope`). Excel sheet "Đài LRIT" (~line 1674). **Auto-code CÓ:** `CoastalStationLRITService.generateCode()` → `"LRIT-%04d"`; createStation dùng request.getCode() nếu có, ngược lại generateCode(); trùng → IllegalArgumentException. Tạo mới đặt DRAFT + conditionStatus="OPERATIONAL" (@PrePersist). **DRIFT #5:** brief ghi "pending sau tạo" — code thực tế DRAFT. **DRIFT #1:** enum ORDINAL smallint (đúng); conditionStatus String. Điểm khác Excel LRIT: KHÔNG có trường "Tần số liên lạc" (chỉ 10 trường TAB1) nhưng entity có `communicationChannel`, `dataFormat`, `terminalId`, `imoNumber`, `reportingInterval`, `antennaHeight`, `powerOutput`, `antennaType` — trường đặc thù LRIT ngoài Excel. History CREATE.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-110-01 | Người nhập | Form "Tạo mới Đài LRIT" | Điền TAB1 (10 trường), GIS, file → Lưu tạm / gửi duyệt | Hồ sơ DRAFT, code LRIT-{seq}, history CREATE |
| UC-110-02 | Hệ thống | POST /api/v1/stations/lrit/create | createStation → generateCode → save → history | 200 + entity |

## Scope

| | Items |
|---|---|
| In scope | Tạo mới theo Excel sheet "Đài LRIT"; tự sinh mã `LRIT-%04d`; trạng thái DRAFT; history CREATE; validate bắt buộc; quyền `coastalstationlrit:create`; data scope orgUnitId. |
| Out of scope | Duyệt (F-113); xóa (F-112); lịch sử (F-115); chi tiết (F-114). |
| Assumptions | Danh mục đã có nguồn; phần kỹ thuật đề xuất BA, SA chốt. |

## Field Coverage Matrix

Nguồn: Excel sheet "Đài LRIT" (~line 1674) — 8 cột chính xác. Lưu ý: LRIT không có trường "Tần số liên lạc" (khác Inmarsat/Cospas).

| # | Tên trường (Excel) | Technical field | Loại điều khiển | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Mã đài | `code` | Input (disabled, tự sinh LRIT-{seq}) | T | T | T | T | T |
| 2 | Tên đài (bắt buộc) | `name` | InputTextArea | T | T | T | T | T |
| 3 | Đơn vị quản lý (bắt buộc) | `orgUnitId`/`unitId` | SelectOrgCode | T | T | T | T | T |
| 4 | Đơn vị khai thác | `operatingOrgId` | SelectCateOther | T | F | T | T | T |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | `provinceId` | SelectCateOther | T | T | T | T | T |
| 6 | Địa điểm chi tiết (bắt buộc) | `locationAddress` | InputTextArea | F | F | T | T | T |
| 7 | Tình trạng (bắt buộc) | `conditionStatus` (String, default OPERATIONAL) | SelectAppParams | T | T | T | T | T |
| 8 | Vùng phủ sóng | `coverageArea` | InputTextArea | F | F | T | T | T |
| 9 | Dịch vụ cung cấp | `servicesProvided` | SelectAppParams (multi-select) | F | F | T | T | T |
| 10 | Ghi chú | `description` | InputTextArea | F | F | T | T | T |
| TAB2 | Vị trí (GIS) | `geometryType`(POINT)/`symbol`/`coordinateSystem`(WGS84)/`displayRule`/`latitude`/`longitude` | Select/Text/LongLatTable | F | F | T | T | T |
| TAB3 | File đính kèm | attachment | UploadFileTable | F | F | T | T | T |
| TAB4 | Vận hành & bảo trì (read-only) | từ module VH&BT | Text (read-only) | F | F | T | F | F |
| TAB5 | Xử lý & theo dõi | `approvalStatus`/`updatedAt`/`submittedAt`/`approverLevel1/2`... | Badge/Text (read-only) | T/F | T/F | T | F | F |

> Entity LRIT còn có trường đặc thù ngoài Excel: `terminalId`, `imoNumber`, `reportingInterval`, `antennaHeight`, `powerOutput`, `antennaType`, `dataFormat`, `communicationChannel`, `contactPerson`, `contactPhone` — hiển thị thêm ở CT (SA chốt vị trí).

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-110-01 | Mã tự sinh `LRIT-%04d`; client truyền code thì dùng; trùng → 400 | AC-110-01 | generateCode + retry |
| BR-110-02 | Trạng thái khởi tạo DRAFT + conditionStatus=OPERATIONAL | AC-110-02 | @PrePersist |
| BR-110-03 | Trường bắt buộc: Tên đài, Đơn vị quản lý, Địa điểm Tỉnh/TP, Địa điểm chi tiết, Tình trạng | AC-110-03 | |
| BR-110-04 | History CREATE | AC-110-04 | |
| BR-110-05 | Quyền `coastalstationlrit:create` (fallback specialstation:create, data:create, admin:all) | AC-110-05 | |
| BR-110-06 | Data scope orgUnitId; không NULL | AC-110-06 | |
| BR-110-07 | @PrePersist đồng bộ code↔stationCode, name↔stationName, orgUnitId↔unitId | AC-110-07 | |

## Domain Model

`CoastalStationLRIT` (`coastal_station_lrit`): orgUnitId, unitId, operatingOrgId, provinceId, code, stationCode, name, stationName, description(1000), locationAddress(1000), spatialId, isActive, conditionStatus, status/approvalStatus (ORDINAL smallint), approvalLevel, submittedAt/By, approverLevel1/2, approvedDateLevel1/2, approvedBy/Date, rejectionReason, terminalId, imoNumber, reportingInterval (Integer), antennaHeight, powerOutput (Double), antennaType, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea, servicesProvided(1000), geometryType (POINT), symbol, coordinateSystem (WGS84), displayRule, latitude/longitude (BigDecimal 10,6). `getOrgUnitId()` = orgUnitId ?? unitId. Implements ApprovableEntity.

## Approval flow (2 cấp C1→C2)

Giống F-095 nhưng endpoint LRIT dùng tên **`approve-c1`/`approve-c2`** (ĐÚNG chuẩn — không drift #3): `POST /api/v1/stations/lrit/{id}/submit|approve-c1|approve-c2|reject`.

## Validation Rules

- FieldWriteGuard; mã trùng → 400; validateNotSelfApproval cục bộ; submit từ DRAFT/REJECTED_*; approve-c1 từ PENDING_APPROVAL; approve-c2 từ APPROVED_LEVEL1; reject ≥10 ký tự; 4-eyes trung tâm.

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-110-01 | POST /create không code → code=`LRIT-{seq}`; code trùng → 400 |
| AC-110-02 | Sau tạo: approvalStatus=DRAFT, status=DRAFT, conditionStatus=OPERATIONAL |
| AC-110-03 | Thiếu trường bắt buộc → chặn, tiếng Việt có dấu |
| AC-110-04 | History CREATE tồn tại |
| AC-110-05 | User thiếu `coastalstationlrit:create` → 403 |
| AC-110-06 | Gán orgUnitId ngoài phạm vi → từ chối |
| AC-110-07 | code==stationCode, name==stationName sau tạo |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Entity đầy đủ + trường đặc thù LRIT |
| Architecture affected? | Low | Tên endpoint approve-c1/c2 đã chuẩn |
| Implementation clear? | Yes | generateCode + createStation đã có |
| Documentation risk | Medium | Brief ghi "pending sau tạo" — sai với DRAFT (drift #5) |
| **Verdict** | `Ready for Solution Designer review` | Rõ ràng |
