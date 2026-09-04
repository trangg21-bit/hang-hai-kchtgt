---
stage: engineering-code-reviewer
module: M-024
feature: F-292
triage: TRI-1788409709741-75fa
do-t: 5
reviewed: 2026-09-03
scope: frontend/src/App.tsx, frontend/src/components/AppLayout.tsx, frontend/src/pages/Home.tsx, frontend/src/pages/kcht-directory/KchtDirectoryPage.tsx
verdict: Pass
---

# M-024 Đợt 5 — Code Review: mô hình 2 màn hình (6 khối → `/kcht-directory` 28 loại KCHT)

> Review seat reads the change against `ba/00-lean-spec.md` AC-024-01..16, `design/00-design-plan.md` §8 (5
> quyết định), `design/wireframe-menu-khoi.md`, `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`, and weighs
> `qa/07-qa-report-w2.md` OBS-1/2/5/8. All 4 files read in full this session; typecheck re-run on record
> (exit 0). No code modified (read-only scope).

## 1. Verification run on record

| Gate | Command | Result |
|---|---|---|
| Typecheck (GATE-1) | `npx --no-install tsc --noEmit` (cwd `frontend/`) | **exit 0, no output** — reproduced by reviewer 2026-09-03 |
| Hex scan | grep `#[0-9A-Fa-f]{3,8}\b` on `Home.tsx`, `KchtDirectoryPage.tsx` | **0 matches** (reviewer run) |
| Hex scan | same pattern on `AppLayout.tsx` | 12 matches, **all at lines ≥ 436** (chrome) — none in menu/gating region (≤ ~401) |
| Hierarchy | grep `level: 'C[0-3]'` on `KchtDirectoryPage.tsx` | **exactly 28 matches** (reviewer run, lines 75–144) |

## 2. Per-file judgement

### 2.1 `frontend/src/App.tsx` — **PASS (no findings)**

- `HomePage` lazy `:45`; `KchtDirectoryPage` lazy `:46`.
- Landing: `<Route path="/" element={<HomePage />} />` `:145` inside the shared `<Route element={<AppLayout />}>` branch → the first screen after login is the 6-block "Danh mục chức năng" (catch-all `UnknownRouteRedirect` sends authenticated users to `'/'` — `:325`). ✓ AC-024-01 seam.
- `<Route path="/kcht-directory" element={<KchtDirectoryPage />} />` `:148` — no `PermissionGuard` wrapper: correct by design, the page aggregates 28 different permissions and gates per node.
- **Route/guard parity verified for every navigable directory key**: `/port`, `/berth`, `/pier`, `/navigation-channel`, `/buoy-berth`, `/buoys`, `/beacon-stations`, `/dike-revetment`, `/anchorage`, `/transfer-area`, `/storm-shelter`, `/ship-repair-facility`, `/vts-system`, `/vts-operation-center`, `/radar-station`, `/ais-system`, `/cctv`, `/scada`, `/transmission`, `/vts-assist`, `/dry-port`, `/dai-ttdh`, `/station/inmarsat|cospas-sarsat|lrit|hanoi` are all registered with a `PermissionGuard` whose permission string/array equals the directory's `ROUTE_PERMISSIONS` entry (spot-checked `:232` water-zone, `:281-284` asset, `:299` `/station/hanoi`, `:302` symbols). No leaf navigates to an unregistered route. ✓ AC-024-07 (no fake-route navigation).
- No hex/spacing/font-size literals, no filter-bar components on the two routes. ✓ AC-024-08/14.

### 2.2 `frontend/src/pages/Home.tsx` — **PASS** (D1 raised below, resolved in đợt-5 fix — §7)

- `BLOCKS` `:44–85` = exactly 6 entries, correct names and order matching AC-024-01 / design §8.1: kcht `:47`, asset `:54`, planning `:61`, approval `:68`, reports `:75`, admin `:82`.
- Block 1 route `'/kcht-directory'` `:49` → navigates to screen 2. ✓ AC-024-02 seam.
- Heading "Danh mục chức năng" `:157`; render `Row gutter` + `BLOCKS.map` → `<button onClick={() => navigate(block.route)}>` `:164–176`; no `usePermissionStore` import (see O2).
- No Input/Select/DatePicker/RangePicker anywhere — no filter bar. ✓ AC-024-14.
- All colors/spacing/fonts via `themetokenchk` tokens (`surfaceCard`, `actionPrimary`, `fontSizeLg/Md`, `spaceSm/Md/Lg/Xl`, `radiusLg/Xl`, `fontWeightBold`, `shadowMd`); only layout numbers (`width/height: 56`, `lineHeight: 1.5`, `margin: 0`). Reviewer hex grep = 0. ✓ AC-024-08.
- **D1 (defect, see §3):** block 4 "Phê duyệt" has `route: '/'` `:70` → `navigate('/')` from the `'/'` page is a no-op self-loop; no user feedback, no screen, while the sibling navigation surface renders the same function `disabled: true, title: 'Chưa triển khai'` (`AppLayout.tsx:254`). AC-024-01 asserts each block is navigable but the model defines no Phê duyệt target — spec row and code jointly unsatisfiable as written.

### 2.3 `frontend/src/pages/kcht-directory/KchtDirectoryPage.tsx` — **PASS (observations O3, O4)**

- `KCHT_TREE` `:71–145`; reviewer grep `level: 'C[0-3]'` = **28 nodes** (75, 81–82, 87, 89, 93–94, 96–97, 100–103, 109, 115, 117–122, 127, 134, 138, 141–144). Hierarchy matches AC-024-15 / design §8.2 / SO-DO chains exactly:
  - Cảng biển C0 `:75` → Bến cảng C1 `:81` → Cầu cảng C2 `:82`; → Luồng hàng hải C1 `:87` → Bến phao C2 `:89`, Nhà trạm QLVH phao tiêu C2 `:93` → Phao, tiêu C3 `:94`, Đèn biển & nhà trạm C2 `:96`, Đê chắn sóng… C2 `:97`; → Khu neo đậu/chuyển tải/tránh-trú bão/Cơ sở SCĐT C1 `:100–103`.
  - Hệ thống VTS C0 `:109` → TTĐH VTS C1 `:115` → 6 hệ thống C2 `:117–122`; Cảng cạn C0 `:127`.
  - Nhóm "Đài viễn thông hàng hải" (không level) `note: 'gắn lỏng'` `:131` → 6 đài/hệ thống C1 `:134–144`.
  - 28 types non-duplicate (unique keys). ✓ AC-024-02/15/16. Old 7-groups/13-entity sidebar model absent. ✓ AC-024-16.
- Gating: `ROUTE_PERMISSIONS` `:150–172`; `checkRouteAccess` via `hasPermission`/`hasAnyPermission` of `usePermissionStore` (permissionStore grants bypass only for `admin:all`/`*` per `permissionStore.ts` — anchors re-verified by QA wave-2); no-route leaf (Hệ thống VHF) `:139, 273–275` disabled + tooltip; leaf lacking permission → `disabled: true` + `<Tooltip NO_PERMISSION_NOTE>` (`NO_PERMISSION_NOTE` `:180`); submenu `onTitleClick` navigates only `if (route && checkRouteAccess(route))` `:287+`. ✓ AC-024-04/05/07.
- `DEFAULT_OPEN_KEYS` `:183–190` opens the 7 submenus so the full tree is visible on load.
- No filter bar: `ScreenHeader` breadcrumb + description + card containing `<Menu mode="inline">` only. ✓ AC-024-14.
- Token-only styling; `LevelBadge` uses `colors.sidebarBg` / `actionPrimary` + `${color}15/40` alpha suffixes, `radiusPill`, `'2px 10px'` — Pill Badge Standard. Reviewer hex grep = 0. ✓ AC-024-08.
- **O3:** display name `'Nhà trạm QLVH phao tiêu'` `:92` abbreviates the asserted string "Nhà trạm quản lý vận hành phao tiêu" (AC-024-15 `:283`, design §8.2). Cosmetic abbreviation, no functional impact.
- **O4:** the 6 telecom children carry a fixed `C1` badge while SO-DO marks them "Cấp 1–2" (gắn lỏng) and design/wireframe list them without levels. Informational simplification; harmless since the parent group node has no level badge.

### 2.4 `frontend/src/components/AppLayout.tsx` — **PASS (observations O1, O5, O6)**

- Top level of `rawMenuItems` `:215–381`: utility leaf `/` ("Danh mục chức năng") `:216` + **exactly 6 business groups** in block order — KCHT as a **single leaf** `/kcht-directory` with no children `:219` (old 13-entity tree removed; reviewer+QA grep of old entity keys = 0), asset-management `:223`, planning-operation `:236`, approval **disabled leaf** "Chưa triển khai" `:254`, reports-parent `:257`, system-admin `:368`. ✓ AC-024-03 (scoped reading, see O1).
- Gating: `MENU_PERMISSION_MAP` `:38–90`; `canAccessMenu` `:95–105` (delegates to `hasPermission`/`hasAnyPermission` — bypass only `admin:all`/`*` per `permissionStore.ts`, QA anchor verified); per-child conditional spreads `:227–230`/`:240–249`/`:372–377`; empty groups pruned by `filterEmptyChildren` `:106–128`, applied `:382`. ✓ AC-024-04/05 (sidebar facet).
- Nav sync: `selectedKey` collapses every KCHT/technical route segment into `/kcht-directory` `:168–198`; `openKeys` effect opens the correct parent group `:200–215`; `handleMenuClick` navigates only keys starting with `/` `:394–399`. ✓ AC-024-06.
- Sidebar search (đợt 2, retained): `filterMenuByQuery` trims+lowercases `:130–142`; restore on empty query `:384–387`. ✓ AC-024-11/12/13.
- Menu region contains no style objects with hex/font/size literals (reviewer hex scan: all 12 hits ≥ `:436`). ✓ AC-024-08 (menu scope).
- **O1 (QA OBS-1, weighed):** the reports group retains a nested 2-level folder tree (`reports-chung` `:263`, `reports-kcht` `:276`, … `reports-thtn` `:354`; leaves `F-141..F-189N`). This is the pre-existing report catalog the xlsx/lean-spec §2.2/2.3 D6 explicitly keep ("giữ nguyên cây báo cáo F-141..F-189") — NOT the removed KCHT-entity tree, and lean-spec §1 qualifies "KHÔNG còn submenu đa cấp sâu … như mô hình cũ … nhánh 13 thực thể KCHT". Under that scoped reading AC-024-03 holds (6 flat level-1 groups, KCHT single leaf). If BA intended every business group to be fully flat, AC-024-03/§1 need an explicit re-scope — owner decision, not a code defect of this change.
- **O5 (QA OBS-8, weighed):** chrome hex below the menu region — `:436`/`:444` (`color: '#273e7c'`, `fontWeight: 600`, `fontSize: '15px'` inside `isMenuFullScreen` branch), `:483`, `:507`, `:526`, `:565`, `:594`, `:610`, `:649`, `:667`, `:673`, `:677`. Pre-existing header/topbar code outside the menu redesign; `isMenuFullScreen` is hard-wired `false` (`:157`), so `:444` is dead at runtime. Maintenance note only — does not refute AC-024-08 (menu scope). QA anchor `:452` points into the same fullscreen-title block; actual literal is `:444`.
- **O6:** visibility-map vs route-guard drift (pre-existing rows): `MENU_PERMISSION_MAP` grants `'/asset/increase|decrease|inventory|exploitation': 'data:read'` `:63–66` while App.tsx guards them `assetincrease|decrease|inventoryasset|assetexploitation:manage` (`App.tsx:281–284`); `'/water-zone': 'waterarea:read'` `:56` vs guard `waterzone:read` (`App.tsx:232`); `'/symbols': 'map:manage'` `:89` vs guard `data:read` (`App.tsx:302`). A user with only `data:read` sees the asset items but every click bounces off the stricter guard; reverse drift hides `/symbols`. Guard is authoritative → no security exposure (BR-024-12); visibility inconsistency only. Cross-module (M-002) debt, pre-existing; recommend a follow-up work order to align map ↔ App guards.

## 3. Defects (blocking)

> **D1 RESOLVED** by the đợt-5 build-side fix + BA docs amendment — see §7. Historical record below.

### D1 — Block "Phê duyệt" on the landing is a dead self-loop (RESOLVED)
- **Anchor:** `Home.tsx:68–70` (`route: '/'` for `title: 'Phê duyệt'`) + `Home.tsx:170` (`onClick={() => navigate(block.route)}`).
- **Failure scenario:** any authenticated user on the post-login screen clicks the 4th tile "Phê duyệt" → `navigate('/')` from `'/'` performs no route change and shows no feedback; the tile advertises an entry into the Phê duyệt business group that does not exist anywhere in the app.
- **Evidence:** (a) tile route is `'/'` — the page it is already on; (b) the same function on the sibling surface is `disabled: true, title: 'Chưa triển khai'` (`AppLayout.tsx:254`), i.e., the change's own convention (BR-024-08 / AC-024-07: an item without a real screen must not behave as a navigable gateway) is applied to the sidebar but not to the tile; (c) no đợt-5 document defines a Phê duyệt target screen, so AC-024-01's unconditional "điều hướng được" cannot be satisfied by any implementation without a spec change. Dev handoff flagged this as an unresolved oracle ("QA wave-2 cần quyết định oracle"); QA wave-2 recorded it as OBS-5 but the oracle decision was never made.
- **Required correction (code):** mirror the sidebar pattern — render block 4 disabled with the Vietnamese tooltip "Chưa triển khai" (blocks stay 6, satisfying the count in AC-024-01); **and (docs):** BA amends AC-024-01 wording to exempt block 4 via the AC-024-07 convention, or the owner names a real approval route to point at. Owner: frontend-dev wave + BA (doc row).

## 4. Observations weighed (QA OBS-1/2/5/8) — dispositions

| # | Observation | Disposition |
|---|---|---|
| OBS-1 | reports-parent residual subfolders | Non-blocking (O1) — pre-existing catalog kept per spec; owner decision only if full flattening intended |
| OBS-2 | Home blocks not permission-gated | Non-blocking (O2) — design §8 decision 1 specifies a fixed 6-block list; AC-024-04's block-screen facet has no seam and contradicts AC-024-01; no unauthorized data reachable (guards downstream). Recommend BA re-scope AC-024-04 to sidebar+directory |
| OBS-5 | Block "Phê duyệt" route `'/'` self-loop | **Blocking — D1** (see §3): no-op affordance on the headline screen; unapproved placeholder choice |
| OBS-8 | AppLayout chrome hex (`:452`, actual `:444`) | Non-blocking (O5) — pre-existing, dead branch, outside menu region; maintenance |

## 5. AC-024-01..16 disposition (code as verified this session)

| AC | Verdict | Basis |
|---|---|---|
| 01 | PASS | 6 blocks exact `Home.tsx:46–88`; block 4 disabled + tooltip + no route (fix §7.2); AC-024-01 amended docs-side to exempt block 4 (§7.3) |
| 02 | PASS | block-1 route `:49` → route `App.tsx:148`; 28 types verified (2.3) |
| 03 | PASS | 6 flat level-1 groups + KCHT leaf `AppLayout.tsx:216/219`; scoped reading (O1) |
| 04 | PASS | sidebar per-item gating `:227–230`… + `filterEmptyChildren` `:382`; directory disabled+tooltip; block-screen facet = O2 (spec conflict, not code) |
| 05 | PASS | `canAccessMenu` delegation; store bypass `admin:all`/`*` only |
| 06 | PASS | selectedKey/openKeys collapse `:168–215`; `handleMenuClick` `:394–399` |
| 07 | PASS | disabled + tooltip `AppLayout.tsx:254`, `KchtDirectoryPage.tsx:139/180/273–275`; no fake-route navigation |
| 08 | PASS | English keys/routes, Vietnamese labels, 0 hex in Home/KchtDirectory (reviewer grep), menu region clean |
| 09 | PASS | typecheck re-run exit 0 (§1); mvn clause N/A (frontend-only triage) |
| 10 | PASS (vacuous) | D-4 = none; no `menu:` permission tokens in the 4 files |
| 11/12/13 | PASS | search retained `:130–142`, `:384–387`; no navigate/API from search |
| 14 | PASS | no filter bar on either screen (component inventory of both files) |
| 15 | PASS | chains match SO-DO/AC text node-for-node (2.3); O3 = display abbreviation |
| 16 | PASS | exactly 28 leveled nodes, no duplicates, C0–C3 |

## 6. Not covered

- Browser runtime (real click/hover/tooltip rendering) not executed — static + typecheck + unit-suite (QA GATE-2 18/18, suite survives) only.
- Full working-tree diff vs HEAD was **not runnable** under this dispatch's narrowed bash permissions (`git diff <paths>` refused) — change-delta claims rely on the dev implementation summary's per-file statements cross-checked against the spec, not on a mechanical diff.
- Backend (PermissionSeeder presence of `buoyberth:read`, `anchorage:read`, … newly referenced permissions) not verified — directory gates merely hide/disable; a user granted one of these keys with no matching DB seed row would still be blocked by route guards, so no security regression either way. Recommend QA/backend wave confirm seed rows for the 6 D-1 routes before release.

## 7. Re-review — đợt-5 D1 fix (re-dispatch attempt 2, 2026-09-03)

> Supersedes the §3 D1 verdict. **Verdict: Pass** — D1 resolved, no new blocking findings; AC-024-01..16 all PASS.

### 7.1 Typecheck re-run on record

| Gate | Command | Result |
|---|---|---|
| Typecheck (GATE-1) | `cd frontend && npx --no-install tsc --noEmit` | **exit 0, no output** — re-run by reviewer this session (2026-09-03) |

### 7.2 D1 resolution evidence — `frontend/src/pages/Home.tsx` block 4

- Block 4 "Phê duyệt" `Home.tsx:69–73`: `disabled: true` `:73`, **no `route` field** (interface keeps `route?` optional `:40`). Route-bearing blocks only: `:51` `/kcht-directory`, `:58` `/asset/inventory`, `:65` `/gis/map`, `:79` `/reports`, `:86` `/users`. The `route: '/'` self-loop (old `:70`) is gone — grep confirms zero `route` occurrences in the approval entry.
- Render seam `Home.tsx:167–180`: `<Tooltip title={block.disabled ? 'Chưa triển khai' : undefined}>` `:169`; disabled visual `cursor: 'not-allowed', opacity: 0.6, filter: 'saturate(0.5)'` `:174–176`; `disabled={block.disabled}` `:178`; `onClick={() => block.route && navigate(block.route)}` `:179` — a disabled block can never navigate. Mirrors the sidebar disabled leaf `AppLayout.tsx:253–254` (`disabled: true, title: 'Chưa triển khai'`), i.e. the change's own AC-024-07 / BR-024-08 convention.
- 6 blocks preserved: `BLOCKS` `Home.tsx:46–88` = kcht / asset / planning / approval / reports / admin → count 6 and order still satisfy AC-024-01.

### 7.3 Docs↔code consistency (amended AC-024-01)

- `ba/00-lean-spec.md:269` (AC-024-01): "riêng khối (4) 'Phê duyệt' hiển thị disabled + tooltip 'Chưa triển khai', KHÔNG navigate (BR-024-08 / AC-024-07)" — matches Home.tsx block 4 exactly.
- `feature-brief.md:37` (§1) and `:88` (AC-024-01) carry the identical exemption wording — consistent across lean-spec, feature-brief, and code. No đợt-5 doc asserts block 4 navigates; spec and code are now jointly satisfiable.

### 7.4 Re-verified holdings (untouched by the D1 fix — §5 dispositions still stand)

- `App.tsx:45–46` (lazy imports), `:145` `/` → HomePage, `:148` `/kcht-directory` → KchtDirectoryPage — re-grepped, unchanged.
- `AppLayout.tsx:219` KCHT single leaf `/kcht-directory`; `:253–254` approval disabled leaf — unchanged.
- `KchtDirectoryPage.tsx` — grep `level: 'C[0-3]'` re-run: 28 nodes (lines 75–144), unchanged; gating / `ROUTE_PERMISSIONS` / no-filter-bar holdings untouched by the fix.
- AC-024-01 upgraded from "PASS (except D1)" to full **PASS** (§5 table updated); AC-024-02..16 remain PASS per §5.

### 7.5 Not covered (unchanged from §6)

- Browser runtime tooltip rendering over a natively-disabled `<button>` not executed (static + typecheck only). Whether the hover tooltip visually triggers on a disabled button is browser-dependent; spec is satisfied at the DOM level (disabled attribute + antd Tooltip 'Chưa triển khai'). Cosmetic, non-blocking.
