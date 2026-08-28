# M-024 — Báo cáo review đợt 3 (docs-sync theme CHK) — engineering-code-reviewer

> **Module:** M-024 — Tái cấu trúc Menu & Navigation
> **Feature:** F-292 — Tái cấu trúc menu & điều hướng
> **Change được review:** đợt 3 docs-sync (triage `TRI-1787899754098-59d2`, change_class C2 solo lane — theme CHK). Pipeline **không đổi code** — review phán xét tài liệu phản ánh đúng code hiện tại hay không, có mâu thuẫn nào không.
> **Files thuộc pipeline đợt 3:** `ba/00-lean-spec.md` (BA), `_features/F-292-.../feature-brief.md` (BA), `design/00-design-plan.md` (SA), `qa/07-qa-report-w2.md` + `qa/acceptance-map.json` (QA), `dev/05-fe-dev-w1-theme-chk-docs-sync.md` (dev).
> **Verdict: Pass** — F-1 đã được SA đóng (`design/00-design-plan.md:28/29/70` cập nhật sang 632/865/785/799); re-grep phiên này: **0** stale 629/862/782/796 trong design-plan (E-14).
> **Ngày:** 2026-08-28

---

## 1. Bằng chứng đã thực thi trong phiên này (không re-derive từ prior stage)

| # | Lệnh / thao tác | Kết quả quan sát |
|---|---|---|
| E-1 | `grep "1a3f83\|1A3F83"` trong `frontend/src/theme.ts` | `:50 sidebarBg: '#1a3f83'`; `:369` (comment); `:618 var(--bg-sidebar, #1a3f83) !important`; `:1004` (comment); `:1006 var(--bg-sidebar, #1a3f83) !important`; `:2356` (comment) |
| E-2 | `grep "bg-sidebar"` trong `frontend/src/theme.ts` | `:287 --bg-sidebar: ${colors.sidebarBg};` (định nghĩa CSS var) + 11 usage `var(--bg-sidebar)` |
| E-3 | `grep "12468C\|12468c"` trong `frontend/src/theme.ts` | **0 match** |
| E-4 | `grep "1E2129\|1e2129"` trong `frontend/src/components/AppLayout.tsx` | **0 match** |
| E-5 | `grep "273e7c\|273E7C"` trong `AppLayout.tsx` | `:632` (sidebar fullscreen title) · `:865` (topbar title) |
| E-6 | `grep "bg-sidebar"` trong `AppLayout.tsx` | `:785 background: isMenuFullScreen ? '#fff' : 'var(--bg-sidebar, #1a3f83)'` · `:799 styles={{ body: { ..., background: 'var(--bg-sidebar, #1a3f83)' }, ... }}` |
| E-7 | `grep "1a3f83"` + `"273e7c"` trong `themetokenchk.ts` | `:36 export const actionPrimary = '#273e7c'` · `:72 export const sidebarBg = '#1a3f83'` |
| E-8 | read ngữ cảnh `AppLayout.tsx:620-649` / `:770-814` / `:850-879` | Xác nhận `#273e7c` là `Typography.Title` (HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI) tại sidebar fullscreen + topbar; `var(--bg-sidebar,#1a3f83)` là nền `Sider` desktop + `Drawer` mobile |
| E-9 | `grep "629\|862\|782\|796"` toàn cây `docs/modules/M-024-tai-cau-truc-menu-navigation` | Chỉ còn trong `design/00-design-plan.md:28/:29/:70` (live docs) + các file `.archive/` (lịch sử, ngoài scope) — **lean-spec và feature-brief sạch** |
| E-10 | `npx vitest run src/components/AppLayout.test.tsx` (workdir frontend) | **18 tests, 18 passed** (A1–A13 + B1–B5), exit 0 |
| E-11 | `npx tsc --noEmit` (workdir frontend) | **0 violations**, exit 0 |
| E-12 | read `frontend/vitest.config.ts` | `include: ['src/store/**/*.test.ts', 'src/services/**/*.test.ts', 'src/components/AppLayout.test.tsx']`; `exclude: ['node_modules','dist','tests/**','e2e/**','src/hooks/**']` — không chứa `src/**/*.test.tsx` trong include, `src/hooks/**` vẫn bị loại |
| E-13 | `grep "^## "` trong `feature-brief.md` | Đúng 7 section `##` theo thứ tự template: 1 Mô tả ngắn `:33`, 2 Trường dữ liệu `:41`, 3 Trạng thái và phê duyệt `:55`, 4 Quy tắc và phân quyền riêng `:61`, 5 Điểm khác biệt `:118`, 6 Phần kỹ thuật — đường dẫn gọi dữ liệu `:131`, 7 Phần kỹ thuật — cấu trúc bảng `:141` |
| E-14 | `grep "629\|862\|782\|796"` trong `design/00-design-plan.md` (re-verify F-1 fix) | **0 match**; rows 5-6 (`:28/:29`) + bảng risk (`:70`) giờ cite **632/865/785/799** (read) — F-1 closed |

**Hạn chế độc lập:** lệnh `git status` / `git diff` bị permission layer từ chối trong phiên này (3 lần, không retry). Kết luận scope docs-only dựa trên: (a) QA-w2 AC-4 Pass trên orchestrator git evidence (shared dirty tree; pipeline seats 0 code writes — `qa/07-qa-report-w2.md:40-43`), (b) tóm tắt prior-stage của từng seat (BA/SA/QA/dev: mỗi seat khai write chỉ vào docs của mình), (c) chính `design/00-design-plan.md` ghi nhận docs-only. Không có bằng chứng nào cho thấy pipeline đợt 3 ghi vào file code/theme/token/test.

---

## 2. Điểm review 1 — docs ↔ code anchors (theme CHK)

| Anchor (dispatch note) | Code hiện tại (grep phiên này) | Docs cite | Kết quả |
|---|---|---|---|
| `theme.ts` `sidebarBg` = `#1a3f83` tại `:50` | `:50 sidebarBg: '#1a3f83'` (E-1) | lean-spec:29/282, feature-brief:39, design-plan:24, QA-w2 AC-1 | ✅ |
| Fallback `--bg-sidebar` `#1a3f83` tại `:287/618/1006` | `:287` định nghĩa `--bg-sidebar: ${colors.sidebarBg}` (resolves `#1a3f83`); `:618` + `:1006` literal fallback `var(--bg-sidebar, #1a3f83)` (E-1/E-2) | lean-spec:29/282, feature-brief:39, design-plan:25, QA-w2 AC-3 | ✅ |
| `themetokenchk.ts` `actionPrimary` `#273e7c` tại `:36` | `:36 export const actionPrimary = '#273e7c'` (E-7) | lean-spec:29, feature-brief:39, design-plan:27, QA-w2 AC-2 | ✅ |
| `themetokenchk.ts` `sidebarBg` `#1a3f83` tại `:72` | `:72 export const sidebarBg = '#1a3f83'` (E-7) | lean-spec:29, feature-brief:39, design-plan:26, QA-w2 AC-1 | ✅ |
| `AppLayout.tsx` `#273e7c` tại `:632/:865` | `:632` + `:865` (E-5, E-8) | lean-spec:29/282, feature-brief:39, design-plan:28, QA-w2 AC-2 | ✅ (anchor cell) |
| `AppLayout.tsx` `var(--bg-sidebar,#1a3f83)` tại `:785/:799` | `:785` + `:799` (E-6, E-8) | lean-spec:29/282, feature-brief:39, design-plan:29, QA-w2 AC-3 | ✅ (anchor cell) |

**F-1 — đã đóng (resolved; re-verify phiên này):** `design/00-design-plan.md` trước đây còn số dòng CŨ 629/862 (row 5), 782/796 (row 6 + bảng risk `:70`) trong cột "Claim". SA đã sửa cả 3 spot sang **632/865** (`:28`), **785/799** (`:29`), **785/799** (`:70`); re-grep phiên này xác nhận **0** stale token còn lại (E-14), và cột claim giờ khớp cả code (E-5/E-6) lẫn nguồn trích dẫn lean-spec:29/282 + feature-brief:39 (E-9).

---

## 3. Điểm review 2 — Giá trị (values)

| Yêu cầu | Bằng chứng | Kết quả |
|---|---|---|
| Không còn `#12468C` trong `theme.ts` | E-3: 0 match | ✅ |
| Không còn `#1E2129` trong `AppLayout.tsx` | E-4: 0 match | ✅ |
| Docs ghi đúng `#1a3f83` / `#273e7c` | lean-spec:29/282, feature-brief:39, design-plan:24-29, QA-w2 AC-1..3 — tất cả ghi `#1a3f83` cho sidebarBg/fallback và `#273e7c` cho accent | ✅ |

Ghi nhận phi-blocking (đã có owner, ngoài scope đợt 3): `tokens.ts:53` vẫn giữ `sidebarBg = '#12468C'` (giá trị đợt 1) — trùng QA-w2 OBS-2; `AppLayout.tsx` không tiêu thụ `tokens.sidebarBg` (dùng `var(--bg-sidebar,#1a3f83)` từ theme.ts), nên không ảnh hưởng hành vi.

---

## 4. Điểm review 3 — Template integrity

- **feature-brief:** đúng 7 section `##` theo đúng thứ tự template (E-13); note đợt 3 tại mục 1 dòng 39 (sau note đợt 2), ghi đúng anchor 632/865/785/799 và giá trị `#1a3f83`/`#273e7c` (read `:30-59`). ✅
- **lean-spec:** reconciled đợt 3 tại `:15` (triage), `:29` (Bổ sung đợt 3 — khai rõ đợt 3 ĐÃ thay đổi theme.ts + AppLayout.tsx với đủ anchor), `:282` (ngoại lệ out-of-scope — ghi rõ câu "KHÔNG thiết kế lại visual theme" chỉ ràng buộc đợt 1/2, không áp dụng đợt 3). Không có mâu thuẫn giữa lean-spec và thay đổi đợt 3. ✅

---

## 5. Điểm review 4 — Scope (docs-only)

- Mọi seat trong pipeline đợt 3 khai write chỉ vào docs: BA → `ba/00-lean-spec.md` + `feature-brief.md` (line-number fix only); SA → `design/00-design-plan.md`; QA → `qa/07-qa-report-w2.md` + `qa/acceptance-map.json`; dev → `dev/05-fe-dev-w1-theme-chk-docs-sync.md`.
- QA-w2 AC-4 Pass trên orchestrator git evidence (`07-qa-report-w2.md:40-43`): pipeline seats 0 code writes.
- Hạn chế: không thể chạy lại `git status`/`git diff` độc lập trong phiên này (permission deny — xem mục 1). Không có dấu hiệu ngược lại; không phát hiện file code/theme/token/test nào bị pipeline đợt 3 sửa.

---

## 6. Xác nhận 7 điểm của work statement (đối chiếu docs ↔ code của chức năng search — code C2 lane, không đổi trong pipeline này)

| # | Điểm | Bằng chứng (code hiện tại) | Kết quả |
|---|---|---|---|
| 1 | `filterMenuByQuery`: trim → lowercase → substring trên string label; trả SAME reference khi query rỗng/whitespace; giữ submenu iff ≥1 descendant khớp (D-5a); tái dùng `filterEmptyChildren`; không mutate input | `AppLayout.tsx:204-216`: `:205 const q = query.trim().toLowerCase();` · `:206 if (!q) return items;` (identity-restore, AC-024-12) · `:211-212 typeof node.label === 'string' && node.label.toLowerCase().includes(q)` · `:209-213` đệ quy keepMatching giữ chuỗi cha-con · `:215 return filterEmptyChildren(keepMatching(items));` · copy bằng spread `{ ...node, children }`, không mutate | ✅ |
| 2 | `collectOpenableKeys` trả key submenu còn giữ; `effectiveOpenKeys` swap về `openKeys` khi clear | `AppLayout.tsx:218-226` (đệ quy thu key node có children) · `:575 const effectiveOpenKeys = isSearching ? collectOpenableKeys(displayedItems) : openKeys;` | ✅ |
| 3 | Filter chạy SAU permission gating | `rawMenuItems` dùng `canAccessMenu(...)` (`:558-565`); `:570 menuItems = filterEmptyChildren(rawMenuItems)`; `:574 displayedItems = isSearching ? filterMenuByQuery(menuItems, trimmedSearchQuery) : menuItems` — filter áp trên tập đã gating (BR-024-15) | ✅ |
| 4 | Không navigation/Enter/form/API trong search path | input duy nhất `AppLayout.tsx:642` chỉ có `value={searchQuery}` + `onChange={(e) => setSearchQuery(e.target.value)}` (read `:620-649`); navigate chỉ trong `handleMenuClick` (menu click, `:580-586`) — AC-024-13 | ✅ |
| 5 | `AppLayout.test.tsx` cover A1–A13 + B1–B5 với assert thật | read full file (230 dòng): A1..A13 (`filterMenuByQuery`) + B1..B5 (`collectOpenableKeys`), assert cụ thể (toContain/toEqual/toBe reference/no-mutation snapshot/divider positions); **E-10: 18/18 pass** | ✅ |
| 6 | `vitest.config.ts` thay đổi tối thiểu, không mở rộng | E-12: include chỉ thêm đúng `src/components/AppLayout.test.tsx`; không có `src/**/*.test.tsx` broad trong include; `src/hooks/**` vẫn bị exclude; test component khác (vd `PermissionGuard.test.tsx`) không bị collect | ✅ |
| 7 | Không scope creep; không hardcode màu/spacing mới; identifiers English, UI text tiếng Việt có dấu | Pipeline đợt 3 chỉ sửa docs (mục 5); các dòng `#273e7c`/`var(--bg-sidebar,#1a3f83)` là code C2 lane đã verify; label UI tiếng Việt có dấu (HỆ THỐNG THÔNG TIN…, Tìm kiếm, Quản lý cảng biển…), identifiers/key tiếng Anh | ✅ |

---

## 7. Findings

| ID | Mức độ | Vị trí | Mô tả | Bằng chứng | Fix đề xuất |
|---|---|---|---|---|---|
| **F-1** | **Closed (resolved)** | `design/00-design-plan.md:28/:29/:70` | Anchor drift đã được SA sửa: cột "Claim" rows 5-6 + bảng risk giờ cite **632/865/785/799** đúng code; re-grep phiên này **0** stale 629/862/782/796 (E-14). | E-14 (grep 0 match + read rows), E-5/E-6 (code = 632/865/785/799), E-9 (lean-spec/feature-brief sạch) | Không còn hành động — đóng tại lượt review này |
| OBS-A | Non-blocking (pre-existing, đợt 2) | `lean-spec.md:25/:83`, `feature-brief.md:39` (note đợt 2) | Anchor search input vẫn ghi "`AppLayout.tsx` dòng 561–567, input tại dòng 565 — hiện là input chết"; code hiện tại: input duy nhất tại `:642`, đã live `value`/`onChange` (E-9, read `:620-649`). Drift ~77 dòng từ đợt 2; cùng class QA-w1 OBS-1 (menuItems 498→567, hiện tại `:570`). Ngoài phạm vi thay đổi đợt 3 | grep `<input` = 1 match tại `:642` | BA sửa anchor + bỏ mô tả "input chết" ở vòng docs-sync kế tiếp |
| OBS-B | Non-blocking | `tokens.ts:53` | `sidebarBg = '#12468C'` (đợt 1) lệch `theme.ts:50` = `#1a3f83`. Đã ghi nhận QA-w2 OBS-2; ngoài scope đợt 3 | E-3 (theme.ts sạch), grep tokens.ts | PMO/BA vòng theme kế tiếp |

---

## 8. Kết luận

Đợt 3 docs-sync đã đồng bộ **đúng** phần lớn: toàn bộ anchor `theme.ts` (`:50/:287/:618/:1006`), `themetokenchk.ts` (`:36/:72`), `AppLayout.tsx` (`:632/:865/:785/:799`) khớp code hiện tại (grep phiên này); không còn `#12468C` trong theme.ts, không còn `#1E2129` trong AppLayout.tsx; feature-brief đủ 7 section đúng thứ tự; lean-spec reconciled không mâu thuẫn; chức năng search vẫn xanh (vitest 18/18, tsc 0); vitest.config.ts tối thiểu; không scope creep.

Residual drift trước đó trong `design/00-design-plan.md` (`:28/:29/:70` — số dòng cũ 629/862/782/796) **đã được SA sửa** và re-grep phiên này xác nhận **0** stale token (E-14); cột claim giờ khớp cả code lẫn nguồn trích dẫn. Đáp ứng đầy đủ tiêu chí dispatch note ("Re-grep the code and flag any residual drift"; "If docs↔code consistent … Pass").

**Verdict: Pass** — F-1 closed; toàn bộ docs ↔ code khớp; không còn finding blocking. OBS-A/OBS-B là quan sát phi-blocking có owner (BA vòng docs kế tiếp / PMO vòng theme kế tiếp), không chặn release.
