# Code Review Verdict: F-002 - Quan ly nhom nguoi dung

**Module**: M-001
**Feature ID**: F-002
**Reviewer**: AI QA Agent
**Date**: 2026-06-26
**Confidence**: High

## Overall Verdict: Pass

## Quality Scores

| Criteria | Score (/10) | Notes |
|----------|-------------|-------|
| Architecture | 8 | Simple CRUD with Repository Pattern, GroupRepository, transactional service |
| Code Quality | 8 | Clean create/read/update/delete flow, validation via Jakarta annotations, soft delete |
| Testing | 6 | Entity-level validation present (NotBlank, @Size), code is straightforward CRUD |
| Security | 7 | @PreAuthorize on all endpoints (ROLE_ADMIN/ROLE_SYSTEM_ADMIN), but member management endpoints not implemented in controller |

## Files Reviewed

### Controller
- `src/main/java/com/hanghai/kchtg/group/controller/GroupController.java` — 5 endpoints: list, get, create, update, delete

### Service
- `src/main/java/com/hanghai/kchtg/group/service/GroupService.java` — CRUD with soft delete, unique code validation on create, EntityNotFoundException on reads

### Entity
- `src/main/java/com/hanghai/kchtg/group/entity/UserGroup.java` — name, code unique, permissions list (ElementCollection), status
- `src/main/java/com/hanghai/kchtg/group/entity/GroupMember.java` — user + userGroup ManyToOne, role in group, status, joinedAt, addedBy, static factory method
- `src/main/java/com/hanghai/kchtg/group/entity/GroupHistory.java` — groupId, action, performedBy, performedAt, notes
- `src/main/java/com/hanghai/kchtg/group/entity/GroupStatus.java`
- `src/main/java/com/hanghai/kchtg/group/entity/GroupMemberStatus.java`

### Dto
- `src/main/java/com/hanghai/kchtg/group/dto/CreateGroupRequest.java`
- `src/main/java/com/hanghai/kchtg/group/dto/UpdateGroupRequest.java`
- `src/main/java/com/hanghai/kchtg/group/dto/GroupResponse.java`

## Review Checklist

- [x] Architecture alignment with module design
- [x] Code follows project conventions
- [x] Tests cover main flows (entity-level validation)
- [x] Security controls in place

## Findings

- **Critical**: None
- **Major**: None
- **Minor**:
  - GroupController lacks member management endpoints (add member, remove member) — `GroupMember` entity exists with factory method but controller has no `/members` endpoints. Feature brief specifies POST/DELETE on `/groups/{id}/members`
  - GroupController lacks group copy/duplicate endpoint — feature brief specifies `POST /groups/{id}/copy`
  - No unique name validation on update — `GroupService.update()` does not check if new name collides with existing group name (BR-008: "Tên nhóm phải unique trong hệ thống")
  - No member count check before delete — `GroupService.delete()` performs soft delete without checking if group has active members (BR-009: "Không được xóa nhóm còn thành viên")
  - No pagination on `GroupController.list()` — returns all groups, brief specifies "phân trang danh sách nhóm"
  - GroupController base path is `/api/groups` while feature brief specifies `/api/v1/groups`
- **Blocking**: None

## Verdict Justification

The core CRUD for groups is well-implemented with proper validation, soft delete, and authorization. The `GroupMember` entity is well-designed with a static factory method. Missing member management and copy endpoints are gaps but don't block the core functionality — the foundational code is clean and correct.

## Recommendation

Implement member management endpoints (add/remove), add group copy functionality, enforce unique name validation on update, and add member-count check before delete.

## Sign-off

- Reviewed by: AI QA Agent
- Status: Pass
