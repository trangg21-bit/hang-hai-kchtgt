# F-271: Dang ky tai khoan -- Task Breakdown (Tech-Lead)

> Module: M-010 (Xac thuc & Phan quyen)
> TL version: v1.0 - 2026-06-23
> SA Design: sa/feature-design.md
> Implementation Plan: implementation-plan.md
> Target stack: Spring Boot 3.3.6 / Java 17 / PostgreSQL / JPA

---

## 1. Wave 1: Foundation + Core Registration (Dev-days: 4)

### T-271-01: Entity Extensions & New Entities (0.5 day)
| Owner | Backend Dev |
| Files | User.java (add columns), UserStatus.java (add PENDING_VERIFICATION), VerificationToken.java (NEW), AccountRegistrationAudit.java (NEW) |
| Description | Add passwordHash, passwordExpiresAt, passwordLastChangedAt, loginFailCount, lockedUntil to User entity. Create VerificationToken and AccountRegistrationAudit entities. |
| Dependencies | F-001 (User entity baseline) |
| Acceptance | Hibernate generates correct DDL with H2. All new columns have correct types, constraints, indexes. |

### T-271-02: Repository Layer (0.5 day)
| Owner | Backend Dev |
| Files | UserRepository.java (extend), VerificationTokenRepository.java (NEW), AccountRegistrationAuditRepository.java (NEW) |
| Description | Add existsByPhone(), findByPhone() to UserRepository. Create repositories for new entities. |
| Dependencies | T-271-01 |
| Acceptance | All repository methods compile. Spring Data JPA interfaces correct. |

### T-271-03: DTOs (0.5 day)
| Owner | Backend Dev |
| Files | RegisterAccountRequest.java, RegisterResponse.java, RegisterConfigResponse.java, VerifyTokenRequest.java, VerifyResponse.java, ResendVerificationRequest.java, RateLimitConfigDTO.java |
| Description | Create all DTOs per SA sections 3.2-3.3. Add Jakarta Validation annotations. |
| Dependencies | None (parallel with T-271-01) |
| Acceptance | All DTOs compile. Jackson serialization works. |

### T-271-04: Exception Hierarchy (0.25 day)
| Owner | Backend Dev |
| Files | RegistrationException.java (base), DuplicateResourceException.java, ValidationException.java, RateLimitExceededException.java, VerificationException.java |
| Description | Create exception classes per SA section 5.1 hierarchy. |
| Dependencies | None |
| Acceptance | Exceptions extend RegistrationException. Each has error code constant. |

### T-271-05: Core Services (1 day)
| Owner | Backend Dev |
| Files | RegistrationService.java (NEW), PasswordPolicyValidator.java (NEW), ClientEncryptionService.java (NEW) |
| Description | Implement full registration flow: rate limit -> uniqueness -> password policy -> decrypt -> create user -> generate token -> notification -> audit. RSA client-side encryption. |
| Dependencies | T-271-01, T-271-02, T-271-04 |
| Acceptance | Service methods match SA section 4.2 flow. Constructor injection. |

### T-271-06: Verification + Notification Services (0.5 day)
| Owner | Backend Dev |
| Files | VerificationTokenService.java (NEW), NotificationService.java (NEW), AccountRegistrationAuditService.java (NEW), RateLimiterService.java (NEW) |
| Description | Token generation/consumption, email notification, audit logging with REQUIRES_NEW, IP-based rate limiter. |
| Dependencies | T-271-01, T-271-02 |
| Acceptance | Token creation hashes 64-char random. Verification activates user. Audit logged independently. |

### T-271-07: Controllers (0.75 day)
| Owner | Backend Dev |
| Files | RegistrationController.java, RegisterConfigController.java, VerificationController.java |
| Description | 5 endpoints: POST /api/auth/register, verify-email, verify-phone, resend-verification, GET register-config. |
| Dependencies | T-271-05, T-271-06, T-271-03 |
| Acceptance | All endpoints return correct HTTP status codes and JSON schemas. |

### T-271-08: GlobalExceptionHandler Extension (0.25 day)
| Owner | Backend Dev |
| Files | GlobalExceptionHandler.java (extend) |
| Description | Add handlers for RegistrationException subclasses per SA section 6.2. |
| Dependencies | T-271-04, T-271-07 |
| Acceptance | Each exception type returns correct HTTP status. Generic error messages. |

## 2. Wave 2: Testing + Polish (Dev-days: 3)

### T-271-09: Unit Tests (1 day)
| Owner | Backend Dev |
| Description | Unit tests for all services: registration flow, token CRUD, password validation, rate limiting. |

### T-271-10: Integration Tests (1 day)
| Owner | Backend Dev |
| Description | Integration tests with H2: full registration-to-verification flow, duplicate detection, validation errors, rate limit. |

### T-271-11: Migration Scripts + Configuration (1 day)
| Owner | Backend Dev |
| Description | Write production migration SQL (Flyway V1-V3). Add RSA key config, rate limit settings, verification TTL. |

## 3. Dependency Map

### Internal Dependencies (within M-010)
| Task | Depends On |
| T-271-01 to T-271-08 | F-001 (User entity baseline) |
| T-271-05 | F-276 (PasswordPolicy -- use defaults if not yet implemented) |
| T-271-06 | F-277 (Lockout policy -- initializes fields at 0) |
| T-271-07 | All Wave 1 tasks |
| T-271-09 to T-271-11 | All Wave 1 tasks |

### External Dependencies
| Feature | Dependency | Impact |
| F-272 | Reads User.password_hash (from F-271) | F-272 login depends on F-271 registration |
| F-274 | Registration creates User, JWT issued at F-272 | No direct impact |
| F-275 | Default role assignment at registration | User assigned ROLE_USER at creation |
| F-276 | PasswordPolicyValidator reads policy | Can use defaults; policy row seeded by T-271-11 |
| F-277 | Lockout fields initialized at registration | Lockout enforced at login, not registration |

## 4. Task Estimation Summary
| Phase | Tasks | Total Dev-Days |
| Wave 1: Foundation | T-271-01 to T-271-08 | ~4.5 days |
| Wave 2: Testing + Polish | T-271-09 to T-271-11 | ~3 days |
| Total | 11 tasks | ~7.5 days |

## 5. Implementation Order (Critical Path)
T-271-01 (Entity) -> T-271-02 (Repo) -> T-271-05 (Service) -> T-271-07 (Controller) -> T-271-09 (Tests)
T-271-03 (DTO) -> T-271-06 (Service) -> T-271-08 (ExceptionHandler) -> T-271-10 (Integration Tests)
T-271-04 (Exception) -> T-271-11 (Migration + Config)

All tasks target: Spring Boot 3.3.6 / Java 17 / PostgreSQL
