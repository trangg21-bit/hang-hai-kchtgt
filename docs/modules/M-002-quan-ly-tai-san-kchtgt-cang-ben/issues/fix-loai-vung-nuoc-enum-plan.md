# Fix Plan: Remove hardcoded enum `loaiVungNuoc` → free text Input

**Triage:** TRI-1786095639836-e10e
**BA spec:** F-032 — `loaiVungNuoc` is `z.string().max(100).optional()` free text Input
**Status:** Pending dispatch to engineering-frontend-developer

## Target files (10) — exact transformations

### 1. `frontend/src/types/port.ts` (lines 527-543)
- **Remove** `VUNGNUOOC_LOAI_OPTIONS` (6 hardcoded enum values: NEO_DAU, DON_TRA_HOA_TIEU, QUAY_TRO_TAU, BEN_PHAO, CHUYEN_TAI, TRANH_BAO)
- **Remove** `VUNGNUOOC_LOAI_MAP` (6 color/label entries)

### 2. `frontend/src/app/waterzone/types.ts`
- **Remove** `export type LoaiVungNuoc = 'ANCHORAGE' | 'PILOT_BOARDING' | 'TURNING_BASIN' | 'MOORING_BUOY' | 'TRANSSHIPMENT' | 'STORM_SHELTER'`
- **Remove** `export const LOAI_VUNG_NUOC_OPTIONS = [...]` (6 entries)
- **Simplify** `translateLoaiVungNuoc` to `(val: string | null): string => val || '—'`
- **Change** `loaiVungNuoc?: LoaiVungNuoc` in `VungNuocFilters` to `loaiVungNuoc?: string`

### 3. `frontend/src/app/waterzone/schema.ts`
- Line 20: `z.enum([...6 values]).optional().nullable()` → `z.string().max(100, 'Loại vùng nước tối đa 100 ký tự').optional().nullable()`
- Line 42: Same change for update schema

### 4. `frontend/src/app/waterzone/WaterZoneListPage.tsx`
- Line 35: Remove `LoaiVungNuoc` from import
- Lines 39-40: Remove `LOAI_VUNG_NUOC_OPTIONS, translateLoaiVungNuoc` from import
- Lines 115-116: `useState<LoaiVungNuoc>` → `useState<string>`, drop cast
- Line 261-262: `translateLoaiVungNuoc(val)` → `val || '—'`
- Line 497: `translateLoaiVungNuoc(loaiVungNuoc)` → `loaiVungNuoc || '—'`
- Lines 687-689: Filter Select with `LOAI_VUNG_NUOC_OPTIONS` → Input (free text)
- Lines 808-809: Form Select → Input
- Lines 957-958: Form Select → Input

### 5. `frontend/src/pages/port/WaterZoneForm.tsx`
- Lines 218-228: Change `type="select"` + 6 hardcoded options to `type="text"` Input
- Remove `{ label: 'Khu đón trả hoa tiêu', value: 'DON_TRA_HOA_TIEU' }` and all sibling hardcoded options

### 6. `frontend/src/pages/port/WaterZoneList.tsx`
- Lines 21-23: Remove `VUNGNUOOC_LOAI_OPTIONS, VUNGNUOOC_LOAI_MAP` from import
- Line 172: Filter column `type: 'select'` → `type: 'text'`, remove `options: VUNGNUOOC_LOAI_OPTIONS`
- Lines 189-192: Remove Tag color rendering, display text directly: `loaiVungNuoc || '—'`

### 7. `frontend/src/services/port/PortDetailPage.tsx`
- Line 23: Remove `import { VUNGNUOOC_LOAI_MAP } from '../../types/port'`
- Line 607: `VUNGNUOOC_LOAI_MAP[v]?.label || v` → just `v`

### 8. `frontend/src/pages/Home.tsx`
- Line 137: Remove `'Khu đón trả hoa tiêu': '/water-zone?type=PILOT_BOARDING',`

### 9. `frontend/src/pages/gis/GISChartView.tsx`
- Lines 701-711: Replace `getLoaiVungNuocText` body with `return val || '—';`

### 10. `frontend/src/components/FilterBar.tsx`
- Line 24: Remove `{ value: 'water_zones_pilot_boarding', label: 'Khu đón trả hoa tiêu' },`
- Also remove all 6 `water_zones_*` fabricated subtype entries (lines 23-28)

## Verification
```bash
cd frontend && npx tsc --noEmit
```

## Out of scope
- Backend Java (WaterZoneType.java, F152ToF154ReportHandler.java)
- SQL migration files
- docs/ files
