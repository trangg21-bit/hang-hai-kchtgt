---
document: lean-spec
feature-id: F-304
feature-name: Xem chi tiết Khu chuyển tải
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-304: Xem chi tiết Khu chuyển tải (TransferArea)

## Use Case

- **Actor:** người có `transferarea:read`.
- **Trigger:** chọn "Xem" trên dòng danh sách.
- **Main flow:** mở Drawer 5 tab (Thông tin, GIS DMS, File đính kèm, Vận hành & bảo trì, Lịch sử & Phê duyệt) — read-only.
- **Alternate/error:** hồ sơ ngoài scope → không trả (filter).

## Domain Model

Đọc từ `transfer_areas` + bảng con `transfer_area_mooring_water_areas` / `transfer_area_mooring_water_area_anchor_points` + `infrastructure_attachments` + `infrastructure_history`.

## Business Rules (bắt buộc)

- **BR-304-01:** data scope — chỉ xem hồ sơ trong phạm vi đơn vị.
- **BR-304-02:** tọa độ hiển thị theo quy tắc (mặc định DMS).

## Approval

- Không có bước phê duyệt; hiển thị `approvalStatus` + tracking C1/C2 read-only.

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `transferarea:read` (chi tiết, children, attachments); `transferarea:history` (tab lịch sử).

## Drift ghi nhận

- `@PreAuthorize` bị comment ở controller — SA/PMO chốt.
