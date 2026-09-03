---
feature-id: M-013
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lean-spec index — Module M-013 Quản lý Báo hiệu hàng hải

## Summary

Module M-013 quản lý hệ thống báo hiệu hàng hải gồm 2 nhóm đối tượng chính: **Đèn biển (và nhà trạm)** và **Phao tiêu**, mỗi nhóm 6 feature (tạo mới, cập nhật, xóa, phê duyệt, xem chi tiết, lịch sử). Nguồn sự thật là Excel "HH_Tính năng & danh sách các trường thông tin.xlsx" (sheet "QL Đèn biển và nhà trạm" 57 trường, sheet "QL Phao tiêu" 56 trường) và code hiện tại. File này là index; đặc tả chi tiết nằm ở 12 lean-spec feature-level bên dưới.

## Entity mapping (hiện trạng code)

| Nhóm | Entity | Table | Controller / base path | Permission |
|---|---|---|---|---|
| Đèn biển (và nhà trạm) | `BeaconStation` (kế thừa `BaseEntity`) | `beacon_light` | `BeaconStationController` `/api/beacon-stations` | `beaconstation:*` |
| Phao tiêu | `Buoy` (kế thừa `BaseEntity`, `orgUnitId` + `@Filter(orgUnitFilter)`) | `buoy` | `BuoyController` `/api/buoys` | `buoy:*` |
| Lịch sử chung | `BeaconHistory` (discriminator `BeaconType`: BEACON_LIGHT/BUOY; action `BeaconHistoryActionType`: CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE) | `beacon_history` (chờ migration) | `BeaconHistoryController` `/api/beacon-history` | `beaconstation:history` / `buoy:history` |

## Danh sách feature

| Feature | Nhóm | Tên | Lean-spec |
|---|---|---|---|
| F-068 | Đèn biển | Tạo mới (ma trận đầy đủ 57 trường) | `_features/F-068-quan-ly-den-bien-tao-moi/ba/00-lean-spec.md` |
| F-069 | Đèn biển | Cập nhật | `_features/F-069-quan-ly-den-bien-cap-nhat/ba/00-lean-spec.md` |
| F-070 | Đèn biển | Xóa (soft delete) | `_features/F-070-quan-ly-den-bien-xoa/ba/00-lean-spec.md` |
| F-071 | Đèn biển | Phê duyệt | `_features/F-071-phe-duyet-den-bien/ba/00-lean-spec.md` |
| F-072 | Đèn biển | Xem chi tiết | `_features/F-072-xem-chi-tiet-den-bien/ba/00-lean-spec.md` |
| F-073 | Đèn biển | Lịch sử | `_features/F-073-quan-ly-den-bien-lich-su/ba/00-lean-spec.md` |
| F-074 | Phao tiêu | Tạo mới (ma trận đầy đủ 56 trường) | `_features/F-074-quan-ly-phao-tieu-tao-moi/ba/00-lean-spec.md` |
| F-075 | Phao tiêu | Cập nhật | `_features/F-075-quan-ly-phao-tieu-cap-nhat/ba/00-lean-spec.md` |
| F-076 | Phao tiêu | Xóa (soft delete) | `_features/F-076-quan-ly-phao-tieu-xoa/ba/00-lean-spec.md` |
| F-077 | Phao tiêu | Phê duyệt | `_features/F-077-phe-duyet-phao-tieu/ba/00-lean-spec.md` |
| F-078 | Phao tiêu | Xem chi tiết | `_features/F-078-xem-chi-tiet-phao-tieu/ba/00-lean-spec.md` |
| F-079 | Phao tiêu | Lịch sử | `_features/F-079-quan-ly-phao-tieu-lich-su/ba/00-lean-spec.md` |

## Quy tắc chung toàn module

1. **Mã tự sinh:** Đèn biển `DBNT-%06d` (`BeaconStationService.generateBeaconStationCode`); Phao tiêu `{mã nhà trạm}-PT-%03d` hoặc fallback `PT-%06d` (`BuoyService.generateCode`); disabled UI, unique.
2. **Phê duyệt 2 cấp** (Cảng vụ/Chi cục → Cục) theo `docs/conventions/approval-2-level-spec.md`; trạng thái lưu số enum `ApprovalStatus` (DRAFT=0, PROPOSED=1, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, REJECTED=6, ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9); lý do từ chối bắt buộc ≥ 10 ký tự.
3. **Data scope:** entity có `orgUnitId` + `@Filter(orgUnitFilter)`; controller `@DataScope`; tên đơn vị hiển thị qua `OrgUnitCacheService`; không để đơn vị NULL khi ghi.
4. **Enum → INT** trong DB (AttributeConverter `BeaconLightType`/`BuoyType`, hoặc `value` int), không lưu VARCHAR.
5. **UI:** label tiếng Việt có dấu; technical field/API tiếng Anh.

## Drift đã ghi nhận (không lan truyền, SA/Dev xử lý)

1. feature-brief.md cũ mô tả entity `Beacon` + `/api/v1/beacons`; tech-spec/_state.md mô tả `BeaconLight` — **không còn đúng**, code dùng `BeaconStation`/`Buoy`.
2. Đèn biển chưa có endpoint approve-l2 (F-071); reject hiện đưa về `DRAFT`/`REJECTED` đơn cấp và thiếu `@PreAuthorize`; `approverId` nhận qua `@RequestParam` thay vì `Authentication`.
3. Phao tiêu cho phép tự duyệt (comment `BR-077-09 relaxed` trong `BuoyService.approveL1`) — trái convention 4-eyes.
4. Ghi `beacon_history` bị tắt (comment trong `BeaconStationService.logHistory`/`BuoyService.logHistory`, chờ migration); hiện ghi vào `infrastructure_history`.
5. Đèn biển thiếu cột operation/maintenance/incident (`BeaconStation` không có, `Buoy` có) — nguồn hiển thị #35-#46 cần SA chốt.

*Index này chỉ tổng hợp; mọi BR/AC/TS chi tiết nằm trong 12 file feature-level.*
