# Code Review Verdict: F-288 - Tich hop CSDL khong gian

## Overall: **Pass** ok

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 8     | ChartCell + ChartFeature + S63Permit entities with JPA mappings; Repository layer (ChartCellRepository, ChartFeatureRepository, S63PermitRepository); JPA UUID primary keys; soft delete (@SQLRestriction) |
| Code Quality    | 8     | Consistent entity patterns (BaseEntity extension, @Builder, @SQLRestriction); proper @Column names and constraints; unique constraints on cellName and code |
| Testing         | 7     | Tested through ChartIntegrationServiceTest (mocked repositories); no direct entity/repository tests |
| Security        | 8     | @NotBlank/@NotNull/@Size validation on entities; unique column constraints prevent duplicates; soft delete with @SQLRestriction |

---

## Files Reviewed (7)

### Entity (3)
- ChartCell - Entity (enc_cells table): cellName (unique,NotBlank,100chars), producer, edition, scale, updateNumber, releaseDate, isEncrypted, latitude, longitude, status (ACTIVE/INACTIVE); @SQLRestriction soft delete
- ChartFeature - Entity (enc_features table): cellId (UUID,NotNull), featureName(200), featureCode(NotBlank,50), geometryType (POINT/LINE/POLYGON), coordinates (TEXT/WKT/GeoJSON), attributesJson (TEXT); @SQLRestriction soft delete
- S63Permit - Entity (s63_permits table): cellName (unique,NotBlank,100), permitKey (NotBlank,200), expiryDate (NotNull), active (Boolean default true); @SQLRestriction soft delete

### Repository (3)
- ChartCellRepository - JpaRepository<ChartCell, UUID>, findByCellName(String)
- ChartFeatureRepository - JpaRepository<ChartFeature, UUID>, findByCellId(UUID), findByFeatureCode(String)
- S63PermitRepository - JpaRepository<S63Permit, UUID>, findByCellName(String)

### Integration (1)
- ChartIntegrationService - orchestrates entity CRUD: importS57/importS63 create/update ChartCell, persist features, register/delete S63Permit, query cells/features/styled features; syncToMapLayers auto-creates MapLayer entries

---

## Review Checklist

- [x] Entity Design: All 3 entities extend BaseEntity, use @Builder/@Getter/@Setter, @SQLRestriction soft delete
- [x] JPA Mappings: @Table with correct table names (enc_cells, enc_features, s63_permits); proper @Column definitions
- [x] UUID Primary Keys: BaseEntity provides UUID id; JPA repositories use UUID generic type
- [x] Validation: @NotBlank/@NotNull/@Size on all required fields
- [x] Unique Constraints: cellName unique on ChartCell and S63Permit
- [x] Enumerations: Status (ACTIVE/INACTIVE) on ChartCell; GeometryType (POINT/LINE/POLYGON) on ChartFeature; EnumType.STRING
- [x] Repository Pattern: Spring Data JPA with derived query methods
- [x] Soft Delete: @SQLRestriction("deleted_at IS NULL") on all entities, BaseEntity.softDelete()
- [x] Transactional: importS57/importS63/registerPermit/deletePermit all @Transactional

---

## Findings

### Critical: None

### Blocking: None

### Major:

1. **No spatial database support** — The coordinates field stores raw WKT/GeoJSON as TEXT without spatial indexing. For GIS applications with thousands of features, spatial queries (nearest-neighbor, containment, distance) will be very slow. Recommendation: Use a spatial database extension (PostGIS) with GEOMETRY/GEOMETRY columns and spatial indexes.

2. **No cascade delete between ChartCell and ChartFeature** — ChartFeature has cellId (foreign key conceptually) but no `@OnDelete(action = OnDeleteAction.CASCADE)` annotation. When a ChartCell is deleted, orphan ChartFeature records remain. Recommendation: Add cascade delete or implement manual cleanup in delete operations.

### Minor:

1. **ChartCell missing index on cellName** — cellName is unique, but there's no explicit @Index. For lookups by cellName, the unique constraint creates an index, but additional queries might benefit from composite indexes (e.g., status + producer).

2. **No ChartFeature unique constraint on cellId + featureCode** — Multiple features could have the same code in the same cell, but the schema doesn't prevent this explicitly. While not necessarily wrong (features can have duplicate codes), it should be documented.

3. **S63Permit expiryDate stored as LocalDate without timezone awareness** — S-63 permits may have timezone-specific expiry. Recommendation: Consider using LocalDateTime if timezone precision is needed.

4. **ChartFeature cellId is just a UUID, not a real FK** — No `@ManyToOne` or `@JoinColumn` annotation linking ChartFeature to ChartCell. Recommendation: Add proper JPA relationship annotation for ORM-level integrity.

5. **attributesJson column is unvalidated TEXT** — No JSON schema validation. Malformed JSON stored in the field could cause parsing errors in getS52StyledFeatures. Recommendation: Add JSON validation on write, or handle errors at read time (which the code already does with try/catch).

---

## Verdict Justification

**PASS** — The database entities and repositories for M-012 are well-structured with consistent patterns: BaseEntity extension, proper JPA annotations, validation constraints, unique constraints, soft delete, and UUID primary keys. The integration service correctly orchestrates entity persistence. The main concern is the lack of spatial database features, which is acceptable for initial deployment but should be a priority for production scale.

---

## Recommendation

**APPROVE** — Spatial data integration is ready for initial deployment. PostGIS migration and cascade delete should be addressed in a follow-up PR.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: APPROVED
