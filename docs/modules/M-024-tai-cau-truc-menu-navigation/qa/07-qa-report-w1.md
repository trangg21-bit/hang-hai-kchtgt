# M-024 QA Report — Wave 1: Acceptance Authoring (v2 AC-024)

| Field | Value |
|---|---|
| Module | M-024 — Tái cấu trúc Menu & Navigation |
| Feature | F-292 (module single feature) |
| Stage / wave | engineering-qa-engineer — wave 1 (acceptance authoring) |
| Date | 2026-09-04 |
| Source of truth | `ba/00-lean-spec.md` §8 AC-024-01..09 (lines 96–108), §3.1–3.2 (lines 33–50) — v2 model chốt 2026-09-04 |
| Previous oracle | `qa/acceptance-map.json` dated 2026-08-28 (OLD sidebar-7-groups model) — **replaced** |
| Companion artifact | `qa/acceptance-map.json` (refreshed, same folder) |
| Naming convention | EN for code identifiers/keys (`NAV_GROUPS`, `kcht-vienthong`, `/dai-ttdh`); VN diacritics for UI labels ('Quản lý KCHT hàng hải', 'Đài viễn thông hàng hải') |
| Battery executed this wave | **None — wave 1 authors the oracle only; wave 2 executes** |

## 1. Model refresh notice

The previous acceptance oracle (2026-08-28) graded the OLD menu model: sidebar 7 first-level
groups (I–VII per `HH_Menu_21-08-2026.xlsx`), a dedicated **PHÊ DUYỆT** group, 13 KCHT entities,
and search/filter helpers (`filterMenuByQuery`, `collectOpenableKeys`, AC-1..A13/B1-B5/C1-C3).
Per the v2 lean-spec (SUPERSEDED banner + §3), that model is history only. The code source of truth
is now `frontend/src/config/navigation.tsx` (MENU-MODEL v2, dashboard-first). This report and the
refreshed `qa/acceptance-map.json` grade **AC-024-01..09 only**; every old map entry is dropped.

## 2. Evidence inspected (primary sources, this session)

| Seam | Anchor (line) | Role |
|---|---|---|
| `ba/00-lean-spec.md` | §8 lines 96–108 | AC-024-01..09 criteria (source of truth) |
| `frontend/src/config/navigation.tsx` | 31 (GroupId union of 6), 76 (kchtTree), 125 (Hệ thống VTS root), 145 (kcht-vienthong root), 149 (/dai-ttdh), 150 (vhf-disabled), 161–213 (NAV_GROUPS 6 blocks), 212 (/dashboard in report block), 256 (groupOfPath), 277 (accessibleTree), 312 (locateRoute), 332 (collectRoutes) | Code under test / oracle ground |
| `frontend/src/pages/HomeLanding.tsx` | 24–29 (canAccessRoute), 32, 58 (NAV_GROUPS.map), 67 (aria-label + disabled) | AC-01/02 render seam |
| `frontend/src/components/AppLayout.tsx` | 642 (title 'Về trang chủ'), ~689 (landing hint) | AC-02 sidebar seam |
| `frontend/src/App.tsx` | 145 ('/' → HomeLanding), 146 ('/dashboard' → HomePage), 204 (/port), 222 (/dai-ttdh) | Route registration seam (AC-06/08/09) |
| `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` | 1 (title 28 loại), mermaid §1, numbered matrix rows (1..28) | External oracle for AC-03 (28 types + chains) |
| `frontend/e2e/integration/menu-permissions.spec.ts` | T2 (line 37), T3 (55), T4 (72), T5 (85) | Existing browser oracles (blocked locally — §4) |
| `frontend/playwright.config.ts` | baseURL http://localhost:3001; webServer = `npm run dev` only | Local-runnability evidence |

## 3. Coverage map — AC-024-01..09 → runnable oracle

Every oracle is observable and non-tautological (expected values come from the spec/§3.1 labels,
the external matrix doc, or negative assertions — never from the code under test re-deriving itself).

| AC | Criterion (VN label, §8) | Oracle (observable check) | Execution seam | Locally runnable (wave 2) |
|---|---|---|---|---|
| AC-024-01 | `/` render đúng 6 card khối (label + mô tả + icon), click vào khối tương ứng | `NAV_GROUPS.length === 6`; GroupId union exactly `kcht\|asset\|plan\|gis\|report\|admin`; 6 VN labels per §3.1 with desc+icon on cards; click → `firstAccessibleRoute`; disabled card when no route permitted | unit on navigation.tsx:31,161 + render seam HomeLanding.tsx:58,67; e2e T2 | unit: yes; e2e T2: no (env) |
| AC-024-02 | Sidebar theo khối: landing không liệt kê nhóm; trong khối hiện cây khối + nút "Về trang chủ" | `groupOfPath('/') === undefined` → hint text + **0** `.ant-menu` on `/`; `groupOfPath('/port') → kcht` tree shown; `groupOfPath('/users') → admin`; title 'Về trang chủ' button returns to `/` | unit groupOfPath (navigation.tsx:256); e2e T3 | unit: yes; e2e T3: no (env) |
| AC-024-03 | Cây kcht đủ 28 loại theo ma trận cha–con | kchtTree type-node set **= 28 types** of the external matrix doc; every matrix chain present (spot: Cảng biển→Bến cảng→Cầu cảng; Cảng biển→Luồng hàng hải→Bến phao; VTS→TTĐH VTS→Trạm Radar); ≥1 depth-3 chain (multi-layer, not flat) | static/unit comparison vs `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`; e2e T4 spot | unit: yes (wave-2 test materialization); e2e T4: no (env) |
| AC-024-04 | Nhánh "Đài viễn thông hàng hải" root riêng; VHF disabled không navigate | root `kcht-vienthong` (label 'Đài viễn thông hàng hải') **at depth 1, sibling of Hệ thống VTS**; chain of `/dai-ttdh` excludes kcht-vts root; VHF `disabled:true`, **no route**, note present; UI `.ant-menu-item-disabled`, click leaves URL unchanged | unit tree shape (navigation.tsx:125,145,149,150); e2e T4/T5 | unit: yes; e2e T4/T5: no (env) |
| AC-024-05 | User thiếu quyền → node ẩn; submenu hết con khả dụng → ẩn nhánh | `accessibleTree` removes denied-route nodes; parent with 0 surviving children pruned; disabled (VHF) not permission-gated; output key-set ⊆ input; input not mutated | unit accessibleTree (navigation.tsx:277) w/ fake permission sets; **e2e restricted-user case absent → gap** | unit: yes |
| AC-024-06 | Click node lá navigate đúng; selected/openKeys đồng bộ | `locateRoute` returns node key===route + ancestor openKeys; Menu selectedKeys/openKeys sync after nav; leaf click navigates (URL change, screen mounts); disabled node never navigates | unit locateRoute (navigation.tsx:312); e2e click smoke T4/T5 (partial); full per-leaf sweep = manual | unit: yes; browser sweep: no (env) |
| AC-024-07 | Không còn nhóm PHÊ DUYỆT trong menu | no group id `approval`/`phe-duyet`; no node label matches `/PHÊ DUYỆT\|Duyệt cấp/i` across navigation.tsx; browser full-menu scan count 0 | static grep/unit (negative); e2e T3 count-0 | grep/unit: yes; e2e T3: no (env) |
| AC-024-08 | `/dashboard` truy cập được (Dashboard KPI) | route `/dashboard` → HomePage (App.tsx:146); report tree node key `/dashboard` (navigation.tsx:212); browser render of KPI page — **no existing e2e visits /dashboard → gap** | static/unit route+tree membership; manual smoke or new e2e step | static/unit: yes; render: manual/new e2e |
| AC-024-09 | Deep-link `/port`, `/dai-ttdh` suy đúng khối + mở đúng nhánh | `groupOfPath('/port').id === 'kcht'`; direct open keeps URL, correct block + branch open (openKeys = ancestor chain), child visible/selected | unit groupOfPath/locateRoute; e2e T4 deep-link | unit: yes; e2e T4: no (env) |

Negative/boundary coverage: disabled-card state (AC-01), `.ant-menu` count 0 on landing (AC-02),
count ≠ 28 fails (AC-03), VHF-click no-navigate + root-membership exclusion (AC-04),
full-subtree pruning + subset invariant (AC-05), no stale selection + disabled click (AC-06),
PHÊ DUYỆT count 0 (AC-07), blank page fails (AC-08), wrong-block/ambiguous deep link (AC-09).

## 4. e2e local-run blocker (recorded per brief)

`frontend/e2e/integration/menu-permissions.spec.ts` **cannot run locally**: it is a Playwright
browser suite that logs in as admin (admin/admin123) against `http://localhost:3001`
(spec BASE_URL + playwright.config.ts) — i.e. it needs **both** a live Spring Boot backend
(auth + API + data) **and** the vite dev server. The config `webServer` starts only the vite
dev server (`npm run dev`); the backend is never started by an agent (project rule) and is not
available in this pipeline. e2e T2–T5 remain the designated browser oracles for
AC-01/02/03/04/06/07/09 and must run in a staged environment at wave 2 / UAT.
The unit/static oracles above are the locally executable wave-2 path.

## 5. Wave-2 readiness (what the next wave must run)

1. Execute the unit/static oracles: NAV_GROUPS shape (6 ids/labels), `groupOfPath` (3 cases),
   tree-vs-matrix 28-type + 3 chain samples, `accessibleTree` permission cases (allow/deny leaf,
   subtree prune, disabled-node retention, subset invariant), `locateRoute` openKeys chains,
   negative PHÊ DUYỆT scan, `/dashboard` route+tree membership.
2. Materialize a focused vitest file at `frontend/src/config/navigation.test.ts` (or extend
   `AppLayout.test.tsx`) holding the assertions above; run via vitest with exact file target.
3. e2e (staged env only): T2 (AC-01), T3 (AC-02/07), T4 (AC-03/04/09), T5 (AC-04/06).
4. Coverage gaps to close in wave 2: AC-05 browser restricted-user login case; AC-08 `/dashboard`
   render case (new e2e step or manual smoke with recorded evidence).
5. Do NOT weaken assertions to reach green; a failing oracle is a finding with evidence.

## 6. Delivered artifacts

- `docs/modules/M-024-tai-cau-truc-menu-navigation/qa/07-qa-report-w1.md` (this report)
- `docs/modules/M-024-tai-cau-truc-menu-navigation/qa/acceptance-map.json` (refreshed: model v2,
  AC-024-01..09, per-AC oracle/seam/runner; criteria pass_state finalized to `pass` by the wave-2 execution — see `qa/07-qa-report-w2.md`; old 2026-08-28 entries superseded)
