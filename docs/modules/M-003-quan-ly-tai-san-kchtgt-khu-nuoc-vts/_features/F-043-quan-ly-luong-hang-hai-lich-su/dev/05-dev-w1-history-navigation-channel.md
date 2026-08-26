# Dev Report BE — F-043 Lịch sử thay đổi Luồng hàng hải (WO-F043-BE-1)

- **Feature:** F-043 (M-003) — Lịch sử thay đổi Luồng hàng hải
- **Stage:** engineering-backend-developer-wave-1
- **Ngày:** 2026-08-26 (rev. 2 — rework theo QA Changes-requested: fix existence + data scope cho `getHistory`)
- **Design plan:** `_features/F-043-quan-ly-luong-hang-hai-lich-su/design/00-design-plan.md` (D1/D2-CREATED, WO-F043-BE-1)

## Thay đổi code

**File:** `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java`

| Vị trí (anchor cuối cùng) | Thay đổi |
|---|---|
| `create()` `:85-171` — chèn sau block retry codegen (`:150-158`) + GIS (`:160-168`), trước `return toResponse(nc)` (`:170`) | **D2-CREATED**: ghi `ApprovalHistory` `status=CREATED`/`approvalLevel=LEVEL_0`/`approvedBy=userId`/`reason="Tạo mới luồng hàng hải"` (pattern `ShipRepairFacilityService.java:96-105`); `approved_date` tự gán qua `@PrePersist` (`ApprovalHistory.java:70-75`) — không set thủ công |

```java
// F-043: ghi history CREATED sau khi create thành công (cùng transaction với toàn bộ create)
approvalHistoryRepo.save(ApprovalHistory.builder()
        .refId(nc.getId())
        .refType(InfrastructureType.NAVIGATION_CHANNEL)
        .approvalLevel(ApprovalLevel.LEVEL_0)
        .status(ApprovalHistoryStatus.CREATED)
        .approvedBy(userId)
        .reason("Tạo mới luồng hàng hải")
        .build());
```

- Import: `ApprovalHistoryStatus`, `ApprovalLevel`, `ApprovalHistory`, `InfrastructureType`, `ApprovalHistoryRepository` **đã có sẵn** từ F-038 (dùng ở `getHistory`) — không thêm import mới.
- Ghi sau block retry → chỉ 1 dòng CREATED kể cả khi codegen collision retry.
- Cùng transaction `@Transactional` (`:83`) — GIS thất bại sau đó rollback sạch cả history.
- **KHÔNG đụng `update`/`softDelete`** (thuộc F-039/F-040 — sự kiện `UPDATED`/`DELETED` do 2 WO đó ghi; đã implement trong cùng phiên, xem report F-039/F-040).
- Phía đọc: `getHistory` (`:526-553`) trả mọi sự kiện theo `approved_date DESC` + map tên user; guard `navigationchannel:history` (`NavigationChannelController.java:126-130`).

### Rework QA Changes-requested — getHistory existence + data scope (rev. 2)

| Vị trí (anchor cuối cùng) | Thay đổi |
|---|---|
| `getHistory()` `:526-553` | **QA CHANGES-REQUESTED (2 blocker):** thêm đầu method (mirror pattern `rejectLevel1`/`rejectLevel2` cùng file `:505-507`, `:515-517`): `repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id))` |

```java
@Transactional(readOnly = true)
public List<HistoryEntry> getHistory(UUID id) {
    // F-043 (QA CHANGES-REQUESTED): existence + org-unit data scope — repo.findById đi qua
    // @Filter(orgUnitFilter) (được bật bởi @DataScope ở controller), nên hồ sơ không tồn tại /
    // đã xóa mềm / ngoài phạm vi đơn vị → orElseThrow → 400-family thay vì trả [] (AC-043-04/06).
    repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
    List<ApprovalHistory> history = approvalHistoryRepo
            .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.NAVIGATION_CHANNEL, id);
    ...
}
```

- **Blocker 1 — AC-043-04 (existence):** id không tồn tại / đã xóa mềm → `repo.findById` empty (filter `deleted_at IS NULL` tại `BaseEntity.java:23`) → `orElseThrow` → 400-family "Không tìm thấy luồng hàng hải với id" thay vì trả `[]`.
- **Blocker 2 — AC-043-06 (data scope):** `repo.findById` đi qua Hibernate global filter `orgUnitFilter` (active bởi `@DataScope` class-level controller `NavigationChannelController.java:25`) → hồ sơ ngoài phạm vi đơn vị → empty → `orElseThrow` → **không rò rỉ history** sang user ngoài phạm vi.
- **KHÔNG thêm `@Filter` vào `ApprovalHistory`** (entity chung, không có `orgUnitId` — sẽ sai và ảnh hưởng mọi module dùng chung).
- Không đổi `getApprovalHistory` (delegate `:581`), không đổi `InfrastructureApprovalService`.

## Test

**File mới:** `src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceLifecycleTest.java` (Mockito thuần)

| Test | Oracle |
|---|---|
| `create_recordsCreatedHistory` | Tạo mới → `approvalHistoryRepo.save` với `status=CREATED`, `approvalLevel=LEVEL_0`, `refType=NAVIGATION_CHANNEL`, `approvedBy=userId`, `reason="Tạo mới luồng hàng hải"` |
| `create_outOfScope_skipsHistory` | Tạo ngoài write-scope → `AccessDeniedException`, **không** ghi history |
| `getHistory_nonExistentId_throwsAndSkipsHistoryQuery` (mới rev.2) | `repo.findById` → empty → `IllegalArgumentException` "Không tìm thấy luồng hàng hải với id"; `approvalHistoryRepo.findBy...` **không** được gọi (không rò rỉ) |
| `getHistory_existingId_returnsEntries` (mới rev.2) | `repo.findById` → hồ sơ tồn tại → trả đủ entries, `status=CREATED`, `reason="Tạo mới luồng hàng hải"` (hồi quy happy path) |

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
- `NavigationChannelServiceTest` (F-038): **Tests run: 6, Failures: 0, Errors: 0**
- 4 errors thuộc 2 class **pre-existing, ngoài phạm vi**: (1) `FlywayMigrationTest` ×2 — migration `V20260822130000:49` (`buoy_station.code` không tồn tại), đã ghi nhận tại `NavigationChannelServiceTest.java:26-27` từ F-038; (2) `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` (module beacon, org-unit scope) — không liên quan navigationchannel. Cùng con số 989/0/4 ở cả 2 lần chạy (09:08 và 09:16). Delta này không đụng migration/SQL/module khác.

**Scoped re-run rev.2 (sau fix getHistory — output thực tế 09:49:09):**

```
$ mvn test -Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest
[INFO] Compiling 1104 source files ... / Compiling 110 source files ... (recompile vì source thay đổi)
[INFO] Running com.hanghai.kchtg.navigationchannel.NavigationChannelServiceLifecycleTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 -- in NavigationChannelServiceLifecycleTest
[INFO] Running com.hanghai.kchtg.navigationchannel.NavigationChannelServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 -- in NavigationChannelServiceTest
[INFO] Results:
[INFO] Tests run: 18, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time:  46.077 s
```
Exit code: 0.

## Ghi chú

- Không migration (bảng `approval_history` đã đủ cột), không mở rộng enum `ApprovalHistoryStatus`/`ApprovalStatus`, không sửa `InfrastructureApprovalService` (sự kiện phê duyệt PROPOSED/APPROVED/REJECTED đã đúng).
- Integration test chuỗi timeline CREATED→...→DELETED (WO-F043-BE-V1) chạy sau khi F-039/F-040 merged — cần Spring context, chặn bởi Flyway pre-existing (gotcha `flyway-v20260822130000-breaks-context`).
- FE: type `HistoryEntry.id` number→string thuộc WO-F043-FE-1 (ngoài phạm vi BE).
