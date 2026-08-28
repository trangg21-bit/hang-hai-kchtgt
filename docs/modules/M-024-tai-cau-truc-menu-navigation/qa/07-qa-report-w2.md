# M-024 — QA Wave-2: Kết quả thực thi battery (đợt 3 docs-sync) — FINAL

> Module: **M-024 — Tái cấu trúc Menu & Navigation** · Feature: **F-292**
> Stage: `engineering-qa-engineer` wave-2 (execution, finalized) · Ngày: 2026-08-28
> Oracle nguồn: `qa/07-qa-report-w1.md` · Acceptance map: `qa/acceptance-map.json`
> Triage: `TRI-1787823566528-bb3e.json` (C1), `TRI-1787899754098-59d2.json` (C2 solo, đợt 3 theme CHK)
> **Verdict: PASS** — mọi AC-1..AC-6 pass; findings F-1/F-2 đã đóng bằng bằng chứng upstream (orchestrator git + BA/SA sửa anchor).

---

## 1. Tóm tắt kết quả

| Bước | Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | `cd frontend && npx tsc --noEmit` | ✅ PASS — exit 0, 0 violation | Thực thi 14:51 (run trước, cùng revision — không code đổi từ đó) |
| 2 | `cd frontend && npx vitest run src/components/AppLayout.test.tsx` | ✅ PASS — **18/18 tests**, exit 0 | Thực thi 14:51: `Test Files 1 passed (1) · Tests 18 passed (18)` |
| 3 | AC-4 diff scope | ✅ **PASS — orchestrator evidence** | Orchestrator chạy `git status --porcelain` + `git diff --name-only HEAD` ở scope không thu hẹp (mục 2.3) |
| 4 | AC-1..AC-3 anchors | ✅ PASS — giá trị + anchor đã sửa | Grep run này + re-grep docs (mục 2.4) |
| 5 | AC-5 feature-brief 7 section | ✅ PASS | 7 `## ` đúng thứ tự; lean-spec reconciled |
| 6 | AC-6 lean-spec giữ đủ ID | ✅ PASS | Inventory nguyên vẹn |

---

## 2. Chi tiết

### 2.1/2.2 Typecheck + Test — PASS
- `npx tsc --noEmit` → exit 0, không output, 0 violation.
- `npx vitest run src/components/AppLayout.test.tsx` → 1 test file, **18/18 tests passed** (A1–A13 `filterMenuByQuery` + B1–B5 `collectOpenableKeys`), vitest v4.1.11, exit 0.
- Không chạy lại trong lượt final này vì **không có file code nào đổi** kể từ lần chạy (xác nhận: pipeline docs-only; QA chỉ ghi `qa/*`).

### 2.3 AC-4 — diff scope — **PASS (orchestrator evidence)**
- Trong phiên QA, mọi lệnh git bị permission policy chặn ("Effective denying pattern(s): git *") — đã báo cáo ở run trước.
- **Orchestrator đã chạy** `git status --porcelain` + `git diff --name-only HEAD` ở scope không thu hẹp: workspace là **shared dirty tree** — chứa các thay đổi có trước (đợt 3 C2-solo + menu-search đợt 2) và các module song song **M-026/M-027** đang chạm `frontend/`. Đợt 3 docs-sync pipeline này: các seat **BA/SA/FE-dev đều báo 0 code write**; riêng seat QA chỉ ghi `qa/07-qa-report-w1.md`, `qa/07-qa-report-w2.md`, `qa/acceptance-map.json` (docs). Dị thường **+3 line shift** tại `AppLayout.tsx` (docs cũ ghi :629/:782/:796/:862) được xác định là **concurrent external interference**, không phải do pipeline này → AC-4 **Pass**.

### 2.4 AC-1..AC-3 — anchors — PASS (giá trị + anchor đã sửa)
Grep code run này (giá trị không đổi, khớp 100%):

| AC | Anchor | Giá trị thực tế | Kết quả |
|---|---|---|---|
| AC-1 | `theme.ts:50` / `themetokenchk.ts:72` | `sidebarBg: '#1a3f83'` / `sidebarBg = '#1a3f83'` | ✅ |
| AC-2 | `themetokenchk.ts:36` / `AppLayout.tsx:632`+`:865` | `actionPrimary = '#273e7c'` / `color: '#273e7c'` | ✅ |
| AC-3 | `theme.ts:618`+`:1006` / `AppLayout.tsx:785`+`:799` / `:287` | `var(--bg-sidebar, #1a3f83)` / `--bg-sidebar: ${colors.sidebarBg}` | ✅ |
| Residual | `#12468C` trong theme.ts / `#1E2129` trong AppLayout.tsx | **0 match** / 0 match | ✅ |

**Re-grep docs (bản final):** lean-spec:29 và :282, feature-brief:39 đã ghi **dòng 632/865** (accent) và **dòng 785/799** (sidebar fullscreen); design-plan anchor/evidence columns đã sửa thành `AppLayout.tsx:632/:865/:785/:799` (dòng 28/29/56/81) — **0 stale token** trong lean-spec + feature-brief + design-plan anchor columns.

### 2.5 AC-5 — PASS
- Grep `^## `: đủ **7 section đúng thứ tự/tiêu đề** template — `## 1. Mô tả ngắn` (:33) → `## 7. Phần kỹ thuật — cấu trúc bảng` (:141); đợt 3 note tại mục 1 (:39) với anchor mới 632/865/785/799.
- lean-spec:15/29/282 reconciled — ghi rõ đợt 3 ĐÃ thay đổi `theme.ts` + `AppLayout.tsx`; hết mâu thuẫn "KHÔNG sửa theme.ts".

### 2.6 AC-6 — PASS
- Inventory ID quan sát được (grep wave-1 + wave-2): UC-024-09; BR-024-04/08/09/10/11/12/13/14/15; VAL-024-01..06; AC-024-02/10/11/12/13; D-1/D-2/D-5 — nội dung không đổi, không ID bị xóa.

---

## 3. Findings — trạng thái đóng

| ID | Finding | Trạng thái |
|---|---|---|
| F-1 | AC-4 không verify được bằng git trong phiên QA (policy chặn `git *`) | ✅ **Đóng — Pass** bằng orchestrator evidence (git unrestricted): workspace shared dirty tree; pipeline seats 0 code write; +3 drift = external interference |
| F-2 | Anchor drift +3 tại AppLayout.tsx (docs cũ :629/:782/:796/:862 vs code :632/:785/:799/:865) | ✅ **Đóng — fixed**: BA sửa lean-spec:29/282 + feature-brief:39; SA sửa design-plan anchor columns; re-grep xác nhận 0 stale trong 3 docs normative |
| OBS-3 | Residual stale (không chặn, owner khác): design-plan:28/29 **claim columns** vẫn ghi "dòng 629/862"/"dòng 782/796" (mô tả claim cũ của lean-spec/feature-brief — anchor columns đã đúng) và design-plan:70 risk table ghi "618/1006/782/796"; `dev/05-fe-dev-w1-theme-chk-docs-sync.md:21/22` là record lịch sử của FE-dev (ghi anchor tại thời điểm verify) | ⚠️ Ghi nhận — ngoài write scope QA; đề xuất sửa ở lượt chạm docs kế tiếp (owner SA + FE-dev) — **không ảnh hưởng AC-1..AC-6** |
| OBS-2 | `tokens.ts:53` sidebarBg `#12468C` (cũ) — ngoài scope đợt 3 | ⚠️ Ghi nhận (lặp lại từ wave-1) — owner PMO/BA vòng theme kế tiếp |

---

## 4. Coverage map AC-1..AC-6 — FINAL

| AC | Kết quả | Bằng chứng |
|---|---|---|
| AC-1 | ✅ PASS | theme.ts:50 + themetokenchk.ts:72 = #1a3f83 |
| AC-2 | ✅ PASS | themetokenchk.ts:36 + AppLayout.tsx:632/865 = #273e7c; docs anchor đã sửa |
| AC-3 | ✅ PASS | theme.ts:287/618/1006 + AppLayout.tsx:785/799 = #1a3f83; docs anchor đã sửa |
| AC-4 | ✅ PASS | Orchestrator git (unrestricted): pipeline seats 0 code write; +3 drift = external interference |
| AC-5 | ✅ PASS | 7 section đúng thứ tự; lean-spec reconciled (15/29/282) |
| AC-6 | ✅ PASS | UC/BR/VAL/D/AC inventory nguyên vẹn |

---

## 5. Kết luận

- **Toàn bộ AC-1..AC-6 PASS** với bằng chứng: tsc exit 0 (prior run, cùng revision), vitest 18/18 (prior run, cùng revision), grep anchors + re-grep docs (0 stale trong lean-spec/feature-brief/design-plan anchor columns), orchestrator git cho AC-4.
- Findings F-1/F-2 đã đóng; OBS-2/OBS-3 ghi nhận phi-blocking kèm owner.
- Manual smoke C1–C3 (browser) chưa thực thi trong pipeline — phản ánh trong `qa/acceptance-map.json` (`pending_manual`, dành cho UAT); phần tự động hóa tương ứng (A1–A13/B1–B5) đã pass.
- **Verdict: PASS** — đợt 3 docs-sync hoàn tất, không code/theme/token/test nào bị sửa bởi pipeline này.
