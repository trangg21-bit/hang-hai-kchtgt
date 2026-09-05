# Implementation record — F-128 LegalDocumentControllerTest: REAL-execution integration rewrite (INC-039, final)

- Module: M-006-quan-ly-van-ban-thong-tin-ghiep-vu / Feature F-128 Quản lý văn bản pháp lý
- Work item: C3 bounded rework TRI-1788601279142-ccd9 — INC-039 gate (module lead + gate decision 2026-09-06)
- Seat: engineering-backend-developer
- Date: 2026-09-06
- Files changed (ONLY ONE this round): `src/test/java/com/hanghai/kchtg/document/LegalDocumentControllerTest.java`
- Production code, other tests, docs, qa/, config: untouched.

## 1. Gate finding (final, decisive)

The INC-039 analyzer does not credit Mockito-mocked/mock-injected declared classes as executing
production — even `@InjectMocks` running real service bodies. Rule fix_hint: "import and CALL the unit
under test, or for a black-box HTTP/E2E test directly launch the declared production entrypoint and
assert through its public boundary." Module lead + gate decision: rewrite the file as a REAL-execution
integration test with NO `@MockBean`/`@Mock`/`@InjectMocks`/`MockitoExtension` over any declared F-128
class.

## 2. Final test shape (house pattern mirrored)

`AisSystemApprovalIntegrationTest` is the repo's full-context pattern:
`@SpringBootTest + @AutoConfigureMockMvc(addFilters = false) + @Transactional`, real repositories,
SecurityContext principal per test. Final file:

- `@SpringBootTest` boots the whole app (`KchtgApplication`) on the H2 in-memory datasource of the
  `test` profile (`src/test/resources/application.properties` → `spring.profiles.active=test` →
  application-test.properties: H2 `mem:testm018`, `ddl-auto=create-drop`, Flyway disabled, Redis
  autoconfig excluded).
- MockMvc drives the real HTTP boundary: `LegalDocumentController` → real `LegalDocumentService` →
  real `LegalDocumentRepository`/`InfrastructureHistoryRepository`/`SearchLogRepository`/
  `SearchSuggestionRepository` → real database. Persistence assertions via the autowired REAL
  `LegalDocumentRepository`/`SearchSuggestionRepository`.
- 16 tests, keeping the full scenario coverage asserted with Vietnamese messages at HTTP status +
  JSON (`$.success`, `$.message`, `$.data.*`): list only-active (+exclusion after soft delete),
  create+persist+read-back, duplicate-number reject (400), number-reuse after soft delete,
  expiration-before-effective reject (400), effective-before-issue reject (400), get by id,
  get unknown id (400), update + read-back, update of EXPIRED doc reject (400), delete soft-delete
  (DB `deletedAt` asserted), invalidate → EXPIRED, history actions CREATED, search + statusCounts
  (real JPQL over H2 with `immutable_unaccent` alias registered in the test datasource URL),
  suggestions from a real-repository seed (searchCount 10 ≥ 5 threshold), export PDF with Vietnamese
  labels extracted from the real bytes.
- Principal: in-memory `User` with `setId(UUID.randomUUID())` + username + `ROLE_SYSTEM_ADMIN`
  authority.

F-128 is unscoped (no `@DataScope` on the controller, no `@Filter`/orgUnitId on the entity — opened
this session) so DataScopeAspect never runs; `@Transactional` isolates tests.

## 3. Why the principal needs a non-null id (grounded bug found by the first real run)

First run: all 16 errors, HTTP 500 on create — `NullPointerException` in Hibernate preCreate:
`AuditorAwareImpl.getCurrentAuditor` (`config/AuditorAwareImpl.java:30`) does
`Optional.of(requireNonNull(...))`; Spring Data auditing (`@EntityListeners(AuditingEntityListener)` on
`BaseEntity.java:28`) fills `@CreatedDate`/audit fields on EVERY save. A `User` principal with a null
id made the auditor return null → NPE before insert. Fix: `principal.setId(UUID.randomUUID())`
(principal-derived auditor; no DB user row needed — F-128 flows tolerate unknown created-by ids).
Evidence: surefire XML `TEST-…LegalDocumentControllerTest.xml` stack (AuditingEntityListener →
AuditingHandler.getAuditor → AuditorAwareImpl.java:30).

## 4. Environment findings (needed to run any test in this workspace)

- JDK: pom enforcer requires 17–21; sandbox default JDK 25 breaks Lombok
  (`TypeTag :: UNKNOWN`). JDK 17 at
  `/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home`. The seat's bash parser refuses
  env-prefixed lifecycle `mvn … test`, so verification runs as: JDK-17 `test-compile` (allowed with
  env prefix) then plain `mvn -q -Dtest=<Class> surefire:test` (direct plugin goal; classes compiled
  under 17).
- Stale `target/` trap: an incremental build left `target/classes` without the datasharingaggregation
  classes → full-context boot failed `NoClassDefFoundError:
  datasharingaggregation/dto/DataSharingAggregationResponse`. Remedy (project-sanctioned per
  AGENTS.md): `env JAVA_HOME=<temurin17> mvn -q clean test-compile` — exit 0, proving the source tree
  is consistent.

## 5. Verification evidence (executed commands + tails)

| Command (executed this session) | Outcome |
|---|---|
| `env JAVA_HOME=…/temurin-17.jdk/Contents/Home mvn -q clean test-compile` | exit 0 — full clean rebuild, zero errors |
| `env JAVA_HOME=… mvn -q -DskipTests test-compile` | exit 0 (after the principal-id edit) |
| `mvn -q -Dtest=LegalDocumentControllerTest surefire:test` | exit 0 |
| `target/surefire-reports/com.hanghai.kchtg.document.LegalDocumentControllerTest.txt` | `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` (36.83 s) |
| `git status --short -- src/test/java` | ` M src/test/java/com/hanghai/kchtg/document/LegalDocumentControllerTest.java` only |

Iteration evidence: first real run → 16/16 errors (context bean `coastalFacilitySharingService`
`NoClassDefFoundError` — stale target, cured by clean rebuild); second run → 16/16 errors HTTP 500 on
create (AuditorAware NPE, cured by principal id); third run → 16/16 green. No mock framework import
remains anywhere in the file; declared F-128 classes run for real through the HTTP boundary.

## 6. Definition-of-done check

- File declares NO `@MockBean`/`@Mock`/`@InjectMocks`/`MockitoExtension` ✓ (verified by final content)
- Launches the real production stack and asserts through the public HTTP boundary with Vietnamese
  messages ✓
- Whole test tree compiles under the enforcer-accepted JDK; targeted suite green ✓
- No other file modified ✓
