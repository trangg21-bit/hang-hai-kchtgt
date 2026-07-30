# Frontend Rename Summary — H-002 Naming Hotfix

**Triage ID**: TRI-1785315662049-57e5  
**Scope**: Rename 6 Vietnamese field names to English across frontend TypeScript/TSX files

## Field Mapping

| Vietnamese | English | Found in DB schema/types? |
|---|---|---|
| `loaiHinhHoc` | `geometryType` | Already English in types |
| `toaDo` | `coordinates` | Already English in types |
| `bieuTuongId` | `symbolId` | Already English as `mapSymbolId` |
| `doSauMax` | `maxDepth` | Already English in types |
| `doSauTrungBinh` | `avgDepth` | Already English in types |
| `loaiVungNuoc` | `waterZoneType` | Already English in types |

> **Key finding**: All 6 Vietnamese field names were **already in English** in the TypeScript type definitions and database schema. The task consisted of cleaning up **derived variable names** and **lowercase comparison keys** that still used the Vietnamese naming.

## Files Changed

### Group 1: `createLoaiHinhHoc`/`updateLoaiHinhHoc` → `createGeometryType`/`updateGeometryType`

| File | Declaration | Usage |
|---|---|---|
| `frontend/src/app/berth/BerthListPage.tsx` | Lines 210-211 | Lines 1198, 1463 |
| `frontend/src/app/dryport/DryPortListPage.tsx` | Lines 203-204 | Lines 776, 885 |
| `frontend/src/app/pier/PierListPage.tsx` | Lines 193-194 | Lines 907, 1067 |
| `frontend/src/services/port/PortListPage.tsx` | Lines 337-338 | Lines 1346, 1791 |
| `frontend/src/services/port/PortCreatePage.tsx` | Line 17 | Line 134 |
| `frontend/src/services/port/PortUpdatePage.tsx` | Line 19 | Line 154 |

### Group 2: `watchLoaiHinhHoc` → `watchGeometryType`

| File | Declaration | Usage |
|---|---|---|
| `frontend/src/pages/station/LighthouseStationList.tsx` | Line 81 | Line 380 |
| `frontend/src/pages/station/BuoyStationList.tsx` | Line 82 | Line 415 |
| `frontend/src/pages/radarstation/RadarStationForm.tsx` | Line 65 | Lines 499, 640 |

### Group 3: `getLoaiVungNuocText` → `getWaterZoneTypeText`

| File | Declaration | Usage |
|---|---|---|
| `frontend/src/pages/gis/GISChartView.tsx` | Line 701 | Lines 1006, 1045, 1094 |

### Group 4: Lowercase comparison cleanup in `frontend/src/pages/gis/GISChartView.tsx`

- Line 1063: Removed `'toado'` from skip list (kept `'coordinates'`)
- Line 1064: Removed `'bieutuongid'` from skip list (kept `'iconid'` and `'symbolid'`)

### Group 5: `filterLoai` → `filterWaterZoneType`

| File | Occurrences |
|---|---|
| `frontend/src/pages/port/WaterZoneList.tsx` | 6 occurrences (declaration + 5 usages) |

### Group 6: `frontend/src/components/gis/GisLocationSelector.tsx` state variables

- `internalToaDo` → `internalCoordinates` (declaration + 9 usages)
- `internalBieuTuong` → `internalSymbolId` (declaration + 10 usages)
- `internalBieuTuongRef` → `internalSymbolIdRef` (4 occurrences)

### Not changed (out of scope / different concepts)

- `filterLoai` in `LegalDocumentList.tsx` — filters by `loai` (document type)
- `filterLoai` in `PierList.tsx` — filters by `loaiCau` (pier type)
- `filterLoaiBen` in `BerthListPage.tsx` — filters by `berthType`
- `filterLoaiCau` in `PierListPage.tsx` — filters by `loaiCau`

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` (from `frontend/`) | ✅ Pass (exit code 0) |
| Zero `loaiHinhHoc` occurrences | ✅ |
| Zero `toaDo` occurrences (as field name) | ✅ |
| Zero `bieuTuongId` occurrences | ✅ |
| Zero `doSauMax` occurrences | ✅ |
| Zero `doSauTrungBinh` occurrences | ✅ |
| Zero `loaiVungNuoc` occurrences | ✅ |
| Zero `'toado'` lowercase comparison | ✅ |
| Zero `'bieutuongid'` lowercase comparison | ✅ |

**Total files edited**: 13  
**Total replacements**: ~50
