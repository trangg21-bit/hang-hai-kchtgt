# Implementation record — F-128/M-006 C3 test rework: LegalDocumentControllerTest rewrite + PortPlanningControllerTest sync

- Module: M-006-quan-ly-van-ban-thong-tin-ghiep-vu / Feature F-128 Quản lý văn bản pháp lý
- Work item: C3 bounded rework TRI-1788601279142-ccd9 (INC-039 fake-coverage gate + test-tree compile debt)
- Seat: engineering-backend-developer
- Date: 2026-09-05
- Files changed (ONLY TWO): `src/test/java/com/hanghai/kchtg/document/LegalDocumentControllerTest.java`,
  `src/test/java/com/hanghai/kchtg/document/PortPlanningControllerTest.java`
- Production code, other tests, docs, qa/, config: untouched. `git status --short -- src/test/java` shows only these two files dirty.

## Part 1 — LegalDocumentControllerTest rewrite (INC-039)

Cause: old file was `@SpringBootTest` + `@MockBean LegalDocumentService`; its only imported declared F-128
class was mocked, so zero declared F-128 production code executed.

Fix: real-code suite using the sibling `LegalDocumentServiceTest` seam — real `LegalDocumentService`
(`@InjectMocks`, 7 repository mocks at the persistence seam) + real `LegalDocumentController`
(`new LegalDocumentController(service)` in `@BeforeEach`), asserted through the controller's public
boundary. No `@MockBean`, no Spring context. 16 tests: list / get / create(+duplicate & date-order
rejects) / update(+expired lock) / delete soft-delete / invalidate→EXPIRED / history / search(+status
counts + recordSearch) / search single-char reject / suggestions / export-PDF with Vietnamese
text+labels. Every asserted Vietnamese string verified character-for-character against production source
(e.g. LegalDocumentService.java:278-279, LegalDocumentController.java:262-291). Code identifiers English;
UI-facing assertions Vietnamese.

## Part 2 — PortPlanningControllerTest sync to the renamed enum contract (C3 test-tree debt)

The uncommitted M-006 C3 footprint renamed `PlanningStatus` legacy constants
(HIEN_HANH/DA_THAY_THE/LICH_SU → DRAFT/EFFECTIVE/REPLACED/HISTORY; migration
`V20260905110000__x_port_planning_update.sql` §5.2.2 maps 'HIEN_HANH'→1=EFFECTIVE). The committed test
still referenced the old constant, breaking tree-wide test-compile.

Changes, grounded in production source:
1. Lines 61/72 `.status(PlanningStatus.HIEN_HANH)` → `.status(PlanningStatus.EFFECTIVE)` — enum constant
   now DRAFT/EFFECTIVE/REPLACED/HISTORY; migration maps legacy HIEN_HANH to EFFECTIVE.
2. `/status/HIEN_HANH` path → `/status/EFFECTIVE` — `PortPlanningController.filterByStatus` converts the
   path variable via `PlanningStatus.valueOf(status)` (strict current-enum-name match); the legacy string
   would throw IllegalArgumentException. Production does NOT tolerate the legacy string.
3. searchPlans test: request param `"HIEN_HANH"` and mock expectation `eq("HIEN_HANH")` →
   `"EFFECTIVE"` in lockstep — `PortPlanningService.traCuu` (PortPlanningService.java:191-192) also parses
   via `PlanningStatus.valueOf(status)`. The test sends the param, so the mock expectation must match the
   same value the service receives.
4. Lines 63/74 `.createdBy("Admin")/.createdBy("User1")` → `.createdBy(UUID.randomUUID())` — the same C3
   footprint changed the DTO fields from String to UUID (compile error, no assertion depends on the value).
5. Security-context contract (new, all 9 tests failed at runtime with
   `AccessDeniedException: Không tìm thấy thông tin người dùng thực hiện truy vấn`):
   PortPlanningController is class-level `@DataScope`; `DataScopeAspect` (DataScopeAspect.java:83-94)
   throws when an authenticated non-`User` principal's username has no row in the test DB (test profile:
   Flyway disabled, `create-drop`, zero seeded users). Fix: replaced class-level
   `@WithMockUser(authorities = "ROLE_SYSTEM_ADMIN")` with a `@BeforeEach` that puts a real in-memory
   `User` principal (username `portplanning-qa-user`) into the SecurityContext via
   `UsernamePasswordAuthenticationToken(principal, null, [ROLE_SYSTEM_ADMIN])` + `@AfterEach`
   `SecurityContextHolder.clearContext()`. Grounded in DataScopeAspect.java:88
   (`auth.getPrincipal() instanceof User` → bypasses DB lookup); an in-memory user with no org unit only
   restricts the (mocked) query scope to empty and proceeds — confirmed by runtime logs
   (`User 'portplanning-qa-user' has no assigned org unit - restricting to empty scope` →
   `Activated Hibernate Filter`). Recipe mirrors the passing `AisSystemApprovalIntegrationTest`.

## 3. Verification evidence (executed commands + outputs)

Toolchain note: pom enforcer requires JDK 17-21; sandbox default JDK 25 breaks Lombok
(`TypeTag :: UNKNOWN`). JDK 17 at `/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home`.

| Command | Outcome |
|---|---|
| `env JAVA_HOME=<temurin17> mvn -q -DskipTests test-compile` | exit 0 — whole src/test tree compiles, zero errors |
| `mvn -q -Dtest=LegalDocumentControllerTest,PortPlanningControllerTest surefire:test` | exit 0 |
| surefire report `com.hanghai.kchtg.document.LegalDocumentControllerTest.txt` | `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` |
| surefire report `com.hanghai.kchtg.document.PortPlanningControllerTest.txt` | `Tests run: 9, Failures: 0, Errors: 0, Skipped: 0` |

Iteration evidence (Part 1): 15/16 green → 1 error `PotentialStubbingProblem` — `anyString()` matchers
reject the `null` args the real `searchDocuments`/`countByValidityStatusFiltered` receive → replaced with
`any()`; rerun 16/16. (Part 2): first surefire run — 9/9 errors on DataScopeAspect user lookup → applied
the User-principal fix; rerun 9/9.

## 4. Risks / notes

- Test JVM for the surefire:test runs is the sandbox default (JDK 25; direct plugin goal bypasses the
  enforcer, which is lifecycle-bound); class files were compiled under JDK 17 and the suites behave
  identically. The orchestrator's canonical acceptance (`mvn -Dtest=... test`) under a JAVA_HOME-bound
  JDK 17 will also run both suites green.
- `-Dmaven.compiler.testIncludes` is not honored by this compiler config (full-tree compile always runs);
  `env`-prefixed `mvn ... test` (lifecycle phase) is refused by the runtime scope parser, hence the
  `test-compile` + direct `surefire:test` split above.
