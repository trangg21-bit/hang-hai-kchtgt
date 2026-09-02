---
feature-id: F-102
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xem chi tiết Đài Inmarsat (CoastalStationInmarsat)

## Summary

Tính năng xem chi tiết hồ sơ Đài Inmarsat. **ĐÃ XÁC MINH:** `GET /api/v1/stations/inmarsat/{id}` → `CoastalStationInmarsatService.getStationById` (EntityNotFoundException nếu không tồn tại) + buildResponse (đầy đủ: code, name, conditionStatus, coverageArea, services, frequency, notes, contactPerson/Phone, approval fields, createdByName/submittedByName). Quyền đọc `coastalstationinmarsat:read` — Inmarsat CÓ @PreAuthorize cho GET (khác VTS). Drawer 5 tab như TTDH.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-102-01 | Người dùng trong phạm vi | Bấm hàng → Xem chi tiết | Mở drawer 5 tab | Hiển thị theo cột CT |
| UC-102-02 | Người dùng ngoài phạm vi | GET /{id} | DataScope | Không nhận dữ liệu |

## Scope

| | Items |
|---|---|
| In scope | Hiển thị 5 tab (CT=T); tên người dùng qua resolveUserName; quyền đọc; data scope. |
| Out of scope | CRUD; duyệt; lịch sử (F-103). |

## Field Coverage Matrix

Sheet "Đài Inmarsat" (~line 1622) cột CT: TAB1 11 trường (trong đó Mã/Tên/ĐVQL/ĐVKT/Địa điểm Tỉnh/TP/Tình trạng DS+T; Địa điểm chi tiết/Vùng phủ sóng/Dịch vụ/Tần số/Ghi chú CT-only), GIS 5 trường, File, TAB4 VH&BT read-only, TAB5 11 trường. Chi tiết hàng: F-098.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-102-01 | GET /{id} 200 đầy đủ; không tồn tại → 404 | AC-102-01 | |
| BR-102-02 | Data scope orgUnitId | AC-102-02 | |
| BR-102-03 | Quyền đọc `coastalstationinmarsat:read` — có @PreAuthorize | AC-102-03 | |
| BR-102-04 | Tên người (cập nhật/gửi duyệt/duyệt) hiển thị fullName | AC-102-04 | resolveUserName |
| BR-102-05 | Tên đơn vị qua OrgUnitCacheService | AC-102-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-096 với resource Inmarsat. Khác: GET có @PreAuthorize read (đã chốt quyền đọc). AC tương đương AC-096-01..05.
