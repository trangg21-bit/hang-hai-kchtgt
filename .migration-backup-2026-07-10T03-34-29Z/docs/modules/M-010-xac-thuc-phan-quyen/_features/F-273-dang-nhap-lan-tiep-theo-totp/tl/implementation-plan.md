# Tech-Lead Implementation Plan — F-273: Đăng nhập lần tiếp theo + TOTP

> **Feature:** F-273 — Xác thực 2 yếu tố cho người dùng đã hoàn tất F-272 (TOTP setup)
> **Module:** M-010 — Xác thực & Phân quyền
> **Stack:** Spring Boot 3.3.6 · Java 17 · JPA/Hibernate · Spring Security · JJWT 0.12.5
> **SA Source:** `sa/feature-design.md` v1.0
> **TL version:** v1.0 · 2026-06-23

---

## 1. Component Breakdown

F-273 introduces **5 new components** and modifies **4 existing ones**:

### New Components (5)

| # | Component | Package | Responsibility |
|---|-----------|---------|----------------|
| 1 | `TotpValidator` | `com.hanghai.kchtg.security` | RFC 6238 TOTP code validation with +/1 time-step tolerance, constant-time comparison |
| 2 | `TotpAuthService` | `com.hanghai.kchtg.user.service` | Orchestrates the 2FA login flow: credential check -> TOTP gate -> token issuance |
| 3 | `LoginAuditLog` | `com.hanghai.kchtg.user.entity` | JPA entity for `login_audit_logs` table — captures every login attempt |
| 4 | `LoginAuditLogService` | `com.hanghai.kchtg.user.service` | Persists audit log entries with IP, user-agent, attempt type, result |
| 5 | `LoginAuditLogRepository` | `com.hanghai.kchtg.user.repository` | JPA repository for audit log CRUD + query by user/IP/time range |

### Modified Components (4)

| # | Component | Package | Modification |
|---|-----------|---------|--------------|
| 1 | `User` | `com.hanghai.kchtg.user.entity` | Add 5 new columns: `totpEnabled`, `totpSecretEncrypted`, `failedLoginCount`, `failedTotpCount`, `accountLockedUntil` |
| 2 | `JwtUtil` | `com.hanghai.kchtg.security` | Add `generateAccessToken(User)`, `generateRefreshToken(User)` — dual-token generation with `jti`, `role_level`, `totp_enabled` claims |
| 3 | `JwtAuthFilter` | `com.hanghai.kchtg.security` | Enhance `doFilterInternal` to check `totp_enabled` claim from JWT |
| 4 | `AuthController` | `com.hanghai.kchtg.user.controller` | Split login into 2-phase: credentials -> 2FA challenge -> TOTP verification -> JWT issuance |

### New DTOs (3)

| # | DTO | Package | Usage |
|---|-----|---------|-------|
| 1 | `TotpLoginRequest` | `com.hanghai.kchtg.user.dto` | Request body for `POST /api/auth/login/totp` — `userId` + `totpCode` |
| 2 | `TwoFactorLoginResponse` | `com.hanghai.kchtg.user.dto` | Response after successful TOTP — access + refresh tokens + user info |
| 3 | `MfaChallengeResponse` | `com.hanghai.kchtg.user.dto` | Response after credentials pass — 2FA challenge payload with `challengeId`, `userId`, `requiresMfa` |

---

## 2. Package Structure

```
src/main/java/com/hanghai/kchtg/
+-- config/
|   +-- SecurityConfig.java                          < MODIFIED: add /api/auth/login/totp permitAll
|
+-- security/
|   +-- JwtUtil.java                                  < MODIFIED: add generateAccessToken, generateRefreshToken
|   +-- JwtAuthFilter.java                            < MODIFIED: check totp_enabled claim
|   +-- JwtProperties.java                            < MODIFIED: add access/refresh token TTL properties
|   +-- EncryptionUtil.java                           < UNCHANGED (reuse for TOTP secret decryption)
|   +-- TotpValidator.java                            < NEW: RFC 6238 validation
|
+-- user/
|   +-- controller/
|   |   +-- AuthController.java                       < MODIFIED: 2-phase login flow
|   +-- service/
|   |   +-- UserService.java                          < UNCHANGED
|   |   +-- TotpAuthService.java                      < NEW: orchestrates 2FA login
|   |   +-- LoginAuditLogService.java                 < NEW: persists audit logs
|   +-- repository/
|   |   +-- UserRepository.java                       < MODIFIED: add findByUsernameOrEmail, findByUsernameWithTotpInfo
|   |   +-- LoginAuditLogRepository.java              < NEW
|   +-- entity/
|   |   +-- User.java                                 < MODIFIED: 5 new columns
|   |   +-- LoginAuditLog.java                        < NEW
|   |   +-- LoginAttemptType.java                     < NEW: enum CREDENTIALS, TOTP
|   |   +-- LoginAttemptResult.java                   < NEW: enum SUCCESS, FAIL
|   |   +-- (other entities unchanged)
|   +-- dto/
|       +-- LoginRequest.java                         < UNCHANGED (reuse)
|       +-- LoginResponse.java                        < DEPRECATED for 2FA flow (keep for backward compat)
|       +-- TotpLoginRequest.java                     < NEW
|       +-- TwoFactorLoginResponse.java               < NEW
|       +-- MfaChallengeResponse.java                 < NEW
|
+-- common/
    +-- dto/
    |   +-- ApiResponse.java                          < UNCHANGED (reuse)
    +-- entity/
    |   +-- BaseEntity.java                           < UNCHANGED (LoginAuditLog inherits)
    +-- exception/
        +-- GlobalExceptionHandler.java               < ADD: handler for 2FA-specific exceptions
```

---

## 3. Interface Contracts

### 3.1 TotpValidator

```java
package com.hanghai.kchtg.security;

@Component
public class TotpValidator {

    /**
     * Validates a TOTP code against a decrypted shared secret.
     * Uses +/-1 time-step tolerance (+/-30s) for clock drift.
     * Uses constant-time comparison to prevent timing attacks.
     *
     * @param secret     decrypted shared secret (raw string or Base32)
     * @param totpCode   6-digit code from the user
     * @return true if valid within tolerance window
     */
    public boolean validate(String secret, String totpCode);
}
```

**Contract notes:**
- Input validation: returns `false` for non-6-digit codes (no exception)
- Uses `MessageDigest.isEqual()` internally for constant-time comparison
- Tolerance: +/-1 time step = +/-30s window (per RFC 6238 sec 5.2)

### 3.2 TotpAuthService

```java
package com.hanghai.kchtg.user.service;

@Service
public class TotpAuthService {

    /**
     * Phase 1: Verify credentials, check account lock & TOTP status.
     * Returns MfaChallengeResponse if credentials valid and TOTP required.
     *
     * @param username  username, email, or phone
     * @param password  plain-text password
     * @param request   HttpServletRequest for IP/user-agent extraction
     * @return MfaChallengeResponse with userId for Phase 2
     */
    public MfaChallengeResponse authenticateCredentials(
            String username, String password, HttpServletRequest request);

    /**
     * Phase 2: Validate TOTP code and issue JWT tokens.
     *
     * @param userId     user ID from Phase 1
     * @param totpCode   6-digit TOTP code
     * @param request    HttpServletRequest for IP/user-agent extraction
     * @return TwoFactorLoginResponse with access + refresh tokens
     */
    public TwoFactorLoginResponse verifyTotp(
            UUID userId, String totpCode, HttpServletRequest request);
}
```

**Contract notes:**
- `authenticateCredentials` throws `AuthenticationException` with generic message "Sai thong tin dang nhap" for any credential failure (BR-273-10 anti-enumeration)
- Returns `MfaChallengeResponse` (HTTP 200 business error) if `is_totp_enabled = false`
- Returns `MfaChallengeResponse` with `challenge_2fa=true` if credentials pass and TOTP required
- `verifyTotp` throws `AuthenticationException` for invalid TOTP (remaining attempts included)
- On TOTP max attempts, sets `account_locked_until` (BR-273-05) and throws with 403

### 3.3 JwtUtil Extensions

```java
@Component
public class JwtUtil {

    /**
     * Generate access token - 15-minute expiry, includes role_level and totp_enabled.
     */
    public String generateAccessToken(User user);

    /**
     * Generate refresh token - 7-day expiry, includes totp_enabled.
     */
    public String generateRefreshToken(User user);

    // Existing methods remain: generateToken, validateToken, extractUsername, extractRole
}
```

**Claim structure (access token):**

| Claim | Type | Source |
|-------|------|--------|
| `sub` | String | `user.username` |
| `jti` | String | `UUID.randomUUID()` |
| `role` | String | `user.role` (default `ROLE_USER`) |
| `role_level` | Integer | Derived from role mapping (sec 4.5 in SA) |
| `totp_enabled` | Boolean | `user.isTotpEnabled()` |
| `iat` | Date | Current time |
| `exp` | Date | Current time + 15 minutes |

**Claim structure (refresh token):**

| Claim | Type | Source |
|-------|------|--------|
| `sub` | String | `user.username` |
| `jti` | String | `UUID.randomUUID()` |
| `totp_enabled` | Boolean | `user.isTotpEnabled()` |
| `iat` | Date | Current time |
| `exp` | Date | Current time + 7 days |

### 3.4 AuthController Endpoints

```
POST /api/auth/login
  Request:  { "username": "string", "password": "string" }
  Success:  200 - MfaChallengeResponse (requiresMfa=true, userId)
  Edge-TotpNotEnabled: 200 - MfaChallengeResponse (requiresTotpSetup=true)
  Fail-InvalidCreds: 401 - ApiResponse.error("Sai thong tin dang nhap")
  Fail-AccountLocked: 403 - ApiResponse.error("Tai khoan da bi khoa...")

POST /api/auth/login/totp
  Request:  { "userId": "uuid", "totpCode": "123456" }
  Success:  200 - TwoFactorLoginResponse (access_token, refresh_token, user)
  Fail-TotpInvalid: 401 - ApiResponse.error("Ma TOTP khong hop le", { remainingAttempts })
  Fail-TotpMaxAttempts: 403 - ApiResponse.error("Qua so lan thu...")
  Fail-Format: 400 - ApiResponse.error("Ma TOTP phai la 6 chu so")
```

---

## 4. 2FA Verification Flow (Detailed)

```
CLIENT                         SERVER (TotpAuthService)                DB
  |                                  |                                    |
  |  POST /api/auth/login            |                                    |
  |  {username, password}            |                                    |
  |-------------------------------> |                                    |
  |                                  |--- 1. Anti-enumeration: always compute  |
  |                                  |     password hash (even if user null)  |
  |                                  |                                    |
  |                                  |--- 2. SELECT * FROM app_users        |
  |                                  |     WHERE username=? OR email=?     |
  |                                  |     OR phone=?                       |
  |                                  |                                    |
  |                                  |--- 3. BR-273-06: Check account lock  |
  |                                  |     if account_locked_until > now()  |
  |                                  |     -> throw ACCOUNT_LOCKED (403)     |
  |                                  |                                    |
  |                                  |--- 4. BR-273-02: passwordEncoder.match|
  |                                  |     if FAIL -> increment failed_login|
  |                                  |       count, log, throw (401)        |
  |                                  |                                    |
  |                                  |--- 5. BR-273-01: Check totpEnabled  |
  |                                  |     if false -> requiresTotpSetup=true|
  |                                  |     (200, redirect to F-272)         |
  |                                  |                                    |
  |   200 OK                         |                                    |
  |   {challenge_2fa: true,           |                                    |
  |    userId: uuid,                  |--- 6. LOG: CREDENTIALS + SUCCESS     |
  |    requiresMfa: true}             |---     (user identified)              |
  |<------------------------------ |                                    |
  |                                  |                                    |
  |  POST /api/auth/login/totp       |                                    |
  |  {userId, totpCode: "123456"}    |                                    |
  |-------------------------------> |                                    |
  |                                  |--- 7. SELECT user by ID (with       |
  |                                  |     totp_secret_encrypted)           |
  |                                  |                                    |
  |                                  |--- 8. BR-273-09: Decrypt secret     |
  |                                  |     via EncryptionUtil.decrypt()     |
  |                                  |                                    |
  |                                  |--- 9. BR-273-03: TotpValidator.validate|
  |                                  |     (+/-30s window, constant-time)     |
  |                                  |                                    |
  |                                  |--- 9a. SUCCESS path:                |
  |                                  |     - reset failed_login_count = 0  |
  |                                  |     - reset failed_totp_count = 0   |
  |                                  |     - update last_login_at          |
  |                                  |     - generate access + refresh JWT |
  |                                  |     - log: TOTP + SUCCESS           |
  |                                  |                                    |
  |                                  |--- 9b. FAIL path:                   |
  |                                  |     - increment failed_totp_count   |
  |                                  |     - if >= 5 -> BR-273-05 lock 15m|
  |                                  |     - log: TOTP + FAIL              |
  |                                  |                                    |
  |   200 OK                         |                                    |
  |   {accessToken, refreshToken,    |--- INSERT login_audit_logs           |
  |    user, expiresIn: 900}         |                                    |
  |<------------------------------ |                                    |
```

### Decision Tree (TotpAuthService.authenticateCredentials)

```
username/password received
    |
    |-- Always: compute password hash check (dummy hash if user not found)
    |
    |-- User not found OR password mismatch
    |   |-- increment failed_login_count
    |   |-- check threshold (F-277 integration)
    |   |-- log: CREDENTIALS + FAIL + WRONG_PASSWORD
    |   |-- throw -> "Sai thong tin dang nhap" (401)
    |
    |-- Account locked? (account_locked_until > now())
    |   |-- YES -> log: CREDENTIALS + FAIL + ACCOUNT_LOCKED
    |              |-- throw -> "Tai khoan da bi khoa..." (403)
    |
    |-- is_totp_enabled = false?
    |   |-- YES -> log: CREDENTIALS + FAIL + TOTP_NOT_ENABLED
    |              |-- return -> requiresTotpSetup=true (200 business error)
    |
    |-- Everything OK -> log: CREDENTIALS + SUCCESS
                       -> return -> challenge_2fa=true, userId (200)
```

### Decision Tree (TotpAuthService.verifyTotp)

```
userId + totpCode received
    |
    |-- Validate totpCode format (6 digits regex)
    |   |-- FAIL -> throw -> "Ma TOTP phai la 6 chu so" (400)
    |
    |-- Load user by ID (fetch totp_secret_encrypted)
    |   |-- User not found -> throw -> "Sai thong tin dang nhap" (401)
    |
    |-- Decrypt totp_secret_encrypted
    |   |-- Decryption fails -> throw -> "Sai thong tin dang nhap" (401)
    |
    |-- TotpValidator.validate(secret, totpCode)
    |   |
    |   |-- TRUE (valid within +/-30s window)
    |   |   |-- Reset failed_login_count = 0
    |   |   |-- Reset failed_totp_count = 0
    |   |   |-- Update last_login_at = now()
    |   |   |-- Generate access token (15m) + refresh token (7d)
    |   |   |-- Update last_login_at
    |   |   |-- log: TOTP + SUCCESS
    |   |   |-- return TwoFactorLoginResponse (200)
    |   |
    |   |-- FALSE (invalid)
    |       |-- Increment failed_totp_count
    |       |-- if failed_totp_count >= 5:
    |       |   |-- Set account_locked_until = now() + 15min
    |       |   |-- log: TOTP + FAIL + TOTP_MAX_ATTEMPTS
    |       |   |-- throw -> "Qua so lan thu..." (403)
    |       |-- log: TOTP + FAIL + TOTP_INVALID
    |       |-- throw -> "Ma TOTP khong hop le" (401, remainingAttempts=N)
```

---

## 5. JWT Integration with F-274

### 5.1 Integration Contract

F-273 **produces** tokens via `JwtUtil` (owned by F-274). The integration points are:

| Aspect | F-273 Responsibility | F-274 Responsibility |
|--------|---------------------|---------------------|
| Token generation | Calls `JwtUtil.generateAccessToken(user)` and `generateRefreshToken(user)` | Implements these methods with correct claims, JTI generation, signing |
| Claim structure | Defines what claims are needed (`sub`, `jti`, `role`, `role_level`, `totp_enabled`, `iat`, `exp`) | Populates these claims correctly |
| Token verification | `JwtAuthFilter` checks `totp_enabled` claim | Maintains `validateToken()` that parses all claims |
| Token refresh | - (out of scope) | `POST /api/auth/refresh` endpoint |
| Token blacklist | - (out of scope) | Store `jti` in Redis on logout |
| Logout | - (out of scope) | Invalidate refresh token + blacklist access token |

### 5.2 JwtAuthFilter Enhancement

The existing `JwtAuthFilter.doFilterInternal()` must add this check **after** successful token validation:

```java
// After extracting username and role (existing code):
Claims claims = jwtUtil.validateToken(token);

// NEW: Enforce 2FA completion for all protected requests
if (!Boolean.TRUE.equals(claims.get("totp_enabled", Boolean.class))) {
    log.warn("Request from user without 2FA completion: {}", claims.getSubject());
    SecurityContextHolder.clearContext();
    return;
}
```

This ensures that even if a token from a pre-F-273 deployment is presented, it will be rejected because it lacks the `totp_enabled` claim.

### 5.3 Role Level Mapping

F-273 calculates `role_level` for the JWT claim based on the user's role. F-275 owns the full authorization matrix, but F-273 provides this minimal mapping:

```java
private int calculateRoleLevel(String role) {
    return switch (role != null ? role : "ROLE_USER") {
        case "ROLE_SUPER_ADMIN" -> 4;
        case "ROLE_SYSTEM_ADMIN", "ROLE_ADMIN" -> 3;
        case "ROLE_SUPPORT", "ROLE_OPERATOR" -> 2;
        default -> 1;  // ROLE_USER
    };
}
```

### 5.4 JwtProperties Extension

Add these properties to `JwtProperties` for configuration-driven TTL tuning:

```yaml
jwt:
  secret: <base64>
  expiration: 86400000          # default token (existing)
  access-token-expiration: 900000       # 15 minutes (NEW)
  refresh-token-expiration: 604800000   # 7 days (NEW)
```

---

## 6. Audit Logging Implementation

### 6.1 Design Principles

1. **Every attempt logged** - both success and failure, both credential and TOTP phases
2. **Dedicated transaction** - `@Transactional` on `logLoginAttempt()` ensures logging even if the main flow fails
3. **Non-blocking** - audit log is a write-only sink; failures to persist do NOT cause login to fail
4. **IP extraction** - honors `X-Forwarded-For` header for behind-proxy deployments
5. **Cleanup** - entries older than 90 days deleted by existing `LogCleanupScheduler` (to be extended)

### 6.2 Logged Events Matrix

| Event | attempt_type | result | failed_reason | HTTP Status |
|-------|-------------|--------|---------------|-------------|
| Credentials: valid password -> 2FA | CREDENTIALS | SUCCESS | (null) | 200 |
| Credentials: wrong password | CREDENTIALS | FAIL | WRONG_PASSWORD | 401 |
| Credentials: account locked | CREDENTIALS | FAIL | ACCOUNT_LOCKED | 403 |
| Credentials: TOTP not enabled | CREDENTIALS | FAIL | TOTP_NOT_ENABLED | 200 |
| TOTP: valid code -> JWT issued | TOTP | SUCCESS | (null) | 200 |
| TOTP: wrong code (retry OK) | TOTP | FAIL | TOTP_INVALID | 401 |
| TOTP: max attempts exceeded | TOTP | FAIL | TOTP_MAX_ATTEMPTS | 403 |
| TOTP: format error | TOTP | FAIL | TOTP_FORMAT_ERROR | 400 |

### 6.3 Implementation Note - Transaction Isolation

The `TotpAuthService` methods themselves run in their own `@Transactional` context. The audit log service uses a **separate `@Transactional`** annotation. This means the audit log is committed independently of the main login transaction. If the login transaction rolls back, the audit log is still persisted - ensuring full visibility into failed attempts.

---

## 7. Anti-Enumeration Strategy (BR-273-10)

### 7.1 The Threat

An attacker can probe `/api/auth/login` with different usernames to enumerate valid accounts in the system - a critical reconnaissance capability.

### 7.2 Implementation: Always-Compute Pattern

**Current AuthController (WRONG for F-273):**
```java
User user = userRepository.findByUsername(username)
    .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
```
This reveals whether a username exists - `orElseThrow` is only reached if the username exists.

**F-273 Implementation (CORRECT):**
```java
User user = userRepository.findByUsername(username).orElse(null);
String dummyPassword = "$2a$10$dummyhashfortimingattack...";
boolean passwordMatch = user != null
    && passwordEncoder.matches(password, user.getPassword());

if (!passwordMatch) {
    // Same message regardless of user existence
    throw new AuthenticationException("Sai thông tin đăng nhập");
}
```

Key points:
1. **Always run `passwordEncoder.matches()`** - even for null user, using a dummy hash
2. **Same error message** - "Sai thông tin đăng nhập" for both "user not found" and "wrong password"
3. **Same HTTP status** - 401 for both cases
4. **Constant-time password check** - Spring's `BCryptPasswordEncoder.matches()` is already constant-time

### 7.3 TOTP-Level Enumeration Prevention

On the TOTP phase, only the `userId` from Phase 1 is accepted. A random/sequential `userId` from an attacker that wasn't returned in the Phase 1 response will fail with the same generic message.

### 7.4 TOTP Counter-Tampering

The `failed_totp_count` is stored server-side (in the database), so clients cannot manipulate their attempt counter by clearing state.

---

## 8. Implementation Phases & Order

### Phase 1: Foundation (Entity + DB) - ~0.5 day

- [ ] Add 5 new columns to `User.java` (totpEnabled, totpSecretEncrypted, failedLoginCount, failedTotpCount, accountLockedUntil)
- [ ] Create `LoginAuditLog.java` entity + `LoginAttemptType` + `LoginAttemptResult` enums
- [ ] Create `LoginAuditLogRepository.java`
- [ ] Write migration SQL (ALTER TABLE app_users, CREATE TABLE login_audit_logs, indexes)
- [ ] Update `SecurityConfig.java`: add `/api/auth/login/totp` to permitAll

### Phase 2: Core Services - ~1 day

- [ ] Add `google-authenticator:1.0.0` dependency to `pom.xml`
- [ ] Implement `TotpValidator.java` (wrap library, constant-time compare, +/-1 tolerance)
- [ ] Implement `TotpAuthService.java` (2-phase orchestrator with full decision tree)
- [ ] Implement `LoginAuditLogService.java` (transactional logging with IP extraction)
- [ ] Extend `JwtUtil.java` (generateAccessToken, generateRefreshToken, role_level mapping)
- [ ] Update `JwtProperties.java` (add access-token-expiration, refresh-token-expiration)

### Phase 3: Controller + DTOs - ~0.5 day

- [ ] Create `TotpLoginRequest.java`, `TwoFactorLoginResponse.java`, `MfaChallengeResponse.java`
- [ ] Refactor `AuthController.java` - split login into 2-phase flow
- [ ] Implement `POST /api/auth/login/totp` endpoint
- [ ] Update `GlobalExceptionHandler.java` - add handler for 2FA-specific exceptions

### Phase 4: Security Hardening - ~0.5 day

- [ ] Enhance `JwtAuthFilter.java` - check `totp_enabled` claim
- [ ] Implement "always-compute" password verification in `TotpAuthService`
- [ ] Add `UserRepository.findByUsernameOrEmail()` query method
- [ ] Update `LogCleanupScheduler` to include `login_audit_logs` table

### Phase 5: Testing - ~1 day

- [ ] Unit tests: `TotpValidator` with RFC 6238 Appendix B test vectors
- [ ] Unit tests: `JwtUtil` token generation (access + refresh, claim verification)
- [ ] Unit tests: `TotpAuthService` decision tree (all branches)
- [ ] Unit tests: `LoginAuditLogService` (transaction isolation, IP extraction)
- [ ] Unit tests: anti-enumeration (same response for non-existent vs wrong-password user)
- [ ] Integration tests: full 2FA flow (register -> setup TOTP -> login 2FA -> receive JWT)
- [ ] Integration tests: edge cases (locked account, TOTP not enabled, TOTP max attempts)
- [ ] Integration tests: F-277 integration (failed_login_count threshold lock)
- [ ] Integration tests: F-274 integration (JWT parsed correctly, totp_enabled claim present)
- [ ] Security tests: timing attack resistance (constant-time comparison verified)

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `google-authenticator` library does not support SHA-256 or Base32 edge cases | Medium | Vendor-reviewed library (1.0.0), verify with RFC 6238 Appendix B vectors |
| Clock drift between client and server causing TOTP rejection | Medium | +/-1 time-step tolerance (+/-30s) built into `TotpValidator` |
| Migration adds columns to production `app_users` table - downtime risk | High | Use `ADD COLUMN IF NOT EXISTS` (idempotent), test on staging first |
| Anti-enumeration "always-compute" pattern adds slight latency per request | Low | Negligible (BCrypt check is already the dominant cost) |
| TOTP secret decryption failure causes login failure | Medium | Catch decryption errors -> generic error message + audit log |
| JwtAuthFilter `totp_enabled` check blocks pre-existing tokens | Low | Pre-F-273 tokens lack the claim -> they will be rejected. Deploy F-273 before other auth-dependent features |

---

## 10. Acceptance Criteria Checklist

- [ ] 2FA login succeeds: credentials -> TOTP -> JWT (access + refresh)
- [ ] Account locked -> reject with `ACCOUNT_LOCKED` (BR-273-06)
- [ ] User without TOTP setup -> redirect to F-272 setup (BR-273-01)
- [ ] JWT only issued after 2FA pass (BR-273-07)
- [ ] Generic error messages prevent enumeration (BR-273-10)
- [ ] TOTP code valid in 30s window (BR-273-03)
- [ ] TOTP retry max 5, then 15-min lock (BR-273-05)
- [ ] Audit log captured for every attempt (BR-273-08)
- [ ] TOTP secret encrypted at rest (BR-273-09)
- [ ] Failed counters reset on success (BR-273-04)
- [ ] JwtAuthFilter enforces `totp_enabled` claim
- [ ] F-274 integration: tokens have `jti`, `role_level`, `totp_enabled` claims
- [ ] All BR-273-01 through BR-273-10 traceable and verified

---

## 11. Cross-Feature Integration Summary

| Feature | Integration Point | Direction |
|---------|------------------|-----------|
| **F-271** (Registration) | Reads `password` (BCrypt hash) | Read-only |
| **F-272** (TOTP Setup) | Reads `is_totp_enabled`, `totp_secret_encrypted` | Read-only (populated by F-272) |
| **F-274** (JWT Session) | Calls `JwtUtil.generateAccessToken()`, `generateRefreshToken()` | Producer -> Consumer (F-273 produces, F-274 owns lifecycle) |
| **F-275** (3-Level Authz) | Writes `role_level` claim in JWT | F-273 produces claim, F-275 owns mapping |
| **F-276** (Password Policy) | Verifies via `BCryptPasswordEncoder` | Read-only (policy owned by F-276) |
| **F-277** (Login Attempt Policy) | Reads/writes `failed_login_count`, `failed_totp_count`, `account_locked_until` | Shared state with F-277 |

---

## 12. Configuration Parameters (yaml)

```yaml
jwt:
  secret: <base64-encoded-32-byte-key>
  expiration: 86400000          # existing - fallback token TTL
  access-token-expiration: 900000       # NEW - 15 minutes
  refresh-token-expiration: 604800000   # NEW - 7 days

totp:
  time-step: 30                 # seconds per TOTP period
  tolerance: 1                  # +/-time-steps
  digits: 6                     # code length
  hash-algorithm: HmacSHA256    # HMAC algorithm
  max-attempts: 5               # max failed TOTP before temp lock
  lock-duration-minutes: 15     # temporary lock duration

encryption:
  key: <base64-encoded-32-byte-key>  # AES-256-GCM key (existing)

audit:
  log-retention-days: 90         # cleanup threshold (existing scheduler)
```

---

## Appendix: Entity Column Additions Detail

### User Entity - New Fields

```java
@Column(name = "is_totp_enabled", nullable = false, columnDefinition = "boolean default false")
private boolean totpEnabled = false;

@Column(name = "totp_secret_encrypted", length = 255)
private String totpSecretEncrypted;

@Column(name = "failed_login_count", nullable = false, columnDefinition = "integer default 0")
private int failedLoginCount = 0;

@Column(name = "failed_totp_count", nullable = false, columnDefinition = "integer default 0")
private int failedTotpCount = 0;

@Column(name = "account_locked_until")
private LocalDateTime accountLockedUntil;
```

### LoginAuditLog Entity - Full Definition

```java
@Entity
@Table(name = "login_audit_logs")
@Getter @NoArgsConstructor @SQLRestriction("deleted_at IS NULL")
public class LoginAuditLog extends BaseEntity {
    @Column(name = "user_id") private UUID userId;
    @Enumerated(EnumType.STRING) @Column(name = "attempt_type", nullable = false, length = 20)
        private LoginAttemptType attemptType;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10)
        private LoginAttemptResult result;
    @Column(name = "ip_address", length = 45) private String ipAddress;
    @Column(name = "user_agent", length = 1000) private String userAgent;
    @Column(name = "failed_reason", length = 50) private String failedReason;

    public static LoginAuditLog forCredentials(UUID userId, LoginAttemptResult result,
        String failedReason, String ipAddress, String userAgent);
    public static LoginAuditLog forTotp(UUID userId, LoginAttemptResult result,
        String failedReason, String ipAddress, String userAgent);
}
```
