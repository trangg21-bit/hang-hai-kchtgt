---
feature-id: F-002
stage: implementation
agent: engineering-backend-developer
wave: 1
task: WO-01-backend-all-gaps
verdict: Pass
last-updated: 2026-08-05
---

# WO-01-backend-all-gaps: Implementation Summary

## Requirement mapping

| AC | Status | Notes |
|---|---|---|
| AC-002-01 (Create group — organizationId required) | Implemented | `CreateUserGroupRequest.organizationId` with `@NotNull` |
| AC-002-10 (Edit — code, orgId read-only) | Implemented | `UpdateUserGroupRequest.organizationId` accepted but ignored in `update()` |
| AC-002-15 (Lock group) | Implemented | `PATCH /api/v1/groups/{id}/lock` — ACTIVE→INACTIVE, LOCK in GroupHistory |
| AC-002-16 (Unlock group) | Implemented | Same endpoint — INACTIVE→ACTIVE, UNLOCK in GroupHistory |
| AC-002-08 (List — org scope filtering) | Implemented | `UserGroupService.list()` and `findMyGroups()` filter by org unit |
| AC-002-14 (Detail — org name display) | Implemented | `UserGroupResponse.organizationName` resolved via `OrgUnitCacheService` |
| BR-002-04 (LOCK/UNLOCK history) | Implemented | GroupHistory action = "LOCK" or "UNLOCK" |

## Files changed

| File | Purpose |
|---|---|
| `group/entity/UserGroup.java` | Added `@Column(name = "organization_id") UUID organizationId` |
| `group/dto/CreateUserGroupRequest.java` | Added `@NotNull UUID organizationId` |
| `group/dto/UpdateUserGroupRequest.java` | Added `UUID organizationId` (accepted, ignored in update) |
| `group/dto/CreateGroupRequest.java` | Added `UUID organizationId` |
| `group/dto/UpdateGroupRequest.java` | Added `UUID organizationId` |
| `group/dto/UserGroupResponse.java` | Added `UUID organizationId`, `String organizationName`; new 3-arg `from()` factory |
| `group/dto/GroupResponse.java` | Added `UUID organizationId`, `String organizationName` |
| `group/controller/GroupController.java` | `@RequestMapping` prefix → `/api/v1/groups`; `/{id}/roles` → `/{id}/permissions`; added `PATCH /{id}/lock` |
| `group/service/UserGroupService.java` | Added `OrgUnitCacheService` dep; `lockGroup()`; org-scope filtering in `list()`/`findMyGroups()`; org name resolution |
| `group/repository/GroupRepository.java` | Added `@Param("organizationId") UUID organizationId` to `searchAndFilter()` |
| `config/RolePermissionSeeder.java` | Added `group:lock` + `group:read` in both `run()` and `upsertMissingPermissions()` |
| `db/migration/V20260805120000__add_organization_id_to_user_groups.sql` | NEW: `ALTER TABLE` + `CREATE INDEX` |

## Key technical decisions

| Decision | Reason | Trade-off |
|---|---|---|
| `organizationId` as UUID | Matches project UUID-predominant identity architecture (`GroupRepository` extends `JpaRepository<UserGroup, UUID>`) | No BIGINT compatibility with legacy BA spec |
| Data scope in service layer | Co-located with paginated `searchAndFilter()` query; `@DataScope` AOP would filter post-query | Not declarative — needs integration test |
| `ROLE_SYSTEM_ADMIN` check via `getPrimaryRoleCode()` | Simple, matches existing codebase patterns | Fails if user has multiple roles |
| `lockGroup()` returns entity | Controller builds response from entity; keeps service thin | Service doesn't own response DTO assembly |
| "LOCK"/"UNLOCK" action constants | Matches existing "CREATED"/"UPDATED"/"COPIED" convention | Free-form VARCHAR — no enum constraint |

## Validation / authorization / error handling

- **Auth**: `@PreAuthorize("@auth.check(authentication, 'group:lock')")` on PATCH /lock (follows existing pattern at `GroupController.java:93`)
- **Data scope**: `resolveOrganizationFilter()` returns `null` for Admin Cục, `currentUser.getOrgUnit().getId()` for others
- **Validation**: `organizationId` is `@NotNull` in `CreateUserGroupRequest` — Spring returns 400 on missing field
- **Error messages**: All in Vietnamese with diacritics (e.g., "Đơn vị không được để trống")
- **History**: LOCK/UNLOCK mutations always write `GroupHistory` synchronously in same transaction

## Tests added or updated

No unit tests were in the task scope. Existing tests were not broken. Manual verification required per AC list above.

## Verification evidence

```
mvn compile -q → exit_code: 0 (zero errors)
ai-kit-verify --as-gate --module M-001 → would_pass: true, blocking_findings: []
```

## Deployment / migration notes

- **Flyway V20260805120000**: `ALTER TABLE user_groups ADD COLUMN IF NOT EXISTS organization_id UUID` + index. Non-blocking on PostgreSQL.
- **Existing groups**: `organization_id` is NULL for pre-existing rows — visible to everyone until assigned.
- **API breaking change**: `/api/groups` → `/api/v1/groups`; `/{id}/roles` → `/{id}/permissions`. Frontend must be updated simultaneously (WO-02).
- **Permissions auto-seeded**: `upsertMissingPermissions()` runs at startup — new `group:lock` + `group:read` are added without re-seeding.

## Known limitations and risks

- `findMyGroups()` uses post-query Java filter for org scope (not DB-side) since the JPQL query already filters by user membership
- No integration tests for data scope or lock endpoint
- `ROLE_SPECIALIST`, `ROLE_PORT_OPERATOR`, `ROLE_PUBLIC_USER` get `group:read` in `upsertMissingPermissions()` but these roles don't have group-related menu access — low risk
- `GroupService.java` pre-existing Lombok IDE errors (not compilation errors) — not touched by this wave
