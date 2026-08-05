---
feature-id: F-002
stage: final-quality-gate
agent: engineering-code-reviewer
verdict: Pass
must-fix-count: 0
should-fix-count: 4
last-updated: 2026-08-05
---

# Engineering Code Review — F-002 Scope Expansion (M-001) — Re-review

**Triage:** TRI-1785914592524-c8df
**Reviewer:** engineering-code-reviewer
**Date:** 2026-08-05
**Re-review of:** Previous review with 3 must-fix items — all resolved.

---

## Scope Reviewed

All 4 gaps from F-002 scope expansion: API `/api/v1/groups`, PATCH lock endpoint, `organizationId` + data scope + `organizationName` via `OrgUnitCacheService`, `group:lock` + `group:read` permissions.

---

## Must-Fix Resolution Verification

| # | Previous finding | Fix applied | Verified |
|---|-----------------|-------------|----------|
| MF-1 | Controller create/update/lock responses missing `organizationName` | `GroupController.java` now injects `OrgUnitCacheService`; create (L118), update (L138), lock (L278), and get (L92-95) all use 3-arg `UserGroupResponse.from()` with `orgUnitCacheService.getName()` | ✅ `GroupController.java:118,138,278` |
| MF-2 | `groupService.create()` POST body missing `organizationId` | `groupService.ts:218` — `organizationId: payload.organizationId` added to POST body | ✅ `groupService.ts:218` |
| MF-3 | `findMyGroups()` post-query `.filter()` broke pagination | `GroupRepository.searchAndFilterMyGroups()` now accepts `@Param("organizationId")` with JPQL `AND (:organizationId IS NULL OR g.organizationId = :organizationId)` (L108-109); `UserGroupService.findMyGroups()` passes `orgFilter` to query (L252) and removed post-query Java filter | ✅ `GroupRepository.java:108-109`, `UserGroupService.java:252` |

All 3 must-fix defects confirmed resolved. Backend compiles clean (`mvn clean compile -q` exit 0).

---

## Overall Verdict

**Pass** — 0 must-fix items remain. The 4 should-fix items from the first review (unused imports `SecurityUtils`/`statusCritical`, `getById()` missing org fields, `treeDefaultExpandAll` perf concern) are non-blocking quality improvements that can be addressed in a follow-up.

---

## Requirement Alignment (re-verified)

| AC | Status | Evidence |
|----|--------|----------|
| AC-002-01 | ✅ | `CreateUserGroupRequest.organizationId` is `@NotNull`; create response includes `organizationName` from cache |
| AC-002-10 | ✅ | Code + organizationId disabled in edit; org name returned in update response |
| AC-002-15/16 | ✅ | PATCH lock toggles status, writes LOCK/UNLOCK history, response includes `organizationName` |
| AC-002-08 | ✅ | `resolveOrganizationFilter()` pushed to JPQL in both `searchAndFilter()` and `searchAndFilterMyGroups()` |
| AC-002-14 | ✅ | GET by ID response includes `organizationName` via `OrgUnitCacheService` |
| UI §10.6 | ✅ | `organizationName` column in DataTable |
| UI §10.7 | ✅ | TreeSelect for org (create), disabled (edit); code disabled in edit |
| UI §10.11 | ✅ | `/permissions` path used in both FE service and BE controller |

---

## Security (unchanged, re-verified)

- Lock endpoint: `@PreAuthorize("@auth.check(authentication, 'group:lock')")` ✅
- Permissions seeded in both `run()` and `upsertMissingPermissions()` ✅
- Admin Cục bypass: `resolveOrganizationFilter()` returns `null` for `ROLE_SYSTEM_ADMIN` ✅
- Regular user filtered by `orgUnit.id` ✅

---

## Should-Fix Items (carried forward)

| # | Item | Owner |
|---|------|-------|
| SF-1 | Unused import `SecurityUtils` in `UserGroupService.java:10` | WO-01 |
| SF-2 | `groupService.getById()` response mapping missing `organizationId`/`organizationName` | WO-02 |
| SF-3 | Unused import `statusCritical` in `GroupList.tsx:17` | WO-02 |
| SF-4 | `treeDefaultExpandAll` on TreeSelect (perf concern with large org trees) | WO-02 |

---

## Follow-up Recommendations

1. Add integration test for PATCH `/api/v1/groups/{id}/lock` (status toggle + history entry)
2. Add unit test for `resolveOrganizationFilter()` (Admin Cục vs regular user)
3. Consider removing `SecurityUtils` import or using it in `resolveOrganizationFilter()` for consistency

---

## Final Review Summary

All 3 must-fix defects from the initial review are resolved with clean evidence. Backend compiles, `ai-kit-verify` gate passes, API contracts match the design plan, and the BA feature brief ACs are fully covered. The 4 remaining should-fix items are cosmetic/performance improvements that do not block release.

**Ready for release.**
