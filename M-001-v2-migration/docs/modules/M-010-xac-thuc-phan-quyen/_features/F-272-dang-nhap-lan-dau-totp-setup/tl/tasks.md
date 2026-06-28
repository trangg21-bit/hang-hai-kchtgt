# F-272: Dang nhap lan dau + TOTP setup -- Task Breakdown (Tech-Lead)

> Module: M-010 (Xac thuc & Phan quyen)
> TL version: v1.0 - 2026-06-23
> SA Design: sa/feature-design.md
> Implementation Plan: implementation-plan.md
> Target stack: Spring Boot 3.3.6 / Java 17 / PostgreSQL / Redis / JJWT 0.12.5

---

## 1. Wave 1: Foundation + Core TOTP (Dev-days: 6)

### T-272-01: Maven Dependencies (0.25 day)
| Owner | Backend Dev |
| Files | pom.xml |
| Description | Add: authenticator (RFC 6238), zxing core/javase (QR), spring-boot-starter-data-redis (session). |
| Dependencies | None |
| Acceptance | mvn clean compile succeeds with new dependencies. |

### T-272-02: Entity Extensions (0.5 day)
| Owner | Backend Dev |
| Files | User.java (extend with TOTP fields), AuditLog.java (NEW) |
| Description | Add totpSecretHash, totpEnabled, lastTotpCode, totpVerifiedAt to User. Create AuditLog entity. |
| Dependencies | T-272-01 |
| Acceptance | DDL generates with H2. Indexes created on totp_enabled. |

### T-272-03: Redis Configuration (0.25 day)
| Owner | Backend Dev |
| Files | RedisConfig.java, application.yml |
| Description | Configure Redis connection. Set up RedisTemplate with JSON serialization. |
| Dependencies | T-272-01 |
| Acceptance | Redis connection test passes (dev). Serialization round-trip works. |

### T-272-04: DTOs (0.5 day)
| Owner | Backend Dev |
| Files | TotpSetupRequestDTO.java, TotpVerifyRequestDTO.java, TotpSetupResponseDTO.java, TotpVerifyResponseDTO.java, TotpEnrollSession.java |
| Description | Create TOTP enrollment DTOs per SA section 3.1-3.2. |
| Dependencies | None (parallel with T-272-02) |
| Acceptance | DTOs compile. Jackson serialization round-trips correctly. |

### T-272-05: TOTP Core Utilities (0.75 day)
| Owner | Backend Dev |
| Files | TotpSecretHasher.java (PBKDF2-SHA256), ConstantTimeComparer.java, TotpService.java |
| Description | Implement PBKDF2 hashing (100k iterations, 16-byte salt), timing-safe comparison, TOTP secret generation/verification with +/-1 tolerance. |
| Dependencies | T-272-01 |
| Acceptance | PBKDF2 deterministic. TOTP verification passes RFC 6238 test vectors. |

### T-272-06: QR Generation Service (0.5 day)
| Owner | Backend Dev |
| Files | QRGenerationService.java |
| Description | ZXing-based QR generation (SVG + PNG) from TOTP URI. Data URI output. |
| Dependencies | T-272-01 |
| Acceptance | QR output is valid Base64 SVG. URI format matches RFC 6238. |

### T-272-07: Session Management (0.5 day)
| Owner | Backend Dev |
| Files | RedisSessionService.java, TotpRateLimiter.java |
| Description | Redis-backed enrollment session CRUD (5-min TTL). Rate limiter: 5 attempts/15min lockout. |
| Dependencies | T-272-02, T-272-03 |
| Acceptance | Session CRUD with TTL works. Lockout triggers after 5 failures. |

### T-272-08: JwtUtil Extension (0.25 day)
| Owner | Backend Dev |
| Files | JwtUtil.java (extend) |
| Description | Add totp_enabled claim, refresh token generation. |
| Dependencies | None |
| Acceptance | JWT tokens contain totp_enabled: true claim. Refresh token generates correctly. |

## 2. Wave 2: Controllers + Services (Dev-days: 5)

### T-272-09: AuthService (1 day)
| Owner | Backend Dev |
| Files | AuthService.java |
| Description | Orchestrates: credential auth -> MFA status -> TOTP setup flow or JWT. Uses sealed interface AuthResult. |
| Dependencies | T-272-05, T-272-06, T-272-07, T-272-08 |
| Acceptance | Credential auth delegates to PasswordEncoder. MFA check routes to TOTP or JWT. |

### T-272-10: AuthController Extension (0.5 day)
| Owner | Backend Dev |
| Files | AuthController.java (extend), SecurityConfig.java (modify) |
| Description | Extend login endpoint with 2-flow dispatch. Permit TOTP endpoints in SecurityConfig. |
| Dependencies | T-272-09 |
| Acceptance | POST /api/auth/login returns totp_setup_required or authenticated. TOTP endpoints accessible without JWT. |

### T-272-11: TotpSetupController (1 day)
| Owner | Backend Dev |
| Files | TotpSetupController.java |
| Description | POST /api/auth/totp/setup, /verify, /regenerate endpoints. Redis session-based auth. |
| Dependencies | T-272-05, T-272-06, T-272-07, T-272-09 |
| Acceptance | QR generated on /setup. Code verified on /verify -> JWT issued. Regenerate returns fresh QR. |

### T-272-12: DTO Extensions (0.5 day)
| Owner | Backend Dev |
| Files | LoginRequest.java (extend), LoginResponse.java (extend) |
| Description | Support identifier (email OR phone) in LoginRequest. 3 status values in LoginResponse. |
| Dependencies | T-272-10 |
| Acceptance | Login by email or phone works. Response includes status field. |

### T-272-13: Error Handling + Audit (0.5 day)
| Owner | Backend Dev |
| Files | GlobalExceptionHandler.java (extend), async audit log writer |
| Description | TOTP-specific error codes (TOTP_CODE_INVALID, TOTP_VERIFY_LOCKED, SESSION_EXPIRED). Async audit logging. |
| Dependencies | T-272-02, T-272-12 |
| Acceptance | TOTP errors return correct codes. Audit events logged asynchronously. |

## 3. Wave 3: Migration + Testing (Dev-days: 5)

### T-272-14: Migration Scripts (0.5 day)
| Owner | Backend Dev |
| Files | Migration SQL (ALTER TABLE app_users TOTP columns, CREATE TABLE audit_logs), indexes |
| Description | Production-ready migration scripts. Idempotent (IF NOT EXISTS). |
| Dependencies | T-272-02 |
| Acceptance | Migration runs on PostgreSQL without errors. |

### T-272-15: Unit Tests (2 days)
| Owner | Backend Dev |
| Description | TotpService (RFC 6238 vectors), QRGenerationService, TotpSecretHasher, TotpRateLimiter, ConstantTimeComparer. |
| Acceptance | All unit tests pass. Coverage > 80% for TOTP service layer. |

### T-272-16: Integration Tests (1.5 days)
| Owner | Backend Dev |
| Description | Happy path: register -> login -> TOTP setup -> verify -> JWT. Skip path. Locked account. QR expired -> regenerate. Session expired. |
| Acceptance | All integration tests pass with H2 + embedded Redis. |

### T-272-17: E2E Test (1 day)
| Owner | Backend Dev |
| Description | Full first-login flow with real Google Authenticator (or mock). |
| Acceptance | E2E test passes end-to-end. |

## 4. Dependency Map

### Internal Dependencies (within M-010)
| Task | Depends On |
| T-272-01 to T-272-13 | F-271 (User.password_hash, User.email/phone exist) |
| T-272-08 | F-274 (JwtUtil for JWT issuance) |
| T-272-13 | F-277 (Account lock check at login) |

### External Dependencies
| Feature | Dependency | Impact |
| F-271 | Reads User.password_hash, User.email/phone | F-272 login depends on F-271 account creation |
| F-273 | Reads totp_enabled, totp_secret_hash (populated by F-272) | F-273 subsequent login uses F-272 data |
| F-274 | Writes JWT (access + refresh tokens) | F-274 JWT library used by F-272 |
| F-275 | JWT role claim (role_level) | F-275 role mapping used in JWT |
| F-277 | Reads locked_until, failed_login_count | F-277 lockout enforced before TOTP setup |

## 5. Task Estimation Summary
| Phase | Tasks | Total Dev-Days |
| Wave 1: Foundation | T-272-01 to T-272-08 | ~3.5 days |
| Wave 2: Controllers + Services | T-272-09 to T-272-13 | ~3.5 days |
| Wave 3: Migration + Testing | T-272-14 to T-272-17 | ~5 days |
| Total | 17 tasks | ~12 days |

## 6. Implementation Order (Critical Path)
T-272-01 (Deps) -> T-272-05 (TOTP Core) -> T-272-09 (AuthService) -> T-272-11 (TotpSetupController) -> T-272-15 (Tests)
T-272-02 (Entity) -> T-272-06 (QR) -> T-272-07 (Session) -> T-272-10 (AuthController) -> T-272-16 (Integration Tests)
T-272-03 (Redis) -> T-272-08 (JwtUtil) -> T-272-12 (DTOs) -> T-272-13 (Error/Audit) -> T-272-17 (E2E)
T-272-14 (Migration) -> (parallel, final step)