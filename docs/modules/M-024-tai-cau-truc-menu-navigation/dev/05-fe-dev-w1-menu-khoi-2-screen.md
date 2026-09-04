# FE Dev Wave 1 — M-024 đợt 5: Xác nhận 4 file code cho mô hình 2 màn hình

> **Module:** M-024 — Tái cấu trúc Menu & Navigation
> **Feature:** F-292 — Tái cấu trúc Menu & Navigation
> **Triage:** `TRI-1788409709741-75fa` (đợt 5 — mô hình 2 màn hình)
> **Stage:** engineering-frontend-developer-wave-1 (docs-sync xác nhận — KHÔNG sửa code)
> **Ngày:** 2026-09-03
> **Bản chất task:** Code 4 file đã được build-side workers triển khai. Wave này CHỈ xác nhận (confirm) code hiện tại khớp thiết kế đã chốt và ghi bản tóm tắt triển khai. **Không file nào dưới `frontend/src/**` bị sửa** trong wave này.

---

## 1. Phạm vi xác nhận

| File | Vai trò trong mô hình 2 màn hình |
|---|---|
| `frontend/src/components/AppLayout.tsx` | Sidebar: landing `'/'` + 6 nhóm cấp 1 phẳng; lá KCHT → `/kcht-directory` |
| `frontend/src/pages/Home.tsx` | Màn `'/'` = 6 khối "Danh mục chức năng", không filter bar |
| `frontend/src/pages/kcht-directory/KchtDirectoryPage.tsx` | Màn `/kcht-directory` = 28 loại KCHT phân cấp C0–C3, không filter bar |
| `frontend/src/App.tsx` | Routes: `'/'` → HomePage, `'/kcht-directory'` → KchtDirectoryPage |

---

## 2. Xác nhận từng file (kèm anchor `file:line`)

### 2.1 `frontend/src/App.tsx` — route registration ✅

- `HomePage = lazy(() => import('./pages/Home'))` — `App.tsx:45`; `KchtDirectoryPage = lazy(() => import('./pages/kcht-directory/KchtDirectoryPage'))` — `App.tsx:46`.
- Cả hai route đăng ký TRONG nhánh có layout chung: `<Route element={<AppLayout />}>` — `App.tsx:144`.
  - `<Route path="/" element={<HomePage />} />` — `App.tsx:145` ✅ (`'/'` → HomePage).
  - `<Route path="/kcht-directory" element={<KchtDirectoryPage />} />` — `App.tsx:148` ✅ (`'/kcht-directory'` → KchtDirectoryPage).
- Route mặc định sau đăng nhập: `return <Navigate to={isAuthenticated ? '/' : '/login'} replace />` — `App.tsx:325` → màn đầu tiên sau đăng nhập là `'/'` (màn 6 khối), khớp AC-024-01.
- Không filter bar, không component lạ trên 2 route này.

### 2.2 `frontend/src/pages/Home.tsx` — màn "Danh mục chức năng" 6 khối ✅

- `BLOCKS: DirectoryBlock[]` — `Home.tsx:43–86`, **đúng 6 phần tử**, đúng tên + thứ tự + route:
  1. `kcht` — "Quản lý KCHT hàng hải" → `route: '/kcht-directory'` (mở màn 2)
  2. `asset` — "Quản lý tài sản KCHT hàng hải" → `/asset/inventory`
  3. `planning` — "Quản lý quy hoạch & vận hành" → `/gis/map`
  4. `approval` — "Phê duyệt" → `/`
  5. `reports` — "Báo cáo thống kê" → `/reports`
  6. `admin` — "Quản trị hệ thống" → `/users`
- Thứ tự 6 khối trùng 100% `design/00-design-plan.md §8.1` và `ba/00-lean-spec.md AC-024-01`. Mỗi khối có `title`/`description` tiếng Việt có dấu + `icon`.
- Render: `Row gutter` + `BLOCKS.map` → `Col xs={24} md={8}` chứa `<button onClick={() => navigate(block.route)}>` — `Home.tsx:150–176`. Mỗi khối điều hướng được qua `useNavigate`.
- **KHÔNG có filter bar** trên màn này (không Input/Select/DatePicker/RangePicker/filter component nào) ✅ (AC-024-14).
- Tiêu đề màn: `<h2>Danh mục chức năng</h2>` + phụ đề "Chọn một phân hệ để bắt đầu thao tác" — `Home.tsx:149–162`.

### 2.3 `frontend/src/pages/kcht-directory/KchtDirectoryPage.tsx` — cây 28 loại KCHT C0–C3 ✅

- `KCHT_TREE: KchtTypeNode[]` — `KchtDirectoryPage.tsx:71–145`: cây **đúng 28 loại KCHT** (đếm node loại = 28) khớp ma trận `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` mục 2 (28 dòng) và `design/wireframe-menu-khoi.md` §3:
  - Cảng biển (C0) → { Bến cảng (C1) → Cầu cảng (C2); Luồng hàng hải (C1) → { Bến phao (C2); Nhà trạm QLVH phao tiêu (C2) → Phao, tiêu (C3); Đèn biển & nhà trạm (C2); Đê chắn sóng, đê chắn cát, kè (C2) }; Khu neo đậu (C1); Khu chuyển tải (C1); Khu tránh, trú bão (C1); Cơ sở sửa chữa, đóng tàu (C1) } — 13 loại (dòng 74–103)
  - Hệ thống VTS (C0) → Trung tâm điều hành VTS (C1) → { Trạm Radar; Hệ thống AIS; Hệ thống CCTV; Hệ thống SCADA; Hệ thống truyền dẫn; Hệ thống phụ trợ VTS } (6 C2) — 8 loại (dòng 108–122)
  - Cảng cạn (C0) — 1 loại (dòng 127)
  - Nhóm "Đài viễn thông hàng hải" (gắn lỏng) → { Đài TTDH; Hệ thống VHF; Đài Inmarsat; Đài LRIT; Đài Cospas-Sarsat; Đài TTXLTT Hà Nội } — 6 loại (dòng 134–144). Node "Đài viễn thông hàng hải" (dòng 130) là node nhóm gắn lỏng (không có `level`), KHÔNG tính là loại KCHT — đúng thiết kế.
  - Tổng cộng **28 loại** không trùng lặp; cấp C0/C1/C2/C3 khớp ma trận SO-DO ✅ (AC-024-02, AC-024-15, AC-024-16).
- `type KchtLevel = 'C0' | 'C1' | 'C2' | 'C3'` — `KchtDirectoryPage.tsx:60`; badge cấp qua component `LevelBadge` — dòng 195–227 (Pill Badge Standard: `padding: '2px 10px'`, `borderRadius: radiusPill`, dùng `actionPrimary`/`surfaceCard`/`colors.sidebarBg` — token, không hex) ✅ (AC-024-08).
- **Permission gating** (AC-024-04/05): `ROUTE_PERMISSIONS: Record<string, string | string[]>` — dòng 148–172 (26 route → quyền `*:read`, khớp `MENU_PERMISSION_MAP`/`PermissionGuard` trong `App.tsx`); `checkRouteAccess` qua `hasPermission`/`hasAnyPermission` của `usePermissionStore` — dòng 231–237. Lá thiếu quyền → `disabled: true` + `Tooltip` "Bạn chưa được phân quyền truy cập màn hình này." — dòng 277–292. Lá chưa có màn hình (Hệ thống VHF) → disabled + `noRouteNote` — dòng 255–262.
- Node có con → submenu; có route riêng → `onTitleClick` navigate nếu có quyền — dòng 264–274. `DEFAULT_OPEN_KEYS` mở sẵn 7 submenu để hiển thị toàn cây — dòng 177–184.
- **KHÔNG có filter bar** (không Input/Select/RangePicker; chỉ `ScreenHeader` breadcrumb + mô tả + card chứa `Menu mode="inline"`) ✅ (AC-024-14).
- Ghi chú header file (dòng 11–27) mô tả đúng cấu trúc cha–con C0–C3.

### 2.4 `frontend/src/components/AppLayout.tsx` — sidebar 6 nhóm cấp 1 phẳng + lá KCHT ✅

- `rawMenuItems` — `AppLayout.tsx:215–381`, cấu trúc cấp 1:
  1. `{ key: '/', icon: <DashboardOutlined />, label: 'Danh mục chức năng' }` — dòng 216 (landing, click về màn 6 khối)
  2. `{ key: '/kcht-directory', icon: <ContainerOutlined />, label: 'Quản lý KCHT hàng hải' }` — dòng 219 (**lá đơn** → `/kcht-directory`, thay thế cây submenu 13 thực thể cũ)
  3. `asset-management` "Quản lý tài sản KCHT hàng hải" — dòng 223–233
  4. `planning-operation` "Quản lý quy hoạch & vận hành" — dòng 236–251
  5. `approval` "Phê duyệt" — dòng 254, `disabled: true, title: 'Chưa triển khai'` (khớp AC-024-07; nhóm này chưa có màn hình)
  6. `reports-parent` "Báo cáo thống kê" — dòng 257–366 (gating theo `canAccessMenu('/reports')`)
  7. `system-admin` "Quản trị hệ thống" — dòng 368–380
- 6 nhóm cấp 1 tương ứng 6 khối màn 1 (design-plan §8 quyết định 3); KCHT là **lá đơn không submenu sâu**; giữa các nhóm có `{ type: 'divider' }`. Nhóm con trong asset/planning/reports/system-admin là nhánh con của từng nhóm nghiệp vụ (không phải cây KCHT cũ), vẫn còn submenu sâu ở báo cáo — giữ nguyên hành vi nhóm nghiệp vụ, ngoài phạm vi lá KCHT.
- Permission gating: `canAccessMenu(route)` + `.filter(Boolean)` trên từng nhóm con — các dòng 227–230/240–250/372–377; `filterEmptyChildren(menuItems)` ẩn nhóm hết item hợp lệ — dòng 106–128/382. `MENU_PERMISSION_MAP` — dòng 37–70.
- Selected key: mọi route KCHT/technical (`port`, `berth`, ..., `station`, `kcht-directory`) quy về `selectedKey = '/kcht-directory'` — dòng 191–199; `openKeys` mở đúng nhóm cha theo route — dòng 201–211. Click lá: `handleMenuClick` chỉ navigate key bắt đầu `'/'` — dòng 394–400.
- Tìm kiếm sidebar: `trimmedSearchQuery` = `searchQuery.trim()` — dòng 384–386; `filterMenuByQuery` + `collectOpenableKeys` giữ hành vi AC-024-11/12/13.
- **Menu items là data thuần (key/icon/label/children) — không inline style hardcode** trong vùng sidebar menu.

---

## 3. Theme-token compliance (AC-024-08)

Kiểm tra grep toàn 4 file về hardcode:

- **Home.tsx**: import token từ `../themetokenchk` (`surfaceCard`, `textPrimary`, `fontSizeMd/Lg`, `spaceSm/Md/Lg/Xl`, `actionPrimary`, `radiusXl/Lg`, `shadowMd`, `fontWeightBold`...) — dòng 14–28. Các giá trị số còn lại là: `width: 56, height: 56` (layout box icon, được phép theo AGENTS.md "Layout property được phép dùng số thô") và `margin: 0` (reset chuẩn, không phải spacing token). Không hex, không fontSize/spacing/padding số hardcode.
- **KchtDirectoryPage.tsx**: import token từ `../../themetokenchk` (surface*, text*, actionPrimary, borderDefault, shadowSm, radiusLg/Pill, fontSizeMd/Lg, fontWeightMedium/Bold, spaceSm/Md/Lg/Xl, colors) — dòng 14–38. `LevelBadge` dùng `colors.sidebarBg`, `actionPrimary` + alpha suffix `${actionPrimary}15/40` (token-derived, không hex cứng), `padding: '2px 10px'` (chuẩn Pill Badge Standard bắt buộc từ AGENTS.md). `margin: 0` và `lineHeight: 1.5` là reset/typography layout, không thuộc thang cấm.
- **App.tsx**: không hex/fontSize/margin/padding/borderRadius hardcode nào (grep 0 match).
- **AppLayout.tsx**: vùng **menu/sidebar 2-screen (dòng 37–400)** không hardcode — item menu là data thuần. Các giá trị hex còn tồn tại (dòng 436/444/483/507/526/565/594/610/649/667/677 — `#f0f0f0`, `#273e7c`, `#fff`, `var(--bg-sidebar, #1a3f83)`, `#000`) đều nằm ở vùng **topbar/header/iframe chrome** — code legacy CÓ TRƯỚC đợt 5, ngoài vùng 2-screen menu redesign; ghi nhận là quan sát (pre-existing), KHÔNG phải defect do change này giới thiệu, và không thuộc edit-scope wave này.

Kết luận: phần triển khai mô hình 2 màn hình tuân thủ token discipline; chỉ còn các hex legacy topbar ngoài phạm vi (báo QA wave-2 xem xét nếu oracle AC-024-08 quét toàn file).

---

## 4. Verification đã chạy

| Lệnh | Kết quả |
|---|---|
| `cd frontend && npx --no-install tsc --noEmit` | **Exit 0, no output** (0 lỗi) — toàn bộ 4 file + phần còn lại của project frontend typecheck pass |

GATE-1 (typecheck) đã pass với bằng chứng chạy thực tế ở wave này. Không chạy test runner: wave này là docs-sync xác nhận, không có code mới để test; battery acceptance thuộc QA wave-2 (`qa/acceptance-map.json` — pass_state PENDING).

---

## 5. Đối chiếu success criteria

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Home.tsx render đúng 6 khối (tên/thứ tự) | ✅ `Home.tsx:43–86`, trùng §8.1 + AC-024-01 |
| 2 | App.tsx: `'/'` → HomePage, `'/kcht-directory'` → KchtDirectoryPage | ✅ `App.tsx:145/148`, trong nhánh `AppLayout` (144) |
| 3 | KchtDirectoryPage.tsx: 28 loại theo SO-DO, cấp C0–C3 | ✅ `KchtDirectoryPage.tsx:71–145` (28 node loại; badge C0–C3), khớp ma trận SO-DO + wireframe §3 |
| 4 | AppLayout.tsx: sidebar = 6 nhóm cấp 1 phẳng + lá KCHT `/kcht-directory` | ✅ `AppLayout.tsx:215–381` (landing `'/'` dòng 216 + 6 nhóm; lá KCHT dòng 219) |
| 5 | Không hardcode hex/spacing/font-size (AC-024-08) | ✅ trong vùng triển khai 2-screen; hex legacy topbar AppLayout ngoài phạm vi (mục 3) |
| 6 | `npx --no-install tsc --noEmit` exit 0 | ✅ exit 0, no output |

## 6. Rủi ro / quan sát bàn giao

- **Khối "Phê duyệt" (Home.tsx dòng 80–82) có `route: '/'`** — click khối quay về chính màn 6 khối (self-loop), vì nhóm Phê duyệt chưa có màn hình (sidebar disabled "Chưa triển khai" — `AppLayout.tsx:254`). Khớp tinh thần AC-024-07 nhưng là hành vi "điều hướng không rời màn" — QA wave-2 cần quyết định oracle cho khối này.
- Sidebar vẫn còn submenu nhiều cấp TRONG nhóm báo cáo (reports-chung/kcht/dl/pttv/... cây 3 cấp, `AppLayout.tsx:263–365`) — là cấu trúc nhóm nghiệp vụ báo cáo giữ nguyên, không thuộc cây KCHT cũ bị bỏ. AC-024-03 ("không submenu đa cấp sâu") nếu áp toàn sidebar sẽ va chạm — QA wave-2 cần xác định phạm vi áp oracle.
- 4 file KHÔNG bị sửa bởi wave này (read-only confirm). Hex legacy topbar (`AppLayout.tsx:436–677`) pre-exists, ngoài edit-scope — nếu AC-024-08 yêu cầu toàn file sạch hex, cần work order riêng.
