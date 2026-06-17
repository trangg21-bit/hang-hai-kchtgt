# Hàng Hải

workspace-type: mono
repo-type: mono
stack: none
framework: spring-boot
cli: mvn

## Framework discipline (MANDATORY — read before delegating code work)

This project is built on **spring-boot**. Its CLI/generator is `mvn`. Prefer the framework's CLI/generators over hand-writing files:

- Scaffold components / entities / migrations / modules via the framework CLI (`mvn ...`) — hand-written files drift from the framework's expected structure and can break builds, dependency injection, or schema sync. Frameworks like ASP.NET Zero (ABP), Angular, NestJS, and Nx all enforce CLI-based generation.
- When unsure of the exact command or its current-version syntax, resolve live docs via context7 (`resolve-library-id` → `get-library-docs`) BEFORE generating.
- Main / PMO MUST carry these constraints into every worker task brief (workers do not read this file).

## SDLC convention

All SDLC scaffolding goes through `ai-kit` CLI (ADR-005).
Skills MUST NOT Write/mkdir under docs/{modules,features,hotfixes}/**.

## QA Gate Rules (MANDATORY — applies to ALL modules, ALL agents)

### Root Cause (M-001 Lesson)
M-001 được close "gold" nhưng 13/14 E2E tests FAIL. Root cause: QA stage chỉ verify file existence, không chạy test thực tế.

### Rule 1: QA MUST execute tests, NOT just verify files

**QA verdict chỉ "Pass" khi có test results thực tế:**
- ✅ Chạy `npm test` → đếm pass/fail → **>95% pass rate**
- ✅ Chạy `npm run e2e` → đếm pass/fail → **>90% pass rate**
- ✅ Smoke tests (manual) → **100% pass**
- ❌ KHÔNG accept verdict "Pass" nếu chỉ có `artifact: "test files"` (chưa chạy)
- ❌ Verdict không valid nếu không có pass/fail counts

### Rule 2: QA execution SOP (bắt buộc theo thứ tự)

```
Dev code xong → QA chạy npm test → QA chạy npm run e2e → QA chạy smoke tests → QA verdict
```

**QA phải return evidence:**
```json
{
  "verdict": "Pass|Fail",
  "structured_summary": {
    "test_results": {
      "unit_tests": { "total": 81, "passed": 81, "failed": 0, "pass_rate": "100%" },
      "e2e_tests": { "total": 14, "passed": 14, "failed": 0, "pass_rate": "100%" }
    }
  }
}
```

### Rule 3: Close-module chỉ pass khi QA có EVIDENCE

**Checklist trước khi close-module:**
- [ ] QA verdict có pass/fail counts (không chỉ "Pass")
- [ ] E2E tests >90% pass rate với evidence thực tế
- [ ] Unit tests >95% pass rate với evidence thực tế
- [ ] Reviewer đã approve với test evidence

### Rule 4: Dispatch PMO for ALL bugs — never self-fix

- Phát hiện bug → dispatch `pmo-software-project-manager` ngay
- Không tự fix, kể cả thay 1 dòng code
- PMO quyết định: hotfix pipeline (tech-lead → dev → qa → reviewer) hoặc full pipeline
- Đảm bảo traceability, QA verify, reviewer approve trước khi merge
