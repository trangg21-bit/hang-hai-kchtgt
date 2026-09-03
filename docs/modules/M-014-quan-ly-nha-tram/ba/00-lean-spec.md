---
feature-id: M-014
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Quản lý Nhà trạm — Lean Spec (Scope Anchor)

## Summary

Module M-014 "Quản lý Nhà trạm" quản lý 3 nhóm đối tượng KCHT hàng hải dùng chung cơ chế KCHT 2 cấp (C1 Cảng vụ/Chi cục → C2 Cục): **Nhà trạm phao** (F-080..F-085), **Nhà trạm đèn** (F-086..F-091), **Nhà trạm phao tiêu** (F-092..F-095). Tài liệu này là **scope anchor** của lượt BA — 16 lean-spec chi tiết nằm tại `docs/modules/M-014-quan-ly-nha-tram/_features/{F-080..F-095}/ba/00-lean-spec.md`.

## Entity map (đã xác minh code)

| Nhóm | Features | Entity | Table (actual) | Controller (actual) | Field source (Excel) |
|---|---|---|---|---|---|
| Nhà trạm phao | F-080..F-085 | `BuoyStation` (`station/entity/BuoyStation.java`) | `buoy_station` (trước đây `nha_tram_phao`) | `BuoyStationController` → `/api/v1/buoy-station` (GET, generate-code, GET/{id}, search, POST, PUT/{id}, DELETE/{id}, submit-approval, approve-l1, approve-l2, reject, history) | Sheet "QL Nhà trạm phao tiêu" — sheet gần nhất (KHÔNG có sheet "QL Nhà trạm phao"; thay thế được ghi nhận trong từng spec) |
| Nhà trạm đèn | F-086..F-091 | `BeaconStation` (`beacon/entity/BeaconStation.java`) | `beacon_light` (trước đây `nha_tram_den`) | `BeaconStationController` → `/api/beacon-stations` (GET, generate-code, GET/{id}, search, search-paged, POST, PUT/{id}, DELETE/{id}, submit-approval, approve-l1, reject, attachments) | Sheet "QL Đèn biển và nhà trạm" (~line 113, 57 trường) |
| Nhà trạm phao tiêu | F-092..F-095 | **Cùng `BuoyStation`** (sheet "QL Nhà trạm phao tiêu" khớp chính xác field map) | `buoy_station` | Cùng `/api/v1/buoy-station` | Sheet "QL Nhà trạm phao tiêu" (~line 740) — sheet GỐC |

Child context: `Buoy` (`beacon/entity/Buoy.java`, `@Table buoy`, FK `buoy_station_id`) = "phao tiêu" trong tab "Danh sách phao tiêu" — context-only, không author spec (entity module khác).

## Drift tổng hợp (feature-brief vs code — ghi nhận, KHÔNG sửa brief)

| # | Drift | Chi tiết |
|---|---|---|
| D1 | Endpoint/table F-080..F-085 | Brief: `/api/v1/buoys` + `buoy_stations` → Actual: `/api/v1/buoy-station` + `buoy_station` |
| D2 | Endpoint/table F-086..F-091 | Brief: `/api/v1/beacons` + `beacon_stations` → Actual: `/api/beacon-stations` + `beacon_light` |
| D3 | F-092..F-095 thiết kế cũ | Brief: `/api/v1/buoy-beacon-stations` + entity `BuoyBeaconStation` + bảng `buoy_beacon_stations`/`buoy_beacon_station_coordinates`/`_changes` → Actual: `/api/v1/buoy-station` + `BuoyStation` + `buoy_station`; tọa độ qua `spatialId`, nhật ký qua `infrastructure_history` |
| D4 | **DRIFT MỚI — enum storage** | Brief khẳng định cả 2 entity lưu STRING. Thực tế: `BuoyStation.approvalStatus` = `@Enumerated(ORDINAL)` + `smallint default 0` (ĐÚNG AGENTS.md INT+ORDINAL); `BeaconStation.approvalStatus` = `@Enumerated(EnumType.STRING)` (TRÁI AGENTS.md) |
| D5 | **DRIFT MỚI — BeaconStation thiếu approve-l2** | `BeaconStationController` chỉ có submit-approval/approve-l1/reject (không có approve-l2; service cũng không có approveL2) — khác BuoyStation có đủ C1/C2 |
| D6 | **DRIFT MỚI — BeaconStation thiếu history endpoint** | `BeaconStationController` không có GET `/{id}/history`; history qua `BuoyController`/`StationHistoryController` hoặc cần bổ sung |
| D7 | Auto-code | BuoyStation: `NT-{seq}` (đếm toàn bộ bản ghi prefix `NT-`); BeaconStation: `DBNT-%06d` — brief không ghi rõ |
| D8 | Status default | BuoyStation: smallint default 0 (DRAFT); BeaconStation: `@PrePersist` đặt `PENDING_APPROVAL` nếu null, `status` String "DRAFT" |
| D9 | Data scope column | BuoyStation filter `unit_id IN (...)`; BeaconStation filter `org_unit_id IN (...)` (entity có cả `orgUnitId` và `unitId`) |
| D10 | Approval metadata columns | BuoyStation có đủ sentApproved*/level1*/level2*; BeaconStation chỉ có approvedBy/approvedDate/rejectionReason (level1/level2 cần SA chốt nguồn) |

## Permissions (resource:action — từ controller)

- `buoystation:read|create|update|delete|approvec1|approvec2|history` (fallback `data:*`, legacy `buoystation:approvel1|approvel2`).
- `beaconstation:read|create|update|delete|approvec1` (+ legacy `beaconstation:approvel1`; fallback `data:*`).
- Admin Cục: thêm `view_sensitive` để xem metadata nhạy cảm.
- Không có `beaconstation:approvec2` seed riêng đã xác minh — SA chốt khi bổ sung approve-l2 (D5).

## Conventions áp dụng

- Phê duyệt 2 cấp: `docs/conventions/approval-2-level-spec.md` (7 trạng thái, 2 vòng, chống tự duyệt 4-eyes, lý do từ chối ≥ 10 ký tự, xóa chỉ ở DRAFT, ma trận sửa T12, re-submit về vòng 1, phân cấp theo `OrgUnit.level`).
- Kiến trúc KCHT: `docs/conventions/infrastructure-feature-standard-architecture.md` (BaseEntity/ApprovableEntity, @FieldNameConstants, DataScopeAspect, OrgUnitScopeService, EntityUpdateUtils, ApprovalHistoryUtils, GisSpatialObjectService qua `spatialId`, `/options` APPROVED-ONLY).
- Enum storage: AGENTS.md yêu cầu INT + `@Enumerated(ORDINAL)` — BuoyStation tuân thủ; BeaconStation lệch (STRING) → drift D4.
- Data scope: entity business có `@Filter(orgUnitFilter)` + controller `@DataScope` — cả 2 entity đều đạt.

## Cấu trúc

16 lean-spec tại `_features/{F-080..F-095}/ba/00-lean-spec.md`, mỗi file theo template F-038 (M-003): frontmatter → Summary → Scope (In/Out/Assumptions) → Field Coverage Matrix (đầy đủ List/Filter/Detail/Create/Edit + technical field + required) → User Stories → Acceptance Criteria → Business Rules (BR-Fxxx-nn) → Domain Model → 2-level approval flow → Validation Rules → Test Scenarios → Pipeline Triage.
