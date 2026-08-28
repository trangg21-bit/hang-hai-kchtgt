---
document: lean-spec
feature-id: F-316
feature-name: Xem chi tiết Khu neo đậu
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-316: Xem chi tiết Khu neo đậu (Anchorage)

## Use Case

- **Actor:** người có `anchorage:read`.
- **Main flow:** Drawer 5 tab read-only (Thông tin, GIS DMS, File, Vận hành & bảo trì, Lịch sử & Phê duyệt).

## Domain Model

Đọc `anchorages` + `mooring_water_areas` + `mooring_water_area_anchor_points` + `infrastructure_attachments` + `infrastructure_history`.

## Business Rules (bắt buộc)

- **BR-316-01:** data scope. **BR-316-02:** tọa độ hiển thị DMS.

## Approval

- Không có bước phê duyệt; hiển thị tracking C1/C2 read-only.

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `anchorage:read`; `anchorage:history` (tab lịch sử).

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
