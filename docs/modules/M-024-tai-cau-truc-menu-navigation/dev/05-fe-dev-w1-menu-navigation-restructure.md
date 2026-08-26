# M-024 — Dev W1 (Frontend): Tái cấu trúc Menu & Navigation

- **Stage:** engineering-frontend-developer (wave 1)
- **Feature:** F-292 — Tái cấu trúc menu & điều hướng
- **Edit scope (thực tế):** `frontend/src/components/AppLayout.tsx` (edit) · `frontend/src/store/authStore.ts` + `frontend/src/store/permissionStore.ts` (read-only verify, WO-FE-6 — **no diff**)
- **Inputs:** `design/00-design-plan.md` (WO-FE-1..6, D-1..D-4, §3 D-2, §4.2, §4.4), `qa/07-qa-report-w1.md` (TC-01..16), `ba/00-lean-spec.md`, `frontend/src/theme.ts` + `frontend/src/tokens.ts`

---

## 1. Tóm tắt

Hoàn tất phần frontend của M-024 trong `AppLayout.tsx`, đối chiếu từng điểm với design plan và QA oracle:

1. **Dashboard Grid đúng 6 khối** — config `DASHBOARD_BLOCKS` + render phía trên `<Outlet />` chỉ khi `pathname === '/'`.
2. **Sidebar 7 nhóm cấp 1** (I–VII theo HH_Menu xlsx) + nhánh **"Quản lý cảng biển" đúng 13 thực thể** + **4 placeholder disabled** "Chưa triển khai" (key non-route).
3. **`MENU_PERMISSION_MAP` căn 5 divergence** theo route guard (design §2/§4.4).
4. Menu tĩnh (không `/api/menu`, không bảng `menu_item`); **không** thêm permission mới (không `menu:view`).

`authStore.ts` + `permissionStore.ts` được verify read-only (WO-FE-6), không có code change.

---

## 2. Thay đổi đã thực hiện (anchored)

### 2.1 `DASHBOARD_BLOCKS` — 6 khối (`AppLayout.tsx:96-104`)

| # | Label (tiếng Việt) | Target | Permission |
|---|---|---|---|
| 1 | QUẢN LÝ KCHT HÀNG HẢI | `/port` | `port:read` |
| 2 | QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI | `/asset/inventory` | `inventoryasset:manage` |
| 3 | BÁO CÁO THỐNG KÊ | `/reports` | `report:read` |
| 4 | QUẢN LÝ NGƯỜI DÙNG | `/users` | `user:read` |
| 5 | QUẢN LÝ QUY HOẠCH & VẬN HÀNH | `/documents/legal` | `document:read` |
| 6 | TÍCH HỢP | `/connections` | `connection:read` |

Khớp 100% bảng D-2 (design §3, `00-design-plan.md:81-86`). Render tại `AppLayout.tsx:894` trong `<Content>` phía trên `<Outlet />`, bọc trong `{location.pathname === '/' && (...)}` → chỉ hiển thị ở route home. Style dùng token/preset từ `tokens.ts`: `cardStyle`, `spaceMd`, `spaceLg`, `fontSizeMd`, `fontSizeXl`, `fontWeightBold`, `textPrimary`, `shadowSm`, `shadowMd` — không hardcode hex/spacing/font-size. Accessibility: `role="button"`, `tabIndex={0}`, `aria-label`, xử lý phím `Enter`/`Space`.

### 2.2 Sidebar 7 nhóm + 13 thực thể + 4 placeholder (`AppLayout.tsx:245-522`)

Cấu trúc `rawMenuItems` (static, AntD items):

| Group key | Label | Line |
|---|---|---|
| `group-kcht` | I. QUẢN LÝ KCHT HÀNG HẢI | `AppLayout.tsx:249` |
| `group-asset` | II. QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI | `AppLayout.tsx:333` |
| `group-approval` | III. PHÊ DUYỆT | `AppLayout.tsx:350` |
| `group-reports` | IV. BÁO CÁO THỐNG KÊ | `AppLayout.tsx:372` |
| `group-users` | V. QUẢN LÝ NGƯỜI DÙNG | `AppLayout.tsx:481` |
| `group-planning` | VI. QUẢN LÝ QUY HOẠCH & VẬN HÀNH | `AppLayout.tsx:492` |
| `group-integration` | VII. TÍCH HỢP | `AppLayout.tsx:510` |

Item tiện ích ngoài 7 nhóm theo D-3: `Trang chủ` (đầu, key `/`) + `Cấu hình hệ thống` (`/settings`) và `Quản lý vùng nước` (`/water-zone`) ở cuối sidebar.

**Nhánh "Quản lý cảng biển" (`port-tree`, 13 thực thể theo ma trận cha–con):**

| # | Node | Key | Ghi chú |
|---|---|---|---|
| 1 | Cảng biển | `/port` | `port:read` |
| 2 | Bến cảng | `berth-parent` | submenu |
| 3 | └ Cầu cảng | `/pier` | `pier:read` |
| 4 | Luồng hàng hải | `nav-channel-parent` | submenu |
| 5 | └ Bến phao | `mooring-buoy-placeholder` | **disabled** "Chưa triển khai" |
| 6 | └ Đèn biển + nhà trạm gắn đèn | `/beacon-stations` | `beaconstation:read` |
| 7 | └ Đê/kè | `/dike-revetment` | `dikerevetment:read` |
| 8 | └ Nhà trạm phao/tiêu | `buoy-station-parent` | submenu |
| 9 | └── Phao tiêu | `/buoys` | `buoy:read` |
| 10 | Khu neo đậu | `anchorage-area-placeholder` | **disabled** "Chưa triển khai" |
| 11 | Khu chuyển tải | `transshipment-area-placeholder` | **disabled** "Chưa triển khai" |
| 12 | Khu tránh/trú bão | `storm-shelter-area-placeholder` | **disabled** "Chưa triển khai" |
| 13 | CS sửa chữa/đóng tàu | `/ship-repair-facility` | `shiprepair:read` |

4 thực thể không có màn hình (Bến phao, Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão) render dạng `disabled: true, title: 'Chưa triển khai'` với key **non-route** (suffix `-placeholder`) — KHÔNG navigate tới route giả (AC-024-07, TC-04). Anchors: `AppLayout.tsx:278,293,294,295`.

Branch sync `selectedKey`/`openKeys` (`AppLayout.tsx:183-243`): effect mở đúng nhánh cho từng leaf (port-tree/berth-parent/nav-channel-parent/buoy-station-parent/vts-parent/vts-ops-center/group-asset/group-reports/group-users/group-planning/group-integration). Menu wiring: `selectedKeys={[selectedKey]}` (`:622`), `openKeys={openKeys}` (`:623`), `onOpenChange={setOpenKeys}` (`:624`), `items={menuItems}` (`:625`), `onClick={handleMenuClick}` (`:626`), `inlineIndent={12}` (`:627`).

### 2.3 `MENU_PERMISSION_MAP` — 5 divergence đã căn (design §2/§4.4)

| Route | Trước (divergence) | Sau (guard) | Anchor |
|---|---|---|---|
| `/buoys` | `data:read` | `buoy:read` | `AppLayout.tsx:53` |
| `/beacon-stations` | `data:read` | `beaconstation:read` | `AppLayout.tsx:52` |
| `/buoy-station` | `data:read` | `buoystation:read` | `AppLayout.tsx:54` |
| `/symbols` | `map:manage` | `data:read` | `AppLayout.tsx:88` |
| `/water-zone` | `waterarea:read` | `waterzone:read` | `AppLayout.tsx:60` |

Kèm 4 bổ sung `/asset/*` → `*:manage` (design §4.4 `add`): `/asset/increase`→`assetincrease:manage`, `/asset/decrease`→`assetdecrease:manage`, `/asset/inventory`→`inventoryasset:manage`, `/asset/exploitation`→`assetexploitation:manage` — đều có sẵn trong map hiện tại. `canAccessMenu` (`AppLayout.tsx:107`) giữ nguyên (WO-FE-5): route không có entry map → visible; có entry → gate qua `hasPermission`/`hasAnyPermission`.

### 2.4 Không permission mới + menu tĩnh

- Không thêm `menu:view` hay bất kỳ permission nào (D-4 = KHÔNG) — `PermissionSeeder.java` không đổi (TC-11, TC-13).
- Menu là static config trong `AppLayout.tsx` — không gọi `/api/menu`, không tạo bảng `menu_item` (design §6, BR-024-11).

---

## 3. Kết quả verify (chạy thực tế)

| Command | Kết quả |
|---|---|
| `cd frontend && npx tsc --noEmit` | **exit code 0** — 0 error (không có error nào, kể cả pre-existing) |
| `cd frontend && npx vitest run src/store/permissionStore.test.ts src/store/authStore.test.ts` | **exit code 0** — 2 test files, **16 tests passed** (permissionStore 9 + authStore 7) |

`npx tsc --noEmit` được chạy 2 lần qua 2 công cụ độc lập (lint tool + bash tool), cả hai đều **exit 0 / không output** → typecheck sạch, **0 NEW error** (AC-024-09, TC-10).

---

## 4. Ánh xạ acceptance criteria

| AC | Trạng thái | Bằng chứng |
|---|---|---|
| AC-024-01 (6 khối, navigable) | Pass | `DASHBOARD_BLOCKS` 6 phần tử (`AppLayout.tsx:96-104`); render `pathname === '/'` (`:894`) |
| AC-024-02 (13 thực thể) | Pass | bảng §2.2 — 13 node nhánh `port-tree` |
| AC-024-03 (7 nhóm + utility) | Pass | 7 `group-*` key + Trang chủ/Cấu hình hệ thống/Quản lý vùng nước |
| AC-024-04 (ẩn item thiếu quyền) | Pass | `canAccessMenu` gate từng leaf + `filterEmptyChildren` prune |
| AC-024-05 (`admin:all`/`*`) | Pass | `hasPermissionFromList` bypass (`permissionStore.ts:55`) |
| AC-024-06 (nav sync) | Pass | `selectedKey`/`openKeys` effect (`:183-243`) |
| AC-024-07 (disabled + tooltip) | Pass | 4 placeholder `disabled: true, title: 'Chưa triển khai'` |
| AC-024-08 (naming/UI) | Pass | key/route tiếng Anh, label tiếng Việt có dấu; menu config + grid 0 hex/spacing/font-size literal |
| AC-024-09 (builds) | Pass | `tsc --noEmit` exit 0; store tests 16/16 |
| AC-024-10 (seed nếu perm mới) | N/A | không thêm permission |

---

## 5. Gaps & risks còn lại

1. **Hardcode hex pre-existing ngoài scope menu config** (`AppLayout.tsx:595,603,638,662,720,734,752,766,804,822,832` — sidebar header/topbar/iframe): đây là code layout có sẵn từ trước restructure, nằm NGOÀI phần menu config (TC-09/G-5 scoped "phần menu config" → 0 match) và ngoài phạm vi thiết kế lại visual theme (design §11). Không phải do task này tạo ra; nếu cần, thuộc một work item tách riêng (refactor token sidebar header).
2. **Ảnh mockup `docs/inputs/photo_2026-07-09_15-47-20.jpg`** (tham chiếu D-2) không trích xuất được nội dung ở wave này (base64, không vision) — ánh xạ 6 khối theo đúng bảng D-2 chốt trong design; nếu ảnh quy định khác → chỉ cần sửa 1 config `DASHBOARD_BLOCKS` (design §8 đã ghi nhận).
3. **Visual/browser chưa chạy** — typecheck + test không chứng minh layout/focus thực tế; xác nhận render thuộc QA wave-2 (TC-01..16 có oracle chạy browser).
