# Code Review Verdict: F-273 - Dang nhap lan tiep theo + TOTP

## Overall: **Pass** ok

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 9     | Reuses TotpAuthService 2-phase flow (same orchestrator). Phase 2 handles subsequent logins with existing TOTP. Lockout integration with F-277 via failedTotpCount threshold |
| Code Quality    | 8     | Clean implementation, but duplicates account lock checking (duplicate logic from TotpAuthService). TotpAuthService already handles subsequent TOTP login |
| Testing         | 9     | 10 tests covering skip MFA, user not found, wrong password, valid TOTP, invalid TOTP, not enabled, locked account, max attempts lock, refresh token |
| Security        | 9     | Anti-enumeration (dummy hash), max 5 TOTP attempts -> 15-min lock, TOTP 6-digit validation, account lockout enforcement |

---

## Files Reviewed (10)

### Core Service (1)
- **`src/main/java/com/hanghai/kchtg/user/service/TotpAuthService.java`** — Primary implementation for both F-272 and F-273. `authenticateCredentials()` (Phase 1) and `verifyTotp()` (Phase 2). For F-273: if `user.getTotpEnabled() == true`, enters Phase 2 for TOTP validation. Max 5 TOTP failures -> 15-min account lock.

### Supporting Services/Classes (8)
- **`src/main/java/com/hanghai/kchtg/security/TotpValidator.java`** — RFC 6238 TOTP validation, secret generation, hash, constant-time comparison
- **`src/main/java/com/hanghai/kchtg/security/service/TokenService.java`** — JWT access + refresh token creation
- **`src/main/java/com/hanghai/kchtg/security/JwtUtil.java`** — HMAC-SHA256 signing, claim building
- **`src/main/java/com/hanghai/kchtg/user/service/LoginAuditLogService.java`** — Audit logging per attempt
- **`src/main/java/com/hanghai/kchtg/user/dto/MfaChallengeResponse.java`** — Challenge response DTO
- **`src/main/java/com/hanghai/kchtg/user/dto/TotpLoginRequest.java`** — TOTP login request DTO
- **`src/main/java/com/hanghai/kchtg/user/dto/TwoFactorLoginResponse.java`** — Dual JWT response DTO
- **`src/main/java/com/hanghai/kchtg/user/service/RateLimiterService.java`** — Rate limiting for registration (indirect integration)

### Test (1)
- **`src/test/java/com/hanghai/kchtg/user/service/TotpAuthServiceTest.java`** — 10 tests: skip MFA, user not found (anti-enumeration), wrong password + increment, valid TOTP, invalid TOTP, not enabled, locked account, max attempts lock, refresh token

---

## Review Checklist

- [x] Entity Design: User with totpEnabled=true, totpSecret, failedTotpCount, accountLockedUntil
- [x] Service: TotpAuthService handles both first-login (F-272) and subsequent-login (F-273) via totpEnabled check
- [x] Security: Account lock after 5 TOTP failures (15 min), anti-enumeration, audit logging
- [x] RFC 6238: Real TOTP validation with google-authenticator-java
- [x] Dual JWT: Access + refresh tokens issued after 2FA success
- [x] F-277 Integration: failedTotpCount threshold triggers account lockout (same mechanism as F-277 credential lock)
- [x] Test Coverage: 10 tests, real TOTP code generation with GoogleAuthenticator
- [x] Naming: Consistent conventions

---

## Findings

### Critical: None

### Blocking: None

### Major:

1. **F-273 is effectively the same code as F-272** — `TotpAuthService.java` serves both features. F-272's `verifyTotp()` and F-273's TOTP validation use the exact same method. The only difference is F-272 generates a new secret + QR during setup, while F-273 validates an existing secret. **Recommendation:** Document this shared responsibility clearly. Consider whether F-272 and F-273 should be merged as a single "TOTP Flow" feature.

2. **TotpAuthService.verifyTotp() has duplicate account lock checking** — Lines 172-187 check `UserStatus.LOCKED` and `accountLockedUntil` — duplicated from Phase 1 credential check (lines 100-115). **Recommendation:** Extract lock checking to a shared method.

### Minor:

1. **User.setLastTotpCode(totpCode) stores last TOTP code in plain text** — `TotpAuthService.java:229`: storing the actual TOTP code is unnecessary and adds attack surface. **Recommendation:** Remove this field; only store the verification timestamp (`totpVerifiedAt`).

2. **Brute-force TOTP is only 5 attempts with no progressive delay** — 5 attempts in 30s window is tight. An attacker could try 30 codes/minute. **Recommendation:** Add exponential backoff or CAPTCHA after 3 failures.

---

## Verdict Justification

**PASS** — F-273 shares code with F-272 (TotpAuthService) which is acceptable since the underlying logic is identical. The implementation is secure with anti-enumeration, TOTP validation via RFC 6238 library, proper lockout integration, and strong test coverage (10 tests). The F-272/F-273 code overlap is an architectural observation, not a defect.

---

## Recommendation

**APPROVE** — F-273 subsequent TOTP login is production-ready.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: APPROVED
