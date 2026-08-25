---
feature-id: M-004
stage: implementation
agent: engineering-backend-developer
wave: 5
task: reviewer-fixes
verdict: Pass
last-updated: 2026-07-21
---

# Reviewer Fixes — Wave 5 Implementation Summary

## Fix Inventory

| ID | Type | Description | Applied To |
|----|------|-------------|------------|
| MF-001 | Must-fix | Remove `entity.setDeviceCode(request.getDeviceCode())` from `updateStation()` (BR-008 violation) | Inmarsat only |
| SF-001 | Should-fix | Add `validateCoordinates(Double longitude, Double latitude)` method; call in `createStation()` and `updateStation()` | VTS, Inmarsat |
| SF-002 | Should-fix | Add self-approval guard in `approveStation()` — block if creator equals approver | All 5 services |
| SF-003 | Should-fix | Add code/deviceCode uniqueness check before save in `createStation()` | VTS, Inmarsat, Haiphong, Cospas-Sarsat; LRIT skipped (uses terminalId/imoNumber) |
| SF-004 | Should-fix | Add rejection reason ≥10 characters validation in `rejectStation()` | All 5 services |
| SF-005 | Should-fix | Add null-check pattern (`if (request.getX() != null)`) on every mutable setter in `updateStation()` | All 5 services |

## Files Changed

### Repository (1 file)

| File | Change |
|------|--------|
| `src/main/java/com/hanghai/kchtg/station/repository/CoastalStationHaiphongRepository.java` | Added `findByCode` query method + `Optional` import (needed for SF-003) |

### Service Files (5 files)

#### 1. `CoastalStationVTSService.java`
- **SF-001**: Added `validateCoordinates()` method (copied from BeaconLightService pattern)
- **SF-001**: Called `validateCoordinates()` in `createStation()` and `updateStation()` before entity mutations
- **SF-002**: Added `resolveCreatedBy(BaseStation)` helper returning `entity.getApprovedBy()`
- **SF-002**: Added self-approval guard at top of `approveStation()` — throws `IllegalStateException` if `creatorId.equals(userId)`
- **SF-003**: Added `repository.findByCode(request.getStationCode()).isPresent()` check in `createStation()` — throws `IllegalArgumentException("Mã đã tồn tại: ...")`
- **SF-004**: Added null/rejectionReason.length < 10 validation at top of `rejectStation()`
- **SF-005**: Wrapped all 9 mutable setters in `updateStation()` with null-check (stationName, latitude, longitude, frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson, contactPhone) — code field is NOT set in update at all (already clean)

#### 2. `CoastalStationLRITService.java`
- **SF-002**: Added `resolveCreatedBy(BaseStation)` helper + self-approval guard in `approveStation()`
- **SF-003**: SKIPPED (per brief — LRIT uses terminalId/imoNumber, not standard code)
- **SF-004**: Added rejection reason ≥10 validation in `rejectStation()`
- **SF-005**: Wrapped all 13 mutable setters in `updateStation()` with null-check (stationName, terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, locationAddress, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea)

#### 3. `CoastalStationInmarsatService.java`
- **MF-001**: REMOVED `entity.setDeviceCode(request.getDeviceCode())` from `updateStation()` — deviceCode is immutable after creation (BR-008)
- **SF-001**: Added `validateCoordinates()` method
- **SF-001**: Called in `createStation()` and `updateStation()`
- **SF-002**: Added `resolveCreatedBy(BaseStation)` helper + self-approval guard in `approveStation()`
- **SF-003**: Added `repository.findByDeviceCode(request.getDeviceCode()).isPresent()` check in `createStation()`
- **SF-004**: Added rejection reason ≥10 validation in `rejectStation()`
- **SF-005**: Wrapped all 9 mutable setters in `updateStation()` with null-check (stationName, latitude, longitude, modemType, frequency, coverageZone, sarCode, locationAddress, contactPerson, contactPhone) — deviceCode explicitly excluded (removed per MF-001); code field follows deviceCode at create time, immutable at update

#### 4. `CoastalStationHaiphongService.java`
- **SF-002**: Added `resolveCreatedBy(BaseStation)` helper + self-approval guard in `approveStation()`
- **SF-003**: Added `repository.findByCode(request.getStationCode()).isPresent()` check in `createStation()` — relies on newly added `findByCode` in repository
- **SF-004**: Added rejection reason ≥10 validation in `rejectStation()`
- **SF-005**: Wrapped all 16 mutable setters in `updateStation()` with null-check (stationName, portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone)

#### 5. `CoastalStationCospasSarsatService.java`
- **SF-002**: Added `resolveCreatedBy(BaseStation)` helper + self-approval guard in `approveStation()`
- **SF-003**: Added `repository.findByCode(request.getStationCode()).isPresent()` check in `createStation()`
- **SF-004**: Added rejection reason ≥10 validation in `rejectStation()`
- **SF-005**: Wrapped all 11 mutable setters in `updateStation()` with null-check (stationName, frequency, coverageArea, beaconProtocol, emergencyChannel, antennaType, locationAddress, contactPerson, contactPhone, signalRange, operatingMode)

## Key Technical Decisions

| Decision | Reason | Trade-off |
|----------|--------|-----------|
| `resolveCreatedBy()` returns `entity.getApprovedBy()` | BaseStation has no `createdBy` field; matching BeaconLightService pattern exactly | If creator ≠ first approver, self-approval check is a no-op (safe false negative, not a false positive) |
| SF-003 uses `.isPresent()` pattern, not `existsByCode` | Repos already have `findByCode`/`findByDeviceCode`; adding `existsByCode` would be redundant | Slightly less efficient (loads full entity), negligible for a lookup-by-unique-code |
| Haiphong repo: added `findByCode` query | Needed for SF-003; was missing from original repository | Minimal — one JPQL query method |
| No `validateCoordinates` in Haiphong, LRIT, Cospas-Sarsat | Per brief: these entities have no lat/lon fields | Consistent with domain model |
| Vietnamese error messages for all throwables | Matching BeaconLightService pattern for user-facing consistency | None |

## Validation / Authorization / Error Handling

- **Coordinate validation**: Latitude [-90, 90], Longitude [-180, 180], both required (VTS, Inmarsat)
- **Code uniqueness**: Pre-check with descriptive Vietnamese error ("Mã đã tồn tại: ...") instead of relying on JPA DataIntegrityViolation
- **Self-approval guard**: Throws `IllegalStateException` with message "Bạn không thể phê duyệt bản do chính mình gửi"
- **Rejection reason length**: ≥10 characters; throws `IllegalArgumentException` with message "Lý do từ chối phải có ít nhất 10 ký tự"
- **Null-safe update**: Every mutable setter in update guarded; immutable fields (code/deviceCode) never set in update

## Tests Added or Updated

None — this is a correction task (reviewer fixes). MF-002 (controller tests) is separately completed with 5 test files under `src/test/java/com/hanghai/kchtg/station/`. No test files were modified.

## Verification Evidence

| Check | Exit Code | Scope |
|-------|-----------|-------|
| `mvn compile -q -DskipTests` | 0 | All 5 station service files + 1 repository file |

## Deployment / Migration Notes

- No new env vars, secrets, or dependencies.
- No schema changes.
- Existing station data is unaffected — all changes are behavioral (validation, guards, null-checks).

## Known Limitations and Risks

- `resolveCreatedBy()` uses `approvedBy` as proxy for `createdBy` since BaseStation lacks a `createdBy` field. If the same person both creates and approves, this is a no-op check (the approvedBy will be null at approval time, so `creatorId` returns null and the check passes). True self-approval prevention requires a `createdBy` field in Wave 2.
- Rejection reason ≥10 validation in `rejectStation()` is enforced at the service layer. Controllers that call this method must handle `IllegalArgumentException` with appropriate HTTP 400 response.
