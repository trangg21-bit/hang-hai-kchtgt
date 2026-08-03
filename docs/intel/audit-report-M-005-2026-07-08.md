# Audit Report: M-005 — Quản lý biến động tài sản KCHTGT

**Date:** 2026-07-08
**Audit scope:** 72 source files, 1 test file, 10 controllers, 10 services, 10 DTOs, 17+ entities, 10 repositories
**Build:** JDK 17, `mvn compile` PASS
**Overall Verdict:** ⚠️ **WARN** — Compiles cleanly, auth is solid, but has critical gaps: zero input validation, broken tests, test coverage fabrications, and hardcoded business data.

---

## Executive Summary

Module M-005 "Quản lý biến động tài sản KCHTGT" manages 6 asset movement features (F-122 through F-127): asset increase, decrease, handling, inventory, exploitation, and approval workflows. With JDK 17, the codebase compiles cleanly (72 source files, BUILD SUCCESS). Every controller endpoint is properly protected with `@PreAuthorize`, following a consistent `asset:<resource>` permission model — this is the strongest aspect of the module.

However, the module has **serious gaps** that undermine its production readiness:

1. **Zero input validation** across all 20 POST/PUT endpoints and all 10 DTOs — the project already has `spring-boot-starter-validation` on the classpath, but no `@Valid`, `@NotNull`, `@NotEmpty`, `@Size`, or `@Positive` annotations are used anywhere.
2. **Tests are broken** — the single test file (YeuCauTangTaiSanServiceTest) has 4/8 tests failing with NullPointerException because the service was refactored to add new dependencies (`taiSanRepository`, `userRepository`) but the test mocks were never updated.
3. **Test coverage is misrepresented** — `_state.md` claims 20 test files and 15+ test methods, but only 1 test file with 9 @Test methods exists on disk. 5 of 6 features have zero test coverage.
4. **Data fabrication in service layer** — `YeuCauTangTaiSanService.toResponse()` hardcodes `soLuong(1)` and `donViTinh("Cái")`; `YeuCauBienDongService.toResponse()` hardcodes `soLuong(0)` and `taiSanId(null)`. These fabricated values replace actual business data.
5. **N+1 query risk** — `YeuCauTangTaiSanService.toResponse()` queries `taiSanRepository` and `userRepository` per-row in paginated lists.
6. **SDLC state drift** — `_state.md` says "closed" / "done" but all 6 feature briefs say "proposed". The test count discrepancy is significant.

The module is architecturally sound (clean layered pattern, consistent entity design, proper soft-delete with optimistic locking on most entities) but needs remediation on validation, testing, and data integrity before production deployment.

---

## Findings by Severity

### 🔴 CRITICAL

| # | Finding | Location | Risk |
|---|---|---|---|
| **C1** | **Zero input validation on all endpoints** — All 10 controllers' POST/PUT methods accept `@RequestBody` without `@Valid`. All 10 DTOs have zero Bean Validation annotations (`@NotNull`, `@NotEmpty`, `@Size`, `@Positive`, etc.). Malformed payloads pass through unchecked — null required fields, negative prices, arbitrarily long strings. | All 10 controllers (all POST/PUT endpoints), all 10 `*Request.java` DTOs | Data corruption, security bypass, DoS via large payloads |
| **C2** | **Tests are broken** — `YeuCauTangTaiSanServiceTest` has 4 of 8 tests failing with `NullPointerException: Cannot invoke "TaiSanKCHTRepository.findById(Object)" because "this.taiSanRepository" is null`. The service added `TaiSanKCHTRepository` and `UserRepository` dependencies via refactoring, but the test's `@Mock` declarations were never updated. | `YeuCauTangTaiSanServiceTest.java:74,89,112,127` | Regression — module has effectively zero passing tests |
| **C3** | **Test coverage fabrication** — `_state.md` claims: "Test files: 20", "Test methods: 15+". Reality: 1 test file (`YeuCauTangTaiSanServiceTest.java`) with 9 `@Test` methods, 4 of which fail. 5 of 6 features (F-123 through F-127) have zero test coverage. | `docs/modules/M-005-quan-ly-bien-dong-tai-san-kchtgt/_state.md` | False confidence in module quality; governance risk |
| **C4** | **Data fabrication in service responses** — `YeuCauTangTaiSanService.toResponse()` hardcodes `soLuong(1)` and `donViTinh("Cái")` regardless of actual data. `YeuCauBienDongService.toResponse()` hardcodes `soLuong(0)` and `taiSanId(null)`. Real business data is discarded and replaced with placeholder values. | `YeuCauTangTaiSanService.java:174-175`, `YeuCauBienDongService.java:155-156` | Incorrect business reporting, audit non-compliance, violates "Data thật - Không gán mặc định" principle |

### 🟠 HIGH

| # | Finding | Location | Risk |
|---|---|---|---|
| **H1** | **N+1 query in paginated responses** — `YeuCauTangTaiSanService.toResponse()` calls `taiSanRepository.findById()` and `userRepository.findById()` for EVERY entity in a page. With page size 20, this generates up to 41 queries per request (1 for entities + 20 for assets + 20 for users). | `YeuCauTangTaiSanService.java:162-180` | Performance degradation under load |
| **H2** | **Vietnamese diacritics in URL and table name** — `LuuPheDuyetController` maps to `/api/v1/asset/luu-phe-duyệt` (contains `ệ`). Entity table name is `@Table(name = "luu_phe_duyệt")`. Both break RFC 3986 compliance and may cause encoding mismatches across clients/proxies/databases. | `LuuPheDuyetController.java:13`, `LuuPheDuyet.java:15` | Interoperability issues, encoding errors |
| **H3** | **`LuuPheDuyet` entity missing `@SQLRestriction`** — All other entities have `@SQLRestriction("deleted = false")`, but `LuuPheDuyet` does not. Soft-deleted approval records will still appear in all queries. | `LuuPheDuyet.java:15` (no `@SQLRestriction`) | Data leakage — deleted approval records visible |
| **H4** | **Unvalidated `Map<String, String>` for approve/reject** — 4 endpoints use `@RequestBody(required=false) Map<String, String>` instead of proper DTOs. `remarks` is extracted with `.get("remarks")` — no type safety, can be null, no length limits, no injection protection. | `YeuCauGiamTaiSanController.java:84,95`, `YeuCauTangTaiSanController.java:84,95` | Type safety loss, validation bypass |
| **H5** | **Primitive `int` silently defaults to 0** — `soLuong`, `soLuongKyHienTai`, `soLuongKyThucTe`, `tongSoLuong`, `soLuongChenhLech` are primitive `int` (not `Integer`). When omitted from JSON, they silently become 0 instead of failing validation — impossible to distinguish "not sent" from "intentionally zero". | `YeuCauGiamTaiSanRequest.java:10`, `YeuCauBienDongRequest.java:9`, `YeuCauTangTaiSanRequest.java:10`, `TaiSanKiemKeRequest.java:14-15`, `BaoCaoKiemKeRequest.java:9-10` | Silent data corruption |
| **H6** | **Missing `@NotNull` on all FK UUIDs** — Every DTO has at least one UUID FK field (`taiSanId`, `keHoachId`, `yeuCauId`) without `@NotNull`. API accepts null foreign keys without failing fast. | All 10 `*Request.java` DTOs | Data integrity — orphan records possible |

### 🟡 MEDIUM

| # | Finding | Location | Risk |
|---|---|---|---|
| **M1** | **`TrangThaiTaiSan` enum includes `DECOMMISSION` as English value** — All other enum values are Vietnamese (`CHO_PHE_DUYET`, `DANG_QUAN_LY`, `HUY`, `GIAI_THE`, `PHA_BO`) except `DECOMMISSION`. Inconsistent naming convention. | `TrangThaiTaiSan.java:10` | Naming inconsistency |
| **M2** | **`TaiSanKCHT` field naming uses PascalCase for DB columns** — `HaoMonLucKe`, `GiaTriConLai` are Java field names that directly become column names (no `@Column(name=...)` override). Java convention is camelCase; PascalCase Java fields are unusual and confusing. | `TaiSanKCHT.java:45,49` | Code readability, developer confusion |
| **M3** | **No `@Column` length constraints on unlimited text fields** — `moTa`, `lyDo`, `ghiChu`, `thongSoKyThuat`, `approvedRemarks`, `unapprovedRemarks` in multiple entities have no `@Size` or `@Column(length=...)`. Default VARCHAR(255) truncation risk or unlimited text bloat. | Multiple entities (TaiSanKCHT, YeuCauTangTaiSan, YeuCauGiamTaiSan, etc.) | Data truncation or unbounded storage |
| **M4** | **SDLC state drift** — `_state.md` says `status: done`, `current-stage: closed`, `sealed: true`. All 6 feature briefs say `status: proposed`. `module-brief.md` says `Status: in-progress — current stage: engineering-business-analyst`. Three conflicting views of the same module. | `docs/modules/M-005-.../_state.md`, all `_features/F-12*/feature-brief.md`, `module-brief.md` | Governance confusion |
| **M5** | **`implementations.yaml` has empty stakeholder and dependency fields** — `business-owner`, `tech-lead`, `qa-lead` all empty; `implementations` section completely empty (no apps, services, libs mapped). | `docs/modules/M-005-.../implementations.yaml` | Missing project governance metadata |
| **M6** | **`BaoCaoKiemKe` entity has hardcoded Vietnamese column names** — `PhamVi`, `TongSoTaiSan`, `SoThua`, `SoThieu`, `SoKhacThuong` are PascalCase Java fields used as column names. Same naming issue as M2. | `BaoCaoKiemKe.java` | Naming inconsistency |

### 🟢 LOW

| # | Finding | Location | Risk |
|---|---|---|---|
| **L1** | **Duplicate permission strings for approve/reject** — `/approve` and `/reject` endpoints use the same permission as CRUD (`asset:yeu-cau-giam`, `asset:yeu-cau-tang`). Consider separate `asset:yeu-cau-giam:approve` for finer-grained access control. | `YeuCauGiamTaiSanController.java:84,95`, `YeuCauTangTaiSanController.java:84,95` | Coarse-grained authorization |
| **L2** | **`delete()` method uses `repository.deleteById()` not soft-delete** — Despite entities having `deleted` field and `softDelete()` method, the service's `delete()` calls `repository.deleteById()` which performs a hard delete. The `@SQLRestriction` will then hide the row but it's physically removed. | All 10 services' `delete()` methods | Inconsistent with soft-delete design intent |

---

## Build Status

| Check | Result |
|---|---|
| `mvn compile` (JDK 17) | ✅ **PASS** — BUILD SUCCESS, 0 errors, 0 warnings |
| `mvn test` (JDK 17) | ❌ **FAIL** — 707 tests run, 3 Failures, 4 Errors |
| M-005 test failures | 4/8 tests in `YeuCauTangTaiSanServiceTest` — NullPointerException |
| Other failures | 2 in `VanBanPhapLyControllerTest` (Page-vs-List type mismatch), 1 in `VanHanhTaiSanControllerTest` (same) |

**M-005 test failure details:**
```
YeuCauTangTaiSanServiceTest.create_ShouldSaveAndReturnResponse:74
  → NullPointer: Cannot invoke "TaiSanKCHTRepository.findById(Object)" because "this.taiSanRepository" is null

YeuCauTangTaiSanServiceTest.findAll_ShouldReturnPageOfResponses:112
  → Same NullPointer

YeuCauTangTaiSanServiceTest.getById_ShouldReturnResponse_WhenIdExists:89
  → Same NullPointer

YeuCauTangTaiSanServiceTest.update_ShouldModifyAndSave_WhenIdExists:127
  → Same NullPointer
```

**Root cause:** `YeuCauTangTaiSanService` was refactored to add `TaiSanKCHTRepository` and `UserRepository` as `@RequiredArgsConstructor` dependencies. The test class has `@InjectMocks` on the service but only `@Mock` on `YeuCauTangTaiSanRepository` — missing mocks for `taiSanRepository` and `userRepository`.

---

## Security Checklist

| Controller | Endpoints | @PreAuthorize | Input Validation | Notes |
|---|---|---|---|---|
| TaiSanKCHTController | 5 | ✅ All | ❌ None | Standard CRUD, no validation |
| YeuCauGiamTaiSanController | 7 | ✅ All | ❌ 5 standard + ⚠️ 2 Map | approve/reject use raw Map |
| YeuCauBienDongController | 5 | ✅ All | ❌ None | Manual validation in service only |
| KeHoachKiemKeController | 5 | ✅ All | ❌ None | |
| TaiSanKiemKeController | 5 | ✅ All | ❌ None | |
| KhaiThacTaiSanController | 5 | ✅ All | ❌ None | |
| YeuCauTangTaiSanController | 7 | ✅ All | ❌ 5 standard + ⚠️ 2 Map | approve/reject use raw Map |
| BaoCaoKiemKeController | 5 | ✅ All | ❌ None | |
| LuuPheDuyetController | 5 | ✅ All | ❌ None | ⚠️ URL: `/luu-phe-duyệt` |
| HoSoXuLyTaiSanController | 5 | ✅ All | ❌ None | |

---

## Test Coverage Matrix

| Feature | Has Tests? | Test File | Test Methods | Passing | Notes |
|---|---|---|---|---|---|
| F-122 Tăng tài sản | ⚠️ Partial | `YeuCauTangTaiSanServiceTest.java` | 9 @Test | 5/9 (56%) | 4 failures — NPE on missing mock |
| F-123 Giảm tài sản | ❌ None | — | 0 | 0 | No test file exists |
| F-124 Xử lý tài sản | ❌ None | — | 0 | 0 | No test file exists |
| F-125 Kiểm kê tài sản | ❌ None | — | 0 | 0 | No test file exists |
| F-126 Khai thác tài sản | ❌ None | — | 0 | 0 | No test file exists |
| F-127 Phê duyệt biến động | ❌ None | — | 0 | 0 | No test file exists |

**Coverage by feature acceptance criteria:**
- F-122: 2/4 AC implied by tests (create + get-by-id), 2/4 AC untested (auto-check validity, auto-transfer to F-127)
- F-123 through F-127: 0/20+ acceptance criteria tested

---

## SDLC Compliance

| Aspect | Claim | Reality | Gap |
|---|---|---|---|
| Module status | `closed` / `done` / `sealed: true` | Tests broken, 0 validation, data fabrication | Prematurely sealed |
| Feature status | All 6 say `proposed` | Code exists for all 6 features | Feature briefs not updated |
| Module brief status | `in-progress — BA stage` | Code complete (dev done) | Module brief stale |
| Test file count | 20 test files | 1 test file | 19:1 fabrication |
| Test method count | 15+ | 9 (5 passing) | Overstated |
| Source file count | 72 | 72 | ✅ Accurate |
| Build status | BUILD SUCCESS | PASS (JDK 17) | ✅ Accurate |
| Stakeholders | All empty | All empty | Missing governance |
| Dependencies | Empty | No cross-module deps found | ✅ Accurate for now |

---

## Entity Audit

| Entity | @SQLRestriction | @Version | Soft Delete Fields | Notes |
|---|---|---|---|---|
| TaiSanKCHT | ✅ | ✅ | ✅ deleted, deletedBy, deletedAt | PascalCase columns: HaoMonLucKe, GiaTriConLai |
| YeuCauTangTaiSan | ✅ | ✅ | ✅ | Standard pattern |
| YeuCauGiamTaiSan | ✅ | ✅ | ✅ | Standard pattern |
| YeuCauBienDong | ✅ | ✅ | ✅ | Standard pattern |
| KeHoachKiemKe | ✅ | ✅ | ✅ | Standard pattern |
| TaiSanKiemKe | ✅ | ✅ | ✅ | Standard pattern |
| KhaiThacTaiSan | ✅ | ✅ | ✅ | Standard pattern |
| BaoCaoKiemKe | ✅ | ✅ | ✅ | PascalCase columns |
| HoSoXuLyTaiSan | ✅ | ✅ | ✅ | Standard pattern |
| LuuPheDuyet | ❌ **MISSING** | ✅ | ✅ | Table name: `luu_phe_duyệt` (diacritics) |

---

## Recommendations (Prioritized)

### Immediate (before any production use)

1. **Add `@Valid` and Bean Validation annotations** to all POST/PUT endpoints and DTOs — minimum: `@NotNull` on FK UUIDs, `@NotBlank` on required strings, `@Positive` on monetary values, `@Size` on text fields.

2. **Fix broken tests** — add `@Mock TaiSanKCHTRepository` and `@Mock UserRepository` to `YeuCauTangTaiSanServiceTest`, then verify all 9 tests pass.

3. **Remove hardcoded data fabrication** — `soLuong(1)`, `donViTinh("Cái")`, `soLuong(0)`, `taiSanId(null)` in service `toResponse()` methods. Replace with actual entity fields.

4. **Write tests for F-123 through F-127** — minimum one test class per feature, covering core acceptance criteria from feature briefs.

### Short-term

5. **Add `@SQLRestriction("deleted = false")` to `LuuPheDuyet`** entity.

6. **Fix Vietnamese diacritics** in `LuuPheDuyetController` URL path (use `duyet` not `duyệt`) and `LuuPheDuyet` table name.

7. **Replace `int` primitives with `@NotNull Integer`** in all DTO quantity fields to prevent silent 0-defaulting.

8. **Replace `Map<String, String>` with typed DTOs** for approve/reject endpoints.

9. **Fix N+1 query** in `YeuCauTangTaiSanService.toResponse()` — batch-fetch assets and users, or use projections.

### Medium-term

10. **Update SDLC state** — sync `_state.md`, feature briefs, and `module-brief.md` to reflect actual module status.

11. **Populate `implementations.yaml`** with stakeholder, tech-lead, qa-lead, and implementation mappings.

12. **Standardize entity field naming** — use camelCase Java fields with explicit `@Column(name=...)` annotations for database column names.

13. **Consider `DECOMMISSION` → `HUY_BO`** for enum naming consistency.

---

*Audit conducted 2026-07-08. Tools: manual code review (all 72 source files), Maven build/test, SDLC artifact cross-reference. Security audit subset also available at `docs/intel/audit-m005-security.md`.*
