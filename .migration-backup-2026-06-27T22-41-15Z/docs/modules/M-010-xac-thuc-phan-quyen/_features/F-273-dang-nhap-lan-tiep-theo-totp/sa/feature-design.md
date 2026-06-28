---
id: F-273
name: "Đăng nhập lần tiếp theo + TOTP"
slug: dang-nhap-lan-tiep-theo-totp
module-id: M-010
status: in_design
classification: local
priority: high
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-23T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# SA: F-273 — Đăng nhập lần tiếp theo + TOTP (System Architecture)

> **Feature:** F-273 — Xác thực 2 yếu tố cho người dùng đã hoàn tất F-272 (TOTP setup).  
> **Module:** M-010 — Xác thực & Phân quyền  
> **Stack:** Spring Boot 3.3.6 · Java 17 · JPA/Hibernate · Spring Security · JJWT 0.12.5  
> **Database:** PostgreSQL (runtime) / H2 (dev)  
> **SA version:** v1.0 · generated: 2026-06-23

---

## Mục lục

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [API Endpoint Specifications](#3-api-endpoint-specifications)
4. [JWT Integration with F-274](#4-jwt-integration-with-f-274)
5. [Security Considerations](#5-security-considerations)
6. [Audit Logging Design](#6-audit-logging-design)
7. [Component Dependencies](#7-component-dependencies)
8. [Migration Strategy](#8-migration-strategy)
9. [Error Code Catalog](#9-error-code-catalog)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Architecture Overview

### 1.1 Context Diagram

```
┌──────────┐     POST /api/auth/login      ┌───────────────┐
│   Client │ ────────────────────────────▶ │  AuthController│
│ (Web/MO  │                               │  (M-010/F-273) │
│  bile)   │◀──────────────────────────── │                │
└──────────┘   2FA challenge (401/redirect)└───────┬────────┘
                                                    │
                         POST /api/auth/login/totp   │
                         ──────────────────────────▶ │
                                                    │
         ┌──────────────────────────────────────────┼──────────────────────────┐
         │                                          │                          │
         ▼                                          ▼                          ▼
  ┌──────────────┐                        ┌─────────────────┐        ┌────────────────┐
  │UserService   │                        │ TotpValidator   │        │ JwtUtil (F-274)│
  │ (credential  │                        │ (TOTP RFC 6238  │        │ (JWT issuance) │
  │  auth +      │                        │  validation)    │        └────────────────┘
  │  account     │                        └─────────────────┘              │
  │  lock check) │                                                         │
  └──────┬───────┘                                                         ▼
         │                                              ┌──────────────────────────┐
         │                                              │  JWT Token (access +     │
         │                                              │  refresh, 15m + 7d)      │
         ▼                                              └──────────────────────────┘
  ┌──────────────┐
  │UserRepository│──▶ User JPA Entity
  └──────────────┘

  ┌──────────────────┐
  │ LoginAuditLogSvc │──▶ LoginAuditLog JPA Entity
  │ (every attempt)  │
  └──────────────────┘
```

### 1.2 Flow Sequence

```
Client                         Server                         DB
 │                               │                             │
 │  POST /api/auth/login         │                             │
 │  {username, password}         │                             │
 │──────────────────────────────▶│                             │
 │                               │── SELECT * FROM app_users   │
 │                               │──   WHERE username/email    │
 │                               │     = ?                     │
 │                               │                             │
 │                               │── Check account lock (F-277)│
 │                               │── BR-273-06                 │
 │                               │                             │
 │                               │── Verify password (bcrypt)  │
 │                               │── BR-273-02                 │
 │                               │                             │
 │                               │── Check totp_enabled        │
 │                               │── BR-273-01                 │
 │                               │                             │
 │   401 UNAUTHORIZED            │                             │
 │   challenge_2fa=true          │◀────────────────────────────│
 │   user_id=<uuid>              │
 │───────────────────────────────│                             │
 │                               │
 │  POST /api/auth/login/totp    │                             │
 │  {user_id, totp_code}         │                             │
 │──────────────────────────────▶│                             │
 │                               │── Decrypt totp_secret       │
 │                               │── BR-273-09                 │
 │                               │                             │
 │                               │── Validate TOTP (30s window)│
 │                               │── BR-273-03                 │
 │                               │                             │
 │                               │── Increment failed_totp_count│
 │                               │── BR-273-05 (on fail)       │
 │                               │                             │
 │   200 OK                      │                             │
 │   {access_token, refresh_token│                             │
 │    user_info}                 │                             │
 │◀──────────────────────────────│◀──── INSERT audit log       │
 │                               │── BR-273-08                 │
```

### 1.3 Layer Architecture (within existing Spring Boot)

| Layer | Existing package | F-273 additions |
|-------|-----------------|-----------------|
| **Controller** | `com.hanghai.kchtg.user.controller` | Extended `AuthController` with TOTP endpoint |
| **Service** | `com.hanghai.kchtg.user.service` | `TotpAuthService` (orchestrates credential + TOTP + JWT) |
| **Repository** | `com.hanghai.kchtg.user.repository` | Extended `UserRepository` with totp-enabled queries |
| **Entity** | `com.hanghai.kchtg.user.entity` | New `LoginAuditLog` entity |
| **Security** | `com.hanghai.kchtg.security` | Extended `JwtUtil` (2-token generation), new `TotpValidator` |
| **DTO** | `com.hanghai.kchtg.user.dto` | New `TotpLoginRequest`, `TwoFactorLoginResponse` |

---

## 2. Database Schema

### 2.1 User Entity Extension (existing table `app_users`)

The existing `User` entity (table `app_users`) needs **new columns**. These are additive — no existing columns are modified or removed.

```sql
-- Migration: Add TOTP and security-related columns to app_users
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS is_totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_secret_encrypted VARCHAR(255),
  ADD COLUMN IF NOT EXISTS failed_login_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_totp_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITHOUT TIME ZONE;

-- Index for account lock check (frequent on every login attempt)
CREATE INDEX IF NOT EXISTS idx_app_users_locked_until
  ON app_users(account_locked_until)
  WHERE account_locked_until IS NOT NULL;
```

#### Column Specifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `is_totp_enabled` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Flag set to `TRUE` by F-272 after successful TOTP setup. F-273 reads this flag. |
| `totp_secret_encrypted` | `VARCHAR(255)` | `NULLABLE` | AES-256-GCM encrypted TOTP shared secret. Decrypted at runtime only during TOTP validation. Populated by F-272. |
| `failed_login_count` | `INT` | `NOT NULL DEFAULT 0` | Counter incremented on each failed credential attempt. Reset on successful 2FA login (BR-273-04). Shared with F-277. |
| `failed_totp_count` | `INT` | `NOT NULL DEFAULT 0` | Counter incremented on each failed TOTP code attempt. Reset on successful 2FA login (BR-273-04). |
| `account_locked_until` | `TIMESTAMP` | `NULLABLE` | When the account lock expires. Set by F-273 (temporary 15-min lock on BR-273-05) or by F-277 (permanent lock). Checked by BR-273-06. |

### 2.2 LoginAuditLog Entity (new table)

```java
package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Login attempt audit log — captures every credential and TOTP verification attempt.
 * <p>
 * Persists to the {@code login_audit_logs} table. Inherits standard BaseEntity fields
 * ({@code id}, {@code createdAt}, {@code updatedAt}, {@code deletedAt}).
 * </p>
 */
@Entity
@Table(name = "login_audit_logs")
@Getter
@NoArgsConstructor
@SQLRestriction("deleted_at IS NULL")
public class LoginAuditLog extends BaseEntity {

    /** User ID of the login attempt subject. NULL for pre-identification attempts. */
    @Column(name = "user_id")
    private UUID userId;

    /** Whether the attempt was credential or TOTP verification. */
    @Enumerated(EnumType.STRING)
    @Column(name = "attempt_type", nullable = false, length = 20)
    private LoginAttemptType attemptType;

    /** Overall result of the attempt. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private LoginAttemptResult result;

    /** Client IP address (IPv4/IPv6, up to 45 chars). */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** Client User-Agent string (truncated at 1000 chars). */
    @Column(name = "user_agent", length = 1000)
    private String userAgent;

    /** Internal failure reason code (e.g. "ACCOUNT_LOCKED", "WRONG_PASSWORD", "TOTP_INVALID"). */
    @Column(name = "failed_reason", length = 50)
    private String failedReason;

    /**
     * Factory method — creates a LoginAuditLog for a credential attempt.
     */
    public static LoginAuditLog forCredentials(UUID userId, LoginAttemptResult result,
                                                String failedReason, String ipAddress,
                                                String userAgent) {
        LoginAuditLog log = new LoginAuditLog();
        log.userId = userId;
        log.attemptType = LoginAttemptType.CREDENTIALS;
        log.result = result;
        log.ipAddress = ipAddress;
        log.userAgent = userAgent;
        log.failedReason = failedReason;
        return log;
    }

    /**
     * Factory method — creates a LoginAuditLog for a TOTP verification attempt.
     */
    public static LoginAuditLog forTotp(UUID userId, LoginAttemptResult result,
                                         String failedReason, String ipAddress,
                                         String userAgent) {
        LoginAuditLog log = new LoginAuditLog();
        log.userId = userId;
        log.attemptType = LoginAttemptType.TOTP;
        log.result = result;
        log.ipAddress = ipAddress;
        log.userAgent = userAgent;
        log.failedReason = failedReason;
        return log;
    }
}

/** Type of login attempt. */
public enum LoginAttemptType {
    CREDENTIALS,  // POST /api/auth/login (email/phone + password)
    TOTP          // POST /api/auth/login/totp (user_id + 6-digit code)
}

/** Result of a login attempt. */
public enum LoginAttemptResult {
    SUCCESS,  // 2FA completed, JWT issued
    FAIL      // Rejected at some stage
}
```

```sql
-- Migration: Create login_audit_logs table
CREATE TABLE IF NOT EXISTS login_audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID,
    attempt_type VARCHAR(20)  NOT NULL CHECK (attempt_type IN ('CREDENTIALS', 'TOTP')),
    result       VARCHAR(10)  NOT NULL CHECK (result IN ('SUCCESS', 'FAIL')),
    ip_address   VARCHAR(45),
    user_agent   VARCHAR(1000),
    failed_reason VARCHAR(50),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMP WITH TIME ZONE
);

-- Index: fast lookup by user and time range
CREATE INDEX idx_login_audit_logs_user_time
  ON login_audit_logs(user_id, created_at DESC);

-- Index: fast lookup by attempt type
CREATE INDEX idx_login_audit_logs_type_result
  ON login_audit_logs(attempt_type, result);

-- Index: fast lookup by IP for brute-force detection
CREATE INDEX idx_login_audit_logs_ip
  ON login_audit_logs(ip_address, created_at DESC);
```

### 2.3 Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────────┐
│    app_users    │       │  login_audit_logs    │
├─────────────────┤       ├──────────────────────┤
│ id (UUID) PK    │──┐    │ id (UUID) PK         │
│ username        │  │    │ user_id FK → app_users│
│ email           │  1   │ attempt_type (enum)    │
│ password (BCrypt)│ │──N │ result (enum)          │
│ fullName        │  │    │ ip_address             │
│ phone           │  │    │ user_agent             │
│ role            │  │    │ failed_reason          │
│ status          │  │    │ created_at (auto)      │
│ last_login_at   │  │    │ updated_at (auto)      │
│ is_totp_enabled │  │    │ deleted_at             │
│ totp_secret_enc │  │    └──────────────────────┘
│ failed_login_ct │  │
│ failed_totp_ct  │  │
│ account_locked_ │  │
└─────────────────┘  │
                     │
              (Read-only access by F-273 service layer)
              (totp_secret_encrypted decrypted by EncryptionUtil)
```

### 2.4 Hibernate JPA Entity — Extended User (to be merged into existing)

```java
// ADD to existing User.java in com.hanghai.kchtg.user.entity

/**
 * Flag set by F-272 when TOTP setup is complete.
 * F-273 checks this to gate the 2FA flow.
 */
@Column(name = "is_totp_enabled", nullable = false, columnDefinition = "boolean default false")
private boolean totpEnabled = false;

/**
 * AES-256-GCM encrypted TOTP shared secret.
 * Decrypted at runtime via {@link EncryptionUtil} before validation.
 * Populated by F-272.
 */
@Column(name = "totp_secret_encrypted", length = 255)
private String totpSecretEncrypted;

/**
 * Failed login credential attempts. Reset to 0 on successful 2FA login.
 * Threshold-based lock delegated to F-277.
 */
@Column(name = "failed_login_count", nullable = false, columnDefinition = "integer default 0")
private int failedLoginCount = 0;

/**
 * Failed TOTP verification attempts. Reset to 0 on successful 2FA login.
 * Locks account temporarily after 5 consecutive failures (BR-273-05).
 */
@Column(name = "failed_totp_count", nullable = false, columnDefinition = "integer default 0")
private int failedTotpCount = 0;

/**
 * Account lock expiration timestamp.
 * Set when account is locked (F-273 BR-273-05 or F-277).
 * Null means account is not locked.
 */
@Column(name = "account_locked_until")
private LocalDateTime accountLockedUntil;
```

---

## 3. API Endpoint Specifications

### 3.1 POST /api/auth/login — Credential Authentication

**Purpose:** Authenticate user identity with username/email/phone + password. On success, returns a 2FA challenge token (not a full JWT).

**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "username": "nguyenvana",           // existing: login by username
  // OR alternatively, server should support email/phone lookup too
  "password": "p@ssw0rd!"
}
```

**Successful Response (200):** Password OK, but user has `is_totp_enabled = true` → return 2FA challenge.

```json
{
  "success": true,
  "message": "MFA challenge required",
  "data": {
    "challengeId": "uuid-xxxx-xxxx",        // server-generated session ID
    "userId": "uuid-yyyy-yyyy",              // user's UUID (needed for TOTP step)
    "requiresMfa": true,
    "totpEnabled": true
  },
  "timestamp": "2026-06-23T10:30:00"
}
```

**Edge — User has TOTP not yet enabled (BR-273-01):**
```json
{
  "success": false,
  "message": "Vui lòng thiết lập TOTP trước khi đăng nhập",
  "data": {
    "requiresTotpSetup": true,
    "redirectFlow": "F-272"
  },
  "timestamp": "2026-06-23T10:30:00"
}
```
*(HTTP 200 with business error — standard API pattern in this project)*

**Failure — Account Locked (BR-273-06):**
```json
{
  "success": false,
  "message": "Tài khoản đã bị khóa. Vui lòng thử lại sau hoặc liên hệ admin.",
  "data": {
    "errorCode": "ACCOUNT_LOCKED",
    "lockedUntil": "2026-06-23T10:45:00"    // estimated unlock time
  },
  "timestamp": "2026-06-23T10:30:00"
}
```
*(HTTP 403 — forbidden)*

**Failure — Invalid Credentials:**
```json
{
  "success": false,
  "message": "Sai thông tin đăng nhập",    // Generic message (BR-273-10: anti-enumeration)
  "data": {
    "errorCode": "INVALID_CREDENTIALS"
  },
  "timestamp": "2026-06-23T10:30:00"
}
```
*(HTTP 401 — unauthorized)*

### 3.2 POST /api/auth/login/totp — TOTP Verification

**Purpose:** Validate the 6-digit TOTP code and issue JWT tokens.

**Request:**
```json
POST /api/auth/login/totp
Content-Type: application/json

{
  "userId": "uuid-yyyy-yyyy",              // from login step response
  "totpCode": "123456"                     // 6-digit code from authenticator app
}
```

**Successful Response (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",       // JWT access token (15m expiry)
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",      // JWT refresh token (7d expiry)
    "tokenType": "Bearer",
    "expiresIn": 900,                                // seconds until access token expires
    "user": {
      "id": "uuid-yyyy-yyyy",
      "username": "nguyenvana",
      "fullName": "Nguyễn Văn A",
      "role": "ROLE_USER",
      "totpEnabled": true
    }
  },
  "timestamp": "2026-06-23T10:30:05"
}
```

**Failure — Invalid TOTP (BR-273-03):**
```json
{
  "success": false,
  "message": "Mã TOTP không hợp lệ",
  "data": {
    "errorCode": "TOTP_INVALID",
    "remainingAttempts": 4
  },
  "timestamp": "2026-06-23T10:30:05"
}
```
*(HTTP 401)*

**Failure — TOTP exceeded max attempts (BR-273-05):**
```json
{
  "success": false,
  "message": "Quá số lần thử TOTP. Tài khoản đã bị khóa tạm thời.",
  "data": {
    "errorCode": "TOTP_MAX_ATTEMPTS",
    "lockedUntil": "2026-06-23T10:45:00"
  },
  "timestamp": "2026-06-23T10:30:05"
}
```
*(HTTP 403)*

### 3.3 Endpoint Security Matrix

| Endpoint | Auth Required | Description |
|----------|--------------|-------------|
| `POST /api/auth/login` | ❌ (public) | Credential authentication. Must be permitAll in SecurityConfig. |
| `POST /api/auth/login/totp` | ❌ (public) | TOTP verification. Must be permitAll in SecurityConfig. |

**SecurityConfig addition (in `SecurityConfig.java`):**

```java
.requestMatchers("/api/auth/login").permitAll()
.requestMatchers("/api/auth/login/totp").permitAll()
```

### 3.4 DTO Specifications

#### 3.4.1 TotpLoginRequest

```java
package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * DTO for POST /api/auth/login/totp — TOTP verification step.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TotpLoginRequest {

    @NotNull(message = "User ID không được để trống")
    private UUID userId;

    @NotBlank(message = "Mã TOTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã TOTP phải là 6 chữ số")
    private String totpCode;
}
```

#### 3.4.2 TwoFactorLoginResponse

```java
package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * DTO returned after successful 2FA login.
 * Contains JWT tokens and user info.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorLoginResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private int expiresIn;                          // access token TTL in seconds
    private UserInfo user;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UserInfo {
        private UUID id;
        private String username;
        private String fullName;
        private String role;
        private boolean totpEnabled;
    }

    public static TwoFactorLoginResponse of(String accessToken, String refreshToken,
                                             int expiresIn, UserResponse user) {
        TwoFactorLoginResponse response = new TwoFactorLoginResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(expiresIn);

        TwoFactorLoginResponse.UserInfo ui = new TwoFactorLoginResponse.UserInfo();
        ui.setId(user.id());
        ui.setUsername(user.username());
        ui.setFullName(user.fullName());
        ui.setRole(user.role());
        ui.setTotpEnabled(user.isTotpEnabled());
        response.setUser(ui);

        return response;
    }
}
```

---

## 4. JWT Integration with F-274

### 4.1 JWT Claim Structure

After F-273 2FA pass, the JWT contains:

```json
{
  "sub": "nguyenvana",
  "jti": "uuid-xxxx-xxxx",              // unique token identifier (for F-274 blacklist)
  "role": "ROLE_USER",
  "role_level": 1,                      // function-level from F-275
  "totp_enabled": true,                 // MFA status flag
  "iat": 1719139800,
  "exp": 1719140700                     // 15 minutes later (access token)
}
```

### 4.2 Token Generation Design (extended JwtUtil)

The existing `JwtUtil.generateToken(username, role)` is extended to support 2-token generation:

```java
// New methods in JwtUtil (to be implemented as part of F-274 integration)

/**
 * Generates access token (short-lived, ~15 minutes) after 2FA success.
 * Contains: sub (username), jti, role, role_level, totp_enabled.
 */
public String generateAccessToken(User user) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + ACCESS_TOKEN_EXPIRY); // ~15 min
    String jti = UUID.randomUUID().toString();

    return Jwts.builder()
            .subject(user.getUsername())
            .id(jti)
            .claim("role", user.getRole() != null ? user.getRole() : "ROLE_USER")
            .claim("role_level", calculateRoleLevel(user.getRole()))    // from F-275
            .claim("totp_enabled", user.isTotpEnabled())
            .issuedAt(now)
            .expiration(expiry)
            .signWith(signingKey)
            .compact();
}

/**
 * Generates refresh token (long-lived, ~7 days) after 2FA success.
 * Contains: sub (username), jti, totp_enabled.
 * Intended for F-274 auto-refresh flow.
 */
public String generateRefreshToken(User user) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + REFRESH_TOKEN_EXPIRY); // ~7 days
    String jti = UUID.randomUUID().toString();

    return Jwts.builder()
            .subject(user.getUsername())
            .id(jti)
            .claim("totp_enabled", user.isTotpEnabled())
            .issuedAt(now)
            .expiration(expiry)
            .signWith(signingKey)
            .compact();
}
```

**Constants (to be moved to JwtProperties for config-driven tuning):**
- `ACCESS_TOKEN_EXPIRY = 900_000L` (15 minutes)
- `REFRESH_TOKEN_EXPIRY = 604_800_000L` (7 days)

### 4.3 F-274 Handoff Points

F-273 produces the tokens. F-274 owns their lifecycle:

| Concern | Owner | F-273 responsibility | F-274 responsibility |
|---------|-------|---------------------|---------------------|
| **Token generation** | F-274 (JwtUtil) | None — just calls `JwtUtil.generateAccessToken()` | Generates tokens with proper claims + JTI |
| **Token refresh** | F-274 | None | `POST /api/auth/refresh` endpoint, validate refresh token |
| **Token blacklist** | F-274 | None | Store `jti` in Redis/in-memory on logout (F-274) |
| **Logout** | F-274 | None | Invalidate refresh token + blacklist access token |
| **Token expiry enforcement** | JwtAuthFilter | Provide `totp_enabled` claim for filter checks | Ensure filter reads `totp_enabled` claim |

### 4.4 JwtAuthFilter Enhancement

The existing `JwtAuthFilter` must check the `totp_enabled` claim to enforce that all requests come from users who have completed 2FA:

```java
// Inside JwtAuthFilter.doFilterInternal():
Claims claims = jwtUtil.validateToken(token);

// Require totp_enabled = true for all authenticated requests
if (!Boolean.TRUE.equals(claims.get("totp_enabled", Boolean.class))) {
    log.warn("Request from user without 2FA: {}", claims.getSubject());
    SecurityContextHolder.clearContext();
    return;
}
```

### 4.5 Role Level Mapping (bridge to F-275)

The `role_level` claim maps the Spring Security role to F-275's 3-level authorization:

| Spring Security Role | F-275 Role Level | Access |
|---------------------|-----------------|--------|
| `ROLE_USER` | Level 1 | Basic functions |
| `ROLE_SUPPORT` / `ROLE_OPERATOR` | Level 2 | Extended operations |
| `ROLE_ADMIN` | Level 3 | Admin functions |
| `ROLE_SUPER_ADMIN` | Level 4 | Full system access |

This mapping is calculated by F-273 but fully defined by F-275.

---

## 5. Security Considerations

### 5.1 Threat Model Summary

| Threat | Mitigation | Business Rule |
|--------|-----------|---------------|
| **Credential stuffing** | Rate limiting (F-277), account lock on threshold | BR-273-02 |
| **TOTP code replay** | 30s window (RFC 6238), constant-time comparison | BR-273-03 |
| **TOTP brute force** | Max 5 retries → 15-min lock | BR-273-05 |
| **TOTP secret leakage** | AES-256-GCM encryption at rest | BR-273-09 |
| **User enumeration** | Generic error messages | BR-273-10 |
| **Timing attack on TOTP** | Constant-time comparison (`MessageDigest.isEqual` equivalent) | Security Testing |
| **JWT theft** | Short access token (15m), HTTPS enforcement | BR-273-07 |
| **JWT replay** | `jti` claim for blacklist (F-274) | BR-273-07 |
| **Account lock bypass** | Lock check before any processing (BR-273-06) | BR-273-06 |
| **TOTP secret decryption** | Key from env var only, never hardcoded | BR-273-09 |

### 5.2 TOTP Implementation Details

#### 5.2.1 Algorithm

- **Standard:** RFC 6238 (TOTP)
- **Hash:** SHA-256 (preferred) or SHA-1 (compatible with most authenticator apps)
- **Digits:** 6
- **Period:** 30 seconds
- **Time step:** `T = (currentUnixTime / 30)`
- **Algorithm:** `HMAC(secret, T) truncated to 6 digits`

#### 5.2.2 TOTP Validator (service-level)

```java
package com.hanghai.kchtg.security;

import org.springframework.stereotype.Component;

/**
 * Validates TOTP codes per RFC 6238.
 * Uses a ±1 time-step tolerance window (30s ± 30s) to accommodate
 * client-server clock drift.
 */
@Component
public class TotpValidator {

    private static final int TIME_STEP = 30;          // seconds
    private static final int TOLERANCE = 1;            // ±1 step
    private static final int CODE_LENGTH = 6;
    private static final String ALGORITHM = "HmacSHA256";

    /**
     * Validates a TOTP code against a decrypted shared secret.
     * Allows ±1 time-step tolerance for clock drift.
     *
     * @param secret     decrypted shared secret (raw bytes or ASCII string)
     * @param totpCode   6-digit code from the user
     * @return true if the code is valid within the tolerance window
     */
    public boolean validate(String secret, String totpCode) {
        // Input validation
        if (totpCode == null || !totpCode.matches("\\d{6}")) {
            return false;
        }

        long currentTime = System.currentTimeMillis() / 1000;
        long currentTimeStep = currentTime / TIME_STEP;

        // Check ±1 tolerance window
        for (int i = -TOLERANCE; i <= TOLERANCE; i++) {
            long step = currentTimeStep + i;
            if (generateTotp(secret, step).equals(totpCode)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generates a TOTP code for a given time step.
     * Uses constant-time comparison internally.
     */
    private String generateTotp(String secret, long timeStep) {
        // HMAC-SHA256(secret, timeStep as 8-byte big-endian)
        // Truncate to 6 digits
        // Implementation detail: use a battle-tested library like
        // "google-authenticator" or "pyotp" Java equivalent
        // For production: recommend dependency
        //   com.warrenstrange:google-authenticator:1.0.0
        throw new UnsupportedOperationException("Implement with google-authenticator library");
    }
}
```

#### 5.2.3 Recommended Library

**Dependency to add to `pom.xml`:**

```xml
<dependency>
    <groupId>com.warrenstrange</groupId>
    <artifactId>google-authenticator</artifactId>
    <version>1.0.0</version>
</dependency>
```

This provides:
- RFC 6238 compliant TOTP generation/validation
- Base32 secret encoding
- QR code URI generation
- ±time-step tolerance

#### 5.2.4 Constant-Time Comparison

TOTP code comparison MUST use constant-time comparison to prevent timing attacks:

```java
// Use MessageDigest.isEqual() or similar:
boolean equals = MessageDigest.isEqual(
    expectedCode.getBytes(StandardCharsets.UTF_8),
    providedCode.getBytes(StandardCharsets.UTF_8)
);
```

### 5.3 Encryption of TOTP Secret

- **Algorithm:** AES-256-GCM (already provided by `EncryptionUtil`)
- **Key source:** `encryption.key` environment variable (Base64-encoded 32-byte key)
- **Validation:** `EncryptionUtil.validateKey()` runs at startup via `@PostConstruct`
- **No plaintext storage:** `totp_secret_encrypted` column stores only encrypted value

### 5.4 Anti-Enumeration (BR-273-10)

**Rule:** Never reveal whether an email/username exists in the system.

**Implementation:**
```java
// In AuthController.login():
// 1. ALWAYS perform password check (even if user not found)
// 2. Use a dummy password hash for non-existent users
// 3. Always return same error message format

User user = userRepository.findByUsername(username).orElse(null);
String dummyPassword = "$2a$10$dummyhashfortimingattack";
boolean passwordMatch = user != null && passwordEncoder.matches(password, user.getPassword());

if (!passwordMatch) {
    // Same message regardless of user existence
    throw new AuthenticationException("Sai thông tin đăng nhập");
}
```

**Note:** This is a deviation from the current `AuthController` which uses `orElseThrow`. The F-273 implementation must use the "always compute" pattern.

### 5.5 Session Management

- **No server-side session:** Stateless JWT (stateless per Spring Security `SessionCreationPolicy.STATELESS`)
- **No cookies:** Tokens passed via `Authorization: Bearer <token>` header
- **No CSRF tokens:** Disabled for REST API (CSRF protection is for stateful browser sessions)

### 5.6 Transport Security

- **HTTPS required in production:** All auth endpoints must be behind TLS
- **HSTS header:** Should be enforced at nginx/proxy level
- **CORS:** Restrict to known frontend origins in SecurityConfig

---

## 6. Audit Logging Design

### 6.1 Logging Events

Every login attempt (both credential and TOTP) is logged:

| Event | attempt_type | result | failed_reason |
|-------|-------------|--------|---------------|
| Login: valid password, proceeds to 2FA | CREDENTIALS | SUCCESS | (none) |
| Login: wrong password | CREDENTIALS | FAIL | WRONG_PASSWORD |
| Login: account locked | CREDENTIALS | FAIL | ACCOUNT_LOCKED |
| Login: TOTP not enabled | CREDENTIALS | FAIL | TOTP_NOT_ENABLED |
| TOTP: valid code | TOTP | SUCCESS | (none) |
| TOTP: wrong code | TOTP | FAIL | TOTP_INVALID |
| TOTP: max attempts exceeded | TOTP | FAIL | TOTP_MAX_ATTEMPTS |

### 6.2 LoginAuditLogService

```java
package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.LoginAuditLog;
import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.repository.LoginAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for recording login audit log entries.
 * Implements BR-273-08: every login attempt must be logged.
 */
@Service
public class LoginAuditLogService {

    private static final Logger log = LoggerFactory.getLogger(LoginAuditLogService.class);

    private final LoginAuditLogRepository repository;

    public LoginAuditLogService(LoginAuditLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Records a login attempt (credential or TOTP).
     * Runs in a dedicated transaction to ensure logging even if the main flow fails.
     */
    @Transactional
    public void logLoginAttempt(UUID userId, LoginAuditLog.LoginAttemptType type,
                                 LoginAttemptResult result, String failedReason,
                                 HttpServletRequest request) {
        String ip = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        LoginAuditLog entry;
        if (type == LoginAuditLog.LoginAttemptType.CREDENTIALS) {
            entry = LoginAuditLog.forCredentials(userId, result, failedReason, ip, userAgent);
        } else {
            entry = LoginAuditLog.forTotp(userId, result, failedReason, ip, userAgent);
        }

        repository.save(entry);
        log.info("Login audit: type={}, userId={}, result={}, reason={}",
                type, userId, result, failedReason);
    }

    /**
     * Extracts real client IP from request (handles proxy/X-Forwarded-For).
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // First entry is the original client IP
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

### 6.3 LoginAuditLogRepository

```java
package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.LoginAuditLog;
import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LoginAuditLogRepository extends JpaRepository<LoginAuditLog, UUID> {

    /** Find all attempts for a user, ordered by most recent. */
    List<LoginAuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /** Find failed attempts in a time range for a user. */
    List<LoginAuditLog> findByUserIdAndResultAndCreatedAtAfter(
            UUID userId, LoginAttemptResult result, LocalDateTime after);

    /** Find all failed attempts by IP address in a time range (brute-force detection). */
    List<LoginAuditLog> findByIpAddressAndResultAndCreatedAtAfter(
            String ipAddress, LoginAttemptResult result, LocalDateTime after);
}
```

### 6.4 Log Cleanup (Integration with existing scheduler)

The existing `LogCleanupScheduler` (in `com.hanghai.kchtg.common.scheduler`) should be extended to clean up `login_audit_logs` entries older than 90 days:

```sql
-- Add to cleanup scheduler (existing pattern):
DELETE FROM login_audit_logs
WHERE created_at < NOW() - INTERVAL '90 days'
AND deleted_at IS NULL;
```

---

## 7. Component Dependencies

### 7.1 Feature Dependencies

| F-273 depends on | Dependency type | Description |
|-----------------|----------------|-------------|
| **F-272** (TOTP setup) | **Required** | `is_totp_enabled` and `totp_secret_encrypted` are populated by F-272. F-273 reads these. |
| **F-274** (JWT session) | **Required** | Token generation, refresh, blacklist, logout are owned by F-274. F-273 calls F-274's `JwtUtil`. |
| **F-275** (3-level authz) | **Required** | `role_level` claim in JWT derived from F-275 role mapping. |
| **F-276** (password policy) | **Indirect** | Password hashing method (BCrypt) from F-276. F-273 only verifies. |
| **F-277** (login attempt policy) | **Required** | `failed_login_count`, `failed_totp_count`, `account_locked_until` shared with F-277. F-273 integrates but does not own lock policy. |

### 7.2 Module Dependencies

| Module | F-273 integration |
|--------|-------------------|
| **M-001** (Admin) | Admins can view audit logs via `LoginAuditLog`. Admins can unlock accounts (F-277). |
| **M-010** (Auth) | F-273 is part of M-010. Owns the 2FA login flow. |

### 7.3 External Library Dependencies

| Library | Purpose | Justification |
|---------|---------|--------------|
| `com.warrenstrange:google-authenticator:1.0.0` | RFC 6238 TOTP implementation | Battle-tested, widely used, supports SHA1/SHA256, base32 encoding, time-step tolerance |
| `io.jsonwebtoken:jjwt-*:0.12.5` | JWT generation/validation | Already present in `pom.xml` |
| `org.springframework.boot:spring-boot-starter-security` | Spring Security | Already present |
| `org.springframework.boot:spring-boot-starter-validation` | Jakarta validation | Already present |

---

## 8. Migration Strategy

### 8.1 Database Migration Order

1. **Add columns to `app_users`** (TOTP, lock counters)
2. **Create `login_audit_logs` table**
3. **Create indexes** on new columns for performance

### 8.2 Implementation Phase

```
Phase 1: Foundation
├── Add columns to User entity
├── Create LoginAuditLog entity + repository
├── Update SecurityConfig (permitAll for TOTP endpoint)
└── Add google-authenticator dependency to pom.xml

Phase 2: Service Layer
├── Implement TotpValidator (or wrap google-authenticator library)
├── Implement TotpAuthService (orchestrates credential + TOTP flow)
├── Implement LoginAuditLogService
└── Extend JwtUtil with 2-token generation (F-274 collaboration)

Phase 3: Controller Layer
├── Extend AuthController with TOTP challenge response
├── Add POST /api/auth/login/totp endpoint
├── Add new DTOs (TotpLoginRequest, TwoFactorLoginResponse)
└── Update security error messages (BR-273-10 compliance)

Phase 4: Integration
├── Wire up JWTAuthFilter to check totp_enabled claim
├── Integrate with F-277 lock policy
├── Integrate with F-275 role level
└── Add log cleanup scheduler update

Phase 5: Testing
├── Unit tests: TotpValidator (RFC 6238 vectors)
├── Unit tests: JwtUtil token generation
├── Integration tests: full 2FA login flow
├── Security tests: constant-time comparison, timing attack
└── E2E tests: register (F-271) → setup (F-272) → login (F-273)
```

---

## 9. Error Code Catalog

| Error Code | HTTP Status | Scenario | Message |
|------------|------------|----------|---------|
| `INVALID_CREDENTIALS` | 401 | Wrong password | "Sai thông tin đăng nhập" |
| `ACCOUNT_LOCKED` | 403 | `account_locked_until > now()` | "Tài khoản đã bị khóa. Vui lòng thử lại sau hoặc liên hệ admin." |
| `TOTP_NOT_ENABLED` | 200 (business error) | `is_totp_enabled = false` | "Vui lòng thiết lập TOTP trước khi đăng nhập" |
| `TOTP_INVALID` | 401 | Wrong TOTP code | "Mã TOTP không hợp lệ" |
| `TOTP_MAX_ATTEMPTS` | 403 | ≥ 5 wrong TOTP codes | "Quá số lần thử TOTP. Tài khoản đã bị khóa tạm thời." |
| `TOTP_FORMAT_ERROR` | 400 | Non-6-digit code | "Mã TOTP phải là 6 chữ số" |

---

## 10. Implementation Checklist

### 10.1 Entity Changes
- [ ] Add `is_totp_enabled`, `totp_secret_encrypted`, `failed_login_count`, `failed_totp_count`, `accountLockedUntil` to `User.java`
- [ ] Create `LoginAuditLog.java` entity
- [ ] Create `LoginAttemptType` and `LoginAttemptResult` enums
- [ ] Create `LoginAuditLogRepository.java`

### 10.2 Service Layer
- [ ] Create `TotpAuthService.java` — orchestrates 2FA login flow
- [ ] Create `LoginAuditLogService.java`
- [ ] Extend `JwtUtil.java` with `generateAccessToken()` and `generateRefreshToken()` methods
- [ ] Implement `TotpValidator.java` (wrap google-authenticator library)

### 10.3 Controller & DTO
- [ ] Extend `AuthController.java` with TOTP challenge response on successful password
- [ ] Add `POST /api/auth/login/totp` endpoint
- [ ] Create `TotpLoginRequest.java` DTO
- [ ] Create `TwoFactorLoginResponse.java` DTO
- [ ] Create `MfaChallengeResponse.java` DTO (for 2FA challenge)

### 10.4 Security Configuration
- [ ] Add `/api/auth/login/totp` to permitAll in `SecurityConfig.java`
- [ ] Enhance `JwtAuthFilter.java` to check `totp_enabled` claim
- [ ] Implement "always compute" password verification (anti-enumeration)

### 10.5 Database
- [ ] Add migration SQL for `app_users` columns
- [ ] Add migration SQL for `login_audit_logs` table
- [ ] Add indexes on lock-related columns

### 10.6 Dependencies
- [ ] Add `google-authenticator:1.0.0` to `pom.xml`

### 10.7 Testing
- [ ] Unit tests for `TotpValidator` with RFC 6238 Appendix B test vectors
- [ ] Unit tests for JWT token generation (access + refresh)
- [ ] Unit tests for `LoginAuditLogService`
- [ ] Integration tests: full 2FA login flow
- [ ] Security tests: timing attack resistance, anti-enumeration

---

## Appendix A: Business Rule Traceability

| BR ID | SA Reference | Status |
|-------|-------------|--------|
| BR-273-01 | §3.1 (TOTP-not-enabled edge case) | ✅ Covered |
| BR-273-02 | §3.1 (password verification), §5.3 (always-compute pattern) | ✅ Covered |
| BR-273-03 | §5.2 (TOTP validation with RFC 6238) | ✅ Covered |
| BR-273-04 | §3.2 (success: reset counters to 0) | ✅ Covered |
| BR-273-05 | §3.2 (max attempts → 15-min lock) | ✅ Covered |
| BR-273-06 | §3.1 (account lock check before processing) | ✅ Covered |
| BR-273-07 | §4 (JWT claim structure, token TTLs) | ✅ Covered |
| BR-273-08 | §6 (Audit logging on every attempt) | ✅ Covered |
| BR-273-09 | §2.1 (encrypted column), §5.3 (EncryptionUtil) | ✅ Covered |
| BR-273-10 | §5.4 (Anti-enumeration pattern) | ✅ Covered |

## Appendix B: RFC 6238 Compliance

- **Section 4:** Time-step calculation (`T = floor(current Unix time / 30)`)
- **Section 5.2:** Clock drift tolerance (±1 time step = ±30s)
- **Section 5.3:** HMAC-SHA256 (preferred), HMAC-SHA1 (fallback)
- **Section 6:** Code truncation to 6 digits
- **Appendix B:** Test vectors available for unit testing

## Appendix C: Key Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `jwt.access-token-expiration` | `900000` (15 min) | Access token TTL in ms |
| `jwt.refresh-token-expiration` | `604800000` (7 days) | Refresh token TTL in ms |
| `totp.time-step` | `30` | TOTP period in seconds |
| `totp.tolerance` | `1` | ±time-step tolerance |
| `totp.digits` | `6` | TOTP code length |
| `totp.hash-algorithm` | `HmacSHA256` | HMAC algorithm |
| `totp.max-attempts` | `5` | Max failed TOTP attempts before lock |
| `totp.lock-duration-minutes` | `15` | Temporary lock duration after max attempts |
| `audit.log-retention-days` | `90` | Days to retain login audit logs |
