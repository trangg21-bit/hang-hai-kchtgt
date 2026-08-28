# M-024 — QA Wave-1: Acceptance Oracle (tiêu chí chấp nhận & kịch bản kiểm thử)

> Module: **M-024 — Tái cấu trúc Menu & Navigation** · Feature: **F-292**
> Stage: `engineering-qa-engineer` wave-1 (authoring) · Ngày: 2026-08-28
> Trạng thái: **ORACLE AUTHORED — wave-1 KHÔNG chạy battery; wave-2 sẽ thực thi theo mục 7.**
> Triage nguồn: `TRI-1787823566528-bb3e.json` (C1 — search menu sidebar) · `TRI-1787899754098-59d2.json` (C2 solo — theme CHK đợt 3)

---

## 1. Tuyên bố phạm vi wave-1

- **Wave-1 chỉ AUTHOR oracle** (file này). Không chạy kiểm thử, không sửa code, không sửa tài liệu ngoài file `qa/07-qa-report-w1.md` (WRITE ONLY).
- **Không có implementation mới trong wave này**: code search filter đã implement và verify ở đợt 2 (`filterMenuByQuery` + `collectOpenableKeys` trong `frontend/src/components/AppLayout.tsx`, kèm `AppLayout.test.tsx` 18 test); đợt 3 là **docs-sync thuần** (theme CHK, triage `TRI-1787899754098-59d2`, lane C2 solo — code `theme.ts`/`AppLayout.tsx` đã implement + verify; tài liệu đã được BA đồng bộ và SA xác nhận docs-only, design/00-design-plan.md mục 1/4).
- **Scope READ-ONLY (đã đọc để viết oracle này)**: `ba/00-lean-spec.md`, `design/00-design-plan.md`, `_features/F-292-*/feature-brief.md`, `docs/intel/_intake/TRI-1787823566528-bb3e.json`, `docs/intel/_intake/TRI-1787899754098-59d2.json`, `frontend/src/components/AppLayout.tsx`, `frontend/src/theme.ts`, `frontend/src/themetokenchk.ts`, `frontend/package.json`, `frontend/vitest.config.ts`.
- **Out of scope (cấm sửa)**: `frontend/src/**` (code), `theme.ts`/`tokens.ts`/`themetokenchk.ts` (chỉ đọc), backend, entity, migration, API, tài liệu module khác. Scope thay đổi = `AppLayout.tsx` + `AppLayout.test.tsx` + tài liệu M-024.
- **Không author test code** trong oracle này (developer viết `AppLayout.test.tsx`); oracle chỉ định nghĩa scenario + câu lệnh assertable.

---

## 2. Oracle đợt 3 (docs-sync theme CHK) — AC-1..AC-6

Mọi anchor bên dưới **đã được QA kiểm chứng trực tiếp bằng grep trong phiên này** (trừ `theme.ts:287` có 2 nguồn tài liệu độc lập: design plan mục 2 + intake `seam_claims`). Wave-2 lặp lại đúng lệnh verify.

| ID | Tiêu chí (giá trị kỳ vọng) | Anchor code | Cách verify wave-2 | Kết quả cần đạt |
|---|---|---|---|---|
| AC-1 | Tài liệu M-024 (lean-spec dòng 29/282, feature-brief dòng 39) state `sidebarBg` = **#1a3f83**, không phải giá trị cũ **#12468C** | `theme.ts:50` — `sidebarBg: '#1a3f83',` ; `themetokenchk.ts:72` — `export const sidebarBg = '#1a3f83';` | `grep -n "sidebarBg" frontend/src/theme.ts frontend/src/themetokenchk.ts` + đọc dòng 50/72 | Cả 2 file = `#1a3f83`; **không** còn `#12468C` trong `theme.ts` |
| AC-2 | Tài liệu state accent tiêu đề = **#273e7c** | `themetokenchk.ts:36` — `export const actionPrimary = '#273e7c';` ; `AppLayout.tsx:629` và `:862` — `color: '#273e7c'` | `grep -n "273e7c" frontend/src/themetokenchk.ts frontend/src/components/AppLayout.tsx` | 3 anchor đều `#273e7c` |
| AC-3 | Tài liệu state fallback `--bg-sidebar` = **#1a3f83** | `theme.ts:287` — `--bg-sidebar: ${colors.sidebarBg};` (hiệu lực = #1a3f83 vì `colors.sidebarBg` tại :50) ; `theme.ts:618` và `:1006` — `var(--bg-sidebar, #1a3f83)` ; `AppLayout.tsx:782` và `:796` — `var(--bg-sidebar, #1a3f83)` | `grep -n "bg-sidebar" frontend/src/theme.ts frontend/src/components/AppLayout.tsx` | 5 anchor đều #1a3f83; không còn `#1E2129` trong `AppLayout.tsx` |
| AC-4 | **Không file code/theme/token/test nào bị sửa** bởi đợt 3; diff chỉ giới hạn `docs/modules/M-024-tai-cau-truc-menu-navigation/**` | — | `git status --porcelain` + `git diff --name-only HEAD` | Mọi đường dẫn thay đổi đều bắt đầu bằng `docs/modules/M-024-tai-cau-truc-menu-navigation/`; **0** file `frontend/src/**`, `src/main/**`, `tokens.ts`, `themetokenchk.ts` |
| AC-5 | `feature-brief.md` giữ **đúng 7 section theo đúng thứ tự/tiêu đề** template (`docs/feature-brief-template.md`); `lean-spec` không còn mâu thuẫn — câu ràng buộc cũ "KHÔNG sửa theme.ts" đã được reconciled bằng note đợt 3 (dòng 29/282 ghi rõ ngoại lệ triage 59d2) | feature-brief headings: `## 1. Mô tả ngắn` (dòng 33) → `## 7. Phần kỹ thuật — cấu trúc bảng` (dòng 141); đợt 3 note tại mục 1 dòng 39; lean-spec dòng 15/29/282 | `grep -n "^## " feature-brief.md` + đọc dòng 29/282 lean-spec | Đủ 7 section, đúng thứ tự, đúng tiêu đề; dòng 29/282 ghi rõ đợt 3 ĐÃ thay đổi `theme.ts` + `AppLayout.tsx` (giá trị #1a3f83/#273e7c) |
| AC-6 | `lean-spec` bảo toàn toàn bộ UC/BR/VAL/D/AC trước đó (không regression) | Các ID bắt buộc hiện diện: UC-024-09 (dòng 115), BR-024-04/11/12/13/14/15 (dòng 133–138), VAL-024-06 (dòng 232), AC-024-10/11/12/13 (dòng 270–273) | `grep -c "UC-024-\|BR-024-\|VAL-024-\|AC-024-\|^## " ba/00-lean-spec.md` + đối chiếu danh sách ID | Mọi ID cũ còn nguyên nội dung; không ID nào bị xóa/đổi ý nghĩa |

---

## 3. Oracle `filterMenuByQuery` — unit-test scenarios (A1..A13)

**Contract (code anchors, `AppLayout.tsx`):** `export function filterMenuByQuery(items, query)` :202 · `q = query.trim().toLowerCase()` :203 · `keepMatching`: divider → giữ :208 · node có `children` → rebuild `{ ...node, children: keepMatching(children) }` :209 · leaf → giữ iff `typeof label === 'string' && label.toLowerCase().includes(q)` :210 · trả về `filterEmptyChildren(keepMatching(items))` :213.

| ID | Scenario | Oracle assertable (wave-2) | Spec ID |
|---|---|---|---|
| A1 | **Label match substring tiếng Việt**: menu có leaf `label: 'Quản lý cảng biển'`; `query: 'cảng'` | Output chứa key của leaf đó; các leaf khác không chứa "cảng" bị loại | AC-024-11, BR-024-14 |
| A2 | **`.trim()`**: `query: ' cảng '` (khoảng trắng thừa 2 đầu) | Output **bằng sâu (deep-equal)** output của `query: 'cảng'` (cùng key-set, cùng thứ tự) | AC-024-11, VAL-024-06 |
| A3 | **Whitespace-only restore**: `query: '   '` | `q = ''` → mọi string-label đều khớp (`includes('') === true`) → output = toàn bộ cây đầu vào (deep-equal, cùng 7 nhóm cấp 1 + item tiện ích) | AC-024-12, VAL-024-06 |
| A4 | **Case-insensitive**: `query: 'CẢNG'` vs label `'cảng'` | Output giữ key có label 'cảng' (so khớp sau `toLowerCase()` 2 phía) | AC-024-11 |
| A5 | **Negative — không fold dấu tiếng Việt**: `query: 'cang'` (không dấu) vs label `'cảng'` | Output **không** chứa key đó (spec không yêu cầu chuẩn hóa dấu; chỉ so khớp chuỗi con đúng ký tự) | AC-024-11 (boundary âm) |
| A6 | **Parent/child keep+drop (D-5a, BR-024-14)**: parent `'Quản lý cảng biển'` có 2 con `['Bến cảng', 'Luồng hàng hải']`; `query: 'bến'` | Parent key **còn trong output** với `children` = chỉ `['Bến cảng']` (rebuild `{...node, children}` — key parent không đổi, sibling 'Luồng hàng hải' bị drop); lặp lại với `query: 'luồng'` → giữ con còn lại | BR-024-14, D-5a |
| A7 | **Parent hết con khớp → ẩn nhánh**: parent không khớp label, mọi con không khớp | `filterEmptyChildren` loại parent khỏi output (nhánh trống) — thống nhất BR-024-04 | BR-024-14, BR-024-13 |
| A8 | **Divider hygiene**: input có divider giữa các nhóm | Output không có 2 divider liên tiếp (collapse tại `filterEmptyChildren` :192–194); divider chỉ xuất hiện ở vị trí vốn có trong input (subset vị trí), không sinh divider mới | BR-024-13, AC-024-11 |
| A9 | **Restore-on-clear trả về full tree**: `query: ''` | Output **deep-equal** input (cùng key-set, cùng cấu trúc, cùng thứ tự) — không biến đổi gì | AC-024-12 |
| A10 | **Permission gating — output ⊆ input**: feed `menuItems` đã qua `canAccessMenu`/`filterEmptyChildren` (`AppLayout.tsx:567`); `query` bất kỳ | Mọi key trong output ∈ key-set của input (không key mới, không item ngoài quyền trồi lên qua tìm kiếm) | BR-024-15 |
| A11 | **Non-string label guard**: leaf `label` là ReactNode (vd `<span>Quản lý <b>cảng</b></span>` hoặc icon+text) | Không throw; node có ReactNode label **không** bị match theo label (`typeof label === 'string'` = false tại :210) — node đó chỉ giữ nếu có children khớp | BR-024-13, AC-024-11 |
| A12 | **No match → rỗng**: `query: 'zzzxyz'` không trùng label nào | Output = `[]` (mọi parent bị prune) | AC-024-11 (boundary âm) |
| A13 | **No navigation, no API**: gọi `filterMenuByQuery` với mọi query | (i) Unit: `location.pathname` không đổi trước/sau khi gọi; không spy thấy `fetch`/`axios`/`navigate` được gọi trong thân hàm; (ii) static: thân hàm :202–213 không import/gọi router hay API (hàm thuần) | AC-024-13, BR-024-13 |

---

## 4. Oracle `collectOpenableKeys` — auto-open scenarios (B1..B5)

**Contract (code anchors):** `export function collectOpenableKeys(items)` :216 — đệ quy, push `node.key as string` cho node **có children** (:219–220). Wiring: `isSearching = trimmedSearchQuery.length > 0` :570 · `displayedItems = isSearching ? filterMenuByQuery(menuItems, trimmedSearchQuery) : menuItems` :571 · `effectiveOpenKeys = isSearching ? collectOpenableKeys(displayedItems) : openKeys` :572.

| ID | Scenario | Oracle assertable (wave-2) | Spec ID |
|---|---|---|---|
| B1 | **Auto-open path**: cây 3 cấp A→B→C, `query` khớp C | `filterMenuByQuery` giữ A(children B(children C)); `collectOpenableKeys(output)` chứa **key của A và B** (mọi ancestor của node khớp) → submenu được mở để hiện C | BR-024-14, D-5a, AC-024-11 |
| B2 | **No match → rỗng**: `filterMenuByQuery` trả `[]` | `collectOpenableKeys([]) = []` (không key nào) | AC-024-11 |
| B3 | **Deterministic, không trùng**: query khớp nhiều nhánh | Output là danh sách string **không trùng key**, thứ tự ổn định theo thứ tự duyệt cây (chạy 2 lần → bằng nhau) | BR-024-14 |
| B4 | **Clear → không ép open**: `query: ''` / whitespace-only | `isSearching = false` → `displayedItems === menuItems` và `effectiveOpenKeys === openKeys` (trạng thái mở của user được giữ nguyên, không bị override bởi `collectOpenableKeys`) | AC-024-12 |
| B5 | **Type guard**: mọi phần tử output | `typeof key === 'string'` với mọi key (node.key ép `as string` :219) | BR-024-13 |

---

## 5. Oracle manual smoke (C1..C3) — verify UI trên browser/dev server

| ID | Thao tác | Oracle quan sát được | Spec ID |
|---|---|---|---|
| C1 | Gõ `'cảng'` vào ô tìm kiếm (`AppLayout.tsx:640–642`, placeholder "Tìm kiếm") | Cây menu thu hẹp: chỉ item có label chứa "cảng" còn hiển thị; **mọi submenu còn hiển thị đều đang mở** (ancestor auto-open); item không khớp ẩn; nhánh hết con khớp ẩn | AC-024-11 |
| C2 | Xóa toàn bộ chuỗi (hoặc để lại chuỗi chỉ gồm khoảng trắng) | Menu **khôi phục đầy đủ**: đúng 7 nhóm cấp 1 + item tiện ích theo quyền (đếm nhóm cấp 1 = 7); trạng thái mở trở về `openKeys` của user (không bị ép) | AC-024-12 |
| C3 | Gõ từ khóa + nhấn Enter; click item khớp | Không xảy ra điều hướng ngoài ý muốn khi gõ/Enter (URL không đổi); DevTools Network **không** ghi nhận request API tìm kiếm; chỉ click vào item lá mới navigate (như AC-024-06) | AC-024-13 |

---

## 6. Coverage map — Spec ID → scenario

| Spec ID | Nội dung tóm tắt | Scenario(s) | Oracle khả thi? |
|---|---|---|---|
| AC-024-11 | Lọc theo label tiếng Việt sau `.trim()`, substring case-insensitive; item không khớp ẩn; nhánh hết con khớp ẩn; không item ngoài quyền hiển thị | A1, A2, A4, A5, A6, A7, A8, A10, A11, A12, B2, C1 | ✅ (unit + manual) |
| AC-024-12 | Xóa chuỗi/whitespace → khôi phục menu đầy đủ (7 nhóm cấp 1) | A3, A9, B4, C2 | ✅ |
| AC-024-13 | Không navigate, không request API khi tìm kiếm | A13, C3 | ✅ (unit + manual) |
| VAL-024-06 | Mọi chuỗi nhập phải `.trim()` trước khi dùng | A2, A3, B4 | ✅ |
| BR-024-13 | Chỉ lọc hiển thị trên cây đã gating quyền; không navigate/API/đổi dữ liệu; `.trim()` | A7, A8, A11, A13, B5, C3 | ✅ |
| BR-024-14 | Giữ item khi label chứa chuỗi sau trim (case-insensitive); submenu giữ nếu ≥1 con khớp, hết con khớp → ẩn; rỗng/whitespace → khôi phục | A1, A3, A4, A6, A7, A9, B1, B3 | ✅ |
| BR-024-15 | Tìm kiếm không bypass quyền (chỉ lọc trên tập đã gating) | A10, C1 | ✅ |
| D-5a (SA chốt) | Hành vi cha/con khi lọc: giữ parent + con khớp qua rebuild, drop sibling | A6, A7, B1 | ✅ |
| AC-1..AC-6 (đợt 3) | Docs-sync theme CHK (mục 2) | mục 2 bảng | ✅ |

---

## 7. Verification commands — wave-2 bắt buộc chạy và phải Pass

> Runner đã xác nhận: `frontend/package.json` `"test": "vitest run"` (vitest ^4.1.11); `vitest.config.ts` include `src/components/AppLayout.test.tsx`. Test directive scope đã chuẩn hóa về **exact affected test file** — không chạy full suite (ngoài scope gate wave-2).

1. **Typecheck (project-wide):**
   ```
   cd frontend && npx tsc --noEmit
   ```
   → **exit 0, 0 violation** (tương đương `pnpm exec tsc --noEmit` theo project shape).
2. **Test — exact affected file:**
   ```
   cd frontend && npx vitest run src/components/AppLayout.test.tsx
   ```
   → **18 test, tất cả Pass** (con số 18 = test A1–A13 + B1–B5 theo evidence đợt 2; nếu số lượng khác, ghi nhận delta và đối chiếu từng test với oracle mục 3/4 — không được tự ý coi là Pass khi thiếu scenario). *Ghi chú evidence rộng hơn của prior run (11 files / 91 tests) chỉ là thông tin tham khảo, không phải gate wave-2.*
3. **AC-4 — diff scope check:**
   ```
   git status --porcelain
   git diff --name-only HEAD
   ```
   → mọi thay đổi nằm trong `docs/modules/M-024-tai-cau-truc-menu-navigation/**`; **0** file `frontend/src/**` / backend / `tokens.ts` / `themetokenchk.ts`.
4. **AC-1..AC-3, AC-5, AC-6 — anchor & template check:** các lệnh grep/read ở mục 2 (đọc đúng dòng anchor, so sánh đúng giá trị kỳ vọng).

Mỗi AC/ID phải có bằng chứng thực thi (lệnh đã chạy + output quan sát) trong `07-qa-report-w2.md`; criterion không chạy được → báo **unverifiable**, không tự đánh dấu satisfied.

---

## 8. Quan sát phi-blocking (không fail AC — ghi nhận cho vòng sau)

| ID | Quan sát | Mức độ | Owner đề xuất |
|---|---|---|---|
| OBS-1 | `lean-spec.md:136` (BR-024-13) ghi anchor "menuItems tại `AppLayout.tsx` dòng **498**" nhưng code hiện tại đặt `menuItems` tại dòng **567** (thay đổi từ đợt 2 khi thêm search wiring). Anchor drift tài liệu — không ảnh hưởng hành vi, ngoài write scope QA | Low | BA (vòng docs-sync kế tiếp) |
| OBS-2 | `tokens.ts:53` vẫn giữ `sidebarBg = '#12468C'` (giá trị đợt 1) trong khi `theme.ts:50` = `#1a3f83`. Không thuộc anchor AC-1..AC-3 và ngoài edit scope đợt 3; `AppLayout.tsx` không tiêu thụ `tokens.sidebarBg` (sidebar dùng `var(--bg-sidebar, #1a3f83)` từ `theme.ts`). Ghi nhận để rà soát nhất quán token layer ở vòng theme kế tiếp | Low | PMO / BA–SA |

---

## 9. Kết luận wave-1

- Oracle đã author đầy đủ: **AC-1..AC-6** (docs-sync đợt 3, mỗi AC có giá trị kỳ vọng chính xác + code anchor) + **A1..A13** (`filterMenuByQuery`) + **B1..B5** (`collectOpenableKeys`/auto-open) + **C1..C3** (manual smoke).
- Mọi scenario map tới spec ID (AC-024-11/12/13, VAL-024-06, BR-024-13/14/15, D-5a) — xem coverage map mục 6.
- Verification commands wave-2 cố định tại mục 7 (tsc project-wide exit 0; vitest exact file 18 test; git diff scope; anchor checks).
- Wave-1 không chạy battery, không author test code, không sửa code/theme/token/entity/migration/API — đúng scope.
