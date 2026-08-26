# QA Wave-2 Report — 'Địa điểm' column standardization (6 KCHT list pages)

Module: M-1023-chuan-hoa-cot-dia-diem-6-man-danh-sach-kcht · Triage: TRI-1787725751075-1001 (change_class C2, reduced pipeline)
Seat: engineering-qa-engineer (independent wave-2 validation) · Date: 2026-08-26
Oracle under test: user's FINAL decision — column label `Địa điểm (Tỉnh/Thành phố)` (lowercase `phố`), width 280, in EXACTLY 6 files; portClass width 220 in PortListPage.

## 1. Coverage map (criterion → oracle → evidence)

| # | Acceptance criterion | Oracle | Evidence (this run) | Result |
|---|----------------------|--------|---------------------|--------|
| 1 | 6 DataTable province columns have label EXACTLY `Địa điểm (Tỉnh/Thành phố)` + `width: 280`; no capital-P variant remains in scope | grep exact label per file; read column object (label+width on same object); grep capital-P `Địa điểm (Tỉnh/Thành Phố)` across `frontend/src` | See §2, §3 | PASS |
| 2 | `portClass` column width == 220 | read column object `frontend/src/services/port/PortListPage.tsx` | `width: 220,` at line 1702 inside portClass object (label `'Phân cấp cảng biển'`, key `portClass`) | PASS |
| 3 | DryPortListPage untouched; backend untouched; AnchorageListPage history-drawer untouched | current file state + triage edit footprint + dev artifact | See §4 | PASS |
| 4 | Out-of-scope UI text (filter headers `Địa điểm (Tỉnh/TP)` / `Địa điểm`, form labelProps, detail labels) present and NOT changed to the column label | grep per surface, compare with dev artifact's 9 reverted strings | See §5 | PASS |
| 5 | `npm run build && npx tsc --noEmit` exit 0 (real executed output) | executed command, cwd `frontend/` | exitCode 0; see §6 verbatim | PASS |

## 2. Six in-scope columns — label + width (verified against actual files)

| File | Column key/dataIndex | Label (exact) | Width | Anchor |
|------|----------------------|---------------|-------|--------|
| `frontend/src/services/port/PortListPage.tsx` | `province` | `Địa điểm (Tỉnh/Thành phố)` | 280 | label :1709, `width: 280,` :1711 (same column object 1708–1714) |
| `frontend/src/pages/port/BerthListPage.tsx` | `provinceId` | `Địa điểm (Tỉnh/Thành phố)` | 280 | :859 single line `{ key: 'provinceId', label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'provinceId', width: 280, sortable: true, sortOrder,` |
| `frontend/src/pages/port/PierListPage.tsx` | `province` | `Địa điểm (Tỉnh/Thành phố)` | 280 | :675 single line `{ label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'province', key: 'province', width: 280, sortable: true,` |
| `frontend/src/pages/anchorage/AnchorageListPage.tsx` | `provinceId` | `Địa điểm (Tỉnh/Thành phố)` | 280 | label :906, `width: 280,` :908 (same column object 904–912) |
| `frontend/src/services/buoy-station/BuoyStationListPage.tsx` | `province` | `Địa điểm (Tỉnh/Thành phố)` | 280 | :807 single line `key: 'province', label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'province', width: 280, sortable: true,` |
| `frontend/src/services/buoy/BuoyListPage.tsx` | `provinceId` | `Địa điểm (Tỉnh/Thành phố)` | 280 | label :1329, `width: 280,` :1331 (same column object 1328–1336) |

Widths confirmed on the SAME column object as the label (multi-line objects read directly; single-line definitions show `width: 280` inline).

## 3. Capital-P variant sweep

- `grep 'Địa điểm \(Tỉnh/Thành Phố\)'` across `frontend/` (all extensions): **zero occurrences in any of the 6 in-scope files**.
- Capital-P `Địa điểm (Tỉnh/Thành Phố)` remains ONLY in out-of-scope surfaces — exactly the surfaces criterion 4 requires to remain present and unchanged (see §5). Scope reading: "no capital-P remains anywhere" = within the in-scope DataTable column definitions of the 6 files.
- Broad variant sweep `Địa điểm[^(]*` in the 6 files found no alternate spellings (no missing-space, no `Tỉnh/TP` inside the column definitions).

## 4. Untouched surfaces

- **DryPortListPage.tsx**: still carries capital-P `'Địa điểm (Tỉnh/Thành Phố)'` at :814 with NO width property, plus :873/:1157/:1440 — i.e. its column was never converted to the standard label/width. Not among the triage `edit_target_files`. Untouched by this module. (Working-tree `M` status vs HEAD is attributable to parallel module work in this live workspace, not M-1023.)
- **Backend**: triage `TRI-1787725751075-1001.json` evidence block: `packages: ["frontend"]`, `edit_target_files` == `impact_files` == exactly the 6 frontend `.tsx` files (identical list, no `src/main/java/**`, no migrations). Zero backend footprint for this ticket. (Working-tree backend modifications belong to parallel modules — anchorage creation, M-1022 — outside this C2's scope.)
- **AnchorageListPage history-drawer**: history drawer renders field labels via `historyFieldLabels` map (:114–117); province renders as `'Tỉnh/Thành phố'` (:117), NOT the column label `'Địa điểm (Tỉnh/Thành phố)'` — no history-drawer string was converted. Dev artifact (`05-fe-dev-w1-dia-diem-column-label-width.md` rev 3) explicitly lists history-drawer as untouched and enumerates all reverted strings; none is a history-drawer string.

## 5. Out-of-scope UI text — present and unchanged

Filter section headers (grep-verified present, in their original form):
- `PortListPage.tsx:2019` — `Tỉnh/Thành phố` (filter section header)
- `BerthListPage.tsx:789` — `Địa điểm (Tỉnh/TP)`
- `AnchorageListPage.tsx:754` — `Địa điểm (Tỉnh/TP)`
- `BuoyListPage.tsx:1598` — `Địa điểm (Tỉnh/TP)`
- `PierListPage.tsx:586` — `Địa điểm`
- `BuoyStationListPage.tsx:966` — `Địa điểm`

Form labelProps (capital-P, in separate out-of-scope form files, unchanged): `AnchorageForm.tsx:526`, `BerthForm.tsx:278`, `PierForm.tsx:199`, `BuoyFormContent.tsx:269–270`, `BuoyStationFormContent.tsx:358`, `PortFormContent.tsx:122`. PortListPage's own `labelProps('Địa điểm (Tỉnh/Thành phố)')` (:2214, :2957) are lowercase — documented by the dev artifact as reverted to their pre-dispatch (original) values; no capital-P was introduced or left in-scope.

Detail labels (capital-P, out-of-scope detail files, unchanged): `AnchorageDetailContent.tsx:140`, `BerthDetailContent.tsx:188`, `PierDetailContent.tsx:155`, `BuoyDetailContent.tsx:194`, `BuoyStationDetailContent.tsx:216`, `DryPortDetailContent.tsx:151`.

## 6. Executed verification — verbatim output

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
dist/assets/AnchorageListPage-CcchMC-v.js               109.13 kB │ gzip:  26.25 kB
dist/assets/PortListPage-D37DPq7N.js                    125.19 kB │ gzip:  26.16 kB
...
✓ built in 2.12s

stderr:
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.

Command exited with code 0.
```

- **Exit code: 0** (tool-reported `exitCode: 0` for the full chained command; tsc ran after build via `&&` and produced **no output** — clean typecheck).
- Key build lines verbatim: `vite v8.1.5 building client environment for production...` → `transforming...✓ 4065 modules transformed.` → `✓ built in 2.12s`.
- All 6 in-scope pages appear as compiled dist assets (BerthListPage, BuoyListPage, PierListPage, BuoyStationListPage, AnchorageListPage, PortListPage).
- Only stderr: the non-blocking chunk-size advisory (pre-existing, unrelated to label/width edits).
- No `npx tsc --noEmit` diagnostics anywhere in the captured output — clean.

### 6b. Gate re-run on exact final state (after artifact writes — verification-gate requirement)

The QA report artifact and the stray-file cleanup were written AFTER the run in §6, so the gate was re-executed on the final workspace state. Command (cwd `frontend/`): `npm run build && npx tsc --noEmit`

```
> frontend@0.0.0 build
> vite build
vite v8.1.5 building client environment for production...
transforming...✓ 4065 modules transformed.
rendering chunks...
computing gzip size...
dist/assets/AnchorageListPage-4-LoWISy.js               114.94 kB │ gzip:  26.78 kB
dist/assets/PortListPage-D1xbRKvA.js                    125.19 kB │ gzip:  26.16 kB
...
✓ built in 3.18s

stderr:
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider: ...
Command exited with code 0.
```

- **Exit code: 0** (tool-reported `exitCode: 0` for the chained command; `npx tsc --noEmit` produced no output — clean typecheck on the final state).
- Key lines verbatim: `transforming...✓ 4065 modules transformed.` → `✓ built in 3.18s`. Only stderr: non-blocking chunk-size advisory.
- All 6 in-scope pages compiled into dist assets (BerthListPage, BuoyListPage, PierListPage, BuoyStationListPage, AnchorageListPage, PortListPage).

## 7. Coverage notes / non-covered

- Visual/browser rendering (header shows full text, no ellipsis) was NOT exercised: no live-probe acceptance harness exists for this C2, and the oracle was verified at source level (label string + width) plus compile/typecheck gates. The triage `done_oracle` (uppercase `ĐỊA ĐIỂM (TỈNH/THÀNH PHỐ)`) is superseded by the user's final lowercase decision.
- Attribution of working-tree modifications to parallel modules (Anchorage module creation, M-1021, M-1022) was established via the triage edit footprint + current-file state, not via git history.

## 8. Findings

No defects found. All 5 acceptance criteria hold with direct current evidence.

## 9. Verdict

**Pass** — every acceptance criterion executed with observed output: 6/6 columns label `Địa điểm (Tỉnh/Thành phố)` + width 280, portClass width 220, zero capital-P in the 6 in-scope files, out-of-scope surfaces intact, `npm run build && npx tsc --noEmit` exit 0 (vite build 2.12s, 4065 modules, tsc clean).
