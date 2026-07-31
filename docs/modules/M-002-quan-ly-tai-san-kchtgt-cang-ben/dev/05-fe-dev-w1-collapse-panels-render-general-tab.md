# Dev Report: Collapse Panels — renderGeneralTab (Wave 1)

**Task:** TRI-1785480972140-6380 | C0
**Date:** 2026-07-31
**File:** `frontend/src/services/port/PortDetailPage.tsx`
**Verification:** `npx tsc --noEmit` (exit 0)

## Change Summary

Replaced `<SectionGroup>` + `<Divider>` pattern in `renderGeneralTab` with Ant Design `<Collapse>` panels. All inner content preserved exactly — only wrappers and separators removed.

## Panel Mapping

| Panel Key | Label | Content (unchanged) |
|---|---|---|
| `general` | 1. Thông tin chung | 10 InfoRows in Row |
| `stats` | 2. Chỉ số tổng hợp | 14 StatCards + conditional otherWaterAreas |
| `gis` | 3. Thông tin GIS | 4 InfoRows in Row |
| `gps` | 4. Tọa độ GPS | coordinateList Table / lat-lng Row / EmptyState |
| `infra` | 5. Công trình KCHT trực thuộc | Berths table + Water zones table |
| `files` | 6. File đính kèm | File cards + Upload button |
| `notes` | 7. Ghi chú & Trạng thái | Notes field + 2 status badges |
| `audit` | 8. Thông tin kiểm toán | Audit Row (admin-only, conditional) |

## Group 7 Split

- **Panel `notes`**: Ghi chú + Trạng thái hoạt động + Trạng thái phê duyệt
- **Panel `audit`** (admin-only via `isAdmin`): Người tạo / Ngày tạo / Người cập nhật / Ngày cập nhật

## Collapse Config

- `defaultActiveKey={['general']}` — only first panel open by default
- `size="small"` — compact Ant Design panel size
- `style={{ background: 'transparent' }}` — no white background behind panels

## Verification

```
$ npx tsc --noEmit   # from frontend/
# exit 0 — no type errors
```

## Out of Scope (not modified)

- `SectionGroup` component definition (left in file; still used nowhere else in this tab)
- Main `PortDetailPage` component
- Imports
- Any other file
