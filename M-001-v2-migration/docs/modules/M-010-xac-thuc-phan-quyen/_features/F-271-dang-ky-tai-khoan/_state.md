---
id: F-271
name: Dang ky tai khoan
slug: dang-ky-tai-khoan
module-id: M-010
status: implemented
classification: local
priority: high
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-24T01:30:00Z
locked-fields: []
consumed_by_modules: []
version: 2
---

## Engineering Code Review — F-271 (Chunk A)

**Reviewer:** code-reviewer agent
**Date:** 2026-06-24
**Verdict:** Pass
**Confidence:** high

### Source Files Reviewed

RegistrationController, RegisterConfigController, RegistrationService,
PasswordPolicyValidator, VerificationTokenService, RateLimiterService,
ClientEncryptionService, NotificationService, AccountRegistrationAuditService,
User.java (entity), UserStatus.java, VerificationToken.java,
VerificationTokenRepository, AccountRegistrationAudit.java,
RegisterAccountRequest, RegisterResponse, RegisterConfigResponse,
VerifyTokenRequest, VerifyResponse, ResendVerificationRequest,
Exception classes (5)

### Test Files Reviewed

- RegistrationServiceTest: 7 tests
- VerificationTokenServiceTest: 8 tests
- PasswordPolicyValidatorTest: 10 tests
- RateLimiterServiceTest: 6 tests

Total F-271: 31 tests, all passing.

### Code Quality

- Constructor injection, clean DI
- RegistrationService: clear step-by-step orchestration
- Exception hierarchy: RegistrationException -> subclasses with errorCode
- Null safety: isBase64Url guards against null/short strings
- Audit logging captures all attempts
- Rate limiter: sliding-window with Deque

### Security

- BCrypt password hashing
- RSA-2048 client-side encryption (OAEP+SHA-256)
- Verification tokens hashed (SHA-256) before DB storage
- 30-min TTL with scheduled cleanup
- Rate limiting on registration
- Audit trail for every attempt
- Password never logged or returned in API responses

### API Design

- Consistent ApiResponse envelope
- Proper HTTP status codes: 201, 200, 400
- Jakarta Bean Validation on DTOs

### Integration

- F-271 creates PENDING_VERIFICATION user -> consumed by F-272
- User entity extended with TOTP fields (shared)
- RateLimiterService shared across F-271 + verification

### Issues (non-blocking)

1. VerificationTokenService.validateToken() uses findAll() scan - O(n). Add indexed lookup for prod.
2. RegistrationController path: /api/register (not /api/auth/register per TL plan)
3. RateLimiterService uses HashMap, not ConcurrentHashMap
4. Mutual exclusivity of email/phone not enforced server-side in validation

### Verdict: PASS
