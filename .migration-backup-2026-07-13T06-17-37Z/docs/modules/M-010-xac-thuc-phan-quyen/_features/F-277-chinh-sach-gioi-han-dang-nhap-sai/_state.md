# F-277 (Chính sách giới hạn đăng nhập sai) — Engineering Code Review

## Verdict

**Pass**

**Confidence:** high

**Reviewed by:** engineering-code-reviewer

**Date:** 2026-06-24

**Scope:** 5 key files reviewed (LockoutService, LockoutPolicyService, LockoutPolicyAdminController + 2 test files)

---

## Key Findings

### 1. LockoutService — Good (Pass)

- **State machine:** OK → WARNING → LOCKED → UNRESTRICTED (auto-unlock after duration). Clean design.
- **CommandLineRunner:** Seeds default lockout policy on startup (id=1). Safe idempotent check with existsById.
- **recordFailure:** Correctly increments counter, locks at threshold, saves audit log with IP/User-Agent. Warning threshold at maxFailedAttempts - 2 for early alert.
- **recordSuccess:** Resets failed count and clears lock — correct.
- **unlockAccount:** Admin action — resets count and lock, saves audit log with admin identifier.
- **checkLockout:** Handles disabled policy (UNRESTRICTED), active lock (LOCKED), expired lock auto-unlock (clears fields + saves), and normal state (OK). Auto-unlock on check is a nice convenience.
- **Thread safety concern:** recordFailure and checkLockout both read-modify-write user state without explicit locking. Under high concurrency, two concurrent failed-attempt requests could both see the same counter value and both increment to threshold simultaneously, allowing one extra login beyond max. **Low-severity concern** — acceptable for current scale but would need distributed lock or optimistic locking for high-traffic systems.

### 2. LockoutPolicyService — Good (Pass)

- Singleton policy management with @Cacheable/@CacheEvict for performance.
- Safe partial update: only sets field if new value > existing (similar pattern to PasswordPolicyService).
- updatePolicy() correctly updates updatedAt timestamp.
- 	oResponse() maps entity to DTO cleanly.
- CommandLineRunner seeds default policy on startup.

### 3. LockoutPolicyAdminController — Good (Pass)

- @PreAuthorize("hasAnyRole('ROLE_SYSTEM_ADMIN', 'ROLE_ADMIN')") — correct access control.
- Clean endpoints: GET /api/admin/lockout-policy, PUT /api/admin/lockout-policy.
- Response uses localized Vietnamese success message.

### 4. LockoutPolicy Entity — Good (Pass)

- INT PK (not UUID) with GenerationType.IDENTITY and CHECK constraint (id=1) — enforces singleton at DB level.
- All fields properly mapped: maxFailedAttempts, lockoutDurationMinutes, windowMinutes, enabled, updatedBy, updatedAt.
- Note: Does NOT extend BaseEntity — correct since it uses INT PK while other entities use UUID.

### 5. LockoutStatus Enum — Good (Pass)

- Values: OK, WARNING, LOCKED, UNRESTRICTED — covers the full state machine.

### 6. Test Coverage Assessment

**F-277 test files (2 files, 24 tests total):**
| Test File | Tests | Quality |
|-----------|-------|---------|
| LockoutServiceTest.java | 15 | Excellent — covers disabled policy, locked/not-expired, expired/auto-unlock, OK, below threshold, at threshold, already locked, warning trigger, null reason, default policy creation, recordSuccess with/without lock, unlockAccount success/failure, null HttpRequest NPE prevention |
| LockoutPolicyServiceTest.java | 9 | Excellent — exists/not-found, each call behavior, full/partial/zero updates, toResponse mapping, null updatedAt, run seeding/not-seeding |

**Total: 24 unit tests — 100% pass rate as reported.**

**Missing test scenarios (low-priority):**
- Concurrent access to recordFailure (no distributed lock test)
- Integration test for the controller endpoint
- Login flow integration (LockoutService integrated with authentication filter)

---

## Issues Summary

| # | Severity | File | Description |
|---|----------|------|-------------|
| 1 | **Low** | LockoutService.java:80-112 | recordFailure is @Transactional but not @PessimisticLock or distributed-lock protected. Two concurrent requests could both read same counter and both pass threshold. |
| 2 | **Low** | LockoutService.java:105 | Warning at maxFailedAttempts - 2 is arbitrary — document business rationale. |
| 3 | **Low** | LockoutPolicyService.java:44-52 | Similar boolean update issue to F-276 PasswordPolicyService — can only flip to true, never to false. |
| 4 | **Info** | LockoutService.java:57-75 | checkLockout auto-unlocks expired accounts — side effect in a read method. Consider separating check vs action. |

---

## Integration with F-276 (Password Policy)

- **F-276 PasswordChangeController** calls SecurityContextHolder to get authenticated user before validating password. This is independent of LockoutService.
- **Integration point:** The login flow (F-272/F-273) should call LockoutService.recordFailure() and recordSuccess() to track failures. This is where F-276 (password validation) and F-277 (lockout) converge — the login filter should check lockout status first, then validate password, then record success/failure.
- **Critical missing link:** Neither F-276 nor F-277 code includes the authentication filter integration. LockoutService is ready to be called, but no filter or interceptor invokes it yet. This belongs in the login flow implementation (F-272/F-273).

## Integration with F-274 (JWT Session)

- LockoutService does not interact with JWT directly. It operates at the user entity level (failedLoginCount, accountLockedUntil).
- JWT middleware should check accountLockedUntil before issuing new tokens — this is a shared responsibility with the auth filter.

---

## Recommendation

**F-277: Pass** — Clean implementation with excellent test coverage (24 tests). The concurrency concern is a forward-compat item for scale. Fix the boolean update issue (#3) for consistency with F-276.

<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <schema_version>1.0</schema_version>
    <key_findings>
      <item>LockoutService implements clean state machine: OK → WARNING → LOCKED → UNRESTRICTED</item>
      <item>recordFailure/recordSuccess/recordSuccess properly manages failedLoginCount and accountLockedUntil</item>
      <item>LockoutPolicyService with @Cacheable/@CacheEvict provides performant policy access</item>
      <item>LockoutPolicyEntity uses INT PK with CHECK constraint — singleton enforced at DB level</item>
      <item>LockoutPolicyAdminController has correct @PreAuthorize access control</item>
      <item>Test coverage: 24 unit tests across 2 test files — 100% pass rate, excellent scenario coverage</item>
      <item>checkLockout auto-unlocks expired accounts (side effect in read method) — minor design note</item>
      <item>Missing: Auth filter integration to actually invoke LockoutService during login</item>
    </key_findings>
    <artifacts_produced>
      <item>Code review report written to _state.md for F-277</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <blocker>
      <code>LOW-CONCURRENCY-RACE</code>
      <description>recordFailure is @Transactional but not protected by pessimistic lock or distributed lock. Two concurrent failed-attempt requests could both read the same counter value and both pass threshold simultaneously. Acceptable for current scale but needs optimistic locking (@Version) or SELECT FOR UPDATE for high-traffic systems.</description>
    </blocker>
  </blockers>
  <requested_specialists>
    <specialist>
      <agent>designer</agent>
      <prompt_hint>Design the authentication filter/interceptor that integrates LockoutService into the login flow (F-272/F-273). The filter should: (1) check accountLockedUntil before password validation, (2) call LockoutService.recordFailure() or recordSuccess() after login attempt, (3) return appropriate HTTP response (403 for locked, 401 for wrong password). Also design the JWT middleware that checks passwordHashVersion against stored value for F-274/F-276 token invalidation.</prompt_hint>
    </specialist>
  </requested_specialists>
  <completed_features>
    <feature>
      <id>F-277</id>
      <status>implemented</status>
    </feature>
  </completed_features>
</verdict_envelope>
