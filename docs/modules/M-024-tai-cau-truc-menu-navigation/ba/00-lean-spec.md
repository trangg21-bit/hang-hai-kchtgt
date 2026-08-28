---
feature-id: M-024
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---

# M-024 Tái cấu trúc Menu & Navigation — Lean Spec (BA)

> **Nguồn sự thật (đọc cùng tài liệu này):**
> - `HH_Menu_21-08-2026.xlsx` — cây menu mục tiêu: 7 nhóm cấp 1 (I–VII), cấp 2–4.
> - `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` — ma trận cha–con 28 loại KCHT (3–4 lớp).
> - Triage `docs/intel/_intake/TRI-1787631386205-0f2e.json` — done-oracle, edit-target files.
> - Triage `docs/intel/_intake/TRI-1787823566528-bb3e.json` — scope_expansion (C1): chức năng thật cho ô tìm kiếm menu sidebar (input chết `AppLayout.tsx:561–567`, input tại dòng 565).
> - Triage `docs/intel/_intake/TRI-1787899754098-59d2.json` — theme CHK (C2, solo): sidebar/header theo chuẩn `themetokenchk.ts` — code đã implement, tài liệu đồng bộ (đợt 3).
> - Code hiện tại: `frontend/src/components/AppLayout.tsx`, `frontend/src/store/authStore.ts`, `frontend/src/store/permissionStore.ts`, `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java`.

---

## 1. Mô tả ngắn

Tái cấu trúc toàn bộ menu & điều hướng hệ thống theo 2 mô hình:
**(a) Dashboard Grid 6 khối** — trang chủ sau đăng nhập hiển thị đúng 6 khối chức năng, mỗi khối là cổng vào một nhóm nghiệp vụ;
**(b) Sidebar PMS Model (phân cấp)** — thanh menu trái tổ chức theo cây phân cấp 7 nhóm cấp 1, trong đó nhánh "Quản lý cảng biển" hiển thị đúng **13 thực thể KCHT** theo ma trận cha–con (Cảng biển → Bến cảng → Cầu cảng; Luồng hàng hải → Bến phao / Đèn biển / Đê kè / Nhà trạm → Phao tiêu; Cảng biển → Khu neo đậu / Khu chuyển tải / Khu tránh trú bão / CS sửa chữa đóng tàu);
**(c) Tìm kiếm menu sidebar** — ô tìm kiếm ngay dưới header sidebar (`AppLayout.tsx` dòng 561–567, input tại dòng 565 — hiện là input chết, TRI-1787823566528-bb3e) lọc nhanh các mục menu theo `label` tiếng Việt; chuỗi được `.trim()` trước khi so khớp (VAL-024-06); xóa chuỗi → menu khôi phục đầy đủ; chỉ thu hẹp hiển thị, không navigate.

Không tạo entity nghiệp vụ mới, không đổi schema; phạm vi thay đổi của đợt tái cấu trúc nằm trong 4 edit-target files (triage): `AppLayout.tsx`, `authStore.ts`, `permissionStore.ts`, `PermissionSeeder.java`. Đợt bổ sung tìm kiếm menu (TRI-1787823566528-bb3e) giới hạn trong 3 edit-target files: `feature-brief.md`, `AppLayout.tsx`, `AppLayout.test.tsx` — **không** sửa `theme.ts`/`tokens.ts`.

> **Bổ sung (đợt 3 — triage `TRI-1787899754098-59d2`):** các giới hạn edit-scope trên ràng buộc đợt 1/2. Đợt 3 (theme CHK, triage riêng — code đã implement và verify) **ĐÃ thay đổi** `theme.ts` + `AppLayout.tsx`: nền sidebar navy `#1a3f83` (`theme.ts` `sidebarBg` dòng 50, fallback `--bg-sidebar` dòng 287/618/1006 — đồng nhất `themetokenchk.sidebarBg` dòng 72), accent tiêu đề `#273e7c` (`themetokenchk.actionPrimary` dòng 36 — áp dụng tại `AppLayout.tsx` title topbar dòng 632/865); sidebar fullscreen dùng `var(--bg-sidebar, #1a3f83)` (`AppLayout.tsx` dòng 785/799). Giữ nguyên dark-menu, cấu trúc 7 nhóm, phân quyền và ô tìm kiếm menu.

---

## 2. Hiện trạng (đối chiếu code hiện tại với menu mục tiêu)

### 2.1 Cơ chế menu hiện tại

| Thành phần | Vị trí (anchor) | Vai trò |
|---|---|---|
| `MENU_PERMISSION_MAP` | `AppLayout.tsx` dòng 44–84 | Map route → quyền `<resource>:<action>` (hoặc mảng quyền); quyết định item nào hiển thị |
| `canAccessMenu(path)` | `AppLayout.tsx` dòng 86–97 | Gọi `usePermissionStore.hasPermission / hasAnyPermission` để lọc item |
| `rawMenuItems` | `AppLayout.tsx` dòng 222–490 | Cấu trúc menu thủ công (AntD `MenuProps['items']`), label tiếng Việt, key tiếng Anh |
| `filterEmptyChildren` | `AppLayout.tsx` (hàm, sau dòng 490) | Loại submenu rỗng + divider thừa |
| Ô tìm kiếm menu | `AppLayout.tsx` dòng 561–567 (input tại dòng 565) | Input chết: `<input placeholder="Tìm kiếm" />` không có `value`/`onChange`/state/handler — gõ phím không lọc gì; render khi `!collapsed && !isMenuFullScreen` (`collapsed = false` hardcode dòng 149; `isMenuFullScreen` dòng 151 không bao giờ set true) → luôn hiển thị khi sidebar mở; CSS `.sidebar-search` đã có sẵn (`theme.ts` dòng 412–435) |
| `normalizePermissionKey` | `permissionStore.ts` dòng 20–52 | Chuẩn hóa key quyền (dot-notation → `<resource>:<action>`) |
| `.map((permission) => normalizePermissionKey(permission.trim()))` | `permissionStore.ts` dòng 61 | Build `Set` quyền; hỗ trợ `*`, `admin:all`, `resource:manage`, `resource:*`, `resource:write` |
| `hasPermissionFromList` | `permissionStore.ts` dòng 55–95 | Logic bypass quyền (quản trị) |
| `useAuthStore` / `parseJwt` | `authStore.ts` (symbol `parseJwt`) | Lấy `permissions` từ JWT khi đăng nhập / renew token |
| `run()` + `seedPermission(...)` | `PermissionSeeder.java` dòng 41 / dòng 726 | Seed quyền động theo nhóm/tài khoản; không gán role |

### 2.2 Cấu trúc menu hiện tại (`rawMenuItems`, `AppLayout.tsx` dòng 222)

1. `Trang chủ` (`/`)
2. `Quản trị hệ thống` — `/users`, `/organizations`, `/groups`, `/interconnect`, `/logs`
3. (Ẩn) `Quản lý KCHT trên nền bản đồ (GIS)` — block comment
4. `Báo hiệu hàng hải` — `Nhà trạm Phao, tiêu` → `/buoys`; `/beacon-stations`
5. `Quản lý KCHT Hàng Hải` — `Quản lý cảng biển` → `Quản lý bến cảng` → `/pier`; `/dry-port`; `/water-zone`
6. (Ẩn) `Biến động tài sản` — block comment
7. `Văn bản & Sự cố` — `/documents/legal`, `/documents/incidents`, `/documents/port-planning`
8. `Khu nước & VTS` — `/navigation-channel`, `/dike-revetment`, `/ship-repair-facility`, `/radar-station`, `/vts-system`
9. `Đài duyên hải & Vệ tinh` — `/station/coastal`, `/station/special`
10. (Ẩn) `BÁO CÁO THỐNG KÊ` — block comment (chứa sẵn ~60 mục báo cáo F-141..F-189)
11. `/connections` (Liên thông dữ liệu), `/symbols` (biểu tượng bản đồ), `/settings` (Cấu hình hệ thống)

### 2.3 Sai lệch so với menu mục tiêu `HH_Menu_21-08-2026.xlsx` (bắt buộc khắc phục)

| # | Sai lệch | Chi tiết |
|---|---|---|
| D1 | **Chỉ ~9 nhóm cấp 1, không đúng 7 nhóm** | Target: I. QUẢN LÝ KCHT HÀNG HẢI, II. QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI, III. PHÊ DUYỆT, IV. BÁO CÁO THỐNG KÊ, V. QUẢN LÝ NGƯỜI DÙNG, VI. QUẢN LÝ QUY HOẠCH & VẬN HÀNH, VII. TÍCH HỢP |
| D2 | **13 thực thể KCHT phân tán** | `/port /berth /pier` nằm dưới `Quản lý KCHT Hàng Hải`; `navigation-channel / dike-revetment / ship-repair-facility / radar-station / vts-system` nằm dưới `Khu nước & VTS`; beacon nằm dưới `Báo hiệu hàng hải` — target: gom về 1 nhánh phân cấp theo ma trận cha–con |
| D3 | **Thiếu 4 thực thể KCHT** | `Bến phao`, `Khu neo đậu`, `Khu chuyển tải`, `Khu tránh/trú bão` chưa có route/quyền/item nào (M-003 chưa có feature tương ứng) — xem Decision Point D-1 |
| D4 | **Nhóm II (Tài sản) gần như vắng** | `asset-increase/decrease/inventory/exploitation` đang bị ẩn (block comment); target có `Tài sản cảng biển, Tài sản bến cảng, ... , Kiểm kê & Xử lý` |
| D5 | **Nhóm III (Phê duyệt) hoàn toàn vắng** | Không có menu duyệt nào; target có `Duyệt Bến cảng, Duyệt Cầu cảng, ..., Duyệt cảng cạn, Duyệt sản lượng cảng biển` |
| D6 | **Nhóm IV (Báo cáo) đang ẩn** | Block comment chứa đủ cây báo cáo (F-141..F-189); xlsx ghi "(giữ nguyên)" — cần restore |
| D7 | **Nhóm V (Người dùng) nằm sai chỗ** | `/users /organizations /groups /logs` đang dưới `Quản trị hệ thống`; target tách thành nhóm riêng `QUẢN LÝ NGƯỜI DÙNG` (Quản lý đơn vị, Quản lý nhóm người dùng, Quản lý người dùng, Quản lý log truy cập); `/interconnect` phải chuyển sang nhóm VII |
| D8 | **Nhóm VI (Quy hoạch & Vận hành) thiếu mục** | Target có: Quản lý quy hoạch, thông tin vận hành khai thác, bảo trì, sự cố, KCHT trên bản đồ, biểu tượng bản đồ, danh mục đối tượng điểm/đường/vùng, văn bản pháp lý, hồ sơ — hiện tại `/documents/legal` nằm dưới `Văn bản & Sự cố`, GIS bị ẩn |
| D9 | **Nhóm VII (Tích hợp) phân tán** | `/connections` là item phẳng; `/interconnect` nằm dưới `Quản trị hệ thống`; target: Quản lý kết nối liên thông chia sẻ dữ liệu + Tích hợp mảnh hải đồ điện tử + Tích hợp bản đồ quy hoạch cảng biển |
| D10 | **VTS subtree chưa đủ cấp** | Target: `Hệ thống VTS → Thông tin hệ thống VTS`; `Trung tâm điều hành VTS → Thông tin TT ĐHVTS, Radar, AIS, CCTV, SCADA, Truyền dẫn, Phụ trợ VTS, VHF, Đài TT duyên hải, Inmarsat, Sarsat, LRIT, Trung tâm xử lý TT` (13 mục cấp 4) |
| D11 | **`/water-zone` (Quản lý vùng nước) không có trong target** | Target tách 3 Khu (neo đậu/chuyển tải/tránh trú bão) thành mục riêng; `/water-zone` giữ hay bỏ do SA chốt (D-1) |
| D12 | **Menu phụ sinh tồn** | `Trang chủ` (`/`), `Cấu hình hệ thống` (`/settings`) không nằm trong 7 nhóm xlsx — đề xuất giữ là item tiện ích ngoài 7 nhóm (D-3) |

### 2.4 Ô tìm kiếm menu (hiện trạng — input chết)

- `AppLayout.tsx` dòng 561–567: ô tìm kiếm dạng pill hiển thị ngay dưới header sidebar, chỉ chứa icon `SearchOutlined` + `<input placeholder="Tìm kiếm" />` (dòng 565) — **không có `value`/`onChange`/state/handler** → gõ phím không lọc gì (input chết; xác nhận bởi triage TRI-1787823566528-bb3e seam_claims dòng 562/565).
- Điều kiện render `{!collapsed && !isMenuFullScreen && (...)}` (dòng 562): `collapsed` hardcode `false` (dòng 149), `isMenuFullScreen` khai báo (dòng 151) nhưng không bao giờ set `true` → ô tìm kiếm **luôn hiển thị** khi sidebar mở.
- CSS `.sidebar-search` **đã tồn tại** (`theme.ts` dòng 412–435, dùng token `--sidebar-search-bg`) — không cần thay đổi `theme.ts`/`tokens.ts`.
- Điểm chèn bộ lọc: `AppLayout.tsx` dòng 498 `const menuItems = filterEmptyChildren(rawMenuItems);` — lọc tại đây (sau gating quyền, trước khi render `<Menu items={menuItems}>`).

---

## 3. Actors, trigger, preconditions

| Actor | Mô tả |
|---|---|
| Người dùng đã đăng nhập (các vai trò/phân quyền động theo nhóm & tài khoản) | Duyệt menu, điều hướng chức năng, gõ tìm kiếm menu |
| Quản trị hệ thống (`ROLE_SYSTEM_ADMIN`, `admin:all`, `*`) | Thấy toàn bộ menu (bypass qua `hasPermissionFromList`) |
| Admin Cục | Full quyền theo tài liệu nền mục 3.8 — thấy toàn bộ menu nghiệp vụ |

- **Trigger:** user đăng nhập thành công → vào Dashboard Grid 6 khối; user click khối hoặc mở sidebar → duyệt cây menu; **user gõ chuỗi vào ô tìm kiếm menu → lọc nhanh mục menu theo `label` (UC-024-09)**.
- **Preconditions:** user có token hợp lệ (JWT chứa `permissions` — `authStore.ts` `parseJwt`); `permissionStore` đã đồng bộ quyền (subscribe `useAuthStore`); quyền được seed trong DB qua `PermissionSeeder.run()`.

---

## 4. Use Cases

| ID | Use Case | Luồng chính |
|---|---|---|
| UC-024-01 | Xem Dashboard Grid 6 khối | User đăng nhập → trang chủ render đúng 6 khối chức năng; mỗi khối có label tiếng Việt, là entry điều hướng |
| UC-024-02 | Vào nhóm qua khối Dashboard | User click khối "Quản lý KCHT hàng hải" → điều hướng tới màn hình đầu của nhóm; sidebar đồng bộ mở nhánh tương ứng |
| UC-024-03 | Duyệt sidebar phân cấp | User mở sidebar → thấy 7 nhóm cấp 1; mở nhánh "Quản lý cảng biển" → thấy cây 13 thực thể theo ma trận cha–con |
| UC-024-04 | Điều hướng tới màn hình con | User click item lá (có route) → navigate đúng route; `selectedKey`/`openKeys` cập nhật đúng nhánh (logic hiện có `useEffect` theo `selectedKey`) |
| UC-024-05 | Menu theo quyền | User thiếu quyền `port:read` → không thấy item Cảng biển; submenu không còn con hợp lệ → tự ẩn (`filterEmptyChildren`) |
| UC-024-06 | Quản trị thấy toàn bộ | User có `admin:all`/`*` → thấy mọi item bất kể quyền chi tiết (`hasPermissionFromList` dòng 55–95) |
| UC-024-07 | Item chưa có màn hình | Item thuộc target (xlsx) nhưng chưa có route/màn hình → hiển thị trạng thái "chưa triển khai" (disabled + tooltip), KHÔNG navigate tới route giả (D-1) |
| UC-024-08 | Deep link không hợp lệ | User truy cập trực tiếp URL thiếu quyền → backend trả 403 (không phụ thuộc việc ẩn menu frontend) |
| UC-024-09 | Tìm kiếm menu sidebar | User gõ chuỗi vào ô tìm kiếm (`AppLayout.tsx` dòng 565) → chuỗi được `.trim()` (VAL-024-06) → menu lọc theo `label` tiếng Việt chứa chuỗi (so khớp chuỗi con, không phân biệt hoa/thường); item không khớp ẩn; submenu hết con khớp → ẩn nhánh (thống nhất BR-024-04); không navigate, không gọi API |
| UC-024-10 | Khôi phục menu khi xóa chuỗi tìm kiếm | User xóa toàn bộ chuỗi (hoặc chuỗi chỉ gồm khoảng trắng — sau `.trim()` rỗng) → menu khôi phục đầy đủ theo quyền như trước khi tìm kiếm (đúng 7 nhóm cấp 1 + item tiện ích); không có side effect điều hướng |

---

## 5. Business Rules (BR-024-xx)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-024-01 | Menu có đúng **7 nhóm cấp 1** theo `HH_Menu_21-08-2026.xlsx` (I–VII); không thêm/bớt/đổi tên nhóm so với file | Hierarchy |
| BR-024-02 | Nhánh **"Quản lý cảng biển"** hiển thị đúng **13 thực thể KCHT** thuộc cây con của Cảng biển theo ma trận cha–con (`SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` mục 2): Cảng biển, Bến cảng, Cầu cảng, Bến phao, Luồng hàng hải, Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão, CS sửa chữa/đóng tàu, Đèn biển + nhà trạm, Đê/kè, Nhà trạm phao/tiêu, Phao tiêu | Hierarchy |
| BR-024-03 | Phân cấp menu theo **chuỗi cha–con của ma trận** (không phân cấp phẳng): `Cảng biển → Bến cảng → Cầu cảng`; `Cảng biển → Luồng hàng hải → {Bến phao, Đèn biển + nhà trạm, Đê/kè, Nhà trạm phao/tiêu → Phao tiêu}`; `Cảng biển → {Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão, CS sửa chữa/đóng tàu}` | Hierarchy |
| BR-024-04 | Mọi item menu gated bởi `canAccessMenu` + `MENU_PERMISSION_MAP` (`AppLayout.tsx` dòng 44–97): thiếu quyền → item ẩn; submenu hết con hợp lệ → ẩn cả nhánh | Permission |
| BR-024-05 | Bypass quyền chỉ qua `admin:all` / `*` / `resource:manage` / `resource:*` / `resource:write` (cho create/update/delete) — logic chuẩn hóa và kiểm tra nằm trong `permissionStore.ts` (`normalizePermissionKey` dòng 20–52, `hasPermissionFromList` dòng 55–95); `admin:manage` KHÔNG phải toàn quyền | Permission |
| BR-024-06 | Dashboard hiển thị **đúng 6 khối** (done-oracle); mỗi khối là cổng vào một nhóm chức năng; click khối → điều hướng + đồng bộ sidebar | Dashboard |
| BR-024-07 | Sidebar phân cấp (hierarchical PMS Model); giữ trạng thái mở/đóng submenu đồng bộ với route hiện tại (mở rộng logic `setOpenKeys` theo `selectedKey` hiện có) | Navigation |
| BR-024-08 | Item chưa có màn hình/route thật KHÔNG được navigate tới route giả hoặc dữ liệu placeholder — render disabled với tooltip tiếng Việt "Chưa triển khai" (nguyên tắc Data thật, không gán mặc định) | Navigation |
| BR-024-09 | Mọi permission mới phải khai qua `seedPermission(definitions, resource, action, name, description)` trong `run()` (`PermissionSeeder.java` dòng 41, 726) — quyền động theo nhóm/tài khoản, KHÔNG có bước gán role | Permission |
| BR-024-10 | Định danh kỹ thuật (key, route, resource) bằng tiếng Anh chuẩn; label/message/tooltip bằng tiếng Việt có dấu; không hardcode màu/spacing/font-size — UI theo `theme.ts` + `tokens.ts` | Naming |
| BR-024-11 | Module này KHÔNG tạo entity nghiệp vụ mới → không phát sinh `orgUnitId` / `@Filter(orgUnitFilter)` / `@DataScope`; menu không lọc theo đơn vị, không phải dữ liệu nghiệp vụ có scope | Data scope |
| BR-024-12 | An ninh điều hướng không chỉ dựa vào ẩn menu: route trực tiếp (deep link) vẫn bị backend chặn 403 khi thiếu quyền | Security |
| BR-024-13 | Ô tìm kiếm menu chỉ **lọc hiển thị** trên cây menu đã gating quyền (`menuItems` tại `AppLayout.tsx` dòng 498) — không navigate, không gọi API, không đổi dữ liệu; chuỗi nhập phải `.trim()` trước khi so khớp (VAL-024-06) | Search |
| BR-024-14 | Item được giữ khi `label` (tiếng Việt) chứa chuỗi tìm kiếm sau `.trim()` (so khớp chuỗi con, không phân biệt hoa/thường); submenu giữ nguyên nếu có ≥ 1 con được giữ, hết con khớp → ẩn nhánh (thống nhất BR-024-04); chuỗi rỗng/whitespace → hiển thị toàn bộ menu (khôi phục). **Đề xuất BA — xác nhận hành vi cha/con tại D-5 (SA chốt)** | Search |
| BR-024-15 | Tìm kiếm **không bypass quyền**: chỉ lọc trên tập item đã qua `canAccessMenu`/`filterEmptyChildren` — user không bao giờ thấy item ngoài quyền qua tìm kiếm | Search / Permission |

---

## 6. Domain Model — cây menu mục tiêu

### 6.1 Bảy nhóm cấp 1 (nguồn: `HH_Menu_21-08-2026.xlsx` mục "Phân cấp menu")

| # | Nhóm cấp 1 (label tiếng Việt) | Cấp 2 tiêu biểu | Cấp 3–4 |
|---|---|---|---|
| I | QUẢN LÝ KCHT HÀNG HẢI | 13 thực thể KCHT (xem 6.2) + Hệ thống VTS + Thông tin cảng cạn | Cầu cảng; Nhà trạm/Phao tiêu; VTS → TT điều hành → 13 mục cấp 4 |
| II | QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI | Tài sản cảng biển, Tài sản bến cảng, ..., Tài sản cảng cạn, Kiểm kê & Xử lý | Tài sản cầu cảng; Tài sản nhà trạm / phao tiêu; Tài sản TT ĐHVTS → 14 mục |
| III | PHÊ DUYỆT | Duyệt Bến cảng, Duyệt Bến phao, ..., Duyệt cảng cạn, Duyệt sản lượng cảng biển | Duyệt Cầu cảng; Duyệt Nhà trạm / Phao tiêu; Duyệt TT ĐHVTS → 12 mục |
| IV | BÁO CÁO THỐNG KÊ | (giữ nguyên cây báo cáo hiện có F-141..F-189 trong block comment) | các nhóm chỉ tiêu |
| V | QUẢN LÝ NGƯỜI DÙNG | Quản lý đơn vị, Quản lý nhóm người dùng, Quản lý người dùng, Quản lý log truy cập | — |
| VI | QUẢN LÝ QUY HOẠCH & VẬN HÀNH | Quản lý quy hoạch, thông tin vận hành khai thác, bảo trì, sự cố, KCHT trên bản đồ, biểu tượng bản đồ, danh mục đối tượng điểm/đường/vùng, văn bản pháp lý, hồ sơ | — |
| VII | TÍCH HỢP | Quản lý kết nối liên thông chia sẻ dữ liệu, Tích hợp các mảnh hải đồ điện tử, Tích hợp bản đồ quy hoạch cảng biển | — |

### 6.2 Nhánh "Quản lý cảng biển" — 13 thực thể (done-oracle)

Phân cấp theo ma trận cha–con (`SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` mục 2 — chuỗi 3–4 lớp):

```mermaid
flowchart TD
    QLCB["Quản lý cảng biển"]
    QLCB --> CB["Cảng biển"]
    QLCB --> BC["Bến cảng"]
    BC --> CC["Cầu cảng"]
    QLCB --> LHH["Luồng hàng hải"]
    LHH --> BP["Bến phao"]
    LHH --> DBNT["Đèn biển + nhà trạm gắn đèn"]
    LHH --> DK["Đê/kè"]
    LHH --> NTPT["Nhà trạm phao/tiêu"]
    NTPT --> PT["Phao tiêu"]
    QLCB --> KND["Khu neo đậu"]
    QLCB --> KCT["Khu chuyển tải"]
    QLCB --> KTTB["Khu tránh/trú bão"]
    QLCB --> CSSC["CS sửa chữa/đóng tàu"]
```

Bảng ánh xạ route/quyền hiện có (đề xuất BA — SA chốt):

| # | Thực thể | Route đề xuất | Quyền (tồn tại trong `PermissionSeeder`) | Trạng thái route |
|---|---|---|---|---|
| 1 | Cảng biển | `/port` | `port:read` (dòng 182) | Có |
| 2 | Bến cảng | `/berth` | `berth:read` | Có |
| 3 | Cầu cảng | `/pier` | `pier:read` (dòng 190–195) | Có |
| 4 | Luồng hàng hải | `/navigation-channel` | `navigationchannel:read` | Có |
| 5 | Bến phao | *(chưa có)* | *(chưa có)* | **Chưa có — D-1** |
| 6 | Khu neo đậu | *(chưa có)* | *(chưa có)* | **Chưa có — D-1** |
| 7 | Khu chuyển tải | *(chưa có)* | *(chưa có)* | **Chưa có — D-1** |
| 8 | Khu tránh/trú bão | *(chưa có)* | *(chưa có)* | **Chưa có — D-1** |
| 9 | CS sửa chữa/đóng tàu | `/ship-repair-facility` | `shiprepair:read` | Có |
| 10 | Đèn biển + nhà trạm gắn đèn | `/beacon-stations` | `data:read` (map hiện tại) | Có |
| 11 | Đê/kè | `/dike-revetment` | `dikerevetment:read` | Có |
| 12 | Nhà trạm phao/tiêu | `/buoy-station` | `data:read` | Có |
| 13 | Phao tiêu | `/buoys` | `buoy:read` (dòng 449) | Có |

### 6.3 Nhánh VTS (cấp 2–4 theo xlsx)

- `Hệ thống VTS` → `Thông tin hệ thống VTS` (`/vts-system`, `vts:read`)
- `Hệ thống VTS` → `Trung tâm điều hành VTS` → cấp 4: Thông tin TT ĐHVTS, Radar (`/radar-station`, `radarstation:read`), AIS, CCTV, SCADA, Truyền dẫn, Phụ trợ VTS, VHF, Đài TT duyên hải (`/station/coastal`, `coastalstation:read`), Inmarsat (`/station/special`, `specialstation:read`), Sarsat, LRIT, Trung tâm xử lý TT.
- Ghi chú: các mục cấp 4 ngoài Radar/Đài duyên hải/Inmarsat chưa có route — áp dụng BR-024-08 (hiển thị trạng thái chưa triển khai).

### 6.4 Dashboard Grid 6 khối

- Trang chủ (`/`) render **đúng 6 khối** (đếm được = 6) — done-oracle.
- Mỗi khối: label tiếng Việt của một nhóm chức năng + biểu tượng (icon theo thư viện hiện có), là entry điều hướng.
- **Đề xuất BA:** 6 khối = nhóm I–VI; nhóm VII (TÍCH HỢP) chỉ hiển thị trong sidebar. *(Nếu photo mockup `docs/inputs/photo_2026-07-09_15-47-20.jpg` quy định ánh xạ khác, PMO/SA chốt lại — xem D-2.)*

### 6.5 Phân quyền menu (ánh xạ route → quyền mục tiêu)

| Nhóm | Route | Quyền |
|---|---|---|
| I (KCHT) | `/port /berth /pier /navigation-channel /dike-revetment /ship-repair-facility /beacon-stations /buoy-station /buoys /vts-system /radar-station /station/coastal /station/special /dry-port` | `port:read`, `berth:read`, `pier:read`, `navigationchannel:read`, `dikerevetment:read`, `shiprepair:read`, `data:read`, `buoy:read`, `vts:read`, `radarstation:read`, `coastalstation:read`, `specialstation:read`, `dryport:read` |
| II (Tài sản) | `/asset/increase /asset/decrease /asset/inventory /asset/exploitation` (+ mục mới theo module tài sản) | `data:read` hiện tại; tách `asset:*` khi module chốt |
| III (Phê duyệt) | *(màn hình duyệt theo module sở hữu)* | `<resource>:approve` / `approvec1` / `approvec2` |
| IV (Báo cáo) | `/reports`, `/reports/F-*` | `report:read` |
| V (Người dùng) | `/users /organizations /groups /logs` | `user:read`, `orgunit:read`, `group:read`, `admin:view` (log) |
| VI (Quy hoạch & Vận hành) | `/documents/legal /symbols /gis/*` (+ mục mới) | `document:read`, `map:manage`, `data:read` |
| VII (Tích hợp) | `/connections /interconnect` | `connection:read` |
| Tiện ích | `/` (Trang chủ), `/settings` | Không cần quyền / `admin:manage` |

---

## 7. Validation rules

| ID | Quy tắc kiểm tra | Mục đích |
|---|---|---|
| VAL-024-01 | Mỗi item có `key` duy nhất trong cùng cấp; key lá bắt đầu bằng `/` (route) hoặc là key định danh submenu tiếng Anh | Tránh trùng key, hỏng `selectedKeys` |
| VAL-024-02 | `label` không rỗng, tiếng Việt có dấu; `key`/`resource`/route tiếng Anh chuẩn (không transliterated Vietnamese) | Quy ước đa ngôn ngữ |
| VAL-024-03 | Cấp sâu tối đa = 4 (nhóm cấp 1 → cấp 4 theo xlsx); nhánh Quản lý cảng biển tuân thủ BR-024-03 | Đúng phân cấp target |
| VAL-024-04 | Mọi item lá có phân quyền phải có entry trong `MENU_PERMISSION_MAP`; item không có quyền (chưa triển khai) phải render disabled theo BR-024-08 | Không có đường đi vô quyền |
| VAL-024-05 | Sau khi build menu, không còn item nào tham chiếu route không tồn tại (trừ trạng thái disabled); không hardcode màu/spacing trong cấu trúc menu | Chống link hỏng / vi phạm UI convention |
| VAL-024-06 | Chuỗi nhập liệu (nếu có, ví dụ ô tìm kiếm menu) phải `.trim()` trước khi dùng | Quy tắc xử lý input chung |

---

## 8. Data scope & phân quyền (tuyên bố đầy đủ)

- **Không cần entity mới** (BR-024-11): module là tái cấu trúc menu/điều hướng, không quản lý dữ liệu nghiệp vụ → không phát sinh `orgUnitId`, `@Filter(orgUnitFilter)`, `@DataScope`, không có chiều ghi dữ liệu, không có migration/backfill.
- Menu KHÔNG lọc theo đơn vị; phân cấp menu theo ma trận cha–con KCHT là **cấu trúc hiển thị**, không phải data scope.
- **Ô tìm kiếm menu** là lọc client-side trên cấu trúc menu hiển thị — không phải dữ liệu nghiệp vụ, không phát sinh trường đơn vị / chiều ghi / ngoại lệ data scope (thống nhất BR-024-11; khai báo mục 5 dòng 3 của F-292).
- Phân quyền menu: dynamic theo nhóm/tài khoản (quyền từ JWT → `permissionStore`); mọi permission mới seed qua `seedPermission` trong `run()` (BR-024-09). Module này dự kiến KHÔNG cần permission mới (dùng lại `resource:read` hiện có); nếu SA chốt thêm `menu:view` thì bắt buộc seed — xem Decision Point D-4.

---

## 9. Decision Points (BA mở, chờ PMO/SA chốt)

| ID | Câu hỏi | Phương án đề xuất | Owner |
|---|---|---|---|
| D-1 | Route cho 4 thực thể chưa có màn hình (Bến phao, Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão) | (a) Render item disabled "Chưa triển khai" theo BR-024-08 (giữ 13 mục cho done-oracle); (b) bỏ item cho tới khi module có màn hình — vi phạm oracle; (c) tạo route mới trong scope module KCHT tương ứng (M-003) — ngoài edit-scope của M-024. **Đề xuất (a)** | PMO + SA |
| D-2 | Ánh xạ 6 khối Dashboard | Đề xuất: nhóm I–VI; TÍCH HỢP chỉ ở sidebar. Cần đối chiếu `docs/inputs/photo_2026-07-09_15-47-20.jpg` (file ảnh — session này không đọc được nội dung hình, chỉ nhận base64) | PMO |
| D-3 | Vị trí item tiện ích (`Trang chủ`, `Cấu hình hệ thống`) | Giữ ngoài 7 nhóm (đầu/cuối sidebar) — không đổi tên nhóm xlsx | SA |
| D-4 | Có cần permission `menu:view` mới không | Đề xuất KHÔNG — dùng quyền nghiệp vụ hiện có để gating; tránh phình cây quyền. Nếu cần, seed qua `seedPermission` | SA + PMO |
| D-5 | Tìm kiếm menu: item cha không khớp từ khóa nhưng có ≥ 1 con khớp — giữ hay ẩn? | (a) Giữ item cha để con khớp còn đường điều hướng (submenu thu hẹp theo các con khớp) — **đề xuất (a)**, thống nhất BR-024-04; (b) chỉ giữ item tự khớp → con mồ côi, không truy cập được qua tìm kiếm | SA |

---

## 10. Acceptance Criteria (observable — verifier có thể chạy)

| ID | Given | When | Then |
|---|---|---|---|
| AC-024-01 | User đăng nhập với quyền ≥ 1 chức năng | Trang chủ (`/`) render | Dashboard hiển thị **đúng 6 khối** (đếm phần tử grid = 6); mỗi khối có label tiếng Việt và điều hướng được |
| AC-024-02 | User có quyền truy cập nhóm KCHT (vd `port:read`, `navigationchannel:read`) | Mở sidebar nhánh "Quản lý cảng biển" | Hiển thị cây đúng **13 thực thể** theo BR-024-02/03 (đếm node = 13; quan hệ cha–con đúng chuỗi ma trận) |
| AC-024-03 | Mọi user | Mở sidebar | Đúng 7 nhóm cấp 1 theo tên xlsx (I–VII) + item tiện ích theo D-3 |
| AC-024-04 | User thiếu `port:read` | Mở sidebar nhánh KCHT | Không thấy item Cảng biển; nếu submenu hết con hợp lệ → ẩn cả nhánh (filterEmptyChildren) |
| AC-024-05 | User có `admin:all` (hoặc `*`) | Mở sidebar | Thấy toàn bộ menu bất kể quyền chi tiết |
| AC-024-06 | User click item lá có route | Click `/navigation-channel` | Navigate đúng route; `selectedKey` + `openKeys` mở đúng nhánh (không lạc nhánh) |
| AC-024-07 | Item chưa có màn hình (D-1 phương án a) | Hover item | Hiển thị disabled + tooltip tiếng Việt "Chưa triển khai"; KHÔNG navigate tới route giả |
| AC-024-08 | — | Kiểm tra tĩnh | Key/route/resource tiếng Anh chuẩn; label tiếng Việt có dấu; không hardcode hex/spacing/font-size trong menu |
| AC-024-09 | — | Chạy verification | `cd frontend && npx tsc --noEmit` pass; `mvn compile -DskipTests` pass (theo triage) |
| AC-024-10 | Permission mới được thêm (nếu D-4 = có) | Khởi động backend | Permission xuất hiện trong DB qua `seedPermission` trong `run()`; không gán role |
| AC-024-11 | Menu hiển thị theo quyền user (vd user có `port:read`, `navigationchannel:read`) | Gõ ` cảng ` (kèm khoảng trắng thừa) vào ô tìm kiếm menu | Chỉ các item có `label` chứa "cảng" sau `.trim()` hiển thị (so khớp chuỗi con, không phân biệt hoa/thường — BR-024-14); item không khớp ẩn; submenu hết con khớp → ẩn nhánh; không item nào ngoài quyền hiển thị (BR-024-15) |
| AC-024-12 | User đang xem menu đã bị lọc bởi từ khóa | Xóa toàn bộ chuỗi (hoặc chuỗi chỉ gồm khoảng trắng) | Menu khôi phục đầy đủ như trước khi tìm kiếm: đúng 7 nhóm cấp 1 + item tiện ích theo quyền (đếm nhóm = 7) |
| AC-024-13 | User gõ từ khóa bất kỳ | Gõ từ khóa + nhấn Enter (hoặc click item khớp) | Tìm kiếm không gây điều hướng ngoài ý muốn (chỉ click item lá navigate như AC-024-06); không phát sinh request API tìm kiếm |

---

## 11. Out of scope

- KHÔNG sửa màn hình nghiệp vụ các module khác (PortPage, BerthPage, ...) — chỉ 4 edit-target files.
- KHÔNG tạo entity/bảng/migration mới.
- KHÔNG thiết kế lại visual theme (giữ `theme.ts`/`tokens.ts` hiện tại) — CSS `.sidebar-search` đã có (dòng 412–435).
- *Ngoại lệ đợt 3 (triage `TRI-1787899754098-59d2`):* triage riêng đã điều chỉnh màu sidebar/header theo chuẩn theme CHK — `theme.ts` `sidebarBg` `#12468C` → `#1a3f83` (dòng 50), fallback `--bg-sidebar` → `#1a3f83` (dòng 287/618/1006); `AppLayout.tsx` title topbar accent `#273e7c` (dòng 632/865), sidebar fullscreen `#1a3f83` (dòng 785/799). Câu trên ràng buộc phạm vi đợt 1/2, không áp dụng cho đợt 3.
- KHÔNG thêm test scenario ở đây (thuộc QA stage).
