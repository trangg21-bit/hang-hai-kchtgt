---
feature-id: F-120
document: lean-spec
output-mode: lean
last-updated: 2026-09-17
---
# Xem chi tiết Đài TTXLTT Hà Nội (CoastalStationHaiphong)

## Summary

Tính năng xem chi tiết hồ sơ Đài TTXLTT Hà Nội. **ĐÃ XÁC MINH:** `GET /api/v1/stations/haiphong/{id}` → getStationById + buildResponse (đầy đủ: code, name, conditionStatus, coverageArea, servicesProvided, portName, district, ward, operationalLicense, licenseExpiry, inspectorName/Phone, last/nextInspectionDate, equipmentType, communicationFrequency, contactPerson/Phone, approval fields, createdByName). Có @PreAuthorize read (`coastalstationhaiphong:read`). Drawer 5 tab.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-120-01 | Người dùng trong phạm vi | Bấm hàng → Xem chi tiết | Drawer 5 tab | Hiển thị theo cột CT + trường đặc thù |
| UC-120-02 | Người dùng ngoài phạm vi | GET /{id} | DataScope | Không nhận dữ liệu |

## Scope

| | Items |
|---|---|
| In scope | Hiển thị 5 tab; trường đặc thù (portName/inspector/license...); quyền đọc; data scope. |
| Out of scope | CRUD; duyệt; lịch sử (F-121). |

## Field Coverage Matrix

Sheet "Đài TTXLTT Hà Nội" cột CT (như F-116): TAB1 9 trường, GIS 5 trường, File, TAB4 VH&BT read-only, TAB5 11 trường. Trường đặc thù hiển thị thêm ở CT (SA chốt vị trí).

## Ma trận chốt 17/09/2026

Chi tiết chỉ hiển thị các trường có cột CT = T trong ma trận F-116: 9 trường TAB 1, GIS, file, TAB 4 vận hành/bảo trì/sự cố read-only và TAB 5 xử lý/theo dõi. Không hiển thị các cột legacy ngoài ma trận: vùng phủ sóng, tần số/thiết bị, giấy phép, kiểm định, liên hệ, `portName`, `district` hoặc `ward`. Nội dung này thay thế mọi ghi chú trước đó cho phép hiển thị “trường đặc thù” ngoài ma trận.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-120-01 | GET /{id} 200; không tồn tại → 404 | AC-120-01 | |
| BR-120-02 | Data scope orgUnitId | AC-120-02 | |
| BR-120-03 | Quyền đọc `coastalstationhaiphong:read` — có @PreAuthorize | AC-120-03 | |
| BR-120-04 | Tên người hiển thị fullName (resolveUserName) | AC-120-04 | |
| BR-120-05 | Tên đơn vị qua OrgUnitCacheService | AC-120-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-096 với resource Haiphong. AC tương đương AC-096-01..05.
