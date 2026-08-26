# Dev Report BE — F-040 Xóa (soft delete) Luồng hàng hải (WO-F040-BE-1)

- **Feature:** F-040 (M-003) — Xóa Luồng hàng hải
- **Stage:** engineering-backend-developer-wave-1
- **Ngày:** 2026-08-26
- **Design plan:** `_features/F-040-quan-ly-luong-hang-hai-xoa/design/00-design-plan.md` (D1/D2, WO-F040-BE-1)

## Thay đổi code

**File:** `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java`

| Vị trí (anchor cuối cùng) | Thay đổi |
|---|---|
| `softDelete()` `:441-463` | **D1 GIỮ nguyên guard `APPROVED`-only** (`:447-449` — `if (nc.getApprovalStatus() != ApprovalStatus.APPROVED) throw new IllegalStateException("Chỉ có luồng hàng hải đã duyệt mới có thể xóa mềm")`, precedent `ShipRepairFacilityService.java:255-267`). Không mở rộng tập trạng thái. |
| `softDelete()` `:460-462` | **D2 ghi history DELETED** — sau `repo.save(nc)` trong cùng `@Transactional` (`:441`), caller ĐẦU TIÊN của `ApprovalHistoryUtils.recordSoftDelete` (grep toàn repo trước đó: không có caller): `ApprovalHistoryUtils.recordSoftDelete(approvalHistoryRepo, id, InfrastructureType.NAVIGATION_CHANNEL, operatorId, "Xóa luồng hàng hải")` — utility tự ghi `status=DELETED`, `approvalLevel=LEVEL_0`, `approvedBy=operatorId`, `changedField=EntityFields.DELETED_AT`, `previousValue="null"`, `newValue="đã xóa mềm"` |
| Imports | Thêm `com.hanghai.kchtg.common.util.ApprovalHistoryUtils` (duy nhất — `approvalHistoryRepo` + `InfrastructureType` đã có) |

Không sửa GIS cleanup (`:451-453`) và log (`:463`). Không tự dựng `ApprovalHistory.builder()` ở method này (tái dùng utility).

## Test

**File mới:** `src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceLifecycleTest.java` (Mockito thuần)

| Test | Oracle |
|---|---|
| `softDelete_approved_recordsDeleteHistory` | Xóa `APPROVED` → `approvalHistoryRepo.save` với `status=DELETED`, `refType=NAVIGATION_CHANNEL`, `approvalLevel=LEVEL_0`, `approvedBy=operatorId`, `reason="Xóa luồng hàng hải"`, `changedField=EntityFields.DELETED_AT` |
| `softDelete_draft_stillRejected` | Xóa `DRAFT` → `IllegalStateException` "Chỉ có luồng hàng hải đã duyệt...", không ghi history |

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
[INFO] Running com.hanghai.kchtg.navigationchannel.NavigationChannelServiceLifecycleTest
[ERROR] Tests run: 989, Failures: 0, Errors: 4, Skipped: 0
```
- `NavigationChannelServiceLifecycleTest`: **Tests run: 10, Failures: 0, Errors: 0** (surefire report `target/surefire-reports/com.hanghai.kchtg.navigationchannel.NavigationChannelServiceLifecycleTest.txt`)
- 4 errors thuộc 2 class **pre-existing, ngoài phạm vi**: (1) `FlywayMigrationTest` ×2 — migration `V20260822130000:49` (`buoy_station.code` không tồn tại, `ERROR: column "code" does not exist`), đã ghi nhận tại `NavigationChannelServiceTest.java:26-27` từ F-038; (2) `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` (module beacon, org-unit scope) — không liên quan navigationchannel. Cùng con số 989/0/4 ở cả 2 lần chạy (09:08 và 09:16). Delta này không đụng migration/SQL/module khác.

## Ghi chú

- Không xóa cứng, không đổi schema, không migration, không sửa `InfrastructureApprovalService`.
- FE gating nút Xóa theo trạng thái thuộc WO-F040-FE-1 (ngoài phạm vi BE).
