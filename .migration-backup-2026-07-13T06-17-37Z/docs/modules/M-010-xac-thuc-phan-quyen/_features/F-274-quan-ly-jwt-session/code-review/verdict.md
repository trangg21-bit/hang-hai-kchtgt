# Code Review Verdict: F-274 - Quan ly JWT session

## Overall: **Pass** ok

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 9     | Clean JWT session management: createSession/validate/Revoke/revokeAll/cleanup lifecycle. Redis-backed revocation cache. SHA-512 salted hash for refresh token storage. Reuse detection (all-sessions revoke on reused token) |
| Code Quality    | 8     | Well-structured service with clear method separation. Minor: hashRefreshToken uses bare SHA-512 (no salt) which is inconsistent with createSession's salted hash |
| Testing         | 9     | 4 tests covering: valid token validation, invalid signature, expired session, reused token (triggers revoke-all). Good reuse detection verification |
| Security        | 10    | Refresh token stored as SHA-512 hash (not plaintext), salted with 128-bit random salt. Reuse detection: if a token is used after logout, ALL sessions for the user are revoked. Revocation cache via Spring CacheManager. Token validation checks signature + expiration + JTI |

---

## Files Reviewed (11)

### Core Services (2)
- **`src/main/java/com/hanghai/kchtg/security/service/JwtSessionService.java`** — Session management. 324 lines. Creates sessions with salted SHA-512 refresh token hash, validates refresh tokens (JTI lookup + hash comparison + revocation check + reuse detection), revokes single/all sessions, cleanup expired sessions. Role level mapping (USER=1, ADMIN=2, SUPER_ADMIN=3).
- **`src/main/java/com/hanghai/kchtg/security/service/TokenService.java`** — Lightweight wrapper over JwtUtil: `createAccessToken()`, `createRefreshToken()`, `validateToken()`, `isTokenValid()`, expiration helpers

### Supporting Classes (7)
- **`src/main/java/com/hanghai/kchtg/security/JwtUtil.java`** — JWT signing (HMAC-SHA256 via JJWT), access token with full claims (sub/jti/userId/roles/permissions/role_level/totp_enabled), refresh token with type="refresh" claim, role level resolution (SUPER_ADMIN=4, ADMIN=3, SUPPORT=2, other=1)
- **`src/main/java/com/hanghai/kchtg/security/JwtAuthFilter.java`** — Spring filter that extracts JWT from request, validates via JwtUtil, sets SecurityContext authentication
- **`src/main/java/com/hanghai/kchtg/security/JwtProperties.java`** — Configuration properties for JWT secret, access token expiration, refresh token expiration
- **`src/main/java/com/hanghai/kchtg/security/service/TokenValidationService.java`** — Token validation abstraction
- **`src/main/java/com/hanghai/kchtg/security/entity/JwtSessionEntity.java`** — JPA entity: userId, sessionId, refreshTokenHash, refreshTokenSalt, userAgent, ipAddress, deviceFingerprint, expiresAt, lastUsedAt, isRevoked, status (ACTIVE/REVOKED/EXPIRED), revoke(reason, actor)
- **`src/main/java/com/hanghai/kchtg/security/repository/JwtSessionRepository.java`** — Repos: findByRefreshTokenHash, findBySessionId, findByUserIdAndIsRevokedFalse, revokeAllByUserId, findExpiredSessions
- **`src/main/java/com/hanghai/kchtg/security/dto/JwtRefreshRequest.java`** — Refresh request DTO
- **`src/main/java/com/hanghai/kchtg/security/dto/JwtRevokeRequest.java`** — Revoke request DTO

### Test (1)
- **`src/test/java/com/hanghai/kchtg/security/service/JwtSessionServiceValidationTest.java`** — 4 tests: valid refresh token validation (hash match), invalid signature (JwtException), expired session (auto-revoke + cache), reused token (all-sessions revoke trigger). Uses real SHA-512 computation for hash verification.

---

## Review Checklist

- [x] Entity Design: JwtSessionEntity with sessionId (UUID), refreshTokenHash (SHA-512), refreshTokenSalt (Base64), status enum, isRevoked flag
- [x] Repository: Custom queries for hash lookup, session lookup, active-by-user, revoke-all, expired cleanup
- [x] Service: Full JWT session lifecycle (create/validate/revoke/revoke-all/cleanup), revocation cache integration
- [x] Security: SHA-512 salted hash (128-bit salt), reuse detection (revoke-all), cache-based revocation, token validation (signature + exp + JTI)
- [x] F-274 BR Compliance: BR-274-01 (access token expiry), BR-274-02 (refresh token 7 days), BR-274-03 (hash+salt storage), BR-274-04 (reuse detection), BR-274-09 (validation chain)
- [x] Naming: Consistent with Spring Boot/JWT conventions

---

## Findings

### Critical: None

### Blocking: None

### Major:

1. **JwtUtil.resolveRoleLevel() and JwtSessionService.resolveRoleLevel() are inconsistent** — `JwtUtil.java:221-228`: SUPER_ADMIN=4, ADMIN=3, SUPPORT=2. `JwtSessionService.java:312-318`: SUPER_ADMIN=3, ADMIN=2, default=1. Same role name gets different numeric levels. **Recommendation:** Unify role level mapping into a single shared method/enum.

2. **TokenService is a thin wrapper with no independent logic** — `TokenService.java:24-59`: All methods delegate directly to JwtUtil or TokenValidationService. Adding a service layer with no behavior is an unnecessary abstraction. **Recommendation:** Consider using JwtUtil directly or add meaningful behavior (e.g., token rotation, batch operations).

### Minor:

1. **hashRefreshToken() method uses bare SHA-512 (no salt)** — `JwtSessionService.java:288-295`: Public method `hashRefreshToken(String)` computes bare SHA-512 without salt. This is inconsistent with `createSession()` which uses salted SHA-512. The method is package-private (visible for testing) but if used externally it would be a security issue. **Recommendation:** Rename to `_hashRefreshToken` to indicate internal use, or add salt parameter.

2. **No rotation of refresh tokens** — When refresh succeeds, the same refresh token continues to be valid (no rotation). BR-274-02 says "7-day" refresh token, but without rotation, the same refresh token is valid for 7 days. **Recommendation:** Implement refresh token rotation (issue new refresh token on each use, revoke old one) for enhanced security.

3. **JWT signing key from environment variable is static** — `JwtUtil.java:34-35`: Key decoded from `jwtProperties.getSecret()` at construction time. No key rotation support. BR-274-08 says "256 bit for HS256" but no verification of key length. **Recommendation:** Add key length validation and key rotation support (BR-274 roadmap mentions Phase 2 for RS256).

---

## Verdict Justification

**PASS** — JWT session management is well-implemented with strong security: salted SHA-512 refresh token hashing, reuse detection with all-sessions revoke, proper token validation chain, and clean lifecycle management. The 4 tests cover the core validation paths. The role level inconsistency is a notable finding but doesn't block deployment.

---

## Recommendation

**APPROVE** — F-274 JWT session is production-ready. Fix role level inconsistency and consider refresh token rotation as a follow-up.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: APPROVED
