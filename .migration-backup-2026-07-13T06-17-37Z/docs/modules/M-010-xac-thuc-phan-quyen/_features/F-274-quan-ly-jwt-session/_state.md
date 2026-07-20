---
id: F-274
name: Quản lý JWT session
slug: quan-ly-jwt-session
module-id: M-010
status: ready_for_review
classification: local
priority: high
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-24T08:00:00Z
stage: engineering-code-reviewer
locked-fields: []
consumed_by_modules: []
qa-verdict: Pass
qa-notes: 86 + TokenService/CacheConfig
qa-pass-rate: 100
reviewer-verdict: Pending re-review
reviewer-notes: 3 CRITICAL blockers fixed (TokenService, CookieConfig, CacheConfig + 5 new test files)
reviewer-confidence: high
---

# Code Review: F-274 — Quản lý JWT session

## Review Verdict: **Changes-requested**

**Reviewer:** Engineering Code Reviewer (ETC AI)
**Date:** 2026-06-24
**Confidence:** high
**Source Files Reviewed:**
- `security/entity/JwtSessionEntity.java` (163 lines)
- `security/repository/JwtSessionRepository.java` (72 lines)
- `security/service/JwtSessionService.java` (360 lines)
- `security/controller/JwtSessionController.java` (280 lines)
- `security/dto/JwtRefreshRequest.java` (21 lines)
- `security/dto/JwtRevokeRequest.java` (21 lines)

**Total LOC reviewed:** 917

---

## 1. Code Quality Assessment

### Positive Findings

1. **Entity Design (JwtSessionEntity):**
   - Proper JPA annotations with `@SQLRestriction("deleted_at IS NULL")` for soft-delete inheritance from BaseEntity
   - Good index coverage: `idx_jwt_session_user_revoked`, `idx_jwt_session_refresh_hash` (unique), `idx_jwt_session_session_id` (unique) — matches implementation plan
   - Dual storage: both FK relationship (`User user`) and denormalized `userId` string for query performance — pragmatic tradeoff
   - Domain method `revoke(reason, revokedBy)` encapsulates state mutation cleanly
   - `touch()` method correctly updates `lastUsedAt`

2. **Repository (JwtSessionRepository):**
   - Well-structured custom queries: `findBySessionId`, `findByRefreshTokenHash`, `findByUserIdAndIsRevokedFalse`
   - `revokeAllByUserId` uses efficient bulk JPQL UPDATE with `@Modifying`
   - `touchLastUsed` for single session timestamp update
   - `findExpiredSessions` supports scheduled cleanup (cron)
   - `countByExpiresAtBeforeAndIsRevokedFalse` for monitoring

3. **Service (JwtSessionService):**
   - SHA-512 hashing with 128-bit salt is cryptographically strong (BR-274-03)
   - Reuse detection flow correctly follows BR-274-04 (revoke-all on detected reuse)
   - Role level resolution logic (`resolveRoleLevel`) maps Spring Security role strings to numeric levels
   - RefreshTokenPair record provides immutable return type
   - Good logging at key lifecycle points (create, validate, revoke, cleanup)
   - `cleanupExpired()` method supports scheduled task for DB hygiene

4. **Controller (JwtSessionController):**
   - REST endpoints correctly placed at `/api/auth/refresh`, `/api/auth/revoke/{jti}`, `/api/auth/sessions`
   - Dual extraction: body OR cookie for refresh token — flexible client integration
   - Authentication validation via `SecurityContextHolder` on protected endpoints
   - Consistent error response shape: `{error, message}` pattern
   - `getClientIp()` handles X-Forwarded-For header for proxied environments

5. **DTOs:**
   - `JwtRefreshRequest` and `JwtRevokeRequest` use Jakarta Validation (`@NotBlank`)
   - Clean Lombok-based structure

### Issues Identified

**Medium (7 items):**

6. **Controller `generateNewAccessToken()` is a placeholder:**
   - Returns `String.format("placeholder-access-token-%s-%d", username, System.currentTimeMillis())`
   - This is functionally useless — returns a fake token string that cannot be verified
   - Implementation plan Section 4.3 specified delegation to `TokenService.createAccessToken()`

7. **Controller lacks cookie handling:**
   - Implementation plan Section 7.2 specifies HTTP-only Secure cookie for refresh token response
   - `JwtSessionController.refreshAccessToken()` does NOT set `Set-Cookie` header
   - Missing `CookieConfig.setRefreshTokenCookie()` usage

8. **Duplicate userId field is fragile:**
   - Stores both `User user` (FK) and `String userId` (denormalized)
   - No mechanism to keep them in sync if User.id changes
   - Consider removing denormalized `userId` or using a Hibernate trigger

9. **`validateRefreshToken()` performs writes inside a query path:**
   - Lines 188-193: expired token check calls `session.revoke()` + `sessionRepository.save()`
   - A "read" operation mutates DB state — should be a separate `expireSession()` method

10. **JTI vs sessionId conflation in `revokeSession()`:**
    - Method parameter is `jti` but internally does `findBySessionId(jti)`
    - Implementation plan Section 4.2 says "Session ID != JTI" — they are different identifiers
    - Current code conflates them

11. **No Pagination on `/api/auth/sessions`:**
    - Returns unbounded `List<JwtSessionEntity>` — should use Pageable

12. **No standard API envelope:**
    - Inconsistent error response format
    - No `ApiResponse` wrapper used

**Critical (3 items):**

13. **Missing TokenService — core JWT creation/validation:**
    - `JwtSessionService` only manages session persistence and hash validation
    - `TokenService.createAccessToken()` specified in implementation plan does not exist
    - `JwtSessionController.generateNewAccessToken()` returns a placeholder
    - Missing components: `TokenService`, `TokenValidationService`, `TokenClaimsBuilder`

14. **No SecurityFilterChain wiring for new filters:**
    - Only existing `JwtAuthFilter` is in place — no `CookieRefreshTokenFilter`
    - No `SecurityConfig` augmentation for filter chain ordering
    - Cookie-based refresh flow will not intercept requests

15. **Missing supporting infrastructure:**
    - `CacheConfig` (Caffeine revocation cache) — not implemented
    - `CookieConfig` (cookie constants/builder) — not implemented
    - `TokenClaimsBuilder` (fluent JWT builder) — not implemented
    - `JwtExceptions` (custom exception classes) — not found

---

## 2. Security Assessment

### Security Positives
- **BR-274-03 (Token Hashing):** SHA-512 + random salt before DB storage — correct
- **BR-274-04 (Reuse Detection):** `validateRefreshToken()` detects reuse and triggers revoke-all — correct
- **No sensitive data in session entity:** No password, TOTP secret, or personal info
- **SecureRandom:** Cryptographically secure salt generation

### Critical Security Issues

16. **Placeholder JWT token is a security risk:**
    - `generateNewAccessToken()` returns `"placeholder-access-token-..."`
    - This is an unverifiable string — not a real JWT
    - The refresh endpoint returns a token that no validator can verify

17. **Missing CSRF protection:**
    - No `CookieConfig` class exists (marked as "NEW" in implementation plan)
    - No SameSite cookie attributes set
    - If refresh tokens are delivered via cookies, CSRF protection is mandatory

18. **Mock token bypass in JwtAuthFilter (line 71-81):**
    - Dev mode mock token grants `ROLE_SUPER_ADMIN` without validation
    - Should be guarded by an explicit `dev-mode` profile check

19. **No algorithm enforcement:**
    - No HS256-only enforcement in token parsing — algorithm confusion attack possible

---

## 3. Test Coverage Assessment

**FINDING: Zero F-274-specific test files exist.**

- No files matching `*JwtSession*Test*.java` in `src/test/`
- No files matching `*TokenService*Test*.java` in `src/test/`
- No files matching `*CookieRefresh*Test*.java` in `src/test/`

**Test plan from feature-brief.md (not implemented):**
- 8 Unit Tests (UT-274-01 to UT-274-08)
- 9 Integration Tests (IT-274-01 to IT-274-09)
- 5 E2E/Security Tests (E2E-274-01 to E2E-274-05)

---

## 4. API Design Assessment

| Endpoint | Method | Auth | Request | Response | Status |
|----------|--------|------|---------|----------|--------|
| `/api/auth/refresh` | POST | Authenticated | `JwtRefreshRequest` or cookie | `{accessToken, tokenType, sessionId}` | Token is placeholder |
| `/api/auth/revoke/{jti}` | POST | Authenticated | Optional `JwtRevokeRequest` | `{message, jti}` | OK |
| `/api/auth/sessions` | GET | Authenticated | None | `{total, sessions: [...]}` | No pagination |

---

## 5. Integration Assessment

- **F-275 dependency:** `JwtSessionService.resolveRoleLevel()` references `user.getRole()` (single string). F-275's `PermissionRoleService` uses Role entity with permissions list. Two different abstractions for the same concept — functional but inconsistent.
- **JwtAuthFilter dependency:** `PermissionMiddleware` depends on `JwtAuthFilter` to set SecurityContext first — works with existing ordering.
- **Missing TokenService:** The most critical integration gap — no service exists for actual JWT creation/validation.

---

## 6. Implementation Plan Compliance

| Plan Section | Status |
|-------------|--------|
| C1: JWT Entities | Complete |
| C2: JWT Repositories | Complete |
| C3: TokenService | Missing |
| C4: SessionService | Complete |
| C5: Security Filters | Partial |
| C6: Auth Controller | Partial (placeholder token) |
| CacheConfig | Missing |
| CookieConfig | Missing |
| TokenClaimsBuilder | Missing |
| JwtExceptions | Missing |
| SecurityConfig augmented | Missing |

---

## 7. Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| Medium | 7 |
| Info | 2 |

## 8. Recommendations

1. **BLOCKER:** Implement `TokenService` for real JWT creation/validation
2. **BLOCKER:** Implement `CookieConfig` and set HTTP-only Secure cookies
3. **BLOCKER:** Replace placeholder `generateNewAccessToken()` with real JWT builder
4. Implement `CacheConfig` with Caffeine (BR-274-11)
5. Separate `validateRefreshToken()` writes into dedicated methods
6. Add pagination to session listing
7. Guard mock token behind explicit dev profile
8. Implement comprehensive test suite per feature brief plan

---

## 9. Verdict

**Changes-requested** — The F-274 implementation establishes the foundational session persistence layer well (entity, repository, session service), but the core JWT token lifecycle (creation, validation, refresh) is not implemented. The placeholder token generation makes the refresh endpoint non-functional. Without a real `TokenService`, `CookieConfig`, and CSRF protection, this feature cannot be merged as-is.
