---
document: lean-spec
feature-id: F-310
feature-name: Xem chi tiết Khu tránh trú bão
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-310: Xem chi tiết Khu tránh trú bão (StormShelterArea)

## Use Case

- **Actor:** người có `stormshelter:read`.
- **Main flow:** Drawer 5 tab read-only (Thông tin, GIS DMS, File, Vận hành & bảo trì, Lịch sử & Phê duyệt).

## Domain Model

Đọc `storm_shelter_areas` + bảng con + `infrastructure_attachments` + `infrastructure_history`.

## Business Rules (bắt buộc)

- **BR-310-01:** data scope. **BR-310-02:** tọa độ hiển thị DMS.

## Approval

- Không có bước phê duyệt; hiển thị tracking C1/C2 read-only.

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `stormshelter:read`; `stormshelter:history` (tab lịch sử).

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
- CSV TAB1 "Xem chi tiết" = FALSE (khả năng lỗi nhập liệu); code vẫn hiển thị.
