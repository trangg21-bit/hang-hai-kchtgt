---
feature-id: F-116
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Đài TTXLTT Hà Nội (CoastalStationHaiphong)

## Summary

Tính năng tạo mới hồ sơ Đài TTXLTT Hà Nội. **ĐÃ XÁC MINH:** entity `CoastalStationHaiphong` (`@Table coastal_station_haiphong`, `@Filter(orgUnitFilter, condition = "org_unit_id IN (:orgUnitIds)")`) + controller `CoastalStationHaiphongController` (`@RequestMapping("/api/v1/stations/haiphong")`, `@DataScope`). **DRIFT #4 (entity naming):** feature/folder dùng nhãn "Đài TTXLTT Hà Nội" (slug `dai-tt-hang-hai-hn`) nhưng entity/tên bảng là `CoastalStationHaiphong`/`coastal_station_haiphong` và `InfrastructureType.HANOI_STATION` (map history "HAIPHONG" → HANOI_STATION) — ghi nhận, không sửa code. Excel sheet "Đài TTXLTT Hà Nội" (~line 1777) là nguồn ma trận — **điểm khác biệt:** chỉ 9 trường TAB1 (KHÔNG có "Vùng phủ sóng", KHÔNG có "Tần số liên lạc") và "Địa điểm chi tiết" có **Bộ lọc = T** (duy nhất trong 5 nhóm đài). **Auto-code CÓ:** `CoastalStationHaiphongService.generateCode()` → `"TTXLTT-%04d"`. Tạo mới đặt DRAFT + conditionStatus="OPERATIONAL". History CREATE. DRIFT #5 (brief "pending sau tạo" — code DRAFT).

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-116-01 | Người nhập | Form "Tạo mới Đài TTXLTT Hà Nội" | Điền TAB1 (9 trường), GIS, file → Lưu tạm / gửi duyệt | Hồ sơ DRAFT, code TTXLTT-{seq}, history CREATE |
| UC-116-02 | Hệ thống | POST /api/v1/stations/haiphong/create | createStation → generateCode → save → history | 200 + entity |

## Scope

| | Items |
|---|---|
| In scope | Tạo mới theo Excel sheet "Đài TTXLTT Hà Nội"; tự sinh mã `TTXLTT-%04d`; trạng thái DRAFT; history CREATE; validate bắt buộc; quyền `coastalstationhaiphong:create`; data scope orgUnitId. |
| Out of scope | Duyệt (F-119); xóa (F-118); lịch sử (F-121); chi tiết (F-120); đổi tên entity (drift #4 — SA chốt). |
| Assumptions | Danh mục đã có nguồn; phần kỹ thuật đề xuất BA, SA chốt. |

## Field Coverage Matrix

Nguồn: Excel sheet "Đài TTXLTT Hà Nội" (~line 1777) — 8 cột chính xác. Chú ý: "Địa điểm chi tiết" có Bộ lọc = T (khác 4 nhóm đài còn lại).

| # | Tên trường (Excel) | Technical field | Loại điều khiển | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Mã đài | `code` | Input (disabled, tự sinh TTXLTT-{seq}) | T | T | T | T | T |
| 2 | Tên đài (bắt buộc) | `name` | InputTextArea | T | T | T | T | T |
| 3 | Đơn vị quản lý (bắt buộc) | `orgUnitId`/`unitId` | SelectOrgCode | T | T | T | T | T |
| 4 | Đơn vị khai thác | `operatingOrgId` | SelectCateOther | T | F | T | T | T |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | `provinceId` | SelectCateOther | T | T | T | T | T |
| 6 | Địa điểm chi tiết (bắt buộc) | `locationAddress` | InputTextArea | F | **T** | T | T | T |
| 7 | Tình trạng (bắt buộc) | `conditionStatus` (String, default OPERATIONAL) | SelectAppParams | T | T | T | T | T |
| 8 | Dịch vụ cung cấp | `servicesProvided` | SelectAppParams (multi-select) | F | F | T | T | T |
| 9 | Ghi chú | `description` | InputTextArea | F | F | T | T | T |
| TAB2 | Vị trí (GIS) | `geometryType`(POINT)/`symbol`/`coordinateSystem`(WGS84)/`displayRule`/`latitude`/`longitude` | Select/Text/LongLatTable | F | F | T | T | T |
| TAB3 | File đính kèm | attachment | UploadFileTable | F | F | T | T | T |
| TAB4 | Vận hành & bảo trì (read-only) | từ module VH&BT | Text (read-only) | F | F | T | F | F |
| TAB5 | Xử lý & theo dõi | `approvalStatus`/`updatedAt`/`submittedAt`/`approverLevel1/2`... | Badge/Text (read-only) | T/F | T/F | T | F | F |

> Entity Haiphong còn có trường đặc thù ngoài Excel: `portName`, `district`, `ward`, `operationalLicense`, `licenseExpiry`, `inspectorName`, `inspectorPhone`, `lastInspectionDate`, `nextInspectionDate`, `equipmentType`, `communicationFrequency`, `contactPerson`, `contactPhone` — hiển thị thêm ở CT (SA chốt).

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-116-01 | Mã tự sinh `TTXLTT-%04d`; client truyền code thì dùng; trùng → 400 | AC-116-01 | generateCode + retry |
| BR-116-02 | Trạng thái khởi tạo DRAFT + conditionStatus=OPERATIONAL | AC-116-02 | @PrePersist |
| BR-116-03 | Trường bắt buộc: Tên đài, Đơn vị quản lý, Địa điểm Tỉnh/TP, Địa điểm chi tiết, Tình trạng | AC-116-03 | |
| BR-116-04 | Địa điểm chi tiết có Bộ lọc = T (duy nhất) | AC-116-04 | Excel TTXLTT HN |
| BR-116-05 | History CREATE | AC-116-05 | |
| BR-116-06 | Quyền `coastalstationhaiphong:create` (fallback specialstation:create, data:create, admin:all) | AC-116-06 | |
| BR-116-07 | Data scope orgUnitId; không NULL | AC-116-07 | |
| BR-116-08 | @PrePersist đồng bộ code↔stationCode, name↔stationName, orgUnitId↔unitId | AC-116-08 | |
| BR-116-09 | Nhãn feature "Đài TTXLTT Hà Nội" ↔ entity `CoastalStationHaiphong` (drift #4) | AC-116-09 | Ghi nhận, không sửa code |

## Domain Model

`CoastalStationHaiphong` (`coastal_station_haiphong`): orgUnitId, unitId, operatingOrgId, provinceId, code, stationCode, name, stationName, description(1000), locationAddress(1000), spatialId, isActive, conditionStatus, status/approvalStatus (ORDINAL smallint), approvalLevel, submittedAt/By, approverLevel1/2, approvedDateLevel1/2, approvedBy/Date, rejectionReason, portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, contactPerson, contactPhone, servicesProvided(1000), geometryType (POINT), symbol, coordinateSystem (WGS84), displayRule, latitude/longitude (BigDecimal 10,6). `getOrgUnitId()` = orgUnitId ?? unitId. Implements ApprovableEntity.

## Approval flow (2 cấp C1→C2)

Giống F-095; endpoint Haiphong dùng tên **`approve-c1`/`approve-c2`** (chuẩn): `POST /api/v1/stations/haiphong/{id}/submit|approve-c1|approve-c2|reject`.

## Validation Rules

- FieldWriteGuard; mã trùng → 400; validateNotSelfApproval cục bộ; submit từ DRAFT/REJECTED_*; approve-c1 từ PENDING_APPROVAL; approve-c2 từ APPROVED_LEVEL1; reject ≥10 ký tự; 4-eyes trung tâm.

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-116-01 | POST /create không code → code=`TTXLTT-{seq}`; code trùng → 400 |
| AC-116-02 | Sau tạo: approvalStatus=DRAFT, status=DRAFT, conditionStatus=OPERATIONAL |
| AC-116-03 | Thiếu trường bắt buộc → chặn, tiếng Việt có dấu |
| AC-116-04 | Sidebar lọc có trường "Địa điểm chi tiết" |
| AC-116-05 | History CREATE tồn tại |
| AC-116-06 | User thiếu `coastalstationhaiphong:create` → 403 |
| AC-116-07 | Gán orgUnitId ngoài phạm vi → từ chối |
| AC-116-08 | code==stationCode, name==stationName sau tạo |
| AC-116-09 | Tài liệu/UI dùng nhãn "Đài TTXLTT Hà Nội" — backend entity `CoastalStationHaiphong` (drift đã ghi nhận) |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Entity đầy đủ + trường đặc thù |
| Architecture affected? | Low | Drift #4 tên entity Haiphong vs nhãn Hà Nội |
| Implementation clear? | Yes | generateCode + createStation đã có |
| Documentation risk | Medium | Brief ghi "pending sau tạo" — sai với DRAFT (drift #5); tên entity lệch nhãn (drift #4) |
| **Verdict** | `Ready for Solution Designer review` | Rõ; 2 drift ghi nhận |
