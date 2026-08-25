# Dev Wave-1 — Verify permission coverage (WO-BE-1)

- **Module:** M-024 — Tái cấu trúc Menu & Navigation
- **Feature:** F-292 — Tái cấu trúc menu & điều hướng
- **Stage:** engineering-backend-developer (wave 1)
- **Work order:** WO-BE-1 — Verify seeded permissions; expected diff: NONE (`PermissionSeeder.java`)
- **Verdict:** Verify-only — **CONFIRMED**, no code change made. `PermissionSeeder.java` is untouched this wave.

---

## 1. Conclusion (D-4 claim verification)

**D-4 decision verified as TRUE:** every permission code referenced by the FINAL route→permission map
(design `00-design-plan.md` §4.4, lines 227–263) is **already seeded** via a `seedPermission(...)` call
inside `run()` of `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java`. **No new permission is
required; `menu:view` does NOT exist and must NOT be added.**

Evidence anchors (all grep-verified this session against the real file):
- Seeder entry point: `run(String... args)` — `PermissionSeeder.java:45`
- Seed method signature: `seedPermission(Map<String, Permission> definitions, String resource, String action, String name, ...)` — `PermissionSeeder.java:716`
- All seed calls verified sit at `PermissionSeeder.java:52`–`:518`, i.e. inside the `run()` body (method at `:45`, seed method declared at `:716`).
- Negative check: grep `"menu"` in `PermissionSeeder.java` → **No files found** (no `menu:view`, no `menu` resource seeded).

---

## 2. Permission-coverage table (§4.4 route → permission → seedPermission line)

28 distinct permission codes are referenced by the final §4.4 map; all 28 are seeded. Each verified by
grep on the exact argument pair `"<resource>", "<action>"` — one match each, no duplicates.

| # | Route(s) (design §4.4) | Permission code | seedPermission call | Verified grep hit |
|---|---|---|---|---|
| 1 | `/users` | `user:read` | `PermissionSeeder.java:54` | `seedPermission(definitions, "user", "read", "Xem tài khoản người dùng", ...)` |
| 2 | `/organizations` | `orgunit:read` | `PermissionSeeder.java:66` | `seedPermission(definitions, "orgunit", "read", "Xem đơn vị", ...)` |
| 3 | `/groups` | `group:read` | `PermissionSeeder.java:72` | `seedPermission(definitions, "group", "read", "Xem nhóm", ...)` |
| 4 | `/settings` | `admin:manage` | `PermissionSeeder.java:83` | `seedPermission(definitions, "admin", "manage", "Quản trị hệ thống", ...)` |
| 5 | `/logs` | `admin:view` | `PermissionSeeder.java:84` | `seedPermission(definitions, "admin", "view", "Xem cấu hình quản trị", ...)` |
| 6 | `/connections`, `/interconnect` | `connection:read` | `PermissionSeeder.java:101` | `seedPermission(definitions, "connection", "read", "Xem kết nối liên thông", ...)` |
| 7 | `/symbols`, `/gis/points`, `/gis/lines`, `/gis/polygons`, `/gis/map` | `data:read` | `PermissionSeeder.java:108` | `seedPermission(definitions, "data", "read", "Đọc dữ liệu", ...)` |
| 8 | `/reports` | `report:read` | `PermissionSeeder.java:120` | `seedPermission(definitions, "report", "read", "Xem báo cáo", ...)` |
| 9 | `/documents/legal`, `/documents/incidents`, `/documents/port-planning` | `document:read` | `PermissionSeeder.java:131` | `seedPermission(definitions, "document", "read", "Xem văn bản", ...)` |
| 10 | `/port` | `port:read` | `PermissionSeeder.java:182` | `seedPermission(definitions, "port", "read", "Xem cảng biển", ...)` |
| 11 | `/berth` | `berth:read` | `PermissionSeeder.java:199` | `seedPermission(definitions, "berth", "read", "Xem bến cảng", ...)` |
| 12 | `/pier` | `pier:read` | `PermissionSeeder.java:214` | `seedPermission(definitions, "pier", "read", "Xem cầu cảng", ...)` |
| 13 | `/dry-port` | `dryport:read` | `PermissionSeeder.java:229` | `seedPermission(definitions, "dryport", "read", "Xem cảng cạn", ...)` |
| 14 | `/water-zone` | `waterzone:read` | `PermissionSeeder.java:246` | `seedPermission(definitions, "waterzone", "read", "Xem vùng nước", ...)` |
| 15 | `/navigation-channel` | `navigationchannel:read` | `PermissionSeeder.java:294` | `seedPermission(definitions, "navigationchannel", "read", "Xem luồng hàng hải", ...)` |
| 16 | `/dike-revetment` | `dikerevetment:read` | `PermissionSeeder.java:314` | `seedPermission(definitions, "dikerevetment", "read", "Xem đê kè", ...)` |
| 17 | `/ship-repair-facility` | `shiprepair:read` | `PermissionSeeder.java:330` | `seedPermission(definitions, "shiprepair", "read", "Xem cơ sở sửa chữa tàu", ...)` |
| 18 | `/radar-station` | `radarstation:read` | `PermissionSeeder.java:370` | `seedPermission(definitions, "radarstation", "read", "Xem trạm radar", ...)` |
| 19 | `/vts-system` | `vts:read` | `PermissionSeeder.java:387` | `seedPermission(definitions, "vts", "read", "Xem hệ thống VTS", ...)` |
| 20 | `/beacon-stations` | `beaconstation:read` | `PermissionSeeder.java:414` | `seedPermission(definitions, "beaconstation", "read", "Xem đèn biển và nhà trạm", ...)` |
| 21 | `/buoy-station` | `buoystation:read` | `PermissionSeeder.java:430` | `seedPermission(definitions, "buoystation", "read", "Xem trạm phao", ...)` |
| 22 | `/buoys` | `buoy:read` | `PermissionSeeder.java:446` | `seedPermission(definitions, "buoy", "read", "Xem phao tiêu", ...)` |
| 23 | `/station/coastal` | `coastalstation:read` | `PermissionSeeder.java:480` | `seedPermission(definitions, "coastalstation", "read", "Xem trạm bờ", ...)` |
| 24 | `/station/special` | `specialstation:read` | `PermissionSeeder.java:490` | `seedPermission(definitions, "specialstation", "read", "Xem trạm chuyên dùng", ...)` |
| 25 | `/asset/inventory` | `inventoryasset:manage` | `PermissionSeeder.java:510` | `seedPermission(definitions, "inventoryasset", "manage", "Quản lý tài sản kiểm kê", ...)` |
| 26 | `/asset/decrease` | `assetdecrease:manage` | `PermissionSeeder.java:514` | `seedPermission(definitions, "assetdecrease", "manage", "Quản lý giảm tài sản", ...)` |
| 27 | `/asset/increase` | `assetincrease:manage` | `PermissionSeeder.java:516` | `seedPermission(definitions, "assetincrease", "manage", "Quản lý tăng tài sản", ...)` |
| 28 | `/asset/exploitation` | `assetexploitation:manage` | `PermissionSeeder.java:518` | `seedPermission(definitions, "assetexploitation", "manage", "Quản lý khai thác tài sản", ...)` |

**Non-required rows (still seeded — no change, no removal):**
- `map:manage` — `PermissionSeeder.java:90` (legacy; §4.4 final map replaces `/symbols` gate with `data:read`; seed kept — removing it would break other screens)
- `waterarea:read` — `PermissionSeeder.java:260` (legacy; §4.4 final map uses `waterzone:read` for `/water-zone`; seed kept)
- `/reports/F-*` — no map entry needed by design (inherited from `/reports` parent gate; `canAccessMenu` at `AppLayout.tsx:84` returns true when no map entry exists)
- `/` (Trang chủ) — no permission (utility route)

**Total:** 30 seedPermission calls for these permission families exist at `PermissionSeeder.java:54, 66, 72, 83, 84, 90, 101, 108, 120, 131, 182, 199, 214, 229, 246, 260, 294, 314, 330, 370, 387, 414, 430, 446, 480, 490, 510, 514, 516, 518` — matching the design §2 anchored list exactly. The 28 codes required by the final §4.4 map are a strict subset.

---

## 3. Compile verification (WO-BE-1 oracle)

Command (from workspace root `C:\Users\trangtt1\hang-hai-kchtgt`):

```
C:\my-tools\apache-maven-3.9.16\bin\mvn.cmd compile -DskipTests
```

> Note: `mvn` is not on PATH in this shell; Maven 3.9.16 is installed at `MAVEN_HOME=C:\my-tools\apache-maven-3.9.16` (no `mvnw` wrapper in the repo). Invoked by absolute path — same build, real execution.

**ACTUAL RESULT: exit code 0 — BUILD SUCCESS.**
- `[INFO] Building HH.KCHT :: M-001 Quản trị hệ thống 0.1.0-SNAPSHOT`
- `[INFO] --- enforcer:3.4.1:enforce (enforce-java-17) @ kchtg ---` — `RequireJavaVersion passed` (Java 17, `JAVA_HOME=...temurin17-jdk`)
- `[INFO] --- compiler:3.13.0:compile (default-compile) @ kchtg ---` — `Nothing to compile - all classes are up to date.` (incremental — consistent with a verify-only wave: zero source change since last successful compile)
- `[INFO] BUILD SUCCESS` / `Total time: 2.688 s` / `Finished at: 2026-08-25T18:07:48+07:00`

Exit code **0**, no errors. The `itext7-core` relocation warning is pre-existing and non-blocking.

---

## 4. Acceptance mapping

| Criterion | Status |
|---|---|
| Every §4.4 permission code already seeded via `seedPermission()` in `run()` | ✅ 28/28 verified, line-precise (table §2) |
| No new permission required (`menu:view` absent) | ✅ grep `"menu"` → 0 matches in `PermissionSeeder.java` |
| `mvn compile -DskipTests` actual result reported | ✅ exit 0, BUILD SUCCESS (§3) |
| No source-code change this wave | ✅ `PermissionSeeder.java` and all backend sources untouched (verify-only) |
| Anchors in `Basename.ext:line` form verified against real files | ✅ every seedPermission line above is a grep-verified hit this session |

---

## 5. Risks & observations

- **Lean-spec anchor drift (BA doc, not code):** `ba/00-lean-spec.md:42`/`:117` cite `run()` at "dòng 41" and `seedPermission(...)` at "dòng 726"; the real file has `run()` at `PermissionSeeder.java:45` and the method at `:716` (grep-verified, matching design §2 and QA report). Document-only drift — no code impact; flagging for the doc-owner (BA) to reconcile, not blocking this wave.
- **Fallback WO-BE-1** (add a seed only if a code is missing from DB after boot) is **not triggered** — all codes exist as seed calls; `run()` re-inserts idempotently on boot (findByCode check per AGENTS.md permission model).
- No DB/migration/endpoint involved; BR-024-11 (no schema change) respected.

**Source delta this wave:** none (verify-only). **Artifact delta:** this file.
