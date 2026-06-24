# F-274: Quan ly JWT session -- Task Breakdown (Tech-Lead)

> Module: M-010 (Xac thuc & Phan quyen)
> TL version: v1.0 - 2026-06-23
> SA Design: sa/feature-design.md
> Implementation Plan: implementation-plan.md
> Target stack: Spring Boot 3.3.6 / Java 17 / PostgreSQL / JJWT 0.12.5 / Caffeine

---

## 1. Wave 1: Foundation — Entities, Repositories, Config (Dev-days: 2)

### T-274-01: Caffeine Dependency + CacheConfig (0.25 day)
| Owner | Backend Dev |
| Files | pom.xml, config/CacheConfig.java |
| Description | Add caffeine dependency. Create CacheConfig.java with `revocationCache` bean: max 100K entries, expire-after-write 5 minutes (BR-274-11). Enable @EnableCaching. |
| Dependencies | None |
| Acceptance | `mvn compile` succeeds with caffeine. CacheConfig bean starts without errors. |

### T-274-02: JwtSession Entity (0.5 day)
| Owner | Backend Dev |
| Files | security/entity/JwtSession.java |
| Description | Entity with fields: id (UUID), userId (FK→User), refreshTokenHash (VARCHAR 512), refreshTokenSalt (VARCHAR 256), sessionId (VARCHAR 128), userAgent, deviceFingerprint, ipAddress, createdAt, expiresAt, lastUsedAt, isRevoked (BOOLEAN), revokedAt, status (ACTIVE/REVOKED/EXPIRED). Indexes on userId+isRevoked, refreshTokenHash (unique), sessionId (unique). |
| Dependencies | None (BaseEntity from common/entity exists) |
| Acceptance | DDL generates with H2. All constraints enforced. FK constraint to User.id. |

### T-274-03: JwtTokenRevocation Entity (0.25 day)
| Owner | Backend Dev |
| Files | security/entity/JwtTokenRevocation.java |
| Description | Entity: id (UUID), userId (FK→User), sessionId (nullable), reason (enum: USER_LOGOUT/ADMIN_REVOKE/SUSPICIOUS_REUSE/SYSTEM_PURGE), revokedAt, revokedBy (FK→User, nullable), details (TEXT). Index on userId+revokedAt, reason. |
| Dependencies | None |
| Acceptance | DDL generates. Nullable FK to User for revokedBy works. |

### T-274-04: JwtSigningKey Entity (0.25 day)
| Owner | Backend Dev |
| Files | security/entity/JwtSigningKey.java |
| Description | Entity: id (UUID), algorithm (HS256), keyVersion (int), createdAt, expiresAt, isActive (BOOLEAN). Index on isActive. Phase 2: key rotation. |
| Dependencies | None |
| Acceptance | DDL generates. Only one active key enforced by service logic. |

### T-274-05: Repositories (0.5 day)
| Owner | Backend Dev |
| Files | security/repository/JwtSessionRepository.java, security/repository/JwtTokenRevocationRepository.java, security/repository/JwtSigningKeyRepository.java |
| Description | Spring Data JPA interfaces. JwtSessionRepository: findActiveByUserId(UUID), findBySessionId(String), findByRefreshTokenHash(String), findAllByUserIdAndIsRevokedFalse(UUID). JwtTokenRevocationRepository: hasRecentSuspiciousRevocation(UUID, Duration), findByUserIdAndRevokedAtAfter(UUID, LocalDateTime). JwtSigningKeyRepository: findActiveKey(). |
| Dependencies | T-274-02, T-274-03, T-274-04 |
| Acceptance | All repository methods compile. Custom JPQL queries return correct result types. |

### T-274-06: JwtProperties Extension (0.25 day)
| Owner | Backend Dev |
| Files | security/JwtProperties.java |
| Description | Add F-274 fields: accessTokenExpirySeconds (900), refreshTokenExpiryDays (7), issuer, audience, algorithm (HS256). Validate key entropy >= 256 bits on startup. |
| Dependencies | None (existing JwtProperties) |
| Acceptance | Properties bind from application.yml. Validation throws on startup if key < 32 bytes. |

### T-274-07: CookieConfig + TokenClaimsBuilder (0.25 day)
| Owner | Backend Dev |
| Files | security/config/CookieConfig.java, security/config/TokenClaimsBuilder.java |
| Description | CookieConfig: constants (REFRESH_TOKEN_NAME, CSRF_TOKEN_NAME), setRefreshTokenCookie (HTTP-only, Secure, SameSite=Strict), clearRefreshTokenCookie, extractRefreshTokenCookie. TokenClaimsBuilder: fluent builder for JWT claims (sub, roles, permissions, sessionId, jti). |
| Dependencies | None |
| Acceptance | Cookie builder sets correct attributes. TokenClaimsBuilder produces valid claims map. |

---

## 2. Wave 2: Services — Token + Session + Validation (Dev-days: 3)

### T-274-08: TokenService Core (1 day)
| Owner | Backend Dev |
| Files | security/service/TokenService.java |
| Description | Core JWT lifecycle service. Methods: createAccessToken(userId, roles, permissions, sessionId), createRefreshToken() → RefreshTokenPair (plaintext + hash), validateAccessToken(token) → Claims, refreshAccessToken(refreshValue, sessionId, userId), revokeSession(sessionId, userId, revokedBy, reason), revokeAllSessions(userId, revokedBy, reason), invalidateRevocationCache(). Implements BR-274-01 (15-min expiry), BR-274-06 (claims in payload), BR-274-09 (signature/exp/alg validation). |
| Dependencies | T-274-05 (repos), T-274-06 (JwtProperties), T-274-07 (TokenClaimsBuilder), Caffeine cache |
| Acceptance | createAccessToken produces valid HS256 JWT with all claims. createRefreshToken returns matching hash. validateAccessToken rejects tampered/expired tokens. |

### T-274-09: TokenService Reuse Detection (0.5 day)
| Owner | Backend Dev |
| Files | security/service/TokenService.java (refreshAccessToken extension) |
| Description | Implement refreshAccessToken reuse detection per BR-274-04. Flow: hash presented refresh token → findByRefreshTokenHash → check isRevoked → if revoked, revoke-all sessions for user → invalidate cache → throw RefreshTokenReuseException. On success: touchSession, reload roles+permissions from DB, create new access token. |
| Dependencies | T-274-08 |
| Acceptance | Normal refresh returns new access token, old refresh token remains valid. Reused token triggers revoke-all + exception. |

### T-274-10: SessionService (0.75 day)
| Owner | Backend Dev |
| Files | security/service/SessionService.java |
| Description | Session CRUD + reuse detection. Methods: createSession(userId, refreshTokenHash, salt, sessionId, userAgent, ipAddress, deviceFingerprint, expiresAt), findByRefreshTokenHash(hash), touchSession(session), revokeSession(session, reason, revokedBy), revokeAllSessionsByUserId(userId, reason, revokedBy), detectReuse(presentedHash, storedHash), findActiveByUserId(userId), findBySessionId(sessionId). |
| Dependencies | T-274-05 |
| Acceptance | createSession persists with ACTIVE status. revokeSession sets isRevoked=true + revokedAt. revokeAll by userId affects all active sessions. |

### T-274-11: TokenValidationService (0.5 day)
| Owner | Backend Dev |
| Files | security/service/TokenValidationService.java |
| Description | Cache + DB fallback revocation check. isRevoked(jti, userId): check cache → cache miss → DB fallback (hasRecentSuspiciousRevocation in last 5 min) → populate cache. markRevoked(jti, userId, sessionId, reason, revokedBy): populate cache + persist to DB. Implements BR-274-11. |
| Dependencies | T-274-05, T-274-01 (CacheConfig) |
| Acceptance | Cache hit ratio >95% in unit test. DB fallback returns correct results on cache miss. |

### T-274-12: Custom JWT Exceptions (0.25 day)
| Owner | Backend Dev |
| Files | common/exception/JwtExceptions.java |
| Description | Exception hierarchy: TokenException (base), TokenExpiredException, TokenInvalidException (wrong sig/alg), SigningKeyException, RefreshTokenReuseException (allSessionsRevoked flag), JwtSessionException. Each has error code constant. |
| Dependencies | None |
| Acceptance | Each exception has distinct HTTP mapping (401, 401, 500, 401+allRevoked). Error codes are stable. |

---

## 3. Wave 3: Security Filters + Config (Dev-days: 1.5)

### T-274-13: CookieRefreshTokenFilter (0.5 day)
| Owner | Backend Dev |
| Files | security/filter/CookieRefreshTokenFilter.java |
| Description | OncePerRequestFilter for /api/auth/refresh endpoint. Extracts refreshToken from HTTP-only cookie → calls SessionService.findByRefreshTokenHash → if valid, delegates to TokenService for user authentication → sets SecurityContext with user + roles + permissions. If invalid/missing: return 401. |
| Dependencies | T-274-08, T-274-10, T-274-07 (CookieConfig) |
| Acceptance | Valid refresh token sets SecurityContext. Invalid/missing cookie returns 401 without forwarding. |

### T-274-14: JwtAuthenticationFilter (0.5 day)
| Owner | Backend Dev |
| Files | security/filter/JwtAuthenticationFilter.java |
| Description | OncePerRequestFilter for Bearer token validation on all protected endpoints. Extracts Authorization: Bearer header → TokenService.validateAccessToken → check isTokenRevoked(jti, userId) → sets SecurityContext. Rejects immediately on failure (401). |
| Dependencies | T-274-08, T-274-11 |
| Acceptance | Valid Bearer token sets SecurityContext. Expired/tampered/revoked tokens return 401 without forwarding. |

### T-274-15: SecurityConfig Augmentation (0.5 day)
| Owner | Backend Dev |
| Files | config/SecurityConfig.java |
| Description | Wire new filters: addFilterBefore(CookieRefreshTokenFilter, UsernamePasswordAuthenticationFilter.class), addFilterBefore(JwtAuthenticationFilter, CookieRefreshTokenFilter.class). Add permitAll: /api/auth/login, /api/auth/register, /api/auth/refresh. Add admin endpoints protected: /api/auth/sessions/** → JWT_POLICY_MANAGE, /api/auth/sessions/revoke-all → JWT_REVOKE_ALL. Disable CSRF (SameSite=Strict cookie provides protection). |
| Dependencies | T-274-13, T-274-14 |
| Acceptance | Filter chain: CookieRefresh → JwtAuth → FilterSecurityInterceptor. Public endpoints accessible without auth. Admin endpoints require specific authority. |

---

## 4. Wave 4: Controllers + DTOs (Dev-days: 2)

### T-274-16: DTOs (0.5 day)
| Owner | Backend Dev |
| Files | security/dto/LoginRequestDTO.java, security/dto/LoginResponseDTO.java, security/dto/RefreshResponseDTO.java, security/dto/LogoutResponseDTO.java, security/dto/SessionListResponse.java, security/dto/RevokeAllRequestDTO.java, security/dto/SigningKeyResponse.java |
| Description | Create all 7 DTOs per SA design. LoginResponse includes accessToken + cookie metadata. RefreshResponse includes new accessToken. SessionListResponse for admin session listing. |
| Dependencies | None |
| Acceptance | All DTOs compile. Jackson serialization produces correct JSON. Jakarta Validation annotations on request DTOs. |

### T-274-17: AuthController (1 day)
| Owner | Backend Dev |
| Files | user/controller/AuthController.java |
| Description | 3 endpoints: POST /api/auth/login (creates tokens + refresh cookie, triggers F-272/F-273 JWT issuance), POST /api/auth/refresh (CookieRefreshTokenFilter handles auth), POST /api/auth/logout (revoke session + clear cookie). Integrates TokenService + SessionService. |
| Dependencies | T-274-08, T-274-10, T-274-16, T-274-06 |
| Acceptance | Login returns JWT + sets refresh cookie. Logout revokes session + clears cookie. |

### T-274-18: SessionAdminController (0.5 day)
| Owner | Backend Dev |
| Files | user/controller/SessionAdminController.java |
| Description | Admin endpoints: GET /api/auth/sessions (list active sessions for user), POST /api/auth/sessions/revoke-all (revoke all sessions for user, JWT_REVOKE_ALL required), GET /api/auth/sessions/{sessionId} (session detail). |
| Dependencies | T-274-10, T-274-16 |
| Acceptance | Admin with JWT_POLICY_MANAGE can list sessions. Super Admin with JWT_REVOKE_ALL can revoke all. Returns 403 for unauthorized. |

### T-274-19: GlobalExceptionHandler Extension (0.5 day)
| Owner | Backend Dev |
| Files | common/exception/GlobalExceptionHandler.java (extend) |
| Description | Add handlers for JwtExceptions subclasses: TokenExpiredException→401, TokenInvalidException→401, SigningKeyException→500, RefreshTokenReuseException→401 with allSessionsRevoked flag. Generic error messages only (no token content in responses). |
| Dependencies | T-274-12 |
| Acceptance | Each exception type returns correct HTTP status. Error messages don't leak token internals. |

---

## 5. Wave 5: Testing + Hardening (Dev-days: 2.5)

### T-274-20: Unit Tests (1 day)
| Owner | QA Engineer |
| Description | Unit tests for all services: TokenService (create, validate, refresh, revoke), SessionService (CRUD, reuse detection), TokenValidationService (cache hit/miss, DB fallback). Targets: UT-274-01 through UT-274-08. |
| Dependencies | T-274-08 through T-274-12 |
| Acceptance | >95% pass rate. TokenService tests cover valid, expired, tampered, wrong-algorithm tokens. SessionService tests cover reuse detection path. |

### T-274-21: Integration Tests (1 day)
| Owner | QA Engineer |
| Description | Integration tests with H2: login flow (IT-274-01), refresh with valid token (IT-274-02), expired refresh (IT-274-03), reused refresh after logout (IT-274-04), logout (IT-274-05), auto-refresh on expired access (IT-274-06), tampered token (IT-274-07), missing token (IT-274-08), key rotation (IT-274-09). |
| Dependencies | T-274-13 through T-274-19 |
| Acceptance | >90% pass rate. IT-274-04 verify all sessions revoked on reuse. |

### T-274-22: E2E + Security Tests (0.5 day)
| Owner | QA Engineer |
| Description | E2E flows: full register→login→refresh→logout→reuse (E2E-274-01), XST attempt with HTTP-only cookie (E2E-274-02), CSRF protection (E2E-274-03), concurrent sessions (E2E-274-04), bulk revocation (E2E-274-05). |
| Dependencies | T-274-21 |
| Acceptance | All E2E tests pass. HTTP-only cookie verified (JS cannot read refreshToken cookie). |

### T-274-23: Performance + Security Audit (0.5 day)
| Owner | QA Engineer |
| Description | Performance benchmarks: JWT create p99 <10ms, JWT validate p99 <5ms, refresh >1000 RPS, cache hit ratio >95%. Security review: SHA-512 hash strength, CSRF strategy (SameSite=Strict), key entropy validation, no sensitive data in JWT payload. |
| Dependencies | T-274-22 |
| Acceptance | All performance thresholds met. Security checklist passed. |

---

## 6. Dependency Map

### Internal Dependencies (within M-010)
| Task | Depends On |
| T-274-01 to T-274-23 | F-271 (User entity, UserRepository exist) |
| T-274-08, T-274-09 | F-275 (RoleRepository, PermissionRepository for claims) |
| T-274-17 | F-272 (First login triggers token creation via F-274) |
| T-274-17 | F-273 (Subsequent login also triggers token creation via F-274) |
| T-274-19 | Existing GlobalExceptionHandler |

### External Dependencies
| Feature | Dependency | Impact |
| F-271 | Reads User entity (userId FK in JwtSession) | F-271 user creation is prerequisite for JWT session |
| F-272 | Writes JWT + refresh token (called by F-272 login flow) | F-272 delegates token issuance to F-274 |
| F-273 | Writes JWT + refresh token (same as F-272) | F-273 delegates token issuance to F-274 |
| F-275 | Provides Role/Permission data for JWT payload claims | F-274 loads roles+permissions from F-275 entities on refresh |
| F-276 | No direct dependency | F-274 uses existing password validation |
| F-277 | No direct dependency | F-274 uses existing lockout fields on User |

---

## 7. Task Estimation Summary
| Phase | Tasks | Total Dev-Days |
| Wave 1: Foundation | T-274-01 to T-274-07 | ~2.5 days |
| Wave 2: Services | T-274-08 to T-274-12 | ~3 days |
| Wave 3: Security Filters | T-274-13 to T-274-15 | ~1.5 days |
| Wave 4: Controllers + DTOs | T-274-16 to T-274-19 | ~2 days |
| Wave 5: Testing + Hardening | T-274-20 to T-274-23 | ~2.5 days |
| **Total** | **23 tasks** | **~11.5 days** |

---

## 8. Implementation Order (Critical Path)
T-274-01 (CacheConfig) -> T-274-02 (JwtSession entity) -> T-274-05 (Repositories) -> T-274-08 (TokenService) -> T-274-13 (CookieRefreshTokenFilter) -> T-274-17 (AuthController) -> T-274-20 (Unit Tests)
T-274-03 (Revocation entity) -> T-274-10 (SessionService) -> T-274-14 (JwtAuthFilter) -> T-274-18 (SessionAdminController) -> T-274-21 (Integration Tests)
T-274-04 (SigningKey entity) -> T-274-11 (TokenValidationService) -> T-274-15 (SecurityConfig) -> T-274-19 (ExceptionHandler) -> T-274-22 (E2E Tests)
T-274-06 (JwtProperties) -> T-274-09 (Reuse Detection) -> T-274-16 (DTOs) -> T-274-23 (Perf/Security)
T-274-07 (CookieConfig + ClaimsBuilder) -> T-274-12 (Exceptions)

All tasks target: Spring Boot 3.3.6 / Java 17 / PostgreSQL
