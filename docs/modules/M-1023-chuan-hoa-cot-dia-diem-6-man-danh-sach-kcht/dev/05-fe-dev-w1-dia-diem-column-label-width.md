# FE Wave 1 — 'Địa điểm' column: label 'Địa điểm (Tỉnh/Thành phố)' + width 250 (revision 4 — final width standard)

Triage: TRI-1787725751075-1001 · Module: M-1023-chuan-hoa-cot-dia-diem-6-man-danh-sach-kcht
Seat: engineering-frontend-developer (wave 1) · Revision 4 — user finalized the column width standard: **250px** (not 280). Decision recorded at `docs/intel/knowledge/decision/dia-diem-column-width-standard--44e7c8.md`.

## Final in-scope changes (verified by edit diffs + grep)

### 1. Six DataTable 'Địa điểm' columns — label unchanged `'Địa điểm (Tỉnh/Thành phố)'`, width 250

| # | File | Column key/dataIndex | Label line | Width line | Width (final) |
|---|------|----------------------|------------|------------|---------------|
| 1 | `frontend/src/services/port/PortListPage.tsx` | `province` | 1709 | 1712 | 250 |
| 2 | `frontend/src/pages/port/BerthListPage.tsx` | `provinceId` | 859 | 859 | 250 |
| 3 | `frontend/src/pages/port/PierListPage.tsx` | `province` | 675 | 675 | 250 |
| 4 | `frontend/src/pages/anchorage/AnchorageListPage.tsx` | `provinceId` | 906 | 908 | 250 |
| 5 | `frontend/src/services/buoy-station/BuoyStationListPage.tsx` | `province` | 807 | 807 | 250 |
| 6 | `frontend/src/services/buoy/BuoyListPage.tsx` | `provinceId` | 1329 | 1331 | 250 |

Only the width number changed (280 → 250) in this revision; label `'Địa điểm (Tỉnh/Thành phố)'` (lowercase 'phố'), key, dataIndex, render, sortable, ellipsis untouched.

### 2. portClass width (PortListPage.tsx only) — 220 → 250

`frontend/src/services/port/PortListPage.tsx:1700-1703` — `portClass` column ('Phân cấp cảng biển') width 220 → 250. Only the width number changed.

## Unchanged (must stay as-is)

- 9 out-of-scope strings remain at their reverted values (filter section headers 'Địa điểm (Tỉnh/TP)' / 'Địa điểm' / 'Tỉnh/Thành phố', form labelProps 'Địa điểm (Tỉnh/Thành phố)', detail labels) — none touched.
- `frontend/src/pages/port/DryPortListPage.tsx` untouched. AnchorageListPage history-drawer untouched. No backend files touched.

## Final-state grep verification

- All 7 target widths = 250 (PortListPage.tsx:1703 portClass, :1712 province; BerthListPage.tsx:859; PierListPage.tsx:675; AnchorageListPage.tsx:908; BuoyStationListPage.tsx:807; BuoyListPage.tsx:1331).
- All 6 column labels `'Địa điểm (Tỉnh/Thành phố)'`; zero capital-Phố `'Địa điểm (Tỉnh/Thành Phố)'` occurrences remain in the 6 files.
- Other `width: 280`/`250` hits (PortListPage.tsx:1664, BuoyListPage.tsx:1340, PortListPage.tsx:3829/3838) belong to different pre-existing columns — untouched.

## Verification (executed on the exact final state)

Command: `npm run build && npx tsc --noEmit` (cwd `frontend/`)

- `> frontend@0.0.0 build` → `> vite build`
- `vite v8.1.5 building client environment for production...`
- `transforming...✓ 4065 modules transformed.`
- `✓ built in 2.31s`
- `npx tsc --noEmit`: no output (clean)
- `Command exited with code 0.`
- stderr: only the non-blocking chunk-size advisory.
