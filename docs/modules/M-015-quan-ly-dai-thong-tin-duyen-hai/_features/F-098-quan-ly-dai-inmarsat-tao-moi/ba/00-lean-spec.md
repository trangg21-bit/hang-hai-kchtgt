---
feature-id: F-098
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Đài Inmarsat (CoastalStationInmarsat)

## Summary

Tính năng tạo mới hồ sơ Đài Inmarsat. **ĐÃ XÁC MINH:** entity `CoastalStationInmarsat` (`@Table coastal_station_inmarsat`, `@Filter(orgUnitFilter, condition = "org_unit_id IN (:orgUnitIds)")`) + controller `CoastalStationInmarsatController` (`@RequestMapping("/api/v1/stations/inmarsat")`, `@DataScope`). Excel sheet "Đài Inmarsat" (~line 1622) là nguồn ma trận. **Auto-code CÓ trong code:** `CoastalStationInmarsatService.generateCode()` → `"INMARSAT-%04d"` (đếm + retry khi trùng); `createStation` dùng `request.getCode()` nếu có, ngược lại `generateCode()`; trùng mã → `IllegalArgumentException("Mã đài Inmarsat '...' đã tồn tại trong hệ thống")`. Tạo mới đặt `approvalStatus = DRAFT` + `status = DRAFT` + `conditionStatus = "OPERATIONAL"` (@PrePersist). **DRIFT #5 (feature-brief):** brief F-098 ghi trạng thái sau tạo "Chờ phê duyệt" — code thực tế là `DRAFT`. **DRIFT #1:** enum `status`/`approvalStatus` lưu ORDINAL smallint (đúng convention INT); `conditionStatus` là String ("OPERATIONAL") — không phải enum, ghi nhận. Ghi history CREATE.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-098-01 | Người nhập | Form "Tạo mới Đài Inmarsat" | Điền TAB1 (11 trường), GIS, file → Lưu tạm / Lưu và gửi duyệt | Hồ sơ DRAFT (hoặc PENDING_APPROVAL nếu gửi duyệt), code INMARSAT-{seq} |
| UC-098-02 | Hệ thống | POST /api/v1/stations/inmarsat/create | Service createStation → generateCode → save → history CREATE | 200 + entity |

## Scope

| | Items |
|---|---|
| In scope | Tạo mới theo Excel sheet "Đài Inmarsat"; tự sinh mã `INMARSAT-%04d`; trạng thái DRAFT; ghi history CREATE; validate bắt buộc; quyền `coastalstationinmarsat:create`; data scope orgUnitId. |
| Out of scope | Sửa code/schema; duyệt (F-101); xóa (F-100); lịch sử (F-103); chi tiết (F-102). |
| Assumptions | Danh mục đã có nguồn; phần kỹ thuật là đề xuất BA, SA chốt. |

## Field Coverage Matrix

Nguồn: Excel sheet "Đài Inmarsat" (~line 1622) — 8 cột chính xác.

| # | Tên trường (Excel) | Technical field | Loại điều khiển | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Mã đài | `code` | Input (disabled, tự sinh INMARSAT-{seq}) | T | T | T | T | T |
| 2 | Tên đài (bắt buộc) | `name` | InputTextArea | T | T | T | T | T |
| 3 | Đơn vị quản lý (bắt buộc) | `orgUnitId`/`unitId` | SelectOrgCode | T | T | T | T | T |
| 4 | Đơn vị khai thác | `operatingOrgId` | SelectCateOther | T | F | T | T | T |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | `provinceId` | SelectCateOther | T | T | T | T | T |
| 6 | Địa điểm chi tiết (bắt buộc) | `locationDetail` | InputTextArea | F | F | T | T | T |
| 7 | Tình trạng (bắt buộc) | `conditionStatus` (String, default OPERATIONAL) | SelectAppParams | T | T | T | T | T |
| 8 | Vùng phủ sóng | `coverageArea` | InputTextArea | F | F | T | T | T |
| 9 | Dịch vụ cung cấp | `services` | SelectAppParams (multi-select) | F | F | T | T | T |
| 10 | Tần số liên lạc | `frequency` | InputTextArea | F | F | T | T | T |
| 11 | Ghi chú | `notes` | InputTextArea | F | F | T | T | T |
| TAB2 | Vị trí (GIS) | `objectType`/`symbol`/`coordinateSystem`(WGS84)/`displayRule`/`latitude`/`longitude` | Select/Text/LongLatTable | F | F | T | T | T |
| TAB3 | File đính kèm | attachment | UploadFileTable | F | F | T | T | T |
| TAB4 | Vận hành & bảo trì (read-only) | từ module VH&BT | Text (read-only) | F | F | T | F | F |
| TAB5 | Xử lý & theo dõi | `approvalStatus`/`updatedAt`/`submittedAt`/`approverLevel1/2`... | Badge/Text (read-only) | T/F | T/F | T | F | F |

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-098-01 | Mã tự sinh `INMARSAT-%04d`; client truyền code thì dùng code đó (đã trim); trùng → 400 | AC-098-01 | generateCode + retry |
| BR-098-02 | Trạng thái khởi tạo: approvalStatus=DRAFT, status=DRAFT, conditionStatus=OPERATIONAL | AC-098-02 | @PrePersist |
| BR-098-03 | Trường bắt buộc: Tên đài, Đơn vị quản lý, Địa điểm Tỉnh/TP, Địa điểm chi tiết, Tình trạng | AC-098-03 | |
| BR-098-04 | Tạo xong ghi history CREATE (CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT) | AC-098-04 | |
| BR-098-05 | Quyền: `coastalstationinmarsat:create` (fallback `specialstation:create`, `data:create`, `admin:all`) | AC-098-05 | |
| BR-098-06 | Data scope: orgUnitId trong phạm vi user; không để NULL | AC-098-06 | |
| BR-098-07 | @PrePersist đồng bộ code↔deviceCode, name↔stationName, orgUnitId↔unitId | AC-098-07 | Quy ước entity |
| BR-098-08 | "Lưu và gửi phê duyệt" → submit → PENDING_APPROVAL | AC-098-08 | |

## Domain Model

`CoastalStationInmarsat` (`coastal_station_inmarsat`): orgUnitId, unitId, operatingOrgId, provinceId, code, deviceCode, name, stationName, description, locationAddress, locationDetail (TEXT), conditionStatus, isActive, coverageZone, coverageArea, services, frequency, modemType, sarCode, satelliteSystem, notes (TEXT), contactPerson, contactPhone, spatialId, objectType, symbol, coordinateSystem (WGS84), displayRule, latitude, longitude (BigDecimal 10,6) + approval fields (submittedAt/By, approverLevel1/2, approvedDateLevel1/2, approvedBy/Date, rejectionReason). `getOrgUnitId()` = orgUnitId ?? unitId. `@SQLRestriction("deleted_at IS NULL")`. Implements `ApprovableEntity`.

## Approval flow (2 cấp C1→C2)

Giống F-095 (state machine 7 trạng thái, 4-eyes, reject ≥10 ký tự) nhưng endpoint Inmarsat: `POST /api/v1/stations/inmarsat/{id}/submit|approve-l1|approve-l2|reject` — **DRIFT #3:** tên approve-l1/l2 (không phải approve-c1/c2).

## Validation Rules

- Mã trùng → 400; validateNotSelfApproval(createdBy, currentUserId) tồn tại trong service.
- Submit từ DRAFT/REJECTED_*; approve-l1 từ PENDING_APPROVAL; approve-l2 từ APPROVED_LEVEL1.
- Reject ≥10 ký tự; thiếu quyền → 403; FieldWriteGuard.validateObject(request).

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-098-01 | Given không truyền code, When POST /create, Then code = `INMARSAT-{seq}` (format %04d); Given code trùng, Then 400 "Mã đài Inmarsat '...' đã tồn tại" |
| AC-098-02 | Sau tạo: approvalStatus=DRAFT, status=DRAFT, conditionStatus=OPERATIONAL |
| AC-098-03 | Thiếu trường bắt buộc → chặn, thông báo tiếng Việt có dấu |
| AC-098-04 | History có CREATE (GET /{id}/history) |
| AC-098-05 | User không có `coastalstationinmarsat:create` → 403 |
| AC-098-06 | Gán orgUnitId ngoài phạm vi → từ chối |
| AC-098-07 | Entity trả về có code == deviceCode, name == stationName (đồng bộ) |
| AC-098-08 | "Lưu và gửi phê duyệt" → approvalStatus=PENDING_APPROVAL |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Entity đầy đủ trường Excel |
| Architecture affected? | Low | Drift #3 tên endpoint; conditionStatus String |
| Implementation clear? | Yes | generateCode + createStation đã có |
| Documentation risk | Medium | Brief ghi "pending sau tạo" — sai với DRAFT (drift #5) |
| **Verdict** | `Ready for Solution Designer review` | Rõ ràng; 2 drift ghi nhận |
