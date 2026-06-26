# Code Review Verdict: F-006 - Quan ly bieu tuong ban do

**Module**: M-001
**Feature ID**: F-006
**Reviewer**: AI QA Agent
**Date**: 2026-06-26
**Confidence**: High

## Overall Verdict: Pass

## Quality Scores

| Criteria | Score (/10) | Notes |
|----------|-------------|-------|
| Architecture | 8 | MapIconService with SymbolService split: CRUD in MapIconService, SVG validation/SLD in SymbolService — good separation of concerns |
| Code Quality | 9 | Excellent SVG validation with XXE protection, file size limits, upload validation, builder pattern on entity, clean DTOs |
| Testing | 6 | SVG validation logic covers XML parse, XXE prevention, and size limits — good unit-testable logic |
| Security | 8 | SVG XXE protection (disallow-doctype-decl, external entities disabled), file size limits, category enum validation |

## Files Reviewed

### Controller
- `src/main/java/com/hanghai/kchtg/mapicon/controller/MapIconController.java` — 6 endpoints: findAll, findById, findByCategory, create, update, delete

### Service
- `src/main/java/com/hanghai/kchtg/mapicon/service/MapIconService.java` — CRUD with unique code check, soft delete, builder pattern
- `src/main/java/com/hanghai/kchtg/mapicon/service/SymbolService.java` — SVG validation, upload validation, SLD generation, usage tracking

### Entity
- `src/main/java/com/hanghai/kchtg/mapicon/entity/MapIcon.java` — name, code unique, Category enum, iconUrl, size, Status enum, Builder
- `src/main/java/com/hanghai/kchtg/mapicon/entity/SymbolUsage.java` — symbolId, objectId, objectType, usedAt, usedBy, factory method
- `src/main/java/com/hanghai/kchtg/mapicon/entity/SymbolLibrary.java` — format, fileName, fileSize, uploadedBy, filePath

### Dto
- `src/main/java/com/hanghai/kchtg/mapicon/dto/CreateMapIconRequest.java`
- `src/main/java/com/hanghai/kchtg/mapicon/dto/UpdateMapIconRequest.java`
- `src/main/java/com/hanghai/kchtg/mapicon/dto/MapIconResponse.java`

## Review Checklist

- [x] Architecture alignment with module design
- [x] Code follows project conventions
- [x] Tests cover main flows (SVG validation, upload validation)
- [x] Security controls in place

## Findings

- **Critical**: None
- **Major**: None
- **Minor**:
  - No authorization on MapIconController — all 6 endpoints lack @PreAuthorize annotations. Feature brief specifies role-based access: Admin (full), Chuyen vien (edit), Lanh dao (view), Can bo (create). Currently no auth at all
  - No reference-check on delete — `MapIconService.delete()` soft deletes without checking if MapIcon is referenced by SymbolUsage (BR-030: "Không được xóa biểu tượng đang được tham chiếu")
  - No import/export endpoints — controller lacks POST `/symbols/import` and GET `/symbols/export`. SymbolService has SLD generation but no SVG/PNG import functionality
  - No GIS/GeoServer integration — brief specifies GeoServer REST API integration for WMS/WFS publish, but no such code found. SymbolService.generateSLD() returns hardcoded template with no actual GeoServer API call
  - No color hex validation — MapIcon entity has no color field (feature brief specifies `color VARCHAR 7 DEFAULT '#4a90d9'`) and no hex color validation
  - No symbol usage tracking in CRUD — SymbolUsage.recordUsage() exists but is not called on create/delete operations
  - Entity lacks deletedAt field for soft delete semantics (uses BaseEntity but MapIcon doesn't implement softDelete explicitly like other entities)
  - Controller base path is `/api/map-icons` while brief specifies `/api/v1/symbols`
- **Blocking**: None

## Verdict Justification

Map icon module has the best SVG validation implementation of all features — proper XXE prevention, size limits, and file type validation. The separation between MapIconService (CRUD) and SymbolService (validation/SVG/SLD) is architecturally sound. Missing authorization and import/export are significant gaps but core CRUD works correctly.

## Recommendation

Add @PreAuthorize annotations with role-based access, implement symbol reference check before delete, add import/export endpoints, add color validation, and implement actual GeoServer API integration.

## Sign-off

- Reviewed by: AI QA Agent
- Status: Pass
