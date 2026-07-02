---
feature-id: M-003
stage: execution-planning
agent: sdlc-tech-lead
verdict: Ready for development
waves: 2
last-updated: "2026-07-01"
---

# Technical Lead Execution Report — M-003 Quản lý tài sản KCHTGT - Khu nước & VTS

**Mode: CODE-AS-TRUTH — targeted gap/fix wave plan. Implementation exists (~64 Java + 12 tests). Plan targets SA-found defects only.**

---

## 1. Change Overview

### 1.1 Business Goal
Close 4 security/consistency defects found by SA in the as-built M-003 implementation across 5 asset domains (Lượng hàng hải, Đê/Kè, Cơ sở sửa chữa & đóng tàu, Trạm radar, Hệ thống VTS — F-038..F-067).

### 1.2 Approved Scope
- SF-001 CRITICAL: Add @PreAuthorize to all 9 TramRadarController endpoints
- SF-002 HIGH: Add @PreAuthorize to all 9 CoSuaChuaDongTauController endpoints
- SF-003 MEDIUM: Normalize permission code style to colon format across all 5 domains + seeder
- SF-004 LOW: Refactor TramRadar + CoSuaChua controllers to return ApiResponse<T> (match LuongHangHai/DeKe/VTS pattern)
- QA: Security deny-path tests for all 5 domains; RBAC permission seeding for 35 M-003 codes

### 1.3 Out-of-Scope
- GeoServer/GIS integration (Phase-1 exclusion; kinhDo/viDo fields retained but unused)
- Notification on approval events
- Redis caching, Kafka
- Enum deduplication (5 domain-local enums — acceptable Phase-1 technical debt)
- New Flyway schema migrations (all tables exist; no DDL changes)

### 1.4 Architectural Direction to Preserve
- 5 decoupled bounded contexts — no cross-domain FKs
- `@auth.check(authentication, 'domain:action')` expression pattern via global auth bean (M-001)
- ApiResponse<T> wrapper for all controller responses (after SF-004 fix)
- Layered architecture: Controller → Service → Repository → MSSQL

---

## 2. Requirement-to-Execution Mapping

| Requirement / Finding | Execution Area | Notes |
|---|---|---|
| SF-001 TramRadar missing @PreAuthorize (9 endpoints) | TramRadarController.java | Pattern: LuongHangHaiController |
| SF-002 CoSuaChua missing @PreAuthorize (9 endpoints) | CoSuaChuaDongTauController.java | Same pattern |
| SF-003 Hyphen vs colon in approve permission codes | LuongHangHaiController, DeKeController, RolePermissionSeeder | luonghanghai/deke use `approve-c1`; normalize to `approve:c1` |
| SF-004 TramRadar/CoSuaChua return raw String | TramRadarController, CoSuaChuaDongTauController | Wrap all returns in ApiResponse<T> |
| RBAC seeding missing for all 35 M-003 codes | RolePermissionSeeder.java | No tramradar/cosuachua/deke/luonghanghai/vts entries exist |
| Test: security deny-path coverage | TramRadarControllerTest, CoSuaChuaDongTauControllerTest | Existing tests lack @PreAuthorize / 403 assertions |

---

## 3. Implementation Scope

### 3.1 In-Scope Engineering Work
- 2 controller files: add @PreAuthorize + ApiResponse<T> (SF-001, SF-002, SF-004)
- 2 controller files: normalize permission codes (SF-003: luonghanghai approve-c1 → approve:c1, deke approve-c1 → approve:c1)
- 1 seeder file: add all 35 M-003 permission codes + role assignments
- 5 test files: add/extend RBAC security deny-path tests for all 5 domains
- Optional: add ApiResponse import to tramradar/cosuachua DTOs if not already present

### 3.2 Out-of-Scope Engineering Work
- Entity changes, new migrations, new service methods
- Frontend changes
- DevOps/infra changes (no new env vars, tables, containers)

---

## 4. Impacted Areas Analysis

### 4.1 Backend / Service Impact
- TramRadarController: add @PreAuthorize (9 methods) + wrap return types
- CoSuaChuaDongTauController: add @PreAuthorize (9 methods) + wrap return types
- LuongHangHaiController: normalize 2 permission codes (approve-c1 → approve:c1, approve-c2 → approve:c2)
- DeKeController: normalize 2 permission codes (same)
- RolePermissionSeeder: add 35 permission code entries + role bindings for M-003

### 4.2 Frontend / UI Impact
- None (API contracts unchanged; response body shape changes from raw String to ApiResponse<T> wrapper — frontend already handles ApiResponse from VTS/LuongHangHai)

### 4.3 Database / Persistence Impact
- None — no DDL changes, no Flyway migrations required

### 4.4 API / Event / Contract Impact
- TramRadar + CoSuaChua error responses change from `"Lỗi khi..."` plain string to `ApiResponse{success:false, message:...}`. This is a breaking change for any client currently consuming raw strings from these 2 controllers.
- Permission codes in approve endpoints change canonical spelling (hyphen → colon) — must match seeder atomically

### 4.5 Auth / Permission Impact
- 18 endpoints gain @PreAuthorize enforcement (9 TramRadar + 9 CoSuaChua)
- 4 existing codes normalized (luonghanghai/deke approve-c1/c2 → approve:c1/c2)
- 35 M-003 permission codes added to RolePermissionSeeder
- Canonical format: `domain:action` for simple ops, `domain:approve:c1` / `domain:approve:c2` for approvals

### 4.6 Logging / Audit Impact
- No changes to PheDuyetLichSu audit trail logic
- TramRadar/CoSuaChua controllers already use @Slf4j log.error — no change needed

### 4.7 Deployment / Runtime Impact
- No new services, containers, or env vars
- No schema migrations
- **DevOps review NOT required** for this targeted fix wave
- Runtime note: RolePermissionSeeder runs at application startup via @PostConstruct / ApplicationRunner — permission codes take effect on next deploy restart. No downtime migration needed.

---

## 5. Task Breakdown

| Task | Description | Dependency | Owner Type | Wave | Parallelizable | Risk Level |
|---|---|---|---|---|---|---|
| W1-T1 | Add @PreAuthorize + ApiResponse<T> to TramRadarController (9 endpoints); normalize `tramradar:approve:c1` codes | None | sdlc-dev | W1 | Yes | High |
| W1-T2 | Add @PreAuthorize + ApiResponse<T> to CoSuaChuaDongTauController (9 endpoints); normalize `cosuachua:approve:c1` codes | None | sdlc-dev | W1 | Yes | High |
| W1-T3 | Normalize approve permission codes in LuongHangHaiController + DeKeController (hyphen→colon); add 35 M-003 entries to RolePermissionSeeder | None | sdlc-dev | W1 | Yes | Medium |
| W2-T1 | Write/extend RBAC security deny-path tests for TramRadar + CoSuaChua (post-W1 fix); extend luonghanghai/deke/vts tests for normalized codes | W1 complete | sdlc-qa | W2 | Yes | Medium |

---

## 6. Execution Sequence

| Step | Action | Dependency | Notes |
|---|---|---|---|
| 1 | W1-T1: TramRadarController security + response fix | None | Parallel with T2, T3 |
| 2 | W1-T2: CoSuaChuaDongTauController security + response fix | None | Parallel with T1, T3 |
| 3 | W1-T3: Normalize LuongHangHai/DeKe codes + seed all 35 M-003 permissions | None | Parallel with T1, T2; seeder must reflect final colon-format codes |
| 4 | W2-T1: RBAC security tests for all 5 domains | W1 complete | Verify 403 on unauthorized, 200 on authorized |

---

## 7. Technical Dependencies

| Dependency | Why It Matters | Constraint / Risk |
|---|---|---|
| `@auth.check` Spring bean (M-001) | All @PreAuthorize expressions depend on this custom bean | Must be registered in Spring context; verify M-001 is loaded in test context |
| ApiResponse<T> class | TramRadar/CoSuaChua controllers must import the existing wrapper | Class exists in codebase (used by LuongHangHai/DeKe/VTS); verify package path |
| RolePermissionSeeder startup order | Seeds at startup; new codes effective after deploy restart | Idempotent seed pattern must handle re-runs (check existing `seedPermission` signature) |
| Test context mock for @PreAuthorize | Security tests need `@WithMockUser` or `@WithSecurityContext` with correct authority string | Pattern from cangben/BenCangRbacSecurityTest.java is the reference |

---

## 8. Implementation Risks

| Risk | Why It Matters | Mitigation |
|---|---|---|
| ApiResponse<T> import path unknown for tramradar/cosuachua | Wrong import breaks compilation | Verify package from LuongHangHaiController before applying |
| RolePermissionSeeder `seedPermission` method signature | Adding wrong arg count/types causes startup failure | Read existing seeder method signature before adding M-003 entries |
| Permission code normalization breaks existing VTS `approve:c1` (already colon) | VTS already uses colon — must NOT double-change | W1-T3 touches only luonghanghai + deke; VTS + tramradar + cosuachua already correct after W1-T1/T2 |
| `authentication != null ? ... : "system"` fallback in TramRadarController | With @PreAuthorize, unauthenticated requests will be rejected before controller logic; null-check becomes dead code | Safe to leave as defensive code; no removal needed |
| Test context missing method security config | @PreAuthorize tests need `@EnableMethodSecurity` in test config | Reference `cangben/MethodSecurityTestConfig.java` pattern |

---

## 9. Developer Guidance

### 9.1 Module-Level Guidance

**Reference pattern (correct):** `LuongHangHaiController.java`
- Uses `@PreAuthorize("@auth.check(authentication, 'luonghanghai:create')")` on each method
- Returns `ApiResponse.success(data)` / `ApiResponse.error(message)` from wrapper class
- Permission code format: `domain:action` for CRUD, `domain:approve:c1` / `domain:approve:c2` for approvals

**Anti-pattern (to fix):** `TramRadarController.java` + `CoSuaChuaDongTauController.java`
- No @PreAuthorize at all
- Returns `ResponseEntity.ok(rawObject)` and `ResponseEntity.badRequest().body("String message")`

**W1-T1 TramRadarController — 9 @PreAuthorize to add:**

| Method | Permission Code |
|---|---|
| POST / (create) | `tramradar:create` |
| GET /{id} | `tramradar:read` |
| GET / (findAll) | `tramradar:read` |
| PUT /{id} | `tramradar:update` |
| DELETE /{id} | `tramradar:delete` |
| POST /{id}/approve/c1 | `tramradar:approve:c1` |
| POST /{id}/approve/c2 | `tramradar:approve:c2` |
| GET /{id}/history | `tramradar:history` |
| GET /search | `tramradar:read` |

**W1-T2 CoSuaChuaDongTauController — 9 @PreAuthorize to add:**

| Method | Permission Code |
|---|---|
| POST / (create) | `cosuachua:create` |
| GET /{id} | `cosuachua:read` |
| GET / (findAll) | `cosuachua:read` |
| PUT /{id} | `cosuachua:update` |
| DELETE /{id} | `cosuachua:delete` |
| POST /{id}/approve/c1 | `cosuachua:approve:c1` |
| POST /{id}/approve/c2 | `cosuachua:approve:c2` |
| GET /{id}/history | `cosuachua:history` |
| GET /search | `cosuachua:read` |

**W1-T3 LuongHangHaiController + DeKeController — 4 codes to normalize (2 per controller):**
- `luonghanghai:approve-c1` → `luonghanghai:approve:c1`
- `luonghanghai:approve-c2` → `luonghanghai:approve:c2`
- `deke:approve-c1` → `deke:approve:c1`
- `deke:approve-c2` → `deke:approve:c2`

**W1-T3 RolePermissionSeeder — add 35 M-003 permission codes:**

Domains × actions: luonghanghai, deke, cosuachua, tramradar, vts × {create, read, update, delete, approve:c1, approve:c2, history} = 35 codes.

Role bindings to add (matching SA section 5.5):
- `SPECIALIST` role: `{domain}:create`, `{domain}:update`, `{domain}:delete`, `{domain}:history` for all 5 domains
- `LEADER_C1` role: `{domain}:approve:c1` for all 5 domains
- `LEADER_C2` role: `{domain}:approve:c2` for all 5 domains
- `ADMIN` role: all 35 codes
- All internal roles: `{domain}:read` for all 5 domains

### 9.2 Design Compliance
- No frontend/designer involvement in this fix wave.

### 9.3 Coding Guardrails
1. Do NOT remove the `authentication != null ? authentication.getName() : "system"` null-check in existing methods — it becomes dead code with @PreAuthorize but is harmless
2. Do NOT add @PreAuthorize at the class level (`@RequestMapping`) — method-level only, matching existing pattern
3. Normalize permission codes atomically: seeder codes and @PreAuthorize strings must match exactly — use colon format throughout
4. ApiResponse<T> wrapper: verify the correct class import path from an existing controller (luonghanghai package) before applying
5. Seeder: use the existing `seedPermission` helper method — do not inline raw SQL or create new PermissionRepository calls outside the established pattern

### 9.4 Failure Cases to Handle
- `IllegalStateException` in approveC1/C2 when state machine rejects transition: already handled in service layer; controller catch block must wrap in `ApiResponse.error(e.getMessage())`
- ResourceNotFoundException when entity not found by id: wrap in ApiResponse.error with HTTP 404 (check if LuongHangHai pattern uses 404 or 400 for not-found)
- Permission check rejection (@PreAuthorize): Spring throws `AccessDeniedException` → handled globally by Spring Security filter → 403 response; no change needed in controller

### 9.5 Test Expectations for Developers
- Compile-run after W1-T1 + W1-T2: existing controller tests should still pass (same business logic, only wrapper added)
- Verify: `mvn test -pl . -Dtest=TramRadarControllerTest,CoSuaChuaDongTauControllerTest` passes before handing off to W2-T1

---

## 10. QA Guidance

### 10.1 High-Risk Areas
- 18 newly protected endpoints (TramRadar × 9 + CoSuaChua × 9) — verify 403 returned to callers without the correct permission
- 4 normalized permission codes (luonghanghai/deke approve-c1/c2) — regression: existing approve calls must still work after rename

### 10.2 Edge Cases to Validate
- Call TramRadar/CoSuaChua endpoints with no auth token → expect 401
- Call with valid auth but without `tramradar:approve:c1` permission → expect 403
- Call with `tramradar:approve-c1` (hyphen, old style) after normalization → expect 403 (old code no longer valid)
- Call luonghanghai approve/c1 with `luonghanghai:approve:c1` (colon, new) → expect 200
- Approval state machine: cannot call approve/c2 before approve/c1 completes

### 10.3 Regression Focus Areas
- LuongHangHai + DeKe + VTS endpoints: must continue returning 200 after permission code rename (seeder re-run must be idempotent)
- All 50 M-003 endpoints: verify ApiResponse<T> structure present in all responses

### 10.4 Permission / Integration / Error Cases
- Permission seeder idempotency: restart app twice; confirm no duplicate permission rows
- test security config: confirm `@EnableMethodSecurity(prePostEnabled = true)` active in test context (reference `cangben/MethodSecurityTestConfig.java`)
- Error path: delete non-existent ID → ApiResponse.error with meaningful message, not stack trace

---

## 11. Migration / Rollout / Rollback Notes

- No DB schema changes — no Flyway migration required, no downtime window
- Permission seeder runs at startup — new M-003 codes active after first deploy restart
- Rollback: revert W1-T1/T2/T3 commits; redeploy — endpoints return to unprotected state (same as before)
- GeoServer Phase-1 exclusion: `kinhDo`/`viDo` on TramRadar entity retain nullable columns for future Phase-2 GIS hookup — no action required now

---

## 12. DevOps Dependency Check

No DevOps triggers flagged in section 4.7. sdlc-devops routing NOT required.

---

## 13. Designer Dependency Check

No UI changes in this fix wave. Designer handoff NOT required.

---

## 14. Open Execution Questions

| Question | Why It Matters | Suggested Owner |
|---|---|---|
| Does global Spring Security config block unauthenticated requests before controller? | If yes, @PreAuthorize is defense-in-depth; if no, it is the only gate | sdlc-dev to verify SecurityConfig.java during W1 |
| ApiResponse<T> full class path? | W1-T1/T2 need exact import | sdlc-dev to grep from LuongHangHaiController on first task |
| Does `seedPermission` helper accept `domain:approve:c1` with colon in action segment? | RolePermissionSeeder may tokenize by colon — need to verify | sdlc-dev to read seedPermission signature before W1-T3 |
| A-002 dual-role (C1 vs C2) — which Spring role name maps to each? | Seeder must bind correct role to approve:c1 vs approve:c2 | Non-blocking for Phase 1 — use LEADER_C1 / LEADER_C2 role slugs pending M-001 confirmation |

---

## 15. Execution Readiness Verdict

**Ready for development**

- 4 targeted fix tasks across 2 waves
- W1 (3 tasks) parallelizable; W2 (1 QA task) depends on W1
- No blocking dependencies; no schema migrations; no DevOps triggers
- Security fixes SF-001 + SF-002 are pre-production blockers — must complete before any production deploy of M-003
- implementations.yaml.services[] write-back: completed (see wave-plan.yaml services entries)

---

## Tech Lead Handoff Summary

**Verdict:** Ready for development

**Wave structure:** Wave 1: 3 tasks (parallel), Wave 2: 1 task (QA, after W1)

**Wave 1 ownership boundaries:**
- W1-T1 → `src/main/java/com/hanghai/kchtg/tramradar/controller/TramRadarController.java` only
- W1-T2 → `src/main/java/com/hanghai/kchtg/cosuachua/controller/CoSuaChuaDongTauController.java` only
- W1-T3 → `src/main/java/com/hanghai/kchtg/luonghanghai/controller/LuongHangHaiController.java`, `src/main/java/com/hanghai/kchtg/deke/controller/DeKeController.java`, `src/main/java/com/hanghai/kchtg/config/RolePermissionSeeder.java`

**Wave 2 ownership boundaries:**
- W2-T1 → `src/test/java/com/hanghai/kchtg/tramradar/controller/TramRadarControllerTest.java`, `src/test/java/com/hanghai/kchtg/cosuachua/controller/CoSuaChuaDongTauControllerTest.java`, extend luonghanghai/deke/vts test files

**Coding guardrails:**
1. Method-level @PreAuthorize only — never class-level
2. Permission code format: `domain:approve:c1` (colon) — no hyphens
3. Use existing ApiResponse<T> class from luonghanghai package — verify import before applying
4. Use existing `seedPermission` helper in RolePermissionSeeder — read signature first
5. Do NOT touch service layer, entities, or migrations

**Failure cases dev must handle:**
- AccessDeniedException from @PreAuthorize → handled by Spring globally; no controller change needed
- IllegalStateException from approval state machine → wrap in ApiResponse.error
- ResourceNotFoundException → ApiResponse.error + 404

**QA validation areas:**
1. 18 newly protected endpoints return 403 for unauthorized callers
2. 4 renamed permission codes: old hyphen form rejected, new colon form accepted
3. All 50 M-003 endpoints return ApiResponse<T> structure
4. RolePermissionSeeder idempotent on restart
5. Approval state machine: C2 cannot skip C1

**DevOps trigger:** No

**Open execution questions (non-blocking):** SecurityConfig.java global auth coverage; ApiResponse import path; seedPermission colon handling; A-002 role slug names for C1/C2

```json
{
  "agent": "sdlc-tech-lead",
  "stage": "execution-planning",
  "verdict": "Ready for development",
  "confidence": "high",
  "escalate_recommended": "false",
  "escalation_reason": "",
  "next_owner": "sdlc-dev",
  "risk_score": "3",
  "risk_level": "medium",
  "missing_artifacts": [],
  "blockers": [],
  "evidence_refs": [
    "docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/sa/00-lean-architecture.md",
    "src/main/java/com/hanghai/kchtg/tramradar/controller/TramRadarController.java",
    "src/main/java/com/hanghai/kchtg/cosuachua/controller/CoSuaChuaDongTauController.java",
    "src/main/java/com/hanghai/kchtg/config/RolePermissionSeeder.java"
  ],
  "implementations_yaml_populated": "true",
  "sub_dispatch_count": "0",
  "sub_dispatch_degraded": "false",
  "token_usage": {
    "input": "4800",
    "output": "3200",
    "this_agent": "8000",
    "pipeline_total": "8000"
  }
}
```
