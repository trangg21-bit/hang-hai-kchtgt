# Backend Field Name Rename Summary — H-001

**Triage ID**: TRI-1785315662049-57e5
**Date**: 2026-07-29

## Field Mapping

| Vietnamese | English | Occurrences renamed |
|---|---|---|
| `bieuTuongId` | `symbolId` | 8 (6 DTO field decls + 2 getter references) |
| `toaDo` | `coordinates` | 8 (2 DTO field decls removed, 1 getter ref fixed, 5 local var refs) |

## Files Modified

| # | File | Change |
|---|---|---|
| 1 | `dikerevetment/dto/DikeRevetmentUpdateRequest.java` | `private UUID bieuTuongId` → `private UUID symbolId` |
| 2 | `dikerevetment/dto/DikeRevetmentResponse.java` | `private UUID bieuTuongId` → `private UUID symbolId` |
| 3 | `dikerevetment/dto/DikeRevetmentCreateRequest.java` | `private UUID bieuTuongId` → `private UUID symbolId` |
| 4 | `navigationchannel/dto/NavigationChannelUpdateRequest.java` | `private UUID bieuTuongId` → `private UUID symbolId` |
| 5 | `navigationchannel/dto/NavigationChannelResponse.java` | `private UUID bieuTuongId` → `private UUID symbolId` |
| 6 | `navigationchannel/dto/NavigationChannelCreateRequest.java` | `private UUID bieuTuongId` → `private UUID symbolId` |
| 7 | `station/dto/buoy/UpdateBuoyStationRequest.java` | Removed duplicate `toaDo` field (kept existing `coordinates`) |
| 8 | `station/dto/buoy/CreateBuoyStationRequest.java` | Removed duplicate `toaDo` field (kept existing `coordinates`) |
| 9 | `station/service/BuoyStationService.java` | `request.getToaDo()` → `request.getCoordinates()` (line 108) |
| 10 | `station/service/LighthouseStationService.java` | Local variable `toaDo` → `coordinates` (7 occurrences) |

## Key Details

- **BuoyStationRequest DTOs (#7, #8)**: These DTOs already had both `private String toaDo` AND `private String coordinates` fields. Removed the `toaDo` line while keeping `coordinates` unchanged.
- **BuoyStationService.java (#9)**: Lombok-generated getter `getToaDo()` no longer existed after renaming the field in `CreateBuoyStationRequest.java`. Fixed the call to `getCoordinates()`.
- **LighthouseStationService.java (#10)**: Internal local variable `toaDo` used in spatial sync logic — renamed all 7 occurrences to `coordinates`.

## Pre-existing Errors (not caused by this rename)

`ReportService.java` lines 1076-1086 — 6 enum switch errors (unrelated pre-existing issues).

## Verification

```
grep for bieuTuongId / toaDo in *.java → zero matches
mvn compile -q → 6 pre-existing errors in ReportService.java only (zero from modified files)
```
