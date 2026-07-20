# F-276: Chinh sach mat khau -- Task Breakdown (Tech-Lead)

> Module: M-010 (Xac thuc & Phan quyen)
> TL version: v1.0 - 2026-06-23
> Implementation Plan: tl/implementation-plan.md
> Target stack: Spring Boot 3.3.6 / Java 17 / MSSQL 2022 / JPA / BCryptPasswordEncoder

---

## 1. Wave 1: Foundation + Policy Config (Dev-days: 4)

### T-276-01: Flyway Migrations V1-V3 — Create Tables (0.75 day)
| Owner | Backend Dev |
| Files | src/main/resources/db/migration/V1__create_password_policy.sql, V2__create_password_history.sql, V3__create_password_expiration_log.sql |
| Description | Create PasswordPolicy (singleton), PasswordHistory, PasswordExpirationLog tables. Seed default policy row. Add singleton guard triggers/unique constraints. Create indexes on PasswordHistory(userId, createdAt DESC) and PasswordExpirationLog(userId). |
| Dependencies | None (first migration) |
| Acceptance | Flyway validates and applies V1-V3 on dev DB. Tables created with correct types. Singleton row exists for PasswordPolicy. Indexes present. |

### T-276-02: Add Password Columns to User Entity (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/user/entity/User.java, src/main/resources/db/migration/V4__add_password_columns_to_user.sql |
| Description | Add `passwordHashVersion` (INT), `expiresAt` (DATETIME2), `lastChangedAt` (DATETIME2), `passwordStrengthScore` (TINYINT) to User entity. Write V4 migration. Backfill existing users: expiresAt = now() + 90 days, lastChangedAt = now(), hashVersion = 0. |
| Dependencies | T-276-01 |
| Acceptance | User entity has 4 new columns. V4 migration runs. Existing users have non-null expiresAt and lastChangedAt. |

### T-276-03: Entity Classes + Repositories (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/entity/PasswordPolicy.java, PasswordHistory.java, PasswordExpirationLog.java |
| Files | src/main/java/com/hanghai/kchtg/password/repository/PasswordPolicyRepository.java, PasswordHistoryRepository.java, PasswordExpirationLogRepository.java, UserPasswordRepository.java |
| Description | Create all JPA entities per implementation-plan section 2.2. Implement repository interfaces: `findTopNByUserIdOrderByCreatedAtDesc`, `findByUserIdAndStatus`, `findExpiringSoon`, `findExpired`. |
| Dependencies | T-276-01, T-276-02 |
| Acceptance | All entities compile with correct JPA annotations. Repository interfaces have correct method signatures. |

### T-276-04: DTOs (0.75 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/dto/ChangePasswordRequest.java, ChangePasswordResponse.java, PasswordPolicyResponse.java, PasswordPolicyUpdateRequest.java, PasswordStatusResponse.java, ExpiryReportResponse.java |
| Description | Create all DTOs per implementation-plan section 2.4. Add Jakarta Validation annotations (e.g., @NotBlank, @Size, @Min, @Max). |
| Dependencies | None (parallel with T-276-01) |
| Acceptance | All DTOs compile. Jackson serialization/deserialization works. |

### T-276-05: Exception Classes (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/exception/PasswordExpiredException.java, PasswordComplexityException.java, PasswordHistoryException.java, GlobalPasswordExceptionHandler.java |
| Description | Create exception classes per implementation-plan section 2.7. Implement `GlobalPasswordExceptionHandler` with @RestControllerAdvice — map each exception to correct HTTP status (400, 401, 403, 409). |
| Dependencies | None |
| Acceptance | Each exception has a distinct error code. Global handler returns correct HTTP status + generic error messages. |

### T-276-06: PasswordHashService + ComplexityValidator (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/service/PasswordHashService.java, ComplexityValidator.java, config/PasswordPolicyProperties.java |
| Description | Implement `PasswordHashService` as thin wrapper around BCryptPasswordEncoder. Implement `ComplexityValidator` with full validation pipeline (length, uppercase, lowercase, digit, special char, personal info block). Validate against default policy from `PasswordPolicyProperties`. Return `ComplexityResult` with all violations. |
| Dependencies | T-276-03, T-276-04 |
| Acceptance | hash() and verify() work with BCrypt. ComplexityValidator detects all violation types (TC-01 through TC-08 unit tests pass). |

### T-276-07: PasswordPolicyService (0.75 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/service/PasswordPolicyService.java |
| Description | Implement singleton CRUD: `getPolicy()`, `updatePolicy(PasswordPolicyUpdateRequest)`. Add `@Cacheable("passwordPolicy")` with 1-hour TTL. Implement cache eviction on update. Fallback to defaults if no DB row. |
| Dependencies | T-276-03 |
| Acceptance | First call loads from DB, subsequent calls served from cache. `updatePolicy()` updates DB, evicts cache. Returns updated policy. |

### T-276-08: GET Endpoints (0.75 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/controller/AuthPasswordController.java, PasswordPolicyController.java |
| Description | Implement `GET /api/auth/password-policy` (public, no auth) and `GET /api/auth/my-password-status` (authenticated). Return `PasswordPolicyResponse` and `PasswordStatusResponse` respectively. |
| Dependencies | T-276-06, T-276-07, T-276-04 |
| Acceptance | GET /api/auth/password-policy returns current policy config. GET /api/auth/my-password-status returns user's password status (ACTIVE/WARNING/EXPIRED) with daysRemaining. |

---

## 2. Wave 2: Change Password + History + Expiration Enforcement (Dev-days: 5)

### T-276-09: HistoryValidator + ExpirationChecker (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/service/HistoryValidator.java, ExpirationChecker.java |
| Description | Implement `HistoryValidator` — load top N hashes from DB, compare with BCrypt.checkpw for constant-time match. Implement `ExpirationChecker` — compute `PasswordStatus` enum (ACTIVE/WARNING_T7/WARNING_T3/WARNING_T1/EXPIRED) from expiresAt vs current time. |
| Dependencies | T-276-03 (repository), T-276-06 (hash comparison via BCryptPasswordEncoder) |
| Acceptance | HistoryValidator detects reuse from history (TC-09, TC-10). ExpirationChecker returns correct status for all boundary conditions (TC-11 through TC-15). Performance < 50ms for depth=5. |

### T-276-10: PasswordChangeService — Full Transactional Flow (1.5 days)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/service/PasswordChangeService.java |
| Description | Implement full change-password flow (pseudocode from implementation-plan section 5.1): verify current password → load policy → validate complexity → check duplicate with current → check history → apply change (update user, insert old hash into history, trim history, log change, increment hashVersion). All within single @Transactional. |
| Dependencies | T-276-06, T-276-07, T-276-09 |
| Acceptance | All change-password scenarios work (TC-PW-01 through TC-PW-04 unit tests pass). Old hash stored in history. hashVersion incremented. PasswordExpirationLog entry created. |

### T-276-11: POST /api/auth/change-password Endpoint (0.75 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/controller/AuthPasswordController.java |
| Description | Implement `POST /api/auth/change-password` — rate-limited (5 attempts/15min), authenticated. Accept ChangePasswordRequest, call PasswordChangeService, return result. Generic error message on failure (BR-276-09). |
| Dependencies | T-276-10, T-276-04 |
| Acceptance | Success → 200. Wrong current password → 401 generic error. Complexity violation → 400 with details. History reuse → 400. Rate limit exceeded → 429. |

### T-276-12: PasswordExpirationFilter (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/filter/PasswordExpirationFilter.java |
| Description | Implement OncePerRequestFilter with order = HIGHEST_PRECEDENCE + 10. Check user's expiresAt and passwordHashVersion. Block with 403 if EXPIRED (skip for /api/auth/change-password and /api/auth/login). Add X-Password-Status header for warnings. |
| Dependencies | T-276-09, SecurityConfig.java (existing — add filter registration) |
| Acceptance | Expired password → 403 with redirect URL. Warning → 200 with X-Password-Status + X-Days-Remaining headers. Active → pass through. |

### T-276-13: Integration Tests — Change Password Flow (1.5 days)
| Owner | Backend Dev |
| Files | src/test/java/com/hanghai/kchtg/password/PasswordChangeIntegrationTest.java |
| Description | Integration tests for POST /api/auth/change-password: success, wrong current password, complexity violation, history reuse, expired password login block, login after change. Also test GET endpoints. |
| Dependencies | T-276-11, T-276-12 |
| Acceptance | CI-01 through CI-10 integration test matrix all pass. |

---

## 3. Wave 3: Monitoring, Notifications, Admin Config (Dev-days: 4.5)

### T-276-14: ExpirationScanner + WarningProcessor (1.25 days)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/monitor/ExpirationScanner.java, WarningProcessor.java, ForcedChangeTrigger.java |
| Description | Implement daily cron (`@Scheduled(cron = "0 0 2 * * ?", zone = "Asia/Bangkok")`). Scan for expiring-soon and expired users. WarningProcessor tracks which thresholds already sent per user. ForcedChangeTrigger logs expired user events. |
| Dependencies | T-276-03 (repository), T-276-09 (ExpirationChecker) |
| Acceptance | Cron fires daily. Expiring-soon users get T-7/T-3/T-1 warnings (only once per threshold). Expired users logged. No duplicate warnings. |

### T-276-15: NotificationService Interface (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/service/NotificationService.java |
| Description | Define interface for password expiration warnings. Implement in-app notification (stored in DB/notification table). Email is optional/deferred — use ApplicationEventPublisher-based async stub. |
| Dependencies | None |
| Acceptance | Interface defined with sendWarning(User, threshold, expiresAt). In-app implementation stores notification record. |

### T-276-16: PUT /api/admin/password-policy Endpoint (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/controller/PasswordPolicyController.java |
| Description | Implement `PUT /api/admin/password-policy` — admin only (@PreAuthorize). Partial update support (only provided fields updated). Server-side validation (minLength 8-64, maxAgeDays 1-365, etc.). Cache eviction on success. |
| Dependencies | T-276-07 |
| Acceptance | Admin → 200 with updated policy. Non-admin → 403. Invalid values → 400. Cache evicted after update. |

### T-276-17: Admin Expiry Report Endpoint (0.75 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/password/controller/PasswordPolicyController.java |
| Description | Implement `GET /api/admin/password-policy/expiry-report` — paginated table of users by expiration status. Filter by status (EXPIRING_SOON, EXPIRED, ALL). Admin only. |
| Dependencies | T-276-14, T-276-04 |
| Acceptance | Returns paginated list of ExpiryReportResponse items. Filters work correctly. |

### T-276-18: Admin Integration Tests (1 day)
| Owner | Backend Dev |
| Files | src/test/java/com/hanghai/kchtg/password/AdminEndpointIntegrationTest.java |
| Description | Integration tests for admin endpoints: update policy, get policy, expiry report. Test role-based access (admin vs non-admin). |
| Dependencies | T-276-16, T-276-17 |
| Acceptance | CI-06, CI-07 pass. Admin-only endpoints return 403 for non-admin role. |

### T-276-19: Unit Tests — Services (1 day)
| Owner | Backend Dev |
| Files | src/test/java/com/hanghai/kchtg/password/ComplexityValidatorTest.java, HistoryValidatorTest.java, ExpirationCheckerTest.java, PasswordHashServiceTest.java, PasswordPolicyServiceTest.java, PasswordChangeServiceTest.java |
| Description | Unit tests for all service classes per implementation-plan section 13 (CU-01 through CU-24). Mock repositories and external dependencies. |
| Dependencies | T-276-06, T-276-07, T-276-09, T-276-10 |
| Acceptance | All 24 unit tests pass. Coverage > 85% for password service layer. |

---

## 4. Wave 4: JWT Integration + Rate Limiting + Frontend + Polish (Dev-days: 5)

### T-276-20: pwhashVersion Claim in JWT (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/security/JwtUtil.java (modify), JwtAuthFilter.java (modify), security/JwtPasswordVersionValidator.java (NEW) |
| Description | Add `pwhashVersion` claim to JWT payload (JwtUtil.generateToken). Implement JwtPasswordVersionValidator — compare JWT claim against DB value. Update JwtAuthFilter to check password version after JWT validation. |
| Dependencies | T-276-10 (hashVersion incremented on change) |
| Acceptance | After password change, old JWTs rejected with 401. New JWT has correct hashVersion. |

### T-276-21: F-277 Coordination — Skip Lockout on Expired-Password Flow (0.5 day)
| Owner | Backend Dev |
| Files | AuthController.java (modify — add request attribute), PasswordExpirationFilter.java (modify — set attribute) |
| Description | When PasswordExpirationFilter blocks expired user, set `request.setAttribute("password_expired", true)`. AuthController checks this attribute before incrementing lockout counter for login failures. |
| Dependencies | F-277 implementation exists, T-276-12 |
| Acceptance | User with expired password who enters wrong current password during change-password flow does NOT get their lockout counter incremented. |

### T-276-22: Rate Limiting on Change Password (0.5 day)
| Owner | Backend Dev |
| Files | config/PasswordSecurityConfig.java (add rate limiter bean) |
| Description | Implement per-user rate limiting on POST /api/auth/change-password (5 attempts / 15 minutes). Use Redis token bucket or Spring RateLimiter. Apply at controller level before service invocation. |
| Dependencies | T-276-07 (config) |
| Acceptance | 6th attempt within 15 min → 429. After cooldown → 200 OK (if valid). |

### T-276-23: Performance Benchmarks + Security Tests (1 day)
| Owner | Backend Dev |
| Files | src/test/java/com/hanghai/kchtg/password/PerformanceTest.java, src/test/java/com/hanghai/kchtg/password/SecurityTest.java |
| Description | Performance tests: bcrypt hash < 200ms, verify < 200ms, history check (5 hashes) < 50ms, expiration query < 10ms. Security tests: SQL injection, plaintext in logs, timing attack, rate limit, information leak. |
| Dependencies | All previous tasks |
| Acceptance | All TC-PERF-01 through TC-PERF-04 pass. All TC-SEC-01 through TC-SEC-05 pass. |

### T-276-24: E2E Tests + Frontend Integration (2 days)
| Owner | Backend Dev + Frontend Dev |
| Files | src/test/java/ (E2E tests), frontend/ChangePasswordPage.tsx, frontend/PasswordStatusBadge.tsx, frontend/PolicyAdminPage.tsx, frontend/ExpiryReportPage.tsx |
| Description | E2E tests per TC-E2E-01 through TC-E2E-06. Frontend: ChangePasswordPage (redirect target for expired users, inline policy checklist), PasswordStatusBadge (header component), PolicyAdminPage (admin config), ExpiryReportPage (admin paginated table). |
| Dependencies | All backend endpoints working (Wave 1-3 complete) |
| Acceptance | All E2E tests pass. Frontend renders correctly, calls correct endpoints, displays errors/warnings. |

---

## 5. Dependency Map

### Internal Dependencies (within M-010)
| Task | Depends On |
| T-276-01 to T-276-24 | F-001 (User entity baseline) — User columns extended |
| T-276-02, T-276-10, T-276-20 | F-274 (JWT session) — pwhashVersion claim, JWT invalidation, token store |
| T-276-12, T-276-21 | F-277 (Lockout policy) — skip lockout on expired-password change flow |
| T-276-06, T-276-10 | F-271 (Registration) — password policy validation at registration time |
| T-276-12, T-276-14 | F-272 (First login) — password expiration check at first login |
| T-276-12 | F-273 (Subsequent login) — password expiration check at subsequent login |
| T-276-19 | All service tasks — unit tests for Wave 1 and Wave 2 services |

### External Dependencies
| Feature/Module | Dependency | Impact |
| F-271 | Reads PasswordPolicy at registration | T-276-06 (ComplexityValidator) used by F-271 RegistrationService |
| F-272 | Expiration check at first login | T-276-12 (PasswordExpirationFilter) runs during F-272 login flow |
| F-273 | Expiration check at subsequent login | Same as F-272 |
| F-274 | JWT pwhashVersion invalidation | T-276-20 — after password change, old JWTs revoked |
| F-277 | Lockout counter skip | T-276-21 — expired-password users bypass lockout during change flow |
| F-274/F-277 coordination | F-277 must be implemented first or alongside | Without F-277, lockout counter increments normally on wrong current password |

---

## 6. Task Estimation Summary
| Phase | Tasks | Total Dev-Days |
| Wave 1: Foundation + Policy Config | T-276-01 to T-276-08 | ~4.75 days |
| Wave 2: Change Password + History + Expiration | T-276-09 to T-276-13 | ~5 days |
| Wave 3: Monitoring + Notifications + Admin | T-276-14 to T-276-19 | ~4.5 days |
| Wave 4: JWT Integration + Polish + Frontend | T-276-20 to T-276-24 | ~5 days |
| **Total** | **24 tasks** | **~19 days** |

---

## 7. Implementation Order (Critical Path)

```
T-276-01 (DB migrations) --► T-276-02 (User columns) --► T-276-03 (Entities+Repos)
                                                     │
T-276-06 (PasswordHash+Complexity) ───────────────────┼──► T-276-07 (PolicyService)
T-276-04 (DTOs) ──────────────────────────────────────┤              │
T-276-05 (Exceptions) ────────────────────────────────┤              │
                                                     │              ▼
T-276-08 (GET endpoints) ◄────────────────────────────┤    T-276-10 (ChangePasswordService)
                                                     │              │
T-276-09 (HistoryValidator+ExpirationChecker) ────────┤              ▼
                                                     │      T-276-11 (POST change-password)
                                                     │              │
T-276-12 (PasswordExpirationFilter) ◄─────────────────┤              ▼
                                                     │      T-276-13 (Integration Tests)
                                                     │
T-276-14 (ExpirationScanner) ◄────────────────────────┤
T-276-16 (Admin PUT) ◄───────────────────────────────┘
T-276-20 (JWT pwhashVersion)
T-276-21 (F-277 Coordination)
                                                     ▼
                                              T-276-24 (Frontend + E2E)
```

**Parallelizable tasks (no blocking):**
- T-276-04 (DTOs) — runs in parallel with T-276-01
- T-276-05 (Exceptions) — runs in parallel with everything
- T-276-17 (Admin report) — runs in parallel after T-276-03
- T-276-19 (Unit tests) — runs after T-276-06, T-276-07, T-276-09, T-276-10

All tasks target: Spring Boot 3.3.6 / Java 17 / MSSQL 2022
