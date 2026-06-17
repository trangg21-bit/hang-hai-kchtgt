---
id: F-002
name: Quan ly nhom nguoi dung
slug: quan-ly-nhom-nguoi-dung
module-id: M-001
stage: system-architect
status: completed
created: 2026-06-17T00:00:00Z
last-updated: 2026-06-17T04:00:00Z
---

# SA Stage: F-002 — Quản lý nhóm người dùng

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 UserGroup

```java
@Entity
@Table(name = "user_groups", indexes = {
    @Index(name = "idx_user_groups_name", columnList = "name", unique = true),
    @Index(name = "idx_user_groups_code", columnList = "code", unique = true),
    @Index(name = "idx_user_groups_group_type", columnList = "group_type"),
    @Index(name = "idx_user_groups_status", columnList = "status")
})
public class UserGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "name", length = 200, nullable = false) private String name;
    @Column(name = "code", length = 100, nullable = false) private String code;
    @Column(name = "description", length = 1000) private String description;
    @Column(name = "group_type", length = 30, nullable = false, columnDefinition = "VARCHAR(30)")
    private String groupType; // department | project | custom

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by")
    private UserAccount createdBy;

    @Column(name = "status", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    private String status; // active | inactive

    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

### 1.2 GroupMember

```java
@Entity
@Table(name = "group_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"group_id", "user_id"})
}, indexes = {
    @Index(name = "idx_group_members_group_id", columnList = "group_id"),
    @Index(name = "idx_group_members_user_id", columnList = "user_id")
})
public class GroupMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "group_id", nullable = false)
    private UserGroup group;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "joined_by")
    private UserAccount joinedBy;

    @Column(name = "role_in_group", length = 50) private String roleInGroup; // admin | member | observer

    @Column(name = "joined_at") private LocalDateTime joinedAt;
    @Column(name = "left_at") private LocalDateTime leftAt;

    @PrePersist void onCreate() { joinedAt = LocalDateTime.now(); }
}
```

### 1.3 GroupHistory

```java
@Entity
@Table(name = "group_histories", indexes = {
    @Index(name = "idx_group_histories_group_id", columnList = "group_id"),
    @Index(name = "idx_group_histories_performed_at", columnList = "performed_at")
})
public class GroupHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "group_id", nullable = false)
    private UserGroup group;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "performed_by")
    private UserAccount performedBy;

    @Column(name = "action", length = 30, nullable = false) private String action;
    // create | modify | memberAdd | memberDelete | statusChange

    @Column(name = "details", length = 1000) private String details; // JSON diff
    @Column(name = "performed_at") private LocalDateTime performedAt;
}
```

### 1.4 Relationship Diagram

```
UserGroup 1──N GroupMember N──1 UserAccount
UserGroup 1──N GroupHistory
UserAccount N──M UserGroup (via GroupMember)
```

## 2. API Endpoints

All endpoints prefixed with `/api/v1/`. Authentication via JWT Bearer token.

### Group CRUD

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/groups` | Danh sách nhóm (phân trang, bộ lọc) | system-admin |
| GET | `/api/v1/groups/{id}` | Chi tiết nhóm + thành viên | system-admin |
| POST | `/api/v1/groups` | Tạo nhóm mới | system-admin |
| PUT | `/api/v1/groups/{id}` | Chỉnh sửa thông tin nhóm | system-admin |
| DELETE | `/api/v1/groups/{id}` | Xóa nhóm (check member count) | system-admin |

### Group Membership

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/groups/{id}/members` | Danh sách thành viên nhóm | system-admin |
| POST | `/api/v1/groups/{id}/members` | Thêm thành viên vào nhóm | system-admin |
| DELETE | `/api/v1/groups/{id}/members/{userId}` | Xóa thành viên khỏi nhóm | system-admin |
| PUT | `/api/v1/groups/{id}/members/{userId}` | Cập nhật vai trò trong nhóm | system-admin |

### Group Search & Bulk

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/groups/search?query=&type=` | Tìm kiếm nhóm | system-admin |
| GET | `/api/v1/groups?groupType=&status=&page=&size=` | Bộ lọc danh sách | system-admin |
| POST | `/api/v1/groups/{id}/duplicate` | Sao chép nhóm (duplicate) | system-admin |
| GET | `/api/v1/users/{id}/groups` | Danh sách nhóm của người dùng | system-admin |

### Group History

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/groups/{id}/history` | Lịch sử thay đổi nhóm | system-admin |

## 3. Architecture Notes

### 3.1 Component Interactions

```
ReactJS (Admin UI)
    │
    ├── GroupController
    │       ├── GroupService ──► GroupRepository ──► MSSQL
    │       ├── GroupMemberService ──► MemberRepository ──► MSSQL
    │       └── GroupHistoryService ──► HistoryRepository ──► MSSQL
    │
    └── ApplicationEventPublisher
            └── GroupAuditEvent → F-005 AccessLog (via event listener)
```

**Key interactions:**
- `GroupService` enforces BR-009 (no delete if members exist) before DELETE
- `GroupMemberService` handles many-to-many joins — validates user exists before adding
- `GroupHistoryService` writes audit trail on every create/modify/member change
- Spring `@Transactional` wraps member batch operations (add multiple users)

### 3.2 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `GroupRepository`, `GroupMemberRepository` — Spring Data JPA with custom query methods |
| **DTO Pattern** | `GroupCreateDTO`, `GroupUpdateDTO`, `GroupResponseDTO`, `MemberAddDTO` |
| **Specification Pattern** | Dynamic filtering by `groupType`, `status`, `name` (JPA Criteria API) |
| **Observer Pattern** | `ApplicationEventPublisher` → `GroupAuditEventListener` publishes to F-005 |
| **Factory Pattern** | `GroupCodeFactory` — generates unique group codes (prefix + auto-increment) |
| **Chain of Responsibility** | Delete validation chain: check members → check references → allow/block delete |

### 3.3 Transaction Boundaries

- `@Transactional` on `GroupService.create()` — creates group + initial history entry atomically
- `@Transactional` on `GroupMemberService.addMembers()` — batch member add, rollback on any failure
- `@Transactional(readOnly = true)` on all GET endpoints for read consistency

### 3.4 Validation & Business Rules Enforcement

```
GroupService.create(dto):
  1. Validate unique name/code → ConstraintViolationException
  2. Validate groupType enum → InvalidGroupTypeException
  3. Create entity → save
  4. Write GroupHistory(action=create) → persist
  5. Publish GroupCreatedEvent → audit log

GroupService.delete(id):
  1. Fetch group + count members
  2. If memberCount > 0 → GroupNotEmptyException("Nhóm còn thành viên")
  3. Soft delete (set deletedAt)
  4. Write GroupHistory(action=delete)
```

### 3.5 Database Indexes & Performance

- Unique index on `(name, deleted_at)` — allows restore of deleted group with same name
- Composite index on `(group_type, status)` for type-based queries
- Index on `group_members(group_id, user_id)` for fast membership lookups
- Pagination: `Pageable` with max 100 rows/page

### 3.6 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-data-jpa` | ORM with MSSQL dialect |
| `spring-boot-starter-validation` | Bean validation |
| `spring-boot-starter-security` | Role-based access control |
