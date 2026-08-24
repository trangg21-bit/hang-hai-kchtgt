---
id: M-002-qa-merge
module-id: M-002
name: "QA report — UI → BE feature-brief merge verification"
slug: qa-report-merge
created: 2026-08-21
triage-ref: TRI-1787277507722-c520
---

# QA Report — M-002 UI → BE Feature-Brief Merge (TRI-1787277507722-c520)

**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Scope:** Independent verification of the UI→BE feature-brief merge performed by engineering-business-analyst (prior stage Pass/high), following the mapping in `ba/00-ui-be-merge-report.md`.
**Method:** Direct file inspection only (list/glob/grep/read). Git was NOT run (forbidden by work order). No source files were touched; this is a documentation-only reconciliation.
**Result per check:** Check 1 PASS · Check 2 PASS · Check 3 PASS · Check 4 PASS (with git-level caveat)

---

## Check 1 — `_features/` contains the 30 BE dirs F-008..F-037; the 20 UI dirs contain NO `feature-brief.md` and NO `implementations.yaml`

**Oracle:** triage done_oracle #2 (`_features/` no longer holds the 20 separate UI dirs) + merge report §3.1.

**Evidence (direct):**

| Probe | Result |
|---|---|
| `list _features/` | 50 dirs = F-008..F-037 (30 BE) + F-078..F-083, F-088..F-092, F-097, F-098, F-101..F-107 (20 UI) |
| `glob _features/*/feature-brief.md` | **30 hits, all under F-008..F-037**; 0 hits under any UI dir |
| `glob _features/*/implementations.yaml` | **30 hits, all under F-008..F-037**; 0 hits under any UI dir |
| `glob _features/*/ba/*` | 24 files, all `ba/00-lean-spec.md` under BE dirs; 0 entries under any UI dir (F-078/ba/00-lean-spec.md confirmed deleted) |
| `list` of all 20 UI dirs | 19 fully empty; `F-078-ui-ql-cc-danh-sach` retains an **empty `ba/`** subdir |

**Verdict: PASS.**

**Observation (flagged, not a failure):** all 20 UI directories remain on disk as **empty shells** (19 fully empty + F-078 with an empty `ba/`). This is a literal deviation from done_oracle #2 at the working-tree level. Note that git does not track empty directories, so a fresh checkout/clone of the committed state will contain no UI dirs — the committed state satisfies the oracle. Removal of the shells (`rmdir`) belongs to PMO's git cleanup step.

---

## Check 2 — F-020/021/022/024/025 have `feature-brief.md` at ROOT, NO `ba/feature-brief.md`, `ba/00-lean-spec.md` still present

**Oracle:** merge report §3.3 (5 Cau cảng normalization table).

**Evidence (direct):**

| Feature | `feature-brief.md` at ROOT | `ba/feature-brief.md` present? | `ba/00-lean-spec.md` present? |
|---|---|---|---|
| F-020-ql-cc-tao-moi | ✅ (glob hit; dir lists `feature-brief.md`) | ❌ | ✅ (glob hit) |
| F-021-ql-cc-cap-nhat | ✅ | ❌ | ✅ |
| F-022-ql-cc-xoa | ✅ | ❌ | ✅ |
| F-024-xem-cc | ✅ (dir lists `ba/`, `feature-brief.md`, `implementations.yaml`) | ❌ | ✅ |
| F-025-ql-cc-lich-su | ✅ | ❌ | ✅ |

- The `glob _features/*/ba/*` probe returned **zero** files named `feature-brief.md` anywhere under `_features` — the old `ba/feature-brief.md` of all 5 features is gone.
- All 5 `ba/00-lean-spec.md` files appear in the same glob (F-020, F-021, F-022, F-024, F-025 all present) — preserved.

**Verdict: PASS.**

---

## Check 3 — Merge content landed with no loss (15 BE targets)

**Oracle:** merge report §2 mapping table. Each target must carry a `merged from F-XXX` marker or equivalent UI content.

### 3.1. The 6 targets that received NEW merges

| BE target | UI source(s) | Marker evidence (file:line) | Content substance verified |
|---|---|---|---|
| F-012-xem-cb | F-103 | `feature-brief.md:563` `## 11. Upload giấy tờ đính kèm Cảng biển (merged from F-103)` | Read lines 555–600: upload flow (modal, drag-and-drop, MIME/size validation), `POST /api/v1/giay-to`, `GET /:id/download`, `DELETE /:id`, BR-103-01..06 table, RBAC table — present |
| F-018-xem-bc | F-104 | `feature-brief.md:301` `## 11. Upload giấy tờ đính kèm Bến cảng (merged from F-104)`; `:188` sync note; `:320` `### 11.3. Quy tắc nghiệp vụ (từ F-104)` | Markers + sub-section structure confirmed |
| F-023-phe-duyet-cc | F-082 | `feature-brief.md:25` `### UI Flow (merged from F-082)`; `:64` `## UI Scope (merged from F-082)`; `:79` `Merged with UI feature F-082 (ui-phe-duyet-cc) — 2026-08-21` | Read lines 20–79: confirm dialog, `POST /:id/approve` + `/reject`, reason ≥10 ký tự, PheDuyetLog, toasts, RBAC Leader/Admin — present |
| F-024-xem-cc | F-078 + F-079 + F-105 | `feature-brief.md:472` `### 9.2. ... (merged from F-078)`; `:645` `### 11.9. ... (merged from F-078)`; `:671` `### 11.10. ... (merged from F-105)` | Read lines 640–694: ScreenHeader/FilterBar/StatusTabs/DataTable/Pagination, loading/empty/error states, mobile cards, BR-105-01.. rules — present. F-079 (detail screen) has **no explicit marker** — by design: detail content (read-only description `:28`, breadcrumb AC-024-06 `:118`, approve-from-detail BR-024-03 `:132`) was already present; merge report §2 confirms "Xác nhận đã phủ, không thêm lại" |
| F-030-xem-cct | F-083 + F-106 | `feature-brief.md:316` `## 11. Màn hình Danh sách Cảng cạn (merged from F-083)`; `:370` `## 12. Upload giấy tờ đính kèm Cảng cạn (merged from F-106)`; `:160` list API row "(merged from F-083)"; `:355/:387/:393/:416` sub-sections (từ F-083 / F-106) | Markers + sub-section structure confirmed |
| F-036-xem-vn | F-088 + F-089 + F-107 | `feature-brief.md:13` `merged-from: [F-036-BE, F-088-UI, F-089-UI]`; `:360` `### 10.8. Upload giấy tờ đính kèm Vùng nước (merged from F-107)`; `:23` merge doc note | Markers + sub-section structure confirmed |

### 3.2. The 9 targets confirmed already carrying UI content

| BE target | UI source(s) | Evidence (file:line) |
|---|---|---|
| F-020-ql-cc-tao-moi | F-080 (pre-merged, normalized from ba/) | `FormCrud` component `:526`, `registerThongTinPhamVi` `:295/:407/:562`, collapsible sections — create-form UI present at root |
| F-021-ql-cc-cap-nhat | F-081 (pre-merged, normalized) | `feature-brief.md:127` `FormCrud` with `formMode=EDIT`, references F-020 layout |
| F-022-ql-cc-xoa | F-097 (pre-merged, normalized) | `feature-brief.md:32/:102/:131` delete-dialog flow referencing F-078 list, `deletedAt IS NULL` filter, auto-refresh |
| F-025-ql-cc-lich-su | F-098 (pre-merged, normalized) | `feature-brief.md:28/:39/:86/:163` card-box history UI, AC-025-01..06, badges, empty state — present at root |
| F-032-ql-vn-tao-moi | F-090 | `merged-from: [F-032-BE, F-090-UI]` `:13` |
| F-033-ql-vn-cap-nhat | F-091 | `merged-from: [F-033-BE, F-091-UI]` `:13` |
| F-034-ql-vn-xoa | F-101 | `merged-from: [F-034-BE, F-101-UI]` `:13` |
| F-035-phe-duyet-vn | F-092 | `merged-from: [F-035-BE, F-092-UI]` `:13` |
| F-037-ql-vn-lich-su | F-102 | `merged-from: [F-037-BE, F-102-UI]` `:13` |

**Verdict: PASS.** All 15 targets evidenced; no missing merge, no lost UI section, no mismatched target found. F-079's absence of a marker is the documented "already covered" case, not a loss.

---

## Check 4 — No stray modifications outside `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/`

**Evidence:**

1. **Triage change set:** all 40 entries of `edit_target_files` and `impact_files` in `docs/intel/_intake/TRI-1787277507722-c520.json` are under `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/` — the expected blast radius contains nothing outside M-002.
2. **Prior-stage payload claims (consistent with my observations, not re-derived):** BA run = exactly 5 moves (`ba/feature-brief.md` → root) + 21 deletes, all under M-002, zero `implementations.yaml` references; SA run = exactly 20 feature-level `implementations.yaml` deletes, all under M-002.
3. **Direct inspection:** every `merged from F-XXX` marker found lives inside an M-002 BE `feature-brief.md`; module-level `implementations.yaml` (read in full, 55 lines) lists exactly F-008..F-037 with **no UI feature id** — consistent with the SA hash-pinned read (`965b5144c8be`).
4. **Repo-wide identifier grep:** the deleted UI dir identifiers appear only in (a) `docs/intel/catalog.json`, (b) `docs/intel/feature-map.yaml`, (c) the triage JSON — all pre-existing registries on the **read-only** `docs/intel` surface, untouched by this run — and (d) pre-existing `src/` code comments (e.g. `DryPortService.java:401` "SUBMIT (from list page F-083)"; other hits such as beacon F-073/F-079 and report F-101..F-105 belong to different modules' feature namespaces — F-NNN is not globally unique). `frontend/src`: **0 matches**.

**Verdict: PASS, with an explicit coverage limitation.** Absolute proof that no file outside M-002 was modified requires `git status`/`git diff`, which this work order forbids. The strongest available non-git evidence (triage change set, prior-stage payload records, exhaustive file-state inspection, repo-wide greps) shows full confinement. PMO should run the git verification recommended in merge report §4 before the module gate.

---

## Gaps / follow-ups (none blocking this merge)

| # | Observation | Severity | Owner |
|---|---|---|---|
| G1 | 20 empty UI dir shells remain on the working tree (19 empty + `F-078/ba/` empty). Committed state is clean (git does not track empty dirs) but the literal working tree does not match done_oracle #2 until shells are removed | Low (cosmetic) | PMO (rmdir during git cleanup) |
| G2 | `docs/intel/catalog.json` and `docs/intel/feature-map.yaml` still register the 20 merged-away UI dirs (stale registry entries; note `catalog.json:1122` even spells the path `F-106-ui-upload-giayto-kc/`, which never matched the actual `F-106-ui-upload-giayto-cct`). `docs/intel` was read-only for this run | Low (registry drift) | PMO via projection rebuild / `ai-kit query` |
| G3 | Pre-existing `src/` comments referencing M-002 UI feature ids (e.g. `DryPortService.java:401` F-083) now dangle after the merge | Low (cosmetic) | Backend dev (future cleanup; `src/` out of scope here) |
| G4 | done_oracle items #1 (projection `module-features M-002`), #3 (5 Cau cảng registered in DB), #4 (`ai-kit verify`) were NOT verified here — they belong to the PMO stage, which was still Blocked at dispatch | — | PMO |

## Not covered / not run

- **Git provenance (check 4 absolute proof)** — forbidden by work order; see caveat above.
- **`mvn -f pom.xml test-compile`** (triage `verification_commands`) — NOT run: the merge is documentation-only; no `src/` file changed, so a Java compile gate is not applicable to this change. No build/test/typecheck applicable.
- **No source file was read for content grading** — `src/` and `frontend/src` were only grepped for stray identifiers.

## Conclusion

The UI→BE feature-brief merge for M-002 is **correct and complete at the file level**: all 30 BE briefs intact with merged UI content, all 20 UI briefs removed, all 5 Cau cảng briefs normalized to root with lean-spec preserved, no content loss or mis-mapping detected, and no evidence of modifications outside M-002. Residual items (empty dir shells, stale `docs/intel` registries, dangling src comments) are cosmetic follow-ups for PMO/dev, not merge defects.
