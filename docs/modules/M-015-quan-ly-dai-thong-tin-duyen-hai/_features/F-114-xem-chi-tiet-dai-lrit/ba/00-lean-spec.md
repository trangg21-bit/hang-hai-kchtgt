---
feature-id: F-114
document: lean-spec
output-mode: lean
last-updated: 2026-09-18
---
# Xem chi tiết Đài LRIT (CoastalStationLRIT)

## Summary

Tính năng xem chi tiết hồ sơ Đài LRIT. **ĐÃ XÁC MINH:** `GET /api/v1/stations/lrit/{id}` → getStationById + buildResponse (code, name, conditionStatus, locationAddress, coverageArea, servicesProvided, GIS, tệp đính kèm, thông tin phê duyệt và createdByName). Có @PreAuthorize read (`coastalstationlrit:read`). Không hiển thị trường kỹ thuật LRIT ngoài ma trận F-110 vì chúng đã được xóa khỏi dữ liệu nguồn theo migration `V100`. Drawer 5 tab.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-114-01 | Người dùng trong phạm vi | Bấm hàng → Xem chi tiết | Drawer 5 tab | Hiển thị đúng ma trận CT |
| UC-114-02 | Người dùng ngoài phạm vi | GET /{id} | DataScope | Không nhận dữ liệu |

## Scope

| | Items |
|---|---|
| In scope | Hiển thị 5 tab theo ma trận F-110; quyền đọc; data scope. |
| Out of scope | CRUD; duyệt; lịch sử (F-115). |

## Field Coverage Matrix

Sheet "Đài LRIT" cột CT (như F-110): TAB1 10 trường, GIS 5 trường, File, TAB4 VH&BT read-only, TAB5 11 trường. Không có trường đặc thù hiển thị thêm ở CT.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-114-01 | GET /{id} 200; không tồn tại → 404 | AC-114-01 | |
| BR-114-02 | Data scope orgUnitId | AC-114-02 | |
| BR-114-03 | Quyền đọc `coastalstationlrit:read` (fallback specialstation:read, data:read, admin:all) — có @PreAuthorize | AC-114-03 | |
| BR-114-04 | Tên người hiển thị fullName (resolveUserName) | AC-114-04 | |
| BR-114-05 | Tên đơn vị qua OrgUnitCacheService | AC-114-05 | |

## Domain Model / Approval flow / Validation Rules / Pipeline Triage

Giống F-096 với resource LRIT. AC tương đương AC-096-01..05.
