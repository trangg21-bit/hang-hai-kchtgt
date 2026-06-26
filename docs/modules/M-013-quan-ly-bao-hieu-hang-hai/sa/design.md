# System Architecture Design: Quản lý Báo hiệu Hàng hải (M-013)

> **Document type**: System Architecture (SA) — engineering-system-architect stage
> **Module**: M-013 — Quản lý Báo hiệu Hàng hải
> **Stage**: SA (engineering-system-architect)
> **Date**: 2026-06-25
> **Status**: DRAFT — awaiting review

---

## 1. Overview

### 1.1 Business Goal

Provide a standardized system to manage nautical beacon equipment — both **BeaconLight** (đèn biển: lighthouse, beacon light, beacon mark) and **Buoy** (phao tiêu: cardinal, sector, special, safe water, isolated danger) — including CRUD operations, 2-level approval workflow (Level 1 = phòng, Level 2 = cục), soft delete, audit trail, and GIS integration via M-007 PointObject sync.

### 1.2 Scope

| Category | In Scope | Out of Scope |
|---|---|---|
| Entity types | BeaconLight, Buoy, BeaconHistory (shared) | Hard delete, batch operations |
| Operations | Create, Update, Delete (soft), Approve L1/L2, Reject, View Detail, History/Audit | Auto-approve, bulk approve, digital signature |
| Approval | 2-level workflow: DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED | Auto-escalation, auto-reject |
| Integrations | M-007 (PointObject sync), M-001 (Units), Notification Service | Real-time GPS, Excel import |

### 1.3 Feature Mapping

| Feature | ID | Description | Primary Entity |
|---|---|---|---|
| Tạo mới đèn biển | F-068 | Create BeaconLight with validation | BeaconLight |
| Cập nhật đèn biển | F-069 | Update BeaconLight, status revert logic | BeaconLight |
| Xóa đèn biển | F-070 | Soft delete BeaconLight | BeaconLight |
| Phê duyệt đèn biển | F-071 | 2-level approval workflow | BeaconLight |
| Xem chi tiết đèn biển | F-072 | Detail view with permission-based fields | BeaconLight |
| Lịch sử đèn biển | F-073 | Audit trail for BeaconLight | BeaconHistory |
| Tạo mới phao tiêu | F-074 | Create Buoy with validation | Buoy |
| Cập nhật phao tiêu | F-075 | Update Buoy, status revert logic | Buoy |
| Xóa phao tiêu | F-076 | Soft delete Buoy | Buoy |
| Phê duyệt phao tiêu | F-077 | 2-level approval workflow | Buoy |
| Xem chi tiết phao tiêu | F-078 | Detail view with permission-based fields | Buoy |
| Lịch sử phao tiêu | F-079 | Audit trail for Buoy | BeaconHistory |

---

## 2. Package Structure

```
com.hanghai.kchtg.beacon                          ← Bounded context
├── entity/
│   ├── BeaconLight.java                           ← Đèn biển entity
│   ├── Buoy.java                                  ← Phao tiêu entity
│   └── BeaconHistory.java                         ← Shared audit trail entity
├── repository/
│   ├── BeaconLightRepository.java                 ← BeaconLight JPA repository
│   ├── BuoyRepository.java                        ← Buoy JPA repository
│   └── BeaconHistoryRepository.java               ← BeaconHistory JPA repository
├── service/
│   ├── BeaconLightService.java                    ← BeaconLight business logic
│   ├── BuoyService.java                           ← Buoy business logic
│   └── BeaconHistoryService.java                  ← Shared history operations
├── controller/
│   ├── BeaconLightController.java                 ← BeaconLight REST endpoints
│   ├── BuoyController.java                        ← Buoy REST endpoints
│   └── BeaconHistoryController.java               ← Shared history endpoints
└── dto/
    ├── BeaconLight/
    │   ├── CreateBeaconLightRequest.java
    │   ├── UpdateBeaconLightRequest.java
    │   └── BeaconLightResponse.java
    ├── Buoy/
    │   ├── CreateBuoyRequest.java
    │   ├── UpdateBuoyRequest.java
    │   └── BuoyResponse.java
    └── BeaconHistory/
        ├── BeaconHistoryResponse.java
        └── BeaconHistoryQuery.java
```

**Rationale**: Mirrors M-007 `gis.point` package structure (entity/repository/service/controller/dto). The `beacon` package is a self-contained bounded context within `kchtg`.

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│  beacon_light    │       │      buoy        │
├──────────────────┤       ├──────────────────┤
│ id (UUID) PK     │       │ id (UUID) PK     │
│ code (Varchar50) │       │ code (Varchar50) │
│ name (Varchar200)│       │ name (Varchar200)│
│ type (Varchar30) │       │ type (Varchar30) │
│ latitude (Double)│       │ latitude (Double)│
│ longitude (Double)│      │ longitude (Double)│
│ lightRange (Double)│     │ color (Varchar50)|
│ lightColor (Varchar50)│  │ shape (Varchar50)│
│ lightCharacteristic│     │ lightCharacter...│
│ range (Double)   │       │ range (Double)   │
│ description      │       │ description      │
│ unitId (BigInt)  │       │ unitId (BigInt)  │
│ lastMaintenance  │       │ lastInspectDate  │
│ nextMaintenance  │       │ nextInspectDate  │
│ isActive (Bool)  │       │ isActive (Bool)  │
│ status (Varchar20)│      │ status (Varchar20)│
│ approvalStatus(Varchar20)││ approvalStatus..│
│ approvalLevel(Int) │     │ approvalLevel... │
│ approvedBy(BigInt)│      │ approvedBy...   │
│ approvedDate     │       │ approvedDate     │
│ rejectionReason  │       │ rejectionReason  │
│ createdAt        │       │ createdAt        │
│ updatedAt        │       │ updatedAt        │
│ deletedAt        │       │ deletedAt        │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │                          │
         └────── FK ────────────────┘
                        │
         ┌──────────────┴──────────┐
         │   beacon_history        │
         ├─────────────────────────┤
         │ id (UUID) PK            │
         │ beaconType (Varchar10)  │ ← "BEACON_LIGHT" or "BUOY"
         │ entityId (UUID) FK      │ → beacon_light.id OR buoy.id
         │ actionType (Varchar20)  │
         │ changedField (Varchar100)│
         │ previousValue (Text)    │
         │ newValue (Text)         │
         │ changedBy (BigInt)      │
         │ changedAt               │
         │ reason (Varchar500)     │
         │ diffData (JSONB)        │
         └─────────────────────────┘
```

### 3.2 Table: `beacon_light`

| Column | Type | Constraints | Validation | Description |
|---|---|---|---|---|
| `id` | UUID | PK, NOT NULL, `GEN_RANDOM_UUID()` | — | Primary key (Hibernate UUID strategy) |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE (cross-type) | max 50 chars, no special chars `< > & "` | Beacon identifier (e.g. `DB-HAUI-001`) |
| `name` | VARCHAR(200) | NOT NULL | max 200 chars | Display name |
| `type` | VARCHAR(30) | NOT NULL | LIGHTHOUSE / BEACON_LIGHT / BEACON_MARK | Beacon category |
| `latitude` | DOUBLE PRECISION | NOT NULL | -90.0 ≤ lat ≤ 90.0 (WGS84) | Latitude coordinate |
| `longitude` | DOUBLE PRECISION | NOT NULL | -180.0 ≤ lng ≤ 180.0 (WGS84) | Longitude coordinate |
| `light_range` | DOUBLE PRECISION | NOT NULL | 0.0 < lightRange ≤ 60.0 | Nautical miles light range |
| `light_color` | VARCHAR(50) | nullable | RED / WHITE / GREEN / YELLOW | Light color |
| `light_characteristic` | VARCHAR(100) | nullable | FL, Iso, Q, VQ, Oc, F, Fl(2), etc. | Light characteristic pattern |
| `range` | DOUBLE PRECISION | nullable | 0.0 < range ≤ 100.0 | Observation range (nautical miles) |
| `description` | VARCHAR(1000) | nullable | max 1000 chars | Additional info |
| `unit_id` | BIGINT | nullable | FK → units (M-001) | Managing unit |
| `last_maintenance_date` | DATE | nullable | ≤ today | Last maintenance date |
| `next_maintenance_date` | DATE | nullable | ≥ last_maintenance_date | Next maintenance date |
| `is_active` | BOOLEAN | DEFAULT true | — | Operating status |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'DRAFT' | See §3.3 | Lifecycle status |
| `approval_status` | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | See §3.4 | Approval state |
| `approval_level` | INTEGER | nullable | 1 or 2 | Current approval level |
| `approved_by` | BIGINT | nullable | — | Approver user ID |
| `approved_date` | TIMESTAMP | nullable | — | Approval timestamp |
| `rejection_reason` | VARCHAR(500) | nullable | min 10 chars when set | Rejection reason |
| `created_at` | TIMESTAMP | NOT NULL, auto | — | Audit (from BaseEntity) |
| `updated_at` | TIMESTAMP | NOT NULL, auto | — | Audit (from BaseEntity) |
| `deleted_at` | TIMESTAMP | nullable, soft delete | — | Soft delete (from BaseEntity) |

### 3.3 Table: `buoy`

| Column | Type | Constraints | Validation | Description |
|---|---|---|---|---|
| `id` | UUID | PK, NOT NULL, `GEN_RANDOM_UUID()` | — | Primary key |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE (cross-type) | max 50 chars | Buoy identifier (e.g. `PT-HAUI-001`) |
| `name` | VARCHAR(200) | NOT NULL | max 200 chars | Display name |
| `type` | VARCHAR(30) | NOT NULL | CARDINAL / SECTOR / SPECIAL / SAFE_WATER / ISOLATED_DANGER | Buoy category |
| `latitude` | DOUBLE PRECISION | NOT NULL | -90.0 ≤ lat ≤ 90.0 (WGS84) | Latitude |
| `longitude` | DOUBLE PRECISION | NOT NULL | -180.0 ≤ lng ≤ 180.0 (WGS84) | Longitude |
| `color` | VARCHAR(50) | nullable | RED / GREEN / BLACK+RED / WHITE / YELLOW / ORANGE | Buoy color |
| `shape` | VARCHAR(50) | nullable | CAN / CONE / SPAR / BELL / BUCKET / TUBULAR | Buoy shape |
| `light_characteristic` | VARCHAR(100) | nullable | FL, Iso, Q, VQ, Oc, F, Fl(2), etc. | Light characteristic (if equipped) |
| `range` | DOUBLE PRECISION | NOT NULL | 0.0 < range ≤ 100.0 | Observation range (nautical miles) |
| `description` | VARCHAR(1000) | nullable | max 1000 chars | Additional info |
| `unit_id` | BIGINT | nullable | FK → units (M-001) | Managing unit |
| `last_inspection_date` | DATE | nullable | ≤ today | Last inspection date |
| `next_inspection_date` | DATE | nullable | ≥ last_inspection_date | Next inspection date |
| `is_active` | BOOLEAN | DEFAULT true | — | Operating status |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'DRAFT' | See §3.3 | Lifecycle status |
| `approval_status` | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | See §3.4 | Approval state |
| `approval_level` | INTEGER | nullable | 1 or 2 | Current approval level |
| `approved_by` | BIGINT | nullable | — | Approver user ID |
| `approved_date` | TIMESTAMP | nullable | — | Approval timestamp |
| `rejection_reason` | VARCHAR(500) | nullable | min 10 chars when set | Rejection reason |
| `created_at` | TIMESTAMP | NOT NULL, auto | — | Audit (from BaseEntity) |
| `updated_at` | TIMESTAMP | NOT NULL, auto | — | Audit (from BaseEntity) |
| `deleted_at` | TIMESTAMP | nullable, soft delete | — | Soft delete (from BaseEntity) |

### 3.4 Table: `beacon_history`

| Column | Type | Constraints | Validation | Description |
|---|---|---|---|---|
| `id` | UUID | PK, NOT NULL, `GEN_RANDOM_UUID()` | — | Primary key |
| `beacon_type` | VARCHAR(10) | NOT NULL | BEACON_LIGHT / BUOY | Entity type discriminator |
| `entity_id` | UUID | NOT NULL, FK | → beacon_light.id OR buoy.id | Reference entity |
| `action_type` | VARCHAR(20) | NOT NULL | See §3.5 | Action performed |
| `changed_field` | VARCHAR(100) | nullable | — | Field that changed |
| `previous_value` | TEXT | nullable | — | Value before change |
| `new_value` | TEXT | nullable | — | Value after change |
| `changed_by` | BIGINT | NOT NULL | — | User ID who made the change |
| `changed_at` | TIMESTAMP | NOT NULL, auto | — | Change timestamp |
| `reason` | VARCHAR(500) | nullable | — | Optional reason |
| `diff_data` | JSONB | nullable | — | Full diff object (PostgreSQL) |

### 3.5 Status Enumerations

#### BeaconStatus (Lifecycle)

```java
public enum BeaconStatus {
    DRAFT,            // Nháp — newly created, not submitted
    PENDING_APPROVAL, // Chờ phê duyệt — submitted for L1 approval
    APPROVED_L1,      // Đã phê duyệt L1 — approved by phòng
    APPROVED_L2,      // Đã phê duyệt L2 — approved by cục
    PUBLISHED,        // Đã công bố — visible on map, public
    REJECTED,         // Bị từ chối — rejected, needs correction
    DELETED           // Đã xóa — soft deleted
}
```

#### BeaconApprovalStatus

```java
public enum BeaconApprovalStatus {
    PENDING,   // Chờ phê duyệt
    APPROVED,  // Đã phê duyệt
    REJECTED   // Bị từ chối
}
```

#### BeaconHistoryActionType

```java
public enum BeaconHistoryActionType {
    CREATE,       // Bản ghi được tạo
    UPDATE,       // Trường dữ liệu được sửa đổi
    APPROVE_L1,   // Phê duyệt L1
    APPROVE_L2,   // Phê duyệt L2
    REJECT,       // Từ chối (cấp nào cũng ghi REJECT)
    SOFT_DELETE   // Xóa mềm
}
```

#### BeaconType (discriminator for history)

```java
public enum BeaconType {
    BEACON_LIGHT,  // Đèn biển
    BUOY           // Phao tiêu
}
```

### 3.6 Cross-Type Unique Constraint on `code`

Because `BeaconLight.code` and `Buoy.code` must be unique across BOTH tables (no duplicate code between lights and buoys), we implement this using **application-level validation**:

```java
// In both BeaconLightService.create() and BuoyService.create():
if (beaconLightRepo.existsByCode(request.getCode())
    || buoyRepo.existsByCode(request.getCode())) {
    throw new IllegalArgumentException("Mã đã tồn tại: " + request.getCode());
}
```

This matches the cross-type unique pattern described in all create feature briefs (BR-068-01, BR-074-01). A database comment documents the business requirement.

### 3.7 SQL Restriction (Soft Delete Filter)

Both entities inherit `@SQLRestriction("deleted_at IS NULL")` from `BaseEntity`, so all JPA queries automatically exclude soft-deleted records. This matches the M-007 PointObject pattern.

---

## 4. Java Entity Classes

### 4.1 BeaconLight Entity

```java
package com.hanghai.kchtg.beacon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "beacon_light")
@SQLRestriction("deleted_at IS NULL")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class BeaconLight extends BaseEntity {

    @NotBlank(message = "Mã đèn biển không được để trống")
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Tên đèn biển không được để trống")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BeaconLightType type;

    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    @Column(nullable = false)
    private Double latitude;

    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    @Column(nullable = false)
    private Double longitude;

    @NotNull @DecimalMin("0.01") @DecimalMax("60.0")
    @Column(name = "light_range", nullable = false)
    private Double lightRange;

    @Size(max = 50)
    @Column(length = 50)
    private String lightColor;

    @Size(max = 100)
    @Column(name = "light_characteristic", length = 100)
    private String lightCharacteristic;

    @DecimalMin("0.01") @DecimalMax("100.0")
    private Double range;

    @Size(max = 1000)
    private String description;

    @Column(name = "unit_id")
    private Long unitId;

    @Column(name = "last_maintenance_date")
    private LocalDate lastMaintenanceDate;

    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BeaconStatus status = BeaconStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    @Builder.Default
    private BeaconApprovalStatus approvalStatus = BeaconApprovalStatus.PENDING;

    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
}
```

### 4.2 Buoy Entity

```java
package com.hanghai.kchtg.beacon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "buoy")
@SQLRestriction("deleted_at IS NULL")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Buoy extends BaseEntity {

    @NotBlank(message = "Mã phao tiêu không được để trống")
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Tên phao tiêu không được để trống")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BuoyType type;

    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    @Column(nullable = false)
    private Double latitude;

    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    @Column(nullable = false)
    private Double longitude;

    @Size(max = 50)
    private String color;

    @Size(max = 50)
    private String shape;

    @Size(max = 100)
    @Column(name = "light_characteristic", length = 100)
    private String lightCharacteristic;

    @NotNull @DecimalMin("0.01") @DecimalMax("100.0")
    private Double range;

    @Size(max = 1000)
    private String description;

    @Column(name = "unit_id")
    private Long unitId;

    @Column(name = "last_inspection_date")
    private LocalDate lastInspectionDate;

    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BeaconStatus status = BeaconStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    @Builder.Default
    private BeaconApprovalStatus approvalStatus = BeaconApprovalStatus.PENDING;

    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
}
```

### 4.3 BeaconHistory Entity (Shared)

```java
package com.hanghai.kchtg.beacon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "beacon_history")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class BeaconHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, length = 36)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "beacon_type", nullable = false, length = 10)
    private BeaconType beaconType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private BeaconHistoryActionType actionType;

    @Column(name = "changed_field", length = 100)
    private String changedField;

    @Column(name = "previous_value", columnDefinition = "TEXT")
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "changed_by", nullable = false)
    private Long changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "reason", length = 500)
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "diff_data", columnDefinition = "JSONB")
    private String diffData;
}
```

### 4.4 Type Enumerations

```java
// BeaconLightType.java — package com.hanghai.kchtg.beacon.entity
public enum BeaconLightType { LIGHTHOUSE, BEACON_LIGHT, BEACON_MARK }

// BuoyType.java — package com.hanghai.kchtg.beacon.entity
public enum BuoyType { CARDINAL, SECTOR, SPECIAL, SAFE_WATER, ISOLATED_DANGER }

// BeaconStatus.java — shared between BeaconLight and Buoy
public enum BeaconStatus { DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED }

// BeaconApprovalStatus.java — shared
public enum BeaconApprovalStatus { PENDING, APPROVED, REJECTED }

// BeaconHistoryActionType.java — shared
public enum BeaconHistoryActionType { CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE }

// BeaconType.java — shared (entity discriminator for history)
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
    boolean existsByCode(String code);

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
    boolean existsByCode(String code);

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

## 6. DTO Layer

### 6.1 BeaconLight DTOs

```java
// CreateBeaconLightRequest.java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateBeaconLightRequest {
    @NotBlank(message = "Mã đèn biển không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên đèn biển không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại đèn không được để trống")
    private BeaconLightType type;

    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;

    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;

    @NotNull @DecimalMin("0.01") @DecimalMax("60.0")
    private Double lightRange;

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
    private String action = "draft";  // "draft" or "submit"
}

// UpdateBeaconLightRequest.java
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
    // NOTE: code and type are NOT mutable via this DTO
}

// BeaconLightResponse.java
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

```java
// CreateBuoyRequest.java
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
    private Double range;

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

// UpdateBuoyRequest.java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateBuoyRequest {
    @Size(max = 200) private String name;
    @Size(max = 50) private String color;
    @Size(max = 50) private String shape;
    @Size(max = 100) private String lightCharacteristic;
    @DecimalMin("0.01") @DecimalMax("100.0") private Double range;
    @Size(max = 1000) private String description;
    private Long unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private Boolean isActive;
}

// BuoyResponse.java
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

```java
// BeaconHistoryResponse.java
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
    private String changedByName;
    private LocalDateTime changedAt;
    private String reason;
    private String diffData;
}

// BeaconHistoryQuery.java
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

## 7. Service Layer

### 7.1 Architecture Pattern

Following the M-007 PointObjectService pattern:
- Class-level `@Transactional(readOnly = true)` for default read safety
- Write methods decorated with `@Transactional` for explicit writes
- `@RequiredArgsConstructor` for dependency injection via constructor
- Entity → DTO conversion via private `toResponse()` method
- Validation helpers as private methods

### 7.2 BeaconLightService (key methods)

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BeaconLightService {

    private final BeaconLightRepository beaconLightRepo;
    private final BuoyRepository buoyRepo;
    private final BeaconHistoryRepository historyRepo;
    private final PointObjectSyncService pointObjectSyncService;
    private final NotificationService notificationService;

    // ── READ ───────────────────────────────────────────
    public List<BeaconLightResponse> findAll() {
        return beaconLightRepo.findAll().stream().map(this::toResponse).toList();
    }

    public BeaconLightResponse findById(UUID id) {
        return toResponse(beaconLightRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Đèn biển không tìm thấy: " + id)));
    }

    public List<BeaconLightResponse> search(
            String name, String code, BeaconLightType type, BeaconStatus status) {
        return beaconLightRepo.searchFiltered(name, code, type, status)
            .stream().map(this::toResponse).toList();
    }

    // ── CREATE ─────────────────────────────────────────
    @Transactional
    public BeaconLightResponse create(CreateBeaconLightRequest request) {
        // BR-068-01: cross-type unique code check
        if (beaconLightRepo.existsByCode(request.getCode())
            || buoyRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getCode());
        }
        validateCoordinates(request.getLongitude(), request.getLatitude());
        validateMaintenanceDates(request.getLastMaintenanceDate(), request.getNextMaintenanceDate());

        BeaconLight entity = BeaconLight.builder()
            .code(request.getCode())
            .name(request.getName())
            .type(request.getType())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .lightRange(request.getLightRange())
            .lightColor(request.getLightColor())
            .lightCharacteristic(request.getLightCharacteristic())
            .range(request.getRange())
            .description(request.getDescription())
            .unitId(request.getUnitId())
            .lastMaintenanceDate(request.getLastMaintenanceDate())
            .nextMaintenanceDate(request.getNextMaintenanceDate())
            .isActive(request.getIsActive())
            .status(BeaconStatus.DRAFT)
            .approvalStatus(BeaconApprovalStatus.PENDING)
            .build();

        // BR-068-10: auto-assign unitId if null
        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }

        // BR-068-05: "submit" action → DRAFT → PENDING_APPROVAL
        if ("submit".equals(request.getAction())) {
            entity.setStatus(BeaconStatus.PENDING_APPROVAL);
            entity.setApprovalLevel(1);
        }

        entity = beaconLightRepo.save(entity);
        logHistory(entity, BeaconHistoryActionType.CREATE, null, toJson(entity));
        return toResponse(entity);
    }

    // ── UPDATE ─────────────────────────────────────────
    @Transactional
    public BeaconLightResponse update(UUID id, UpdateBeaconLightRequest request) {
        BeaconLight entity = beaconLightRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Đèn biển không tìm thấy: " + id));

        if (entity.getStatus() == BeaconStatus.DELETED) {
            throw new EntityNotFoundException("Đèn biển đã bị xóa");
        }

        String oldJson = toJson(entity);
        applyUpdates(entity, request);

        // BR-069-03/04/06: status revert logic for approved states
        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus(BeaconStatus.DRAFT);
            entity.setApprovalStatus(BeaconApprovalStatus.PENDING);
            entity.setApprovalLevel(1);
        }

        beaconLightRepo.save(entity);

        // BR-069-10: only log if there were actual changes
        String newJson = toJson(entity);
        if (!oldJson.equals(newJson)) {
            logHistory(entity, BeaconHistoryActionType.UPDATE,
                getChangedFields(oldJson, newJson), newJson);
        }
        return toResponse(entity);
    }

    // ── DELETE (Soft) ──────────────────────────────────
    @Transactional
    public void delete(UUID id) {
        BeaconLight entity = beaconLightRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Đèn biển không tìm thấy: " + id));

        if (entity.getStatus() == BeaconStatus.DELETED) {
            throw new IllegalArgumentException("Đèn biển này đã bị xóa trước đó");
        }
        if (isInApprovalProcess(entity.getStatus())) {
            throw new IllegalStateException(
                "Không thể xóa đèn biển đang chờ phê duyệt");
        }

        entity.setStatus(BeaconStatus.DELETED);
        entity.softDelete();
        beaconLightRepo.save(entity);
        logHistory(entity, BeaconHistoryActionType.SOFT_DELETE, null, toJson(entity));
    }

    // ── APPROVAL ───────────────────────────────────────
    @Transactional
    public void submitForApproval(UUID id) {
        BeaconLight entity = beaconLightRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Đèn biển không tìm thấy: " + id));
        if (entity.getStatus() != BeaconStatus.DRAFT) {
            throw new IllegalStateException("Chỉ có thể gửi phê duyệt khi status = DRAFT");
        }
        entity.setStatus(BeaconStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(BeaconApprovalStatus.PENDING);
        entity.setApprovalLevel(1);
        beaconLightRepo.save(entity);
        notificationService.sendApprovalNotification(entity);
    }

    @Transactional
    public BeaconLightResponse approveL1(UUID id, String approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Đèn biển không tìm thấy: " + id));
        if (entity.getStatus() != BeaconStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Không ở trạng thái chờ phê duyệt L1");
        }
        if (entity.getCreatedBy().equals(Long.parseLong(approverId))) {
            throw new IllegalStateException(
                "Không thể phê duyệt bản do chính mình gửi");
        }

        entity.setStatus(BeaconStatus.APPROVED_L1);
        entity.setApprovalStatus(BeaconApprovalStatus.APPROVED);
        entity.setApprovedBy(Long.parseLong(approverId));
        entity.setApprovedDate(LocalDateTime.now());
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L1, null, null);
        notificationService.sendL2ApprovalNotification(entity);
        return toResponse(entity);
    }

    @Transactional
    public BeaconLightResponse approveL2(UUID id, String approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Đèn biển không tìm thấy: " + id));
        if (entity.getStatus() != BeaconStatus.APPROVED_L1) {
            throw new IllegalStateException("Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus(BeaconStatus.PUBLISHED);
        entity.setApprovalStatus(BeaconApprovalStatus.APPROVED);
        entity.setApprovedBy(Long.parseLong(approverId));
        entity.setApprovedDate(LocalDateTime.now());
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L2, null, null);
        pointObjectSyncService.syncToMap(entity);
        return toResponse(entity);
    }

    @Transactional
    public BeaconLightResponse reject(UUID id, String rejectReason, String approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Đèn biển không tìm thấy: " + id));
        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setStatus(BeaconStatus.DRAFT);
        entity.setApprovalStatus(BeaconApprovalStatus.REJECTED);
        entity.setRejectionReason(rejectReason);
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.REJECT, null, null);
        notificationService.sendRejectionNotification(entity, rejectReason);
        return toResponse(entity);
    }

    // ── HELPERS ────────────────────────────────────────
    private void validateCoordinates(Double longitude, Double latitude) {
        if (longitude < -180.0 || longitude > 180.0)
            throw new IllegalArgumentException("Kinh độ phải trong khoảng -180~180 (WGS84)");
        if (latitude < -90.0 || latitude > 90.0)
            throw new IllegalArgumentException("Vĩ độ phải trong khoảng -90~90 (WGS84)");
    }

    private void validateMaintenanceDates(LocalDate last, LocalDate next) {
        if (last != null && next != null && next.isBefore(last))
            throw new IllegalArgumentException(
                "Ngày bảo trì kế tiếp không được nhỏ hơn ngày bảo trì gần nhất");
        if (last != null && !last.isBefore(LocalDate.now()))
            throw new IllegalArgumentException(
                "Ngày bảo trì gần nhất không được lớn hơn ngày hiện tại");
    }

    private void logHistory(BeaconLight entity,
            BeaconHistoryActionType action, String fields, String json) {
        BeaconHistory entry = BeaconHistory.builder()
            .beaconType(BeaconType.BEACON_LIGHT)
            .entityId(entity.getId())
            .actionType(action)
            .changedField(fields)
            .previousValue(action == BeaconHistoryActionType.UPDATE ? null : null)
            .newValue(json)
            .changedBy(entity.getId().getMostSignificantBits()) // resolved from security context
            .changedAt(LocalDateTime.now())
            .build();
        historyRepo.save(entry);
    }

    private BeaconLightResponse toResponse(BeaconLight entity) {
        return BeaconLightResponse.builder()
            .id(entity.getId())
            .code(entity.getCode())
            .name(entity.getName())
            .type(entity.getType())
            .latitude(entity.getLatitude())
            .longitude(entity.getLongitude())
            .lightRange(entity.getLightRange())
            .lightColor(entity.getLightColor())
            .lightCharacteristic(entity.getLightCharacteristic())
            .range(entity.getRange())
            .description(entity.getDescription())
            .unitId(entity.getUnitId())
            .lastMaintenanceDate(entity.getLastMaintenanceDate())
            .nextMaintenanceDate(entity.getNextMaintenanceDate())
            .isActive(entity.getIsActive())
            .status(entity.getStatus())
            .approvalStatus(entity.getApprovalStatus())
            .approvalLevel(entity.getApprovalLevel())
            .approvedBy(entity.getApprovedBy())
            .approvedDate(entity.getApprovedDate())
            .rejectionReason(entity.getRejectionReason())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }

    private boolean isApprovedStatus(BeaconStatus status) {
        return status == BeaconStatus.APPROVED_L1
            || status == BeaconStatus.APPROVED_L2
            || status == BeaconStatus.PUBLISHED;
    }

    private boolean isInApprovalProcess(BeaconStatus status) {
        return status == BeaconStatus.PENDING_APPROVAL
            || status == BeaconStatus.APPROVED_L1
            || status == BeaconStatus.APPROVED_L2;
    }
}
```

### 7.3 BuoyService

Parallel structure to `BeaconLightService` with Buoy-specific field names and validation ranges (range ≤ 100 nautical miles, `lastInspectionDate`/`nextInspectionDate` instead of maintenance dates). All approval, delete, and update logic follows the same state-machine rules.

### 7.4 BeaconHistoryService

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BeaconHistoryService {

    private final BeaconHistoryRepository historyRepo;

    public Page<BeaconHistoryResponse> getHistory(
            BeaconType beaconType, UUID entityId, Pageable pageable) {
        return historyRepo.findByEntityIdAndBeaconType(entityId, beaconType, pageable)
            .map(this::toResponse);
    }

    public Page<BeaconHistoryResponse> getHistoryFiltered(
            BeaconType beaconType, UUID entityId,
            BeaconHistoryActionType actionType,
            Long changedBy, LocalDateTime from, LocalDateTime to,
            Pageable pageable) {
        if (actionType != null && from != null && to != null) {
            return historyRepo.findByEntityIdAndBeaconTypeAndActionType(
                    entityId, beaconType, actionType, pageable)
                .map(this::toResponse);
        }
        if (from != null && to != null) {
            return historyRepo.findByDateRange(entityId, beaconType, from, to, pageable)
                .map(this::toResponse);
        }
        return historyRepo.findByEntityIdAndBeaconType(entityId, beaconType, pageable)
            .map(this::toResponse);
    }
}
```

---

## 8. Controller Layer (REST API Contract)

### 8.1 BeaconLightController

```java
@RestController
@RequestMapping("/api/beacon-lights")
@RequiredArgsConstructor
public class BeaconLightController {

    private final BeaconLightService beaconLightService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BeaconLightResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(beaconLightService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BeaconLightResponse>> findById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(beaconLightService.findById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<BeaconLightResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) BeaconLightType type,
            @RequestParam(required = false) BeaconStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
            beaconLightService.search(name, code, type, status)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BeaconLightResponse>> create(
            @Valid @RequestBody CreateBeaconLightRequest request) {
        BeaconLightResponse response = beaconLightService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Tạo đèn biển thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BeaconLightResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBeaconLightRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
            "Cập nhật đèn biển thành công",
            beaconLightService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        beaconLightService.delete(id);
        return ResponseEntity.ok(
            ApiResponse.success("Đã xóa đèn biển thành công", null));
    }

    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(
            @PathVariable UUID id) {
        beaconLightService.submitForApproval(id);
        return ResponseEntity.ok(
            ApiResponse.success("Đã gửi phê duyệt", null));
    }

    @PostMapping("/{id}/approve-l1")
    public ResponseEntity<ApiResponse<BeaconLightResponse>> approveL1(
            @PathVariable UUID id, @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
            "Phê duyệt L1 thành công",
            beaconLightService.approveL1(id, approverId)));
    }

    @PostMapping("/{id}/approve-l2")
    public ResponseEntity<ApiResponse<BeaconLightResponse>> approveL2(
            @PathVariable UUID id, @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
            "Phê duyệt L2 thành công — Đã công bố",
            beaconLightService.approveL2(id, approverId)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<BeaconLightResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String rejectReason,
            @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
            "Đã từ chối",
            beaconLightService.reject(id, rejectReason, approverId)));
    }
}
```

### 8.2 BuoyController (parallel endpoints under `/api/buoys`)

| Method | Path | Description | Status Code |
|---|---|---|---|
| GET | `/api/buoys` | List all buoys | 200 |
| GET | `/api/buoys/{id}` | Get buoy detail | 200 |
| GET | `/api/buoys/search` | Search (name, code, type, status) | 200 |
| POST | `/api/buoys` | Create buoy | 201 |
| PUT | `/api/buoys/{id}` | Update buoy | 200 |
| DELETE | `/api/buoys/{id}` | Soft delete buoy | 200 |
| POST | `/api/buoys/{id}/submit-approval` | Submit for approval | 200 |
| POST | `/api/buoys/{id}/approve-l1` | Approve L1 | 200 |
| POST | `/api/buoys/{id}/approve-l2` | Approve L2 → PUBLISH | 200 |
| POST | `/api/buoys/{id}/reject` | Reject with reason | 200 |

### 8.3 BeaconHistoryController (Shared)

| Method | Path | Description | Params | Status Code |
|---|---|---|---|---|
| GET | `/api/beacon-history` | Get history entries | `type`, `entityId`, `actionType`, `changedBy`, `from`, `to`, `page`, `size` | 200 |

```java
@RestController
@RequestMapping("/api/beacon-history")
@RequiredArgsConstructor
public class BeaconHistoryController {

    private final BeaconHistoryService historyService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BeaconHistoryResponse>>> getHistory(
            @RequestParam BeaconType type,
            @RequestParam UUID entityId,
            @RequestParam(required = false) BeaconHistoryActionType actionType,
            @RequestParam(required = false) Long changedBy,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
            Sort.by("changedAt").descending());
        Page<BeaconHistoryResponse> result = historyService.getHistoryFiltered(
            type, entityId, actionType, changedBy, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
```

### 8.4 API Response Envelope

All endpoints use `ApiResponse<T>` from `com.hanghai.kchtg.common.dto`:

**Success (200/201):**
```json
{ "success": true, "message": "Tạo đèn biển thành công", "data": { ... }, "timestamp": "2026-06-25T10:30:00" }
```

**Error (400/403/404/409/500):**
```json
{ "success": false, "message": "Mã đèn biển đã tồn tại.", "timestamp": "2026-06-25T10:30:00" }
```

---

## 9. Component Architecture

### 9.1 Component Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        M-013: Beacon Management                         │
│                                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │ Controller   │   │ Controller   │   │   History    │                │
│  │ BeaconLight  │   │    Buoy      │   │   Controller │                │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │
│         │                   │                   │                        │
│  ┌──────▼───────┐   ┌──────▼───────┐   ┌──────▼───────┐                │
│  │  Service     │   │  Service     │   │   Service    │                │
│  │ BeaconLight  │   │    Buoy      │   │   History    │                │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │
│         │                   │                   │                        │
│  ┌──────▼───────┐   ┌──────▼───────┐   ┌──────▼───────┐                │
│  │  Repository  │   │  Repository  │   │  Repository  │                │
│  │ BeaconLight  │   │    Buoy      │   │   History    │                │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┘                │
│         │                   │                                           │
│  ┌──────▼──────────────────▼──────┐                                    │
│  │         Entity Layer            │                                    │
│  │  ┌──────────────┐ ┌──────────┐ │                                    │
│  │  │ BeaconLight  │ │   Buoy   │ │                                    │
│  │  └──────┬───────┘ └────┬─────┘ │                                    │
│  │         └──────────────┘        │                                    │
│  │               │                 │                                    │
│  │         ┌─────▼─────┐          │                                    │
│  │         │BeaconHist │          │                                    │
│  │         │  ory      │          │                                    │
│  │         └───────────┘          │                                    │
│  └─────────┴─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
         │                   │                  │
         ▼                   ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │ Notification │   │   M-007      │
│   (JPA/Hibernate)│ Service     │   │ PointObject  │
└──────────────┘   └──────────────┘   └──────────────┘
```

### 9.2 Component Responsibilities

| Component | Responsibility | Annotation Pattern |
|---|---|---|
| `BeaconLightController` | REST endpoints, input validation, response envelope | `@RestController`, `@RequestMapping`, `@RequiredArgsConstructor` |
| `BuoyController` | REST endpoints for buoys (parallel) | Same as above |
| `BeaconHistoryController` | Shared history query endpoints | Same as above |
| `BeaconLightService` | Business rules, state transitions, validation, history logging | `@Service`, `@Transactional(readOnly=true)`, `@RequiredArgsConstructor` |
| `BuoyService` | Business rules for buoys (parallel) | Same as above |
| `BeaconHistoryService` | History query with filtering | `@Service`, `@Transactional(readOnly=true)` |
| `BeaconLightRepository` | JPA CRUD + custom queries | `extends JpaRepository<BeaconLight, UUID>` |
| `BuoyRepository` | JPA CRUD + custom queries | `extends JpaRepository<Buoy, UUID>` |
| `BeaconHistoryRepository` | JPA CRUD + filtered queries | `extends JpaRepository<BeaconHistory, UUID>` |
| `BeaconLight` | Entity with fields, enums, soft delete | `@Entity`, `@Table`, `@SQLRestriction("deleted_at IS NULL")`, extends `BaseEntity` |
| `Buoy` | Entity with fields, enums, soft delete | Same as above |
| `BeaconHistory` | Audit trail, no inheritance from BaseEntity | `@Entity`, `@Table` |

### 9.3 State Machine Diagram

```
  DRAFT ──────────────┐
       │               │
       │ submit        ▼
       │         PENDING_APPROVAL ────┐
       │               │              │
       │               │ approve L1   │ reject
       │               ▼              │
       │          APPROVED_L1 ────────┤
       │               │              │
       │               │ approve L2   │ reject
       │               ▼              │
       │          APPROVED_L2          │
       │               │              │
       │               │ publish      │
       │               ▼              │
       │          PUBLISHED            │
       │               │              │
       │               │ edit ────────┘
       │               ▼
       │          DRAFT (reverted)
       │
       │ delete
       ▼
      DELETED (soft, hidden via SQLRestriction)
```

**State transition rules**:
- DRAFT → PENDING_APPROVAL: via `submitForApproval()`
- PENDING_APPROVAL → APPROVED_L1: via `approveL1()` (requires leader L1 role)
- APPROVED_L1 → PUBLISHED: via `approveL2()` (requires leader L2 role)
- Any approved state → DRAFT: via `update()` (BR-069-03/04/06)
- PENDING_APPROVAL/APPROVED_L1 → DRAFT: via `reject()` (BR-071-05)
- Any active state → DELETED: via `delete()` (soft delete, BR-070-01)

---

## 10. Integration Points

### 10.1 M-007 PointObject Sync (Outbound)

When a BeaconLight or Buoy reaches `PUBLISHED` status, a GPS point must be created/updated in the `point_objects` table:

```
Service: PointObjectSyncService (in beacon package, delegates to M-007)
Trigger: approveL2() → BeaconLight/Buoy → PUBLISHED
Action: Upsert into point_objects table:
  - code = beacon_light.code OR buoy.code
  - name = beacon_light.name OR buoy.name
  - objectType = LIGHTHOUSE/BUOY/BEACON/BEACON_LIGHT
  - latitude, longitude from entity
  - status = PUBLISHED
  - unitId from entity
```

Reverse: When a beacon is soft-deleted or rejected, the point should be disabled/hidden (not deleted, per BR-070-05).

### 10.2 M-001 Units (Inbound)

The `unitId` field references the units master table from M-001. Validation is done at service level by checking unit existence. Unit name resolution for display purposes.

### 10.3 Notification Service (Outbound)

Trigger points:
1. `submitForApproval()` → Send notification to L1 leader (phòng)
2. `approveL1()` → Send notification to L2 leader (cục)
3. `reject()` → Send notification to creating specialist with rejection reason
4. `update()` on PUBLISHED → Send notification that beacon reverted to DRAFT

### 10.4 M-005 Cron/Scheduler (Outbound)

Periodic job checks `next_maintenance_date` / `next_inspection_date` = today and generates maintenance/inspection alerts via notification service.

---

## 11. Cross-Cutting Concerns

### 11.1 Soft Delete Pattern

Inherits from `BaseEntity`:
- `@SQLRestriction("deleted_at IS NULL")` filters out soft-deleted records from ALL JPA queries
- `softDelete()` method sets `deletedAt = LocalDateTime.now()`
- `deletedAt` is nullable (null = active)

### 11.2 Approval Workflow

2-level workflow enforced at service layer:
- L1: requires `leader` role (phòng/chỉ huy)
- L2: requires `leader` role (cục)
- Self-approval prevention: requester cannot approve their own submission
- Rejection: requires reason (min 10 characters), reverts to DRAFT

### 11.3 Cross-Type Code Uniqueness

Validated at service layer before create:
```java
if (beaconLightRepo.existsByCode(code) || buoyRepo.existsByCode(code)) {
    throw new IllegalArgumentException("Mã đã tồn tại: " + code);
}
```

### 11.4 Permission Enforcement

| Operation | Required Role | Unit Scope |
|---|---|---|
| Create | admin / system-admin | Own unit (auto-assigned) |
| Update | admin / system-admin | Own unit |
| Delete | admin / system-admin | Own unit |
| Approve L1 | leader (L1) | Own unit |
| Approve L2 | leader (L2) | All units |
| View (basic) | user (doanh nghiệp cảng) | PUBLISHED only |
| View (full) | admin / leader | Own unit (or all if system-admin) |
| History | admin / leader | Own unit |

### 11.5 Validation Rules Summary

| Rule | Entity | Range |
|---|---|---|
| WGS84 latitude | Both | -90.0 to 90.0 |
| WGS84 longitude | Both | -180.0 to 180.0 |
| lightRange | BeaconLight | 0.01 to 60.0 (nautical miles) |
| range | Both | 0.01 to 100.0 (nautical miles) |
| nextMaintenanceDate | BeaconLight | ≥ lastMaintenanceDate |
| nextInspectionDate | Buoy | ≥ lastInspectionDate |
| lastMaintenanceDate | BeaconLight | ≤ today |
| lastInspectionDate | Buoy | ≤ today |
| rejectionReason | Both | min 10 characters |

---

## 12. Technical Decisions

### TD-001: Two separate entities vs. single polymorphic entity

**Decision**: Two separate entities (`BeaconLight`, `Buoy`) sharing common enums and `BaseEntity`.

**Rationale**:
- Different field sets: BeaconLight has `lightRange`, `lightColor`, `lightCharacteristic`, `lastMaintenanceDate`, `nextMaintenanceDate`; Buoy has `color`, `shape`, `lastInspectionDate`, `nextInspectionDate`
- Different type enums: `BeaconLightType` (3 values) vs `BuoyType` (5 values)
- Different repositories and services are cleaner
- Shared enums prevent duplication
- Matches the existing PointObject pattern subtypes

### TD-002: Shared history entity vs. separate history per entity

**Decision**: Single `BeaconHistory` table with `beaconType` discriminator and `entityId` FK.

**Rationale**:
- Same audit trail structure for both types
- Reduced duplication
- Cross-type history queries possible
- `beaconType` field acts as discriminator

### TD-003: Cross-type unique constraint on code

**Decision**: Application-level validation with dual repository check.

**Rationale**:
- PostgreSQL UNIQUE cannot span multiple tables
- Application-level check is clear, testable, follows M-007 pattern
- A database comment documents the business requirement

### TD-004: Service method transaction boundaries

**Decision**: `@Transactional(readOnly = true)` at class level, `@Transactional` on all write methods.

**Rationale**:
- Matches M-007 PointObjectService pattern exactly
- Read methods benefit from read-only transaction optimization
- Write methods explicitly demarcate transaction boundaries

### TD-005: DTO pattern — separate Create and Update requests

**Decision**: Separate `CreateXxxRequest` and `UpdateXxxRequest` DTOs per entity type.

**Rationale**:
- Create requires all mandatory fields; Update only needs changed fields
- Create includes `action` field ("draft" or "submit")
- Update explicitly excludes `code` and `type` fields
- Follows M-007 pattern

### TD-006: Soft delete via BaseEntity vs. status field

**Decision**: Both — use `BaseEntity.deletedAt` AND `status = DELETED`.

**Rationale**:
- `BaseEntity.deletedAt` + `@SQLRestriction` ensures DB-level filtering
- `status = DELETED` tracks business state for workflow and UI
- Synchronized in delete() method
- Distinguishes "soft deleted" from "rejected"

### TD-007: API endpoint naming convention

**Decision**: `/api/beacon-lights` and `/api/buoys` as RESTful resource paths.

**Rationale**:
- Plural noun matching M-007 `/api/point-objects` convention
- HTTP methods carry CRUD semantics
- Sub-resource paths for operations: `/{id}/submit-approval`, `/{id}/approve-l1`, etc.

---

## 13. Error Handling Strategy

All business rule violations handled as:

| HTTP Status | Exception Type | Example |
|---|---|---|
| 400 Bad Request | `IllegalArgumentException` / `IllegalStateException` | Invalid coordinates, rejection reason too short, wrong state |
| 403 Forbidden | Custom security exception | Wrong role, cross-unit access |
| 404 Not Found | `EntityNotFoundException` | Record not found or soft-deleted |
| 409 Conflict | `IllegalArgumentException` | Duplicate code, already deleted |
| 500 Internal | `RuntimeException` by `@ControllerAdvice` | Unexpected DB errors |

Global `@ControllerAdvice` wraps all exceptions into `ApiResponse<T>` error format.

---

## 14. Testing Architecture Notes

### Unit Testing Scope
- State machine transitions (all valid/invalid)
- Validation rules (coordinates, ranges, dates, uniqueness)
- Permission checks (role-based, unit-scoped)
- DTO validation

### Integration Testing Scope
- CRUD operations with PostgreSQL (H2 test DB)
- Approval workflow end-to-end
- Cross-type code uniqueness
- Soft delete + SQLRestriction filtering
- History logging

### Key Test Scenarios
1. DRAFT → PENDING_APPROVAL → APPROVED_L1 → PUBLISHED (happy path)
2. PENDING_APPROVAL → REJECT (L1) → DRAFT → RESUBMIT
3. APPROVED_L1 → REJECT (L2) → DRAFT
4. PUBLISHED → EDIT → DRAFT (status revert)
5. Cross-type unique code collision
6. Self-approval prevention
7. Soft delete + SQLRestriction verification
8. History entry creation on all action types

---

## 15. Migration / DDL Notes

PostgreSQL DDL should be created via Flyway or JPA `ddl-auto=validate` in production. Key indexes:

```sql
CREATE INDEX idx_beacon_light_status ON beacon_light(status);
CREATE INDEX idx_beacon_light_code ON beacon_light(code);
CREATE INDEX idx_beacon_light_unit ON beacon_light(unit_id);
CREATE INDEX idx_buoy_status ON buoy(status);
CREATE INDEX idx_buoy_code ON buoy(code);
CREATE INDEX idx_buoy_unit ON buoy(unit_id);
CREATE INDEX idx_beacon_history_entity ON beacon_history(entity_id, beacon_type);
CREATE INDEX idx_beacon_history_changed_at ON beacon_history(changed_at);
```

---

## 16. Open Questions / Risks

| # | Item | Risk | Mitigation |
|---|---|---|---|
| Q1 | Cross-type unique constraint DB enforcement | App-level only | App check + DB comment; consider pg function Wave 2 |
| Q2 | BeaconHistory does NOT extend BaseEntity | No unwanted SQLRestriction | Verified: separate @Entity without SQLRestriction |
| Q3 | GIS PointObject sync — upsert or delete? | Should disable, not delete | Per BR-070-05: do NOT auto-delete points |
| Q4 | Unit reference validation | No FK to units table | Service-level lookup to M-001 |
| Q5 | diffData JSONB — PostgreSQL only | Not compatible with other DBs | PostgreSQL-only; mark optional |
| Q6 | Approval level tracking | Single approvedBy vs. level1Approver/level2Approver | Current: single field; consider adding in Wave 2 |

---

## Appendix A: Feature-to-Endpoint Mapping

| Feature | Controller | Method | Endpoint |
|---|---|---|---|
| F-068 | BeaconLightController | create() | POST /api/beacon-lights |
| F-069 | BeaconLightController | update() | PUT /api/beacon-lights/{id} |
| F-070 | BeaconLightController | delete() | DELETE /api/beacon-lights/{id} |
| F-071 | BeaconLightController | approveL1(), approveL2(), reject() | POST /api/beacon-lights/{id}/approve-l1, approve-l2, reject |
| F-072 | BeaconLightController | findById() | GET /api/beacon-lights/{id} |
| F-073 | BeaconHistoryController | getHistory() | GET /api/beacon-history |
| F-074 | BuoyController | create() | POST /api/buoys |
| F-075 | BuoyController | update() | PUT /api/buoys/{id} |
| F-076 | BuoyController | delete() | DELETE /api/buoys/{id} |
| F-077 | BuoyController | approveL1(), approveL2(), reject() | POST /api/buoys/{id}/approve-l1, approve-l2, reject |
| F-078 | BuoyController | findById() | GET /api/buoys/{id} |
| F-079 | BeaconHistoryController | getHistory() | GET /api/beacon-history |

## Appendix B: Enum Value Reference

### BeaconLightType
- `LIGHTHOUSE` — Hải đăng
- `BEACON_LIGHT` — Đèn báo
- `BEACON_MARK` — Cọc tiêu

### BuoyType
- `CARDINAL` — Phao tiêu hướng Bắc/Tây/Nam/Đông
- `SECTOR` — Phao tiêu phân khu
- `SPECIAL` — Phao tiêu đặc biệt
- `SAFE_WATER` — Phao tiêu vùng nước an toàn
- `ISOLATED_DANGER` — Phao tiêu nguy hiểm cô lập

### BeaconStatus
- `DRAFT` — Nháp
- `PENDING_APPROVAL` — Chờ phê duyệt
- `APPROVED_L1` — Đã phê duyệt L1
- `APPROVED_L2` — Đã phê duyệt L2
- `PUBLISHED` — Đã công bố
- `REJECTED` — Bị từ chối
- `DELETED` — Đã xóa

### BeaconApprovalStatus
- `PENDING` — Chờ phê duyệt
- `APPROVED` — Đã phê duyệt
- `REJECTED` — Bị từ chối

### BeaconHistoryActionType
- `CREATE` — Tạo mới
- `UPDATE` — Cập nhật
- `APPROVE_L1` — Phê duyệt L1
- `APPROVE_L2` — Phê duyệt L2
- `REJECT` — Từ chối
- `SOFT_DELETE` — Xóa mềm
