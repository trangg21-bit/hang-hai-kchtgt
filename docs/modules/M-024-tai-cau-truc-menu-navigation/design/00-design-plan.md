# M-024 — Design Plan đợt 3: Đồng bộ tài liệu theme CHK (docs-sync, không implementation)

> **Module:** M-024 — Tái cấu trúc Menu & Navigation
> **Triage:** `docs/intel/_intake/TRI-1787899754098-59d2.json` (change_class C2, solo_lane — theme CHK)
> **Vai trò plan này:** đánh giá consistency docs ↔ code cho đợt 3 và ghi nhận **không cần implementation mới** — code đã được implement và verify ở C2 solo lane.
> **Ngày:** 2026-08-28

---

## 1. Bối cảnh và kết luận tổng thể

Đợt 3 (theme CHK) là một thay đổi **docs-only** trong pipeline: triage `TRI-1787899754098-59d2` đã được xử lý theo lane C2 solo — code (`frontend/src/theme.ts`, `frontend/src/themetokenchk.ts`, `frontend/src/components/AppLayout.tsx`) đã được implement và verify xong (xem mục 6), và công việc còn lại là đồng bộ tài liệu `ba/00-lean-spec.md` + `_features/F-292-.../feature-brief.md` với code, đồng thời ghi nhận quyết định này vào `design/00-design-plan.md`.

**Kết luận:** Plan này **không chứa work order implementation nào**. Toàn bộ thay đổi code đợt 3 đã hoàn tất ở C2 solo lane; tài liệu M-024 đã được BA đồng bộ (đợt 3 note tại lean-spec dòng 15/29/282 và feature-brief mục 1 dòng 39); kết quả rà soát consistency docs ↔ code bên dưới là **khớp 100% — không có anchor drift, không có value mismatch**. Verdict: **Pass**.

---

## 2. Đối chiếu docs ↔ code (consistency verdict)

Mọi claim màu sắc/anchor trong hai tài liệu được đối chiếu với code hiện tại (mở trực tiếp trong phiên này). Bảng dưới là bản ghi kiểm chứng:

| # | Claim trong tài liệu (nguồn) | Anchor trong code (đã mở) | Giá trị thực tế | Kết quả |
|---|---|---|---|---|
| 1 | `theme.ts` `sidebarBg` dòng 50 = `#1a3f83` (lean-spec:29/282, feature-brief:39) | `frontend/src/theme.ts:50` — `sidebarBg: '#1a3f83', // nền sidebar navy CHK — đồng nhất themetokenchk.sidebarBg` | `#1a3f83` | ✅ Khớp |
| 2 | Fallback `--bg-sidebar` dòng 287/618/1006 = `#1a3f83` (lean-spec:29/282, feature-brief:39) | `theme.ts:287` — `--bg-sidebar: ${colors.sidebarBg};` · `theme.ts:618` — `color: var(--bg-sidebar, #1a3f83) !important;` · `theme.ts:1006` — `color: var(--bg-sidebar, #1a3f83) !important;` | `#1a3f83` | ✅ Khớp |
| 3 | `themetokenchk.sidebarBg` dòng 72 = `#1a3f83` (lean-spec:29, feature-brief:39) | `frontend/src/themetokenchk.ts:72` — `export const sidebarBg = '#1a3f83';` | `#1a3f83` | ✅ Khớp |
| 4 | `themetokenchk.actionPrimary` dòng 36 = `#273e7c` (lean-spec:29, feature-brief:39) | `frontend/src/themetokenchk.ts:36` — `export const actionPrimary = '#273e7c';` | `#273e7c` | ✅ Khớp |
| 5 | Title topbar accent `#273e7c` tại `AppLayout.tsx` dòng 632/865 (lean-spec:29, feature-brief:39) | `AppLayout.tsx:632` — `style={{ margin: 0, color: '#273e7c', ... }}` · `AppLayout.tsx:865` — `style={{ margin: 0, color: '#273e7c' }}` | `#273e7c` | ✅ Khớp |
| 6 | Sidebar fullscreen dùng `var(--bg-sidebar, #1a3f83)` tại dòng 785/799 (lean-spec:29/282, feature-brief:39) | `AppLayout.tsx:785` — `background: isMenuFullScreen ? '#fff' : 'var(--bg-sidebar, #1a3f83)'` · `AppLayout.tsx:799` — `styles={{ body: { padding: 0, background: 'var(--bg-sidebar, #1a3f83)' }, wrapper: { width: 260 } }}` | `#1a3f83` (fallback) | ✅ Khớp |

**Ghi chú giá trị cũ:** bản ghi triage (intake) chụp trạng thái trước thay đổi — `theme.ts:50` = `#12468C`, `AppLayout.tsx:785` fallback = `#1E2129`. Code hiện tại đã thay bằng `#1a3f83`/`#273e7c` — xác nhận thay đổi đợt 3 đã được áp dụng (grep toàn file `theme.ts` không còn `#12468C`; `AppLayout.tsx` không còn `#1E2129`).

### 2.1 Nguồn chứng cứ độc lập thứ hai (ngoài code)

- `docs/intel/_intake/TRI-1787899754098-59d2.json` — `request_summary`: "navy #273e7c action, nền sáng #eef0f8"; `done_oracle`: "Sidebar + header menu hiển thị theo phong cách CHK (navy #273e7c làm màu hành động, nền sidebar/trang sáng theo themetokenchk) … tsc + vitest pass; tài liệu M-024 cập nhật đồng bộ".
- `docs/modules/M-024-tai-cau-truc-menu-navigation/_state.md:45` — `reopened-reason`: "docs-only sync — ghi nhận đợt 3 … `theme.ts` `sidebarBg` #12468C→#1a3f83, accent title #273e7c, fallback --bg-sidebar vào feature-brief F-292 mục 1 + lean-spec. Code đã xong + verify (C2 solo lane); không sửa code, không dispatch dev."

Hai nguồn độc lập (code anchors mở trực tiếp + intake `request_summary`/`done_oracle`) nhất quán → độ tin cậy **high** cho verdict consistency.

---

## 3. Toàn vẹn template & khai báo bắt buộc (điểm c)

Rà soát tài liệu sau khi BA đồng bộ đợt 3:

- **feature-brief.md** giữ đúng **7 section theo đúng thứ tự, đúng tiêu đề** của `docs/feature-brief-template.md`: 1 Mô tả ngắn → 2 Trường dữ liệu → 3 Trạng thái và phê duyệt → 4 Quy tắc và phân quyền riêng → 5 Điểm khác biệt (bảng 8 dòng đầy đủ) → 6 Phần kỹ thuật — đường dẫn gọi dữ liệu → 7 Phần kỹ thuật — cấu trúc bảng (đã mở toàn bộ 147 dòng).
- **Khai báo Data Scope (mục 5 dòng 3):** đầy đủ, không để trống — "Không — chức năng không quản lý dữ liệu nghiệp vụ nên không có trường đơn vị, không có chiều ghi, không có ngoại lệ data scope … (xem lean spec BR-024-11)".
- **Phân quyền Admin Cục + bảng role × thao tác dạng `<resource>:<action>`:** giữ nguyên tại mục 4.4; Admin Cục khai báo riêng (không phát sinh quyền menu/metadata nhạy cảm mới).
- **lean-spec.md** được BA tái tạo (283 dòng), giữ đủ UC/BR/VAL/D/AC; đợt 3 note tại dòng 15 (triage ref), dòng 29 (bổ sung màu) và dòng 282 (ngoại lệ phạm vi đợt 3) — không mâu thuẫn với phần CHUNG.
- Mô tả ô tìm kiếm menu (đợt 2) vẫn nguyên vẹn: input chết cũ `AppLayout.tsx:561–567` → state cục bộ `searchQuery`, `.trim()` (VAL-024-06), restore-on-clear (AC-024-12), không navigate/không API (AC-024-13, BR-024-13/15) — đã được implement ở đợt 2 và verify (mục 6).

---

## 4. Tại sao không có work order implementation (điểm a)

1. **Code đợt 3 đã implement và verify** ở C2 solo lane (triage `TRI-1787899754098-59d2`): thay `sidebarBg` `#12468C` → `#1a3f83` (theme.ts:50, fallback 287/618/1006), áp accent `#273e7c` cho title topbar (AppLayout.tsx:632/865), sidebar fullscreen fallback `#1a3f83` (785/799) — tất cả anchor đã mở và khớp (mục 2).
2. **Search menu sidebar (đợt 2)** đã được implement bởi frontend-developer (Pass): `filterMenuByQuery` + `collectOpenableKeys` (exported) trong `AppLayout.tsx`, lọc sau permission gating trên `menuItems`, giữ parent key qua rebuild `{ ...node, children }`; `AppLayout.test.tsx` 18 test (oracle QA A1–A13 + B1–B5); `tsc --noEmit` exit 0; vitest 11 test files / 91 tests pass. Artifacts: `frontend/src/components/AppLayout.tsx`, `frontend/src/components/AppLayout.test.tsx`, `frontend/vitest.config.ts` (collection scope), `docs/modules/M-024-.../dev/05-fe-dev-w1-sidebar-menu-search-filter.md`, `docs/modules/M-024-.../qa/acceptance-map.json`.
3. **Phạm vi đợt 3 = tài liệu**: `_state.md:45` ghi rõ "không sửa code, không dispatch dev". Việc sửa thêm code ở đây sẽ vi phạm lane docs-only.

→ Work order duy nhất của đợt 3 (đã hoàn tất trong pipeline, không phải việc của Dev): **BA đồng bộ tài liệu** (đã Pass) + **SA ghi nhận plan docs-sync này** (chính là artifact hiện tại).

---

## 5. Rủi ro và lưu ý

| Rủi ro / lưu ý | Trạng thái | Hành động nếu xảy ra |
|---|---|---|
| Anchor drift trong tương lai (sửa màu ở một nơi, không sửa nơi kia) | Không phát hiện hiện tại (bảng mục 2 khớp 100%) | Rà soát lại bảng mục 2 khi có thay đổi theme tiếp theo |
| `themetokenchk.ts` và `theme.ts` lệch giá trị `sidebarBg`/`actionPrimary` | Đang khớp (`#1a3f83` cả hai, `#273e7c` chuẩn duy nhất tại `themetokenchk.ts:36`) | Giữ `themetokenchk.ts` là nguồn chuẩn; `theme.ts` tham chiếu đồng nhất |
| Giá trị fallback literal lặp lại (`#1a3f83` tại 618/1006/785/799) | Chấp nhận — fallback bảo vệ khi CSS var chưa mount | Không refactor trong đợt này (ngoài scope) |

---

## 6. Chứng cứ đã mở trong phiên này

- `docs/modules/M-024-tai-cau-truc-menu-navigation/ba/00-lean-spec.md` — dòng 15/29/282 (đợt 3 note), dòng 265–283 (Out of scope + AC-024-11/12/13).
- `docs/modules/M-024-tai-cau-truc-menu-navigation/_features/F-292-tai-cau-truc-menu-navigation/feature-brief.md` — dòng 39 (đợt 3 note), toàn bộ 7 section (147 dòng).
- `docs/intel/_intake/TRI-1787899754098-59d2.json` — `request_summary`, `done_oracle`, các claim mô tả trạng thái trước thay đổi.
- `frontend/src/theme.ts` — dòng 50/287/618/1006 (grep + đọc).
- `frontend/src/themetokenchk.ts` — dòng 36/72 (grep).
- `frontend/src/components/AppLayout.tsx` — dòng 632/785/799/865 (grep).
- `docs/modules/M-024-tai-cau-truc-menu-navigation/_state.md:45` — xác nhận lane docs-only.

**Không mở/sửa:** `frontend/src/**` (code), `tokens.ts`, backend — đúng phạm vi READ-ONLY của dispatch.

---

## 7. Verdict

- **Consistency docs ↔ code đợt 3:** Pass (10/10 anchor khớp, 2 nguồn độc lập).
- **Template 7 section + data-scope declaration:** nguyên vẹn.
- **Implementation:** không cần — code đã xong ở C2 solo lane; đợt 3 là docs-sync thuần túy.
