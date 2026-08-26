# M-024 Tái cấu trúc Menu & Navigation — QA Report W2 (Verification against implementation)

- **Module / Feature:** M-024 / F-292 — Tái cấu trúc menu & điều hướng
- **Stage:** engineering-qa-engineer — **WAVE-2 (thực thi oracle)**
- **Ngày:** 2026-08-26
- **Oracle nguồn:** `qa/07-qa-report-w1.md` (TC-01..TC-16) — đã thực thi đầy đủ trong wave-2 này.
- **Trạng thái chung:** 15/16 TC PASS (code-verified), 1 TC không thực thi được phần runtime (TC-14, không có browser/server); **cả 3 lệnh verify đều chạy và PASS** (V-1 tsc exit 0, V-2 vitest 46/46, V-3 mvn compile exit 0 — BUILD SUCCESS). Chi tiết mục 2.

---

## 1. Phạm vi & phương pháp

- Kiểm tra trên **implementation hiện tại** của `frontend/src/components/AppLayout.tsx` (934 dòng, đã thay đổi so với wave-1: `DASHBOARD_BLOCKS`, sidebar 7 nhóm, grid render) + `App.tsx` + `PermissionSeeder.java` + stores.
- Mọi khẳng định kèm anchor `Basename.ext:line` — verified trực tiếp bằng grep/read trong session này.
- **KHÔNG sửa bất kỳ file source nào** (write-boundary: chỉ ghi `qa/07-qa-report-w2.md`).
- Giới hạn: môi trường wave-2 không có browser/server → các TC yêu cầu tương tác DOM runtime (click, hover, DOM count lúc render, deep-link 403) được đánh giá **code-verified** (cấu trúc/count/key/hierarchy là sự thật tĩnh đọc được từ source) và ghi rõ phần nào CHƯA chạy runtime.

## 2. Kết quả lệnh verify (output THẬT của lệnh đã chạy)

| # | Lệnh (cwd) | Exit code | Output quan sát được | Kết luận |
|---|---|---|---|---|
| V-1 | `npx tsc --noEmit` (frontend) | **0** | No output (không error) | ✅ PASS |
| V-2 | `npx vitest run` (frontend) | **0** | `Test Files 5 passed (5)` · `Tests 46 passed (46)` · `Duration 2.54s` — 5 files: `userService.test.ts` (9), `registrationService.test.ts` (2), `vtsSystemService.test.ts` (19), `authStore.test.ts` (7), `permissionStore.test.ts` (9); stderr chỉ có 2 dòng `[authStore] Rejected invalid or expired token on login` (console.error CHỦ ĐỘNG của test case âm tính, không phải failure) | ✅ PASS |
| V-3 | `mvn compile -DskipTests` (workspace root, Maven 3.9.16 tại `C:\my-tools\apache-maven-3.9.16\bin`) | **0** | `[INFO] BUILD SUCCESS` · `[INFO] Total time: 3.017 s` · enforcer `enforce-java-17` passed; warning duy nhất: `com.itextpdf:itext7-core` relocated to `com.itextpdf:itext-core` (không phải failure) | ✅ PASS |

**Lưu ý V-3:** lần chạy đầu tiên `mvn` trực tiếp fail vì binary không nằm trên PATH (`mvn : The term 'mvn' is not recognized...`); Maven thực tế được cài tại `C:\my-tools\apache-maven-3.9.16\bin`. Chạy lại với `$env:MAVEN_HOME='C:\my-tools\apache-maven-3.9.16'` + prepend PATH → **exit 0, BUILD SUCCESS** (3.017s; `Nothing to compile - all classes are up to date` — classes đã compile từ backend-developer; enforcer `enforce-java-17` passed; warning duy nhất là iText relocation, không ảnh hưởng).

> **AC-024-09: ĐÃ ĐÓNG.** Cả 3 lệnh verify exit 0: tsc (frontend typecheck), vitest (46/46 tests), `mvn compile -DskipTests` (BUILD SUCCESS). Backend dự kiến **zero diff** (WO-BE-1) — xác nhận gián tiếp: `PermissionSeeder.java` không có `menu:view`/`menu` seed (grep 0) và 3 anchor `PermissionSeeder.java:45` `run`, `PermissionSeeder.java:182` `seedPermission(definitions, "port", "read", ...)`, `PermissionSeeder.java:716` `seedPermission` vẫn nguyên vị trí.

## 3. Bảng kết quả TC-01..16 (oracle wave-1 → thực thi wave-2)

| TC | Oracle (w1) | Kết quả | Bằng chứng file:line (verified session này) | Ghi chú |
|---|---|---|---|---|
| TC-01 | Dashboard đúng 6 khối, label tiếng Việt, navigate được | ✅ PASS (code) | `DASHBOARD_BLOCKS` 6 entry — `AppLayout.tsx:96`–`AppLayout.tsx:102` (label/target/permission đúng D-2: `/port`, `/asset/inventory`, `/reports`, `/users`, `/documents/legal`, `/connections`); render chỉ khi `location.pathname === '/'` — `AppLayout.tsx:885`; grid `display:grid` + `DASHBOARD_BLOCKS.map` — `AppLayout.tsx:888`/`AppLayout.tsx:894` | Count=6 là sự thật tĩnh của config; click→navigate không chạy runtime (no browser) |
| TC-02 | Click khối → navigate + đồng bộ nhánh | ✅ PASS (code) | `onClick` → `navigate(block.target)` + đóng mobile drawer — `AppLayout.tsx:900`–`AppLayout.tsx:903`; effect đồng bộ `openKeys` — `AppLayout.tsx:210`–`AppLayout.tsx:241` (`/connections`/`/interconnect` → `group-integration` — `AppLayout.tsx:240`) | Các target route đã xác nhận tồn tại + guard ở wave-1 (`App.tsx:186/:232/:174/:129/:236/:165`) |
| TC-03 | Nhánh "Quản lý cảng biển" đúng 13 thực thể, cha–con đúng ma trận | ✅ PASS | Cây tại `AppLayout.tsx:254`–`AppLayout.tsx:298`: Cảng biển `/port` (`:260`), Bến cảng `berth-parent` → Cầu cảng `/pier` (`:263`–`:270`), Luồng hàng hải `nav-channel-parent` → Bến phao placeholder (`:278`) + Đèn biển `/beacon-stations` (`:279`) + Đê/kè `/dike-revetment` (`:280`) + Nhà trạm phao/tiêu `buoy-station-parent` → Phao tiêu `/buoys` (`:288`), Khu neo đậu (`:293`), Khu chuyển tải (`:294`), Khu tránh/trú bão (`:295`), CS sửa chữa/đóng tàu `/ship-repair-facility` (`:297`) | Đếm node = **13**, hierarchy khớp BR-024-03 (done-oracle) |
| TC-04 | 4 placeholder disabled "Chưa triển khai", key non-route, không navigate | ✅ PASS | 4 item: `AppLayout.tsx:278` `mooring-buoy-placeholder`, `:293` `anchorage-area-placeholder`, `:294` `transshipment-area-placeholder`, `:295` `storm-shelter-area-placeholder` — đều `disabled: true, title: 'Chưa triển khai'`; `handleMenuClick` chỉ navigate key bắt đầu bằng `/` — `AppLayout.tsx:553`–`AppLayout.tsx:557`; không có route nào cho 4 thực thể trong `App.tsx` (grep `mooring|anchorage|transshipment|storm-shelter` = 0) | Click→URL không đổi: suy từ AntD disabled + non-route key (runtime chưa chạy) |
| TC-05 | Đúng 7 nhóm cấp 1 + item tiện ích | ✅ PASS | `group-kcht` `'I. QUẢN LÝ KCHT HÀNG HẢI'` — `AppLayout.tsx:249`–`:251`; `group-asset` `'II. ...'` — `:333`; `group-approval` `'III. PHÊ DUYỆT'` — `:350`; `group-reports` `'IV. BÁO CÁO THỐNG KÊ'` — `:372`; `group-users` `'V. ...'` — `:481`; `group-planning` `'VI. ...'` — `:492`; `group-integration` `'VII. TÍCH HỢP'` — `:510`; `Trang chủ` `{ key: '/' }` — `:242`; divider + `Cấu hình hệ thống` (`/settings`) + `Quản lý vùng nước` (`/water-zone`) — `:519`–`:522` | 7 group header render unconditionally (không bọc `canAccessMenu`) |
| TC-06 | Thiếu quyền → ẩn item; nhánh hết con → ẩn | ✅ PASS (code) | Item lá thật bọc `canAccessMenu(...)` — vd `AppLayout.tsx:260` (`/port`), `:279`, `:288`, `:337`–`:340`, `:501`, `:522`; `canAccessMenu` — `AppLayout.tsx:104`–`AppLayout.tsx:113` (map missing → true; array → `hasAnyPermission`; else `hasPermission`); `filterEmptyChildren` — `AppLayout.tsx:525`, `menuItems` — `AppLayout.tsx:549` | Test 2-user (có/không `port:read`) chưa chạy runtime; logic gating verified + `permissionStore.test.ts` 9/9 pass |
| TC-07 | `admin:all` / `*` → thấy toàn bộ; `admin:manage` không bypass | ✅ PASS (code) | `permissionStore.ts:55` `hasPermissionFromList` (bypass rules), `:64` normalize map, `:99` `hasPermission` — không đổi so wave-1; `permissionStore.test.ts` (9 tests) PASS trong vitest | Bypass logic được test unit phủ |
| TC-08 | Click leaf → navigate + `selectedKey`/`openKeys` đúng nhánh | ✅ PASS (code) | Effect `setOpenKeys` dùng key MỚI duy nhất — `AppLayout.tsx:210`–`:241` (`group-kcht`, `port-tree`, `nav-channel-parent`, `buoy-station-parent`, `berth-parent`, `vts-parent`, `vts-ops-center`, `group-planning`, `group-asset`, `group-reports`, `group-users`, `group-integration`); grep key cũ `cangben|khu-nuoc-vts|system-admin|documents-incidents|asset-movement` = **0 match** | WO-FE-3 hoàn tất |
| TC-09 | Key/route/resource tiếng Anh; label tiếng Việt; không hardcode UI | ✅ PASS | Label tiếng Việt có dấu (toàn bộ cây — vd `:251`, `:334`, `:373`); key tiếng Anh (`-placeholder` suffix); grid style dùng token `spaceLg`/`spaceMd`/`cardStyle`/`shadowMd`/`shadowSm`/`fontSizeXl`/`fontSizeMd`/`fontWeightBold`/`textPrimary` — `AppLayout.tsx:887`–`:910`; `gridTemplateColumns: minmax(280px, 1fr)` = layout value (được phép) | Không hardcode hex/spacing/font-size trong menu config |
| TC-10 | tsc + mvn compile pass | ✅ **PASS** | V-1 ✅ (exit 0, no output), V-2 ✅ (5 files/46 tests), V-3 ✅ (exit 0, `BUILD SUCCESS` — Maven 3.9.16 tại `C:\my-tools\apache-maven-3.9.16\bin`) | AC-024-09 đã đóng — cả 3 gate exit 0 |
| TC-11 | KHÔNG thêm `menu:view`; permission tham chiếu đã seed | ✅ PASS | grep `menu:view` trong `PermissionSeeder.java` = 0; grep `api/menu|menu:view` trong `src/main/java` = 0; anchor seed: `PermissionSeeder.java:45` `run`, `:182` `port:read`, `:246` `waterzone:read`, `:294` `navigationchannel:read`, `:414` `beaconstation:read`, `:716` `seedPermission` | WO-BE-1: expected diff NONE — không phát hiện diff |
| TC-12 | 5 divergence fix + 4 addition trong `MENU_PERMISSION_MAP` | ✅ PASS | `AppLayout.tsx:65` `'/beacon-stations': 'beaconstation:read'`; `:66` `'/buoys': 'buoy:read'`; `:67` `'/buoy-station': 'buoystation:read'`; `:73` `'/water-zone': 'waterzone:read'`; `:90` `'/symbols': 'data:read'`; `:74` `'/asset/increase': 'assetincrease:manage'`; `:75` `'/asset/decrease': 'assetdecrease:manage'`; `:76` `'/asset/inventory': 'inventoryasset:manage'`; `:77` `'/asset/exploitation': 'assetexploitation:manage'` — khớp guard `App.tsx:179/:182/:241/:198/:248/:230`–`:233` (wave-1) | Menu hiển thị ⇔ route guard cho phép |
| TC-13 | Menu tĩnh: không `/api/menu`, không bảng `menu_item` | ✅ PASS | grep `api/menu` trong `frontend/src` = 0; grep `api/menu` trong `src/main/java` = 0; grep `menu_item` trong `src/main/resources/db/migration` = 0 | 3 grep âm tính chạy lại wave-2 |
| TC-14 | Deep link thiếu quyền → chặn (403/redirect) | ⏸️ **NOT EXECUTED** (runtime) | Static: `PermissionGuard.tsx:14` `PermissionGuard` + guard `/port` `port:read` — `App.tsx:186` vẫn nguyên | Không có browser/server trong môi trường wave-2 → chưa probe được; an ninh route guard là cơ chế hiện hữu (không phải tính năng mới) |
| TC-15 | VAL-024-01/03/04/05 structural | ✅ PASS (code) | Key lá bắt đầu bằng `/` hoặc `-placeholder`; placeholder không có entry map (không xuất hiện trong `MENU_PERMISSION_MAP` — grep `:43`–`:92`); mọi route lá đã tồn tại trong `App.tsx` (wave-1 anchor registry) | **Observation (Minor, không phải defect):** Phao tiêu có DOM depth 5 (`group-kcht → port-tree → nav-channel-parent → buoy-station-parent → /buoys`) do wrapper "Quản lý cảng biển" (`AppLayout.tsx:254`) — đúng thiết kế §4.2 (SA chốt), xlsx semantic depth của Phao tiêu vẫn = 4 |
| TC-16 | VTS subtree (cấp 2–4 theo xlsx) | ✅ PASS | `Hệ thống VTS` `vts-parent` — `AppLayout.tsx:303`; `Thông tin hệ thống VTS` `/vts-system` — `:307`; `Trung tâm điều hành VTS` `vts-ops-center` — `:310`; Radar `/radar-station` — `:313`; Đài TT duyên hải `/station/coastal` — `:322`; Inmarsat `/station/special` — `:323`; 10 placeholder còn lại — `:312`/`:314`–`:319`/`:324`–`:326` | Map quyền VTS: `AppLayout.tsx:81/:83/:84` |

## 4. Bằng chứng chạy lệnh (trích nguyên văn)

**V-1 — `npx tsc --noEmit` (cwd frontend):**
```
(no output)
Command exited with code 0.
```

**V-2 — `npx vitest run` (cwd frontend):**
```
 RUN  v4.1.11 C:/Users/trangtt1/hang-hai-kchtgt/frontend
 ✓ src/services/userService.test.ts (9 tests) 16ms
 ✓ src/services/registrationService.test.ts (2 tests) 6ms
 ✓ src/services/vtsSystemService.test.ts (19 tests) 39ms
 ✓ src/store/authStore.test.ts (7 tests) 9ms
 ✓ src/store/permissionStore.test.ts (9 tests) 8ms
 Test Files  5 passed (5)
      Tests  46 passed (46)
   Start at  09:50:41
   Duration  2.54s
Command exited with code 0.
```
(stderr: 2 dòng `[authStore] Rejected invalid or expired token on login` — console.error chủ động trong test case âm tính của `authStore.test.ts`.)

**V-3 — `mvn compile -DskipTests` (cwd workspace root; MAVEN_HOME=`C:\my-tools\apache-maven-3.9.16`):**
```
[INFO] Scanning for projects...
[INFO] Building HH.KCHT :: M-001 Qu?n tr? h? th?ng 0.1.0-SNAPSHOT
[WARNING] The artifact com.itextpdf:itext7-core:pom:8.0.5 has been relocated to com.itextpdf:itext-core:pom:8.0.5
[INFO] --- enforcer:3.4.1:enforce (enforce-java-17) @ kchtg ---
[INFO] Rule 0: org.apache.maven.enforcer.rules.version.RequireJavaVersion passed
[INFO] --- jacoco:0.8.12:prepare-agent (default) @ kchtg ---
[INFO] --- resources:3.3.1:resources (default-resources) @ kchtg ---
[INFO] Copying 599 resources from src\main\resources to target\classes
[INFO] --- compiler:3.13.0:compile (default-compile) @ kchtg ---
[INFO] Nothing to compile - all classes are up to date.
[INFO] BUILD SUCCESS
[INFO] Total time:  3.017 s
[INFO] Finished at: 2026-08-26T09:54:40+07:00
Command exited with code 0.
```
Lần chạy đầu (`mvn` trực tiếp, không có trên PATH): `CommandNotFoundException`, exit 1 — đã ghi nhận ở trên.

## 5. Kết luận & Go/No-Go

- **Implementation M-024 đạt 15/16 TC** (TC-14 chỉ chưa probe runtime, không phải failure); toàn bộ evidence done-oracle đạt:
  - Dashboard 6 khối: `AppLayout.tsx:96`–`:102` + render `:885`–`:910`.
  - Sidebar 13 thực thể: `AppLayout.tsx:254`–`:298`.
  - 4 placeholder "Chưa triển khai": `AppLayout.tsx:278/:293/:294/:295`.
  - 5 divergence + 4 addition trong `MENU_PERMISSION_MAP`: `AppLayout.tsx:65–77/:90`.
  - Menu tĩnh: 3 grep âm tính (`api/menu`, `menu_item`).
  - Không `menu:view`: grep âm tính.
- **Frontend gate:** `tsc` exit 0, `vitest` 46/46 → **PASS**.
- **Backend gate: ĐÃ ĐÓNG** — `mvn compile -DskipTests` (Maven 3.9.16 tại `C:\my-tools\apache-maven-3.9.16\bin`) **exit 0, BUILD SUCCESS**; backend expected zero diff theo WO-BE-1 và các anchor `PermissionSeeder.java:45/:182/:716` không đổi.
- **GO / NO-GO:** **GO** — cả 3 lệnh verify exit 0 (tsc, vitest 46/46, mvn compile BUILD SUCCESS), AC-024-01..10 đạt (TC-14 chưa probe runtime do không có browser — an ninh route guard là cơ chế hiện hữu, không phải tính năng mới); không còn blocker. TC-14 runtime probe (deep-link 403) nên được bổ sung khi có môi trường browser/end-to-end.

## 6. Ghi chú nguồn input

- `docs/inputs/photo_2026-07-09_15-47-20.jpg` (D-2 reference cho ánh xạ 6 khối): nội dung ảnh không trích xuất được (JPEG base64, không vision) — nhưng implementation `DASHBOARD_BLOCKS` (`AppLayout.tsx:96`–`:102`) khớp **chính xác** ánh xạ D-2 của design plan, nên không có xung đột nào cần giải quyết từ ảnh.
- `docs/inputs/logo-vinamarine_1_1.png`: brand asset ngoài phạm vi 4 edit-target files — không đánh giá trong wave này.
