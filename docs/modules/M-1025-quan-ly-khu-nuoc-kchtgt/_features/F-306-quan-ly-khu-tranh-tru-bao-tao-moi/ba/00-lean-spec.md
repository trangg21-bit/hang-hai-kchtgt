---
document: lean-spec
feature-id: F-306
feature-name: Tạo mới Khu tránh trú bão
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-306: Tạo mới Khu tránh trú bão (StormShelterArea)

## Use Case

- **Actor:** người có `stormshelter:create`.
- **Trigger:** "Thêm mới" trên màn danh sách Khu tránh trú bão.
- **Main flow:** nhập thông tin chung (#2–#10, kèm Thuộc luồng hàng hải #6, Thuộc bến phao #7, Phân loại #8) → kỹ thuật (#11–#20) → công bố (#21–#23) → khu nước neo buộc + điểm neo (#24–#29) → GIS (#28–#32) → file (#35) → "Lưu tạm"/"Gửi duyệt".

## Domain Model

- **Entity cha:** `StormShelterArea` (`storm_shelter_areas`) — `@Filter(orgUnitFilter)` + `@Filter(recordSecurityLevelFilter)`; trường riêng `classification`, `navigationChannelId`, `buoyStationId`.
- **Bảng con:** `StormShelterMooringWaterArea` (`storm_shelter_mooring_water_areas`) + `StormShelterMooringWaterAreaAnchorPoint` (`storm_shelter_mooring_water_area_anchor_points`).

## Auto-code

- `stormShelterCode` = `{portCode}-TTB-{seq}` (`StormShelterAreaService.generateStormShelterCode`, StormShelterAreaService.java:314).

## Business Rules (bắt buộc)

- **BR-306-01..06:** mã server sinh; tên bắt buộc trim; `orgUnitId` scope; `portId` bắt buộc; khu nước neo buộc logic (Điểm=1/Đường≥2/Vùng≥3); WGS-84/DMS mặc định, VN-2000/DD chỉ migration.
- **BR-306-07:** #16 Cỡ tàu DWT + #20 Ghi chú DB-parity-only (mọi flag FALSE).
- **BR-306-08:** trim; ghi createdBy/createdAt.

## Approval

- Theo `approval-2-level-spec.md` mục 3; trạng thái INT `@Enumerated ORDINAL`; tạo mới → DRAFT/PENDING_APPROVAL.

## Data scope

- `@DataScope` class-level + `@Filter(orgUnitFilter)`.

## Permissions

- `stormshelter:create`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
- "Thuộc bến phao" → cột `buoy_station_id` nhưng ngữ nghĩa BuoyBerth (M-002).
- CSV TAB1 "Xem chi tiết" = FALSE (khả năng lỗi nhập liệu); #16/#20 mọi flag FALSE.
