---
id: F-292
name: Tái cấu trúc menu & điều hướng
slug: tai-cau-truc-menu-navigation
module-id: M-024
status: proposed
classification: local
priority: medium
created: 2026-08-25T09:37:14Z
last-updated: 2026-09-03
locked-fields: []
consumed_by_modules: []
source-paths:
  - frontend/src/store/permissionStore.ts
  - frontend/src/store/permissionStore.test.ts
  - frontend/src/components/AppLayout.tsx
---
# Đặc tả nghiệp vụ: Tái cấu trúc menu & điều hướng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-292
**Module:** M-024 — Tái cấu trúc Menu & Navigation
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước — Use Cases UC-024-xx, Business Rules BR-024-xx, Domain Model đợt 5 — mô hình 2 màn hình: 6 khối → 28 loại KCHT) + `HH_Menu_21-08-2026.xlsx` (hết hiệu lực từ đợt 5) + `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`

> **Trước khi viết:** tài liệu nền của module (M-024 lean spec) đã định nghĩa phần CHUNG — file này CHỈ ghi phần RIÊNG của chức năng, không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Khai báo đầy đủ tại mục 5 dòng 3: chức năng này **không quản lý dữ liệu nghiệp vụ** → không có trường đơn vị, không có chiều ghi, không có ngoại lệ data scope (chi tiết xem lean spec BR-024-11).

---

## 1. Mô tả ngắn

Tái cấu trúc toàn bộ menu & điều hướng hệ thống theo mô hình **2 màn hình** (đợt 5 — triage TRI-1788409709741-75fa, đã chốt với owner):

- **(1) Màn "Danh mục chức năng" (sau đăng nhập):** hiển thị đúng 6 khối — (1) Quản lý KCHT hàng hải; (2) Quản lý tài sản KCHT hàng hải; (3) Quản lý quy hoạch & vận hành; (4) Phê duyệt; (5) Báo cáo thống kê; (6) Quản trị hệ thống — khối (1)(2)(3)(5)(6) là cổng vào một nhóm nghiệp vụ và điều hướng được; riêng khối (4) "Phê duyệt" hiển thị disabled + tooltip "Chưa triển khai", KHÔNG điều hướng (BR-024-08 / AC-024-07); màn KHÔNG có filter bar.
- **(2) Màn "Quản lý KCHT hàng hải" (route `/kcht-directory`):** click khối 1 mở màn liệt kê **đúng 28 loại KCHT** phân cấp cha–con C0–C3 theo `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`: Cảng biển → Bến cảng → Cầu cảng; Cảng biển → Luồng hàng hải → Bến phao / Nhà trạm quản lý vận hành phao tiêu → Phao, tiêu / Đèn biển & nhà trạm / Đê chắn sóng, đê chắn cát, kè; Cảng biển → Khu neo đậu / Khu chuyển tải / Khu tránh, trú bão / Cơ sở sửa chữa, đóng tàu; Hệ thống VTS → Trung tâm điều hành VTS → Trạm Radar / Hệ thống AIS / Hệ thống CCTV / Hệ thống SCADA / Hệ thống truyền dẫn / Hệ thống phụ trợ VTS; Cảng cạn; nhóm "Đài viễn thông hàng hải" (gắn lỏng) → 6 đài/hệ thống (Đài TTDH; Hệ thống VHF; Đài Inmarsat; Đài LRIT; Đài Cospas-Sarsat; Đài TTXLTT Hà Nội); màn KHÔNG có filter bar.
- **Sidebar:** còn **6 nhóm cấp 1 phẳng** (tên trùng 6 khối), KHÔNG submenu đa cấp sâu; mô hình cũ "7 nhóm cấp 1 + nhánh 13 thực thể" hết hiệu lực từ đợt 5.

Chức năng dùng bởi mọi người dùng đã đăng nhập; quyền truy cập từng mục theo phân quyền động (nhóm/tài khoản) hiện có. Không tạo entity mới, không đổi schema.

Bổ sung (đợt 2 — triage TRI-1787823566528-bb3e): **ô tìm kiếm menu sidebar** — input `placeholder="Tìm kiếm"` tại `AppLayout.tsx` dòng 645–647 (state `searchQuery` dòng 237, `onChange` cập nhật state) — người dùng gõ chuỗi lọc nhanh các mục menu theo `label` tiếng Việt qua `filterMenuByQuery` (dòng 200–217) trên `menuItems` sau gating quyền (dòng 572): chuỗi `.trim()` + lowercase trước khi so khớp (VAL-024-06), so khớp chuỗi con không phân biệt hoa/thường; nhánh có con khớp tự mở (`effectiveOpenKeys` dòng 577); xóa chuỗi → menu khôi phục đầy đủ; chỉ thu hẹp hiển thị, không navigate, không gọi API (UC-024-09/10, BR-024-13/14/15, AC-024-11/12/13).

Bổ sung (đợt 3 — triage TRI-1787899754098-59d2): sidebar & header theo chuẩn theme CHK — nền sidebar navy `#1a3f83` (`themetokenchk.sidebarBg` dòng 72), accent tiêu đề `#273e7c` (`themetokenchk.actionPrimary` dòng 36 — áp dụng tại `AppLayout.tsx` dòng 634 sidebar fullscreen và dòng 871 title topbar). Giữ dark-menu, cấu trúc 7 nhóm, phân quyền, ô tìm kiếm. (Cơ chế phân phối token hoàn thiện ở đợt 4 bên dưới.)

Bổ sung (đợt 4 — triage TRI-1787912936669-7a04, C2 solo docs-only): sidebar/header phân phối token qua `themetokenchk.ts` + `ThemeTokenProvider` theo `docs/conventions/chk-theme-standard-architecture.md` — `AppLayout.tsx` import dòng 43–45, wrap Desktop Sider dòng 776 và Mobile Drawer dòng 799 (fallback `var(--bg-sidebar, #1a3f83)` dòng 788): nền sidebar `#1a3f83` (`sidebarBg` dòng 72), `sidebarActiveBg #1B84FF` (dòng 84), `sidebarSearchBg rgba(255,255,255,0.12)` (dòng 87), CSS vars `--bg-sidebar`/`--sidebar-search-bg`/`--sidebar-active-bg` (dòng 484–486), antdTheme Layout/Menu dark tokens (dòng 439–447). `theme.ts` `sidebarBg` REVERT về `#12468C` (dòng 50) cho các màn hình không-CHK.

## 2. Trường dữ liệu

> Chức năng này **không có form nhập liệu nghiệp vụ** (không tạo/sửa bản ghi). Dữ liệu chức năng là **cấu trúc menu cấu hình tĩnh** trong `AppLayout.tsx` (`rawMenuItems` dòng 314) + bảng quyền `MENU_PERMISSION_MAP` dòng 51 — không lưu database. Ô tìm kiếm menu (dòng 645–647) là **input lọc hiển thị, state cục bộ** — không phải form nghiệp vụ, không gửi lên server (BR-292-07). Bảng dưới mô tả các trường cấu hình của một node menu (không phải form):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | `key` | Có | Text — tiếng Anh chuẩn, duy nhất trong cùng cấp; item lá bắt đầu bằng `/` (route) | VAL-024-01 |
| 2 | `label` | Có | Text — tiếng Việt có dấu, không rỗng | VAL-024-02; BR-024-10 |
| 3 | `parentKey` | Có (với item con) | Text — key của node cha; xác lập phân cấp theo ma trận cha–con | BR-024-03 |
| 4 | `route` (item lá) | Có nếu có màn hình | Path tiếng Anh chuẩn, tồn tại trong router | BR-024-08; VAL-024-05 |
| 5 | `permission` | Có nếu có phân quyền | `<resource>:<action>` có trong `MENU_PERMISSION_MAP`; nếu chưa có quyền → item disabled "Chưa triển khai" | BR-024-04; D-1 |
| 6 | `icon` | Không | Icon từ `@ant-design/icons` | — |
| 7 | `searchQuery` (ô tìm kiếm menu) | Không (state cục bộ, mặc định rỗng) | Text — chuỗi tìm kiếm của user; `.trim()` trước khi so khớp `label` (VAL-024-06) | State React trong `AppLayout` (dòng 237, input dòng 645–647); không gửi API, không lưu DB; rỗng → hiển thị toàn bộ menu |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** — menu/điều hướng không phải dữ liệu nghiệp vụ có workflow phê duyệt C1/C2 (phê duyệt chỉ áp dụng cho dữ liệu KCHT trong các module nghiệp vụ).
- Trạng thái duy nhất của chức năng là trạng thái **hiển thị** của item menu, quyết định động theo quyền user: `hiển thị` (có quyền + có route), `ẩn` (thiếu quyền hoặc submenu hết con), `disabled – Chưa triển khai` (item thuộc target menu nhưng chưa có màn hình — BR-024-08). Không lưu trạng thái số xuống database.
- Ô tìm kiếm menu **không làm thay đổi trạng thái hiển thị** của item: chỉ thu hẹp tạm thời tập hiển thị theo từ khóa; bỏ từ khóa → trở về trạng thái hiển thị theo quyền như cũ (BR-292-07).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung ở `ba/00-lean-spec.md` BR-024-xx).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-292-01 | Menu giữ đúng 7 nhóm cấp 1 theo `HH_Menu_21-08-2026.xlsx`; không tự đặt tên/đổi tên nhóm | Hierarchy |
| BR-292-02 | Nhánh "Quản lý cảng biển" hiển thị đủ 13 thực thể KCHT, phân cấp theo chuỗi cha–con ma trận (không phẳng) | Hierarchy |
| BR-292-03 | Mỗi item lá chỉ navigate khi có route thật; item chưa có màn hình hiển thị disabled + tooltip tiếng Việt "Chưa triển khai" — cấm navigate route giả | Navigation |
| BR-292-04 | Item chỉ hiển thị khi user có quyền tương ứng (`canAccessMenu` dòng 110 + `MENU_PERMISSION_MAP` dòng 51, `AppLayout.tsx`); submenu không còn con → ẩn cả nhánh (`filterEmptyChildren`) | Permission |
| BR-292-05 | Mọi permission mới (nếu có) phải seed qua `seedPermission` trong `run()` (`PermissionSeeder.java` dòng 41/726) — quyền động, không gán role | Permission |
| BR-292-06 | Định danh kỹ thuật tiếng Anh, label tiếng Việt có dấu, không hardcode màu/spacing/font-size (theo `theme.ts`/`tokens.ts`) | Naming/UI |
| BR-292-07 | Ô tìm kiếm menu (dòng 645–647) chỉ lọc hiển thị trên `menuItems` sau gating quyền (dòng 572): chuỗi `.trim()` + lowercase trước khi so khớp `label` tiếng Việt (so khớp chuỗi con, không phân biệt hoa/thường); nhánh có con khớp tự mở (`effectiveOpenKeys` dòng 577); submenu hết con khớp → ẩn nhánh (BR-292-04); xóa chuỗi → khôi phục toàn bộ menu; không navigate, không gọi API | Search |
| BR-292-08 | Tìm kiếm không bypass quyền và không phát sinh permission mới — chỉ hiển thị mục user đã có quyền (BR-292-04); không có chiều ghi dữ liệu (thống nhất BR-024-11) | Search / Permission |

### 4.2. Acceptance Criteria kế thừa

- **AC-024-01** — Dashboard 6 khối: trang chủ render đúng 6 khối, mỗi khối có label tiếng Việt; khối (1)(2)(3)(5)(6) điều hướng được, riêng khối (4) "Phê duyệt" hiển thị disabled + tooltip "Chưa triển khai", KHÔNG navigate (BR-024-08 / AC-024-07).
- **AC-024-02** — Sidebar nhánh "Quản lý cảng biển" hiển thị đúng 13 thực thể theo ma trận cha–con (đếm node = 13, quan hệ cha–con đúng chuỗi).
- **AC-024-03** — Đúng 7 nhóm cấp 1 theo tên xlsx (I–VII).
- **AC-024-04** — User thiếu quyền → item ẩn; submenu hết con → ẩn nhánh.
- **AC-024-05** — User có `admin:all`/`*` → thấy toàn bộ menu.
- **AC-024-06** — Click item lá có route → navigate đúng; `selectedKey`/`openKeys` đồng bộ đúng nhánh.
- **AC-024-07** — Item chưa có màn hình → disabled + tooltip, không navigate route giả.
- **AC-024-09** — `cd frontend && npx tsc --noEmit` pass; `mvn compile -DskipTests` pass.
  Khi lỗi: item không hiển thị/vô quyền truy cập → kiểm tra lại `MENU_PERMISSION_MAP` + `hasPermissionFromList` (bypass chỉ qua `admin:all`/`*`/`resource:manage`, không phải `admin:manage`).
- **AC-024-11** — Gõ ` cảng ` (kèm khoảng trắng thừa) → chỉ item có `label` chứa "cảng" sau `.trim()` hiển thị; item không khớp ẩn; submenu hết con khớp → ẩn nhánh; không item ngoài quyền hiển thị.
- **AC-024-12** — Xóa toàn bộ chuỗi (hoặc chuỗi chỉ gồm khoảng trắng) → menu khôi phục đầy đủ như trước khi tìm kiếm (đúng 7 nhóm cấp 1 + item tiện ích theo quyền).
- **AC-024-13** — Gõ từ khóa + Enter / click item khớp → không điều hướng ngoài ý muốn; không phát sinh request API tìm kiếm.

### 4.3. User Stories kế thừa

- **US-024-01:** Là người dùng đã đăng nhập, tôi muốn thấy 6 khối chức năng trên trang chủ để vào nhanh nhóm nghiệp vụ của mình.
- **US-024-02:** Là người dùng có quyền quản lý KCHT, tôi muốn sidebar phân cấp 13 thực thể theo quan hệ cha–con để định vị nhanh màn hình (Cảng biển → Bến cảng → Cầu cảng; Luồng hàng hải → Bến phao/Nhà trạm/Đèn biển/Đê kè...).
- **US-024-03:** Là người dùng không có quyền, tôi muốn menu không hiển thị các chức năng tôi không được dùng.
- **US-024-04:** Là quản trị viên (`admin:all`), tôi muốn thấy toàn bộ menu để quản trị hệ thống.
- **US-024-05:** Là người dùng đã đăng nhập, tôi muốn gõ từ khóa vào ô tìm kiếm menu để lọc nhanh mục cần truy cập và xóa từ khóa để menu trở lại đầy đủ.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem/điều hướng nhóm I — QUẢN LÝ KCHT HÀNG HẢI | `port:read`, `berth:read`, `pier:read`, `navigationchannel:read`, `dikerevetment:read`, `shiprepair:read`, `buoy:read`, `vts:read`, `radarstation:read`, `coastalstation:read`, `specialstation:read`, `dryport:read`, `data:read` (Đèn biển, Nhà trạm phao/tiêu) |
| Xem/điều hướng nhóm II — QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI | `asset:exploitation`, `asset:inventory`, `data:read` (mục khác ẩn/disabled tới khi module tài sản chốt quyền) |
| Xem/điều hướng nhóm III — PHÊ DUYỆT | `<resource>:approve` / `approvec1` / `approvec2` (theo từng loại KCHT) |
| Xem/điều hướng nhóm IV — BÁO CÁO THỐNG KÊ | `report:read` |
| Xem/điều hướng nhóm V — QUẢN LÝ NGƯỜI DÙNG | `user:read`, `orgunit:read`, `group:read`, `admin:view` (Quản lý log truy cập) |
| Xem/điều hướng nhóm VI — QUY HOẠCH & VẬN HÀNH | `document:read` (Văn bản pháp lý), `map:manage` (Biểu tượng bản đồ), `data:read` (danh mục GIS) |
| Xem/điều hướng nhóm VII — TÍCH HỢP | `connection:read` |
| Xem item tiện ích `Cấu hình hệ thống` | `admin:manage` |
| Xem `Trang chủ` | Không cần quyền (mọi user đã đăng nhập) |
| Tìm kiếm menu (ô tìm kiếm sidebar) | Không cần quyền riêng — lọc trên menu đã gating theo quyền hiện có (BR-292-04, BR-292-08) |

**Admin Cục:** không cần quyền menu riêng — Admin Cục nhận full quyền theo tài liệu nền mục 3.8 (qua `orgunit:scope_all`/`admin:all` khi được gán), menu hiển thị theo quyền đã gán; menu không hiển thị metadata người tạo/người sửa (không phải màn dữ liệu) nên không phát sinh quyền xem thông tin nhạy cảm riêng. Ô tìm kiếm menu cũng không phát sinh thêm quyền hay metadata nhạy cảm cho Admin Cục.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có — menu không có trạng thái nghiệp vụ; chỉ có trạng thái hiển thị động theo quyền (hiển thị / ẩn / disabled "Chưa triển khai"), không lưu DB |
| 2 | Có bước phê duyệt không | Không — menu/điều hướng không thuộc luồng phê duyệt C1/C2 của dữ liệu KCHT |
| 3 | Lọc cha-con / theo đơn vị | Không — chức năng không quản lý dữ liệu nghiệp vụ nên không có trường đơn vị, không có chiều ghi, không có ngoại lệ data scope; phân cấp menu theo ma trận cha–con KCHT là cấu trúc hiển thị, không phải lọc theo orgUnit (xem lean spec BR-024-11); ô tìm kiếm chỉ lọc client-side trên menu hiển thị — không quản lý dữ liệu (BR-292-08) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — item menu chỉ hiển thị khi user có quyền tương ứng (BR-292-04); item chưa có màn hình hiển thị disabled "Chưa triển khai" (BR-292-03); ô tìm kiếm hiển thị khi sidebar mở (điều kiện render `!collapsed && !isMenuFullScreen` tại dòng 641 — hiện `collapsed = false` dòng 233, `isMenuFullScreen` dòng 235 không set true → luôn hiển thị) |
| 5 | Quyền riêng | Không phát sinh permission mới (đề xuất — D-4): dùng lại `resource:read` hiện có trong `PermissionSeeder`; nếu SA chốt thêm `menu:view` thì seed qua `seedPermission` trong `run()` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — mô hình 2 màn hình (đợt 5): màn "Danh mục chức năng" 6 khối (sau đăng nhập) + màn route `/kcht-directory` liệt kê 28 loại KCHT phân cấp C0–C3 theo `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`; sidebar 6 nhóm cấp 1 phẳng (không submenu sâu); màn khối + màn danh mục KHÔNG có filter bar; ô tìm kiếm menu giữ từ đợt 2. UI tuân thủ `theme.ts`/`tokens.ts`/`themetokenchk.ts`, không hardcode màu/spacing/font-size; ô tìm kiếm dùng CSS `.sidebar-search` có sẵn (`theme.ts` dòng 418–438 — dùng `var(--sidebar-search-bg)` dòng 289; trong vùng CHK biến override bởi `themetokenchk.themeCssVariables` dòng 485) — không thêm token/class mới |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

> Không có endpoint mới — menu được cấu hình tĩnh ở frontend và gating bằng quyền hiện có (nguồn quyền: JWT `permissions` qua `authStore.ts` `parseJwt` → `permissionStore.ts`). Bảng dưới là đề xuất phương án; SA quyết định giữ tĩnh hay chuyển động.

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| — (không gọi API) | — | Menu tĩnh trong `AppLayout.tsx` (`rawMenuItems` dòng 314) + `MENU_PERMISSION_MAP` dòng 51; quyền lấy từ JWT/profile hiện có — **phương án đề xuất, không thêm endpoint** | (gating theo quyền nghiệp vụ, mục 4.4) |
| — (không gọi API) | — | Tìm kiếm menu: state cục bộ `searchQuery` trong `AppLayout.tsx`, lọc trên `menuItems` (dòng 572) sau gating quyền — không gọi backend (BR-292-07) — **đề xuất BA, SA chốt** | — (không có) |
| GET | `/api/menu` *(chỉ khi SA chốt menu động)* | Trả cây menu theo quyền user (thay cho cấu hình tĩnh) | `*` (authenticated) |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Không có bảng CSDL mới** — chức năng không tạo/sửa dữ liệu nghiệp vụ, không có migration (xem lean spec mục 8: không phát sinh `orgUnitId`/`@Filter`/`@DataScope`). `searchQuery` là state React cục bộ — **không phải cột bảng**, không có migration.

Nếu SA chốt chuyển menu sang **động** (phương án thay thế ở mục 6), đề xuất bảng `menu_item` (🔴 toàn bộ là trường mới): `id` (UUID, PK), `parent_id` (FK, tự tham chiếu — xác lập phân cấp), `label` (varchar, tiếng Việt có dấu), `route_key` (varchar, tiếng Anh), `permission_code` (varchar, nullable), `sort_order` (int), `level` (smallint ≤ 4), `active` (boolean) — **đề xuất BA, SA chốt; không áp dụng nếu giữ menu tĩnh**.
