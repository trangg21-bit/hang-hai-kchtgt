---
document: lean-spec
feature-id: F-312
feature-name: Tạo mới Khu neo đậu
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-312: Tạo mới Khu neo đậu (Anchorage)

## Use Case

- **Actor:** người có `anchorage:create`.
- **Trigger:** "Thêm mới" trên màn danh sách Khu neo đậu.
- **Main flow:** nhập thông tin chung (#2–#9, kèm Thuộc luồng hàng hải #5, Thuộc bến phao #6) → kỹ thuật (#10–#19) → công bố (#20–#22) → khu nước neo buộc + điểm neo (#23–#28) → GIS (#27–#31) → file (#34) → "Lưu tạm"/"Gửi duyệt".

## Domain Model

- **Entity cha:** `Anchorage` (`anchorages`) — `@Filter(orgUnitFilter)` + `@Filter(recordSecurityLevelFilter)`; trường riêng `navigationChannelId`, `buoyStationId`, `activityStatus`.
- **Bảng con (KHÔNG tiền tố):** `MooringWaterArea` (`mooring_water_areas`, FK `anchorage_id`) + `MooringWaterAreaAnchorPoint` (`mooring_water_area_anchor_points`, FK `mooring_water_area_id`).

## Auto-code

- `anchorageCode` = `{portCode}-ND-{seq}` (`AnchorageService.generateAnchorageCode`, AnchorageService.java:310).

## Business Rules (bắt buộc)

- **BR-312-01..07:** mã server sinh; tên bắt buộc trim; `orgUnitId` scope; `portId` bắt buộc; khu nước neo buộc logic (Điểm=1/Đường≥2/Vùng≥3); WGS-84/DMS mặc định, VN-2000/DD chỉ migration; trim + createdBy/createdAt.

## Approval

- Theo `approval-2-level-spec.md` mục 3; trạng thái INT `@Enumerated ORDINAL`; tạo mới → DRAFT/PENDING_APPROVAL.

## Data scope

- `@DataScope` class-level + `@Filter(orgUnitFilter)`.

## Permissions

- `anchorage:create`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
- "Thuộc bến phao" → cột `buoy_station_id` nhưng ngữ nghĩa BuoyBerth (M-002).
