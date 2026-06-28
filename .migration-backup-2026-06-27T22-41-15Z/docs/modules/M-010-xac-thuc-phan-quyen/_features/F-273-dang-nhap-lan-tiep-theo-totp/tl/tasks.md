# F-273: Dang nhap lan tiep theo + TOTP -- Task Breakdown (Tech-Lead)

> Module: M-010 (Xac thuc & Phan quyen)
> TL version: v1.0 - 2026-06-23
> SA Design: sa/feature-design.md
> Implementation Plan: implementation-plan.md
> Target stack: Spring Boot 3.3.6 / Java 17 / PostgreSQL / JJWT 0.12.5

---

## 1. Wave 1: Foundation (Entity + DB) (Dev-days: 0.5)

### T-273-01: User Entity Extensions (0.25 day)
| Owner | Backend Dev |
| Files | User.java (extend with 5 new columns) |
| Description | Add: is_totp_enabled, totp_secret_encrypted, failed_login_count, failed_totp_count, accountLockedUntil. |
| Dependencies | F-271 (User entity baseline), F-272 (TOTP setup populates totp_enabled/secret) |
| Acceptance | DDL adds columns via Hibernate. Default values correct. |

### T-273-02: LoginAuditLog Entity + Repository (0.25 day)
| Owner | Backend Dev |
| Files | LoginAuditLog.java (NEW), LoginAttemptType.java (enum, NEW), LoginAttemptResult.java (enum, NEW), LoginAuditLogRepository.java (NEW) |
| Description | Create audit log entity with factory methods forCredentials/forTotp. Repository with query methods. |
| Dependencies | T-273-01 |
| Acceptance | Entity maps to login_audit_logs table. Factory methods create correct instances. |

## 2. Wave 2: Core Services (Dev-days: 1.5)

### T-273-03: TOTP Validator (0.5 day)
| Owner | Backend Dev |
| Files | TotpValidator.java |
| Description | RFC 6238 TOTP validation: +/-1 time-step tolerance, constant-time comparison, 6-digit input validation. Uses google-authenticator library. |
| Dependencies | Add com.warrenstrange:google-authenticator:1.0.0 to pom.xml |
| Acceptance | validate() returns true for known secret+time (RFC 6238 Appendix B vectors). Constant-time verified. |

### T-273-04: TotpAuthService (0.75 day)
| Owner | Backend Dev |
| Files | TotpAuthService.java |
| Description | 2-phase orchestrator: authenticateCredentials() (Phase 1) -> verifyTotp() (Phase 2). Full decision tree per SA section 4. Anti-enumeration (always-compute). |
| Dependencies | T-273-03 |
| Acceptance | Phase 1: returns MfaChallengeResponse if 2FA required. Phase 2: returns JWT or rejects with error codes. |

### T-273-05: LoginAuditLogService (0.25 day)
| Owner | Backend Dev |
| Files | LoginAuditLogService.java |
| Description | Transactional audit logging with IP extraction (X-Forwarded-For). Non-blocking: failures do not cause login failure. |
| Dependencies | T-273-02 |
| Acceptance | Every login attempt logged. IP correctly extracted from proxy headers. |

## 3. Wave 3: JWT + Controller (Dev-days: 1.5)

### T-273-06: JwtUtil Extension (0.5 day)
| Owner | Backend Dev |
| Files | JwtUtil.java (extend), JwtProperties.java (extend) |
| Description | Add generateAccessToken(User) - 15min expiry, generateRefreshToken(User) - 7d expiry. role_level claim mapping. Access/refresh TTL config properties. |
| Dependencies | None |
| Acceptance | Tokens have correct claims (sub, jti, role, role_level, totp_enabled, iat, exp). TTL matches config. |

### T-273-07: AuthController Refactor (0.5 day)
| Owner | Backend Dev |
| Files | AuthController.java (refactor), SecurityConfig.java (extend) |
| Description | Split login into 2-phase: POST /api/auth/login (credentials) -> POST /api/auth/login/totp (TOTP). PermitAll for both endpoints. |
| Dependencies | T-273-04, T-273-06 |
| Acceptance | Phase 1 returns MfaChallengeResponse. Phase 2 returns TwoFactorLoginResponse. SecurityConfig permits both endpoints. |

### T-273-08: DTOs (0.25 day)
| Owner | Backend Dev |
| Files | TotpLoginRequest.java, TwoFactorLoginResponse.java, MfaChallengeResponse.java |
| Description | 3 new DTOs for 2FA flow. TotpLoginRequest with @Pattern validation for 6-digit code. |
| Dependencies | None (parallel with T-273-07) |
| Acceptance | DTOs compile. Validation works (rejects non-6-digit codes). |

## 4. Wave 4: Security Hardening (Dev-days: 0.5)

### T-273-09: JwtAuthFilter Enhancement (0.25 day)
| Owner | Backend Dev |
| Files | JwtAuthFilter.java |
| Description | Check totp_enabled claim. Reject requests without 2FA completion. |
| Dependencies | T-273-06 |
| Acceptance | JWT without totp_enabled claim is rejected by filter. |

### T-273-10: Error Handling + Log Cleanup (0.25 day)
| Owner | Backend Dev |
| Files | GlobalExceptionHandler.java (extend), LogCleanupScheduler.java (extend) |
| Description | Add 2FA-specific error handlers (TOTP_INVALID, TOTP_MAX_ATTEMPTS, etc.). Extend cleanup for login_audit_logs (90-day retention). |
| Dependencies | T-273-08 |
| Acceptance | Error handlers return correct codes. Cleanup scheduler includes login_audit_logs. |

## 5. Wave 5: Testing (Dev-days: 1)

### T-273-11: Tests (1 day)
| Owner | Backend Dev |
| Description | Unit: RFC 6238 vectors, JWT generation, anti-enumeration (same response for non-existent vs wrong-password user). Integration: full 2FA flow, locked account, TOTP not enabled, F-277 integration. |
| Dependencies | T-273-09, T-273-10 |
| Acceptance | All unit and integration tests pass. |

## 6. Dependency Map

### Internal Dependencies (within M-010)
| Task | Depends On |
| T-273-01 to T-273-11 | F-271 (User.password_hash for credential auth) |
| T-273-01, T-273-04 | F-272 (totp_enabled, totp_secret_encrypted populated by F-272) |
| T-273-06 | F-274 (JwtUtil for token generation, refresh, blacklist) |
| T-273-04, T-273-06 | F-275 (role_level claim mapping) |
| T-273-04, T-273-10 | F-277 (lockout: failed_login_count, failed_totp_count, account_locked_until) |

### External Dependencies
| Feature | Dependency | Impact |
| F-271 | Reads password_hash (BCrypt) | F-273 verifies credentials created by F-271 |
| F-272 | Reads totp_enabled, totp_secret_encrypted | F-272 populates these; F-273 reads them |
| F-274 | F-273 calls JwtUtil for token issuance | F-274 owns JWT lifecycle (refresh, blacklist, logout) |
| F-275 | F-273 produces role_level claim | F-275 owns full 3-level authorization matrix |
| F-276 | F-273 verifies via BCryptPasswordEncoder | Password policy owned by F-276 |
| F-277 | Shared: failed_login_count, failed_totp_count, account_locked_until | F-273 integrates but does not own lock policy |

## 7. Task Estimation Summary
| Phase | Tasks | Total Dev-Days |
| Wave 1: Foundation | T-273-01 to T-273-02 | ~0.5 days |
| Wave 2: Core Services | T-273-03 to T-273-05 | ~1.5 days |
| Wave 3: JWT + Controller | T-273-06 to T-273-08 | ~1.5 days |
| Wave 4: Security Hardening | T-273-09 to T-273-10 | ~0.5 days |
| Wave 5: Testing | T-273-11 | ~1 day |
| Total | 11 tasks | ~5 days |

## 8. Implementation Order (Critical Path)
T-273-01 (Entity) -> T-273-03 (TOTP Validator) -> T-273-04 (TotpAuthService) -> T-273-06 (JwtUtil) -> T-273-07 (AuthController) -> T-273-11 (Tests)
T-273-02 (AuditLog) -> T-273-05 (AuditSvc) -> T-273-08 (DTOs) -> T-273-10 (Error/Audit) -> T-273-09 (JwtAuthFilter)