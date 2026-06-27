---
id: F-003
name: Quan ly don vi
slug: quan-ly-don-vi
module-id: M-001
stage: system-architect
status: completed
created: 2026-06-17T00:00:00Z
last-updated: 2026-06-17T04:00:00Z
---

# SA Stage: F-003 — Quản lý đơn vị

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 Unit (Đơn vị — hierarchical tree)

```java
@Entity
@Table(name = "units", indexes = {
    @Index(name = "idx_units_name", columnList = "name"),
    @Index(name = "idx_units_code", columnList = "code", unique = true),
    @Index(name = "idx_units_parent_id", columnList = "parent_id"),
    @Index(name = "idx_units_type", columnList = "unit_type"),
    @Index(name = "idx_units_status", columnList = "status")
})
public class Unit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "name", length = 200, nullable = false) private String name;
    @Column(name = "code", length = 100, nullable = false) private String code;
    @Column(name = "unit_type", length = 30, nullable = false, columnDefinition = "VARCHAR(30)")
    private String unitType; // cuc | chi cuc | cang | dao | tct

    @Column(name = "description", length = 1000) private String description;
    @Column(name = "address", length = 500) private String address;
    @Column(name = "coefficient", precision = 5, scale = 2) private BigDecimal coefficient;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "parent_id")
    private Unit parent; // self-referencing for tree hierarchy

    @Column(name = "status", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'pending'")
    private String status; // pending | active | inactive | rejected

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by")
    private UserAccount createdBy;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "approved_by")
    private UserAccount approvedBy;

    @Column(name = "level") private Integer level; // computed depth in tree
    @Column(name = "sort_order") private Integer sortOrder;
    @Column(name = "effective_date") private LocalDate effectiveDate;
    @Column(name = "approved_at") private LocalDateTime approvedAt;

    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;

    @PrePersist void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (level == null) level = (parent != null) ? parent.getLevel() + 1 : 0;
    }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

### 1.2 UnitHistory

```java
@Entity
@Table(name = "unit_histories", indexes = {
    @Index(name = "idx_unit_histories_unit_id", columnList = "unit_id"),
    @Index(name = "idx_unit_histories_performed_at", columnList = "performed_at")
})
public class UnitHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "performed_by")
    private UserAccount performedBy;

    @Column(name = "action", length = 30, nullable = false) private String action;
    // create | modify | delete | approve | reject

    @Column(name = "notes", length = 1000) private String notes;
    @Column(name = "details", columnDefinition = "JSON") private String details;
    @Column(name = "performed_at") private LocalDateTime performedAt;
}
```

### 1.3 OrganizationChart

```java
@Entity
@Table(name = "organization_charts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"unit_id"})
}, indexes = {
    @Index(name = "idx_org_chart_parent_id", columnList = "parent_id"),
    @Index(name = "idx_org_chart_level", columnList = "level")
})
public class OrganizationChart {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "parent_id")
    private Unit parent;

    @Column(name = "level") private Integer level;
    @Column(name = "sort_order") private Integer sortOrder;
    @Column(name = "effective_date") private LocalDate effectiveDate;
}
```

### 1.4 Relationship Diagram

```
Unit 1───N Unit (self-ref via parent_id, tree structure)
Unit 1──N UnitHistory
Unit 1──1 OrganizationChart
Unit N──1 UserAccount (created_by, approved_by)
Unit 1──N UserAccount (users belonging to this unit via UserAccount.organization)
```

## 2. API Endpoints

All endpoints prefixed with `/api/v1/`. Authentication via JWT Bearer token.

### Unit CRUD

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/units` | Danh sách đơn vị (tree or flat) | system-admin |
| GET | `/api/v1/units/{id}` | Chi tiết đơn vị | system-admin |
| POST | `/api/v1/units` | Tạo đơn vị mới (status=pending) | system-admin / can_bo |
| PUT | `/api/v1/units/{id}` | Chỉnh sửa đơn vị | system-admin |
| DELETE | `/api/v1/units/{id}` | Xóa đơn vị (check references) | system-admin |

### Unit Hierarchy

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/units/tree` | Cây cấu trúc đơn vị toàn hệ thống | system-admin |
| GET | `/api/v1/units/{id}/children` | Danh sách đơn vị con | system-admin |
| GET | `/api/v1/units/{id}/ancestors` | Danh sách đơn vị cha | system-admin |
| GET | `/api/v1/units/{id}/descendants` | Tất cả đơn vị con (recursive) | system-admin |

### Unit Approval Workflow

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| PATCH | `/api/v1/units/{id}/approve` | Duyệt đơn vị | system-admin |
| PATCH | `/api/v1/units/{id}/reject` | Từ chối với lý do | system-admin |
| GET | `/api/v1/units?status=pending` | Danh sách đơn vị chờ duyệt | system-admin |

### Unit Search & Filters

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/units/search?query=&type=` | Tìm kiếm đơn vị | system-admin |
| GET | `/api/v1/units?unitType=&status=&page=&size=` | Bộ lọc danh sách | system-admin |
| GET | `/api/v1/units/{id}/users` | Người dùng thuộc đơn vị này | system-admin |

## 3. Architecture Notes

### 3.1 Component Interactions

```
ReactJS (Admin UI)
    │
    ├── UnitController
    │       ├── UnitService ──► UnitRepository ──► MSSQL
    │       ├── UnitApprovalService (workflow)
    │       ├── UnitTreeService (recursive queries)
    │       └── UnitHistoryService ──► UnitHistoryRepository
    │
    └── ApplicationEventPublisher
            └── UnitApprovedEvent → F-005 AccessLog
```

**Key interactions:**
- `UnitService` validates BR-014 (no delete if has related personnel) before soft-delete
- `UnitTreeService` uses recursive CTE (WITH ... AS) for MSSQL tree traversal
- `UnitApprovalService` manages status transitions: pending → active / rejected
- `coefficient` validated with `@DecimalMin("0.01") @Digits(integer=3, fraction=2)`

### 3.2 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `UnitRepository` with custom `findByTreePath()` using MSSQL recursive CTE |
| **DTO Pattern** | `UnitCreateDTO`, `UnitUpdateDTO`, `UnitTreeNodeDTO`, `UnitApprovalDTO` |
| **Strategy Pattern** | `ApprovalStrategy` — different workflows per unitType (cuc vs chi cuc) |
| **Builder Pattern** | `UnitTreeNodeBuilder` assembles tree structure from flat list |
| **Specification Pattern** | Filter by unitType, status, coefficient range |
| **CQRS (light)** | Tree view read projection separate from write operations |

### 3.3 Tree Query Implementation

Uses **Closure Table** pattern alongside nested sets for efficient tree operations:

```sql
-- Recursive CTE to build full hierarchy
WITH UnitTree AS (
    SELECT id, name, parent_id, level, 0 as depth
    FROM units WHERE parent_id IS NULL AND deleted_at IS NULL
    UNION ALL
    SELECT u.id, u.name, u.parent_id, u.level, ut.depth + 1
    FROM units u INNER JOIN UnitTree ut ON u.parent_id = ut.id
    WHERE u.deleted_at IS NULL
)
SELECT * FROM UnitTree ORDER BY depth, sort_order;
```

### 3.4 Transaction Boundaries

- `@Transactional` on `UnitService.create()` — creates unit + OrganizationChart + UnitHistory atomically
- `@Transactional` on `UnitApprovalService.approve()` — status change + approvedAt + audit log
- `@Transactional(readOnly = true)` on tree queries (no-write CTE)

### 3.5 Validation & Business Rules Enforcement

```
UnitService.create(dto):
  1. Validate unique code → ConstraintViolationException
  2. Validate coefficient > 0, max 2 decimals → @DecimalMin/@Digits
  3. Validate parent exists (if provided) → EntityNotFoundException
  4. Set level = parent.level + 1 (or 0 if root)
  5. Status = "pending" (requires approval)
  6. Create entity + history entry atomically

UnitService.delete(id):
  1. Check for descendant units → UnitHasChildrenException
  2. Check for associated users (UserAccount.organization = this) → UnitHasUsersException
  3. Soft delete (set deletedAt)
  4. Write UnitHistory(action=delete)
```

### 3.6 Database Indexes & Performance

- Unique index on `(code)` — prevents code duplication
- Index on `(parent_id, status)` for tree-level queries
- Index on `(unit_type, status)` for type filtering
- Composite index on `(level, sort_order)` for ordered tree rendering
- Max recursion depth: 10 levels (configurable)

### 3.7 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-data-jpa` | ORM + native query support for CTE |
| `spring-boot-starter-validation` | BigDecimal validation |
| `spring-boot-starter-security` | Role-based access |
