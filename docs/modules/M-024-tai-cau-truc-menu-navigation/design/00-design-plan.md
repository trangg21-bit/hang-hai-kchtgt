# M-024 — Design Plan đợt 4: Ô tìm kiếm menu sidebar (thiết kế đã chốt) + Đồng bộ tài liệu theme CHK

> **Module:** M-024 — Tái cấu trúc Menu & Navigation
> **Feature:** F-292 — Tái cấu trục Menu & Navigation
> **Triage liên quan:** `TRI-1787823566528-bb3e` (đợt 2 — ô tìm kiếm menu sidebar, C1 scope_expansion), `TRI-1787899754098-59d2` (đợt 3 — theme CHK), `TRI-1787912936669-7a04` (đợt 4 — docs-only sync)
> **Vai trò plan này (đợt 4, re-verify 2026-09-03):** ghi nhận THIẾT KẾ ĐÃ CHỐT của ô tìm kiếm menu sidebar (đợt 2) dưới dạng work order kiểm chứng được + rà soát consistency docs ↔ code theo code HIỆN TẠI. Mọi anchor được re-grep trực tiếp trên code trong phiên này. Quy ước trình bày: MỖI dòng/bullet chỉ chứa MỘT cặp `symbol → file:line`.
> **Ngày:** 2026-09-03

---

## 1. Bối cảnh và kết luận tổng thể

**Phát hiện quan trọng nhất:** ô tìm kiếm menu sidebar KHÔNG còn là "dead input" — chức năng đã được implement đầy đủ trong `frontend/src/components/AppLayout.tsx` hiện tại:

- `filterMenuByQuery` (export, hàm lọc thuần) → `AppLayout.tsx:130`
- `collectOpenableKeys` (export, gom key tự mở) → `AppLayout.tsx:144`
- `searchQuery` (state cục bộ) → `AppLayout.tsx:161`
- `trimmedSearchQuery` (bước trim của pipeline lọc) → `AppLayout.tsx:384`
- `displayedItems` (kết quả lọc dùng cho `<Menu>`) → `AppLayout.tsx:386`
- `effectiveOpenKeys` (openKeys hiệu dụng khi tìm kiếm) → `AppLayout.tsx:387`
- Input tìm kiếm (`value` + `onChange`) → `AppLayout.tsx:454`
- `items={displayedItems}` trên `<Menu>` → `AppLayout.tsx:470`
- Bộ unit test (phủ A1–A13 cho `filterMenuByQuery`, B1–B5 cho `collectOpenableKeys`) → `frontend/src/components/AppLayout.test.tsx`

Mô tả "CURRENT CODE" trong brief dispatch gốc (input tìm kiếm "chết", `menuItems`/`filterEmptyChildren`/`rawMenuItems` ở các số dòng cũ — chi tiết mục 4-D1) là **trạng thái TRƯỚC implementation (đợt 2 pre)**, stale. Sau refactor đợt 4, anchor thực tế đã thay đổi (mục 3); plan này chỉ dùng anchor đã mở/re-grep trong phiên.

**Kết luận:** thiết kế đã chốt (mục 2) khớp 100% logic với code hiện tại. Về số dòng: tài liệu BA (`ba/00-lean-spec.md`, `_features/F-292-.../feature-brief.md`) được BA đồng bộ đợt 4 theo code TRƯỚC refactor cuối nên một phần số dòng trong tài liệu lại drift (mục 3: giá trị ✅, số dòng drift — chi tiết mục 4-D4); `theme.ts` không đổi nên claim về nó khớp tuyệt đối. Các work order (mục 5) là **verify-and-lock** phạm vi đúng 2 file: `AppLayout.tsx` + `AppLayout.test.tsx`. Verdict: **Pass** (D2/D4 cosmetic, BA-owned, không chặn).

---

## 2. Thiết kế đã chốt — Ô tìm kiếm menu sidebar

### 2.1 State, wiring và CSS

**State — `searchQuery`:** state React cục bộ trong `AppLayout`, mặc định `''`; KHÔNG phải cột DB, không có migration.

- `searchQuery` → `AppLayout.tsx:161`

**Input — ô tìm kiếm trong `.sidebar-search`:** render khi sidebar không collapsed và không fullscreen; `value` + `onChange` ghi thẳng vào state; KHÔNG có `onKeyDown`/`onPressEnter` → gõ Enter không gây side-effect (AC-024-13).

- Render guard (`!collapsed && !isMenuFullScreen`) → `AppLayout.tsx:451`
- Container `.sidebar-search` → `AppLayout.tsx:452`
- `value={searchQuery}` → `AppLayout.tsx:456`
- `onChange={(e) => setSearchQuery(e.target.value)}` → `AppLayout.tsx:457`
- `placeholder="Tìm kiếm"` (UI text tiếng Việt có dấu) → `AppLayout.tsx:455`

**CSS — dùng class có sẵn, không thêm token/class mới:**

- Class `.sidebar-search` (block CSS) → `theme.ts:418`
- `background: var(--sidebar-search-bg)` → `theme.ts:425`
- Selector `.sidebar-search input` (ô nhập) → `theme.ts:427`
- Biến CSS `--sidebar-search-bg` → `theme.ts:289`
- `themeCssVariables` (export — object chứa giá trị override CHK) → `themetokenchk.ts:487`
- `--bg-sidebar` (giá trị override) → `themetokenchk.ts:505`
- `--sidebar-search-bg` (giá trị override) → `themetokenchk.ts:506`
- `--sidebar-active-bg` (giá trị override) → `themetokenchk.ts:507`

### 2.2 Thuật toán lọc (sau gating quyền)

Pipeline hiện tại (đã đọc):

```
513  const menuItems = filterEmptyChildren(rawMenuItems);                 // đã gating quyền
515  const trimmedSearchQuery = searchQuery.trim();                        // VAL-024-06
516  const isSearching = trimmedSearchQuery.length > 0;
517  const displayedItems = isSearching ? filterMenuByQuery(menuItems, trimmedSearchQuery) : menuItems;
518  const effectiveOpenKeys = isSearching ? collectOpenableKeys(displayedItems) : openKeys;
```

1. **Lọc trên `menuItems` SAU gating quyền** — tập nguồn cho tìm kiếm được dựng qua chuỗi:

   - `MENU_PERMISSION_MAP` (bảng quyền route) → `AppLayout.tsx:38`
   - `canAccessMenu` (kiểm tra quyền từng route) → `AppLayout.tsx:95`
   - `rawMenuItems` (cây menu gốc, gating inline) → `AppLayout.tsx:215`
   - `filterEmptyChildren` (loại nhánh rỗng + divider hygiene) → `AppLayout.tsx:106`
   - `menuItems` (cây đã gating, đầu vào của lọc) → `AppLayout.tsx:382`

   Hệ quả: tìm kiếm chỉ thu hẹp trên tập đã gating — **không bao giờ hiện item ngoài quyền dù khớp từ khóa** (BR-024-15, AC-024-11).

2. **`filterMenuByQuery(items, query)`** — hàm thuần, `export` làm test seam:

   - `query.trim().toLowerCase()` (chuẩn hóa trước so khớp — VAL-024-06) → `AppLayout.tsx:131`
   - `if (!q) return items;` (rỗng/whitespace-only → trả cùng reference) → `AppLayout.tsx:132`
   - So khớp lá: `label.toLowerCase().includes(q)` (substring, không phân biệt hoa/thường, trên `label` tiếng Việt có dấu) → `AppLayout.tsx:138`
   - Guard `typeof node.label === 'string'` (label ReactNode không throw) → `AppLayout.tsx:138`
   - Node có `children` → giữ + đệ quy (lá reachable qua chuỗi tổ tiên)
   - Kết thúc: `return filterEmptyChildren(keepMatching(items))` (loại nhánh hết con khớp) → `AppLayout.tsx:141`
   - KHÔNG mutate input — trả cây mới (test A12)

3. **Giới hạn đã chốt (documented limitation):** không fold dấu tiếng Việt — gõ `"cang"` KHÔNG khớp `"Cảng"` (test A4). Spec yêu cầu so khớp trên label có dấu; chấp nhận và ghi rõ cho người dùng.

### 2.3 Tự mở tổ tiên khi đang lọc

- `effectiveOpenKeys` (openKeys hiệu dụng khi tìm kiếm) → `AppLayout.tsx:387`
- `collectOpenableKeys` (gom key mọi submenu còn children, đệ quy top-down) → `AppLayout.tsx:144`
- `onOpenChange={setOpenKeys}` (trả `openKeys` về user khi không tìm kiếm) → `AppLayout.tsx:469`

Lá khớp luôn nhìn thấy vì mọi nhánh còn hiển thị đều nằm trong `effectiveOpenKeys` (BR-024-13, UC-024-09; test B1–B5).

### 2.4 Khôi phục khi xóa từ khóa (AC-024-12)

Xóa toàn bộ chuỗi hoặc chuỗi chỉ gồm khoảng trắng → `trimmedSearchQuery` rỗng → `isSearching = false` → `displayedItems = menuItems` (toàn bộ cây theo quyền: 7 nhóm cấp 1 + item tiện ích) và `effectiveOpenKeys = openKeys` (user điều khiển) — khôi phục đúng trạng thái trước khi tìm kiếm (BR-024-14, UC-024-10; test A3/A9).

### 2.5 Không navigate / không gọi API (AC-024-13, BR-024-13/14/15)

- `handleMenuClick` (chỉ `navigate` khi key bắt đầu bằng `/`) → `AppLayout.tsx:394`
- `onClick={handleMenuClick}` trên `<Menu>` → `AppLayout.tsx:471`
- `items={displayedItems}` trên `<Menu>` → `AppLayout.tsx:470`

Không có request API tìm kiếm: `filterMenuByQuery`/`collectOpenableKeys` là hàm thuần client-side; không gọi `fetch`/axios; không endpoint mới (feature-brief mục 6: "không gọi API" — SA chốt giữ tĩnh).

### 2.6 Quyền không bị bypass (BR-024-15)

- `menuItems` (đầu vào lọc, đã gating) → `AppLayout.tsx:382`
- `filterMenuByQuery` chỉ THU HẸP tập này (output ⊆ input — test A10), không bao giờ thêm item ngoài quyền dù label khớp từ khóa (AC-024-11, BR-024-15).

### 2.7 Phạm vi và ràng buộc bắt buộc

- **Chỉ 2 file được phép đụng:** `frontend/src/components/AppLayout.tsx` + `frontend/src/components/AppLayout.test.tsx`.
- **KHÔNG** đổi `theme.ts`/`tokens.ts`/`themetokenchk.ts` (CSS `.sidebar-search` đã có), **KHÔNG** entity/migration/API/permission mới.
- Naming convention: identifier tiếng Anh chuẩn (`searchQuery`, `displayedItems`, `filterMenuByQuery`, …); label/placeholder/UI text tiếng Việt có dấu (`placeholder="Tìm kiếm"`).
- Không hardcode màu/spacing/font-size — dùng class/token có sẵn; không tự tạo Layout/Sider/Menu mới.

### 2.8 Ánh xạ acceptance → thiết kế → oracle

| Acceptance / rule | Yếu tố thiết kế | Oracle (test seam) |
|---|---|---|
| AC-024-11 (từ khóa thừa khoảng trắng, khớp không phân biệt hoa/thường, ẩn nhánh hết con khớp, không hiện item ngoài quyền) | 2.2 (mục 1–2), 2.6 | A1, A2, A4, A6, A10 |
| AC-024-12 (xóa chuỗi/whitespace-only → khôi phục đầy đủ, openKeys về user) | 2.4 | A3, A9 |
| AC-024-13 (Enter / click không navigate ngoài ý muốn, không request tìm kiếm) | 2.5 | A10, A13; không có `onKeyDown`/API trong code |
| VAL-024-06 (input `.trim()` trước khi so khớp) | 2.2 mục 2 + dòng `trimmedSearchQuery` | A2 |

---

## 3. Đối chiếu anchor docs ↔ code (consistency verdict đợt 4 — re-verify 2026-09-03)

Tất cả anchor dưới đây được re-grep/đọc trực tiếp trong phiên này. Mỗi claim: giá trị (màu/token/symbol) và vị trí code thực tế; kết luận tách bạch giữa **giá trị** (khớp tuyệt đối) và **số dòng trong tài liệu BA** (đã drift sau refactor — xem mục 4-D4; tài liệu BA READ-ONLY đợt này).

**C1 · `themetokenchk.sidebarBg` = `#1a3f83`** (nguồn: lean-spec:35, feature-brief:41)
- `sidebarBg` → `frontend/src/themetokenchk.ts:73`
- Kết quả: ✅ giá trị khớp — số dòng tài liệu drift (xem D4)

**C2 · `themetokenchk.sidebarActiveBg` = `#1B84FF`** (nguồn: lean-spec:35, feature-brief:41)
- `sidebarActiveBg` → `themetokenchk.ts:85`
- Kết quả: ✅ giá trị khớp — số dòng tài liệu drift (xem D4)

**C3 · `themetokenchk.sidebarSearchBg` = `rgba(255,255,255,0.12)`** (nguồn: lean-spec:35, feature-brief:41)
- `sidebarSearchBg` → `themetokenchk.ts:88`
- Kết quả: ✅ giá trị khớp — số dòng tài liệu drift (xem D4)

**C4 · CSS vars `--bg-sidebar` / `--sidebar-search-bg` / `--sidebar-active-bg`** (nguồn: lean-spec:35, feature-brief:41)
- `themeCssVariables` (export — object khai 3 biến) → `themetokenchk.ts:487`
- `--bg-sidebar` (giá trị trong object) → `themetokenchk.ts:505`
- `--sidebar-search-bg` (giá trị trong object) → `themetokenchk.ts:506`
- `--sidebar-active-bg` (giá trị trong object) → `themetokenchk.ts:507`
- Kết quả: ✅ giá trị khớp — số dòng tài liệu drift (xem D4)

**C5 · antdTheme Layout/Menu dark tokens** (nguồn: lean-spec:35, feature-brief:41)
- `Layout.siderBg` → `themetokenchk.ts:460`
- `Menu.darkItemBg` → `themetokenchk.ts:465`
- `Menu.darkItemSelectedBg` → `themetokenchk.ts:468`
- Kết quả: ✅ giá trị khớp — số dòng tài liệu drift (xem D4)

**C6 · AppLayout import theme CHK** (nguồn: lean-spec:35, feature-brief:41)
- `layout` → `AppLayout.tsx:30`
- `themeTokenChk` (import namespace `* as`) → `AppLayout.tsx:31`
- `ThemeTokenProvider` → `AppLayout.tsx:32`
- Kết quả: ✅ giá trị khớp — số dòng tài liệu drift (xem D4)

**C7 · Wrap Desktop Sider + Mobile Drawer bằng `ThemeTokenProvider`** (nguồn: lean-spec:35, feature-brief:41)
- Wrap Desktop Sider (mở) → `AppLayout.tsx:582`
- Wrap Desktop Sider (đóng) → `AppLayout.tsx:600`
- Wrap Mobile Drawer (mở) → `AppLayout.tsx:605`
- Wrap Mobile Drawer (đóng) → `AppLayout.tsx:614`
- Kết quả: ✅ giá trị khớp — số dòng tài liệu drift (xem D4)

**C8 · Fallback `var(--bg-sidebar, #1a3f83)`** (nguồn: lean-spec:35, feature-brief:41)
- Fallback nền Sider → `AppLayout.tsx:594`
- Fallback nền Drawer body → `AppLayout.tsx:610`
- Kết quả: ✅ giá trị khớp — số dòng tài liệu drift (xem D4)

**C9 · `theme.ts.sidebarBg` REVERT về `#12468C`** (nguồn: lean-spec:35/280, feature-brief:41)
- `sidebarBg` → `theme.ts:50`
- Kết quả: ✅ khớp cả giá trị lẫn số dòng (theme.ts không đổi)

**C10 · Các symbol tìm kiếm menu** (nguồn: lean-spec:31/46/48–50/115/136–138, feature-brief:37/45/55/77/140 — symbol + hành vi như mục 2)
- `searchQuery` → `AppLayout.tsx:161`
- Input tìm kiếm (`placeholder`/`value`/`onChange`) → `AppLayout.tsx:454`
- `filterMenuByQuery` → `AppLayout.tsx:130`
- `filterEmptyChildren` → `AppLayout.tsx:106`
- `canAccessMenu` → `AppLayout.tsx:95`
- `rawMenuItems` → `AppLayout.tsx:215`
- `MENU_PERMISSION_MAP` → `AppLayout.tsx:38`
- `menuItems` → `AppLayout.tsx:382`
- `trimmedSearchQuery` → `AppLayout.tsx:384`
- `effectiveOpenKeys` → `AppLayout.tsx:387`
- `collectOpenableKeys` → `AppLayout.tsx:144`
- `handleMenuClick` → `AppLayout.tsx:394`
- Kết quả: ✅ symbol/hành vi khớp — số dòng tài liệu drift (xem D4)

**C11 · CSS `.sidebar-search`** (nguồn: feature-brief:131)
- Class `.sidebar-search` (block CSS) → `theme.ts:418`
- `--sidebar-search-bg` → `theme.ts:289`
- Selector `.sidebar-search input` (ô nhập — "input") → `theme.ts:427`
- Selector `.sidebar-search .anticon` → `theme.ts:438`
- `themeCssVariables` (export — nơi override CHK) → `themetokenchk.ts:487`
- `--sidebar-search-bg` (giá trị override) → `themetokenchk.ts:506`
- Kết quả: ✅ khớp (`theme.ts` không đổi); số dòng override trong `themetokenchk` đã drift (xem D4)

**Kết luận mục 3:** toàn bộ 11 claim khớp về GIÁ TRỊ (màu/token/symbol/hành vi). Số dòng trong tài liệu BA đã drift ở 10/11 claim sau refactor code (chỉ C9 — `theme.ts` — khớp tuyệt đối vì file không đổi). Không ảnh hưởng logic — vấn đề đồng bộ tài liệu (mục 4-D2/D4, BA-owned).

---

## 4. Sai lệch phát hiện (discrepancies)

| # | Mô tả | Mức độ | Chủ sở hữu / hành động |
|---|---|---|---|
| D1 | Brief dispatch gốc mô tả input "chết" (số dòng cũ: 561–567), `menuItems` (498), `filterEmptyChildren` (474), `rawMenuItems` (230) — **stale**, là trạng thái TRƯỚC implementation đợt 2 | Thông tin — không phải lỗi code | Không cần hành động; anchor đúng tại mục 3 |
| D2 | Drift số dòng trong tài liệu BA (đợt 2 note): lean-spec:31/49/50/115/136 và feature-brief:37/55/77 cite `filterMenuByQuery`, `collectOpenableKeys`, `filterEmptyChildren`, `handleMenuClick`, pipeline ở số dòng không còn khớp code sau refactor | Cosmetic — không ảnh hưởng logic | BA (2 tài liệu READ-ONLY đợt này) — chỉnh ở đợt docs kế tiếp |
| D3 | Test file `frontend/src/components/AppLayout.test.tsx` đã tồn tại, phủ đủ seam yêu cầu (A1–A13/B1–B5) — ghi nhận là bằng chứng | Ghi nhận | — |
| D4 | Refactor code (sau khi BA đồng bộ docs đợt 4) đã dịch chuyển symbol ~65 dòng: mọi số dòng menu-search + theme-CHK ghi trong lean-spec/feature-brief hiện lệch so với code. Anchor ĐÚNG theo code hiện tại được liệt kê đầy đủ tại mục 3 (C1–C11) và mục 5 (WO). `theme.ts` không đổi (50/289/418–442) | Cosmetic (docs cũ vs code mới) | BA đồng bộ 2 tài liệu ở đợt docs kế tiếp theo mục 3; plan này đã ghi anchor đúng code hiện tại |

---

## 5. Work orders — verify-and-lock (frontend developer)

Phạm vi BẮT BUỘC: `frontend/src/components/AppLayout.tsx` + `frontend/src/components/AppLayout.test.tsx`. Không đụng file nào khác.

**WO-1 · Wiring state ↔ input**
- `searchQuery` → `AppLayout.tsx:161`
- Render guard (`!collapsed && !isMenuFullScreen`) → `AppLayout.tsx:451`
- Container `.sidebar-search` → `AppLayout.tsx:452`
- `value={searchQuery}` → `AppLayout.tsx:456`
- `onChange={(e) => setSearchQuery(e.target.value)}` → `AppLayout.tsx:457`
- Oracle: input controlled; không có `onKeyDown`/`onPressEnter`; ẩn khi `collapsed`/`isMenuFullScreen`

**WO-2 · Semantics `filterMenuByQuery`**
- `filterMenuByQuery` → `AppLayout.tsx:130`
- Oracle: (a) `.trim()` + `.toLowerCase()` trước so khớp (VAL-024-06); (b) substring không phân biệt hoa/thường trên `label` tiếng Việt có dấu; (c) rỗng sau trim → trả cùng reference; (d) cha giữ khi còn con khớp; (e) nhánh hết con khớp bị loại (qua `filterEmptyChildren` → `AppLayout.tsx:106`) kèm divider hygiene; (f) KHÔNG mutate input; (g) label ReactNode không throw

**WO-3 · Tự mở tổ tiên**
- `effectiveOpenKeys` → `AppLayout.tsx:387`
- `collectOpenableKeys` → `AppLayout.tsx:144`
- `onOpenChange={setOpenKeys}` → `AppLayout.tsx:469`
- Oracle: khi `isSearching`, mọi submenu còn hiển thị đều có key trong openKeys; khi không tìm kiếm, `effectiveOpenKeys = openKeys` (user điều khiển)

**WO-4 · Restore-on-clear**
- `trimmedSearchQuery` → `AppLayout.tsx:384`
- `isSearching` → `AppLayout.tsx:385`
- `displayedItems` → `AppLayout.tsx:386`
- Oracle: xóa hết / whitespace-only → `displayedItems === menuItems` (cây đầy đủ theo quyền), `effectiveOpenKeys = openKeys` (AC-024-12)

**WO-5 · Không navigate / không API**
- `items={displayedItems}` → `AppLayout.tsx:470`
- `onClick={handleMenuClick}` → `AppLayout.tsx:471`
- `handleMenuClick` → `AppLayout.tsx:394`
- Oracle: chỉ `e.key.startsWith('/')` mới `navigate`; không fetch/axios trong luồng lọc; Enter không side-effect (AC-024-13, BR-024-14/15)

**WO-6 · Test seams trong `AppLayout.test.tsx`**
- File test → `frontend/src/components/AppLayout.test.tsx`
- Oracle: bộ test phải phủ — lọc theo label (A1, A5, A6, A7); trim (A2); case-insensitive + không fold dấu (A4); restore-on-clear (A3, A9); permission-gating không bị ảnh hưởng, output ⊆ input (A10); no-mutation (A12); non-string label (A11); auto-open keys (B1–B5). Thiếu case nào → bổ sung ĐÚNG file này

**Lệnh kiểm chứng bắt buộc (chạy từ `frontend/`):**
- Unit test đúng file: `npx vitest run src/components/AppLayout.test.tsx` (runner thu thập theo glob `frontend/**/*.test.*`)
- Typecheck package: `pnpm exec tsc --noEmit`
- Không chạy suite toàn cục làm bằng chứng Pass; không sửa file ngoài 2 file trên

---

## 6. Rủi ro và giới hạn đã chốt

| Rủi ro | Mô tả | Xử lý |
|---|---|---|
| R1 | Gõ không dấu (`"cang"`) không khớp `"Cảng"` — không fold diacritics | Chấp nhận theo spec (so khớp trên label có dấu); ghi chú test A4; cần fold → feature mới, ngoài scope |
| R2 | `label` dạng ReactNode (icon) — guard `typeof label === 'string'` | Đã có trong `filterMenuByQuery` (→ `AppLayout.tsx:130`) + test A11 |
| R3 | Drift số dòng tài liệu BA (D2/D4) | Theo dõi; BA chỉnh đợt docs kế tiếp — không ảnh hưởng logic |
| R4 | Hiệu năng với cây ~7 nhóm × 4 cấp | Lọc client-side thuần, mỗi keystroke O(n) nhỏ — không cần memo/debounce |
| R5 | Tái diễn anchor drift sau mỗi refactor code (đã xảy ra 2 lần với M-024) | Work order yêu cầu re-grep anchor trên code TRƯỚC khi ghi docs; bài học đã lưu workspace memory |

---

## 7. Tóm tắt quyết định (decision log)

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| State | `searchQuery` (state React cục bộ) → `AppLayout.tsx:161` | Không có API/DB (feature-brief mục 6–7); dữ liệu chỉ phục vụ hiển thị tức thời |
| Thuật toán | Substring case-insensitive trên `label` sau `.trim()`, lọc trên `menuItems` sau gating, prune qua `filterEmptyChildren` | BR-024-13/15, VAL-024-06; tái sử dụng pattern có sẵn (→ `AppLayout.tsx:106`) — không thêm abstraction mới |
| Auto-open | `collectOpenableKeys(displayedItems)` khi `isSearching` | UC-024-09, BR-024-13 — lá khớp phải nhìn thấy được |
| Restore | `isSearching=false` → `displayedItems = menuItems`, `openKeys` user điều khiển | AC-024-12, BR-024-14 — không đổi trạng thái vĩnh viễn |
| Phạm vi | Chỉ `AppLayout.tsx` + `AppLayout.test.tsx` | Triage C1 scope_expansion; không API/entity/migration/theme-token |

---

## 8. Thiết kế mô hình 2 màn hình (đợt 5)

> **Triage:** `TRI-1788409709741-75fa` (đợt 5 — scope_expansion C2, reconcile-add docs-only). Mô hình này được BA chốt tại `ba/00-lean-spec.md` §1 + AC-024-01..16 và `_features/F-292-.../feature-brief.md` §1/§5; plan này ghi nhận quyết định thiết kế làm cơ sở work order cho frontend developer. Thay thế mô hình menu cũ (7 nhóm cấp 1 × submenu sâu, đợt 1–4) bằng mô hình **2 màn hình**.

**Quyết định thiết kế đã chốt (5 điểm):**

| # | Quyết định | Mô tả |
|---|---|---|
| 1 | Màn "Danh mục chức năng" sau đăng nhập | Sau đăng nhập, hệ thống hiển thị màn **"Danh mục chức năng"** với đúng **6 khối** (danh sách cố định, đúng thứ tự bên dưới). Mỗi khối là cổng vào một nhóm nghiệp vụ. |
| 2 | Route `/kcht-directory` cho khối 1 | Click khối **"Quản lý KCHT hàng hải"** mở route `/kcht-directory`: màn liệt kê **28 loại KCHT** phân cấp cha–con C0–C3 theo `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` (cây chuẩn ở mục 8.2). |
| 3 | Sidebar 6 nhóm cấp 1 phẳng | Sidebar còn đúng **6 nhóm cấp 1**, phẳng — **không submenu sâu** (bỏ cây submenu nhiều cấp của mô hình cũ); mỗi nhóm tương ứng một khối ở màn "Danh mục chức năng". |
| 4 | Không filter bar | Cả màn "Danh mục chức năng" lẫn màn `/kcht-directory` **KHÔNG có filter bar**. |
| 5 | Token discipline | UI dùng token `theme.ts` / `tokens.ts` / `themetokenchk.ts`; **cấm hardcode** hex/spacing/font-size (theo AGENTS.md UI Theme Convention). |

**8.1 — 6 khối chức năng (thứ tự chính xác):**

1. Quản lý KCHT hàng hải
2. Quản lý tài sản KCHT hàng hải
3. Quản lý quy hoạch & vận hành
4. Phê duyệt
5. Báo cáo thống kê
6. Quản trị hệ thống

**8.2 — 28 loại KCHT phân cấp C0–C3 (chuẩn `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`, không re-derive):**

- Cảng biển (C0) → Bến cảng (C1) → Cầu cảng (C2)
- Cảng biển (C0) → Luồng hàng hải (C1) → { Bến phao (C2); Nhà trạm quản lý vận hành phao tiêu (C2) → Phao, tiêu (C3); Đèn biển & nhà trạm (C2); Đê chắn sóng, đê chắn cát, kè (C2) }
- Cảng biển (C0) → { Khu neo đậu; Khu chuyển tải; Khu tránh, trú bão; Cơ sở sửa chữa, đóng tàu } (C1)
- Hệ thống VTS (C0) → Trung tâm điều hành VTS (C1) → { Trạm Radar; Hệ thống AIS; Hệ thống CCTV; Hệ thống SCADA; Hệ thống truyền dẫn; Hệ thống phụ trợ VTS } (C2)
- Cảng cạn (C0)
- Nhóm "Đài viễn thông hàng hải" (gắn lỏng — cha là Trung tâm điều hành VTS **hoặc** Cảng biển) → { Đài TTDH; Hệ thống VHF; Đài Inmarsat; Đài LRIT; Đài Cospas-Sarsat; Đài TTXLTT Hà Nội }

**8.3 — Ghi chú kỹ thuật (bàn giao developer):**

- Wireframe chi tiết 2 màn hình: `design/wireframe-menu-khoi.md` (mermaid 2-screen flow + markmap cây 28 loại).
- Route/key/identifier tiếng Anh (`/kcht-directory`, `kcht-directory`, `KchtDirectoryPage`); nhãn hiển thị tiếng Việt có dấu.
- Code hiện tại là cơ sở refactor: `rawMenuItems` (cây menu tĩnh cần restructure về 6 nhóm phẳng) → `AppLayout.tsx:215`; `menuItems` (sau gating `filterEmptyChildren`) → `AppLayout.tsx:382`; `handleMenuClick` (điều hướng theo `key`) → `AppLayout.tsx:394`; route đăng nhập + màn khối do frontend developer xử lý theo feature-brief (code ngoài phạm vi đợt docs này).
- Rủi ro R5 (anchor drift sau refactor) áp dụng cho đợt 5: work order bắt buộc re-grep anchor trên code TRƯỚC khi ghi docs.
