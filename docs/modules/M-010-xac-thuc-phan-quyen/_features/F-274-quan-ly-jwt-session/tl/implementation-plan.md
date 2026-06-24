---
id: F-274
name: Quan ly JWT session
slug: quan-ly-jwt-session
module-id: M-010
stage: tech-lead
status: in_development
created: 2026-06-23T00:00:00Z
last-updated: 2026-06-23T08:00:00Z
---

# Tech Lead Implementation Plan — F-274: Quan ly JWT Session

> **Source artifacts:** feature-brief.md (business requirements), sa/feature-design.md (architecture).
> **Scope:** Phase 1 - HS256 signing, 15-min access tokens, 7-day refresh tokens, HTTP-only cookie delivery, Caffeine revocation cache, reuse detection (BR-274-04).

---

## 1. Component Breakdown

Six implementation components, each owning a distinct concern:

| # | Component | Package | Responsibility | Dependencies |
|---|-----------|---------|----------------|--------------|
| C1 | **JWT Entities** | com.hanghai.kchtg.security.entity | JPA entities for session, revocation, signing key storage | common.entity.BaseEntity |
| C2 | **JWT Repositories** | com.hanghai.kchtg.security.repository | Spring Data JPA repositories for entity CRUD + custom queries | C1 |
| C3 | **TokenService** | com.hanghai.kchtg.security.service | Core JWT creation, validation, refresh, revoke - stateless | C2, Caffeine cache |
| C4 | **SessionService** | com.hanghai.kchtg.security.service | Session lifecycle: create, lookup, revoke, reuse-detection | C2, Caffeine cache |
| C5 | **Security Filters** | com.hanghai.kchtg.security.filter | CookieRefreshTokenFilter + JwtAuthenticationFilter (rewrite) | C3, C4 |
| C6 | **Auth Controller** | com.hanghai.kchtg.user.controller | /api/auth/* endpoints - orchestrates services | C3, C4, C5 |

**Cross-cutting:**
- SecurityConfig (existing) - augmented to wire C5 filters + add refresh/logout endpoints.
- CacheConfig (new) - Caffeine bean definition.
- TokenClaimsBuilder (new) - fluent factory for JWT claims.
- CookieConfig (new) - constants + cookie builder helper.
- JwtExceptions (new) - custom exception classes + @RestControllerAdvice overrides.

---

## 2. Package Structure

`
src/main/java/com/hanghai/kchtg/
+- common/
|  +- dto/ApiResponse.java                          (existing - reuse)
|  +- entity/BaseEntity.java                        (existing - reuse)
|  +- exception/
|     +- GlobalExceptionHandler.java               (existing - reuse + extend)
|     +- JwtExceptions.java                        (NEW: custom JWT exceptions)
|
+- config/
|  +- SecurityConfig.java                           (existing - augment)
|  +- SchedulerConfig.java                          (existing - reuse)
|  +- CacheConfig.java                              (NEW: Caffeine revocation cache)
|
+- security/
|  +- JwtProperties.java                            (existing - extend with new fields)
|  +- JwtUtil.java                                  (DEPRECATED: replaced by TokenService)
|  +- JwtAuthFilter.java                            (DEPRECATED: replaced by new filters)
|  +- EncryptionUtil.java                           (existing - reuse for token encryption)
|  +- entity/
|  |  +- JwtSession.java                           (NEW)
|  |  +- JwtTokenRevocation.java                   (NEW)
|  |  +- JwtSigningKey.java                        (NEW)
|  +- repository/
|  |  +- JwtSessionRepository.java                 (NEW)
|  |  +- JwtTokenRevocationRepository.java         (NEW)
|  |  +- JwtSigningKeyRepository.java              (NEW)
|  +- service/
|  |  +- TokenService.java                         (NEW - replaces JwtUtil)
|  |  +- SessionService.java                       (NEW)
|  |  +- TokenValidationService.java               (NEW - cache + DB revocation check)
|  +- filter/
|  |  +- CookieRefreshTokenFilter.java             (NEW)
|  |  +- JwtAuthenticationFilter.java              (NEW - rewrite of JwtAuthFilter)
|  +- dto/
|  |  +- LoginRequestDTO.java                      (NEW)
|  |  +- LoginResponseDTO.java                     (NEW - includes cookie metadata)
|  |  +- RefreshResponseDTO.java                   (NEW)
|  |  +- LogoutResponseDTO.java                    (NEW)
|  |  +- SessionListResponse.java                  (NEW)
|  |  +- RevokeAllRequestDTO.java                  (NEW)
|  |  +- SigningKeyResponse.java                   (NEW)
|  +- config/
|     +- CookieConfig.java                         (NEW)
|     +- TokenClaimsBuilder.java                   (NEW - fluent builder)
|
+- user/
   +- controller/
   |  +- AuthController.java                       (NEW - or merged into existing)
   |  +- SessionAdminController.java               (NEW - Super Admin endpoints)
   |  +- ... (existing controllers unchanged)
   +- ... (existing user package unchanged)
`

---

## 3. Interface Contracts

### 3.1 TokenService

`java
package com.hanghai.kchtg.security.service;

/**
 * Stateless JWT token lifecycle service.
 * Replaces the existing JwtUtil / JwtAuthFilter pattern.
 * All JWT operations go through this service for consistency.
 */
public interface TokenService {

    /**
     * Create an access token with sub, roles, permissions, sessionId, jti claims.
     *
     * @param userId      user UUID
     * @param roles       role codes (e.g. USER, ADMIN)
     * @param permissions permission keys (e.g. USER_READ, ADMIN_DASHBOARD_VIEW)
     * @param sessionId   correlation to JwtSession
     * @return compact JWT string (HS256, exp = now + 15min)
     */
    String createAccessToken(UUID userId, List<String> roles, List<String> permissions, String sessionId);

    /**
     * Create a refresh token: generate plaintext, compute SHA-512 hash + salt.
     *
     * @return pair of (plainToken, refreshTokenHash)
     */
    RefreshTokenPair createRefreshToken();

    /**
     * Validate an access token: signature, exp, nbf, iss, aud, algorithm.
     *
     * @param token compact JWT string
     * @return parsed claims (sub, jti, roles, permissions, sessionId)
     * @throws TokenExpiredException      if expired
     * @throws TokenInvalidException      if signature/algorithm mismatch
     * @throws SigningKeyException        if key unavailable
     */
    Claims validateAccessToken(String token);

    /**
     * Check if a token's jti is in the revocation cache or DB.
     *
     * @param jti    JWT ID from token
     * @param userId user UUID for broader check (reuse detection)
     * @return true if revoked
     */
    boolean isTokenRevoked(String jti, UUID userId);

    /**
     * Refresh access token using a refresh token cookie value.
     * Implements BR-274-04 (reuse detection).
     *
     * @param refreshTokenValue the plaintext refresh token from cookie
     * @param sessionId         current session ID from access token
     * @param userId            user UUID from access token
     * @return new access token string
     * @throws RefreshTokenReuseException if reuse detected
     * @throws TokenExpiredException      if refresh token expired
     * @throws TokenInvalidException      if invalid
     */
    String refreshAccessToken(String refreshTokenValue, String sessionId, UUID userId);

    /**
     * Revoke a single session (logout).
     *
     * @param sessionId session ID to revoke
     * @param userId    user ID (for audit)
     * @param revokedBy user performing the revoke (null = self)
     * @param reason    revocation reason enum
     */
    void revokeSession(String sessionId, UUID userId, UUID revokedBy, String reason);

    /**
     * Revoke ALL sessions for a user (admin/Super Admin).
     *
     * @param userId    target user
     * @param revokedBy admin user
     * @param reason    revocation reason
     * @return count of revoked sessions
     */
    int revokeAllSessions(UUID userId, UUID revokedBy, String reason);

    /**
     * Invalidate the entire revocation cache (key rotation emergency).
     */
    void invalidateRevocationCache();

    record RefreshTokenPair(String token, String hash) {}
}
`

### 3.2 SessionService

`java
package com.hanghai.kchtg.security.service;

/**
 * Session CRUD and reuse detection service.
 */
public interface SessionService {

    /**
     * Create a new JwtSession record after successful login.
     */
    JwtSession createSession(UUID userId, String refreshTokenHash, String salt,
                             String sessionId, String userAgent,
                             String ipAddress, String deviceFingerprint,
                             LocalDateTime expiresAt);

    /**
     * Find session by refresh token hash (for reuse detection).
     *
     * @param hash SHA-512 hash of the refresh token
     * @return session or null if not found
     */
    JwtSession findByRefreshTokenHash(String hash);

    /**
     * Update lastUsedAt timestamp on session.
     */
    void touchSession(JwtSession session);

    /**
     * Revoke a session: set isRevoked=true, revokedAt=now, status=REVOKED.
     */
    int revokeSession(JwtSession session, String reason, UUID revokedBy);

    /**
     * Revoke ALL active sessions for a user.
     */
    int revokeAllSessionsByUserId(UUID userId, String reason, UUID revokedBy);

    /**
     * Reuse detection: compare hashes.
     * Phase 1: reuse is detected via revocation cache + session lookup.
     *
     * @param presentedHash hash of the token presented in the request
     * @param storedHash    hash stored in the session record
     * @return true if reuse detected
     */
    boolean detectReuse(String presentedHash, String storedHash);

    /**
     * List active sessions for a user (admin).
     */
    List<JwtSession> findActiveByUserId(UUID userId);

    /**
     * Find session by session ID (correlation lookup).
     */
    Optional<JwtSession> findBySessionId(String sessionId);
}
`

### 3.3 TokenValidationService

`java
package com.hanghai.kchtg.security.service;

/**
 * Token validation service combining cache and DB checks for revocation.
 * Implements BR-274-11 (cache TTL 5 minutes with DB fallback).
 */
public interface TokenValidationService {

    /**
     * Check if a token is revoked. Uses Caffeine cache first, falls back to DB.
     */
    boolean isRevoked(String jti, UUID userId);

    /**
     * Mark a token as revoked in cache and DB.
     */
    void markRevoked(String jti, UUID userId, String sessionId, String reason, UUID revokedBy);
}
`

---

## 4. TokenService Implementation Details

### 4.1 Architecture Overview

The TokenService replaces the existing JwtUtil + JwtAuthFilter pattern with a full lifecycle service:

`
TokenService
+- createAccessToken()      -> Jwts.builder().subject(userId).claim(roles,...).signWith()
+- createRefreshToken()     -> UUID.randomUUID() -> PBKDF2-SHA512 hash + random salt
+- validateAccessToken()    -> Jwts.parser().verifyWith(signKey).parseSignedClaims()
+- isTokenRevoked()         -> Caffeine cache -> DB fallback
+- refreshAccessToken()     -> reuse detection -> create new access token
+- revokeSession()          -> session.markRevoked() + revocation log
+- revokeAllSessions()      -> bulk update + cache invalidate
`

### 4.2 Key Implementation Decisions

| Decision | Rationale |
|----------|-----------|
| HS256 only (Phase 1) | Existing JwtUtil uses HMAC; no change to signing key format |
| JJWT 0.12.5 | Already in pom.xml; Jwts.builder() and Jwts.parser() API |
| Refresh token = random UUID | Phase 1: not a JWT, just a random string (simpler hash-based detection) |
| SHA-512 for hash | Stronger than plain SHA-256; existing EncryptionUtil uses AES-GCM for encryption |
| JTI = random UUID per token | Unique cache key for revocation; prevents replay of revoked tokens |
| Session ID != JTI | Session ID links to JwtSession (long-lived); JTI links to a specific token instance (short-lived) |

### 4.3 createAccessToken() Implementation

`java
@Override
public String createAccessToken(UUID userId, List<String> roles,
                                 List<String> permissions, String sessionId) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + ACCESS_TOKEN_EXPIRY_MS); // 900,000 = 15 min

    return Jwts.builder()
        .subject(userId.toString())
        .id(UUID.randomUUID().toString())           // jti
        .issuedAt(now)
        .notBefore(now)
        .expiration(expiry)
        .issuer("hang-hai-auth-service")
        .audience("hang-hai-api")
        .claim("roles", roles)
        .claim("permissions", permissions)
        .claim("sessionId", sessionId)
        .signWith(signingKey)
        .compact();
}
`

### 4.4 createRefreshToken() Implementation

`java
private static final int SALT_LENGTH = 16;    // 128-bit salt
private static final SecureRandom secureRandom = new SecureRandom();

@Override
public RefreshTokenPair createRefreshToken() {
    // 1. Generate plaintext refresh token (random UUID string)
    String refreshToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();

    // 2. Generate random salt
    byte[] saltBytes = new byte[SALT_LENGTH];
    secureRandom.nextBytes(saltBytes);
    String salt = Base64.getEncoder().encodeToString(saltBytes);

    // 3. Compute SHA-512 hash of (refreshToken + salt)
    String hash = sha512Hex(refreshToken + ":" + salt);

    return new RefreshTokenPair(refreshToken, hash);
}
`

### 4.5 refreshAccessToken() - Reuse Detection Flow

`
1. Hash the presented refreshToken value -> presentedHash
2. Try SessionService.findByRefreshTokenHash(presentedHash)
   +- Found session -> check isRevoked
   |  +- isRevoked=true -> throw RefreshTokenReuseException (BR-274-04)
   |  +- isRevoked=false -> UPDATE lastUsedAt, proceed to step 4
   +- Not found -> throw TokenInvalidException
3. (reuse path) If session was already revoked, revoke ALL sessions for user
4. Invalidate revocation cache for this user (force cache refresh on next request)
5. Create new access token with updated claims
6. Return new access token; refresh token stays the same (no rotation Phase 1)
`

### 4.6 revokeSession() Implementation

`java
@Override
@Transactional
public void revokeSession(String sessionId, UUID userId, UUID revokedBy, String reason) {
    // 1. Find session by sessionId
    Optional<JwtSession> sessionOpt = sessionRepository.findBySessionId(sessionId);
    if (sessionOpt.isEmpty()) return;

    JwtSession session = sessionOpt.get();

    // 2. Mark session as revoked
    session.setRevoked(true);
    session.setRevokedAt(LocalDateTime.now());
    session.setStatus("REVOKED");

    // 3. Create revocation audit log
    JwtTokenRevocation logEntry = new JwtTokenRevocation();
    logEntry.setUser(userRepository.findById(userId).orElseThrow());
    logEntry.setSession(session);
    logEntry.setReason(reason);
    logEntry.setRevokedAt(LocalDateTime.now());
    logEntry.setRevokedBy(revokedBy != null ? userRepository.findById(revokedBy).orElse(null) : null);
    logEntry.setDetails(buildRevocationDetails(session));
    revocationRepository.save(logEntry);

    // 4. Invalidate cache
    revocationCache.invalidateAll();
}
`

### 4.7 Signing Key Loading

From existing JwtProperties (extended):

`java
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret;               // Base64 HMAC key (existing)
    private long expiration;             // Access token expiration (existing)

    // NEW fields for F-274:
    private int accessTokenExpirySeconds = 900;      // 15 min
    private int refreshTokenExpiryDays = 7;           // 7 days
    private String issuer = "hang-hai-auth-service";
    private String audience = "hang-hai-api";
    private String algorithm = "HS256";
}
`

---

## 5. SecurityFilterChain Wiring

### 5.1 Existing vs New

**Existing** (SecurityConfig.java):
- Single JwtAuthFilter for Bearer token validation
- requestMatchers("/api/auth/login").permitAll() only

**New** (SecurityConfig.java augmented):
- CookieRefreshTokenFilter inserted **before** JwtAuthenticationFilter
- JwtAuthenticationFilter (rewritten) for Bearer token validation
- New permitAll endpoints: /api/auth/refresh, /api/auth/logout (logout requires JWT)

### 5.2 Filter Chain Ordering

`
1. CsrfFilter          (Spring Security default)
   -> disable() - CSRF protected by SameSite=Strict cookie

2. CookieRefreshTokenFilter
   -> Intercepts /api/auth/refresh only
   -> Extracts refreshToken from cookie
   -> Validates token -> sets SecurityContext
   -> If success: authentication with user's roles

3. JwtAuthenticationFilter
   -> Intercepts all requests with Authorization: Bearer header
   -> Validates access token
   -> Sets SecurityContext with user + roles + permissions
   -> If fail: 401, no forwarding

4. FilterSecurityInterceptor
   -> @PreAuthorize evaluation
`

### 5.3 SecurityConfig Code

`java
@Bean
public SecurityFilterChain authFilterChain(HttpSecurity http,
        CookieRefreshTokenFilter cookieRefreshFilter,
        JwtAuthenticationFilter jwtAuthFilter) throws Exception {

    http
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))

        .authorizeHttpRequests(auth -> auth
            // Public endpoints
            .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/refresh").permitAll()
            .requestMatchers("/h2-console/**", "/actuator/health").permitAll()
            // Legacy public endpoints (unchanged)
            .requestMatchers("/api/point-objects/**", "/api/line-objects/**",
                            "/api/polygon-objects/**", "/api/map-layers/**",
                            "/api/search/**", "/api/v1/integration/share/**").permitAll()
            // Admin endpoints require specific permissions
            .requestMatchers("/api/auth/sessions/**").hasAuthority("JWT_POLICY_MANAGE")
            .requestMatchers("/api/auth/signing-keys/**").hasAuthority("JWT_POLICY_MANAGE")
            .requestMatchers("/api/auth/sessions/revoke-all").hasAuthority("JWT_REVOKE_ALL")
            // Everything else requires authentication
            .anyRequest().authenticated()
        )

        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)

        // Filter order: CookieRefreshTokenFilter -> JwtAuthenticationFilter
        .addFilterBefore(cookieRefreshFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthFilter, CookieRefreshTokenFilter.class);

    return http.build();
}
`

---

## 6. Caffeine Cache Design

### 6.1 Configuration

`java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public Cache<String, Boolean> revocationCache() {
        return Caffeine.newBuilder()
            .maximumSize(100_000)
            .expireAfterWrite(Duration.ofMinutes(5))  // BR-274-11
            .recordStats()
            .build();
    }
}
`

### 6.2 Cache Key Strategy

| Operation | Cache Key | Value |
|-----------|-----------|-------|
| Token revoked | "revoked:{jti}" | true |
| User revoke-all | "revoked:user:{userId}" | true |
| Check revoked | "revoked:{jti}" | Boolean |

### 6.3 Cache Operations

`java
// Check if revoked (cache first, DB fallback)
public boolean isRevoked(String jti, UUID userId) {
    // 1. Try cache with jti
    Boolean jtiRevoked = revocationCache.getIfPresent("revoked:" + jti);
    if (jtiRevoked != null) return jtiRevoked;

    // 2. Try cache with userId (for revoke-all)
    Boolean userRevoked = revocationCache.getIfPresent("revoked:user:" + userId);
    if (userRevoked != null) return userRevoked;

    // 3. DB fallback - check if any SUSPICIOUS_REUSE revocation in last 5 minutes
    boolean dbRevoked = revocationRepository.hasRecentSuspiciousRevocation(userId, Duration.ofMinutes(5));

    // 4. Populate cache
    revocationCache.put("revoked:" + jti, dbRevoked);
    if (dbRevoked) {
        revocationCache.put("revoked:user:" + userId, true);
    }

    return dbRevoked;
}

// Mark revoked
public void markRevoked(String jti, UUID userId, String sessionId, String reason, UUID revokedBy) {
    revocationCache.put("revoked:" + jti, true);
    if ("SUSPICIOUS_REUSE".equals(reason) || "ADMIN_REVOKE".equals(reason)) {
        revocationCache.put("revoked:user:" + userId, true);
    }
    // Also persist to DB (always)
    JwtTokenRevocation entry = new JwtTokenRevocation();
    // ... populate and save
    revocationRepository.save(entry);
}
`

### 6.4 Performance Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Cache hit ratio | >95% | Caffeine CacheStats.hitRate() |
| Average get latency | <1ms | JMX / Micrometer |
| Max entries | 100,000 | maximumSize() config |
| Eviction rate | <5% per hour | CacheStats.evictionCount() |

---

## 7. Cookie Configuration

### 7.1 Cookie Constants

`java
public final class CookieConfig {
    private CookieConfig() {}

    // Refresh token cookie
    public static final String REFRESH_TOKEN_NAME = "refreshToken";
    public static final String CSRF_TOKEN_NAME = "XSRF-TOKEN";
    public static final String COOKIE_PATH = "/";

    // Token transmission strategy:
    //   Access Token  -> Authorization: Bearer header (not stored in cookie)
    //   Refresh Token -> HTTP-only Secure cookie (BR-274-07)
}
`

### 7.2 Cookie Builder (for login/refresh responses)

`java
public final class CookieConfig {

    public static void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);                // HTTPS only
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(604_800);             // 7 days = 7 * 24 * 3600
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    public static void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(0);                   // Immediately delete
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    public static String extractRefreshTokenCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (REFRESH_TOKEN_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
`

### 7.3 Cookie Policy Decision Matrix

| Scenario | Access Token Delivery | Refresh Token Delivery |
|----------|----------------------|----------------------|
| Login response | Body: { accessToken: "..." } | Cookie: Set-Cookie: refreshToken=... |
| Refresh response | Body: { accessToken: "..." } | Cookie: Set-Cookie: refreshToken=... (same token, refreshed maxAge) |
| Logout response | N/A | Cookie: Set-Cookie: refreshToken=; Max-Age=0 |
| Protected endpoint | Header: Authorization: Bearer ... | Cookie sent automatically by browser |

---

## 8. Reuse Detection Logic

### 8.1 Detection Triggers

Reuse detection fires on refresh token usage (POST /api/auth/refresh):

1. Extract refresh token from cookie
2. Hash it -> presentedHash
3. Look up session by presentedHash in DB
4. If session found + isRevoked = true -> reuse detected (BR-274-04)
5. If session not found -> token invalid (possibly already revoked)
6. If session found + isRevoked = false -> normal refresh, proceed

### 8.2 Reuse Response Flow

`
Reuse detected (BR-274-04):
+- 1. Revoke ALL sessions for this user
|  +- Update all JwtSession records: isRevoked=true, status=REVOKED
|  +- Create JwtTokenRevocation with reason=SUSPICIOUS_REUSE
+- 2. Invalidate entire revocation cache
|  +- revocationCache.invalidateAll()
+- 3. Clear refresh token cookie
+- 4. Return 401:
|  +- { "error": { "code": "ALL_SESSIONS_REVOKED", "allSessionsRevoked": true } }
+- 5. Publish ApplicationEvent for security monitoring (F-005 audit log)
`

### 8.3 Pseudocode

`java
public String refreshAccessToken(String refreshTokenValue, String sessionId, UUID userId) {
    // 1. Hash the presented refresh token
    String presentedHash = hashRefreshToken(refreshTokenValue);

    // 2. Find session by hash
    Optional<JwtSession> sessionOpt = sessionService.findByRefreshTokenHash(presentedHash);

    if (sessionOpt.isEmpty()) {
        throw new TokenInvalidException("Refresh token not found");
    }

    JwtSession session = sessionOpt.get();

    // 3. Check for reuse
    if (session.getIsRevoked()) {
        // BR-274-04: Reuse detected - revoke all sessions
        sessionService.revokeAllSessionsByUserId(userId, "SUSPICIOUS_REUSE", null);
        tokenService.invalidateRevocationCache();
        throw new RefreshTokenReuseException("Token reuse detected - all sessions revoked");
    }

    // 4. Normal refresh: update lastUsed, create new access token
    sessionService.touchSession(session);

    // Get user current roles + permissions from DB (may have changed since login)
    User user = userRepository.findById(userId).orElseThrow();
    List<String> roles = roleService.getRoleCodesForUser(userId);
    List<String> permissions = permissionService.getPermissionsForRoles(roles);

    // Create new access token with updated claims
    String newAccessToken = tokenService.createAccessToken(userId, roles, permissions, sessionId);

    // Log the refresh event
    logRefreshEvent(session, userId);

    return newAccessToken;
}
`

### 8.4 Anti-Reuse Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| Token replay after logout | Revocation cache + DB check on every token validation |
| Stolen token reuse | Revoke-all on detection; attacker token becomes invalid |
| Concurrent session isolation | Each session has unique sessionId + jti; revoke-one does not affect others |
| Cache staleness | 5-minute TTL forces periodic DB check (worst-case: 5 min window for stale cache) |
| Key rotation impact | invalidateAll() on cache forces all old tokens to hit DB -> revoked if key changed |

---

## 9. Implementation Phasing

### Phase 1: Entities + Repositories (1-2 days)
- [ ] JwtSession.java entity with all indexes
- [ ] JwtTokenRevocation.java entity with all indexes
- [ ] JwtSigningKey.java entity
- [ ] JwtSessionRepository.java - custom queries (findActiveByUserId, findBySessionId)
- [ ] JwtTokenRevocationRepository.java - hasRecentSuspiciousRevocation(userId, Duration)
- [ ] JwtSigningKeyRepository.java - findActiveKey()
- [ ] Migration script / schema auto-create (Hibernate ddl-auto: update)

### Phase 2: Services (2-3 days)
- [ ] CacheConfig.java - Caffeine bean
- [ ] TokenService.java - all methods
- [ ] SessionService.java - CRUD + reuse detection
- [ ] TokenValidationService.java - cache + DB fallback
- [ ] TokenClaimsBuilder.java - fluent builder for JWT payload

### Phase 3: Security Filters (1-2 days)
- [ ] CookieRefreshTokenFilter.java - cookie extraction + auth delegation
- [ ] JwtAuthenticationFilter.java - rewritten (from existing JwtAuthFilter)
- [ ] SecurityConfig.java - augmented filter chain wiring

### Phase 4: Controllers + DTOs (1-2 days)
- [ ] AuthController.java - /api/auth/login, /api/auth/refresh, /api/auth/logout
- [ ] SessionAdminController.java - admin endpoints
- [ ] DTO classes (8 DTOs)
- [ ] Exception classes + global error handling

### Phase 5: Testing + Hardening (2-3 days)
- [ ] Unit tests for all services (UT-274-01 through UT-274-08)
- [ ] Integration tests (IT-274-01 through IT-274-09)
- [ ] E2E tests (E2E-274-01 through E2E-274-05)
- [ ] Performance benchmarks (JWT create <10ms, validate <5ms, refresh >1000 RPS)
- [ ] Security review: hash algorithm, CSRF strategy, key entropy

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing JwtUtil / JwtAuthFilter still referenced | Conflicting auth logic | Deprecate + remove after all callers migrated to new filters |
| Refresh token hash collision | Wrong session matched | SHA-512 hash space (2^512) makes collision probability negligible |
| Caffeine cache miss storm | DB spike on every request | Cache TTL 5 min + pre-warm on login; DB fallback query uses indexed columns |
| Cookie SameSite=Strict breaks cross-origin SPA | Login flow fails | Confirm CORS setup; fallback to SameSite=Lax if subdomain sharing needed |
| Refresh token theft via XSS | Full session hijack | HTTP-only + Secure flags prevent JS access; CSP headers recommended |
| Key entropy insufficient in dev | Weak signing key | JwtProperties.validate() enforces >=32 bytes; fail-fast on startup |

---

## 11. Dependency Injection Summary

`
SecurityConfig
+- CookieRefreshTokenFilter -> TokenService, SessionService, CookieConfig
+- JwtAuthenticationFilter  -> TokenService, UserRepository
+- SecurityFilterChain bean

AuthController
+- TokenService (login, refresh)
+- SessionService (logout, admin endpoints)
+- TokenValidationService (auth checks)

TokenService
+- JwtProperties (signing key)
+- RefreshTokenCache (Caffeine)
+- SessionService (session lookup for refresh)
+- UserRepository (load user for claims)
+- RoleRepository (load roles for claims)
+- PermissionRepository (load permissions for claims)

SessionService
+- JwtSessionRepository
+- JwtTokenRevocationRepository
+- UserRepository
+- RefreshTokenCache (invalidate on revoke)
`

---

## 12. Config Properties Reference

`yaml
jwt:
  secret:                                           # Existing - Base64 HMAC key
  expiration: 86400000                                           # Existing - fallback only
  access-token-expiry-seconds: 900                              # NEW - 15 minutes
  refresh-token-expiry-days: 7                                  # NEW - 7 days
  issuer: "hang-hai-auth-service"                               # NEW
  audience: "hang-hai-api"                                      # NEW
  algorithm: "HS256"                                            # NEW - Phase 1 only
  mock-token: mock-jwt-token-2026                               # Existing - dev mode

refresh-token:
  cookie-name: "refreshToken"                                   # NEW
  cookie-path: "/"                                              # NEW
  cookie-same-site: "Strict"                                    # NEW
  cookie-max-age: 604800                                        # NEW - 7 days

revocation-cache:
  maximum-size: 100000                                          # NEW
  ttl-minutes: 5                                                # NEW (BR-274-11)

logging:
  level:
    com.hanghai.kchtg.security: DEBUG                           # NEW - audit logging
`

---

## 13. Files to Create vs Modify

### New Files (24)

| # | File | Package | Purpose |
|---|------|---------|---------|
| 1 | entity/JwtSession.java | com.hanghai.kchtg.security.entity | Session entity |
| 2 | entity/JwtTokenRevocation.java | com.hanghai.kchtg.security.entity | Revocation audit entity |
| 3 | entity/JwtSigningKey.java | com.hanghai.kchtg.security.entity | Key management entity |
| 4 | repository/JwtSessionRepository.java | com.hanghai.kchtg.security.repository | Session CRUD |
| 5 | repository/JwtTokenRevocationRepository.java | com.hanghai.kchtg.security.repository | Revocation CRUD |
| 6 | repository/JwtSigningKeyRepository.java | com.hanghai.kchtg.security.repository | Key CRUD |
| 7 | service/TokenService.java | com.hanghai.kchtg.security.service | Token lifecycle |
| 8 | service/SessionService.java | com.hanghai.kchtg.security.service | Session CRUD |
| 9 | service/TokenValidationService.java | com.hanghai.kchtg.security.service | Cache+DB revocation |
| 10 | filter/CookieRefreshTokenFilter.java | com.hanghai.kchtg.security.filter | Cookie auth filter |
| 11 | filter/JwtAuthenticationFilter.java | com.hanghai.kchtg.security.filter | Bearer auth filter |
| 12 | config/CacheConfig.java | com.hanghai.kchtg.config | Caffeine cache bean |
| 13 | config/CookieConfig.java | com.hanghai.kchtg.security.config | Cookie constants |
| 14 | config/TokenClaimsBuilder.java | com.hanghai.kchtg.security.config | Fluent JWT builder |
| 15 | dto/LoginRequestDTO.java | com.hanghai.kchtg.security.dto | Login request |
| 16 | dto/LoginResponseDTO.java | com.hanghai.kchtg.security.dto | Login response |
| 17 | dto/RefreshResponseDTO.java | com.hanghai.kchtg.security.dto | Refresh response |
| 18 | dto/LogoutResponseDTO.java | com.hanghai.kchtg.security.dto | Logout response |
| 19 | dto/SessionListResponse.java | com.hanghai.kchtg.security.dto | Admin session list |
| 20 | dto/RevokeAllRequestDTO.java | com.hanghai.kchtg.security.dto | Admin revoke-all |
| 21 | dto/SigningKeyResponse.java | com.hanghai.kchtg.security.dto | Signing key info |
| 22 | exception/JwtExceptions.java | com.hanghai.kchtg.common.exception | Custom exceptions |
| 23 | controller/AuthController.java | com.hanghai.kchtg.user.controller | Auth endpoints |
| 24 | controller/SessionAdminController.java | com.hanghai.kchtg.user.controller | Admin endpoints |

### Modified Files (7)

| # | File | Changes |
|---|------|---------|
| 1 | config/SecurityConfig.java | Wire new filters, add permitAll endpoints, add @PreAuthorize for admin |
| 2 | security/JwtProperties.java | Add F-274 fields (access-token-expiry-seconds, etc.) |
| 3 | security/JwtUtil.java | Deprecate (no deletion - backward compat until all callers migrated) |
| 4 | security/JwtAuthFilter.java | Deprecate (replaced by new filter package) |
| 5 | common/exception/GlobalExceptionHandler.java | Add JWT-specific error handlers |
| 6 | user/dto/LoginResponse.java | Add cookie metadata fields (or replace with LoginResponseDTO) |
| 7 | pom.xml | Add caffeine dependency |

---

## 14. QA Gate Checklist

Before marking ready for review, verify:

- [ ] All 8 unit tests (UT-274-01 through UT-274-08) pass
- [ ] All 9 integration tests (IT-274-01 through IT-274-09) pass
- [ ] All 5 E2E tests (E2E-274-01 through E2E-274-05) pass
- [ ] Performance: JWT create <10ms p99, validate <5ms p99, refresh >1000 RPS
- [ ] Cache hit ratio >95% under load
- [ ] No sensitive data in JWT payload (no password, email, TOTP secret)
- [ ] Refresh token stored as hash+salt, never plaintext in DB
- [ ] Cookie flags: httpOnly=true, secure=true, sameSite=Strict
- [ ] Signing key from env var, validated at startup
- [ ] HS256 algorithm enforced (no algorithm confusion)
- [ ] Revocation cache TTL = 5 minutes (BR-274-11)
- [ ] Reuse detection triggers revoke-all (BR-274-04)
- [ ] Audit log entries created for all revocations
