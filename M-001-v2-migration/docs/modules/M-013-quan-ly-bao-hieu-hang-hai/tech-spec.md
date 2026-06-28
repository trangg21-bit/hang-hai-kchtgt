# Tech-Spec: Quản lý Báo hiệu Hàng hải (M-013)

> **Document type**: Technical Specification — tech-lead stage
> **Module**: M-013 — Quản lý Báo hiệu Hàng hải
> **Stage**: tech-lead (engineering-technical-lead)
> **Date**: 2026-06-25
> **Source**: SA design `sa/design.md` + all 12 feature briefs
> **Target Audience**: Backend Developer (wave-1 → wave-5)

---

## 1. Overview

This tech-spec translates the SA design and 12 BA feature briefs into engineering-ready instructions. It covers database schema, API contracts, code patterns (based on M-007 PointObject), package structure, entity/DTO/Service/Controller field mappings, approval workflow, history logging, cross-type validation, and wave-by-wave task breakdown.

---

## 2. Package Structure

```
src/main/java/com/hanghai/kchtg/beacon/
├── entity/
│   ├── BeaconLight.java               ─ đèn biển entity
│   ├── Buoy.java                      ─ phao tiêu entity
│   ├── BeaconHistory.java             ─ shared audit trail
│   ├── BeaconLightType.java           ─ LIGHTHOUSE|BEACON_LIGHT|BEACON_MARK
│   ├── BuoyType.java                  ─ CARDINAL|SECTOR|SPECIAL|SAFE_WATER|ISOLATED_DANGER
│   ├── BeaconStatus.java              ─ DRAFT→PUBLISHED lifecycle
│   ├── BeaconApprovalStatus.java      ─ PENDING|APPROVED|REJECTED
│   └── BeaconHistoryActionType.java   ─ CREATE|UPDATE|APPROVE_L1|APPROVE_L2|REJECT|SOFT_DELETE
├── repository/
│   ├── BeaconLightRepository.java
│   ├── BuoyRepository.java
│   └── BeaconHistoryRepository.java
├── service/
│   ├── BeaconLightService.java
│   ├── BuoyService.java
│   └── BeaconHistoryService.java
├── controller/
│   ├── BeaconLightController.java
│   ├── BuoyController.java
│   └── BeaconHistoryController.java
└── dto/
    ├── beacon-light/
    │   ├── CreateBeaconLightRequest.java
    │   ├── UpdateBeaconLightRequest.java
    │   └── BeaconLightResponse.java
    ├── buoy/
    │   ├── CreateBuoyRequest.java
    │   ├── UpdateBuoyRequest.java
    │   └── BuoyResponse.java
    └── history/
        ├── BeaconHistoryResponse.java
        └── BeaconHistoryQuery.java
```

**Package-level annotations**:
- No `@ComponentScan` needed — already covered by `@SpringBootApplication` in `KchtgApplication`.
- Use `@RequiredArgsConstructor` (Lombok) for constructor injection in all Service and Controller classes.
- Use `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder` (Lombok) on all entities.
- Use `@Data @NoArgsConstructor @AllArgsConstructor @Builder` (Lombok) on all DTOs.

---

## 3. Database Schema (SQL DDL)

### 3.1 Schema: `beacon_light`

```sql
CREATE TABLE beacon_light (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(50)  NOT NULL,  -- cross-type unique (app-level)
    name                    VARCHAR(200) NOT NULL,
    type                    VARCHAR(30)  NOT NULL,  -- LIGHTHOUSE | BEACON_LIGHT | BEACON_MARK
    latitude                DOUBLE PRECISION NOT NULL,  -- -90.0 ~ 90.0
    longitude               DOUBLE PRECISION NOT NULL,  -- -180.0 ~ 180.0
    light_range             DOUBLE PRECISION NOT NULL,  -- 0.01 ~ 60.0 nautical miles
    light_color             VARCHAR(50),              -- RED | WHITE | GREEN | YELLOW
    light_characteristic    VARCHAR(100),             -- FL, Iso, Q, VQ, Oc, F, Fl(2)
    range                   DOUBLE PRECISION,         -- 0.01 ~ 100.0 nautical miles
    description             VARCHAR(1000),
    unit_id                 BIGINT,                   -- FK → units (M-001, no DB FK constraint)
    last_maintenance_date   DATE,
    next_maintenance_date   DATE,
    is_active               BOOLEAN DEFAULT true,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_level          INTEGER,
    approved_by             BIGINT,
    approved_date           TIMESTAMP,
    rejection_reason        VARCHAR(500),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMP
);

COMMENT ON TABLE beacon_light IS 'Nautical beacon light equipment (lighthouse, beacon light, beacon mark)';
COMMENT ON COLUMN beacon_light.code IS 'Unique across both beacon_light and buoy tables (application-level constraint)';

CREATE INDEX idx_beacon_light_status ON beacon_light(status);
CREATE INDEX idx_beacon_light_code ON beacon_light(code);
CREATE INDEX idx_beacon_light_unit ON beacon_light(unit_id);
CREATE INDEX idx_beacon_light_type ON beacon_light(type);
```

### 3.2 Schema: `buoy`

```sql
CREATE TABLE buoy (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(50)  NOT NULL,  -- cross-type unique (app-level)
    name                    VARCHAR(200) NOT NULL,
    type                    VARCHAR(30)  NOT NULL,  -- CARDINAL | SECTOR | SPECIAL | SAFE_WATER | ISOLATED_DANGER
    latitude                DOUBLE PRECISION NOT NULL,  -- -90.0 ~ 90.0
    longitude               DOUBLE PRECISION NOT NULL,  -- -180.0 ~ 180.0
    color                   VARCHAR(50),              -- RED | GREEN | BLACK+RED | WHITE | YELLOW | ORANGE
    shape                   VARCHAR(50),              -- CAN | CONE | SPAR | BELL | BUCKET | TUBULAR
    light_characteristic    VARCHAR(100),             -- FL, Iso, Q, VQ, Oc, F, Fl(2)
    range                   DOUBLE PRECISION NOT NULL,  -- 0.01 ~ 100.0 nautical miles
    description             VARCHAR(1000),
    unit_id                 BIGINT,                   -- FK → units (M-001, no DB FK constraint)
    last_inspection_date    DATE,
    next_inspection_date    DATE,
    is_active               BOOLEAN DEFAULT true,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_level          INTEGER,
    approved_by             BIGINT,
    approved_date           TIMESTAMP,
    rejection_reason        VARCHAR(500),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMP
);

COMMENT ON TABLE buoy IS 'Nautical buoy equipment (cardinal, sector, special, safe water, isolated danger)';
COMMENT ON COLUMN buoy.code IS 'Unique across both beacon_light and buoy tables (application-level constraint)';

CREATE INDEX idx_buoy_status ON buoy(status);
CREATE INDEX idx_buoy_code ON buoy(code);
CREATE INDEX idx_buoy_unit ON buoy(unit_id);
CREATE INDEX idx_buoy_type ON buoy(type);
```

### 3.3 Schema: `beacon_history`

```sql
CREATE TABLE beacon_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beacon_type     VARCHAR(10) NOT NULL,  -- BEACON_LIGHT | BUOY
    entity_id       UUID NOT NULL,         -- FK → beacon_light.id OR buoy.id
    action_type     VARCHAR(20) NOT NULL,  -- CREATE | UPDATE | APPROVE_L1 | APPROVE_L2 | REJECT | SOFT_DELETE
    changed_field   VARCHAR(100),
    previous_value  TEXT,
    new_value       TEXT,
    changed_by      BIGINT NOT NULL,       -- user ID (from auth context)
    changed_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    reason          VARCHAR(500),
    diff_data       JSONB                  -- PostgreSQL JSONB for full diff object
);

COMMENT ON TABLE beacon_history IS 'Shared audit trail for both beacon_light and buoy entities';

CREATE INDEX idx_beacon_history_entity ON beacon_history(entity_id, beacon_type);
CREATE INDEX idx_beacon_history_changed_at ON beacon_history(changed_at DESC);
CREATE INDEX idx_beacon_history_action ON beacon_history(action_type);
```

### 3.4 Key Design Decisions

| Decision | Rationale |
|---|---|
| No DB-level UNIQUE across `beacon_light.code` + `buoy.code` | PostgreSQL cannot enforce cross-table UNIQUE; use app-level validation per TD-003 |
| No DB-level FK to `units` | M-001 is a separate module; validate at service level to avoid tight coupling |
| `beacon_history` does NOT extend `BaseEntity` | Separate `@Entity` without `@SQLRestriction` — history must always be queryable even for soft-deleted entities |
| `diff_data` uses PostgreSQL JSONB | Only supported in PostgreSQL; marks this as PostgreSQL-only feature (TD-005) |
| `status` enum + `deletedAt` both used | `status` tracks business state; `deletedAt` + `@SQLRestriction` provides DB-level soft-delete filtering |

---

## 4. Entity Layer — Field Mappings

### 4.1 BaseEntity (inherited fields — every entity gets these)

```java
// com.hanghai.kchtg.common.entity.BaseEntity
@Id                    UUID id              // UUID auto-generated
@CreatedDate           LocalDateTime createdAt
@LastModifiedDate      LocalDateTime updatedAt
@Column(name="deleted_at")  LocalDateTime deletedAt   // null = active

// Soft delete pattern:
@SQLRestriction("deleted_at IS NULL")   // on each concrete entity
// public void softDelete() { this.deletedAt = LocalDateTime.now(); }
```

### 4.2 BeaconLight Entity — Full Field Map

| Field | Type | DB Column | Annotations | Constraints | Default |
|---|---|---|---|---|---|
| `id` | UUID | id | `@Id`, `@GeneratedValue(UUID)` | PK | auto |
| `code` | String | code | `@NotBlank`, `@Size(max=50)`, `@Column(nullable=false, unique=true, length=50)` | max 50, no `<>&"` | — |
| `name` | String | name | `@NotBlank`, `@Size(max=200)`, `@Column(nullable=false, length=200)` | max 200 | — |
| `type` | `BeaconLightType` | type | `@Enumerated(STRING)`, `@Column(nullable=false, length=30)` | LIGHTHOUSE\|BEACON_LIGHT\|BEACON_MARK | — |
| `latitude` | Double | latitude | `@NotNull`, `@DecimalMin("-90.0")`, `@DecimalMax("90.0")` | WGS84 | — |
| `longitude` | Double | longitude | `@NotNull`, `@DecimalMin("-180.0")`, `@DecimalMax("180.0")` | WGS84 | — |
| `lightRange` | Double | light_range | `@NotNull`, `@DecimalMin("0.01")`, `@DecimalMax("60.0")`, `@Column(name="light_range")` | 0.01–60.0 nm | — |
| `lightColor` | String | light_color | `@Size(max=50)`, `@Column(length=50)` | nullable | null |
| `lightCharacteristic` | String | light_characteristic | `@Size(max=100)`, `@Column(name="light_characteristic", length=100)` | nullable | null |
| `range` | Double | range | `@DecimalMin("0.01")`, `@DecimalMax("100.0")` | 0.01–100.0 nm | nullable |
| `description` | String | description | `@Size(max=1000)` | max 1000 chars | null |
| `unitId` | Long | unit_id | `@Column(name="unit_id")` | nullable, service-level validation | null |
| `lastMaintenanceDate` | LocalDate | last_maintenance_date | `@Column(name="last_maintenance_date")` | ≤ today | null |
| `nextMaintenanceDate` | LocalDate | next_maintenance_date | `@Column(name="next_maintenance_date")` | ≥ lastMaintenanceDate | null |
| `isActive` | Boolean | is_active | `@Column(name="is_active")`, `@Builder.Default` | — | true |
| `status` | `BeaconStatus` | status | `@Enumerated(STRING)`, `@Column(nullable=false, length=20)`, `@Builder.Default` | See enum | DRAFT |
| `approvalStatus` | `BeaconApprovalStatus` | approval_status | `@Enumerated(STRING)`, `@Column(nullable=false, length=20)`, `@Builder.Default` | See enum | PENDING |
| `approvalLevel` | Integer | approval_level | `@Column(name="approval_level")` | 1 or 2 | null |
| `approvedBy` | Long | approved_by | `@Column(name="approved_by")` | nullable | null |
| `approvedDate` | LocalDateTime | approved_date | `@Column(name="approved_date")` | nullable | null |
| `rejectionReason` | String | rejection_reason | `@Column(name="rejection_reason", length=500)` | min 10 chars when set | null |

### 4.3 Buoy Entity — Full Field Map

| Field | Type | DB Column | Annotations | Constraints | Default |
|---|---|---|---|---|---|
| `id` | UUID | id | `@Id`, `@GeneratedValue(UUID)` | PK | auto |
| `code` | String | code | `@NotBlank`, `@Size(max=50)`, `@Column(nullable=false, unique=true, length=50)` | max 50 | — |
| `name` | String | name | `@NotBlank`, `@Size(max=200)`, `@Column(nullable=false, length=200)` | max 200 | — |
| `type` | `BuoyType` | type | `@Enumerated(STRING)`, `@Column(nullable=false, length=30)` | CARDINAL\|SECTOR\|SPECIAL\|SAFE_WATER\|ISOLATED_DANGER | — |
| `latitude` | Double | latitude | `@NotNull`, `@DecimalMin("-90.0")`, `@DecimalMax("90.0")` | WGS84 | — |
| `longitude` | Double | longitude | `@NotNull`, `@DecimalMin("-180.0")`, `@DecimalMax("180.0")` | WGS84 | — |
| `color` | String | color | `@Size(max=50)` | nullable | null |
| `shape` | String | shape | `@Size(max=50)` | nullable | null |
| `lightCharacteristic` | String | light_characteristic | `@Size(max=100)`, `@Column(name="light_characteristic", length=100)` | nullable | null |
| `range` | Double | range | `@NotNull`, `@DecimalMin("0.01")`, `@DecimalMax("100.0")` | 0.01–100.0 nm | — |
| `description` | String | description | `@Size(max=1000)` | max 1000 chars | null |
| `unitId` | Long | unit_id | `@Column(name="unit_id")` | nullable | null |
| `lastInspectionDate` | LocalDate | last_inspection_date | `@Column(name="last_inspection_date")` | ≤ today | null |
| `nextInspectionDate` | LocalDate | next_inspection_date | `@Column(name="next_inspection_date")` | ≥ lastInspectionDate | null |
| `isActive` | Boolean | is_active | `@Column(name="is_active")`, `@Builder.Default` | — | true |
| `status` | `BeaconStatus` | status | `@Enumerated(STRING)`, `@Column(nullable=false, length=20)`, `@Builder.Default` | — | DRAFT |
| `approvalStatus` | `BeaconApprovalStatus` | approval_status | `@Enumerated(STRING)`, `@Column(nullable=false, length=20)`, `@Builder.Default` | — | PENDING |
| `approvalLevel` | Integer | approval_level | `@Column(name="approval_level")` | 1 or 2 | null |
| `approvedBy` | Long | approved_by | `@Column(name="approved_by")` | nullable | null |
| `approvedDate` | LocalDateTime | approved_date | `@Column(name="approved_date")` | nullable | null |
| `rejectionReason` | String | rejection_reason | `@Column(name="rejection_reason", length=500)` | min 10 chars when set | null |

### 4.4 BeaconHistory Entity — Full Field Map

| Field | Type | DB Column | Annotations | Constraints | Default |
|---|---|---|---|---|---|
| `id` | UUID | id | `@Id`, `@GeneratedValue(UUID)`, `@Column(updatable=false, nullable=false, length=36)` | PK | auto |
| `beaconType` | `BeaconType` | beacon_type | `@Enumerated(STRING)`, `@Column(nullable=false, length=10)` | BEACON_LIGHT\|BUOY | — |
| `entityId` | UUID | entity_id | `@Column(nullable=false)` | FK reference | — |
| `actionType` | `BeaconHistoryActionType` | action_type | `@Enumerated(STRING)`, `@Column(nullable=false, length=20)` | See enum | — |
| `changedField` | String | changed_field | `@Column(length=100)` | nullable | null |
| `previousValue` | String | previous_value | `@Column(columnDefinition="TEXT")` | nullable | null |
| `newValue` | String | new_value | `@Column(columnDefinition="TEXT")` | nullable | null |
| `changedBy` | Long | changed_by | `@Column(nullable=false)` | user ID | — |
| `changedAt` | LocalDateTime | changed_at | `@Column(nullable=false)` | auto | NOW |
| `reason` | String | reason | `@Column(length=500)` | nullable | null |
| `diffData` | String | diff_data | `@JdbcTypeCode(SqlTypes.JSON)`, `@Column(columnDefinition="JSONB")` | nullable | null |

**Note**: `BeaconHistory` does NOT extend `BaseEntity` — it is a standalone entity.

### 4.5 Enum Definitions (all in `com.hanghai.kchtg.beacon.entity`)

```java
// BeaconLightType.java
public enum BeaconLightType { LIGHTHOUSE, BEACON_LIGHT, BEACON_MARK }

// BuoyType.java
public enum BuoyType { CARDINAL, SECTOR, SPECIAL, SAFE_WATER, ISOLATED_DANGER }

// BeaconStatus.java — shared lifecycle
public enum BeaconStatus {
    DRAFT,            // Nháp
    PENDING_APPROVAL, // Chờ phê duyệt
    APPROVED_L1,      // Đã phê duyệt L1
    APPROVED_L2,      // Đã phê duyệt L2
    PUBLISHED,        // Đã công bố
    REJECTED,         // Bị từ chối
    DELETED           // Đã xóa (soft)
}

// BeaconApprovalStatus.java — shared approval state
public enum BeaconApprovalStatus { PENDING, APPROVED, REJECTED }

// BeaconHistoryActionType.java — shared action types
public enum BeaconHistoryActionType {
    CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE
}

// BeaconType.java — discriminator for history records
public enum BeaconType { BEACON_LIGHT, BUOY }
```

---

## 5. Repository Layer

### 5.1 BeaconLightRepository

```java
package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BeaconLightRepository extends JpaRepository<BeaconLight, UUID> {

    Optional<BeaconLight> findByCode(String code);
    boolean existsByCode(String code);                          // BR-068-01 / BR-074-01

    Page<BeaconLight> findByStatus(BeaconStatus status, Pageable pageable);
    Page<BeaconLight> findByType(BeaconLightType type, Pageable pageable);
    List<BeaconLight> findByNameContainingIgnoreCase(String name);
    List<BeaconLight> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT b FROM BeaconLight b WHERE " +
           "(:name IS NULL OR b.name LIKE %:name%) AND " +
           "(:code IS NULL OR b.code LIKE %:code%) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status)")
    List<BeaconLight> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") BeaconLightType type,
        @Param("status") BeaconStatus status
    );

    long countByStatus(BeaconStatus status);
}
```

### 5.2 BuoyRepository

```java
package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BuoyRepository extends JpaRepository<Buoy, UUID> {

    Optional<Buoy> findByCode(String code);
    boolean existsByCode(String code);                          // BR-074-01 / BR-068-01

    Page<Buoy> findByStatus(BeaconStatus status, Pageable pageable);
    Page<Buoy> findByType(BuoyType type, Pageable pageable);
    List<Buoy> findByNameContainingIgnoreCase(String name);
    List<Buoy> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT b FROM Buoy b WHERE " +
           "(:name IS NULL OR b.name LIKE %:name%) AND " +
           "(:code IS NULL OR b.code LIKE %:code%) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status)")
    List<Buoy> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") BuoyType type,
        @Param("status") BeaconStatus status
    );

    long countByStatus(BeaconStatus status);
}
```

### 5.3 BeaconHistoryRepository

```java
package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BeaconHistoryRepository extends JpaRepository<BeaconHistory, UUID> {

    Page<BeaconHistory> findByEntityIdAndBeaconType(
        UUID entityId, BeaconType beaconType, Pageable pageable);

    Page<BeaconHistory> findByEntityIdAndBeaconTypeAndActionType(
        UUID entityId, BeaconType beaconType, BeaconHistoryActionType actionType, Pageable pageable);

    @Query("SELECT h FROM BeaconHistory h WHERE h.entityId = :entityId " +
           "AND h.beaconType = :beaconType " +
           "AND h.changedAt BETWEEN :from AND :to ORDER BY h.changedAt DESC")
    Page<BeaconHistory> findByDateRange(
        @Param("entityId") UUID entityId,
        @Param("beaconType") BeaconType beaconType,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        Pageable pageable
    );

    long countByEntityIdAndBeaconType(UUID entityId, BeaconType beaconType);
}
```

---

## 6. DTO Layer — Field Mappings

### 6.1 BeaconLight DTOs

**CreateBeaconLightRequest.java** (fields from BR-068 data model):
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateBeaconLightRequest {
    @NotBlank(message = "Mã đèn biển không được để trống")
    @Size(max = 50)
    private String code;                              // BR-068-01

    @NotBlank(message = "Tên đèn biển không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại đèn không được để trống")
    private BeaconLightType type;

    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;                           // BR-068-02

    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;                          // BR-068-02

    @NotNull @DecimalMin("0.01") @DecimalMax("60.0")
    private Double lightRange;                         // BR-068-03

    @Size(max = 50)
    private String lightColor;

    @Size(max = 100)
    private String lightCharacteristic;

    @DecimalMin("0.01") @DecimalMax("100.0")
    private Double range;

    @Size(max = 1000)
    private String description;

    private Long unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String action = "draft";                   // "draft" or "submit" — BR-068-05
}
```

**UpdateBeaconLightRequest.java** (mutable fields only):
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateBeaconLightRequest {
    @Size(max = 200)
    private String name;
    @Size(max = 50)
    private String lightColor;
    @Size(max = 100)
    private String lightCharacteristic;
    @DecimalMin("0.01") @DecimalMax("100.0")
    private Double range;
    @Size(max = 1000)
    private String description;
    private Long unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private Boolean isActive;
    // NOTE: code and type are NOT mutable (BR-069-01, BR-069-02)
}
```

**BeaconLightResponse.java**:
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BeaconLightResponse {
    private UUID id;
    private String code;
    private String name;
    private BeaconLightType type;
    private Double latitude;
    private Double longitude;
    private Double lightRange;
    private String lightColor;
    private String lightCharacteristic;
    private Double range;
    private String description;
    private Long unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private Boolean isActive;
    private BeaconStatus status;
    private BeaconApprovalStatus approvalStatus;
    private Integer approvalLevel;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 6.2 Buoy DTOs (parallel structure)

**CreateBuoyRequest.java**:
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateBuoyRequest {
    @NotBlank(message = "Mã phao tiêu không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên phao tiêu không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại phao không được để trống")
    private BuoyType type;

    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;

    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;

    @Size(max = 50)
    private String color;

    @Size(max = 50)
    private String shape;

    @Size(max = 100)
    private String lightCharacteristic;

    @NotNull @DecimalMin("0.01") @DecimalMax("100.0")
    private Double range;                              // BR-074-03

    @Size(max = 1000)
    private String description;

    private Long unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String action = "draft";
}
```

**UpdateBuoyRequest.java**:
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateBuoyRequest {
    @Size(max = 200) private String name;
    @Size(max = 50)  private String color;
    @Size(max = 50)  private String shape;
    @Size(max = 100) private String lightCharacteristic;
    @DecimalMin("0.01") @DecimalMax("100.0") private Double range;
    @Size(max = 1000) private String description;
    private Long unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private Boolean isActive;
}
```

**BuoyResponse.java**:
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BuoyResponse {
    private UUID id;
    private String code;
    private String name;
    private BuoyType type;
    private Double latitude;
    private Double longitude;
    private String color;
    private String shape;
    private String lightCharacteristic;
    private Double range;
    private String description;
    private Long unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private Boolean isActive;
    private BeaconStatus status;
    private BeaconApprovalStatus approvalStatus;
    private Integer approvalLevel;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 6.3 History DTOs

**BeaconHistoryResponse.java**:
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BeaconHistoryResponse {
    private UUID id;
    private BeaconType beaconType;
    private UUID entityId;
    private BeaconHistoryActionType actionType;
    private String changedField;
    private String previousValue;
    private String newValue;
    private Long changedBy;
    private String changedByName;       // resolved from M-001 user service
    private LocalDateTime changedAt;
    private String reason;
    private String diffData;
}
```

**BeaconHistoryQuery.java**:
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BeaconHistoryQuery {
    private BeaconType beaconType;
    private UUID entityId;
    private BeaconHistoryActionType actionType;
    private Long changedBy;
    private LocalDateTime from;
    private LocalDateTime to;
}
```

---

## 7. Service Layer — Method Signatures

### 7.1 BeaconLightService

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BeaconLightService {

    private final BeaconLightRepository beaconLightRepo;
    private final BuoyRepository buoyRepo;                  // BR-068-01 cross-type check
    private final BeaconHistoryRepository historyRepo;
    private final PointObjectSyncService pointObjectSyncService;  // M-007 integration
    private final NotificationService notificationService;        // Notification integration

    // ── READ ───────────────────────────────────────────

    /** List all beacon lights (BR-072) */
    public List<BeaconLightResponse> findAll()

    /** Get single by ID, throws EntityNotFoundException if not found */
    public BeaconLightResponse findById(UUID id)

    /** Search with optional filters (name, code, type, status) */
    public List<BeaconLightResponse> search(
        String name, String code, BeaconLightType type, BeaconStatus status)

    // ── CREATE ─────────────────────────────────────────

    /**
     * Create beacon light. action="draft" → DRAFT; action="submit" → PENDING_APPROVAL.
     * Validates cross-type unique code (BR-068-01), coordinates (BR-068-02),
     * lightRange (BR-068-03), maintenance dates (BR-068-07, BR-068-08).
     * Auto-assigns unitId from auth context (BR-068-10).
     * Logs CREATE history entry (BR-068-10).
     */
    @Transactional
    public BeaconLightResponse create(CreateBeaconLightRequest request)

    // ── UPDATE ─────────────────────────────────────────

    /**
     * Update beacon light. Status revert logic:
     *   PUBLISHED/APPROVED_L2 → DRAFT (BR-069-03/04)
     *   APPROVED_L1 → DRAFT (BR-069-06)
     *   PENDING_APPROVAL → stays PENDING_APPROVAL (BR-069-05)
     * Skips history logging if no actual changes (BR-069-10).
     * Rejects updates on DELETED entities (BR-069-09).
     */
    @Transactional
    public BeaconLightResponse update(UUID id, UpdateBeaconLightRequest request)

    // ── DELETE (Soft) ──────────────────────────────────

    /**
     * Soft delete: sets status=DELETED, calls softDelete().
     * Rejects if already DELETED (BR-070-02).
     * Rejects if in approval process PENDING_APPROVAL/APPROVED_L1/APPROVED_L2 (BR-070-03).
     * Logs SOFT_DELETE history (BR-070-09).
     * Triggers M-007 point hide via pointObjectSyncService (BR-070-05, BR-070-10).
     */
    @Transactional
    public void delete(UUID id)

    // ── APPROVAL ───────────────────────────────────────

    /**
     * Submit for approval: DRAFT → PENDING_APPROVAL, approvalStatus=PENDING, approvalLevel=1.
     * Sends notification to L1 leader (BR-071-10).
     */
    @Transactional
    public void submitForApproval(UUID id)

    /**
     * Approve at Level 1: PENDING_APPROVAL → APPROVED_L1.
     * Validates entity is PENDING_APPROVAL (BR-071-01).
     * Self-approval prevention: cannot approve own submission (BR-071-09).
     * Sets approvedBy, approvedDate.
     * Sends notification to L2 leader (BR-071-10).
     * Logs APPROVE_L1 history entry.
     */
    @Transactional
    public BeaconLightResponse approveL1(UUID id, String approverId)

    /**
     * Approve at Level 2: APPROVED_L1 → PUBLISHED.
     * Validates entity is APPROVED_L1 (BR-071-02).
     * Sets approvedBy, approvedDate.
     * Syncs to M-007 point_objects (BR-071-04).
     * Logs APPROVE_L2 history entry.
     */
    @Transactional
    public BeaconLightResponse approveL2(UUID id, String approverId)

    /**
     * Reject at any level: status → DRAFT, approvalStatus → REJECTED.
     * rejectReason required, min 10 chars (BR-071-06).
     * Sends notification to creator with rejection reason (BR-071-10).
     * Logs REJECT history entry.
     */
    @Transactional
    public BeaconLightResponse reject(UUID id, String rejectReason, String approverId)

    // ── HELPERS ────────────────────────────────────────

    /** WGS84 coordinate validation */
    private void validateCoordinates(Double longitude, Double latitude)

    /** Maintenance date validation: next ≥ last, last ≤ today */
    private void validateMaintenanceDates(LocalDate last, LocalDate next)

    /** Log a history entry to beacon_history table */
    private void logHistory(BeaconLight entity,
        BeaconHistoryActionType action, String fields, String json)

    /** Entity → DTO conversion */
    private BeaconLightResponse toResponse(BeaconLight entity)

    /** Check if status is in approved state (APPROVED_L1, APPROVED_L2, PUBLISHED) */
    private boolean isApprovedStatus(BeaconStatus status)

    /** Check if status is in approval process (PENDING_APPROVAL, APPROVED_L1, APPROVED_L2) */
    private boolean isInApprovalProcess(BeaconStatus status)

    /** Resolve current authenticated user's unit ID */
    private Long getCurrentUserUnitId()
}
```

### 7.2 BuoyService (parallel structure)

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BuoyService {
    // Same method signatures as BeaconLightService but:
    //   - Uses BuoyRepository instead of BeaconLightRepository
    //   - Injects BeaconLightRepository for cross-type code check
    //   - Buoy-specific field validation (range ≤ 100 nm, inspection dates)
    //   - Buoy-specific entity builder (color, shape instead of lightColor, lightRange)

    public List<BuoyResponse> findAll()
    public BuoyResponse findById(UUID id)
    public List<BuoyResponse> search(String name, String code, BuoyType type, BeaconStatus status)
    @Transactional public BuoyResponse create(CreateBuoyRequest request)
    @Transactional public BuoyResponse update(UUID id, UpdateBuoyRequest request)
    @Transactional public void delete(UUID id)
    @Transactional public void submitForApproval(UUID id)
    @Transactional public BuoyResponse approveL1(UUID id, String approverId)
    @Transactional public BuoyResponse approveL2(UUID id, String approverId)
    @Transactional public BuoyResponse reject(UUID id, String rejectReason, String approverId)

    // Helper methods same pattern as BeaconLightService
    private void validateCoordinates(Double longitude, Double latitude)
    private void validateInspectionDates(LocalDate last, LocalDate next)
    private void logHistory(Buoy entity, BeaconHistoryActionType action, String fields, String json)
    private BuoyResponse toResponse(Buoy entity)
    private boolean isApprovedStatus(BeaconStatus status)
    private boolean isInApprovalProcess(BeaconStatus status)
    private Long getCurrentUserUnitId()
}
```

### 7.3 BeaconHistoryService

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BeaconHistoryService {
    private final BeaconHistoryRepository historyRepo;

    /** Get paginated history for an entity (BR-073/BR-079) */
    public Page<BeaconHistoryResponse> getHistory(
        BeaconType beaconType, UUID entityId, Pageable pageable)

    /** Get filtered history with optional filters */
    public Page<BeaconHistoryResponse> getHistoryFiltered(
        BeaconType beaconType, UUID entityId,
        BeaconHistoryActionType actionType,
        Long changedBy, LocalDateTime from, LocalDateTime to,
        Pageable pageable)

    private BeaconHistoryResponse toResponse(BeaconHistory entity)
}
```

---

## 8. Controller Layer — API Endpoints

### 8.1 BeaconLightController — Full Endpoint Map

| # | Method | Path | Request Body / Params | Response Type | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/beacon-lights` | — | `ApiResponse<List<BeaconLightResponse>>` | 200 | F-072 |
| 2 | GET | `/api/beacon-lights/{id}` | path: id (UUID) | `ApiResponse<BeaconLightResponse>` | 200 | F-072 |
| 3 | GET | `/api/beacon-lights/search` | query: name, code, type, status (all optional) | `ApiResponse<List<BeaconLightResponse>>` | 200 | F-072 |
| 4 | **POST** | `/api/beacon-lights` | `@Valid CreateBeaconLightRequest` | `ApiResponse<BeaconLightResponse>` | **201** | **F-068** |
| 5 | **PUT** | `/api/beacon-lights/{id}` | path: id, body: `@Valid UpdateBeaconLightRequest` | `ApiResponse<BeaconLightResponse>` | 200 | **F-069** |
| 6 | **DELETE** | `/api/beacon-lights/{id}` | path: id | `ApiResponse<Void>` | 200 | **F-070** |
| 7 | POST | `/api/beacon-lights/{id}/submit-approval` | path: id | `ApiResponse<Void>` | 200 | F-071 |
| 8 | POST | `/api/beacon-lights/{id}/approve-l1` | path: id, query: approverId (String) | `ApiResponse<BeaconLightResponse>` | 200 | F-071 |
| 9 | POST | `/api/beacon-lights/{id}/approve-l2` | path: id, query: approverId (String) | `ApiResponse<BeaconLightResponse>` | 200 | F-071 |
| 10 | POST | `/api/beacon-lights/{id}/reject` | path: id, query: rejectReason, approverId | `ApiResponse<BeaconLightResponse>` | 200 | F-071 |

### 8.2 BuoyController — Full Endpoint Map

| # | Method | Path | Request Body / Params | Response Type | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/buoys` | — | `ApiResponse<List<BuoyResponse>>` | 200 | F-078 |
| 2 | GET | `/api/buoys/{id}` | path: id | `ApiResponse<BuoyResponse>` | 200 | F-078 |
| 3 | GET | `/api/buoys/search` | query: name, code, type, status | `ApiResponse<List<BuoyResponse>>` | 200 | F-078 |
| 4 | **POST** | `/api/buoys` | `@Valid CreateBuoyRequest` | `ApiResponse<BuoyResponse>` | **201** | **F-074** |
| 5 | **PUT** | `/api/buoys/{id}` | path: id, body: `@Valid UpdateBuoyRequest` | `ApiResponse<BuoyResponse>` | 200 | **F-075** |
| 6 | **DELETE** | `/api/buoys/{id}` | path: id | `ApiResponse<Void>` | 200 | **F-076** |
| 7 | POST | `/api/buoys/{id}/submit-approval` | path: id | `ApiResponse<Void>` | 200 | F-077 |
| 8 | POST | `/api/buoys/{id}/approve-l1` | path: id, query: approverId | `ApiResponse<BuoyResponse>` | 200 | F-077 |
| 9 | POST | `/api/buoys/{id}/approve-l2` | path: id, query: approverId | `ApiResponse<BuoyResponse>` | 200 | F-077 |
| 10 | POST | `/api/buoys/{id}/reject` | path: id, query: rejectReason, approverId | `ApiResponse<BuoyResponse>` | 200 | F-077 |

### 8.3 BeaconHistoryController — Shared Endpoints

| # | Method | Path | Params | Response Type | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/beacon-history` | type=, entityId=, actionType=?, changedBy=?, from=?, to=?, page=0, size=20 | `ApiResponse<Page<BeaconHistoryResponse>>` | 200 | F-073 / F-079 |

**Pagination defaults**: `page=0` (0-indexed), `size=20`, sorted by `changedAt DESC`.

### 8.4 API Response Envelope Pattern

All endpoints wrap responses in `ApiResponse<T>`:
```json
// Success (200/201)
{ "success": true, "message": "Tạo đèn biển thành công", "data": { ... }, "timestamp": "2026-06-25T10:30:00" }

// Error (400/403/404/409)
{ "success": false, "message": "Mã đèn biển đã tồn tại.", "timestamp": "2026-06-25T10:30:00" }
```

---

## 9. Approval Workflow State Machine

### 9.1 State Transition Diagram

```
          ┌──────────────────────────────────────────────────────────┐
          │                                                          │
          ▼                          submit                          │
  ┌───────┴──────┐    ┌──────────────────┐    ┌───────────────────┐  │
  │     DRAFT    ──→ │ PENDING_APPROVAL │ ──→ │   APPROVED_L1     │  │
  └──────┬───────┘    └────────┬─────────┘    └────────┬──────────┘  │
         │                     │ approve L1              │ approve L2 │
         │                     ▼                         ▼             │
         │              (reject)                (reject)               │
         │                     │                         │             │
         │                     ▼                         ▼             │
         │               ┌───────────┐           ┌───────────┐         │
         │               │    DRAFT  │ ←─────────│    DRAFT  │         │
         │               └───────────┘           └───────────┘         │
         │                     │                         │             │
         │                     └───────────┬─────────────┘             │
         │                                 │ edit (update)             │
         │                                 ▼                           │
         │                       ┌─────────────────┐                   │
         │                       │  PENDING_APPROVAL │                 │
         │                       └───────────────────┘                 │
         │                                                             │
         │                     approve L2                              │
         │                     ▼                                       │
         │              ┌─────────────────┐                           │
         └─────────────│     PUBLISHED    │                           │
                       └────────┬────────┘                           │
                                │ delete                              │
                                ▼                                     │
                       ┌─────────────────┐                           │
                       │      DELETED     │ ←─ hidden via SQLRestriction
                       └─────────────────┘                           │
                                                                       │
                       ┌─────────────────────────────────────────────┐ │
                       │  NOTE: Any approved state + edit → DRAFT   │ │
                       │  PENDING_APPROVAL + edit → stays PENDING    │ │
                       └─────────────────────────────────────────────┘ ┘
```

### 9.2 Transition Rules (from feature briefs)

| Transition | Trigger | Method | Source |
|---|---|---|---|
| DRAFT → PENDING_APPROVAL | `submitForApproval()` | `submitForApproval()` | BR-068-05, BR-074-05 |
| PENDING_APPROVAL → APPROVED_L1 | `approveL1()` | `approveL1(id, approverId)` | BR-071-01, BR-071-03 |
| APPROVED_L1 → PUBLISHED | `approveL2()` | `approveL2(id, approverId)` | BR-071-02, BR-071-04 |
| Any → DRAFT (via reject) | `reject(reason, approverId)` | `reject()` | BR-071-05, BR-077-05 |
| Any approved → DRAFT (via edit) | `update()` called on PUBLISHED/APPROVED_L2/APPROVED_L1 | `update()` | BR-069-03/04/06 |
| PENDING_APPROVAL → stays (via edit) | `update()` on PENDING_APPROVAL | `update()` | BR-069-05 |
| Active → DELETED | `delete()` | `delete()` | BR-070-01 |

### 9.3 Guard Conditions

| Guard | Condition | Error |
|---|---|---|
| Self-approval prevention | `entity.getCreatedBy() != Long.parseLong(approverId)` | 400 "Bạn không thể phê duyệt bản do chính mình gửi" (BR-071-09) |
| Reject reason min length | `rejectReason != null && rejectReason.length() >= 10` | 400 "Lý do từ chối phải có ít nhất 10 ký tự" (BR-071-06) |
| Delete not on approval process | `status != PENDING_APPROVAL && status != APPROVED_L1 && status != APPROVED_L2` | 400 "Không thể xóa đang chờ phê duyệt" (BR-070-03) |
| Delete not on already deleted | `status != DELETED` | 409 "Đã bị xóa trước đó" (BR-070-02) |

---

## 10. Cross-Type Unique Code Validation Strategy

**Problem**: `BeaconLight.code` and `Buoy.code` must be unique across BOTH tables. PostgreSQL UNIQUE constraint cannot span multiple tables.

**Solution — Application-Level Validation**:

```java
// In BeaconLightService.create():
if (beaconLightRepo.existsByCode(request.getCode())
    || buoyRepo.existsByCode(request.getCode())) {
    throw new IllegalArgumentException("Mã đã tồn tại: " + request.getCode());
}

// In BuoyService.create():
if (buoyRepo.existsByCode(request.getCode())
    || beaconLightRepo.existsByCode(request.getCode())) {
    throw new IllegalArgumentException("Mã đã tồn tại: " + request.getCode());
}
```

**Why this works**:
1. Both services inject each other's repository (circular dependency resolved by Spring)
2. The check is fast (single SELECT EXISTS query)
3. The error message is user-friendly (409 Conflict)
4. A database comment documents the business requirement on both `code` columns
5. Follows the M-007 PointObject unique pattern

---

## 11. History Logging Strategy

### 11.1 When to Log

| Action | Entity | History Entry | Source |
|---|---|---|---|
| Create | BeaconLight/Buoy | `actionType=CREATE`, `newValue=full entity JSON` | BR-068-10, BR-074-10 |
| Update (any change) | BeaconLight/Buoy | `actionType=UPDATE`, `changedField=field name`, `previousValue=old`, `newValue=new` | BR-073-02, BR-073-06 |
| Approve L1 | Both | `actionType=APPROVE_L1`, `newValue=APPROVED_L1`, `reason=approverId` | BR-073-03 |
| Approve L2 | Both | `actionType=APPROVE_L2`, `newValue=PUBLISHED`, `reason=approverId` | BR-073-03 |
| Reject | Both | `actionType=REJECT`, `newValue=DRAFT`, `reason=rejectionReason` | BR-073-04 |
| Soft Delete | Both | `actionType=SOFT_DELETE`, `newValue=DELETED` | BR-073-05, BR-070-09 |

### 11.2 Logging Implementation Pattern

```java
private void logHistory(BeaconLight entity,
        BeaconHistoryActionType action, String fields, String json) {
    BeaconHistory entry = BeaconHistory.builder()
        .beaconType(BeaconType.BEACON_LIGHT)
        .entityId(entity.getId())
        .actionType(action)
        .changedField(fields)
        .previousValue(action == BeaconHistoryActionType.UPDATE ? null : null)
        .newValue(json)
        .changedBy(resolveCurrentUserId())
        .changedAt(LocalDateTime.now())
        .reason(action == BeaconHistoryActionType.REJECT ? currentReason : null)
        .build();
    historyRepo.save(entry);
}
```

**Buoy equivalent**: Same pattern, but `beaconType = BeaconType.BUOY` and `entityId = buoy.getId()`.

### 11.3 No-Change Detection for Updates

```java
// In update():
String oldJson = toJson(entity);    // serialize current state
applyUpdates(entity, request);       // apply field changes
entity = beaconLightRepo.save(entity);
String newJson = toJson(entity);
if (!oldJson.equals(newJson)) {
    logHistory(entity, BeaconHistoryActionType.UPDATE,
        getChangedFields(oldJson, newJson), newJson);
}
// BR-069-10: skip log if no changes
```

---

## 12. Code Patterns Reference (from M-007 PointObject)

### 12.1 Entity Pattern

```java
// ✅ FOLLOW:
@Entity
@Table(name = "entity_name")
@SQLRestriction("deleted_at IS NULL")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class MyEntity extends BaseEntity { ... }

// ✅ FOLLOW: @Enumerated(EnumType.STRING) for all enums
// ✅ FOLLOW: @Column with explicit name when DB column differs from Java field
// ✅ FOLLOW: @NotBlank/@NotNull/@Size/@DecimalMin/@DecimalMax for validation
```

### 12.2 Repository Pattern

```java
// ✅ FOLLOW: extends JpaRepository<Entity, UUID>
// ✅ FOLLOW: findByCode, existsByCode, findByNameContainingIgnoreCase
// ✅ FOLLOW: @Query with null-safe filtered search
// ✅ FOLLOW: countByStatus for dashboard stats
```

### 12.3 Service Pattern

```java
// ✅ FOLLOW: @Service, @RequiredArgsConstructor, @Transactional(readOnly = true)
// ✅ FOLLOW: @Transactional on ALL write methods
// ✅ FOLLOW: EntityNotFoundException for missing records
// ✅ FOLLOW: IllegalArgumentException for business rule violations
// ✅ FOLLOW: toResponse() private method for entity→DTO conversion
// ✅ FOLLOW: validateCoordinates() helper method
// ✅ FOLLOW: Constructor injection (no @Autowired fields)
```

### 12.4 Controller Pattern

```java
// ✅ FOLLOW: @RestController, @RequestMapping("/api/..."), @RequiredArgsConstructor
// ✅ FOLLOW: ResponseEntity<ApiResponse<T>> return type
// ✅ FOLLOW: HttpStatus.CREATED for POST create (201)
// ✅ FOLLOW: @Valid @RequestBody for DTO validation
// ✅ FOLLOW: Parallel to PointObjectController structure
```

### 12.5 Response Pattern

```java
// ✅ FOLLOW: ApiResponse.success(data) for 200
// ✅ FOLLOW: ApiResponse.success(message, data) for 200 with custom message
// ✅ FOLLOW: ApiResponse.success("message", null) for 200 with message only
// ✅ FOLLOW: ResponseEntity.status(HttpStatus.CREATED).body(...) for 201
// ❌ DO NOT: return entity directly — always wrap in ApiResponse
```

---

## 13. Integration Points

### 13.1 M-007 PointObject Sync (Outbound — when beacon goes PUBLISHED)

```
Trigger: approveL2() returns PUBLISHED status
Action: Upsert into point_objects table
  - code = entity.code
  - name = entity.name
  - objectType = LIGHTHOUSE (for BeaconLight) or BUOY (for Buoy) or BEACON/BEACON_LIGHT
  - latitude, longitude from entity
  - status = PUBLISHED
  - unitId from entity
  - description from entity (optional)

Reverse: On soft delete or reject → point is NOT deleted, just hidden
  Per BR-070-05: do NOT auto-delete points in M-007
```

### 13.2 M-001 Units (Inbound — unitId validation)

```
Service-level validation only (no DB FK):
  - Validate unit exists via M-001 unit service before saving
  - Resolve unit name for display purposes in response
  - Auto-assign unitId from auth context if null (BR-068-10, BR-074-10)
```

### 13.3 Notification Service (Outbound)

| Trigger | Recipient | Message |
|---|---|---|
| `submitForApproval()` | L1 leader (phòng) of the beacon's unit | "Có đèn biển/phao tiêu mới chờ phê duyệt" |
| `approveL1()` | L2 leader (cục) | "Có đèn biển/phao tiêu đã được L1 duyệt, chờ L2" |
| `reject()` | Creator of the beacon | "Đèn biển/phao tiêu bị từ chối — Lý do: {reason}" |
| `update()` on PUBLISHED | Creator + L1 leader | "Đèn biển/phao tiêu đã quay về trạng thái nháp" |

### 13.4 M-005 Cron/Scheduler (Outbound — maintenance alerts)

```
Schedule: Daily check
Check: next_maintenance_date = today OR next_inspection_date = today
Action: Create notification alert for managing unit
```

---

## 14. Validation Rules Summary

### 14.1 Shared Validation (Both Entities)

| Rule | Method | Range/Constraint | Error Message (VN) | HTTP |
|---|---|---|---|---|
| WGS84 latitude | `validateCoordinates()` | -90.0 ≤ lat ≤ 90.0 | "Tọa độ không hợp lệ. Vui lòng kiểm tra lại vĩ độ." | 400 |
| WGS84 longitude | `validateCoordinates()` | -180.0 ≤ lng ≤ 180.0 | "Tọa độ không hợp lệ. Vui lòng kiểm tra lại kinh độ." | 400 |
| Code uniqueness | `existsByCode()` check | unique across both tables | "Mã đã tồn tại: {code}" | 409 |
| Name not blank | Bean Validation | NOT NULL, max 200 | "Tên không được để trống" | 400 |
| Code not blank | Bean Validation | NOT NULL, max 50 | "Mã không được để trống và tối đa 50 ký tự" | 400 |

### 14.2 BeaconLight-Specific Validation

| Rule | Method | Constraint | Error | HTTP |
|---|---|---|---|---|
| lightRange range | `@DecimalMin("0.01") @DecimalMax("60.0")` | 0.01–60.0 nm | "Phạm vi chiếu sáng phải trong khoảng (0, 60]" | 400 |
| lastMaintenanceDate ≤ today | `validateMaintenanceDates()` | cannot be in future | "Ngày bảo trì gần nhất không được lớn hơn ngày hiện tại" | 400 |
| nextMaintenanceDate ≥ last | `validateMaintenanceDates()` | cannot be before last | "Ngày bảo trì kế tiếp không được nhỏ hơn ngày bảo trì gần nhất" | 400 |
| type immutable after approved | service check in `update()` | if APPROVED_L2/PUBLISHED | "Loại đèn biển không thể thay đổi khi đã được phê duyệt" | 400 |

### 14.3 Buoy-Specific Validation

| Rule | Method | Constraint | Error | HTTP |
|---|---|---|---|---|
| range range | `@DecimalMin("0.01") @DecimalMax("100.0")` | 0.01–100.0 nm | "Phạm vi quan sát phải trong khoảng (0, 100]" | 400 |
| lastInspectionDate ≤ today | `validateInspectionDates()` | cannot be in future | "Ngày kiểm tra gần nhất không được lớn hơn ngày hiện tại" | 400 |
| nextInspectionDate ≥ last | `validateInspectionDates()` | cannot be before last | "Ngày kiểm tra kế tiếp không được nhỏ hơn ngày kiểm tra gần nhất" | 400 |
| type immutable after approved | service check in `update()` | if APPROVED_L2/PUBLISHED | "Loại phao tiêu không thể thay đổi khi đã được phê duyệt" | 400 |

### 14.4 Approval-Specific Validation

| Rule | Check | Error | HTTP |
|---|---|---|---|
| rejectReason min length | `rejectReason.length() >= 10` | "Lý do từ chối phải có ít nhất 10 ký tự" | 400 |
| self-approval prevention | `entity.getCreatedBy() != approverId` | "Bạn không thể phê duyệt bản do chính mình gửi" | 400 |
| L1 guard | `status == PENDING_APPROVAL` | "Không ở trạng thái chờ phê duyệt L1" | 400 |
| L2 guard | `status == APPROVED_L1` | "Không ở trạng thái chờ phê duyệt L2" | 400 |

---

## 15. Error Handling Strategy

All errors are wrapped in `ApiResponse<T>` by a global `@ControllerAdvice`:

| HTTP Status | Exception | Trigger | Example Message |
|---|---|---|---|
| 400 | `IllegalArgumentException` | Validation, business rules | "Mã đã tồn tại: DB-HAUI-001" |
| 400 | `IllegalStateException` | Wrong state transition | "Chỉ có thể gửi phê duyệt khi status = DRAFT" |
| 403 | Security exception | Wrong role/unit | "Bạn không có quyền phê duyệt cấp L1" |
| 404 | `EntityNotFoundException` | Record not found | "Đèn biển không tìm thấy: abc-123" |
| 409 | `IllegalArgumentException` | Duplicate code, already deleted | "Đèn biển này đã bị xóa trước đó" |
| 500 | `RuntimeException` | Unexpected errors | "Hệ thống đang xảy ra sự cố" |

---

## 16. Permission Matrix

| Operation | Required Role | Unit Scope | Endpoint |
|---|---|---|---|
| Create | admin / system-admin | Own unit (auto-assigned) | POST /api/beacon-lights, POST /api/buoys |
| Update | admin / system-admin | Own unit | PUT /api/beacon-lights/{id}, PUT /api/buoys/{id} |
| Delete | admin / system-admin | Own unit | DELETE /api/beacon-lights/{id}, DELETE /api/buoys/{id} |
| Approve L1 | leader (L1) | Own unit | POST .../approve-l1 |
| Approve L2 | leader (L2) | All units | POST .../approve-l2 |
| Submit | admin / system-admin | Own unit | POST .../submit-approval |
| View (basic) | user (doanh nghiệp cảng) | PUBLISHED only | GET /api/beacon-lights/{id} |
| View (full) | admin / leader | Own unit or all if system-admin | All GET endpoints |
| History | admin / leader | Own unit | GET /api/beacon-history |

**Implementation note**: Use Spring Security `@PreAuthorize` annotations or interceptor-based unit scope checks.

---

## 17. Wave-by-Wave Task Breakdown

### Wave 1: Entities + Repositories (Foundation)

**Goal**: Define all entities, enums, and JPA repositories. No business logic yet.

| Task | File | Description |
|---|---|---|
| W1-T1 | `entity/BeaconLightType.java` | Enum: LIGHTHOUSE, BEACON_LIGHT, BEACON_MARK |
| W1-T2 | `entity/BuoyType.java` | Enum: CARDINAL, SECTOR, SPECIAL, SAFE_WATER, ISOLATED_DANGER |
| W1-T3 | `entity/BeaconStatus.java` | Enum: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED |
| W1-T4 | `entity/BeaconApprovalStatus.java` | Enum: PENDING, APPROVED, REJECTED |
| W1-T5 | `entity/BeaconHistoryActionType.java` | Enum: CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE |
| W1-T6 | `entity/BeaconType.java` | Enum: BEACON_LIGHT, BUOY (discriminator) |
| W1-T7 | `entity/BeaconLight.java` | Entity extending BaseEntity, all fields from §4.2, `@SQLRestriction("deleted_at IS NULL")` |
| W1-T8 | `entity/Buoy.java` | Entity extending BaseEntity, all fields from §4.3, `@SQLRestriction("deleted_at IS NULL")` |
| W1-T9 | `entity/BeaconHistory.java` | Standalone entity (NO BaseEntity), all fields from §4.4 |
| W1-T10 | `repository/BeaconLightRepository.java` | All methods from §5.1 |
| W1-T11 | `repository/BuoyRepository.java` | All methods from §5.2 |
| W1-T12 | `repository/BeaconHistoryRepository.java` | All methods from §5.3 |
| W1-T13 | `application.properties` | Add `ddl-auto=validate` for production; Flyway migration for `beacon_light`, `buoy`, `beacon_history` tables |

**DDL**: Copy SQL from §3 into Flyway migration `V1__create_beacon_tables.sql`.

**Acceptance**: Run `./mvnw test` — Spring context loads without errors. All entity classes compile.

---

### Wave 2: BeaconLight — DTOs + Services + Controllers

**Goal**: Full CRUD + approval workflow for BeaconLight.

| Task | File | Description |
|---|---|---|
| W2-T1 | `dto/beacon-light/CreateBeaconLightRequest.java` | DTO from §6.1 |
| W2-T2 | `dto/beacon-light/UpdateBeaconLightRequest.java` | DTO from §6.1 |
| W2-T3 | `dto/beacon-light/BeaconLightResponse.java` | DTO from §6.1 |
| W2-T4 | `service/BeaconLightService.java` | READ methods (findAll, findById, search) + CREATE with cross-type validation (W2-T5) |
| W2-T5 | `service/BeaconLightService.java` | CREATE: cross-type unique code check, coordinates validation, lightRange validation, maintenance date validation, unitId auto-assign, action="submit" → PENDING_APPROVAL, log CREATE history |
| W2-T6 | `service/BeaconLightService.java` | UPDATE: status revert logic (PUBLISHED→DRAFT, APPROVED_L1→DRAFT, PENDING→PENDING), no-change detection, DELETED rejection |
| W2-T7 | `service/BeaconLightService.java` | DELETE: soft delete, DELETED rejection, approval process rejection, log SOFT_DELETE, trigger M-007 hide |
| W2-T8 | `service/BeaconLightService.java` | APPROVAL: submitForApproval, approveL1 (self-approval check), approveL2 (M-007 sync), reject (min 10 chars reason) |
| W2-T9 | `service/BeaconLightService.java` | Helper methods: validateCoordinates, validateMaintenanceDates, logHistory, toResponse, isApprovedStatus, isInApprovalProcess, getCurrentUserUnitId |
| W2-T10 | `controller/BeaconLightController.java` | All 10 endpoints from §8.1, using `@Valid`, `ResponseEntity<ApiResponse<T>>` |
| W2-T11 | `dto/history/BeaconHistoryResponse.java` | History DTO (shared, used by Wave 4) |
| W2-T12 | `dto/history/BeaconHistoryQuery.java` | History query DTO (shared, used by Wave 4) |

**Acceptance**: Unit tests for all service methods. Integration tests for CRUD + approval workflow.

---

### Wave 3: Buoy — DTOs + Services + Controllers

**Goal**: Full CRUD + approval workflow for Buoy (mirror of Wave 2).

| Task | File | Description |
|---|---|---|
| W3-T1 | `dto/buoy/CreateBuoyRequest.java` | DTO from §6.2 |
| W3-T2 | `dto/buoy/UpdateBuoyRequest.java` | DTO from §6.2 |
| W3-T3 | `dto/buoy/BuoyResponse.java` | DTO from §6.2 |
| W3-T4 | `service/BuoyService.java` | READ methods (findAll, findById, search) |
| W3-T5 | `service/BuoyService.java` | CREATE: cross-type unique code check, coordinates validation, range validation, inspection date validation, unitId auto-assign, action="submit" → PENDING_APPROVAL, log CREATE history |
| W3-T6 | `service/BuoyService.java` | UPDATE: status revert logic (same rules as BeaconLight), no-change detection |
| W3-T7 | `service/BuoyService.java` | DELETE: soft delete, same guards as BeaconLight |
| W3-T8 | `service/BuoyService.java` | APPROVAL: submitForApproval, approveL1, approveL2 (M-007 sync), reject |
| W3-T9 | `service/BuoyService.java` | Helper methods: validateCoordinates, validateInspectionDates, logHistory, toResponse |
| W3-T10 | `controller/BuoyController.java` | All 10 endpoints from §8.2 |

**Acceptance**: Same pattern as Wave 2. All BUOY acceptance criteria (F-074 to F-077) verified.

---

### Wave 4: History + Approval Endpoints + Shared Service

**Goal**: BeaconHistory service + controller + shared approval notification integration.

| Task | File | Description |
|---|---|---|
| W4-T1 | `service/BeaconHistoryService.java` | getHistory (paginated), getHistoryFiltered (with actionType, changedBy, date range) |
| W4-T2 | `controller/BeaconHistoryController.java` | GET /api/beacon-history with all query params from §8.3 |
| W4-T3 | `service/BeaconLightService.java` | Enhance logHistory to capture changed fields, previous/new values, and diffData as JSONB |
| W4-T4 | `service/BuoyService.java` | Same history logging enhancement as W4-T3 |
| W4-T5 | `service/NotificationService.java` | Stub/skeleton (interface or integration with existing notification service): sendApprovalNotification, sendL2Notification, sendRejectionNotification |
| W4-T6 | `service/PointObjectSyncService.java` | Stub/skeleton: syncToMap(entity) — upsert into point_objects when PUBLISHED; hideFromMap(entity) on soft delete |
| W4-T7 | Wave 2+3: Wire up `notificationService` and `pointObjectSyncService` in BeaconLightService and BuoyService |

**Acceptance**: History entries created on every action. Filtered queries work. Notification and M-007 sync methods called at correct triggers.

---

### Wave 5: Tests

**Goal**: Comprehensive test coverage for all 12 features.

| Task | Scope | Description |
|---|---|---|
| W5-T1 | Unit — `BeaconLightServiceTest` | State machine: DRAFT→PENDING→L1→L2→PUBLISHED; reject at L1/L2; update revert logic |
| W5-T2 | Unit — `BeaconLightServiceTest` | Validation: coordinates, lightRange, maintenance dates, cross-type unique code, self-approval |
| W5-T3 | Unit — `BuoyServiceTest` | Same as W5-T1/W5-T2 for Buoy |
| W5-T4 | Unit — `BeaconHistoryServiceTest` | Pagination, filtering by actionType, date range, changedBy |
| W5-T5 | Integration — `BeaconLightControllerTest` | Full request/response for all 10 endpoints with `@SpringBootTest` + H2 |
| W5-T6 | Integration — `BuoyControllerTest` | Same for Buoy endpoints |
| W5-T7 | Integration — History + Approval E2E | DRAFT→submit→approveL1→approveL2→PUBLISHED flow with history entries verified |
| W5-T8 | Integration — Cross-Type Unique | Create BeaconLight, then try to create Buoy with same code → 409 |
| W5-T9 | Integration — Soft Delete + SQLRestriction | Delete beacon, then findAll → not in results; delete again → 409 |
| W5-T10 | Integration — Permission Checks | Role-based endpoint access (admin vs user vs leader) |
| W5-T11 | Integration — No-Change Detection | Update beacon with same values → no new history entry |
| W5-T12 | Integration — History Filtering | Filter by actionType, date range, changedBy, verify counts |

**Acceptance**: All 12 features' acceptance criteria (AC-1 through AC-10 each) covered by at least one test.

---

## 18. Flyway Migration Files

### V1__create_beacon_tables.sql

```sql
-- beacon_light table
CREATE TABLE IF NOT EXISTS beacon_light (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(50)  NOT NULL,
    name                    VARCHAR(200) NOT NULL,
    type                    VARCHAR(30)  NOT NULL,
    latitude                DOUBLE PRECISION NOT NULL,
    longitude               DOUBLE PRECISION NOT NULL,
    light_range             DOUBLE PRECISION NOT NULL,
    light_color             VARCHAR(50),
    light_characteristic    VARCHAR(100),
    range                   DOUBLE PRECISION,
    description             VARCHAR(1000),
    unit_id                 BIGINT,
    last_maintenance_date   DATE,
    next_maintenance_date   DATE,
    is_active               BOOLEAN DEFAULT true,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_level          INTEGER,
    approved_by             BIGINT,
    approved_date           TIMESTAMP,
    rejection_reason        VARCHAR(500),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMP
);

CREATE INDEX idx_beacon_light_status ON beacon_light(status);
CREATE INDEX idx_beacon_light_code ON beacon_light(code);
CREATE INDEX idx_beacon_light_unit ON beacon_light(unit_id);
CREATE INDEX idx_beacon_light_type ON beacon_light(type);
COMMENT ON TABLE beacon_light IS 'Nautical beacon light equipment';
COMMENT ON COLUMN beacon_light.code IS 'Unique across both beacon_light and buoy (app-level)';

-- buoy table
CREATE TABLE IF NOT EXISTS buoy (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(50)  NOT NULL,
    name                    VARCHAR(200) NOT NULL,
    type                    VARCHAR(30)  NOT NULL,
    latitude                DOUBLE PRECISION NOT NULL,
    longitude               DOUBLE PRECISION NOT NULL,
    color                   VARCHAR(50),
    shape                   VARCHAR(50),
    light_characteristic    VARCHAR(100),
    range                   DOUBLE PRECISION NOT NULL,
    description             VARCHAR(1000),
    unit_id                 BIGINT,
    last_inspection_date    DATE,
    next_inspection_date    DATE,
    is_active               BOOLEAN DEFAULT true,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_level          INTEGER,
    approved_by             BIGINT,
    approved_date           TIMESTAMP,
    rejection_reason        VARCHAR(500),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMP
);

CREATE INDEX idx_buoy_status ON buoy(status);
CREATE INDEX idx_buoy_code ON buoy(code);
CREATE INDEX idx_buoy_unit ON buoy(unit_id);
CREATE INDEX idx_buoy_type ON buoy(type);
COMMENT ON TABLE buoy IS 'Nautical buoy equipment';
COMMENT ON COLUMN buoy.code IS 'Unique across both beacon_light and buoy (app-level)';

-- beacon_history table
CREATE TABLE IF NOT EXISTS beacon_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beacon_type     VARCHAR(10) NOT NULL,
    entity_id       UUID NOT NULL,
    action_type     VARCHAR(20) NOT NULL,
    changed_field   VARCHAR(100),
    previous_value  TEXT,
    new_value       TEXT,
    changed_by      BIGINT NOT NULL,
    changed_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    reason          VARCHAR(500),
    diff_data       JSONB
);

CREATE INDEX idx_beacon_history_entity ON beacon_history(entity_id, beacon_type);
CREATE INDEX idx_beacon_history_changed_at ON beacon_history(changed_at DESC);
CREATE INDEX idx_beacon_history_action ON beacon_history(action_type);
COMMENT ON TABLE beacon_history IS 'Shared audit trail for beacon_light and buoy';
```

---

## 19. Circular Dependency Resolution

`BeaconLightService` needs `BuoyRepository` (cross-type code check) and `BuoyService` needs `BeaconLightRepository`. Spring resolves this automatically with constructor injection — no special configuration needed. However, avoid injecting the *other service* into the service itself to prevent infinite recursion.

```java
// ✅ CORRECT: inject repositories
private final BeaconLightRepository beaconLightRepo;
private final BuoyRepository buoyRepo;

// ❌ WRONG: inject the other service
private final BuoyService buoyService;  // avoid
```

---

## 20. Feature-to-Implementation Mapping

| Feature ID | Feature Name | Wave | Controller | Service Method |
|---|---|---|---|---|
| F-068 | BeaconLight Create | W2 | `BeaconLightController.create()` | `BeaconLightService.create()` |
| F-069 | BeaconLight Update | W2 | `BeaconLightController.update()` | `BeaconLightService.update()` |
| F-070 | BeaconLight Delete | W2 | `BeaconLightController.delete()` | `BeaconLightService.delete()` |
| F-071 | BeaconLight Approval | W2 | `BeaconLightController.approveL1/L2/reject/submit` | `BeaconLightService.approveL1/L2/reject/submitForApproval` |
| F-072 | BeaconLight Detail | W2 | `BeaconLightController.findById/search` | `BeaconLightService.findById/search` |
| F-073 | BeaconLight History | W4 | `BeaconHistoryController.getHistory()` | `BeaconHistoryService.getHistoryFiltered()` |
| F-074 | Buoy Create | W3 | `BuoyController.create()` | `BuoyService.create()` |
| F-075 | Buoy Update | W3 | `BuoyController.update()` | `BuoyService.update()` |
| F-076 | Buoy Delete | W3 | `BuoyController.delete()` | `BuoyService.delete()` |
| F-077 | Buoy Approval | W3 | `BuoyController.approveL1/L2/reject/submit` | `BuoyService.approveL1/L2/reject/submitForApproval` |
| F-078 | Buoy Detail | W3 | `BuoyController.findById/search` | `BuoyService.findById/search` |
| F-079 | Buoy History | W4 | `BeaconHistoryController.getHistory()` | `BeaconHistoryService.getHistoryFiltered()` |

---

## 21. Open Items / Risks

| # | Item | Decision | Owner |
|---|---|---|---|
| R1 | Cross-type unique constraint DB enforcement | App-level only; consider pg function in Wave 2+ | Tech-Lead |
| R2 | BeaconHistory does NOT extend BaseEntity | Verified safe — separate entity, no SQLRestriction | SA |
| R3 | GIS PointObject sync: upsert or delete? | Upsert on PUBLISH, hide on delete (per BR-070-05) | SA |
| R4 | Unit reference validation | Service-level lookup to M-001, no DB FK | SA |
| R5 | diffData JSONB — PostgreSQL only | PostgreSQL-only; mark as optional in code | SA |
| R6 | Approval level tracking (single approvedBy vs separate L1/L2 approvers) | Single field for now; consider adding `level1Approver`/`level2Approver` in Wave 2+ if feature briefs require | Tech-Lead |

---

## 22. Quick Reference — Entity Field Comparison

| Field | BeaconLight | Buoy | Shared |
|---|---|---|---|
| code | ✅ | ✅ | Cross-type unique |
| name | ✅ | ✅ | — |
| type | BeaconLightType (3 values) | BuoyType (5 values) | — |
| latitude | ✅ | ✅ | WGS84 -90~90 |
| longitude | ✅ | ✅ | WGS84 -180~180 |
| lightRange | ✅ (required, 0.01-60) | — | BeaconLight only |
| lightColor | ✅ | — | BeaconLight only |
| lightCharacteristic | ✅ | ✅ | Both |
| color | — | ✅ | Buoy only |
| shape | — | ✅ | Buoy only |
| range | ✅ (optional, 0.01-100) | ✅ (required, 0.01-100) | Both |
| description | ✅ | ✅ | — |
| unitId | ✅ | ✅ | M-001 reference |
| lastMaintenanceDate | ✅ | — | BeaconLight only |
| nextMaintenanceDate | ✅ | — | BeaconLight only |
| lastInspectionDate | — | ✅ | Buoy only |
| nextInspectionDate | — | ✅ | Buoy only |
| isActive | ✅ | ✅ | Default true |
| status | ✅ | ✅ | Shared enum |
| approvalStatus | ✅ | ✅ | Shared enum |
| approvalLevel | ✅ | ✅ | 1 or 2 |
| approvedBy | ✅ | ✅ | User ID |
| approvedDate | ✅ | ✅ | Timestamp |
| rejectionReason | ✅ | ✅ | Min 10 chars |
| inherited BaseEntity fields | ✅ | ✅ | id, createdAt, updatedAt, deletedAt |

---

*End of Tech-Spec for M-013 — Quản lý Báo hiệu Hàng hải*
