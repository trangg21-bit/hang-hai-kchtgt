# M-024 Tái cấu trúc Menu & Navigation — Review Report (Code Reviewer)

- **Module:** M-024 — Tái cấu trúc Menu & Navigation
- **Feature:** F-292 — Tái cấu trúc menu & điều hướng
- **Stage:** engineering-code-reviewer
- **Reviewed against:** `design/00-design-plan.md` (D-1..D-4, §4.2/§4.3/§4.4), `ba/00-lean-spec.md` (BR-024-01..12, VAL-024-01..06, AC-024-01..10), `qa/07-qa-report-w1.md` + `qa/07-qa-report-w2.md` (TC-01..16)
- **Implementation under review:** `frontend/src/components/AppLayout.tsx` (only production file changed by this module)

## 1. Verdict

**PASS** — no blocking finding survives reproduction. The implementation matches the design contract on all five review dimensions. All three QA wave-2 verifier claims were independently re-run and confirmed. Findings below are observations (Minor/Info), none of which requires a code change.

## 2. Verification evidence (executed this session)

| # | Command | Exit | Result |
|---|---|---|---|
| V-1 | `npx tsc --noEmit` (cwd `frontend/`) | 0 | `TSC_EXIT=0`, no output (0 errors) |
| V-2 | `npx vitest run` (cwd `frontend/`, vitest 4.1.11) | 0 | `Test Files 5 passed (5)` · `Tests 46 passed (46)` — registrationService 2, userService 9, vtsSystemService 19, authStore 7, permissionStore 9; stderr = 2 lines of intentional negative-test console.error |
| V-3 | `mvn compile -DskipTests` (workspace root, Maven 3.9.16 at `C:\my-tools\apache-maven-3.9.16\bin\mvn.cmd`) | 0 | `BUILD SUCCESS` (2.568s); only warning: itext7-core relocation |
| S-1 | `git status --porcelain; git diff --stat` | 0 | Scope proof (see §6) |
| G-1 | `git diff -- frontend/src/components/AppLayout.tsx` | 0 | Full diff inspected; added lines carry no hex/rgb literals; `#12468C` absent from diff (pre-existing line untouched) |

QA wave-2 claims (V-1/V-2/V-3 in `qa/07-qa-report-w2.md`) are **plausible and now independently reproduced**.

## 3. Findings

### 3.1 No blocking findings

Every review dimension checks out against the design contract with file:line anchors (below). No correctness, security, data-integrity, or contract defect was found in the change.

### 3.2 Observations (non-blocking)

- **OBS-1 (Minor — product decision, not a defect):** The working screen `Quy hoạch bến cảng` (`/documents/port-planning`, guard `document:read` at `App.tsx:238`) is no longer reachable from the sidebar — the old tree's `Văn bản & Sự cố` group listed it (`ba/00-lean-spec.md:52`, §2.2 item 7); the new group VI renders `planning-placeholder` disabled instead (`AppLayout.tsx:494`). This is **by-design**: the approved target tree (`ba/00-lean-spec.md:58-70` D8; `design/00-design-plan.md` §4.2) derives from the xlsx and does not include it; the route, the screen, and the inert map entry `/documents/port-planning: document:read` (`AppLayout.tsx:82`) are all retained, so deep links still work. Flagged because `D-3` used the "Bảo tồn Code — don't orphan a working screen" rationale to keep `/water-zone` as a utility (`design/00-design-plan.md` §3 D-3); PMO should confirm the port-planning screen's menu absence is intended (same class of decision).
- **OBS-2 (Info):** Inert `MENU_PERMISSION_MAP` entries remain divergent from `App.tsx` guards: `/history: admin:view` vs guard `data:read` (`App.tsx:183`), `/gis/permits: map:manage` vs guard `data:read` (`App.tsx:162`). Pre-existing lines, unchanged by this diff; **no menu item references either key** (verified by full tree read, `AppLayout.tsx:249-522`) → no visible-item-but-403 mismatch possible. Design explicitly permits ("Do not remove entries for hidden routes … inert or reused", WO-FE-2).
- **OBS-3 (Info):** TC-14 (deep-link 403 runtime probe) not executed (no browser). The guard mechanism is pre-existing and unchanged (`PermissionGuard` + `App.tsx` routes untouched), so risk is minimal; an e2e probe is recommended when a browser environment exists (as QA already noted).
- **OBS-4 (Info):** `Phao tiêu` reaches DOM depth 5 (`group-kcht → port-tree → nav-channel-parent → buoy-station-parent → /buoys`) because of the `Quản lý cảng biển` wrapper (`AppLayout.tsx:254`). Matches design §4.2 (SA-chốt); VAL-024-03's depth ≤ 4 is the semantic xlsx depth. QA TC-15 documented the same.
- **OBS-5 (Info):** The working tree carries unrelated concurrent changes (M-003 navigation-channel: `NavigationChannelService.java`, `NavigationChannelList.tsx`, `navigationChannel.ts`, plus M-003 doc churn). These are **not** part of M-024's diff and were not reviewed here.
- **OBS-6 (Info):** `src/test/java/com/hanghai/kchtg/m024/MenuPermissionCoverageTest.java` (new, WO-BE-1 verification artifact / INC-039 subject) is test-only; no production code added — consistent with "no new entity/schema/endpoint".

## 4. Dimension 1 — Correctness vs design

| Contract | Implementation evidence | Result |
|---|---|---|
| Exactly 6 Dashboard blocks, D-2 mapping (I, II, IV, V, VI, VII) | `DASHBOARD_BLOCKS` 6 entries at `AppLayout.tsx:96-102`: `/port`(port:read), `/asset/inventory`(inventoryasset:manage), `/reports`(report:read), `/users`(user:read), `/documents/legal`(document:read), `/connections`(connection:read) — identical to D-2 block table (`design/00-design-plan.md` §3 D-2) | PASS |
| Grid renders only on `/` above `<Outlet/>`, always 6 blocks | `AppLayout.tsx:885` (`location.pathname === '/'`), `:894` map over all 6, no permission filter (AC-024-01 count oracle; BR-024-12) | PASS |
| Sidebar = 7 groups I–VII, exact xlsx labels | `group-kcht` `AppLayout.tsx:249`, `group-asset` `:333`, `group-approval` `:350`, `group-reports` `:372`, `group-users` `:481`, `group-planning` `:492`, `group-integration` `:510`; headers render unconditionally (AC-024-03) | PASS |
| 13 Cảng-biển entities, hierarchy per BR-024-03 | Tree at `AppLayout.tsx:254-298`: Cảng biển `/port` → Bến cảng `berth-parent` → Cầu cảng `/pier`; Luồng hàng hải `nav-channel-parent` → {Bến phao, Đèn biển `/beacon-stations`, Đê/kè `/dike-revetment`, Nhà trạm phao/tiêu → Phao tiêu `/buoys`}; {Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão, CS sửa chữa/đóng tàu `/ship-repair-facility`}. Counted = **13** (AC-024-02) | PASS |
| 4 disabled 'Chưa triển khai' placeholders, non-route keys (D-1) | `mooring-buoy-placeholder` `AppLayout.tsx:278`, `anchorage-area-placeholder` `:293`, `transshipment-area-placeholder` `:294`, `storm-shelter-area-placeholder` `:295` — all `disabled: true, title: 'Chưa triển khai'`, English non-route keys; `handleMenuClick` navigates only `/`-prefixed keys (`AppLayout.tsx:553-557`); no map entry for them; no route in `App.tsx` | PASS |
| MENU_PERMISSION_MAP: 5 divergence fixes + 4 /asset/* additions = guard parity | `/beacon-stations: beaconstation:read` `:65` = `App.tsx:179`; `/buoys: buoy:read` `:66` = `App.tsx:182`; `/buoy-station: buoystation:read` `:67` = `App.tsx:241`; `/water-zone: waterzone:read` `:73` = `App.tsx:198`; `/symbols: data:read` `:90` = `App.tsx:248`; `/asset/increase: assetincrease:manage` `:74` = `App.tsx:230`; `/asset/decrease: assetdecrease:manage` `:75` = `App.tsx:231`; `/asset/inventory: inventoryasset:manage` `:76` = `App.tsx:232`; `/asset/exploitation: assetexploitation:manage` `:77` = `App.tsx:233`. All "keep" entries also re-verified against the guard grep (e.g. `/reports` `:78` = `App.tsx:174`, `/connections` = `App.tsx:165`, `/interconnect` = `App.tsx:171`) | PASS |
| Navigation sync (WO-FE-3) | `selectedKey`/`openKeys` effect rewritten to new branch keys only (`AppLayout.tsx:210-241`: `group-kcht`, `port-tree`, `berth-parent`, `nav-channel-parent`, `buoy-station-parent`, `vts-parent`, `vts-ops-center`, `group-planning`, `group-asset`, `group-reports`+report subkeys, `group-users`, `group-integration`); block click navigates + syncs (`:900-903`) | PASS |
| Static menu, no `/api/menu`, no `menu_item` table (§6/§7) | grep `menu:view\|api/menu\|menu_item` in `src/main/java` and `frontend/src` = **0 matches** | PASS |

## 5. Dimension 2 — UI conventions

- **Tokens/presets only in NEW code:** the grid render uses `cardStyle`, `spaceLg`, `spaceMd`, `fontSizeXl`, `fontSizeMd`, `fontWeightBold`, `textPrimary`, `shadowSm`, `shadowMd` (imported at `AppLayout.tsx:38-46`, used at `:886-908`); `gridTemplateColumns: repeat(auto-fill, minmax(280px, 1fr))` is a layout value (allowed). The menu tree (`:249-522`) carries **no style props at all** (pure config: key/label/icon/disabled/title/onTitleClick/className).
- **No hardcoded hex/spacing/font-size in added lines:** verified against the raw diff (G-1) — every added line is token-based; the pre-existing `#12468C`/`#f0f0f0`/`rgba(...)` literals in the sidebar-header/topbar/iframe chrome are **absent from the diff** (search on diff payload = no match), i.e. untouched pre-existing code, not new.
- **Naming:** English keys/routes (`-placeholder` suffix, no transliterated Vietnamese); Vietnamese labels with diacritics throughout (e.g. `AppLayout.tsx:251`, `:334`, `:373`); no new tokens added (WO-FE-4 constraint respected).
- **Accessibility bonus:** grid blocks carry `role="button"`, `tabIndex={0}`, `aria-label`, and Enter/Space `onKeyDown` handlers (`AppLayout.tsx:896-907`).

## 6. Dimension 3 — Security

- **No new permission:** `menu:view` appears nowhere (grep = 0 in `PermissionSeeder.java` and `frontend/src`); `PermissionSeeder.java` has **zero diff** (git status clean for it) — D-4 respected.
- **Gating parity:** every gated leaf is wrapped in `canAccessMenu(route)` (`AppLayout.tsx:260`, `:279`, `:288`, `:297`, `:307`, `:313`, `:322-323`, `:337-340`, `:501-509`, `:519-522`); `canAccessMenu` (`:105-113`) resolves `MENU_PERMISSION_MAP[path]` — map values equal the `App.tsx` route-guard permissions (§4), so **menu visible ⇔ route allowed**. No map value is broader than its guard.
- **No client-side trust gap:** the dashboard blocks are intentionally not permission-filtered (always 6, AC-024-01 oracle); unauthorized clicks are stopped by the pre-existing route guards (BR-024-12), and deep-link protection (`PermissionGuard`) is unchanged (`App.tsx` untouched — no diff).
- `authStore.ts` / `permissionStore.ts`: **zero diff** — the JWT→permission flow (`parseJwt`, `login`, `replaceAccessToken`, `normalizePermissionKey`, `hasPermissionFromList` bypass `*`/`admin:all`/`resource:manage`/`resource:*`/`resource:write`) is untouched and covered by `permissionStore.test.ts` (9/9) and `authStore.test.ts` (7/7).

## 7. Dimension 4 — Scope

- M-024's own diff is confined to **`frontend/src/components/AppLayout.tsx`** (430 lines: menu tree rebuild + map alignment + `DASHBOARD_BLOCKS` + grid render + openKeys effect) plus module documentation and the WO-BE-1 verification test (`src/test/java/com/hanghai/kchtg/m024/MenuPermissionCoverageTest.java`, test-only).
- **No diff** on `authStore.ts`, `permissionStore.ts`, `PermissionSeeder.java`, `App.tsx`, `Home.tsx`, `theme.ts`, `tokens.ts` (verified via `git status --porcelain`).
- **No new entity, table, migration, endpoint, or route:** no `src/main/resources/db/migration` change, no new controller/service (BR-024-11, §7 "no table").
- Unrelated working-tree modifications (M-003 navigation-channel sources, M-003 doc churn) are concurrent workstream residue, not part of this change.

## 8. Dimension 5 — QA wave-2 claim verification

QA's three claims in `qa/07-qa-report-w2.md` (V-1 tsc exit 0, V-2 vitest 46/46, V-3 mvn compile exit 0) were **re-run and reproduced** this session (see §2 table). The TC-01..16 evidence anchors were spot-checked against the current file (grep: `DASHBOARD_BLOCKS` `:96`, placeholders `:278/:293/:294/:295`, map entries `:65-77/:90`, `canAccessMenu` `:105`, `filterEmptyChildren` `:525`, `handleMenuClick` `:553`, grid `:885`) — all consistent with QA's citations. TC-14 remains the only non-executed TC (runtime/browser), correctly reported as NOT EXECUTED rather than PASS by QA — honest reporting, no gate claim overreach.

## 9. Knowledge audit (reviewer duty)

This run's committed knowledge contributions (2 facts, kind `gotcha`/`pattern`, topics `review-tool-output-externalization`, `m024-inert-menu-map-entries`): accurate (verified against this session's behavior), attributed, non-duplicative, and load-bearing for the next M-024/review run. No junk or missing contribution identified in this module's committed memory.

## 10. Inspected scope / untested edges

- **Inspected:** full `AppLayout.tsx` (934 lines), full diff, `MENU_PERMISSION_MAP` vs all `App.tsx` route guards (75 guard lines), design plan (386 lines), lean-spec BR/VAL/AC, QA w1/w2 TC tables, git working-tree scope.
- **Not executed (environment limits):** runtime browser probes — TC-14 deep-link 403, actual menu click behavior, responsive grid rendering. These rely on unchanged pre-existing mechanisms (`PermissionGuard`, react-router); recommended as e2e follow-up, not a gate blocker.
- **Source inputs:** `docs/inputs/photo_2026-07-09_15-47-20.jpg` read as base64 JPEG — visual content not extractable with available tooling (same limitation the design plan recorded); D-2 mapping was verified against the design contract instead. `logo-vinamarine_1_1.png` is a brand asset outside the edit scope.
- No source file was modified during this review (read-only seat).
