# Dev Report BE — F-042 Danh sách / Chi tiết Luồng hàng hải (kiểm chứng — không sửa)

- **Feature:** F-042 (M-003) — Xem danh sách / chi tiết Luồng hàng hải
- **Stage:** engineering-backend-developer-wave-1
- **Ngày:** 2026-08-26
- **Design plan:** `_features/F-042-xem-chi-tiet-luong-hang-hai/design/00-design-plan.md` (xác nhận hiện trạng — **không có delta BE**)

## Kết luận

**Backend đã implement từ F-038 (commit ed400cf7) — phiên này chỉ kiểm chứng, KHÔNG sửa file nào thuộc F-042.** Toàn bộ endpoint đọc, filter set, data scope, response 71 trường đã chốt F-038.

## Anchor kiểm chứng (đã mở trong phiên này)

| Hạng mục | Anchor |
|---|---|
| Endpoint đọc | `NavigationChannelController.java:41-43` (`GET /{id}` guard `navigationchannel:read`); `:46-53` (`GET /` list phân trang); `:132-136` (`GET /approval-status/{status}`); `:138-155` (`GET /search` 6 filter) |
| Data scope đọc | `NavigationChannelController.java:25` `@DataScope` → `DataScopeAspect` bật `orgUnitFilter` + `recordSecurityLevelFilter` (`NavigationChannel.java:20-21` `@Filter`) |
| Detail response 71 trường | `NavigationChannelService.java:607-757` `toResponse(nc, includeDetails)` — routeDetails/coordinateList/attachments/`orgUnitName` qua `OrgUnitCacheService` (`:664 resolveOrgUnitName`) |
| Search service | `NavigationChannelService.java:592-616` `searchDocuments` — filter `orgUnitId`/`seaportId`/`provinceId`/`conditionStatus`/`keyword`/`approvalStatus`, sort `created_at DESC` |
| Đọc history (dùng chung F-043) | `NavigationChannelService.java:526-550` `getHistory` — `approved_date DESC` + map tên user (`fullName` → `username` → id) |

## Thay đổi

**Không có.** Không sửa `NavigationChannelController`/`Service`/DTO/entity/repository cho F-042 (đúng ràng buộc design plan mục 7). Gating nút Sửa/Xóa theo trạng thái thuộc WO-F039-FE-1 / WO-F040-FE-1; type `HistoryEntry.id` FE thuộc WO-F043-FE-1 — đều ngoài phạm vi BE.

## Kết quả verify (output thực tế)

**`mvn -DskipTests compile`** (Maven 3.9.16, `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd`, workdir workspace root):

```
[INFO] Compiling 1104 source files with javac [debug parameters release 17] to target\classes
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  21.978 s
```
Exit code: 0.

**`mvn test`**:

```
[ERROR] Tests run: 989, Failures: 0, Errors: 4, Skipped: 0
```
- Toàn bộ test liên quan navigationchannel pass: `NavigationChannelServiceLifecycleTest` 10/10, `NavigationChannelServiceTest` 6/6 (surefire reports `target/surefire-reports/`).
- 4 errors thuộc 2 class **pre-existing, ngoài phạm vi**: (1) `FlywayMigrationTest` ×2 — migration `V20260822130000:49` (`buoy_station.code` không tồn tại), đã ghi nhận tại `NavigationChannelServiceTest.java:26-27` từ F-038; (2) `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` (module beacon, org-unit scope) — không liên quan F-042/navigationchannel. Cùng con số 989/0/4 ở cả 2 lần chạy (09:08 và 09:16).

## Ghi chú

- Integration test filter/scope (WO-F042-BE-V1) cần Spring context — chặn bởi Flyway pre-existing; thuộc QA/verifier sau khi migration fix (gotcha `flyway-v20260822130000-breaks-context`).
