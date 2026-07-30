# Frontend Field Name Rename Summary — H-001

**Triage ID**: TRI-1785315662049-57e5
**Date**: 2026-07-29

## Field Mapping

| Vietnamese | English | Occurrences renamed |
|---|---|---|
| `loaiHinhHoc` | `geometryType` | ~130 (type defs, forms, object access, URL params) |
| `toaDo` | `coordinates` | ~85 (type defs, form props, object access) |
| `bieuTuongId` | `symbolId` | ~99 (type defs, form names, arrays, object access) |
| `doSauMax` | `maxDepth` | 4 (type defs in port.ts, comment in waterzone/types.ts) |
| `doSauTrungBinh` | `avgDepth` | 4 (type defs in port.ts, comment in waterzone/types.ts) |
| `loaiVungNuoc` | `waterZoneType` | ~44 (type defs, URL params, form names, dataIndex, filters, GIS chart) |

## Files Modified (35+)

### Type definition files
- `frontend/src/types/port.ts` — all 6 fields
- `frontend/src/types/navigationChannel.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/types/dikeRevetment.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/types/radarStation.ts` — `geometryType`, `coordinates`
- `frontend/src/types/shipRepairFacility.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/types/vtsSystem.ts` — `geometryType`, `coordinates`

### App module files
- `frontend/src/app/berth/types.ts` — `symbolId`
- `frontend/src/app/berth/schema.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/app/berth/BerthListPage.tsx` — all 3 GIS fields
- `frontend/src/app/dryport/types.ts` — `symbolId`
- `frontend/src/app/dryport/schema.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/app/dryport/DryPortListPage.tsx` — all 3 GIS fields
- `frontend/src/app/pier/types.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/app/pier/schema.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/app/pier/PierListPage.tsx` — all 3 GIS fields
- `frontend/src/app/waterzone/types.ts` — `waterZoneType` (comment & type)
- `frontend/src/app/waterzone/WaterZoneListPage.tsx` — `waterZoneType`
- `frontend/src/app/waterzone/WaterZoneDeleteConfirm.tsx` — `waterZoneType`

### Service files
- `frontend/src/services/portService.ts` — `waterZoneType`
- `frontend/src/services/port/types.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/services/port/schema.ts` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/services/port/PortListPage.tsx` — all 3 GIS fields
- `frontend/src/services/port/PortUpdatePage.tsx` — all 3 GIS fields
- `frontend/src/services/port/PortCreatePage.tsx` — all 3 GIS fields
- `frontend/src/services/port/PortDetailPage.tsx` — `geometryType`, `waterZoneType`
- `frontend/src/services/station/beacon/types.ts` — `geometryType`, `coordinates`

### Page files
- `frontend/src/pages/Home.tsx` — `waterZoneType` (URL query params)
- `frontend/src/pages/port/WaterZoneList.tsx` — `waterZoneType`
- `frontend/src/pages/port/WaterZoneForm.tsx` — `waterZoneType`
- `frontend/src/pages/gis/GISChartView.tsx` — `waterZoneType`
- `frontend/src/pages/vtssystem/VtsSystemForm.tsx` — `geometryType`, `coordinates`
- `frontend/src/pages/dikerevetment/DikeRevetmentForm.tsx` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx` — `geometryType`, `coordinates`
- `frontend/src/pages/radarstation/RadarStationForm.tsx` — `geometryType`, `coordinates`, `symbolId`
- `frontend/src/pages/station/LighthouseStationList.tsx` — `geometryType`, `coordinates`
- `frontend/src/pages/station/BuoyStationList.tsx` — `geometryType`, `coordinates`
- `frontend/src/pages/beacons/BeaconList.tsx` — `geometryType`, `coordinates`
- `frontend/src/pages/buoys/BuoyList.tsx` — `geometryType`, `coordinates`
- `frontend/src/pages/shiprepair/ShipRepairFacilityForm.tsx` — `geometryType`, `coordinates`

### Component files
- `frontend/src/components/gis/GisLocationSelector.tsx` — `geometryType`, `coordinates`, `symbolId`

## Rename Scope Details

1. **TypeScript interfaces/types** — property names in `interface` and `type` declarations
2. **Form `name` props** — Ant Design `Form.Item name="loaiVungNuoc"` → `name="waterZoneType"`
3. **Object property access** — `data.loaiHinhHoc` → `data.geometryType`, `selectedRecord.bieuTuongId` → `selectedRecord.symbolId`
4. **Zod schemas** — all field validations
5. **URL query params** — `?loaiVungNuoc=NEO_DAU` → `?waterZoneType=NEO_DAU` in `Home.tsx`
6. **`searchParams`** — `searchParams.get('loaiVungNuoc')` → `searchParams.get('waterZoneType')` in `WaterZoneList.tsx`
7. **Derived variable names** — `createLoaiHinhHoc` → `createGeometryType`, `watchLoaiHinhHoc` → `watchGeometryType`, `filterLoai` → `filterWaterZoneType`
8. **Array includes** — `['bieuTuongId', 'iconId', ...]` → `['symbolId', 'iconId', ...]`
9. **Table `dataIndex`** — `dataIndex: 'loaiVungNuoc'` → `dataIndex: 'waterZoneType'`
10. **Column `key`** — `key: 'loaiVungNuoc'` → `key: 'waterZoneType'`
11. **Comparison expressions** — `k === 'loaiVungNuoc'` → `k === 'waterZoneType'`

## What Was NOT Changed

- Vietnamese UI labels: `"Loại đối tượng"`, `"Biểu tượng bản đồ"`, `"Loại vùng nước"` — remain as user-facing text

## Verification

```
npx tsc --noEmit → exit code 0, zero errors
grep for 6 Vietnamese field names → zero matches in .ts/.tsx files
```
