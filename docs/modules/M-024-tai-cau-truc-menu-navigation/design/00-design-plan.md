# M-024 Tái cấu trúc Menu & Navigation — Design Plan (SA)

- **Module:** M-024 — Tái cấu trúc Menu & Navigation
- **Feature:** F-292 — Tái cấu trúc menu & điều hướng
- **Stage:** engineering-solution-designer
- **Inputs:** `ba/00-lean-spec.md` (UC-024-01..08, BR-024-01..12, VAL-024-01..06, AC-024-01..10, Decision Points D-1..D-4), `_features/F-292-tai-cau-truc-menu-navigation/feature-brief.md` (§6-7 BA proposals), `HH_Menu_21-08-2026.xlsx` (7 nhóm I–VII, cấp 2–4), `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` (ma trận cha–con), triage `TRI-1787631386205-0f2e.json` (4 edit-target files, done-oracle, verification commands).
- **Edit scope (triage):** `AppLayout.tsx`, `authStore.ts`, `permissionStore.ts`, `PermissionSeeder.java`. Everything else read-only.

---

## 1. Purpose

Decide HOW the approved lean-spec is implemented: a **static hierarchical sidebar** (7 nhóm cấp 1 per xlsx, nhánh "Quản lý cảng biển" = 13 thực thể KCHT theo ma trận cha–con) and a **Dashboard Grid đúng 6 khối** on the home route, gated by the existing dynamic permission model — with zero schema change, zero new business entity, zero new endpoint. This plan finalizes BA decision points D-1..D-4 and feature-brief §6-7, then splits the work into independently executable backend / frontend work orders with verification oracles.

---

## 2. Verified current seam (anchored evidence)

| Claim | Anchor | Evidence read this session |
|---|---|---|
| Menu permission map: route → `<resource>:<action>` | `AppLayout.tsx:43` | Object literal at line 43; entries incl. `'/buoys': 'data:read'`, `'/water-zone': 'waterarea:read'`, `'/symbols': 'map:manage'` |
| Menu item gate: missing map entry → visible | `AppLayout.tsx:84` | Function body: `const required = MENU_PERMISSION_MAP[path]; if (!required) return true;` |
| Static menu config (AntD items, Vietnamese labels) | `AppLayout.tsx:222` | `const rawMenuItems: MenuProps['items'] = [...]` — 7 top-level groups today, several block-commented |
| Empty-submenu pruner | `AppLayout.tsx:464` | `const filterEmptyChildren = ...` — drops empty children + redundant dividers |
| Built menu | `menuItems` (`AppLayout.tsx:488`) | assigned from the pruned raw tree |
| Click handler (navigates only `/`-prefixed keys) | `handleMenuClick` (`AppLayout.tsx:492`) | navigates `e.key` when it starts with `/` |
| Store imports + theme token import | `AppLayout.tsx:35`, `AppLayout.tsx:36`, `AppLayout.tsx:37` | `useAuthStore`, `usePermissionStore`, `layout` from `../theme` |
| Permission source from JWT | `parseJwt` (`authStore.ts:44`) | parses the JWT payload (incl. permissions) |
| Login applies permissions | `login` (`authStore.ts:81`) | copies the JWT permissions array into user state |
| Token renewal applies permissions | `replaceAccessToken` (`authStore.ts:111`) | refreshes user state on token renewal |
| Permission-key normalization (dot→colon) | `normalizePermissionKey` (`permissionStore.ts:19`) | dot-notation → `<resource>:<action>` |
| Permission check + bypass rules | `hasPermissionFromList` (`permissionStore.ts:55`) | bypass via `*` / `admin:all` / `resource:manage` / `resource:*` / `resource:write` |
| Granted-set build | `permissionStore.ts:64` | `.map((permission) => normalizePermissionKey(permission.trim()))` fills the Set |
| Store accessor | `hasPermission` (`permissionStore.ts:99`) | store method checking one key |
| Auto-sync on auth change | `useAuthStore.subscribe` (`permissionStore.ts:119`) | auth-change subscription |
| Seeder entry point | `run` (`PermissionSeeder.java:45`) | `run(String... args)` (CommandLineRunner) |
| Seed method | `seedPermission` (`PermissionSeeder.java:716`) | `seedPermission(Map, resource, action, name, description)` |
| Home route renders the KPI dashboard page | `App.tsx:128`, `App.tsx:43` | `<Route path="/" element={<HomePage />} />`; `const HomePage = lazy(() => import('./pages/Home'))` |
| Dashboard page is a KPI dashboard (no functional 6-block grid today) | `Home.tsx:304`, `Home.tsx:661` | `HomeDashboard` renders hero KPI + cards + charts + infra table; `export default function HomePage()` |
| Existing label→route map inside dashboard (maps Bến phao/Khu neo đậu/Khu chuyển tải → `/water-zone`) | `Home.tsx:130` | `KCHT_LABEL_ROUTES` |
| Route guards (authoritative per-route permission) | `App.tsx:186`, `App.tsx:190`, `App.tsx:192`, `App.tsx:196`, `App.tsx:198`, `App.tsx:205`, `App.tsx:210`, `App.tsx:215`, `App.tsx:220`, `App.tsx:225`, `App.tsx:179`, `App.tsx:182`, `App.tsx:241`, `App.tsx:244`, `App.tsx:245`, `App.tsx:165`, `App.tsx:171`, `App.tsx:174`, `App.tsx:230`, `App.tsx:231`, `App.tsx:232`, `App.tsx:233`, `App.tsx:236`, `App.tsx:248`, `App.tsx:251`, `App.tsx:254` | Full route list verified — see §4.4 |
| Seeded permission codes (all referenced by the target menu exist) | `PermissionSeeder.java:54`, `:66`, `:72`, `:83`, `:84`, `:90`, `:101`, `:108`, `:120`, `:131`, `:182`, `:199`, `:214`, `:229`, `:246`, `:260`, `:294`, `:314`, `:330`, `:370`, `:387`, `:414`, `:430`, `:446`, `:480`, `:490`, `:510`, `:514`, `:516`, `:518` | `seedPermission` calls for `user:read`, `orgunit:read`, `group:read`, `admin:manage`, `admin:view`, `map:manage`, `connection:read`, `data:read`, `report:read`, `document:read`, `port:read`, `berth:read`, `pier:read`, `dryport:read`, `waterzone:read`, `waterarea:read`, `navigationchannel:read`, `dikerevetment:read`, `shiprepair:read`, `radarstation:read`, `vts:read`, `beaconstation:read`, `buoystation:read`, `buoy:read`, `coastalstation:read`, `specialstation:read`, `inventoryasset:manage`, `assetdecrease:manage`, `assetincrease:manage`, `assetexploitation:manage` |
| Vite dev-mode re-export guard already applied to dashboard token layer | `tokens-dashboard.ts:6` | Comment: explicit import required — Vite dev does not resolve re-export bindings (import-then-export pattern) |

**Gap found (load-bearing):** `MENU_PERMISSION_MAP` values diverge from the route-guard permissions in `App.tsx` for 5 routes:

| Route | Map value (`AppLayout.tsx:43`) | Route guard (`App.tsx`) | Action |
|---|---|---|---|
| `/buoys` | `data:read` | `buoy:read` (`App.tsx:182`) | align map → `buoy:read` |
| `/beacon-stations` | `data:read` | `beaconstation:read` (`App.tsx:179`) | align map → `beaconstation:read` |
| `/buoy-station` | `data:read` | `buoystation:read` (`App.tsx:241`) | align map → `buoystation:read` |
| `/symbols` | `map:manage` | `data:read` (`App.tsx:248`) | align map → `data:read` |
| `/water-zone` | `waterarea:read` | `waterzone:read` (`App.tsx:198`) | align map → `waterzone:read` |

Leaving these divergent would let a user see a menu item but be blocked by the route guard (or vice versa) — the menu must mirror the guard so "menu hiển thị ⇔ route cho phép".

---

## 3. Decisions (D-1..D-4, §6-7)

### D-1 — 4 route-less entities: disabled placeholders (option a) — CONFIRMED

**Decision:** Bến phao, Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão render as **disabled AntD menu items with tooltip "Chưa triển khai"**, no route, no permission, no navigation. Keeps the "13 thực thể" node count (AC-024-02) and honors BR-024-08 ("cấm navigate route giả").

**Rejected:**
- (b) Omit the items — breaks the done-oracle (node count = 13) and the xlsx tree.
- (c) Add routes inside M-003 entity modules — outside M-024's 4-file edit scope, and would navigate to screens that do not exist (violates BR-024-08 / "Data thật, không gán mặc định").

**Implementation contract:** `disabled: true` + `title: 'Chưa triển khai'` on the AntD item; `key` is a **non-route English string** (so `handleMenuClick` at `AppLayout.tsx:492` cannot navigate it), e.g. `mooring-buoy-placeholder`, `anchorage-area-placeholder`, `transshipment-area-placeholder`, `storm-shelter-area-placeholder`. No entry in `MENU_PERMISSION_MAP` (BR-292-03: item chưa có màn hình → disabled, không gating). Placeholders are unconditional children (not wrapped in `canAccessMenu`) so the branch keeps its target shape for every user who can open it.

### D-2 — 6-khối Dashboard mapping: REVISED (I, II, IV, V, VI, VII)

**Decision:** 6 khối = **nhóm I, II, IV, V, VI, VII** — the six groups that have at least one implemented, navigable screen. **Nhóm III (PHÊ DUYỆT) has NO list screen** (no approval list route exists anywhere in `App.tsx:121`–`App.tsx:261`; the only approval routes are per-record detail actions like `App.tsx:187` `/port/:id/approve`), so it cannot supply a navigable block; it stays sidebar-only with disabled placeholder items. **Nhóm VII (TÍCH HỢP) gets a block** because it has real navigable screens (`App.tsx:165` `/connections`, `App.tsx:171` `/interconnect`).

**Why revised vs BA proposal (I–VI):** AC-024-01 requires *mỗi khối ... điều hướng được* (every block navigable). A PHÊ DUYỆT block would be a dead block. Swapping III → VII keeps exactly 6 navigable blocks. The mapping is a **single data-driven config** — `DASHBOARD_BLOCKS` (NEW, introduced by WO-FE-4; §4.3) — so if the target photo `docs/inputs/photo_2026-07-09_15-47-20.jpg` (unreadable this session — base64 only, see §9) dictates a different mapping, it is a one-config change, not a redesign.

**Block table (label tiếng Việt / target route / gate permission):**

| # | Khối (label) | Target route | Gate (route guard) |
|---|---|---|---|
| 1 | QUẢN LÝ KCHT HÀNG HẢI | `/port` | `port:read` |
| 2 | QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI | `/asset/inventory` | `inventoryasset:manage` |
| 3 | BÁO CÁO THỐNG KÊ | `/reports` | `report:read` |
| 4 | QUẢN LÝ NGƯỜI DÙNG | `/users` | `user:read` |
| 5 | QUẢN LÝ QUY HOẠCH & VẬN HÀNH | `/documents/legal` | `document:read` |
| 6 | TÍCH HỢP | `/connections` | `connection:read` |

**Grid behavior:** the grid always renders **exactly 6 blocks** for every logged-in user (AC-024-01 count oracle); unauthorized clicks are stopped by the existing route guards (`PermissionGuard` in `App.tsx`) — navigation security never depends on hiding UI (BR-024-12). Clicking a block navigates to its target; the sidebar syncs via the `selectedKey`/`openKeys` effect (WO-FE-3), satisfying UC-024-02.

**Placement:** the grid renders **inside `AppLayout.tsx` above the `<Outlet />` when `location.pathname === '/'`**. Home.tsx (the KPI dashboard) is NOT an edit target, so the grid is an AppLayout-owned layer on the home route, with the existing dashboard preserved below it. This is a deliberate scope-preserving deviation — flagged in §8. If PMO later approves editing `Home.tsx`, the grid component moves there unchanged.

### D-3 — utility items absent from xlsx: keep, outside the 7 groups

| Item | Decision | Gate |
|---|---|---|
| `Trang chủ` (`/`) | **Keep** — first sidebar utility item (already `AppLayout.tsx:223`) | none (every logged-in user) |
| `Cấu hình hệ thống` (`/settings`) | **Keep** — last sidebar utility item | `admin:manage` (matches `App.tsx:254`) |
| `Quản lý vùng nước` (`/water-zone`) | **Keep** — utility item at sidebar bottom, gated `waterzone:read` | `waterzone:read` (matches `App.tsx:198`) |

**Rationale for `/water-zone`:** it is a **real implemented screen** (`App.tsx:198`) not represented in the xlsx target tree (the xlsx splits the 3 Khu as separate items, all without screens — D-1). Hiding it entirely would orphan a working screen (violates "Bảo tồn Code"); placing it inside the 13-entity tree would break AC-024-02 (count = 13). Utility position keeps both invariants. The 3 Khu remain disabled placeholders inside the Cảng-biển tree.

### D-4 — permission model: NO new permission; reuse route-guard permissions

**Decision:** do **not** introduce `menu:view`. All 30 permission codes referenced by the target menu are already seeded (anchors in §2). Gating stays dynamic: JWT permissions → `permissionStore` → `canAccessMenu` (`AppLayout.tsx:84`); bypass only via `*` / `admin:all` / `resource:manage` / `resource:*` / `resource:write` — logic in `hasPermissionFromList` (`permissionStore.ts:55`), never `admin:manage` (BR-024-05).

**Consequence:** `PermissionSeeder.java` receives **no code change** in this module (see WO-BE-1 — verify-only). The only backend-adjacent work is the `MENU_PERMISSION_MAP` alignment in §2 (frontend).

### §6 — menu data source: STATIC (confirmed), route→permission map finalized

**Decision:** static menu in `AppLayout.tsx` (`rawMenuItems` + `MENU_PERMISSION_MAP`), gated client-side by JWT permissions. **Rejected: dynamic `/api/menu`.** Reasons: (1) BR-024-11 / constraint forbids new entities, tables, migrations — a dynamic menu requires a `menu_item` table and a new controller/service (feature-brief §7 proposal), which also exceeds the 4-file edit scope; (2) the menu is release-bound configuration, not runtime data; (3) the existing pattern (static config + dynamic gating) already delivers permission-correct menus with zero server round-trip. Finalized route→permission map in §4.4.

### §7 — table structure: NONE

**Decision:** no new DB table. The `menu_item` table sketched in feature-brief §7 is rejected (see §6 rationale). Menu structure lives as TypeScript config (§4.1) — no migration, no backfill, no `orgUnitId`/`@Filter`/`@DataScope` (BR-024-11).

---

## 4. Target architecture

### 4.1 Menu model (static TS config in AppLayout.tsx)

Extend the existing inline AntD items with a small typed helper so the tree stays declarative and verifiable:

```ts
type MenuNode = {
  key: string;                 // English; leaf keys start with '/' (route) or are non-route placeholders
  label: string;               // Vietnamese, diacritics
  route?: string;              // leaf only — must exist in App.tsx
  permission?: string | string[]; // resolved through canAccessMenu; absent => unconditional
  disabled?: boolean;          // true => 'Chưa triển khai' placeholder (BR-024-08)
  children?: MenuNode[];
};
```

Rules (VAL-024-01..06): unique `key` per level; depth ≤ 4 (group → level 4 per xlsx); leaf keys start with `/` only when the route exists; placeholder keys are English, non-route, suffixed `-placeholder`; labels Vietnamese; no hardcoded color/spacing/font-size anywhere in menu config (UI via `theme.ts`/`tokens.ts` only).

### 4.2 Target sidebar tree (7 nhóm cấp 1 + utilities)

Top-level order and labels EXACTLY per xlsx (BR-024-01). Group keys are English; labels Vietnamese. 7 group headers render unconditionally (AC-024-03); child real items gated via `canAccessMenu`; placeholder items unconditional; `filterEmptyChildren` (`AppLayout.tsx:464`) continues pruning nested submenus whose children are all filtered out (AC-024-04).

```text
Trang chủ /                     [utility, no gate]
— divider —
I. QUẢN LÝ KCHT HÀNG HẢI        key: group-kcht
   Quản lý cảng biển            key: port-tree (submenu, onTitleClick -> /port)
     Cảng biển                  /port              port:read
     Bến cảng                   key: berth-parent (submenu, onTitleClick -> /berth)
       Cầu cảng                 /pier              pier:read
     Luồng hàng hải             key: nav-channel-parent (submenu, onTitleClick -> /navigation-channel)
       Bến phao                 disabled placeholder mooring-buoy-placeholder
       Đèn biển + nhà trạm gắn đèn  /beacon-stations    beaconstation:read
       Đê/kè                    /dike-revetment    dikerevetment:read
       Nhà trạm phao/tiêu       key: buoy-station-parent (submenu, onTitleClick -> /buoy-station)
         Phao tiêu              /buoys             buoy:read
     Khu neo đậu                disabled placeholder anchorage-area-placeholder
     Khu chuyển tải             disabled placeholder transshipment-area-placeholder
     Khu tránh/trú bão          disabled placeholder storm-shelter-area-placeholder
     CS sửa chữa/đóng tàu       /ship-repair-facility   shiprepair:read
   Hệ thống VTS                 key: vts-parent (submenu, onTitleClick -> /vts-system)
     Thông tin hệ thống VTS     /vts-system        vts:read
     Trung tâm điều hành VTS    key: vts-ops-center
       Thông tin TT ĐHVTS       disabled placeholder vts-ops-info-placeholder
       Radar                    /radar-station     radarstation:read
       AIS / CCTV / SCADA / Truyền dẫn / Phụ trợ VTS / VHF   disabled placeholders
       Đài TT duyên hải         /station/coastal   coastalstation:read
       Inmarsat                 /station/special   specialstation:read
       Sarsat / LRIT / Trung tâm xử lý TT          disabled placeholders
   Thông tin cảng cạn           /dry-port          dryport:read
II. QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI   key: group-asset
   [xlsx tree levels 2-4; real leaves enabled, rest disabled placeholders]
     Yêu cầu tăng tài sản       /asset/increase    assetincrease:manage
     Yêu cầu giảm tài sản       /asset/decrease    assetdecrease:manage
     Kiểm kê tài sản            /asset/inventory   inventoryasset:manage
     Khai thác tài sản          /asset/exploitation  assetexploitation:manage
     (other xlsx nodes: Tài sản cảng biển, Tài sản bến cảng -> Tài sản cầu cảng,
      Tài sản bến phao, ..., Tài sản cảng cạn, Kiểm kê & Xử lý -> Đề nghị xử lý tài sản,
      Quản lý sản lượng cảng biển, Kiểm kê tài sản)  -> disabled placeholders
III. PHÊ DUYỆT                  key: group-approval
   [xlsx tree levels 2-4: Duyệt Bến cảng, Duyệt Cầu cảng, Duyệt Bến phao,
    Duyệt Khu tránh/trú bão, Duyệt Khu chuyển tải, Duyệt Khu neo đậu,
    Duyệt CS sửa chữa/đóng tàu, Duyệt Luồng hàng hải, Duyệt Đèn biển + nhà trạm gắn đèn,
    Duyệt Đê/kè, Nhà trạm quản lý phao/tiêu -> Duyệt Nhà trạm / Duyệt Phao tiêu,
    Hệ thống VTS -> Duyệt hệ thống VTS -> Trung tâm điều hành VTS -> (12 level-4),
    Duyệt cảng cạn, Duyệt sản lượng cảng biển]  -> ALL disabled placeholders (no screens)
IV. BÁO CÁO THỐNG KÊ            key: group-reports
   [restore the block-commented tree: /reports (Tất cả báo cáo, report:read) +
    groups F-141..F-189 keys '/reports/F-*' — routes exist via /reports/:code]
V. QUẢN LÝ NGƯỜI DÙNG           key: group-users
     Quản lý đơn vị             /organizations     orgunit:read
     Quản lý nhóm người dùng    /groups            group:read
     Quản lý người dùng         /users             user:read
     Quản lý log truy cập       /logs              admin:view
VI. QUẢN LÝ QUY HOẠCH & VẬN HÀNH  key: group-planning
     Quản lý quy hoạch          disabled placeholder planning-placeholder
     Quản lý thông tin vận hành khai thác   disabled placeholder
     Quản lý thông tin bảo trì  disabled placeholder
     Quản lý thông tin sự cố    /documents/incidents   document:read
     Quản lý thông tin KCHT hàng hải trên bản đồ  /gis/map   data:read
     Quản lý biểu tượng trên bản đồ  /symbols     data:read
     Quản lý danh mục đối tượng điểm / đường / vùng  /gis/points, /gis/lines, /gis/polygons  data:read
     Quản lý văn bản pháp lý    /documents/legal  document:read
     Quản lý hồ sơ              disabled placeholder
VII. TÍCH HỢP                   key: group-integration
     Quản lý kết nối liên thông chia sẻ dữ liệu  /connections   connection:read
     (Quản lý kết nối liên thông)  /interconnect  connection:read
     Tích hợp các mảnh hải đồ điện tử            disabled placeholder
     Tích hợp bản đồ quy hoạch cảng biển         disabled placeholder
— divider —
Cấu hình hệ thống /settings     admin:manage       [utility]
Quản lý vùng nước /water-zone   waterzone:read     [utility]
```

**13-entity count (AC-024-02 oracle):** Cảng biển, Bến cảng, Cầu cảng, Luồng hàng hải, Bến phao, Đèn biển + nhà trạm gắn đèn, Đê/kè, Nhà trạm phao/tiêu, Phao tiêu, Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão, CS sửa chữa/đóng tàu = **13**, hierarchy per BR-024-03 / SO-DO matrix chains.

**Placeholders naming convention:** English, non-route, `-placeholder` suffix (e.g. `ais-placeholder`, `cctv-placeholder`, `ts-cang-bien-placeholder` → **use English**: `asset-port-placeholder`, `asset-berth-placeholder`, ...). No transliterated Vietnamese keys (naming convention). Full list is derived from the xlsx tree by the implementer; the work order requires the xlsx sheet to be the source of labels.

### 4.3 Dashboard Grid 6 khối (AppLayout-owned)

- **NEW (proposed)** — single-source config `DASHBOARD_BLOCKS` (6 entries: `label` Vietnamese, `icon` from `@ant-design/icons`, `target` route, `permission`) to be introduced by WO-FE-4; this config does not exist today.
- **Proposed (new behavior):** rendered on `location.pathname === '/'` above `<Outlet />` inside the Content of `AppLayout.tsx` (WO-FE-4).
- **Display gating:** blocks are NOT permission-filtered — always 6 (AC-024-01 count oracle); unauthorized navigation is stopped by route guards (BR-024-12). (Rejected alternative: gating blocks by permission → the block count becomes user-dependent and fails the "đúng 6 khối" oracle.)
- Layout: responsive grid (Row/Col pattern as used in `HomeDashboard` at `Home.tsx:304`); styling ONLY via `tokens.ts` presets (e.g. cardStyle-family, radiusLg, `spaceMd` at `tokens.ts:69`) — no hex, no raw spacing/font-size.
- Icons: reuse the existing @ant-design/icons import block — e.g. `ApiOutlined` at `AppLayout.tsx:23` and `DashboardOutlined` at `AppLayout.tsx:18`; add any missing icon the same way.
- Click → `navigate(target)` + `setOpenKeys` for the branch (WO-FE-3), closing the mobile drawer if open.

### 4.4 Route → permission map — FINAL (§6)

| Route | Permission (guard = source of truth) | Guard anchor | MENU_PERMISSION_MAP action |
|---|---|---|---|
| `/port` | `port:read` | `App.tsx:186` | keep |
| `/berth` | `berth:read` | `App.tsx:190` | keep |
| `/pier` | `pier:read` | `App.tsx:192` | keep |
| `/navigation-channel` | `navigationchannel:read` | `App.tsx:205` | keep |
| `/dike-revetment` | `dikerevetment:read` | `App.tsx:210` | keep |
| `/ship-repair-facility` | `shiprepair:read` | `App.tsx:215` | keep |
| `/radar-station` | `radarstation:read` | `App.tsx:220` | keep |
| `/vts-system` | `vts:read` | `App.tsx:225` | keep |
| `/beacon-stations` | `beaconstation:read` | `App.tsx:179` | **change** (`data:read` → `beaconstation:read`) |
| `/buoys` | `buoy:read` | `App.tsx:182` | **change** (`data:read` → `buoy:read`) |
| `/buoy-station` | `buoystation:read` | `App.tsx:241` | **change** (`data:read` → `buoystation:read`) |
| `/station/coastal` | `coastalstation:read` | `App.tsx:244` | keep |
| `/station/special` | `specialstation:read` | `App.tsx:245` | keep |
| `/dry-port` | `dryport:read` | `App.tsx:196` | keep |
| `/water-zone` | `waterzone:read` | `App.tsx:198` | **change** (`waterarea:read` → `waterzone:read`) |
| `/asset/increase` | `assetincrease:manage` | `App.tsx:230` | **add** (currently `data:read`) |
| `/asset/decrease` | `assetdecrease:manage` | `App.tsx:231` | **add** (currently `data:read`) |
| `/asset/inventory` | `inventoryasset:manage` | `App.tsx:232` | **add** (currently `data:read`) |
| `/asset/exploitation` | `assetexploitation:manage` | `App.tsx:233` | **add** (currently `data:read`) |
| `/reports` | `report:read` | `App.tsx:174` | keep |
| `/reports/F-*` | (inherited from `/reports` parent gate; no map entry needed — `canAccessMenu` at `AppLayout.tsx:84` returns true when a path has no map entry) | — | none |
| `/users` | `user:read` | `App.tsx:129` | keep |
| `/organizations` | `orgunit:read` | `App.tsx:132` | keep |
| `/groups` | `group:read` | `App.tsx:138` | keep |
| `/logs` | `admin:view` | `App.tsx:251` | keep |
| `/documents/legal` | `document:read` | `App.tsx:236` | keep |
| `/documents/incidents` | `document:read` | `App.tsx:237` | keep |
| `/documents/port-planning` | `document:read` | `App.tsx:238` | keep |
| `/symbols` | `data:read` | `App.tsx:248` | **change** (`map:manage` → `data:read`) |
| `/gis/points` `/gis/lines` `/gis/polygons` | `data:read` | `App.tsx:143` `App.tsx:148` `App.tsx:153` | keep (restore from block comment) |
| `/gis/map` | `data:read` | `App.tsx:161` | keep |
| `/connections` | `connection:read` | `App.tsx:165` | keep |
| `/interconnect` | `connection:read` | `App.tsx:171` | keep |
| `/settings` | `admin:manage` | `App.tsx:254` | keep |
| `/` (Trang chủ) | none | `App.tsx:128` | none (utility) |

### 4.5 §7 — persistence: none

No table, no entity, no migration, no backfill, no `orgUnitId` / `@Filter` / `@DataScope` (BR-024-11). Data-scope declaration (feature-brief §5 row 3): chức năng không quản lý dữ liệu nghiệp vụ → no data scope.

---

## 5. Component & data flow

```
Login (authStore.ts:44 parseJwt -> permissions claim)
  -> permissionStore.ts:119 subscribe syncs permissions
  -> AppLayout renders:
       sidebar: rawMenuItems (static, §4.2) -> filterEmptyChildren (AppLayout.tsx:464)
                -> Menu items gated by canAccessMenu (AppLayout.tsx:84)
       home '/': DashboardGrid (6 blocks, §4.3) above <Outlet /> (Home.tsx dashboard below)
  -> click leaf (AppLayout.tsx:492 handleMenuClick): navigate(route)
  -> selectedKey/openKeys effect (WO-FE-3) opens the branch
  -> deep link without permission: route guard in App.tsx -> 403/redirect (BR-024-12)
```

No API calls added; no backend endpoint; no store schema change.

---

## 6. Work orders

### Backend

**WO-BE-1 — Verify seeded permissions; expected diff: NONE (PermissionSeeder.java)**
- File: `PermissionSeeder.java` (read-only this stage).
- Task: confirm every permission code in §4.4 resolves to a `seedPermission` call inside `run()` — the anchored list in §2 already proves all 30 exist (`run` at `PermissionSeeder.java:45`, `seedPermission` at `PermissionSeeder.java:716`). Make **no code change**.
- Fallback (ONLY if review/QA finds a referenced code missing from the DB after boot): add `seedPermission(definitions, resource, action, "Tên tiếng Việt", "Mô tả tiếng Việt");` inside `run()` per BR-024-09 — dynamic, no role assignment.
- Oracle: `mvn compile -DskipTests` passes; every §4.4 permission code appears in `run()`'s seed list.

### Frontend — `AppLayout.tsx`

**WO-FE-1 — Rebuild `rawMenuItems` to the 7-group target tree** (`AppLayout.tsx:222`)
- Replace the current items with the tree in §4.2: utility `Trang chủ` first; 7 group headers (I–VII, exact xlsx labels); group I with the 13-entity Cảng-biển tree + VTS subtree + `Thông tin cảng cạn`; groups II/III with xlsx placeholder trees; group IV restored from the block comment (F-141..F-189, keys `/reports/F-*`); groups V/VI/VII per §4.2.
- Placeholders: `disabled: true` + `title: 'Chưa triển khai'`; English non-route keys with `-placeholder` suffix; **not** wrapped in `canAccessMenu`.
- Group headers (I–VII) render unconditionally; real leaves wrapped in `canAccessMenu(route)`.
- Constraints: labels tiếng Việt có dấu; keys/routes tiếng Anh; no hardcoded color/spacing/font-size; no route that does not exist in `App.tsx`.
- Oracle: node count of `Quản lý cảng biển` branch = 13; 7 groups; `cd frontend && npx tsc --noEmit` passes.

**WO-FE-2 — Align `MENU_PERMISSION_MAP` to route guards** (`AppLayout.tsx:43`)
- Apply exactly the 5 changes + 4 additions in §4.4 (`/buoys`, `/beacon-stations`, `/buoy-station`, `/symbols`, `/water-zone`; `/asset/increase`, `/asset/decrease`, `/asset/inventory`, `/asset/exploitation`).
- Do not remove entries for hidden routes (`/gis/*`, `/history`, `/documents/port-planning`, `/interconnect`, `/dry-port`) — they are inert or reused.
- Oracle: for every route in §4.4, `MENU_PERMISSION_MAP[route] ===` the guard permission in `App.tsx`.

**WO-FE-3 — Rewrite `selectedKey`/`openKeys` branch sync for the new tree**
- Replace the old branch-key branches (e.g. `cangben`, `khu-nuoc-vts`, `beacon`, `stations`, `system-admin`, `documents-incidents`) with the new keys: `group-kcht`, `port-tree`, `berth-parent`, `nav-channel-parent`, `buoy-station-parent`, `vts-parent`, `vts-ops-center`, `group-asset`, `group-approval`, `group-reports`, `group-users`, `group-planning`, `group-integration`.
- Grid clicks must open the matching branch (e.g. block TÍCH HỢP → `/connections` → `group-integration`).
- Keep the existing branch-sync `selectedKey` effect (`AppLayout.tsx:188`) and its special cases (port-parent, buoy-station-parent) — extend, don't delete.
- Oracle: AC-024-06 — clicking each leaf opens exactly its branch (no stray branch).

**WO-FE-4 — Add `DashboardGrid` (6 khối) + NEW `DASHBOARD_BLOCKS` config**
- New local component + config in `AppLayout.tsx`; render above `<Outlet />` only when `location.pathname === '/'`.
- 6 blocks per §3 (D-2): label tiếng Việt, AntD icon, target route, click → `navigate` + branch sync + close mobile drawer.
- Styling from `tokens.ts` presets only; no hex/spacing/font-size literals.
- **Vite re-export bug discipline:** if any import comes from a tokens barrel, use explicit `import { x } from './tokens'` then `export { x }` — never `export { x } from ...` + in-body usage (pattern already applied at `tokens-dashboard.ts:6`). New tokens are NOT expected; reuse existing presets.
- Oracle: AC-024-01 — home renders exactly 6 grid blocks, each with Vietnamese label, each navigable.

**WO-FE-5 — Keep gating helpers; adjust empty-submenu behavior**
- `canAccessMenu` (`AppLayout.tsx:84`) unchanged.
- `filterEmptyChildren` (`AppLayout.tsx:464`): unchanged logic; because placeholders are unconditional children, branches with placeholders never collapse; branches with only gated children collapse when all are filtered (AC-024-04).
- Oracle: AC-024-03 (7 groups for every user), AC-024-04 (no-permission items hidden), AC-024-05 (`admin:all`/`*` sees everything).

### Frontend — `authStore.ts`, `permissionStore.ts`

**WO-FE-6 — Verify permission flow; expected diff: NONE**
- File: `authStore.ts`, `permissionStore.ts` (read-only this stage).
- Verify: `parseJwt` (`authStore.ts:44`) parses the JWT permissions claim.
- Verify: `login` (`authStore.ts:81`) applies the permissions to user state.
- Verify: `replaceAccessToken` (`authStore.ts:111`) refreshes them on token renewal.
- Verify: `normalizePermissionKey` (`permissionStore.ts:19`) normalizes legacy dot-notation keys.
- Verify: `hasPermissionFromList` (`permissionStore.ts:55`) implements bypass + exact-match checks.
- Verify: `useAuthStore.subscribe` (`permissionStore.ts:119`) syncs permissions on auth change.
- All referenced menu permission keys are plain <resource>:<action> codes that pass through unchanged.
- Make **no code change**. If QA finds a gating gap (e.g. a legacy dot-notation key that fails normalization for a menu permission), report to SA with the exact key — do not improvise a normalization rule.
- Oracle: AC-024-09 typecheck/compile + spot-check of a seeded permission key round-tripping through `normalizePermissionKey` unchanged.

---

## 7. Acceptance mapping

| AC | Design element | Verification oracle |
|---|---|---|
| AC-024-01 (6 khối, navigable) | §4.3 `DASHBOARD_BLOCKS` (NEW) + WO-FE-4 | Count grid elements on `/` = 6; click each block → target route renders |
| AC-024-02 (13 entities, hierarchy) | §4.2 group I tree + WO-FE-1 | Count nodes in `Quản lý cảng biển` = 13; parent–child chains per BR-024-03 |
| AC-024-03 (7 groups) | §4.2 group headers + WO-FE-1 | Sidebar shows exactly groups I–VII + utility items |
| AC-024-04 (permission hiding) | `canAccessMenu` + WO-FE-2/5 | User without `port:read` sees no Cảng biển item; empty submenus collapse |
| AC-024-05 (`admin:all`/`*`) | `permissionStore.ts:55` bypass | Admin sees full menu |
| AC-024-06 (navigation sync) | WO-FE-3 | Click leaf → route + correct `selectedKey`/`openKeys` |
| AC-024-07 (disabled + tooltip) | D-1 placeholders + WO-FE-1 | 4 placeholders disabled, tooltip "Chưa triển khai", no navigation |
| AC-024-08 (naming/UI) | constraints throughout | Static check: English keys/routes, Vietnamese labels, no hex/spacing/font-size literals |
| AC-024-09 (builds) | all work orders | `cd frontend && npx tsc --noEmit`; `mvn compile -DskipTests` |
| AC-024-10 (seed if new permission) | WO-BE-1 (no new permission by design) | N/A — no new permission; if fallback triggers, permission appears in DB, no role assignment |

---

## 8. Risks & rollback

| Risk | Mitigation |
|---|---|
| Dashboard 6-khối required by done-oracle but `Home.tsx` is NOT an edit target | Grid rendered by `AppLayout.tsx` on `/` above the existing dashboard (WO-FE-4) — preserves M-022 content, stays in edit scope. Flagged deviation; if PMO approves editing `Home.tsx`, move the component there unchanged. |
| Target photo `docs/inputs/photo_2026-07-09_15-47-20.jpg` may dictate a different block mapping; unreadable this session (base64 only, no vision extraction) | Block mapping is a single NEW config (`DASHBOARD_BLOCKS`, §4.3) — one-line change; D-2 rationale documented so a reviewer can re-decide from the photo. |
| `MENU_PERMISSION_MAP` divergence would cause visible-item-but-403 (or hidden-item) mismatches | WO-FE-2 aligns map to guards; §4.4 table is the contract. |
| 4-level menu depth + ~90 placeholder nodes (groups II/III per xlsx) | AntD inline menu supports deep nesting (external library behavior — assumed, confirm at review); placeholders sit in collapsed submenus; `inlineIndent` set at `AppLayout.tsx:566` (currently 12). |
| Restored group IV report tree (~60 items) increases sidebar weight | Keys are existing `/reports/F-*` routes (`App.tsx:175` catch-all); single parent gate `report:read`. |
| `filterEmptyChildren` behavior change risk | No logic change; placeholder children are unconditional, so pruning semantics stay predictable (AC-024-03/04). |
| Static menu = release-bound changes | Accepted — matches existing pattern; no runtime menu editing requirement exists. |

**Rollback:** all changes are frontend config (menu tree, map, keys, one component) + zero backend diff → revert the `AppLayout.tsx` diff restores the previous menu; no DB/migration/endpoint involved, no server-side rollback.

---

## 9. Out of scope / open items

- No modification to `Home.tsx`, `App.tsx`, router, business screens, or other modules (triage edit scope).
- No new entity/table/migration/endpoint; no data scope (BR-024-11).
- `docs/inputs/photo_2026-07-09_15-47-20.jpg` and `docs/inputs/logo-vinamarine_1_1.png` were read as binary this session (JPEG/PNG base64 only — visual content not extractable). The photo is the D-2 reference for block mapping (see §8); the logo is a brand asset outside the 4-file edit scope (`AppLayout.tsx` already references `/images/logo-vinamarine.png` in the sidebar header; swapping the served asset is a product decision, not a code change).
- Group III (PHÊ DUYỆT) intentionally has no dashboard block and no real sidebar leaves until approval list screens exist (all disabled placeholders).
