# M-024 Tái cấu trúc Menu & Navigation — QA Report W1 (Acceptance Oracle)

- **Module / Feature:** M-024 / F-292 — Tái cấu trúc menu & điều hướng
- **Stage:** engineering-qa-engineer — **WAVE-1 (oracle authoring)**
- **Ngày:** 2026-08-25
- **Trạng thái:** Oracle sẵn sàng cho wave-2 thực thi; **wave-1 KHÔNG chạy build/test** (theo triage `TRI-1787631386205-0f2e.json` — verification thuộc wave-2).
- **Nguồn sự thật:** `ba/00-lean-spec.md` (UC-024-01..08, BR-024-01..12, VAL-024-01..06, AC-024-01..10), `_features/F-292-tai-cau-truc-menu-navigation/feature-brief.md`, `design/00-design-plan.md` (D-1..D-4, work orders WO-BE-1 + WO-FE-1..6, §4.4 route→permission map), triage JSON.

> **Quy ước anchor:** mọi khẳng định về hành vi HIỆN TẠI đều kèm token `Basename.ext:line` (backtick) + tên symbol, symbol nằm trong ±5 dòng của anchor — toàn bộ anchor trong tài liệu này đã được verify bằng grep trực tiếp trên file thật trong session wave-1 (xem mục 6). Mục **NEW** = đề xuất/thiết kế mới, chưa tồn tại hôm nay.

---

## 1. Mục đích

Cung cấp **acceptance oracle chạy được** cho wave-2: bộ test case quan sát được (observable) ánh xạ từng acceptance criterion của M-024, kèm oracle (điều kiện pass/fail), anchor bằng chứng, lệnh verify chính thức và các trường hợp âm tính/boundary có rủi ro cao. Wave-2 thực thi oracle này trên code sau khi implementer hoàn tất WO-BE-1 + WO-FE-1..6 và ghi kết quả vào đúng file này (bổ sung mục kết quả).

## 2. Lệnh verify wave-2 (BẮT BUỘC chạy — theo triage `verification_commands`)

| # | Lệnh | Cwd | Oracle | Ý nghĩa |
|---|---|---|---|---|
| V-1 | `cd frontend && npx tsc --noEmit` | workspace root | exit code 0, không error output | AC-024-09 — frontend typecheck |
| V-2 | `mvn compile -DskipTests` | workspace root | exit code 0 (BUILD SUCCESS) | AC-024-09 — backend compile |

Ghi chú: nếu `tsc` fail ở dòng nào đó, ghi chính xác file:dòng + lỗi vào mục 7; KHÔNG sửa code khi đang ở wave-2 verification (báo implementer).

## 3. Bản đồ phủ Acceptance Criteria → Test case

| AC / oracle | Mô tả | Test case |
|---|---|---|
| done-oracle | Dashboard đúng 6 khối | TC-01, TC-02 |
| done-oracle | Sidebar nhánh "Quản lý cảng biển" đúng 13 thực thể | TC-03 |
| AC-024-01 | Dashboard 6 khối, mỗi khối navigate được | TC-01, TC-02 |
| AC-024-02 | 13 thực thể theo ma trận cha–con | TC-03 |
| AC-024-03 | Đúng 7 nhóm cấp 1 + item tiện ích | TC-05 |
| AC-024-04 | Thiếu quyền → ẩn item / ẩn nhánh | TC-06 |
| AC-024-05 | `admin:all` / `*` → thấy toàn bộ | TC-07 |
| AC-024-06 | Click leaf → navigate + `selectedKey`/`openKeys` đúng nhánh | TC-08 |
| AC-024-07 | Item chưa có màn hình → disabled + tooltip "Chưa triển khai" | TC-04 |
| AC-024-08 | Key/route/resource tiếng Anh; label tiếng Việt; không hardcode UI | TC-09 |
| AC-024-09 | `tsc --noEmit` + `mvn compile -DskipTests` pass | TC-10 |
| AC-024-10 | Không thêm `menu:view` (D-4 = không); nếu fallback → seed đúng | TC-11 |
| design §2 / §4.4 | 5 divergence fix + 4 addition trong `MENU_PERMISSION_MAP` | TC-12 |
| design §6 (static menu) | Không `/api/menu`, không bảng `menu_item` | TC-13 |
| BR-024-12 | Deep link thiếu quyền → vẫn bị chặn (403/redirect) | TC-14 |
| VAL-024-01..06 | Cấu trúc cây: key unique, depth ≤ 4, route tồn tại, item có quyền phải có map entry | TC-15 |
| BR-024-02 + §6.3 | VTS subtree (cấp 2–4 theo xlsx) | TC-16 |

## 4. Test cases (oracle chạy được — nội dung tiếng Việt, định danh kỹ thuật tiếng Anh)

### TC-01 — Dashboard render đúng 6 khối (AC-024-01, done-oracle, D-2, WO-FE-4)

- **Given:** user đã đăng nhập với quyền ≥ 1 chức năng bất kỳ.
- **When:** mở trang chủ (`/`).
- **Then:** render **đúng 6 khối** (đếm node grid = 6, không phụ thuộc quyền của user); mỗi khối có label tiếng Việt; click khối → điều hướng.
- **Oracle:**
  - Số khối = 6 (assert chính xác, không dùng `>=`).
  - Bảng khối (label tiếng Việt → target route) — theo D-2 / §4.3:
    1. `QUẢN LÝ KCHT HÀNG HẢI` → `/port`
    2. `QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI` → `/asset/inventory`
    3. `BÁO CÁO THỐNG KÊ` → `/reports`
    4. `QUẢN LÝ NGƯỜI DÙNG` → `/users`
    5. `QUẢN LÝ QUY HOẠCH & VẬN HÀNH` → `/documents/legal`
    6. `TÍCH HỢP` → `/connections`
  - Config nguồn: `DASHBOARD_BLOCKS` — **NEW** (chưa tồn tại hôm nay; WO-FE-4 giới thiệu; 6 entry: `label`, `icon`, `target`, `permission`).
  - **Non-vacuity:** với user KHÔNG có quyền của một khối, khối VẪN hiển thị (đếm = 6) nhưng click bị route guard chặn (BR-024-12) — kiểm tra bằng cách đảo kỳ vọng: block hiển thị ≠ quyền truy cập.
- **Anchor (hành vi hiện tại):** `/` là `HomePage` không guard — `App.tsx:128` `<Route path="/" element={<HomePage />} />`; các target route tồn tại + guard: `App.tsx:186` (`/port` `port:read`), `App.tsx:232` (`/asset/inventory` `inventoryasset:manage`), `App.tsx:174` (`/reports` `report:read`), `App.tsx:129` (`/users` `user:read`), `App.tsx:236` (`/documents/legal` `document:read`), `App.tsx:165` (`/connections` `connection:read`).
- **Severity:** Major.

### TC-02 — 6 khối điều hướng tới route thật và đồng bộ sidebar (AC-024-01, D-2, WO-FE-3/WO-FE-4)

- **Given:** user đã đăng nhập, đang ở `/`.
- **When:** click lần lượt từng khối trong TC-01.
- **Then:** URL chuyển tới target route tương ứng; route phải tồn tại trong `App.tsx` với `PermissionGuard`; sidebar mở đúng nhánh của route (`selectedKey`/`openKeys`, mobile drawer đóng nếu đang mở).
- **Oracle:**
  - Với mỗi khối: `window.location.pathname` sau click = target route; component của route render (không phải trang 404).
  - `openKeys` chứa đúng key nhánh mới theo §4.2/§4.3 (vd khối TÍCH HỢP → `/connections` → mở `group-integration` — key mới **NEW**).
- **Anchor:** `App.tsx:186`, `App.tsx:232`, `App.tsx:174`, `App.tsx:129`, `App.tsx:236`, `App.tsx:165` (route + guard); `AppLayout.tsx:144` `openKeys`/`setOpenKeys`; `AppLayout.tsx:189` `if (selectedKey)` (effect đồng bộ nhánh hiện tại).
- **Severity:** Major.

### TC-03 — Sidebar nhánh "Quản lý cảng biển" đúng 13 thực thể (AC-024-02, done-oracle, BR-024-02/03, D-1)

- **Given:** user có quyền truy cập nhóm KCHT (vd `port:read`, `navigationchannel:read`).
- **When:** mở sidebar, expand nhánh "Quản lý cảng biển".
- **Then:** đếm node = **13**, phân cấp cha–con đúng chuỗi ma trận (BR-024-03), không phân cấp phẳng.
- **Oracle (cây chuẩn — key/label theo design §4.2, key nhánh **NEW**):**

  ```
  Quản lý cảng biển            (submenu, key port-tree)
    Cảng biển                  /port                   port:read
    Bến cảng                   (submenu, key berth-parent)
      Cầu cảng                 /pier                   pier:read
    Luồng hàng hải             (submenu, key nav-channel-parent)
      Bến phao                 disabled placeholder   mooring-buoy-placeholder (NEW)
      Đèn biển + nhà trạm gắn đèn  /beacon-stations    beaconstation:read
      Đê/kè                    /dike-revetment        dikerevetment:read
      Nhà trạm phao/tiêu       (submenu, key buoy-station-parent)
        Phao tiêu              /buoys                 buoy:read
    Khu neo đậu                disabled placeholder   anchorage-area-placeholder (NEW)
    Khu chuyển tải             disabled placeholder   transshipment-area-placeholder (NEW)
    Khu tránh/trú bão          disabled placeholder   storm-shelter-area-placeholder (NEW)
    CS sửa chữa/đóng tàu       /ship-repair-facility  shiprepair:read
  ```

  - Đếm tổng node con của "Quản lý cảng biển" (mọi cấp, kể cả submenu) = 13.
  - Quan hệ cha–con: `Cảng biển → Bến cảng → Cầu cảng`; `Cảng biển → Luồng hàng hải → {Bến phao, Đèn biển + nhà trạm gắn đèn, Đê/kè, Nhà trạm phao/tiêu → Phao tiêu}`; `Cảng biển → {Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão, CS sửa chữa/đóng tàu}`.
- **Anchor (route + guard hiện tại):** `App.tsx:186` `/port`, `App.tsx:190` `/berth`, `App.tsx:192` `/pier`, `App.tsx:205` `/navigation-channel`, `App.tsx:210` `/dike-revetment`, `App.tsx:215` `/ship-repair-facility`, `App.tsx:179` `/beacon-stations`, `App.tsx:241` `/buoy-station`, `App.tsx:182` `/buoys`; cấu trúc menu hiện tại là `rawMenuItems` — `AppLayout.tsx:222`; map quyền — `AppLayout.tsx:43` `MENU_PERMISSION_MAP`.
- **Severity:** Major (done-oracle).

### TC-04 — 4 placeholder disabled "Chưa triển khai", không navigate (AC-024-07, BR-024-08, D-1)

- **Given:** item thuộc target menu nhưng chưa có màn hình (Bến phao, Khu neo đậu, Khu chuyển tải, Khu tránh/trú bão).
- **When:** expand nhánh chứa item; hover item; click item.
- **Then:**
  - Item render `disabled` với tooltip tiếng Việt `"Chưa triển khai"` (`title: 'Chưa triển khai'`).
  - `key` là chuỗi tiếng Anh **KHÔNG bắt đầu bằng `/`** (non-route): `mooring-buoy-placeholder`, `anchorage-area-placeholder`, `transshipment-area-placeholder`, `storm-shelter-area-placeholder` (**NEW** — D-1 implementation contract).
  - Click → **KHÔNG** đổi URL, không navigate (không có route giả).
  - KHÔNG có entry nào của 4 item trong `MENU_PERMISSION_MAP` (VAL-024-04).
- **Oracle:**
  - DOM: `aria-disabled="true"` (hoặc class disabled tương ứng của AntD Menu) + tooltip text `Chưa triển khai`.
  - Click placeholder → `location.pathname` không đổi (chạy lại test với user có đủ quyền khác để loại trừ ảnh hưởng gating).
  - Kiểm tra tĩnh: grep 4 key trên không xuất hiện trong `App.tsx` (không có `Route`) — route thật cho 4 thực thể này không tồn tại hôm nay.
- **Anchor:** `AppLayout.tsx:492` `handleMenuClick` (chỉ navigate key bắt đầu bằng `/`); `AppLayout.tsx:43` `MENU_PERMISSION_MAP`; không có route 4 thực thể trong `App.tsx` (grep âm tính).
- **Severity:** Major.

### TC-05 — Đúng 7 nhóm cấp 1 + item tiện ích (AC-024-03, BR-024-01, D-3)

- **Given:** mọi user đã đăng nhập (không phụ thuộc quyền).
- **When:** mở sidebar.
- **Then:** hiển thị **đúng 7 nhóm cấp 1** theo xlsx (I–VII) + item tiện ích: `Trang chủ` đầu sidebar, `Cấu hình hệ thống` cuối sidebar (D-3).
- **Oracle:**
  - 7 group header (label tiếng Việt đúng tên xlsx, không đổi tên): `I. QUẢN LÝ KCHT HÀNG HẢI`, `II. QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI`, `III. PHÊ DUYỆT`, `IV. BÁO CÁO THỐNG KÊ`, `V. QUẢN LÝ NGƯỜI DÙNG`, `VI. QUẢN LÝ QUY HOẠCH & VẬN HÀNH`, `VII. TÍCH HỢP`.
  - Group header render unconditionally (không bọc `canAccessMenu`); key nhóm **NEW**: `group-kcht`, `group-asset`, `group-approval`, `group-reports`, `group-users`, `group-planning`, `group-integration`.
  - Item tiện ích: `Trang chủ` (`/`, không gate) đứng trước nhóm I; `Cấu hình hệ thống` (`/settings`, gate `admin:manage`) đứng cuối.
  - Đếm chính xác: 7 group header (không còn nhóm thừa như `Quản trị hệ thống` / `Báo hiệu hàng hải` / `Khu nước & VTS` ở cấp 1 — các nhóm cũ bị loại).
- **Anchor:** `AppLayout.tsx:222` `rawMenuItems`, `AppLayout.tsx:223` `{ key: '/', ... 'Trang chủ' }` (item tiện ích đầu hiện có); `App.tsx:254` `/settings` `admin:manage`; `AppLayout.tsx:84` `canAccessMenu`.
- **Severity:** Major.

### TC-06 — Ẩn item thiếu quyền; ẩn nhánh hết con hợp lệ (AC-024-04, BR-024-04, WO-FE-2/WO-FE-5)

- **Given:** user KHÔNG có `port:read` (JWT chỉ chứa quyền khác, vd `report:read`).
- **When:** mở sidebar nhánh KCHT.
- **Then:** không thấy item `Cảng biển` (`/port`); nếu submenu không còn con hợp lệ nào → ẩn cả nhánh (qua `filterEmptyChildren`).
- **Oracle:**
  - Với user thiếu `port:read`: node có `key === '/port'` KHÔNG xuất hiện trong DOM menu.
  - **Non-vacuity (đảo kỳ vọng):** cùng test với user CÓ `port:read` → node `/port` xuất hiện. Cả 2 trường hợp phải chạy; chỉ 1 trong 2 = test rỗng, không tính pass.
  - Nhánh con chỉ toàn item bị ẩn → nhánh cha biến mất (không còn header rỗng).
- **Anchor:** `AppLayout.tsx:84` `canAccessMenu`, `AppLayout.tsx:85` `MENU_PERMISSION_MAP[path]`, `AppLayout.tsx:464` `filterEmptyChildren`, `AppLayout.tsx:488` `menuItems`; `permissionStore.ts:55` `hasPermissionFromList`, `permissionStore.ts:99` `hasPermission`.
- **Severity:** Major.

### TC-07 — Bypass qua `admin:all` / `*` (AC-024-05, BR-024-05)

- **Given:** user có `admin:all` (hoặc `*`).
- **When:** mở sidebar.
- **Then:** thấy toàn bộ item menu bất kể quyền chi tiết.
- **Oracle:**
  - Mọi item lá có route (trong TC-03) hiển thị đầy đủ.
  - **Negative:** user chỉ có `admin:manage` (KHÔNG phải bypass) → KHÔNG thấy `/port` (BR-024-05: `admin:manage` không phải toàn quyền).
  - Bypass hợp lệ: `*` / `admin:all` / `resource:manage` / `resource:*` / `resource:write` — kiểm tra qua `hasPermissionFromList`.
- **Anchor:** `permissionStore.ts:55` `hasPermissionFromList`, `permissionStore.ts:64` `.map((permission) => normalizePermissionKey(permission.trim()))`, `permissionStore.ts:19` `normalizePermissionKey`.
- **Severity:** Major.

### TC-08 — Điều hướng leaf + đồng bộ `selectedKey`/`openKeys` (AC-024-06, UC-024-04, BR-024-07, WO-FE-3)

- **Given:** user có quyền của leaf (vd `navigationchannel:read`).
- **When:** click leaf `/navigation-channel` từ sidebar.
- **Then:** navigate đúng route; `selectedKey` = key leaf; `openKeys` mở đúng nhánh cha (không lạc nhánh).
- **Oracle:**
  - URL = `/navigation-channel`; màn `NavigationChannelList` render (guard `navigationchannel:read`).
  - `openKeys` chứa `nav-channel-parent` + `port-tree` (+ `group-kcht`) — key mới **NEW**; các key nhánh cũ (`cangben`, `khu-nuoc-vts`, `beacon`, `stations`, `system-admin`, `documents-incidents`, `asset-movement`) KHÔNG còn xuất hiện trong effect (WO-FE-3 thay toàn bộ).
  - Lặp lại cho tối thiểu 1 leaf mỗi nhánh sâu: `/pier` (mở `berth-parent`), `/buoys` (mở `buoy-station-parent`), `/vts-system` (mở `vts-parent`).
- **Anchor:** `AppLayout.tsx:144` `openKeys`/`setOpenKeys`, `AppLayout.tsx:189` `if (selectedKey)` (effect nhánh hiện tại, các branch key cũ ở `AppLayout.tsx:190`–`AppLayout.tsx:216`); `App.tsx:205` `/navigation-channel`.
- **Severity:** Major.

### TC-09 — Kiểm tra tĩnh naming & UI convention (AC-024-08, BR-024-10, VAL-024-02/05)

- **Given:** — (kiểm tra tĩnh, không cần runtime).
- **When:** grep/soát cấu trúc menu config trong `AppLayout.tsx`.
- **Then:**
  - `key`/route/resource tiếng Anh chuẩn (không transliterated Vietnamese — ví dụ key `ts-cang-bien` là VI PHẠM, phải là `asset-port-placeholder` dạng tiếng Anh).
  - `label` tiếng Việt có dấu, không rỗng.
  - Không hardcode màu hex / spacing / font-size trong cấu trúc menu (UI theo `theme.ts`/`tokens.ts`).
- **Oracle:**
  - grep pattern `#[0-9a-fA-F]{3,8}` trong phần menu config `AppLayout.tsx` = 0 match.
  - grep pattern `fontSize|margin|padding|borderRadius` kèm literal số (vd `12`, `14`) trong phần menu config = 0 match (cho phép dùng token như `spaceMd` — `tokens.ts:69`).
  - Mọi `label` chứa ký tự tiếng Việt có dấu; mọi `key` chỉ gồm `[a-z0-9/-]`.
- **Anchor:** `AppLayout.tsx:222` `rawMenuItems`; `tokens.ts:69` `spaceMd` (token hợp lệ dùng được).
- **Severity:** Minor.

### TC-10 — Verification commands (AC-024-09)

- **Given:** implementation hoàn tất (WO-BE-1, WO-FE-1..6).
- **When:** chạy 2 lệnh trong mục 2.
- **Then:** cả 2 exit 0.
- **Oracle:** `cd frontend && npx tsc --noEmit` → exit 0; `mvn compile -DskipTests` → `BUILD SUCCESS`.
- **Anchor:** triage `verification_commands` (V-1/V-2).
- **Severity:** Major (gate).

### TC-11 — KHÔNG thêm permission `menu:view` (AC-024-10, D-4 = KHÔNG, WO-BE-1)

- **Given:** D-4 chốt KHÔNG tạo `menu:view`; dùng lại quyền nghiệp vụ hiện có để gating.
- **When:** kiểm tra tĩnh backend + frontend.
- **Then:**
  - `PermissionSeeder.java` KHÔNG có seed resource `menu` (không có `seedPermission(definitions, "menu", ...)` trong `run()`).
  - Không có entry `menu:view` trong `MENU_PERMISSION_MAP`.
  - Toàn bộ permission code mà menu tham chiếu đã được seed (kiểm tra mẫu: `port:read` — `PermissionSeeder.java:182`; `waterzone:read` — `PermissionSeeder.java:246`; `navigationchannel:read` — `PermissionSeeder.java:294`; `beaconstation:read` — `PermissionSeeder.java:414`; `orgunit:read` — `PermissionSeeder.java:66`; `group:read` — `PermissionSeeder.java:72`; `connection:read` — `PermissionSeeder.java:101`; `report:read` — `PermissionSeeder.java:120`; `document:read` — `PermissionSeeder.java:131`).
- **Oracle:** grep `menu:view` và `"menu"` trong `PermissionSeeder.java` = 0 match (đã verify wave-1: âm tính); **không có diff** ở `PermissionSeeder.java` trong wave-2 (WO-BE-1: expected diff NONE).
- **Fallback (chỉ khi review phát hiện thiếu code):** permission mới phải seed qua `seedPermission` trong `run()` — `PermissionSeeder.java:45` `run`, `PermissionSeeder.java:716` `seedPermission`; không gán role.
- **Anchor:** `PermissionSeeder.java:45`, `PermissionSeeder.java:716`, `PermissionSeeder.java:182`.
- **Severity:** Major (D-4 consequence).

### TC-12 — Route → permission map khớp route guard (design §2 gap, §4.4, WO-FE-2)

- **Given:** — (so sánh tĩnh 2 nguồn: `MENU_PERMISSION_MAP` vs `PermissionGuard` trong `App.tsx`).
- **When:** với MỌI route trong §4.4 (32 dòng), đối chiếu giá trị map với guard.
- **Then:** `MENU_PERMISSION_MAP[route]` === permission của guard trên route đó (menu hiển thị ⇔ route cho phép).
- **Oracle — 5 divergence PHẢI được sửa (hiện tại đang lệch — verified wave-1):**

  | Route | Map hiện tại (anchor) | Guard (anchor) | Sau fix |
  |---|---|---|---|
  | `/beacon-stations` | `data:read` — `AppLayout.tsx:53` | `beaconstation:read` — `App.tsx:179` | map = `beaconstation:read` |
  | `/buoys` | `data:read` — `AppLayout.tsx:54` | `buoy:read` — `App.tsx:182` | map = `buoy:read` |
  | `/buoy-station` | `data:read` — `AppLayout.tsx:55` | `buoystation:read` — `App.tsx:241` | map = `buoystation:read` |
  | `/water-zone` | `waterarea:read` — `AppLayout.tsx:61` | `waterzone:read` — `App.tsx:198` | map = `waterzone:read` |
  | `/symbols` | `map:manage` — `AppLayout.tsx:78` | `data:read` — `App.tsx:248` | map = `data:read` |

  **Oracle — 4 addition (hiện tại đang `data:read`):**

  | Route | Map hiện tại (anchor) | Guard (anchor) | Sau fix |
  |---|---|---|---|
  | `/asset/increase` | `data:read` — `AppLayout.tsx:62` | `assetincrease:manage` — `App.tsx:230` | map = `assetincrease:manage` |
  | `/asset/decrease` | `data:read` — `AppLayout.tsx:63` | `assetdecrease:manage` — `App.tsx:231` | map = `assetdecrease:manage` |
  | `/asset/inventory` | `data:read` — `AppLayout.tsx:64` | `inventoryasset:manage` — `App.tsx:232` | map = `inventoryasset:manage` |
  | `/asset/exploitation` | `data:read` — `AppLayout.tsx:65` | `assetexploitation:manage` — `App.tsx:233` | map = `assetexploitation:manage` |

  - Các route "keep" phải GIỮ NGUYÊN giá trị (vd `/port` map `port:read` — guard `App.tsx:186`); không xóa entry đang dùng cho route ẩn (`/gis/points` `data:read` — `App.tsx:143`, `/gis/lines` — `App.tsx:148`, `/gis/polygons` — `App.tsx:153`, `/gis/map` — `App.tsx:161`, `/interconnect` `connection:read` — `App.tsx:171`, `/dry-port` `dryport:read` — `App.tsx:196`).
- **Anchor:** `AppLayout.tsx:43` `MENU_PERMISSION_MAP` (và các dòng entry nêu trên); guard trong `App.tsx` (anchor từng route nêu trên).
- **Severity:** Major (lỗi gating dẫn tới "thấy menu nhưng 403" hoặc "ẩn menu dù có quyền").

### TC-13 — Menu TĨNH: không `/api/menu`, không bảng `menu_item` (design §6/§7, BR-024-11)

- **Given:** — (kiểm tra tĩnh toàn repo).
- **When:** grep toàn bộ frontend + backend + migration.
- **Then:**
  - Không có endpoint `/api/menu` (frontend không gọi; backend không có controller).
  - Không có bảng `menu_item` (không migration/entity/table mới).
  - Không có entity/migration/backfill mới nào (BR-024-11).
- **Oracle (đã verify âm tính wave-1):** grep `api/menu` trong `frontend/src` = 0 match; grep `api/menu` trong `src/main/java` = 0 match; grep `menu_item` trong `src/main/resources/db/migration` = 0 match. Wave-2 chạy lại 3 grep này và ghi kết quả.
- **Anchor:** âm tính (không có file) — ghi kèm lệnh grep đã chạy.
- **Severity:** Major (thiết kế chốt static menu).

### TC-14 — Deep link thiếu quyền vẫn bị chặn (BR-024-12, UC-024-08)

- **Given:** user KHÔNG có `port:read`.
- **When:** truy cập TRỰC TIẾP URL `/port` (không qua menu).
- **Then:** `PermissionGuard` chặn — không render `PortList` (fallback/redirect), API backend trả 403 khi gọi; an ninh không phụ thuộc việc ẩn menu.
- **Oracle:** mở thẳng `/port` với user thiếu quyền → nội dung `PortList` không xuất hiện (fallback `PermissionGuard` hiển thị hoặc redirect login/403); với user CÓ quyền → render bình thường (đảo kỳ vọng, non-vacuity).
- **Anchor:** `frontend/src/components/PermissionGuard.tsx:14` `PermissionGuard`; `App.tsx:186` `/port` guard `port:read`.
- **Severity:** Major (security).

### TC-15 — Cấu trúc cây: VAL-024-01/03/04/05 (structural checks)

- **Given:** — (kiểm tra tĩnh cây menu sau WO-FE-1).
- **When:** rà soát toàn bộ cây menu mới.
- **Then:**
  - VAL-024-01: `key` duy nhất trong cùng cấp; key lá bắt đầu bằng `/` (route thật) hoặc là non-route placeholder tiếng Anh.
  - VAL-024-03: độ sâu tối đa 4 cấp (group cấp 1 → cấp 4 theo xlsx).
  - VAL-024-04: mọi item lá có phân quyền PHẢI có entry trong `MENU_PERMISSION_MAP`; item không quyền (chưa triển khai) → disabled.
  - VAL-024-05: không còn item nào tham chiếu route không tồn tại trong `App.tsx` (trừ disabled placeholder).
- **Oracle:** script/soát tay: với mỗi key lá bắt đầu bằng `/` trong cây menu → grep `path="<key>"` trong `App.tsx` phải có match; mỗi key lá có `permission` → có entry trong `MENU_PERMISSION_MAP`; mỗi placeholder → `disabled: true` + không có trong `MENU_PERMISSION_MAP` + không có trong `App.tsx`.
- **Anchor:** `AppLayout.tsx:222` `rawMenuItems`; `AppLayout.tsx:43` `MENU_PERMISSION_MAP`; `AppLayout.tsx:464` `filterEmptyChildren`.
- **Severity:** Minor.

### TC-16 — VTS subtree (BR-024-02 phạm vi §6.3, design §4.2, WO-FE-1)

- **Given:** user có quyền VTS (`vts:read`, `radarstation:read`, ...).
- **When:** mở sidebar: `I. QUẢN LÝ KCHT HÀNG HẢI` → `Hệ thống VTS` → `Trung tâm điều hành VTS`.
- **Then:**
  - `Hệ thống VTS` (submenu, key `vts-parent` **NEW**) → `Thông tin hệ thống VTS` (`/vts-system`, `vts:read`).
  - `Trung tâm điều hành VTS` (submenu, key `vts-ops-center` **NEW**) → cấp 4: `Radar` (`/radar-station`, `radarstation:read`), `Đài TT duyên hải` (`/station/coastal`, `coastalstation:read`), `Inmarsat` (`/station/special`, `specialstation:read`); các mục cấp 4 còn lại (AIS, CCTV, SCADA, Truyền dẫn, Phụ trợ VTS, VHF, Sarsat, LRIT, Trung tâm xử lý TT, Thông tin TT ĐHVTS) → disabled placeholder `*-placeholder` (**NEW**), áp dụng TC-04.
- **Oracle:** mỗi leaf có route → render + guard đúng; placeholder → disabled + tooltip; đếm cấp sâu = 4.
- **Anchor:** `App.tsx:225` `/vts-system` `vts:read`, `App.tsx:220` `/radar-station` `radarstation:read`, `App.tsx:244` `/station/coastal` `coastalstation:read`, `App.tsx:245` `/station/special` `specialstation:read`.
- **Severity:** Minor (ngoài done-oracle, theo xlsx).

## 5. Lệnh/thao tác kiểm tra tĩnh bổ sung cho wave-2

| Mã | Lệnh grep (hoặc thao tác) | Oracle | Liên kết |
|---|---|---|---|
| G-1 | `grep "api/menu" frontend/src` | 0 match | TC-13 |
| G-2 | `grep "api/menu" src/main/java` | 0 match | TC-13 |
| G-3 | `grep "menu_item" src/main/resources/db/migration` | 0 match | TC-13 |
| G-4 | `grep "menu:view" src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java` | 0 match | TC-11 |
| G-5 | grep pattern `#[0-9a-fA-F]{3,8}` trong phần menu config của `AppLayout.tsx` | 0 match | TC-09 |
| G-6 | Với mỗi key lá bắt đầu bằng `/` trong cây menu mới: `grep "path=\"<key>\"" frontend/src/App.tsx` | ≥ 1 match | TC-15 |

## 6. Anchor registry — đã verify trực tiếp trong session wave-1 (grep trên file thật)

> Mỗi dòng: `Basename.ext:line` = symbol nằm trong ±5 dòng của anchor (hầu hết trùng chính xác dòng khai báo).

| Anchor | Symbol (đã verify) | File thật |
|---|---|---|
| `AppLayout.tsx:43` | `MENU_PERMISSION_MAP` (export const) | frontend/src/components/AppLayout.tsx |
| `AppLayout.tsx:53` | `'/beacon-stations': 'data:read'` (map entry) | như trên |
| `AppLayout.tsx:54` | `'/buoys': 'data:read'` | như trên |
| `AppLayout.tsx:55` | `'/buoy-station': 'data:read'` | như trên |
| `AppLayout.tsx:61` | `'/water-zone': 'waterarea:read'` | như trên |
| `AppLayout.tsx:62`–`:65` | `'/asset/*': 'data:read'` (4 entry) | như trên |
| `AppLayout.tsx:78` | `'/symbols': 'map:manage'` | như trên |
| `AppLayout.tsx:84` | `canAccessMenu` | như trên |
| `AppLayout.tsx:85` | `MENU_PERMISSION_MAP[path]` | như trên |
| `AppLayout.tsx:144` | `openKeys`/`setOpenKeys` | như trên |
| `AppLayout.tsx:189` | `if (selectedKey)` (effect branch sync) | như trên |
| `AppLayout.tsx:190`–`:216` | các branch key cũ (`buoy-station-parent`, `beacon`, `cangben`, `port-parent`, `berth-parent`, `asset-movement`, `documents-incidents`, `khu-nuoc-vts`, `stations`, `reports-parent`) | như trên |
| `AppLayout.tsx:222` | `rawMenuItems` | như trên |
| `AppLayout.tsx:223` | `{ key: '/', ... 'Trang chủ' }` | như trên |
| `AppLayout.tsx:464` | `filterEmptyChildren` | như trên |
| `AppLayout.tsx:488` | `menuItems = filterEmptyChildren(rawMenuItems)` | như trên |
| `AppLayout.tsx:492` | `handleMenuClick` | như trên |
| `AppLayout.tsx:565` | `onClick={handleMenuClick}` | như trên |
| `AppLayout.tsx:566` | `inlineIndent={12}` | như trên |
| `AppLayout.tsx:18` | `DashboardOutlined` (import) | như trên |
| `AppLayout.tsx:23` | `ApiOutlined` (import) | như trên |
| `App.tsx:128` | `<Route path="/" element={<HomePage />} />` | frontend/src/App.tsx |
| `App.tsx:129` | `/users` guard `user:read` | như trên |
| `App.tsx:132` | `/organizations` guard `orgunit:read` | như trên |
| `App.tsx:138` | `/groups` guard `group:read` | như trên |
| `App.tsx:143` | `/gis/points` guard `data:read` | như trên |
| `App.tsx:148` | `/gis/lines` guard `data:read` | như trên |
| `App.tsx:153` | `/gis/polygons` guard `data:read` | như trên |
| `App.tsx:161` | `/gis/map` guard `data:read` | như trên |
| `App.tsx:165` | `/connections` guard `connection:read` | như trên |
| `App.tsx:171` | `/interconnect` guard `connection:read` | như trên |
| `App.tsx:174` | `/reports` guard `report:read` | như trên |
| `App.tsx:175` | `/reports/:code` guard `report:read` | như trên |
| `App.tsx:179` | `/beacon-stations` guard `beaconstation:read` | như trên |
| `App.tsx:182` | `/buoys` guard `buoy:read` | như trên |
| `App.tsx:186` | `/port` guard `port:read` | như trên |
| `App.tsx:190` | `/berth` guard `berth:read` | như trên |
| `App.tsx:192` | `/pier` guard `pier:read` | như trên |
| `App.tsx:196` | `/dry-port` guard `dryport:read` | như trên |
| `App.tsx:198` | `/water-zone` guard `waterzone:read` | như trên |
| `App.tsx:205` | `/navigation-channel` guard `navigationchannel:read` | như trên |
| `App.tsx:210` | `/dike-revetment` guard `dikerevetment:read` | như trên |
| `App.tsx:215` | `/ship-repair-facility` guard `shiprepair:read` | như trên |
| `App.tsx:220` | `/radar-station` guard `radarstation:read` | như trên |
| `App.tsx:225` | `/vts-system` guard `vts:read` | như trên |
| `App.tsx:230` | `/asset/increase` guard `assetincrease:manage` | như trên |
| `App.tsx:231` | `/asset/decrease` guard `assetdecrease:manage` | như trên |
| `App.tsx:232` | `/asset/inventory` guard `inventoryasset:manage` | như trên |
| `App.tsx:233` | `/asset/exploitation` guard `assetexploitation:manage` | như trên |
| `App.tsx:236` | `/documents/legal` guard `document:read` | như trên |
| `App.tsx:237` | `/documents/incidents` guard `document:read` | như trên |
| `App.tsx:238` | `/documents/port-planning` guard `document:read` | như trên |
| `App.tsx:241` | `/buoy-station` guard `buoystation:read` | như trên |
| `App.tsx:244` | `/station/coastal` guard `coastalstation:read` | như trên |
| `App.tsx:245` | `/station/special` guard `specialstation:read` | như trên |
| `App.tsx:248` | `/symbols` guard `data:read` | như trên |
| `App.tsx:251` | `/logs` guard `admin:view` | như trên |
| `App.tsx:254` | `/settings` guard `admin:manage` | như trên |
| `permissionStore.ts:19` | `normalizePermissionKey` | frontend/src/store/permissionStore.ts |
| `permissionStore.ts:55` | `hasPermissionFromList` | như trên |
| `permissionStore.ts:64` | `.map((permission) => normalizePermissionKey(permission.trim()))` | như trên |
| `permissionStore.ts:99` | `hasPermission` (store accessor) | như trên |
| `permissionStore.ts:119` | `useAuthStore.subscribe` | như trên |
| `authStore.ts:44` | `parseJwt` | frontend/src/store/authStore.ts |
| `authStore.ts:81` | `login` | như trên |
| `authStore.ts:111` | `replaceAccessToken` | như trên |
| `PermissionSeeder.java:45` | `run(String... args)` | src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java |
| `PermissionSeeder.java:66` | `seedPermission(..., "orgunit", "read", ...)` | như trên |
| `PermissionSeeder.java:72` | `seedPermission(..., "group", "read", ...)` | như trên |
| `PermissionSeeder.java:101` | `seedPermission(..., "connection", "read", ...)` | như trên |
| `PermissionSeeder.java:120` | `seedPermission(..., "report", "read", ...)` | như trên |
| `PermissionSeeder.java:131` | `seedPermission(..., "document", "read", ...)` | như trên |
| `PermissionSeeder.java:182` | `seedPermission(..., "port", "read", ...)` | như trên |
| `PermissionSeeder.java:246` | `seedPermission(..., "waterzone", "read", ...)` | như trên |
| `PermissionSeeder.java:294` | `seedPermission(..., "navigationchannel", "read", ...)` | như trên |
| `PermissionSeeder.java:414` | `seedPermission(..., "beaconstation", "read", ...)` | như trên |
| `PermissionSeeder.java:716` | `seedPermission(...)` (method) | như trên |
| `Home.tsx:130` | `KCHT_LABEL_ROUTES` | frontend/src/pages/Home.tsx |
| `Home.tsx:304` | `HomeDashboard` | như trên |
| `Home.tsx:661` | `HomePage` (export default) | như trên |
| `tokens.ts:69` | `spaceMd` | frontend/src/tokens.ts |
| `PermissionGuard.tsx:14` | `PermissionGuard` (export default) | frontend/src/components/PermissionGuard.tsx |

**Kết quả verify âm tính (wave-1):** `api/menu` không tồn tại trong `frontend/src` và `src/main/java`; `menu_item` không tồn tại trong `src/main/resources/db/migration`; `menu:view` / `"menu"` không tồn tại trong `PermissionSeeder.java`.

## 7. Rủi ro & lưu ý khi thực thi wave-2

1. **Photo mockup (`docs/inputs/photo_2026-07-09_15-47-20.jpg`)** — là tài liệu tham chiếu D-2 cho ánh xạ 6 khối; nội dung ảnh không trích xuất được ở wave-1 (JPEG base64, không có vision). Nếu ảnh quy định ánh xạ khác TC-01 → đây là thay đổi 1 config (`DASHBOARD_BLOCKS` **NEW**), không phải redesign; ghi lại quyết định vào mục kết quả. Logo `docs/inputs/logo-vinamarine_1_1.png` nằm NGOÀI phạm vi 4 edit-target files (asset thương hiệu — quyết định product, không phải code change).
2. **Non-vacuity:** TC-01, TC-06, TC-14 bắt buộc chạy cả 2 chiều (có/không quyền); nếu chỉ chạy 1 chiều, test được coi là rỗng và không tính pass.
3. **Wave-1 không chạy build** (theo triage); mọi lệnh trong mục 2 + 5 thuộc trách nhiệm wave-2. Không báo Pass AC-024-09 khi chưa có output thực tế của V-1/V-2.
4. **`Home.tsx` không phải edit target** — grid 6 khối do `AppLayout.tsx` render trên `/` (WO-FE-4); nếu implementer sửa `Home.tsx` → vi phạm edit scope, báo PMO.
5. **`PermissionSeeder.java` expected diff = NONE** (WO-BE-1); nếu wave-2 thấy diff ở file này → báo SA (fallback theo BR-024-09 chỉ khi có permission code thiếu).
6. **Kiểm tra hidden regression:** sau khi thay `rawMenuItems`, xác nhận `selectedKey`/`openKeys` effect không còn tham chiếu key nhánh cũ (TC-08); kiểm tra không xóa nhầm entry map cho route đang dùng khác (`/history` — `App.tsx:183`, `/gis/layers` — `App.tsx:158`).
7. **Evidence provenance:** mọi kết quả wave-2 ghi kèm lệnh chạy + exit code + (nếu có) file:dòng lỗi; không mô tả "theo code là đúng".

## 8. Kết quả wave-2 (điền sau khi thực thi)

> Phần này do wave-2 điền: với mỗi TC ghi Pass / Fail / Error + bằng chứng (lệnh, output, anchor). TC Fail → ghi severity + reproduction + owner (theo mục 4).
