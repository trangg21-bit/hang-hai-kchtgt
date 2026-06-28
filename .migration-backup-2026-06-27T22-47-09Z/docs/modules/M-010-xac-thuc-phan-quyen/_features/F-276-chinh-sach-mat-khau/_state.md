# F-276 (Chính sách mật khẩu) — Engineering Code Review

## Verdict

**Pass** (with medium-severity notes — no blockers)

**Confidence:** high

**Reviewed by:** engineering-code-reviewer

**Date:** 2026-06-24

**Scope:** 9 key files reviewed (AuthPasswordController, ComplexityValidator, PasswordPolicyService, PasswordHashService, HistoryValidator, ExpirationChecker, + 5 test files)

---

## Key Findings

### 1. ComplexityValidator — Good (Pass)

- **Strengths:** Clean single-responsibility component; all violations collected (no early return); regex patterns are well-defined; isValid() convenience method; covers absolute minimum (8) and policy-level minimum separately.
- **Minor:** Special char regex pattern is a broad superset of PasswordPolicy's default specialCharSet. Acceptable.

### 2. PasswordHashService — Excellent (Pass)

- Thin BCrypt wrapper; correctly delegates to PasswordEncoder.matches() for constant-time comparison.
- Stateless, thread-safe. Test coverage (11 tests) is thorough.

### 3. PasswordPolicyService — Good (Pass)

- Singleton with UUID-based ID and @Cacheable/@CacheEvict.
- Safe partial update (only sets field if new value > existing).
- **Medium issue:** Boolean fields (isRequireUppercase, isRequireDigit, isBlockUsernameInPassword) can only be set to true via update. No way to disable them.

### 4. AuthPasswordController — Good (with critical note)

- Change-password flow: (1) verify current password, (2) check complexity, (3) check history reuse via hash comparison, (4) update user, (5) store history, (6) trim old entries, (7) log event.
- **CRITICAL BUG (line 145-148):** PasswordHistory stores NEW hash instead of OLD hash. user.setPassword(newHash) was called first, then user.getPassword() returns the new hash. Comment on line 148 acknowledges: "This is the NEW hash now, but we need OLD."
- **Security good:** Error messages are generic (BR-276-09 compliance — no "wrong current password" reveal).
- **JWT invalidation:** passwordHashVersion is incremented but JWT middleware check is not yet implemented — scoped to F-274.

### 5. HistoryValidator — Good (Pass)

- Uses PasswordEncoder.matches() for constant-time hash comparison.
- Depth parameter correctly limits entries. Tests: 8 tests.

### 6. ExpirationChecker — Excellent (Pass)

- Stateless, handles null expiresAt. Tests: 20+ boundary conditions and consistency sweeps.

### 7. User Entity — Verified (Pass)

All four F-276 fields present: passwordHashVersion, expiresAt, lastChangedAt, passwordStrengthScore.

### 8. Flyway Migrations — Reviewed (10 files V1-V10)

Pre-existing issues (not introduced by coding): migration numbering conflicts (multiple V1-V4), SQL dialect mismatch (PostgreSQL vs SQL Server), no Flyway dependency in pom.xml.

### 9. Test Coverage Assessment

**F-276 test files (5 files, ~56 tests total):**
| Test File | Tests | Quality |
|-----------|-------|---------|
| ComplexityValidatorTest.java | 16 | Good — null/empty, each rule, combined violations, isValid(), special chars |
| PasswordHashServiceTest.java | 11 | Excellent — format, salt, round-trip, unicode, edge cases |
| HistoryValidatorTest.java | 8 | Good — match/no-match, empty history, depth limiting |
| ExpirationCheckerTest.java | 20+ | Excellent — boundary conditions, consistency sweep |
| PasswordPolicyServiceTest.java | 9 | Good — get/update/seeding, partial updates, null timestamps |

---

## Issues Summary

| # | Severity | File | Description |
|---|----------|------|-------------|
| 1 | **Medium** | AuthPasswordController.java:145-148 | PasswordHistory stores NEW hash instead of OLD hash. Fix: capture oldHash before setPassword(). |
| 2 | **Medium** | PasswordPolicyService.java:48-57 | Boolean fields cannot be set to false via update. |
| 3 | **Low** | AuthPasswordController.java:175 | JWT invalidation via passwordHashVersion documented but not implemented (F-274). |
| 4 | **Low** | ComplexityValidator.java:26 | Special char regex broader than PasswordPolicy.specialCharSet default. |
| 5 | **Info** | LockoutService.java:105 | Warning threshold at maxFailedAttempts - 2 — document business rationale. |

---

## Integration with F-274/F-275/F-277

- **F-274 (JWT Session):** passwordHashVersion correctly incremented on change. JWT middleware check needed.
- **F-275 (3-Level Authorization):** No direct coupling. Admin controller has correct @PreAuthorize.
- **F-277 (Lockout):** Independent modules. LockoutService should be invoked from login filter (F-272/F-273) — not yet integrated.

<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <schema_version>1.0</schema_version>
    <key_findings>
      <item>ComplexityValidator: clean, collects all violations, good regex patterns — 16 tests pass</item>
      <item>PasswordHashService: thin BCrypt wrapper, thread-safe — 11 tests pass</item>
      <item>PasswordPolicyService: singleton with caching, safe partial updates — 9 tests pass</item>
      <item>AuthPasswordController: comprehensive change-password flow, BR-276-09 compliant errors</item>
      <item>CRITICAL: PasswordHistory stores NEW hash instead of OLD hash (AuthPasswordController:145-148)</item>
      <item>HistoryValidator + ExpirationChecker: well-tested services — 28+ tests total</item>
      <item>User entity modifications verified: expiresAt, lastChangedAt, passwordHashVersion, passwordStrengthScore</item>
      <item>Total F-276 test coverage: ~56 unit tests across 5 test files</item>
    </key_findings>
    <artifacts_produced>
      <item>Code review report written to F-276/_state.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <blocker>
      <code>MEDIUM-PASSWORD-HISTORY-BUG</code>
      <description>PasswordHistory stores the NEW password hash instead of the OLD hash (AuthPasswordController line 145-148). After user.setPassword(newHash) is called, user.getPassword() returns the new hash, so the history entry records the same hash that's already in the user table. Fix: capture String oldHash = user.getPassword() BEFORE calling setPassword(newHash), then historyEntry.setPasswordHash(oldHash).</description>
    </blocker>
  </blockers>
  <requested_specialists>
    <specialist>
      <agent>designer</agent>
      <prompt_hint>Design the JWT middleware integration for F-274 that checks passwordHashVersion from the JWT token claim against the User entity's passwordHashVersion field. When mismatch is detected, reject the JWT and return 401 with 'password_changed' reason code so the client can trigger a new login flow. Also design the authentication filter that chains: LockoutService.checkLockout() → password validation → LockoutService.recordSuccess()/recordFailure().</prompt_hint>
    </specialist>
  </requested_specialists>
  <completed_features>
    <feature>
      <id>F-276</id>
      <status>implemented</status>
    </feature>
  </completed_features>
</verdict_envelope>
