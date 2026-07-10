# F-277: Chinh sach gioi han dang nhap sai -- Task Breakdown (Tech-Lead)

> Module: M-010 (Xac thuc & Phan quyen)
> TL version: v1.0 - 2026-06-23
> Implementation Plan: tl/implementation-plan.md
> Target stack: Spring Boot 3.3.6 / Java 17 / MSSQL 2022 / JPA / Redis

---

## 1. Sprint 1: Foundation — Entities, DB, Repos, DTOs (Dev-days: 4)

### T-277-01: DB Migration Scripts (1 day)
| Owner | Backend Dev |
| Files | src/main/resources/db/migration/V1__create_lockout_tables.sql, V2__add_lockout_fields_to_users.sql, V3__create_lockout_policy_seed.sql, V4__add_lockout_indexes.sql |
| Description | Create `login_attempts`, `login_attempt_logs`, `lockout_policies` tables. Add `loginFailCount` and `lockedUntil` to User entity. Seed default LockoutPolicy row (id=1, maxFailedAttempts=5, lockoutDurationMinutes=30, windowMinutes=15, isEnabled=true). Create singleton guard trigger on lockout_policies. Create indexes: ix_users_locked_unlock_scan, ix_login_attempts_user_occurred, ix_login_attempt_logs_login_attempt. |
| Dependencies | None (first migration) |
| Acceptance | Flyway validates and applies all migrations. Tables created with correct types. Default policy row exists. Indexes present. |

### T-277-02: Entity Classes (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/entity/LoginAttempt.java, LoginAttemptLog.java, LockoutPolicy.java, UserLockoutExtension.java |
| Description | Create all JPA entities per implementation-plan section 2.1. `LoginAttempt` — append-only record. `LoginAttemptLog` — immutable audit trail (with trigger enforcement). `LockoutPolicy` — singleton table. `UserLockoutExtension` — optional extension entity or lifecycle hook for loginFailCount/lockedUntil on User. |
| Dependencies | T-277-01 |
| Acceptance | All entities compile. JPA mappings correct. BaseEntity inheritance applied (UUID PK). |

### T-277-03: User Entity Extension (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/user/entity/User.java |
| Description | Add `loginFailCount` (INT, DEFAULT 0) and `lockedUntil` (DATETIME2, NULLABLE) to existing User entity. These fields exist in F-271 extension — confirm alignment (same columns, same semantics). |
| Dependencies | T-277-01 |
| Acceptance | User entity has both fields. Matches F-271 extension (no duplicate column definitions). |

### T-277-04: Repository Interfaces (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/repository/UserRepository.java (extend), LoginAttemptRepository.java, LoginAttemptLogRepository.java, LockoutPolicyRepository.java |
| Description | Extend existing UserRepository with `findByUsernameOrEmail`, `findByIdWithPessimisticLock`, `findByLockedUntilNotNullAndLockedUntilBefore`. Create LoginAttemptRepository with `countFailuresAfter()`, `findByUserId()`. Create LoginAttemptLogRepository with `findAllBySpec()`. Create LockoutPolicyRepository with singleton access `findById(1L)`. |
| Dependencies | T-277-02, T-277-03 |
| Acceptance | All repository interfaces compile. Pessimistic lock uses `@Lock(PESSIMISTIC_WRITE)`. |

### T-277-05: DTOs (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/dto/request/LoginRequestDTO.java, UnlockRequestDTO.java, PolicyUpdateDTO.java, LogQueryDTO.java |
| Files | src/main/java/com/hanghai/kchtg/lockout/dto/response/LoginResponseDTO.java, LockoutStatusDTO.java, UnlockResponseDTO.java, PolicyResponseDTO.java, LogEntryDTO.java, LockoutStatsDTO.java |
| Files | src/main/java/com/hanghai/kchtg/lockout/dto/enums/LockoutStatus.java, LockoutResult.java, UnlockResult.java |
| Description | Create all DTOs per implementation-plan section 2.2. Request DTOs with validation annotations. Response DTOs matching API contracts. Enum types for states. |
| Dependencies | None (parallel with T-277-01) |
| Acceptance | All DTOs compile. Jackson serialization works. Enums correct. |

### T-277-06: Exception Classes (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/exception/AccountLockedException.java, LockoutPolicyNotFoundException.java, GlobalLockoutExceptionHandler.java |
| Description | Create exception hierarchy. `AccountLockedException` — thrown when account is locked. `LockoutPolicyNotFoundException` — singleton policy not found. `GlobalLockoutExceptionHandler` — @RestControllerAdvice mapping to proper HTTP codes. |
| Dependencies | None |
| Acceptance | Each exception has distinct error code. Global handler maps to 400/403/500 correctly. |

---

## 2. Sprint 2: Core LockoutLogic (Dev-days: 4.5)

### T-277-07: Redis Cache Configuration (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/cache/RedisCacheConfig.java, LockoutCacheKeys.java |
| Description | Implement RedisCacheConfig with `@EnableCaching`. Set up `lockoutPolicy` cache with 60s TTL. Define cache key constants in LockoutCacheKeys. |
| Dependencies | T-277-06 |
| Acceptance | Redis cache manager configured. `lockoutPolicy` cache functional. TTL fallback works. |

### T-277-08: LockoutPolicyService (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/service/LockoutPolicyService.java |
| Description | Implement cache-aside pattern for LockoutPolicy: `@Cacheable("lockoutPolicy")` for reads, `@CacheEvict` on updates. Fallback to defaults if no DB row. |
| Dependencies | T-277-04, T-277-07 |
| Acceptance | First read loads from DB, caches result. Update evicts cache. BR-277-10 satisfied (immediate policy changes). |

### T-277-09: LockoutService — Core Business Logic (2 days)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/service/LockoutService.java |
| Description | Implement ALL lockout business logic:
- `checkLockout(usernameOrEmail)` — BR-277-05, returns LockoutStatus
- `recordFailure(user, reason)` — BR-277-01, BR-277-03, BR-277-04 with pessimistic row lock (SELECT FOR UPDATE)
- `recordSuccess(user)` — BR-277-03, resets failCount to 0
- `unlockAccount(userId, admin, reason)` — BR-277-06
- `autoUnlockExpired()` — BR-277-02, scans for expired locks
- `getPolicy()` — returns cached LockoutPolicy
Implement state machine from implementation-plan section 5 (LOCKED/WARNING/OK/UNRESTRICTED). |
| Dependencies | T-277-04 (repositories), T-277-08 (policy service), T-277-05 (DTOs/enums) |
| Acceptance | All state transitions work per section 5.2. Concurrent login attempts don't lose updates (pessimistic lock). Window reset (15-min gap) works. Warnings at thresholds 3 and 4. |

### T-277-10: LockoutService Unit Tests (1 day)
| Owner | Backend Dev |
| Files | src/test/java/com/hanghai/kchtg/lockout/LockoutServiceTest.java |
| Description | Unit tests for all LockoutService methods per implementation-plan section 11.1 (UT-01 through UT-14). Mock repositories and policy. |
| Dependencies | T-277-09 |
| Acceptance | All 14 unit tests pass. State transitions verified. Edge cases: window reset, concurrent lock detection, auto-unlock. |

---

## 3. Sprint 3: Controllers + Integration (Dev-days: 5)

### T-277-11: AuthController Integration (1.5 days)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/user/controller/AuthController.java (modify) |
| Description | Integrate LockoutService into login flow:
1. Before credential check → call `checkLockout(username)` — if LOCKED, return 403 immediately (BR-277-05)
2. If credentials wrong → call `recordFailure(user, "invalid_credentials")` — return 401 with warning if WARNING status
3. If credentials correct → call `recordSuccess(user)`
4. TOTP verification failure → also call `recordFailure(user, "invalid_totp")`
5. Return LockoutStatusDTO with remaining attempts / lockedUntil in response.
Implement same flow for TOTP step (F-272/F-273 integration). |
| Dependencies | T-277-09, AuthController.java (existing) |
| Acceptance | 5 consecutive failures → account locked (403). Warnings at thresholds 3 and 4. Correct password while locked → 403. TOTP failure counts toward lockout. |

### T-277-12: AccountAdminController (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/controller/AccountAdminController.java |
| Description | Implement admin unlock + status endpoints:
- `PATCH /api/v1/auth/accounts/{userId}/unlock` — unlock account (admin/system-admin)
- `GET /api/v1/auth/accounts/{userId}/lockout-status` — view lockout status
Implement unit-scoped authorization: system-admin → all users; admin → unit-scoped only (via `@PreAuthorize` SpEL). |
| Dependencies | T-277-09 |
| Acceptance | Admin unlock → 200, audit log written, failCount reset, lockedUntil null. Non-admin user in wrong unit → 403. |

### T-277-13: PolicyAdminController (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/controller/PolicyAdminController.java |
| Description | Implement lockout policy management:
- `GET /api/v1/auth/lockout/policy` — view current policy (system-admin only)
- `PUT /api/v1/auth/lockout/policy` — update policy with immediate effect (Redis cache eviction)
- `GET /api/v1/auth/lockout/stats` — dashboard statistics
Server-side validation: maxFailedAttempts 1-20, lockoutDurationMinutes 5-1440, windowMinutes 1-60. |
| Dependencies | T-277-08 |
| Acceptance | Policy update → 200, cache evicted, next login uses new policy. Non-system-admin → 403. Stats endpoint returns correct counts. |

### T-277-14: AuditLogController (1 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/controller/AuditLogController.java |
| Description | Implement login attempt log queries:
- `GET /api/v1/auth/attempt-logs` — paginated list with filters (userId, eventType, date range, username)
- `GET /api/v1/auth/attempt-logs/{id}` — single log entry detail
Admin/system-admin only. |
| Dependencies | T-277-04 (repository) |
| Acceptance | Paginated results correct. Filters work. Audit log immutable (no DELETE/UPDATE). |

### T-277-15: LockoutCheckFilter (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/security/LockoutCheckFilter.java |
| Description | Implement Spring Security filter that runs BEFORE authentication. Checks if the incoming login request's username/email is locked. If locked → return 403 immediately. Skip check for non-login endpoints. |
| Dependencies | T-277-09, SecurityConfig.java (existing — register filter) |
| Acceptance | Locked account → 403 on any endpoint (including correct credentials). Filter order ensures it runs before Spring's UsernamePasswordAuthenticationFilter. |

### T-277-16: Integration Tests — Full Login Flow (1 day)
| Owner | Backend Dev |
| Files | src/test/java/com/hanghai/kchtg/lockout/LoginFlowIntegrationTest.java |
| Description | Integration tests per implementation-plan section 11.2 (IT-01 through IT-08): full 5-failure lockout, admin unlock, correct password while locked, window reset, TOTP integration, audit log immutability. |
| Dependencies | T-277-11, T-277-12, T-277-13, T-277-14 |
| Acceptance | All 8 integration tests pass. End-to-end login flow works with lockout. |

---

## 4. Sprint 4: Supporting Features + Hardening (Dev-days: 4)

### T-277-17: AutoUnlockScheduler (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/scheduler/AutoUnlockScheduler.java |
| Description | Implement scheduled component:
- `@Scheduled(fixedDelay = 300000)` — 5-minute interval to scan and unlock expired accounts
- `@EventListener(ApplicationReadyEvent)` — startup catch-up for accounts locked during downtime
|
| Dependencies | T-277-09 (autoUnlockExpired method) |
| Acceptance | Expired lockouts auto-unlocked on each 5-min scan. Startup catch-up runs immediately after app start. |

### T-277-18: AccountLockedEventListener (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/listener/AccountLockedEventListener.java |
| Description | Implement `@EventListener(AccountLockedEvent)` — triggered when account is locked. Invalidate all JWT tokens for the user via F-274 token store (Redis blacklist). Future: send notification to user. |
| Dependencies | F-274 (JWT token store) |
| Acceptance | When account locked, all active JWTs for that user are invalidated. No new JWTs issued until unlock. |

### T-277-19: Async Login Attempt Writer (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/async/AsyncLoginAttemptWriter.java, audit/AuditLogService.java |
| Description | Implement non-blocking `@Async` write for LoginAttempt records. AuditLogService wraps the async writer. Audit log writes use `@Transactional(REQUIRES_NEW)` to survive main transaction rollback. |
| Dependencies | T-277-04 (repository) |
| Acceptance | LoginAttempt writes don't block login response. Audit logs written in separate transaction. |

### T-277-20: Unit-Scoped Authorization (0.5 day)
| Owner | Backend Dev |
| Files | src/main/java/com/hanghai/kchtg/lockout/security/LockoutAuthorization.java |
| Description | Implement SpEL authorization bean `@PreAuthorize("@lockoutAuth.canUnlock(authentication, #userId)")`. system-admin → true for any user. admin → check unit scope via SecurityContext. |
| Dependencies | T-277-12 |
| Acceptance | system-admin can unlock any account. admin can only unlock accounts in their unit. |

### T-277-21: Security Tests + Concurrency Tests (1 day)
| Owner | Backend Dev |
| Files | src/test/java/com/hanghai/kchtg/lockout/SecurityTest.java, ConcurrencyTest.java |
| Description | Security tests: timing attack, role bypass, username enumeration. Concurrency tests: 10 concurrent failures → correct count (no lost updates), 1000 concurrent logins across different users → all succeed. |
| Dependencies | T-277-09 |
| Acceptance | All security tests pass. Concurrency tests verify pessimistic lock works. |

### T-277-22: E2E Tests + Frontend Components (1.5 days)
| Owner | Backend Dev + Frontend Dev |
| Files | src/test/java/ (E2E), frontend/LoginLockoutBanner.tsx, LoginWarningBanner.tsx, AdminLockoutConsole.tsx, AdminLockoutPolicyEditor.tsx |
| Description | E2E tests per feature-brief testing strategy. Frontend components:
- LoginLockoutBanner — danger alert when LOCKED
- LoginWarningBanner — warning at thresholds 3 and 4
- AdminLockoutConsole — unlock button + lockout status card
- AdminLockoutPolicyEditor — inline policy config form |
| Dependencies | All backend endpoints working |
| Acceptance | All E2E tests pass. Frontend displays correct messages. Admin UI works. |

---

## 5. Dependency Map

### Internal Dependencies (within M-010)
| Task | Depends On |
| T-277-03, T-277-04 | F-271 (User entity extension) — loginFailCount/lockedUntil fields from F-271 |
| T-277-11 | F-272 (First login + TOTP) — TOTP verification counts toward lockout |
| T-277-11 | F-273 (Subsequent login + TOTP) — TOTP verification counts toward lockout |
| T-277-18 | F-274 (JWT session) — token blacklist/invalidation when account locked |
| T-277-11 | F-276 (Password policy) — F-276 skip-lockout coordination on expired-password flow |
| T-277-11, T-277-15 | F-001 (User entity baseline) — User entity exists with correct fields |

### External Dependencies
| Feature/Module | Dependency | Impact |
| F-272/F-273 | TOTP verification integration | T-277-11 — TOTP failures count toward lockout |
| F-274 | JWT invalidation | T-277-18 — when account locked, revoke all user JWTs |
| F-276 | Password expiration filter | T-276-21 — expired-password users bypass lockout during change flow |
| F-001 | User entity | F-277 extends User with loginFailCount, lockedUntil |

---

## 6. Task Estimation Summary
| Phase | Tasks | Total Dev-Days |
| Sprint 1: Foundation | T-277-01 to T-277-06 | ~4.5 days |
| Sprint 2: Core Logic | T-277-07 to T-277-10 | ~4.5 days |
| Sprint 3: Controllers + Integration | T-277-11 to T-277-16 | ~5 days |
| Sprint 4: Supporting + Hardening | T-277-17 to T-277-22 | ~4.5 days |
| **Total** | **22 tasks** | **~18.5 days** |

---

## 7. Implementation Order (Critical Path)

```
T-277-01 (DB migrations) --► T-277-02 (Entities) --► T-277-04 (Repositories)
                                                       │
T-277-05 (DTOs) ──────────────────────────────────────┤              │
T-277-06 (Exceptions) ────────────────────────────────┤              │
T-277-03 (User extension) ────────────────────────────┘              │
                                                                     ▼
T-277-07 (Redis config) ──► T-277-08 (PolicyService) ──► T-277-09 (LockoutService CORE)
                                                                         │
T-277-10 (Unit tests for LockoutService) ◄───────────────────────────────┘
                                                                         │
T-277-11 (AuthController) ◄──────────────────────────────────────────────┤
T-277-12 (AccountAdminController) ◄───────────────────────────────────────┤
T-277-13 (PolicyAdminController) ◄────────────────────────────────────────┤
T-277-14 (AuditLogController) ◄───────────────────────────────────────────┤
T-277-15 (LockoutCheckFilter) ◄───────────────────────────────────────────┤
                                                                         ▼
T-277-16 (Integration Tests) ◄────────────────────────────────────────────┘
                                                                         │
T-277-17 (AutoUnlockScheduler) ──────────────────────────────────────────┤
T-277-18 (AccountLockedEventListener) ────────────────────────────────────┤
T-277-19 (Async Writer) ──────────────────────────────────────────────────┤
T-277-20 (Unit-scoped Auth) ──────────────────────────────────────────────┤
T-277-21 (Security + Concurrency Tests) ──────────────────────────────────┤
                                                                         ▼
T-277-22 (E2E + Frontend) ◄──────────────────────────────────────────────┘
```

**Parallelizable tasks (no blocking):**
- T-277-05 (DTOs) — parallel with T-277-01
- T-277-06 (Exceptions) — parallel with everything
- T-277-10 (Unit tests) — parallel with T-277-11 through T-277-14 (after T-277-09)
- T-277-17, T-277-18, T-277-19, T-277-20 — all run in parallel after T-277-09

All tasks target: Spring Boot 3.3.6 / Java 17 / MSSQL 2022 / Redis (for cache)
