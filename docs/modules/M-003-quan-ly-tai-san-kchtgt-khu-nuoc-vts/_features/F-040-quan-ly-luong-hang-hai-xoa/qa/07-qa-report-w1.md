# QA Report — F-040 Xóa (soft delete) Luồng hàng hải (M-003) — Wave 1

- **Feature:** F-040 (M-003) — Xóa Luồng hàng hải
- **Stage:** engineering-qa-engineer-wave-1
- **Ngày chạy:** 2026-08-26 09:41 (+07)
- **Nguồn kiểm chứng:** feature-brief.md, ba/00-lean-spec.md, design/00-design-plan.md (D1/D2/D3, WO-F040-BE-1/FE-1), dev/05-dev-w1-soft-delete-navigation-channel.md, dev/05-fe-dev-w1-soft-delete-navigation-channel.md
- **Phạm vi:** Delta BE (giữ guard `APPROVED`-only + ghi history DELETED qua `ApprovalHistoryUtils.recordSoftDelete`) + gating FE nút Xóa. KHÔNG sửa code trong lượt QA này (verify-only).

## 1. Verification commands — output thực tế

| # | Lệnh | Kết quả | Exit |
|---|---|---|---|
| 1 | `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` (workdir: workspace root) | `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` — `NavigationChannelServiceLifecycleTest` 10/10 (2.350 s), `NavigationChannelServiceTest` 6/6 (2.011 s); `BUILD SUCCESS`, `Total time: 12.570 s` | 0 |
| 2 | `npx tsc --noEmit` (workdir: `frontend/`) | (no output) | 0 |
| 3 | `npx vite build` (workdir: `frontend/`) | `✓ 4044 modules transformed.` `✓ built in 1.10s`; warning chunk > 500 kB là cảnh báo có sẵn toàn repo | 0 |

## 2. Acceptance oracle — AC → test case → verdict

| AC-ID | Oracle | Kết quả thực tế | Verdict |
|---|---|---|---|
| AC-040-01 | Xóa `APPROVED` → `deletedAt`/`deletedBy` ghi từ session, response 200 | `softDelete_approved_recordsDeleteHistory` pass; source `softDelete` `:441-463`: `nc.softDelete(operatorId)` (BaseEntity gán `deletedAt`/`deletedBy`), `operatorId` từ `currentUserId(authentication)` trong controller | **PASS** |
| AC-040-02 | Xóa trạng thái ≠ `APPROVED` → từ chối, DB không đổi | `softDelete_draft_stillRejected` pass: `IllegalStateException("Chỉ có luồng hàng hải đã duyệt mới có thể xóa mềm")` + `verify(approvalHistoryRepo, never()).save(any())` | **PASS** |
| AC-040-03 | Hồ sơ đã xóa không xuất hiện list/search | Source: `@SQLRestriction("deleted_at IS NULL")` (BaseEntity.java:23) + `findByDeletedAtIsNull` / `searchDocuments` (repo filter `deleted_at IS NULL`) | **PASS** (source-verified) |
| AC-040-04 | GET/PUT/DELETE hồ sơ đã xóa → "Không tìm thấy luồng hàng hải với id" | Source: `findById` trả empty do `@SQLRestriction` → `orElseThrow(IllegalArgumentException("Không tìm thấy luồng hàng hải với id: ..."))` | **PASS** (source-verified) |
| AC-040-05 | Xóa `APPROVED` có `spatialId` → xóa GIS cùng | Source `softDelete`: `if (nc.getSpatialId() != null) gisSpatialObjectService.delete(nc.getSpatialId())` trong cùng method `@Transactional` | **PASS** (source-verified) |
| AC-040-06 | Thiếu `navigationchannel:delete` → 403; UI không hiển thị nút Xóa | Controller `DELETE /{id}` `@PreAuthorize("@auth.check(authentication, 'navigationchannel:delete')")`; seed `PermissionSeeder.java:305`; FE gating `hasPerm('navigationchannel:delete') && record.approvalStatus === 'APPROVED'` (`NavigationChannelList.tsx:337`) | **PASS** (source-verified) |

### Design deltas (SA chốt D1/D2/D3 — BR-040-06)

| Delta | Oracle | Kết quả thực tế | Verdict |
|---|---|---|---|
| D1 giữ guard `APPROVED`-only | Xóa `DRAFT` → 400-family message BR-040-01, không history | `softDelete_draft_stillRejected` pass (message + `never().save` trên history repo) | **PASS** |
| D2 history DELETED | DELETE `APPROVED` → 1 dòng `approval_history`: status ordinal 6 (DELETED), refType ordinal 6 (NAVIGATION_CHANNEL), LEVEL_0, `approvedBy`=operatorId, reason "Xóa luồng hàng hải", `changedField`=DELETED_AT | `softDelete_approved_recordsDeleteHistory` pass; source `softDelete` sau `repo.save`: `ApprovalHistoryUtils.recordSoftDelete(approvalHistoryRepo, id, InfrastructureType.NAVIGATION_CHANNEL, operatorId, "Xóa luồng hàng hải")`; utility ghi `status=DELETED`, `approvalLevel=LEVEL_0`, `changedField=EntityFields.DELETED_AT`, `previousValue="null"`, `newValue="đã xóa mềm"` | **PASS** |
| D3 FE gating nút Xóa | Chỉ `APPROVED` hiển thị nút Xóa | Source `NavigationChannelList.tsx:337` | **PASS** (source-verified) |

## 3. Findings

| # | Mức | Mô tả | Chủ sở hữu |
|---|---|---|---|
| F1 | Thấp (không fail AC) | **Không có popup xác nhận trước khi xóa.** Design plan D3 ghi "UI giữ popup xác nhận hiện có" nhưng code gọi thẳng `navigationChannelCRUD.delete(record.id)` (không `Popconfirm`/`Modal.confirm`); FE dev report F-040 đã flag. F-040 brief §5.8 khai báo "dùng popup xác nhận (Modal) theo convention chung" → cần SA/PMO quyết định bổ sung ở wave sau. | SA/PMO |

## 4. Pre-existing errors ngoài phạm vi (PMO đã verify độc lập — QA xác nhận qua surefire report)

- `FlywayMigrationTest` ×2 — `V20260822130000__add_unaccent_port_buoy_search_indexes.sql:49` (`buoy_station.code` không tồn tại, SQLState 42703) — module buoy_station migration.
- `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` (module beacon, org-unit scope).
- Bằng chứng: `target/surefire-reports/...FlywayMigrationTest.txt`, `...BeaconStationServiceTest$CreateTests.txt`. **KHÔNG chấm fail F-040 vì các lỗi này.**

## 5. Coverage đã chạy / chưa chạy

- Đã chạy: 3 gate thực thi (mvn scoped 16/16, tsc, vite build) + rà soát source từng AC.
- Chưa chạy (giới hạn): DELETE end-to-end qua HTTP + kiểm tra `gis_spatial_object` thực tế, UI E2E — cần backend chạy được (chặn bởi Flyway pre-existing).

## 6. Verdict

**PASS** — toàn bộ AC-040-01..06 + design deltas D1-D3 thỏa mãn bằng test thực thi (2/2 unit test F-040 trong LifecycleTest) + source anchors; 3 gate đều xanh. 1 finding mức thấp (thiếu popup xác nhận xóa) giao SA/PMO quyết định, không thuộc AC nào của wave này.
