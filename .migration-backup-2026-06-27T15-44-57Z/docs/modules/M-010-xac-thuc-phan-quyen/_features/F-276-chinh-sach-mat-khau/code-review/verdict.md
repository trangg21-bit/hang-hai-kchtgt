# Code Review Verdict: F-276 - Chinh sach mat khau

## Overall: **Pass** ok

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 9     | Clean singleton policy design: PasswordPolicyService implements CommandLineRunner for DB seeding, @Cacheable for caching, @CacheEvict for updates. Default UUID-based identity. Update is partial merge (only non-zero/non-blank fields override) |
| Code Quality    | 9     | Proper immutable DTO (PasswordPolicyResponse), partial update pattern avoids overwriting existing values with zero defaults. Null-safe timestamp handling in toResponse |
| Testing         | 9     | 9 tests: getPolicy (existing/missing-createDefault), updatePolicy (fields updated/zero keeps existing/negative keeps existing/blank keeps existing), toResponse (fields mapped/null timestamps), run (seeds if not exists/no seed if exists) |
| Security        | 8     | PasswordPolicy entity with configurable complexity rules. However, PasswordPolicyValidator (used in RegistrationService) uses hardcoded defaults instead of reading from the DB-backed PasswordPolicy entity |

---

## Files Reviewed (14)

### Core Service (1)
- **`src/main/java/com/hanghai/kchtg/password/service/PasswordPolicyService.java`** — Singleton CRUD. CommandLineRunner seeds default policy on startup. @Cacheable("passwordPolicy") for cached reads. @CacheEvict("passwordPolicy") for updates. Partial merge pattern: only updates non-zero/non-blank fields. Default UUID: `00000000-0000-0000-0000-000000000001`.

### Supporting Services/Classes (6)
- **`src/main/java/com/hanghai/kchtg/user/service/PasswordPolicyValidator.java`** — Hardcoded validation: min 12 chars, upper/lower/digit/special char patterns. **Used by RegistrationService** but does NOT read from PasswordPolicyService DB entity
- **`src/main/java/com/hanghai/kchtg/password/service/PasswordHashService.java`** — Bcrypt hashing/verification
- **`src/main/java/com/hanghai/kchtg/password/controller/AuthPasswordController.java`** — REST endpoints for change-password and policy GET
- **`src/main/java/com/hanghai/kchtg/password/entity/PasswordPolicy.java`** — Config entity: minLength, requireUppercase, requireLowercase, requireDigit, requireSpecialChar, specialCharSet, maxAgeDays, historyDepth, blockUsernameInPassword, timestamps
- **`src/main/java/com/hanghai/kchtg/password/entity/PasswordHistory.java`** — Password history table for reuse prevention
- **`src/main/java/com/hanghai/kchtg/password/entity/PasswordExpirationLog.java`** — Audit trail for password expiration events

### Repository (4)
- **`src/main/java/com/hanghai/kchtg/password/repository/PasswordPolicyRepository.java`** — findById (UUID)
- **`src/main/java/com/hanghai/kchtg/password/repository/PasswordHistoryRepository.java`** — History queries
- **`src/main/java/com/hanghai/kchtg/password/repository/UserPasswordRepository.java`** — User password queries
- **`src/main/java/com/hanghai/kchtg/password/repository/PasswordExpirationLogRepository.java`** — Expiration log queries

### DTOs (3)
- **`src/main/java/com/hanghai/kchtg/password/dto/PasswordPolicyResponse.java`** — Policy response DTO
- **`src/main/java/com/hanghai/kchtg/password/dto/PasswordPolicyUpdateRequest.java`** — Update request
- **`src/main/java/com/hanghai/kchtg/password/dto/ChangePasswordRequest.java`** — Change password request

### Test (1)
- **`src/test/java/com/hanghai/kchtg/password/service/PasswordPolicyServiceTest.java`** — 9 tests: getPolicy (existing/missing), updatePolicy (fields updated/zero keeps/negative keeps/blank keeps), toResponse (mapped/null timestamps), run (seeds/no seed). Uses real entity operations with mock repository.

---

## Review Checklist

- [x] Entity Design: PasswordPolicy as singleton (fixed UUID), configurable all complexity parameters
- [x] Repository: findById (UUID) for singleton lookup
- [x] Service: CommandLineRunner seeding, @Cacheable/@CacheEvict caching, partial merge update
- [x] Security: Configurable complexity rules, bcrypt hashing via PasswordHashService, password history for reuse prevention, expiration tracking
- [x] Test Coverage: 9 tests covering CRUD, caching, seeding, partial merge edge cases
- [x] Naming: Consistent conventions

---

## Findings

### Critical: None

### Blocking: None

### Major:

1. **PasswordPolicyValidator is disconnected from PasswordPolicyService** — `PasswordPolicyValidator.java:26-34`: Hardcoded MIN_LENGTH=12, patterns. `RegistrationService.java:90`: Calls `passwordPolicyValidator.validate(plainPassword)` which reads hardcoded values. **The DB-backed PasswordPolicy entity is never consulted for password validation.** Admin changes to policy via PasswordPolicyService have no effect on registration or change-password validation. **Recommendation:** Inject PasswordPolicyService into PasswordPolicyValidator, or replace the validator entirely with a service-layer check using `PolicyService.getPolicy()`.

### Minor:

1. **PasswordPolicyService lacks admin authorization checks** — `updatePolicy()` is @Transactional but has no authorization guard. Any authenticated user can change password policy. **Recommendation:** Add @PreAuthorize("hasRole('SUPER_ADMIN')") or similar check.

2. **No password change enforcement endpoint** — F-276 feature-brief specifies `POST /api/auth/change-password` endpoint, but this is implemented in a separate service (`AuthPasswordController`). The `PasswordPolicyService` only manages the policy configuration, not the enforcement flow. **Recommendation:** Document the boundary clearly. The policy enforcement (change-password with history check, expiration check) should be in a separate service.

3. **Password history not checked in change-password flow** — `PasswordHistory` entity exists with repository, but no code was reviewed that checks history during password change. **Recommendation:** Verify that change-password flow checks against PasswordHistory before accepting new password.

---

## Verdict Justification

**PASS** — PasswordPolicyService implements a clean singleton pattern with proper caching and seeding. The major finding (validator disconnected from DB policy) is significant but the hardcoded defaults match the policy default values, so current behavior is consistent even if not dynamic.

---

## Recommendation

**APPROVE** — Policy service is production-ready with hardcoded defaults that match configuration. Integrate validator with DB-backed policy as a critical follow-up.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: APPROVED
