---
stage: engineering-qa-engineer-wave-2
module: M-024
feature: F-292
triage: TRI-1788409709741-75fa
do-t: 5
executed: 2026-09-03
status: battery-executed — real outcomes recorded
---

# M-024 Đợt 5 — QA Report W2: Acceptance Battery Results (mô hình 2 màn hình)

> Wave-2 EXECUTES the battery authored in `qa/acceptance-map.json` (oracle `qa/07-qa-report-w1.md`)
> and records REAL outcomes. Anchor re-grep done 2026-09-03 trước khi chạy (rủi ro R5); mọi anchor bên
> dưới là dòng thực tế đã đọc/grep trong working tree tại thời điểm chạy. Backend KHÔNG được khởi động;
> không probe nào cần backend (edit-scope frontend-only).

## 1. Môi trường thực thi

| Yếu tố | Giá trị |
|---|---|
| Workspace | `C:\Users\trangtt1\hang-hai-kchtgt` (git, revision hiện tại 2026-09-03) |
| CWD các lệnh | `frontend/` |
| Runtime | vitest v4.1.11 (qua `npx --no-install`), tsc qua `npx --no-install` |
| Files dưới test | `App.tsx`, `components/AppLayout.tsx`, `pages/Home.tsx`, `pages/kcht-directory/KchtDirectoryPage.tsx` (+ `src/store/permissionStore.ts` đọc tham chiếu) |
| Backend | KHÔNG start |

## 2. Gates

| Gate | Lệnh thực thi | Exit | Kết quả thật |
|---|---|---|---|
| GATE-1 | `cd frontend && npx --no-install tsc --noEmit` | **0** | PASS — no output, 0 violations (toàn bộ frontend typecheck; 4 file anchor nằm trong đó) |
| GATE-2 | `cd frontend && npx --no-install vitest run src/components/AppLayout.test.tsx` | **0** | PASS — 1 test file, **18/18 tests passed** (v4.1.11; duration 5.15s; tests 11ms). Suite co-located sống sót sau refactor sidebar |

## 3. Kết quả AC-024-01..16 (probe thực thi — pass/fail + evidence)

| AC | Probe (theo map) | Kết quả | Evidence (anchor thật) |
|---|---|---|---|
| AC-024-01 | read `Home.tsx:46-88` + heading + App route | **PASS** (re-probe post-D1 fix) | `BLOCKS` đúng **6** entry, thứ tự chuẩn AC: kcht `:48`, asset `:55`, planning `:62`, approval `:69`, reports `:76`, admin `:83`; label tiếng Việt có dấu; `route` chỉ ở khối (1)(2)(3)(5)(6): `:51` `/kcht-directory`, `:58` `/asset/inventory`, `:65` `/gis/map`, `:79` `/reports`, `:86` `/users`; khối (4) "Phê duyệt" `:69-73` có `disabled: true` `:73`, KHÔNG có `route`; render: `<Tooltip title={block.disabled ? 'Chưa triển khai' : undefined}>` `:169`, `disabled={block.disabled}` `:178`, `onClick={() => block.route && navigate(block.route)}` `:179` → khối 4 KHÔNG navigate, hết self-loop D1; heading "Danh mục chức năng" `:159`; `/`→`HomePage` `App.tsx:145` |
| AC-024-02 | route khối 1 + 28 loại | **PASS** | Khối 1 `route: '/kcht-directory'` `Home.tsx:49`; `<Route path="/kcht-directory" element={<KchtDirectoryPage />}>` `App.tsx:148` (không PermissionGuard — gating per-node trong page); 28 loại xác nhận qua probe AC-024-16 |
| AC-024-03 | sidebar 6 nhóm cấp 1 phẳng | **PASS** (xem OBS-1) | `rawMenuItems` `AppLayout.tsx:215-381` = item tiện ích `/` `:216` + **6 nhóm nghiệp vụ đúng thứ tự**: `/kcht-directory` lá KHÔNG children `:219`, asset-management `:223/:225`, planning-operation `:236/:238`, approval disabled `:254`, reports-parent `:257/:259`, system-admin `:368/:370`; grep `key: '/pier'|...|'/dai-ttdh'` → **0 match** (cây KCHT cũ đã gỡ khỏi sidebar) |
| AC-024-04 | gating quyền + ẩn nhóm rỗng | **PASS** (cơ chế; xem OBS-2) | children gói `canAccessMenu(...)`: `:226-231`, `:240-249`, `:372-377`, reports gated `:259`; `menuItems = filterEmptyChildren(rawMenuItems)` `:382`; `filterEmptyChildren` `:106-128` loại nhóm 0 con + prune divider; directory: node thiếu quyền/lá → `disabled: true` + `<Tooltip title={NO_PERMISSION_NOTE}>` `:300-301` |
| AC-024-05 | bypass `admin:all` / `*` | **PASS** | `canAccessMenu` `AppLayout.tsx:95-105` delegate `MENU_PERMISSION_MAP` → `hasPermission`/`hasAnyPermission`; `permissionStore.ts:70` chỉ `permissions.has('*') || permissions.has('admin:all')` mới bypass; `:77` `resource:manage`/`resource:*`; `:52-53` ghi rõ `admin:manage` KHÔNG toàn quyền |
| AC-024-06 | navigate + selectedKey/openKeys | **PASS** (static seam) | Mapping `selectedKey` `AppLayout.tsx:168-198`: rỗng→`/`; `/reports/<code>`; `/asset|/gis|/documents` 2-segment; **mọi route KCHT-entity (port, berth, ... station) gom về `/kcht-directory`**; effect openKeys `:200-215` mở asset-management / planning-operation / reports-parent+chung+kcht / system-admin; `handleMenuClick` `:394-399` navigate chỉ key bắt đầu `/`, gắn `Menu onClick` (vùng `:465-475`) |
| AC-024-07 | disabled + tooltip, không navigate route giả | **PASS** | `grep 'Chưa triển khai'` → đúng 1 match `AppLayout.tsx:254` (lá Phê duyệt `disabled: true, title: 'Chưa triển khai'`); `KchtDirectoryPage.tsx:139` `noRouteNote` Hệ thống VHF → `:273-274` disabled + Tooltip; node thiếu quyền `:300-301` disabled + Tooltip(NO_PERMISSION_NOTE); submenu `onTitleClick` chỉ navigate khi `route && checkRouteAccess` `:288`; lá onClick navigate chỉ khi có route+quyền `:308` |
| AC-024-08 | English key/route, Việt label, không hardcode hex/spacing/font-size | **PASS** | `grep -nE "#[0-9A-Fa-f]{3,8}"` trên `Home.tsx` + `KchtDirectoryPage.tsx` → **0 match**; vùng rawMenuItems 215-381 không chứa style object; style dùng token (`surfaceCard`, `actionPrimary`, `textPrimary`, `fontSizeLg/Md`, `spaceSm/Md/Lg/Xl`, `radiusLg/Xl`, `fontWeightBold`, `shadowMd`, `borderDefault`, `colors.sidebarBg` + alpha `${color}15/40` pill) — chỉ số layout (56px, 100%, 1px border, lineHeight) hợp lệ; label tiếng Việt có dấu, key/route tiếng Anh |
| AC-024-09 | GATE-1 | **PASS** | `npx --no-install tsc --noEmit` exit 0 (mục 2). Mệnh đề `mvn compile -DskipTests` không áp dụng — triage edit-scope frontend-only (OBS-3 oracle) |
| AC-024-10 | premise D-4 (permission mới) | **PASS (vacuous)** | D-4 = KHÔNG; `grep -n "menu:"` trên App.tsx + AppLayout.tsx + Home.tsx + KchtDirectoryPage.tsx → **0 match** — không token permission mới nào lọt vào code |
| AC-024-11 | search trim/không hoa-thường/ẩn nhánh | **PASS** | `filterMenuByQuery` `AppLayout.tsx:130-142`: `query.trim().toLowerCase()` `:131`, `label.toLowerCase().includes(q)`, prune nhánh 0 con qua `filterEmptyChildren` `:141`; thứ tự: lọc quyền `:382` TRƯỚC search `:386` → không item ngoài quyền hiện ra |
| AC-024-12 | xóa chuỗi → khôi phục menu | **PASS** | `:384-387`: `trimmedSearchQuery = searchQuery.trim()`, `isSearching = trimmedSearchQuery.length > 0`; false → `displayedItems = menuItems` (full 6 nhóm + tiện ích) `:386`, `effectiveOpenKeys = openKeys` (user điều khiển) `:387` |
| AC-024-13 | không navigate/API ngoài ý muốn từ search | **PASS** | Ô tìm kiếm `AppLayout.tsx:449-460`: `<input placeholder="Tìm kiếm" ... onChange={(e) => setSearchQuery(e.target.value)}>` — KHÔNG onKeyDown/onSubmit/fetch; navigate chỉ trong `handleMenuClick` (guard `startsWith('/')`) |
| AC-024-14 | KHÔNG filter bar 2 màn | **PASS** | grep `FilterBar|Input|Select|DatePicker|RangePicker|placeholder=|Tìm kiếm` trên `Home.tsx` + `KchtDirectoryPage.tsx` → **0 match**; Home render chỉ `Row gutter` + `BLOCKS.map` `:165-173`; Kcht render `ScreenHeader` + mô tả + card chứa `Menu` `:322-385`; ô "Tìm kiếm" sidebar `AppLayout.tsx:455` là menu-search đợt 2 (AC-024-11..13), không phải filter bar màn hình |
| AC-024-15 | chuỗi cha–con khớp SO-DO | **PASS** | `KchtDirectoryPage.tsx:71-149` khớp từng chuỗi AC-024-15/lean-spec: Cảng biển C0 `:75` → Bến cảng C1 `:81` → Cầu cảng C2 `:82`; → Luồng hàng hải C1 `:87` → {Bến phao C2 `:89`; Nhà trạm QLVH phao tiêu C2 `:93` → Phao, tiêu C3 `:94`; Đèn biển & nhà trạm C2 `:96`; Đê chắn sóng... C2 `:97`}; → {Khu neo đậu `:100`, Khu chuyển tải `:101`, Khu tránh, trú bão `:102`, Cơ sở sửa chữa đóng tàu `:103`}; Hệ thống VTS C0 `:109` → TTĐH VTS C1 `:115` → 6 hệ thống C2 `:117-122`; Cảng cạn C0 `:127`; Đài viễn thông hàng hải `note: 'gắn lỏng'` `:131-133` → 6 đài/hệ thống C1 `:134-144` (khớp SO-DO:50 semantics gắn lỏng); `DEFAULT_OPEN_KEYS` `:183-191` = 7 key mở sẵn |
| AC-024-16 | đúng 28 loại C0–C3, không trùng | **PASS** | `grep -n "level: 'C[0-3]'"` → **đúng 28 dòng** tại 75,81,82,87,89,93,94,96,97,100,101,102,103,109,115,117,118,119,120,121,122,127,134,138,141,142,143,144; key duy nhất (không trùng); C0 chỉ 3 gốc: Cảng biển `:75`, Hệ thống VTS `:109`, Cảng cạn `:127` (nhóm Đài viễn thông không có level — node nhóm); mô hình cũ 7 nhóm/13 thực thể sidebar đã hết (AC-024-03 probe) |

## 4. Observations thực thi (hiện trạng code trung thực)

- **OBS-1 (AC-024-03):** sidebar giữ nhóm `Báo cáo thống kê` với folder con 2 cấp (`reports-chung` `:263`, `reports-kcht` `:276`, `reports-thtn` `:354`...) kế thừa trước đợt 5 — KHÔNG phải cây KCHT-entity. Đo theo nghĩa phân biệt AC (supersede): nhánh KCHT chỉ còn 1 lá `/kcht-directory`, cây entity 13 thực thể đã gỡ (grep 0). AC ghi PASS; nếu BA chủ đích flatten cả folder báo cáo → change request upstream.
- **OBS-2 (AC-024-04):** `Home.tsx` render 6 khối cố định, không gating quyền (không import `usePermissionStore`) — mệnh đề "màn khối" của AC-024-04 không có seam static để pass; ghi nhận là facet unverifiable trong battery tĩnh này (nhất quán AC-024-01). Cơ chế sidebar/directory PASS.
- **OBS-5 (khối 'Phê duyệt') — D1 FIXED:** defect D1 (block 4 `route: '/'` tự trỏ về màn khối) đã sửa bên build: block 4 `Home.tsx:69-73` `disabled: true` (`:73`), KHÔNG còn `route`, bọc `<Tooltip title='Chưa triển khai'>` (`:169`), `onClick={() => block.route && navigate(block.route)}` (`:179`) + native `disabled` (`:178`) → không navigate, không còn self-loop. BA amended AC-024-01 (miễn trừ block 4 — disabled + tooltip "Chưa triển khai", KHÔNG navigate); targeted re-probe PASS 2026-09-03. Sidebar lá Phê duyệt disabled "Chưa triển khai" `AppLayout.tsx:254` nhất quán. Lưu ý: anchor `Home.tsx` dịch +2 dòng so với lần chạy đầu (vd kcht route `:49` → `:51`) do D1 fix thêm `disabled`/tooltip wrapper.
- **OBS-8 (phát hiện wave-2, ngoài lề AC):** `AppLayout.tsx:452` header fullscreen có hardcode `color: '#273e7c'`, `fontWeight: 600`, `fontSize: '15px'` và `:460-462` footer dùng rgba/border hex — nằm NGOÀI vùng menu-item và có từ trước đợt 5 (không thuộc probe AC-024-08, vốn scope Home + KchtDirectoryPage + vùng rawMenuItems); ghi nhận để maintenance, không phải defect đợt 5.
- Không có AC nào fail; không defect nào được tìm thấy trong scope battery.

## 5. Kết luận

**PASS** — GATE-1 (tsc exit 0), GATE-2 (18/18 tests), và cả 16/16 probe AC-024-01..16 đều PASS với
evidence anchor thật (dòng code đọc/grep 2026-09-03). Mô hình 2 màn hình được xác nhận trong code:
6 khối → `/kcht-directory` 28 loại C0–C3, sidebar 6 nhóm cấp 1 phẳng, không filter bar, theme token,
label tiếng Việt có dấu, key/route tiếng Anh.

**Không phủ:** facet browser click/runtime (render thật, hover tooltip, redirect sau login) chưa chạy —
battery wave-2 là tĩnh (read/grep/typecheck/unit). Backend không start (không cần). Mệnh đề `mvn` không
áp dụng (frontend-only triage). Các facet đó cần live probe ở wave sau nếu PMO yêu cầu.
