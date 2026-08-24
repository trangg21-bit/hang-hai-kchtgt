# Wave 4 Report: Cross-Cutting Consolidation — M-004

- **Module**: M-004 Quản lý tài sản Báo hiệu & Thông tin
- **Wave**: 4 (cross-cutting consolidation)
- **Date**: 2026-07-08
- **Author**: engineering-technical-lead

---

## Summary

This report consolidates three cross-cutting analysis tasks (API prefix inconsistency, station↔tai package duplication, station history storage) plus one fix (F-068 In Scope/Out of Scope placeholders), and updates the module's `implementations.yaml`.

---

## 1. F-068 Fix: In Scope / Out of Scope

**📄 File**: `_features/F-068-quan-ly-den-bien-tao-moi/feature-brief.md`

The two `(populated by ba stage)` placeholders in the **In Scope** and **Out of Scope** sections have been replaced with real content matching the pattern established by other filled feature briefs (e.g., F-080).

### In Scope (populated)
- Tạo mới đèn biển với đầy đủ các trường thuộc tính (code, name, type, latitude, longitude, lightRange, lightColor, lightCharacteristic, range, description, unitId, lastMaintenanceDate, nextMaintenanceDate, isActive)
- Validation dữ liệu đầu vào theo business rules: kiểm tra mã code duy nhất, tọa độ WGS84, tầm hiệu lực, tầm nhìn xa
- Hỗ trợ hai chế độ: lưu nháp (action="draft" → status=DRAFT) và gửi phê duyệt ngay (action="submit" → status=PENDING_APPROVAL)
- Ghi lịch sử CREATE vào beacon_history khi action=submit
- Mã (code) tự động kiểm tra unique trên cả beacon_light và buoy

### Out of Scope (populated)
- Cập nhật/xóa đèn biển (F-069, F-070)
- Phê duyệt đèn biển (F-071, F-072)
- Quản lý phao tiêu (Buoy — F-074 đến F-079)
- Tích hợp GIS với M-007
- Xem lịch sử thay đổi (F-073)

---

## 2. API Prefix Inconsistency Analysis

### 2.1 M-004 Controller `@RequestMapping` Inventory

| Controller | Base Package | `@RequestMapping` | Prefix Convention |
|---|---|---|---|
| `BeaconLightController` | `beacon/` | `/api/beacon-lights` | `/api/` (no version) |
| `BuoyController` | `beacon/` | `/api/buoys` | `/api/` (no version) |
| `BeaconHistoryController` | `beacon/` | `/api/beacon-history` | `/api/` (no version) |
| `NhaTramPhaoController` | `nhatram/` | `/api/v1/nhatram/phao` | `/api/v1/` |
| `NhaTramDenController` | `nhatram/` | `/api/v1/nhatram/den` | `/api/v1/` |
| `NhaTramHistoryController` | `nhatram/` | `/api/v1/nhatram/history` | `/api/v1/` |
| `CoastalStationVTSController` | `station/` | `/api/v1/stations/coastal` | `/api/v1/` |
| `CoastalStationInmarsatController` | `station/` | `/api/v1/stations/inmarsat` | `/api/v1/` |
| `CoastalStationCospasSarsatController` | `station/` | `/api/v1/stations/cospas-sarsat` | `/api/v1/` |
| `CoastalStationLRITController` | `station/` | `/api/v1/stations/lrit` | `/api/v1/` |
| `CoastalStationHaiphongController` | `station/` | `/api/v1/stations/haiphong` | `/api/v1/` |

**Finding**: M-004 has a **clear split**:

- **3 beacon controllers** use `/api/` (no version prefix)
- **8 nhatram + station controllers** use `/api/v1/` (version prefix)

### 2.2 Project-Wide Context

Scanning **all 94 controllers** across the entire codebase, the project is roughly split:

| Prefix | Count | Example Controllers |
|---|---|---|
| `/api/` (no version) | ~40 | `BeaconLight`, `Buoy`, `OrgUnit`, `User`, `Group`, `Role`, `GIS point/polygon/line`, `MapIcon`, etc. |
| `/api/v1/` | ~50 | `NhaTram`, `Station`, `CangBien`, `VanBan`, `Statistics`, `Integration`, `Asset`, `DeKe`, etc. |
| Other (`/api/auth`, `/api/register`, etc.) | ~4 | `AuthController`, `PasswordReset`, `RegisterConfig`, `TotpSetup` |

### 2.3 Impact Assessment

| Aspect | Impact |
|---|---|
| **Beacon frontend calls** | `beaconService.ts` calls `/beacon-lights` and `/buoys` — matches `/api/` prefix |
| **Nhatram frontend calls** | `services/nhatram/api.ts` calls `/v1/nhatram/...` — matches `/api/v1/` prefix |
| **Station frontend calls** | `services/station/api.ts` calls `/v1/stations/...` — matches `/api/v1/` prefix |
| **API gateway/nginx** | Would need both route patterns; no runtime conflict |
| **Client SDK generation** | Two prefix conventions complicate codegen; OpenAPI spec would have mixed paths |

**Recommendation**: Unify to `/api/v1/` across all M-004 controllers in a future wave. Beacon controllers (`/api/beacon-lights`, `/api/buoys`, `/api/beacon-history`) would need path changes and corresponding frontend updates.

---

## 3. Station vs `tai` Package Duplicate Analysis

### 3.1 Package Comparison

| Dimension | `station/` (M-004) | `tai/` (M-015) |
|---|---|---|
| **Base package** | `com.hanghai.kchtg.station` | `com.hanghai.kchtg.tai` |
| **Base class** | `BaseStation` (`@MappedSuperclass`) | `BaseTai` (`@Entity`, `@Inheritance(JOINED)`) |
| **Table strategy** | Each entity has own table | Shared `base_tai` table + child tables via JOINED |
| **Entities (5)** | `CoastalStationVTS`, `CoastalStationInmarsat`, `CoastalStationCospasSarsat`, `CoastalStationLRIT`, `CoastalStationHaiphong` | `TaiThongTinDuyenHai`, `TaiInmarsat`, `TaiCospasSarsat`, `TaiLRIT`, `TaiThongTinHangHaiHN` |
| **Tables** | `coastal_station_vts`, `coastal_station_inmarsat`, `coastal_station_cospas_sarsat`, `coastal_station_lrit`, `coastal_station_haiphong` | `base_tai`, `tai_thong_tin_duyen_hai`, `tai_inmarsat`, `tai_cospas_sarsat`, `tai_lrit`, `tai_thong_tin_hang_hai_hn` |
| **Module** | M-004 (Quản lý tài sản Báo hiệu & Thông tin) | M-015 (appears to be a separate module) |
| **API prefix** | `/api/v1/stations/...` | `/api/v1/tai/...` |
| **Response envelope** | Raw entity/DTO (no `ApiResponse`) | Wrapped in `ApiResponse` |
| **Validation** | Service-level | DTO-level (`@Valid`) |
| **Security** | Minimal `@PreAuthorize` | `@PreAuthorize` on most endpoints |
| **Soft-delete** | `LocalDateTime deletedAt` + `@SQLRestriction("deleted_at IS NULL")` | `Boolean deleted` + `@SQLRestriction("deleted = false")` |
| **Timestamps** | `LocalDateTime` | `Instant` |
| **Approval workflow** | 2-stage (approve-l1 → approve-l2) | 2-stage with approval/unapproval |
| **History** | In-memory `HistoryService` (ArrayList) | DB-backed `TaiHistory` entity + `TaiHistoryService` |

### 3.2 Feature Mapping (Entity Equivalence)

| station/ Entity | tai/ Entity | Domain Concept |
|---|---|---|
| `CoastalStationVTS` | `TaiThongTinDuyenHai` | Đài thông tin duyên hải (coastal comms station) |
| `CoastalStationInmarsat` | `TaiInmarsat` | Đài Inmarsat |
| `CoastalStationCospasSarsat` | `TaiCospasSarsat` | Đài COSPAS-SARSAT |
| `CoastalStationLRIT` | `TaiLRIT` | Đài LRIT |
| `CoastalStationHaiphong` | `TaiThongTinHangHaiHN` | Đài thông tin hàng hải Hải Phòng |

### 3.3 Key Differences Affecting Consolidation

1. **Inheritance strategy** — `station` uses `@MappedSuperclass` (each table has full column set), `tai` uses `@Inheritance(JOINED)` (shared base table + child-specific tables). Consolidation requires choosing one strategy.
2. **Field naming** — `tai` uses `approvedRemarks` / `unapprovedRemarks`, `station` uses `rejectionReason`. Different audit field names.
3. **Data types** — `tai` uses `Instant` timestamps and `UUID` for user IDs; `station` uses `LocalDateTime` and `Long` for `approvedBy`.
4. **Soft-delete representation** — `tai`: `Boolean deleted`; `station`: `LocalDateTime deletedAt`.
5. **Response format** — `tai` uses `ApiResponse` envelope, `station` returns raw entities. This affects all API consumers.
6. **Module ownership** — `station/` is M-004 (Báo hiệu & Thông tin), `tai/` appears to be a separate module. Consolidation requires cross-module coordination.

**Recommendation**: Do NOT merge blindly in a single wave. The packages serve different modules with different entity structures. Consider a phased approach:
- **Wave N**: Align response envelope (`station` controllers → `ApiResponse`)
- **Wave N+1**: Align field naming and types
- **Wave N+2**: Merge entity hierarchy with a shared base class
- **Gate**: Requires agreement between M-004 and the owning module of `tai/`

---

## 4. Station History Storage Analysis

### 4.1 Current Implementation

**File**: `src/main/java/com/hanghai/kchtg/station/service/HistoryService.java`

```java
@Service
public class HistoryService {
    private final List<CoastalStationVTSHistoryResponse> historyStore = new ArrayList<>();

    public void recordHistory(String stationCode, StationHistoryActionType action,
                              String previousValue, String newValue,
                              String changedBy, LocalDateTime changedAt) { ... }

    public List<CoastalStationVTSHistoryResponse> getHistory(String stationCode) { ... }

    public void clearHistory() { ... }
}
```

### 4.2 Comparison with Other Domains

| Domain | Storage | Entity | Repository | Table |
|---|---|---|---|---|
| **Beacon** | DB-backed | `BeaconHistory` (`@Entity`) | `BeaconHistoryRepository` | `beacon_history` |
| **NhaTram** | DB-backed | `NhaTramHistory` (`@Entity`) | `NhaTramHistoryRepository` | `nha_tram_history` |
| **Station** | In-memory (`ArrayList`) | `CoastalStationVTSHistoryResponse` (DTO, not `@Entity`) | None | None (in-memory only) |

### 4.3 Risk Assessment

| Risk | Severity | Detail |
|---|---|---|
| **Data loss on restart** | **HIGH** | All station audit history is lost when the application restarts |
| **No concurrent access guard** | MEDIUM | `ArrayList` is not thread-safe; concurrent write operations could lose entries |
| **Memory leak** | LOW | History grows unbounded; no size limit or TTL on the list |
| **No cross-station-type query** | LOW | `getHistory()` filters by `stationCode` string only; no global history view |
| **No diff calculation** | LOW | Stores `previousValue` / `newValue` as raw strings; no structured diff |

### 4.4 Migration Recommendation

Replace `HistoryService` in-memory storage with a `StationHistory` entity + Spring Data JPA repository, following the pattern established by `BeaconHistory` and `NhaTramHistory`:

1. Create `StationHistory` entity with: `id`, `stationType` (discriminator: VTS/INMARSAT/COSPAS/LRIT/HAIPHONG), `stationId`, `stationCode`, `actionType`, `previousValue`, `newValue`, `changedBy`, `changedAt`
2. Create `StationHistoryRepository extends JpaRepository<StationHistory, UUID>`
3. Create a new table (e.g., `station_history`) via Flyway migration
4. Re-target `HistoryService` to use the repository

---

## 5. Implementations.yaml Update

### 5.1 Changes Made

| Field | Before | After |
|---|---|---|
| `stakeholders.business-owner` | `""` | `"TBD - see project charter"` |
| `stakeholders.tech-lead` | `""` | `"assigned via tech-lead/04-plan.md"` |
| `stakeholders.qa-lead` | `""` | `"TBD - future wave"` |
| `station-frontend` comment | (none) | Added note: F-104..F-121 no frontend pages |
| `station-service-frontend` comment | (none) | Added note: F-104..F-121 no frontend service functions |

### 5.2 Frontend Coverage Gap

| Feature Range | Entity Group | Backend | Frontend Pages | Frontend Service | Status |
|---|---|---|---|---|---|
| F-068..F-072 | BeaconLight | ✅ `beacon/` | ✅ `pages/beacons/` | ✅ `beaconService.ts` | ✅ Complete |
| F-073 | BeaconLight History | ✅ `beacon/` | ✅ `pages/history/` | ✅ `beaconService.ts` | ✅ Complete |
| F-074..F-078 | Buoy | ✅ `beacon/` | ✅ `pages/buoys/` | ✅ `beaconService.ts` | ✅ Complete |
| F-079 | Buoy History | ✅ `beacon/` | ✅ `pages/history/` | ✅ `beaconService.ts` | ✅ Complete |
| F-080..F-085 | NhaTramPhao | ✅ `nhatram/` | ✅ `pages/nhatram/` | ✅ `services/nhatram/` | ✅ Complete |
| F-086..F-091 | NhaTramDen | ✅ `nhatram/` | ✅ `pages/nhatram/` | ✅ `services/nhatram/` | ✅ Complete |
| F-092..F-097 | CoastalStationVTS | ✅ `station/` | ✅ `CoastalStationList.tsx` | ✅ `services/station/` | ✅ Complete |
| F-098..F-103 | CoastalStationInmarsat | ✅ `station/` | ✅ `SpecialStationList.tsx` | ✅ `services/station/` | ✅ Complete |
| F-104..F-109 | CoastalStationCospasSarsat | ✅ `station/` | ❌ **Missing** | ❌ **Missing** | ⚠️ Gap |
| F-110..F-115 | CoastalStationLRIT | ✅ `station/` | ❌ **Missing** | ❌ **Missing** | ⚠️ Gap |
| F-116..F-121 | CoastalStationHaiphong | ✅ `station/` | ❌ **Missing** | ❌ **Missing** | ⚠️ Gap |

**3 of 9 entity groups (33%) lack frontend pages and service functions.** These are the same 3 station types identified in the Wave 1 plan.

---

## 6. Open Issues

| ID | Issue | Severity | Wave Target |
|---|---|---|---|
| WI-001 | API prefix split: `/api/` vs `/api/v1/` across M-004 controllers | Low | Future |
| WI-002 | Station ↔ `tai` package duplication (10 entities across 2 modules) | Medium | Requires cross-module coordination |
| WI-003 | Station history in-memory (data lost on restart) | **High** | Wave 3 (per plan) |
| WI-004 | Missing frontend pages for CospasSarsat, LRIT, Haiphong (3 entity groups) | Medium | Wave 2 (per plan) |
| WI-005 | `StationApprovalStatus` has APPROVED_L1/APPROVED_L2; other domains have APPROVED (single) | Low | Future |

---

## 7. Verification

All findings in this report are based on direct file reads and code analysis:

- `@RequestMapping` values verified via `grep` on 94 controller files
- `HistoryService.java` content read and confirmed as `ArrayList`-based in-memory store
- `tai/` entity `BaseTai.java` read to confirm `@Inheritance(JOINED)` pattern vs `station/` `BaseStation.java` `@MappedSuperclass`
- F-068 feature-brief.md edited with real content matching F-080 pattern
- `implementations.yaml` updated with stakeholder references and gap annotations

**No source code under `src/main/` or `src/test/` was modified in this wave.**
