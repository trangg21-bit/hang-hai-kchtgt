# Dev W1 — Thêm trường "Cấp đơn vị" (`rank`) cho đơn vị (F-003)

- **Triage:** TRI-1786936397148-3956 (C3, one-way door: `V20260817100000__add_org_unit_rank.sql`)
- **Stage:** engineering-backend-developer-wave-1 (backend wave, WO-01..05)
- **Wire contract:** `OrgUnitRank` serialize theo NAME (không `@JsonValue`), DB lưu ordinal `SMALLINT` qua `autoApply` converter (mirror `OrgUnitStatus`).

## Files created

| File | Nội dung |
|---|---|
| `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRank.java` | Enum `CUC`, `CHI_CUC_CANG_VU_CONG_TY_BAO_DAM`, `DAI_DIEN` — không `@JsonValue` (NAME serialization) |
| `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRankConverter.java` | `@Converter(autoApply=true)` `AttributeConverter<OrgUnitRank, Short>`, ordinal + range-guard `[0..values.length)` else null |
| `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql` | `ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0` → backfill theo `level` (<=1→0, =2→1, else→2) → `DROP DEFAULT` |
| `src/test/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRankConverterTest.java` | 5 test: ordinal write, null-safe write, ordinal read, out-of-range guard, null read |

## Files modified

| File | Thay đổi |
|---|---|
| `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnit.java` | Thêm `@FieldNameConstants` + import `lombok.experimental.FieldNameConstants`; thêm field `private OrgUnitRank rank;` `@Column(nullable=false, columnDefinition="SMALLINT")` (sau `status`) |
| `src/main/java/com/hanghai/kchtg/orgunit/config/OrgUnitSchemaMigrator.java` | Thêm `ALTER TABLE org_units ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0` + log "Đã kiểm tra cấu trúc cấp đơn vị." (sau operational_status; giữ DEFAULT 0) |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/CreateOrgUnitRequest.java` | Thêm `private OrgUnitRank rank;` (sau operationalStatus) + import |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/UpdateOrgUnitRequest.java` | Thêm `private OrgUnitRank rank;` (sau operationalStatus) + import |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/OrgUnitResponse.java` | Thêm field `private OrgUnitRank rank;` + `.rank(entity.getRank())` trong `from()` + import |
| `src/main/java/com/hanghai/kchtg/orgunit/service/OrganizationService.java` | Thêm import `OrgUnitRank`; builder create `.rank(resolveRank(request.getRank(), parent))`; update scalar `if (request.getRank() != null) unit.setRank(request.getRank());`; helper `resolveRank(...)` cạnh `validateParentEligibility` |
| `src/main/java/com/hanghai/kchtg/orgunit/config/OrgUnitDataFixer.java` | **Rework:** mọi `OrgUnit.builder()` set `.rank(rankForLevel(level))` (root level1→CUC; child level=parent.level+1); thêm helper `rankForLevel` |
| `src/main/java/com/hanghai/kchtg/seeder/DataSeeder.java` | **Rework:** root/loop/`addChild` builder set `.rank(rankForLevel(level))`; thêm helper `rankForLevel` + import `OrgUnitRank` |
| `src/main/java/com/hanghai/kchtg/seeder/M001DataSeeder.java` | **Rework:** root/loop/`addChild` builder set `.rank(rankForLevel(level))`; thêm helper `rankForLevel` + import `OrgUnitRank` |
| `src/test/java/com/hanghai/kchtg/orgunit/service/OrganizationServiceTest.java` | Thêm nested `RankResolutionTests`: 5 test (explicit rank, root→CUC, parent level1→CHI_CUC..., parent level2→DAI_DIEN, update sets rank) |

## Verification (đã chạy thật)

| Lệnh | Kết quả |
|---|---|
| `mvn clean compile` (root) — sau WO-01..05 | **exit 0** — BUILD SUCCESS, 1086 source files |
| `mvn test -Dtest=OrganizationServiceTest,OrgUnitRankConverterTest` | **exit 0** — Tests run: **23, Failures: 0, Errors: 0, Skipped: 0** |
| `mvn clean compile` (root) — sau rework seeder | **exit 0** — BUILD SUCCESS, 1086 source files |

Chi tiết test: `OrgUnitRankConverterTest` 5/5 pass; `OrganizationServiceTest` 18/18 pass (RankResolutionTests 5, HierarchyTests 2, ApprovalWorkflowTests 5, DeleteGuardTests 3, UniqueCodeTests 3).

## Ràng buộc đã tuân thủ

- Enum→SMALLINT **chỉ** qua `autoApply` AttributeConverter — không thêm `@Enumerated`.
- Không hardcode tên field dạng String; `@FieldNameConstants` theo pattern `VtsSystem.java:12`.
- Không fully-qualified class name — toàn bộ dùng `import` đầu file.
- DTO giữ Lombok `@Data`/`@Getter`/`@Setter`/`@Builder` hiện có.
- Message/log tiếng Việt có dấu.
- **Không** đụng `OrgUnitType`/`OrgUnitTypeConverter` (deprecated), **không** sửa `RolePermissionSeeder`, **không** đổi logic cột `level` của list, **không** git add/commit/push, **không** start backend.

## Rework đã xử lý — seeder NOT NULL (PMO finding)

Phát hiện ban đầu (đã sửa): 3 seeder/fixer khởi động bypass `OrganizationService`, build `OrgUnit` bằng `builder()` không set `rank` rồi `save()` trực tiếp; kết hợp `DROP DEFAULT` của migration sẽ vi phạm `NOT NULL` khi seed trên DB mới (bảng `org_units` rỗng).

**Fix:** mọi `OrgUnit.builder()` trong 3 file set `.rank(rankForLevel(level))` với quy tắc khớp migration backfill — `level<=1 → CUC`, `level==2 → CHI_CUC_CANG_VU_CONG_TY_BAO_DAM`, else `→ DAI_DIEN`:
- Root (level 1) → CUC; Cảng vụ (level 2) → CHI_CUC...; Đại diện (level 3) → DAI_DIEN.
- `child()`/`addChild()` derive từ `parent.getLevel() + 1` qua helper riêng `rankForLevel(Integer level)` ở mỗi file (null-safe, defensive).

`createRoot(...)` trong `OrgUnit.java` là dead code (0 call site toàn repo) — không cần sửa. `fixOrphans()` chỉ `setLevel(2)` + `save()` trên entity đã tồn tại (đã có rank từ backfill), không phải builder site.
