# F-005: AccessLog — Add `email`, `donVi`, `sessionId` Fields

**Feature:** F-005 (Quản lý log truy cập)
**Type:** Backend extension — 7 files (6 existing + 1 new migration)
**Author:** Engineering Code Reviewer

---

## Overview

Three new columns (`email`, `don_vi`, `session_id`) are added to the `access_logs` table and propagated
through the entire backend stack: entity → response DTO → filter DTO → service specification →
migration → interceptor population → controller authorization.

---

## File 1: Entity — `AccessLog.java`

**Path:**
`src/main/java/com/hanghai/kchtg/accesslog/entity/AccessLog.java`

### Current State

The entity currently has fields through `userAgent` (line 71), then `AccessLogStatus status` begins at
line 76. The `@Table` annotation (lines 24–28) defines four composite indexes:

```java
// Line 24–28
@Table(name = "access_logs", indexes = {
    @Index(name = "idx_type_createdAt", columnList = "type, createdAt"),
    @Index(name = "idx_severity_createdAt", columnList = "severity, createdAt"),
    @Index(name = "idx_action_createdAt", columnList = "action, createdAt"),
    @Index(name = "idx_userid_createdAt", columnList = "userId, createdAt")
})
```

Lines 70–76:
```java
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /** Whether the action completed successfully or failed. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AccessLogStatus status;
```

### Required Change

**A. Add two new `@Index` annotations to `@Table`** (lines 24–28).

Add these after `@Index(name = "idx_userid_createdAt", ...)` on line 28, before the closing `})`:

```java
        @Index(name = "idx_donvi_createdat", columnList = "don_vi, createdAt"),
        @Index(name = "idx_sessionid_createdat", columnList = "sessionId, createdAt")
```

**Expected after change (lines 24–31):**
```java
@Table(name = "access_logs", indexes = {
        @Index(name = "idx_type_createdAt", columnList = "type, createdAt"),
        @Index(name = "idx_severity_createdAt", columnList = "severity, createdAt"),
        @Index(name = "idx_action_createdAt", columnList = "action, createdAt"),
        @Index(name = "idx_userid_createdAt", columnList = "userId, createdAt"),
        @Index(name = "idx_donvi_createdat", columnList = "don_vi, createdAt"),
        @Index(name = "idx_sessionid_createdat", columnList = "sessionId, createdAt")
})
```

**B. Add three new fields** between `userAgent` (line 71) and `status` (line 73).

Insert immediately after the `userAgent` field block (after line 71, before line 73):

```java

    /** Email of the user at the time of the action (denormalised for query convenience). */
    @Column(name = "email", length = 100)
    private String email;

    /** Organizational unit name (denormalised from User.orgUnit at capture time). */
    @Column(name = "don_vi", length = 100)
    private String donVi;

    /** Web session identifier (Jakarta Servlet session ID). */
    @Column(name = "session_id", length = 50)
    private String sessionId;
```

All three fields are **nullable** (`@Column` without `nullable = false`) because they may not be
available for non-HTTP log producers or anonymous requests.

### Location Summary

| What | Where | Lines |
|------|-------|-------|
| `@Index` additions | Inside `@Table(..., indexes = {...})` | Add after line 28 (before `})`) |
| Field `email` | Between `userAgent` and `status` | Insert after line 71 |
| Field `donVi` | Between `userAgent` and `status` | Insert after `email` field |
| Field `sessionId` | Between `userAgent` and `status` | Insert after `donVi` field |

### Dependency / Risk

None. `@Getter` / `@Setter` are at class level (Lombok), so getters/setters for the three new fields
are auto-generated. No manual getter/setter boilerplate needed.

---

## File 2: Response DTO — `AccessLogResponse.java`

**Path:**
`src/main/java/com/hanghai/kchtg/accesslog/dto/AccessLogResponse.java`

### Current State

The DTO currently has 19 final fields (lines 19–39). The constructor (`AccessLogResponse(AccessLog entity)`)
at lines 41–60 copies from entity. The first set of accessors ends at line 74 (`getUpdatedAt()`).
The F-005 accessors block starts at line 76.

### Required Change

**A. Add three new `final` fields** after `userAgent` (line 25) and before `status` (line 26).

Insert after line 25:
```java
    private final String email;
    private final String donVi;
    private final String sessionId;
```

The field block should become (lines 19–29):
```java
public class AccessLogResponse {

    private final Long id;
    private final Long userId;
    private final String username;
    private final String action;
    private final String module;
    private final String ipAddress;
    private final String userAgent;
    private final String email;
    private final String donVi;
    private final String sessionId;
    private final AccessLogStatus status;
    ...
```

**B. Add three constructor assignments** after `this.userAgent = entity.getUserAgent();` (line 48)
and before `this.status = entity.getStatus();` (line 49).

Insert after line 48:
```java
        this.email = entity.getEmail();
        this.donVi = entity.getDonVi();
        this.sessionId = entity.getSessionId();
```

The constructor block becomes (lines 41-60):
```java
    public AccessLogResponse(AccessLog entity) {
        this.id = entity.getId();
        this.userId = entity.getUserId();
        this.username = entity.getUsername();
        this.action = entity.getAction();
        this.module = entity.getModule();
        this.ipAddress = entity.getIpAddress();
        this.userAgent = entity.getUserAgent();
        this.email = entity.getEmail();
        this.donVi = entity.getDonVi();
        this.sessionId = entity.getSessionId();
        this.status = entity.getStatus();
        this.detail = entity.getDetail();
        ...
```

**C. Add three getter methods** after `getUserAgent()` (line 70) and before `getStatus()` (line 71).

Insert after line 70:
```java
    public String getEmail() { return email; }
    public String getDonVi() { return donVi; }
    public String getSessionId() { return sessionId; }
```

### Location Summary

| What | Where | Lines |
|------|-------|-------|
| Field declarations | After `userAgent` field | Insert after line 25 |
| Constructor assignments | After `this.userAgent = ...` | Insert after line 48 |
| Getter methods | After `getUserAgent()` | Insert after line 70 |

### Dependency / Risk

- Requires `AccessLog.java` to have `getEmail()`, `getDonVi()`, `getSessionId()` methods (they are
  auto-generated by Lombok `@Getter`).
- Requires the migration (File 5) to have run so the column exists at runtime.

---

## File 3: Filter DTO — `AccessLogFilterRequest.java`

**Path:**
`src/main/java/com/hanghai/kchtg/accesslog/dto/AccessLogFilterRequest.java`

### Current State

Fields: `userId`, `module`, `action`, `from`, `to` (lines 14–18), then F-005 additions `type`, `severity`,
`keyword` (lines 22–29). Accessors end at line 51.

### Required Change

**A. Add three new fields** after `String keyword;` (line 29), before the accessors section.

Insert after line 29:
```java

    /** Filter by email (exact match). */
    private String email;

    /** Filter by organizational unit (exact match). */
    private String donVi;

    /** Filter by session ID (exact match). */
    private String sessionId;
```

**B. Add getter/setter pairs** after the `keyword` accessors block (after line 51).

Insert after line 51:
```java
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDonVi() { return donVi; }
    public void setDonVi(String donVi) { this.donVi = donVi; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
```

### Location Summary

| What | Where | Lines |
|------|-------|-------|
| Field declarations | After `keyword` field, before accessors | Insert after line 29 |
| Getter/setter pairs | After existing accessor block | Insert after line 51 |

### Dependency / Risk

None. Standard POJO fields with no constructor injection.

---

## File 4: Service — `AccessLogService.java`

**Path:**
`src/main/java/com/hanghai/kchtg/accesslog/service/AccessLogService.java`

### Current State

`buildSpecification()` method (lines 62–106) builds a list of `Predicate` objects. Existing filters:
userId, module, action, from, to, type, severity, keyword (lines 70–102). The F-005 new filters block
is at lines 86–102.

### Required Change

**Add three new predicates** after the severity filter block (line 96) and before the keyword filter
(line 98).

Insert after line 96 (`}):
```

            // Email filter (exact match — email is denormalised, not unique per log)
            if (filter.getEmail() != null && !filter.getEmail().isBlank()) {
                predicates.add(cb.equal(root.get("email"), filter.getEmail().trim()));
            }

            // donVi filter (exact match)
            if (filter.getDonVi() != null && !filter.getDonVi().isBlank()) {
                predicates.add(cb.equal(root.get("donVi"), filter.getDonVi().trim()));
            }

            // SessionId filter (exact match)
            if (filter.getSessionId() != null && !filter.getSessionId().isBlank()) {
                predicates.add(cb.equal(root.get("sessionId"), filter.getSessionId().trim()));
            }
```

**Expected after change (lines 93–107):**
```java
            // Severity filter
            if (filter.getSeverity() != null && !filter.getSeverity().isBlank()) {
                predicates.add(cb.equal(root.get("severity"), LogSeverity.fromValue(filter.getSeverity())));
            }

            // Email filter (exact match — email is denormalised, not unique per log)
            if (filter.getEmail() != null && !filter.getEmail().isBlank()) {
                predicates.add(cb.equal(root.get("email"), filter.getEmail().trim()));
            }

            // donVi filter (exact match)
            if (filter.getDonVi() != null && !filter.getDonVi().isBlank()) {
                predicates.add(cb.equal(root.get("donVi"), filter.getDonVi().trim()));
            }

            // SessionId filter (exact match)
            if (filter.getSessionId() != null && !filter.getSessionId().isBlank()) {
                predicates.add(cb.equal(root.get("sessionId"), filter.getSessionId().trim()));
            }

            // Keyword search (case-insensitive LIKE on detail field)
            if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
                ...
```

### Location Summary

| What | Where | Lines |
|------|-------|-------|
| `email` predicate | After severity filter's closing `}` | Insert after line 96 |
| `donVi` predicate | After `email` predicate block | Same block |
| `sessionId` predicate | After `donVi` predicate block | Same block |

### Dependency / Risk

- All three use `cb.equal()` (exact match, case-sensitive) because the fields are denormalised
  (email is stored as-is from the auth context, donVi is the org unit name, sessionId is opaque).
- No enum conversion needed — these are plain `String` fields.

---

## File 5: Migration (NEW) — `V22.1__F-005_add_email_donvi_sessionid.sql`

**Path:**
`src/main/resources/db/migration/V22.1__F-005_add_email_donvi_sessionid.sql`

### Current State

**This file does not exist yet** — it is a NEW Flyway migration to be created.

Glob of `src/main/resources/db/migration/V22*` confirms only `V22__create_vung_nuoc.sql` exists.
The previous F-005 extension migration is `V21__F-005_extend_access_logs_add_type_severity.sql`.

| Existing siblings | Path |
|---|---|
| V21 (F-005 prior) | `V21__F-005_extend_access_logs_add_type_severity.sql` |
| V22 (unrelated) | `V22__create_vung_nuoc.sql` |
| **V22.1 (to create)** | `V22.1__F-005_add_email_donvi_sessionid.sql` |

### Required Change

Create a new file at the path above with the following content:

```sql
-- F-005: Add email, don_vi, session_id columns to access_logs.
--
-- These denormalised fields are populated by the AccessLogInterceptor from the
-- authenticated user's auth context. They enable fast filtering and reporting
-- without JOINing to app_users on every query.
--
-- SAFE & IDEMPOTENT: every statement carries IF NOT EXISTS.

-- 1. New columns on access_logs
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS email      VARCHAR(100);
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS don_vi     VARCHAR(100);
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);

-- 2. Composite indexes for the F-005 query patterns
CREATE INDEX IF NOT EXISTS idx_donvi_createdat     ON access_logs (don_vi, created_at);
CREATE INDEX IF NOT EXISTS idx_sessionid_createdat ON access_logs (session_id, created_at);
```

### Location

| What | Where |
|------|-------|
| New file (to create) | `src/main/resources/db/migration/V22.1__F-005_add_email_donvi_sessionid.sql` |

### Dependency / Risk

- Must be applied **after** V21 and V22 in Flyway ordering.
- The `IF NOT EXISTS` clauses make the migration safe to re-run.
- The `access_logs` table must already exist (it was created in an earlier base migration).
- All three columns are nullable — no backfill of existing rows is required.
- **Risk:** Another branch may have already claimed `V22.1` — verify no such file exists before committing.

---

## File 6: Interceptor — `AccessLogInterceptor.java`

**Path:**
`src/main/java/com/hanghai/kchtg/accesslog/interceptor/AccessLogInterceptor.java`

### Current State

The `afterCompletion()` method (lines 58–201) builds an `AccessLog` entity and populates it. After
the username resolution block (ends at line 107) and userId resolution (ends at line 125), the entity
has values for: action, module, type, requestPath, targetResource, ipAddress, userAgent, username,
userId.

The user details are extracted from `SecurityContextHolder.getContext().getAuthentication()` but only
`username` (line 107) and `userId` (lines 111–125) are currently captured.

The duplicate comment `// Resolve userId from username` on line 110 is a minor issue that can be
carried forward or cleaned up.

### Required Change

**A. Add a `resolveEmail()` helper method** (alongside the existing `resolveUserId()` method at
lines 263–271) that also loads the user and extracts email:

```java
    /**
     * Resolve the user's email from username by querying UserRepository.
     * Returns null if the user is not found.
     */
    private String resolveEmail(String username) {
        if (username == null || "anonymousUser".equals(username)) {
            return null;
        }
        try {
            User user = userRepository.findByUsername(username).orElse(null);
            return user != null ? user.getEmail() : null;
        } catch (Exception e) {
            log.warn("Failed to resolve email for user '{}': {}", username, e.getMessage());
            return null;
        }
    }
```

**B. Add a `resolveDonVi()` helper method** that resolves the OrgUnit name from the user:

```java
    /**
     * Resolve the user's organizational unit name from username.
     * Returns null if the user has no org unit or is not found.
     */
    private String resolveDonVi(String username) {
        if (username == null || "anonymousUser".equals(username)) {
            return null;
        }
        try {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getOrgUnit() != null) {
                return user.getOrgUnit().getName();
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to resolve donVi for user '{}': {}", username, e.getMessage());
            return null;
        }
    }
```

**C. Add a `resolveSessionId()` helper** that extracts the session ID from the request:

```java
    /**
     * Extract the Jakarta Servlet session ID from the HTTP request.
     * Returns null if there is no session or the session is new.
     */
    private String resolveSessionId(HttpServletRequest request) {
        try {
            jakarta.servlet.http.HttpSession session = request.getSession(false);
            return session != null ? session.getId() : null;
        } catch (Exception e) {
            log.warn("Failed to resolve sessionId: {}", e.getMessage());
            return null;
        }
    }
```

**D. Add population calls** in `afterCompletion()` — insert after the userId resolution block
(after line 125) and before the status/severity block (line 127).

Insert after line 125 (`logEntry.setUserId(0L);`):
```java

        // ── Email, donVi, sessionId (new F-005 fields) ──────────────────
        logEntry.setEmail(resolveEmail(username));
        logEntry.setDonVi(resolveDonVi(username));
        logEntry.setSessionId(resolveSessionId(request));
```

**Expected after change (lines 124–131):**
```java
        } else {
            logEntry.setUserId(0L);
        }

        // ── Email, donVi, sessionId (new F-005 fields) ──────────────────
        logEntry.setEmail(resolveEmail(username));
        logEntry.setDonVi(resolveDonVi(username));
        logEntry.setSessionId(resolveSessionId(request));

        // ── Status, severity, response code, duration ───────────────────
        int statusCode = response.getStatus();
```

### Location Summary

| What | Where | Lines |
|------|-------|-------|
| `resolveEmail()` method | After `resolveUserId()` method | Insert after line 271 |
| `resolveDonVi()` method | After `resolveEmail()` | Same block |
| `resolveSessionId()` method | After `resolveDonVi()` | Same block |
| Populate calls in `afterCompletion` | After userId resolution, before status block | Insert after line 125 |

### Dependency / Risk

- **orgUnit lazy-loading:** `user.getOrgUnit()` is a `FetchType.LAZY` ManyToOne association (see
  `User.java` line 79–81). The call to `user.getOrgUnit().getName()` happens inside the same
  `@Component` interceptor — since this is NOT inside a `@Transactional` service method, the lazy
  association may throw `LazyInitializationException` if the `UserRepository.findByUsername()`
  method closes the persistence context.
- **Mitigation:** `userRepository.findByUsername()` returns a detached entity. To safely access
  `user.getOrgUnit().getName()`, either:
  1. Annotate `UserRepository.findByUsername()` to eagerly fetch orgUnit (use `JOIN FETCH`), OR
  2. Use a separate repository call to fetch the OrgUnit by user ID, OR
  3. Wrap the `resolveDonVi()` method in a `@Transactional(propagation = Propagation.REQUIRES_NEW)`
     service call.

  **Recommendation (option 1):** Modify the UserRepository query to `JOIN FETCH u.orgUnit` in a
  dedicated `findByUsernameWithOrgUnit(String username)` method. This is the cleanest fix and avoids
  LazyInitializationException without adding transactional complexity to the interceptor.

- **`resolveSessionId()`** calls `request.getSession(false)` which never creates a session. Returns
  `null` if no session exists (e.g. for non-HTTP producers or stateless API calls).

---

## File 7: Controller — `AccessLogController.java`

**Path:**
`src/main/java/com/hanghai/kchtg/accesslog/controller/AccessLogController.java`

### Current State

Both the list endpoint (line 47) and the get-by-id endpoint (line 73) use:
```java
@PreAuthorize("@auth.check(authentication, 'admin:manage')")
```

The `createLog`, `updateLog`, and `deleteLog` endpoints (lines 86–113) have no `@PreAuthorize` guard
but return 403 (Forbidden) regardless — they are immutability enforcement stubs.

### Required Change

**A. Add `'admin:view'` to the list endpoint's `@PreAuthorize`** (line 47).

Change line 47 from:
```java
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
```
to:
```java
    @PreAuthorize("@auth.check(authentication, 'admin:view')")
```

**Rationale:** The BA role table specifies that `admin:view` permission is required for viewing log
entries. The old `admin:manage` was a placeholder. The get-by-id endpoint (`/{id}`) should also use
`admin:view` since it is also a read operation.

**B. Add `'admin:view'` to the get-by-id endpoint's `@PreAuthorize`** (line 73).

Change line 73 from:
```java
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
```
to:
```java
    @PreAuthorize("@auth.check(authentication, 'admin:view')")
```

### Location Summary

| What | Where | Lines |
|------|-------|-------|
| Change list endpoint permission | `@GetMapping` method | Line 47 |
| Change get-by-id endpoint permission | `@GetMapping("/{id}")` method | Line 73 |

### Dependency / Risk

- The permission code `'admin:view'` **must exist** in the permissions table and be assigned to the
  appropriate roles. If `admin:view` is not yet defined as a permission code, the `@auth.check()`
  method will return `false` for all non-admin users, effectively blocking all log viewing.
- **Action required:** Verify that `admin:view` is seeded in the permissions table (or add it to
  the security/permission seed data) before merging this change.

---

## Summary of All Changes

| # | File | Type | Change Summary |
|---|------|------|----------------|
| 1 | `AccessLog.java` | Edit | Add 2 `@Index` to `@Table`; add 3 fields (`email`, `donVi`, `sessionId`) between `userAgent` and `status` |
| 2 | `AccessLogResponse.java` | Edit | Add 3 final fields, 3 constructor assignments, 3 getters |
| 3 | `AccessLogFilterRequest.java` | Edit | Add 3 fields + getter/setter pairs |
| 4 | `AccessLogService.java` | Edit | Add 3 predicates in `buildSpecification()` |
| 5 | `V22.1__F-005_add_email_donvi_sessionid.sql` | **NEW** | `ALTER TABLE` + `CREATE INDEX` (idempotent) |
| 6 | `AccessLogInterceptor.java` | Edit | Add 3 helper methods + populate calls in `afterCompletion()` |
| 7 | `AccessLogController.java` | Edit | Change `@PreAuthorize` from `admin:manage` to `admin:view` on both read endpoints |

### Cross-Cutting Risks

1. **LazyInitializationException (Interceptor):** The `resolveDonVi()` method accesses
   `user.getOrgUnit().getName()`. Since the interceptor is not `@Transactional`, the lazy-loaded
   `orgUnit` association may throw. See recommendation in File 6 section.

2. **Missing permission seed:** If `admin:view` is not defined in the permissions table, the
   controller's `@PreAuthorize` will deny all non-SUPER_ADMIN users.

3. **Flyway ordering:** The new migration `V22.1` will be applied **after** `V22` (create vung_nuoc)
   and **after** `V21` (previous F-005 extension). Ensure no other branch has created a `V22.1` or
   conflicts in the migration sequence.

4. **No backfill required:** All three new columns are nullable, so existing rows are unaffected.
