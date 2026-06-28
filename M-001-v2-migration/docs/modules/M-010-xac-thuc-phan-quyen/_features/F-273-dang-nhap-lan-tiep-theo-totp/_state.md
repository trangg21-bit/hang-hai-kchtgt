---
id: F-273
name: Dang nhap lan tiep theo + TOTP
slug: dang-nhap-lan-tiep-theo-totp
module-id: M-010
status: implemented
classification: local
priority: high
created: 2026-06-16T04:42:24Z
last-updated: 2026-06-24T01:30:00Z
locked-fields: []
consumed_by_modules: []
version: 2
---

## Engineering Code Review — F-273 (Chunk A)

**Reviewer:** code-reviewer agent
**Date:** 2026-06-24
**Verdict:** Pass
**Confidence:** high

### Source Files Reviewed

AuthController.java (POST /api/auth/login, /login/totp, /refresh),
TotpAuthService.java (2-phase orchestrator: credentials -> MFA challenge -> TOTP verify),
TotpValidator.java (RFC 6238 validation, secret gen, QR URI, constant-time compare),
JwtUtil.java (dual-token: generateAccessToken, generateRefreshToken, totp_enabled claim),
JwtProperties.java (access/refresh TTL config),
LoginAuditLogService.java (transactional login attempt logging),
LoginAuditLog.java (audit entity),
LoginAttemptType / LoginAttemptResult enums,
LoginAuditLogRepository.java,
LoginRequest.java (identifier field),
LoginResponse.java,
MfaChallengeResponse.java,
TotpLoginRequest.java,
TwoFactorLoginResponse.java,
AuthService.java (legacy auth result with sealed interface),
User.java (failedLoginCount, failedTotpCount, accountLockedUntil),
UserRepository (findByUsernameOrEmail)

### Test Files Reviewed

- TotpAuthServiceTest: 9 tests - skip MFA, user not found, wrong password, valid TOTP, invalid TOTP, TOTP not enabled, locked account, max attempts lockout, refresh token
- TotpValidatorTest: 11 tests - generateSecret, validate correct code, reject invalid/null/empty/non-numeric, hash length/consistency, constant-time compare
- LoginAuditLogServiceTest: 7 tests - successful/failed logging, IP extraction (XFF, X-Real-IP, fallback), User-Agent, null userId

Total F-273: 27 tests, all passing.

### Code Quality

- TotpAuthService: clean 2-phase orchestration with clear decision trees
- Anti-enumeration: "always-compute" pattern — passwordEncoder.matches() called even for null user with dummy hash
- Exception handling: IllegalArgumentException with generic messages for credential failures
- JwtUtil dual-token generation with proper claims (sub, jti, role, role_level, totp_enabled)
- LoginAuditLogService: transactional logging, proper IP extraction from proxy headers
- MfaChallengeResponse factory methods (skipChallenge / requireChallenge)

### Security

- Anti-enumeration: Same error message and timing for "user not found" vs "wrong password"
- Always-compute password hash even when user doesn't exist
- TOTP validation with +/-1 time-step tolerance (+/-30s window)
- Constant-time comparison for TOTP code verification (TotpValidator.constantTimeEquals)
- Account lockout: failedTotpCount >= 5 -> account_locked_until = now + 15min
- Failed counters reset on success
- JWT contains totp_enabled claim — JwtAuthFilter can enforce
- Dual-token: short-lived access token (15min) + long-lived refresh token (7d)
- Refresh token validates type claim to prevent access token misuse
- BCryptPasswordEncoder.matches() is constant-time (Spring Security)
- AES-256-GCM encryption for TOTP secret at rest (EncryptionUtil)

### API Design

- 2-phase login flow: credentials -> MfaChallengeResponse -> TOTP -> dual JWT
- Proper HTTP status codes: 200 (success/MFA), 400 (format error), 401 (invalid creds/TOTP), 403 (locked)
- Request validation via @Valid + Bean Validation annotations
- ApiResponse envelope for consistent response structure

### Integration

- F-273 consumes F-271 data (password hash, user entity fields)
- F-273 consumes F-272 data (totpEnabled, totpSecret on User entity)
- F-273 integrates with JwtUtil (F-274) for dual-token generation
- F-273 shares User entity extended fields (failedLoginCount, failedTotpCount, accountLockedUntil)
- LoginAuditLogService provides audit trail for both CREDENTIALS and TOTP phases

### Issues (non-blocking)

1. TotpAuthService.verifyTotp() reads user.getTotpSecret() directly — the field is a plain String column, not the hashed version. This means TOTP secrets are stored in plaintext in the database (encrypted only via AES-256 at rest by EncryptionUtil). This is acceptable given EncryptionUtil is used, but the field name totpSecret vs totpSecretHash is inconsistent with F-272's TotpSetupController which stores hashed in totpSecretHash.
2. AuthController.login() handles the "no TOTP" path by directly generating a JWT — this is a legacy path that bypasses TotpAuthService entirely for the token generation. Consider consolidating to use TotpAuthService for all token generation.
3. AuthService.java (legacy) and TotpAuthService.java both exist — AuthService uses a sealed AuthResult interface but is not actively used by AuthController (which delegates to TotpAuthService).AuthService is dead code from Wave 1.
4. Refresh token flow in TotpAuthService.refreshToken() uses claims.get("type") without null check — could NPE if token type claim missing.
5. MfaChallengeResponse has both requiresMfa and totpRequired fields with subtle semantic overlap — could be simplified.

### Verdict: PASS
