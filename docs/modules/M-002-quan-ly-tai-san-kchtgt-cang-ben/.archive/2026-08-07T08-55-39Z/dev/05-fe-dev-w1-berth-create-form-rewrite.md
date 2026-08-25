# BerthForm Rewrite — F-014 Berth Create

## Summary

Rewrote `frontend/src/pages/port/BerthForm.tsx` following the `PortCreatePage.tsx` UI pattern with ALL fields from `CreateBerthRequest` / `UpdateBerthRequest` interfaces, supporting both create and edit modes with 3-save-action RBAC.

## Changes

### File modified
- `frontend/src/pages/port/BerthForm.tsx` — complete rewrite (old: ~270 lines, new: ~600 lines)

### What was done

| Criterion | Status |
|---|---|
| All CreateBerthRequest fields present (17 general + 3 announcement + 4 GIS) | ✅ |
| PortCreatePage UI pattern (Card sections, Divider, Row/Col, pill inputs) | ✅ |
| GPS sub-table with add/delete (max 10, min 1 for submit) | ✅ |
| File upload with constraints (.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif, 20MB, 10 files) | ✅ |
| 3 save actions: Lưu tạm / Gửi phê duyệt / Lưu và phê duyệt | ✅ |
| RBAC: admin sees all 3, non-admin sees only "Lưu tạm" | ✅ |
| Cascade orgUnitId → portId → berthCode | ✅ |
| Create mode (POST /v1/berths) | ✅ |
| Edit mode (PUT /v1/berths via api.put) | ✅ |
| Token-based styling (no hardcoded colors) | ✅ |
| `npx tsc --noEmit` passes clean | ✅ |

### Form Sections

1. **Thông tin chung** (17 fields): orgUnitId, portId, berthCode, berthName, waterway, operator, provinceId, detailedLocation, structureType, operationalFunction, totalArea, designThroughput, currentThroughput, maxVesselSize, plannedThroughput, latestCargoVolume, operationalStatus

2. **Thông tin công bố** (3 fields): openingAnnouncementDate, openingDecision, investmentAgreement

3. **Thông tin vị trí GIS** (4 fields): geometryType, mapSymbolId, coordinateSystem, displayRule

4. **Tọa độ GPS** (sub-table): lat/lng pairs with validation, add/delete rows

5. **File đính kèm**: Ant Design Upload with manual fileList state

### Save Actions

| Action | saveAction | Visibility | Validation |
|---|---|---|---|
| Lưu tạm | `DRAFT` | Always | orgUnitId + portId + berthName |
| Gửi phê duyệt | `SUBMIT` | Admin only | Full + ≥1 GPS coord |
| Lưu và phê duyệt | `SAVE_AND_APPROVE` | Admin only | Full + ≥1 GPS coord |

### Key Technical Decisions

- **API calls**: Uses `api.post` / `api.put` directly (not `berthCRUD.create/update`) to include extra fields (geometryType, coordinateList) not in the typed interfaces
- **provinceId**: Mapped from VIETNAM_PROVINCES array index (1-based) — selected province name → `indexOf(name) + 1`
- **GPS coordinates**: Parsed from `Berth.coordinates` JSON string in edit mode
- **File upload**: Uploaded via `POST /v1/berths/:id/attachments` after berth is created/updated
- **berthCode auto-gen**: Calls `GET /v1/berths/generate-code?portId=X` when portId changes

## Verification

```bash
cd frontend && npx tsc --noEmit
# Exit code: 0 — no type errors
```
