# FE Wave 1 — 'Địa điểm' column: label 'Địa điểm (Tỉnh/Thành phố)' + width 280 (revision 3 — final user decision)

Triage: TRI-1787725751075-1001 · Module: M-1023-chuan-hoa-cot-dia-diem-6-man-danh-sach-kcht
Seat: engineering-frontend-developer (wave 1) · Revision 3 — user's final decision: standard label uses lowercase 'phố' (`Địa điểm (Tỉnh/Thành phố)`); portClass width widened to 220.

## Final in-scope changes (all verified by edit diffs + grep)

### 1. Six DataTable column labels → `'Địa điểm (Tỉnh/Thành phố)'` (lowercase 'phố'), width 280

| # | File | Column key/dataIndex | Line | Label (final) | Width |
|---|------|----------------------|------|---------------|-------|
| 1 | `frontend/src/services/port/PortListPage.tsx` | `province` | 1709 | `Địa điểm (Tỉnh/Thành phố)` | 280 |
| 2 | `frontend/src/pages/port/BerthListPage.tsx` | `provinceId` | 859 | `Địa điểm (Tỉnh/Thành phố)` | 280 |
| 3 | `frontend/src/pages/port/PierListPage.tsx` | `province` | 675 | `Địa điểm (Tỉnh/Thành phố)` | 280 |
| 4 | `frontend/src/pages/anchorage/AnchorageListPage.tsx` | `provinceId` | 906 | `Địa điểm (Tỉnh/Thành phố)` | 280 |
| 5 | `frontend/src/services/buoy-station/BuoyStationListPage.tsx` | `province` | 807 | `Địa điểm (Tỉnh/Thành phố)` | 280 |
| 6 | `frontend/src/services/buoy/BuoyListPage.tsx` | `provinceId` | 1329 | `Địa điểm (Tỉnh/Thành phố)` | 280 |

Only label + width changed per column; `key`/`dataIndex`/`render`/`sortable`/`ellipsis`/`sortOrder` untouched.

### 2. portClass width (PortListPage.tsx only) → 220

`frontend/src/services/port/PortListPage.tsx:1702` — `portClass` column ('Phân cấp cảng biển') width 190 → 220. Only the width number changed; label/key/dataIndex/render/sortable untouched.

## Unchanged (must stay as-is)

- 9 out-of-scope strings remain at their reverted pre-dispatch values: Port 2019 `'Tỉnh/Thành phố'` (filter section header); Port 2214/2957 `labelProps('Địa điểm (Tỉnh/Thành phố)')` (form labels); Port 3622 `'Địa điểm (Tỉnh/Thành phố)'` (detail-row label); Berth 789 `'Địa điểm (Tỉnh/TP)'`, Pier 586 `'Địa điểm'`, Anchorage 754 `'Địa điểm (Tỉnh/TP)'`, BuoyStation 966 `'Địa điểm'`, Buoy 1598 `'Địa điểm (Tỉnh/TP)'` (filter section headers). None re-touched in this revision.
- `frontend/src/pages/port/DryPortListPage.tsx` untouched. AnchorageListPage history-drawer untouched. No backend files touched.

## Final-state grep verification

- `'Địa điểm (Tỉnh/Thành Phố)'` (capital Phố): **zero occurrences** in all 6 files.
- Each file contains its column label `'Địa điểm (Tỉnh/Thành phố)'` at the lines listed above, all with width 280 (and `portClass` width 220 at PortListPage.tsx:1702).

## Verification (executed on the exact final state)

Command: `npm run build && npx tsc --noEmit` (cwd `frontend/`)

- `> frontend@0.0.0 build` → `> vite build`
- `vite v8.1.5 building client environment for production...`
- `transforming...✓ 4065 modules transformed.`
- `✓ built in 2.13s`
- `npx tsc --noEmit`: no output (clean)
- `Command exited with code 0.`
- stderr: only the non-blocking chunk-size advisory (`(!) Some chunks are larger than 500 kB after minification...`).
