# Tech Lead Plan: F-002 — Quản lý nhóm người dùng

## 1. Implementation Tasks

### Backend Tasks (Estimated: 2–3 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 1.1 | Entity: `UserGroup.java` | `src/main/java/vn/eg/haihang/model/entity/UserGroup.java` | Low |
| 1.2 | Entity: `GroupMember.java` | `src/main/java/vn/eg/haihang/model/entity/GroupMember.java` | Low |
| 1.3 | Entity: `GroupHistory.java` | `src/main/java/vn/eg/haihang/model/entity/GroupHistory.java` | Low |
| 1.4 | Repository: `UserGroupRepository.java` | `src/main/java/vn/eg/haihang/repository/UserGroupRepository.java` | Medium |
| 1.5 | Repository: `GroupMemberRepository.java` | `src/main/java/vn/eg/haihang/repository/GroupMemberRepository.java` | Medium |
| 1.6 | Repository: `GroupHistoryRepository.java` | `src/main/java/vn/eg/haihang/repository/GroupHistoryRepository.java` | Low |
| 1.7 | DTO: `GroupCreateDTO`, `GroupUpdateDTO`, `GroupResponseDTO`, `MemberAddDTO` | `src/main/java/vn/eg/haihang/dto/` | Low |
| 1.8 | Service: `GroupService.java` | `src/main/java/vn/eg/haihang/service/GroupService.java` | High |
| 1.9 | Service: `GroupMemberService.java` | `src/main/java/vn/eg/haihang/service/GroupMemberService.java` | Medium |
| 1.10 | Service: `GroupHistoryService.java` | `src/main/java/vn/eg/haihang/service/GroupHistoryService.java` | Low |
| 1.11 | Factory: `GroupCodeFactory.java` | `src/main/java/vn/eg/haihang/factory/GroupCodeFactory.java` | Low |
| 1.12 | Controller: `GroupController.java` | `src/main/java/vn/eg/haihang/controller/GroupController.java` | High |
| 1.13 | Event: `GroupAuditEventListener.java` | `src/main/java/vn/eg/haihang/event/GroupAuditEventListener.java` | Medium |
| 1.14 | Exception: Custom exceptions (GroupNotEmptyException, etc.) | `src/main/java/vn/eg/haihang/exception/` | Low |
| 1.15 | Config: Rate limiting, group type validation | `src/main/resources/application.yml` | Low |

### Frontend Tasks (Estimated: 1.5–2 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 2.1 | API client: `groupApi.ts` | `src/services/api/groupApi.ts` | Medium |
| 2.2 | Type definitions: `groupTypes.ts` | `src/types/groupTypes.ts` | Low |
| 2.3 | Hook: `useGroups.ts` (pagination, filtering) | `src/hooks/useGroups.ts` | Medium |
| 2.4 | Page: `GroupListPage.tsx` | `src/pages/admin/GroupListPage.tsx` | High |
| 2.5 | Page: `GroupDetailPage.tsx` | `src/pages/admin/GroupDetailPage.tsx` | Medium |
| 2.6 | Page: `GroupCreatePage.tsx` | `src/pages/admin/GroupCreatePage.tsx` | Medium |
| 2.7 | Component: `GroupTable.tsx` | `src/components/admin/GroupTable.tsx` | Medium |
| 2.8 | Component: `GroupForm.tsx` | `src/components/admin/GroupForm.tsx` | Medium |
| 2.9 | Component: `MemberManagementModal.tsx` | `src/components/admin/MemberManagementModal.tsx` | High |
| 2.10 | Component: `GroupHistoryTimeline.tsx` | `src/components/admin/GroupHistoryTimeline.tsx` | Medium |
| 2.11 | Routing: add admin routes in `App.tsx` | `src/App.tsx` | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/groups` | `GroupController.listGroups()` | system-admin |
| GET | `/api/v1/groups/{id}` | `GroupController.getGroupById()` | system-admin |
| POST | `/api/v1/groups` | `GroupController.createGroup()` | system-admin |
| PUT | `/api/v1/groups/{id}` | `GroupController.updateGroup()` | system-admin |
| DELETE | `/api/v1/groups/{id}` | `GroupController.deleteGroup()` | system-admin |
| GET | `/api/v1/groups/search` | `GroupController.searchGroups()` | system-admin |
| GET | `/api/v1/groups/{id}/members` | `GroupController.getGroupMembers()` | system-admin |
| POST | `/api/v1/groups/{id}/members` | `GroupController.addMembers()` | system-admin |
| DELETE | `/api/v1/groups/{id}/members/{userId}` | `GroupController.removeMember()` | system-admin |
| PUT | `/api/v1/groups/{id}/members/{userId}` | `GroupController.updateMemberRole()` | system-admin |
| POST | `/api/v1/groups/{id}/duplicate` | `GroupController.duplicateGroup()` | system-admin |
| GET | `/api/v1/users/{id}/groups` | `GroupController.getUserGroups()` | system-admin |
| GET | `/api/v1/groups/{id}/history` | `GroupController.getGroupHistory()` | system-admin |

---

## 3. Component Structure

```
src/
├── pages/
│   └── admin/
│       ├── GroupListPage.tsx          ← Bảng nhóm với filter type/status
│       ├── GroupDetailPage.tsx        ← Chi tiết nhóm + tab thành viên
│       └── GroupCreatePage.tsx        ← Form tạo nhóm mới
├── components/
│   └── admin/
│       ├── GroupTable.tsx             ← Bảng phân trang Ant Design
│       ├── GroupForm.tsx              ← Form (name, code auto, type, description)
│       ├── MemberManagementModal.tsx  ← Modal đa chọn user + role_in_group
│       └── GroupHistoryTimeline.tsx   ← Timeline lịch sử thay đổi
├── hooks/
│   └── useGroups.ts                   ← React Query hook (list, get, create, members)
├── services/
│   └── api/
│       └── groupApi.ts                ← axios instance + group endpoints
├── types/
│   └── groupTypes.ts                  ← UserGroup, GroupMember, GroupHistory interfaces
└── App.tsx                            ← Router thêm routes admin/groups/*
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-002_init_user_groups.sql
```sql
-- User Groups table
CREATE TABLE user_groups (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description NVARCHAR(1000),
    group_type VARCHAR(30) NOT NULL CHECK (group_type IN ('department', 'project', 'custom')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by BIGINT FOREIGN KEY REFERENCES user_accounts(id),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    deleted_at DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX idx_user_groups_code ON user_groups(code);
CREATE INDEX idx_user_groups_name ON user_groups(name);
CREATE INDEX idx_user_groups_type ON user_groups(group_type);
CREATE INDEX idx_user_groups_status ON user_groups(status);
CREATE UNIQUE INDEX idx_user_groups_name_deleted ON user_groups(name, deleted_at)
    WHERE deleted_at IS NOT NULL;

CREATE TRIGGER trg_user_groups_updated
ON user_groups
AFTER UPDATE
AS
BEGIN
    UPDATE user_groups SET updated_at = SYSUTCDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO
```

### V2__F-002_init_group_members.sql
```sql
-- Group Members junction table
CREATE TABLE group_members (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    group_id BIGINT NOT NULL FOREIGN KEY REFERENCES user_groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL FOREIGN KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
    role_in_group VARCHAR(50) DEFAULT 'member' CHECK (role_in_group IN ('admin', 'member', 'observer')),
    joined_by BIGINT FOREIGN KEY REFERENCES user_accounts(id),
    joined_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    left_at DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX idx_group_members_group_user ON group_members(group_id, user_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
```

### V3__F-002_init_group_histories.sql
```sql
-- Group History audit trail
CREATE TABLE group_histories (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    group_id BIGINT NOT NULL FOREIGN KEY REFERENCES user_groups(id) ON DELETE CASCADE,
    performed_by BIGINT FOREIGN KEY REFERENCES user_accounts(id),
    action VARCHAR(30) NOT NULL CHECK (action IN ('create', 'modify', 'memberAdd', 'memberDelete', 'statusChange')),
    details NVARCHAR(1000),  -- JSON diff
    performed_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

CREATE INDEX idx_group_histories_group_id ON group_histories(group_id);
CREATE INDEX idx_group_histories_performed_at ON group_histories(performed_at);
```

---

## 5. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + Repository | Low | Standard JPA, one-to-many relationships |
| Service Layer | Medium | Member batch operations, transaction boundaries |
| Delete validation | Medium | Chain of responsibility: check members → check references |
| Frontend (Group CRUD) | Medium | Table with type filter, form, duplicate action |
| Frontend (Member Management) | High | Multi-select user picker with role assignment |
| **Overall** | **Medium** | Business rules around member deletion add complexity |

---

## 6. Sprint Breakdown (Wave 1)

| Sprint | Tasks | Deliverable |
|---|---|---|
| Sprint 1 (Days 1–2) | Entities, Repositories, DTOs, V1–V3 migrations | DB schema ready |
| Sprint 2 (Days 3–4) | GroupService, GroupMemberService, GroupController | Group CRUD + member management APIs |
| Sprint 3 (Days 5) | GroupHistoryService, audit events | Audit trail working |
| Sprint 4 (Days 6–7) | Frontend: GroupListPage, GroupTable, GroupForm, APIs | Group CRUD UI complete |
| Sprint 5 (Days 8) | Frontend: MemberModal, GroupDetailPage, HistoryTimeline | Member management UI |
| Sprint 6 (Day 9) | Integration testing, E2E tests | Feature ready for QA |
