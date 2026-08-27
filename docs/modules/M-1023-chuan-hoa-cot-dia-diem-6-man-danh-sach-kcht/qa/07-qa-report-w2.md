# QA Wave-2 Report — 'Địa điểm' column standardization (6 KCHT list pages)

Module: M-1023-chuan-hoa-cot-dia-diem-6-man-danh-sach-kcht · Triage: TRI-1787725751075-1001 (change_class C2, reduced pipeline)
Seat: engineering-qa-engineer (independent wave-2 validation) · Date: 2026-08-26
Oracle under test: user's FINAL decision (2 corrections) — column label `Địa điểm (Tỉnh/Thành phố)` (lowercase `phố`), width **250**, in EXACTLY 6 files; portClass width **250** in PortListPage. Width standard per knowledge decision `dia-diem-column-width-standard` (AM-44e7c87c56d7b429).

## 1. Coverage map (criterion → oracle → evidence)

| # | Acceptance criterion | Oracle | Evidence (this run) | Result |
|---|----------------------|--------|---------------------|--------|
| 1 | 6 DataTable province columns have label EXACTLY `Địa điểm (Tỉnh/Thành phố)` + `width: 250`; no capital-P variant remains in scope | grep exact label per file; read column object (label+width on same object); grep capital-P `Địa điểm (Tỉnh/Thành Phố)` across `frontend/src` | See §2, §3 | PASS |
| 2 | `portClass` column width == 250 | read column object `frontend/src/services/port/PortListPage.tsx` | `width: 250,` at line 1703 inside portClass object (label `'Phân cấp cảng biển'`, key `portClass`) | PASS |
| 3 | DryPortListPage untouched; backend untouched; AnchorageListPage history-drawer untouched | current file state + triage edit footprint + dev artifact | See §4 | PASS |
| 4 | Out-of-scope UI text (filter headers `Địa điểm (Tỉnh/TP)` / `Địa điểm`, form labelProps, detail labels) present and NOT changed to the column label | grep per surface, compare with dev artifact's reverted strings | See §5 | PASS |
| 5 | `npm run build && npx tsc --noEmit` exit 0 (real executed output) | executed command, cwd `frontend/` | exitCode 0; see §6c (250px state) | PASS |

## 2. Six in-scope columns — label + width (verified against actual files, 250px state)

| File | Column key/dataIndex | Label (exact) | Width | Anchor |
|------|----------------------|---------------|-------|--------|
| `frontend/src/services/port/PortListPage.tsx` | `province` | `Địa điểm (Tỉnh/Thành phố)` | 250 | label :1710, `width: 250,` :1712 (same column object 1709–1717) |
| `frontend/src/pages/port/BerthListPage.tsx` | `provinceId` | `Địa điểm (Tỉnh/Thành phố)` | 250 | :859 single line `{ key: 'provinceId', label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'provinceId', width: 250, sortable: true, sortOrder,` |
| `frontend/src/pages/port/PierListPage.tsx` | `province` | `Địa điểm (Tỉnh/Thành phố)` | 250 | :675 single line `{ label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'province', key: 'province', width: 250, sortable: true,` |
| `frontend/src/pages/anchorage/AnchorageListPage.tsx` | `provinceId` | `Địa điểm (Tỉnh/Thành phố)` | 250 | label :906, `width: 250,` :908 (same column object 905–912) |
| `frontend/src/services/buoy-station/BuoyStationListPage.tsx` | `province` | `Địa điểm (Tỉnh/Thành phố)` | 250 | :807 single line `key: 'province', label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'province', width: 250, sortable: true,` |
| `frontend/src/services/buoy/BuoyListPage.tsx` | `provinceId` | `Địa điểm (Tỉnh/Thành phố)` | 250 | label :1329, `width: 250,` :1331 (same column object 1328–1336) |

Widths confirmed on the SAME column object as the label (multi-line objects read directly; single-line definitions show `width: 250` inline). Widths were corrected from 280 to 250 per the user's final decision; Berth/Pier were already 250 pre-correction and remain so.

## 3. Capital-P variant sweep

- `grep 'Địa điểm \(Tỉnh/Thành Phố\)'` across `frontend/` (all extensions): **zero occurrences in any of the 6 in-scope files**.
- Capital-P `Địa điểm (Tỉnh/Thành Phố)` remains ONLY in out-of-scope surfaces — exactly the surfaces criterion 4 requires to remain present and unchanged (see §5). Scope reading: "no capital-P remains anywhere" = within the in-scope DataTable column definitions of the 6 files.
- Width sweep: no `width: 280` remains on any of the 6 province columns (remaining 280s are other columns: PortListPage:1664, AnchorageListPage:888/978, BerthListPage:857/907, PierListPage:673, BuoyStationListPage:758/803).

## 4. Untouched surfaces

- **DryPortListPage.tsx**: still carries capital-P `'Địa điểm (Tỉnh/Thành Phố)'` at :814 with NO width property, plus :873/:1157/:1440 — i.e. its column was never converted to the standard label/width. Not among the triage `edit_target_files`. Untouched by this module.
- **Backend**: triage `TRI-1787725751075-1001.json` evidence block: `packages: ["frontend"]`, `edit_target_files` == `impact_files` == exactly the 6 frontend `.tsx` files (no `src/main/java/**`, no migrations). Zero backend footprint for this ticket. (Working-tree backend modifications belong to parallel modules — anchorage creation, M-1022 — outside this C2's scope.)
- **AnchorageListPage history-drawer**: history drawer renders field labels via `historyFieldLabels` map (:114–117); province renders as `'Tỉnh/Thành phố'` (:117), NOT the column label `'Địa điểm (Tỉnh/Thành phố)'` — no history-drawer string was converted.

## 5. Out-of-scope UI text — present and unchanged

Filter section headers (grep-verified present, in their original form):
- `PortListPage.tsx:2020` — `Tỉnh/Thành phố` (filter section header)
- `BerthListPage.tsx:789` — `Địa điểm (Tỉnh/TP)`
- `AnchorageListPage.tsx:754` — `Địa điểm (Tỉnh/TP)`
- `BuoyListPage.tsx:1598` — `Địa điểm (Tỉnh/TP)`
- `PierListPage.tsx:586` — `Địa điểm`
- `BuoyStationListPage.tsx:966` — `Địa điểm`

Form labelProps (capital-P, in separate out-of-scope form files, unchanged): `AnchorageForm.tsx:526`, `BerthForm.tsx:278`, `PierForm.tsx:199`, `BuoyFormContent.tsx:269–270`, `BuoyStationFormContent.tsx:358`, `PortFormContent.tsx:122`. PortListPage's own `labelProps('Địa điểm (Tỉnh/Thành phố)')` (:2215, :2959) are lowercase — documented by the dev artifact as reverted to their pre-dispatch (original) values.

Detail labels (capital-P, out-of-scope detail files, unchanged): `AnchorageDetailContent.tsx:146`, `BerthDetailContent.tsx:188`, `PierDetailContent.tsx:155`, `BuoyDetailContent.tsx:194`, `BuoyStationDetailContent.tsx:216`, `DryPortDetailContent.tsx:151`.

## 6. Executed verification — verbatim output

### 6a. First run (280px state, superseded for width; gate evidence for that revision)

Command (cwd `frontend/`): `npm run build && npx tsc --noEmit` → exit code 0; `vite v8.1.5` → `transforming...✓ 4065 modules transformed.` → `✓ built in 2.12s`; tsc clean; stderr only chunk-size advisory.

### 6b. Final-state re-run of the 280px revision (post-artifact writes)

Same command → exit code 0; `✓ built in 1.98s`; tsc clean.

### 6c. Re-validation on the 250px width-correction state (current oracle)

Command (cwd `frontend/`): `npm run build && npx tsc --noEmit`

```
> frontend@0.0.0 build
> vite build

vite v8.1.5 building client environment for production...
transforming...✓ 4065 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                           2.50 kB │ gzip:   0.80 kB
...
dist/assets/BerthListPage-*.js                            69.34 kB │ gzip:  17.37 kB
dist/assets/BuoyListPage-*.js                             71.37 kB │ gzip:  17.88 kB
dist/assets/PierListPage-*.js                             75.01 kB │ gzip:  18.67 kB
dist/assets/BuoyStationListPage-*.js                      87.72 kB │ gzip:  21.13 kB
dist/assets/AnchorageListPage-*.js                      114-115 kB │ gzip:  26.8 kB
dist/assets/PortListPage-*.js                           125.2-125.4 kB │ gzip:  26.2 kB
...
✓ built in 1.33s

stderr:
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider: ...
Command exited with code 0.
```

- **Exit code: 0** (tool-reported `exitCode: 0` for the chained command; `npx tsc --noEmit` produced no output — clean typecheck on the 250px state).
- Key lines verbatim: `transforming...✓ 4065 modules transformed.` → `✓ built in 1.33s`. Only stderr: non-blocking chunk-size advisory.
- All 6 in-scope pages compiled into dist assets (BerthListPage, BuoyListPage, PierListPage, BuoyStationListPage, AnchorageListPage, PortListPage).

## 7. Coverage notes / non-covered

- Visual/browser rendering (header shows full text, no ellipsis) was NOT exercised: no live-probe acceptance harness exists for this C2; oracle verified at source level (label string + width) plus compile/typecheck gates.
- Line-number shifts in PortListPage (+1 on lines after ~1697, e.g. filter header 2019→2020, labelProps 2214→2215) are caused by the orgUnitId column render shape, not by the width correction; the in-scope column objects are verified by direct read.
- Attribution of working-tree modifications to parallel modules was established via the triage edit footprint + current-file state, not via git history.

## 8. Findings

No defects found. All 5 acceptance criteria hold with direct current evidence on the 250px state.

## 9. Verdict

**Pass** — every acceptance criterion executed with observed output: 6/6 columns label `Địa điểm (Tỉnh/Thành phố)` + width 250, portClass width 250, zero capital-P in the 6 in-scope files, out-of-scope surfaces intact, `npm run build && npx tsc --noEmit` exit 0 (vite build, 4065 modules, tsc clean).
