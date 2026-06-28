# QUALITY STANDARDS — GLOBAL STANDARD FOR HÀNG HẢI PROJECT

**Created:** 2026-06-17  
**Version:** 1.0  
**Scope:** TẤT CẢ modules (M-001, M-002, M-003, ...) — không có ngoại lệ  
**Status:** MANDATORY cho mọi pipeline, mọi agent, mọi session

---

## 1. ROOT CAUSE LESSON: QA PAPER VERIFICATION

### Incident M-001

M-001 được close với verdict **GOLD** (Approved by reviewer). Sau khi close, chạy E2E test:
- **13/14 E2E tests FAIL** (92.9% failure rate)
- 6 tests: duplicate table selectors (strict mode violation)
- 5 tests: missing button text labels
- 3 tests: login locator inconsistency

### Root Cause

QA stage chỉ **verify file existence**, KHÔNG **run actual tests**:

```yaml
# ❌ QA stage ĐÃ CHẠY (sai):
engineering-qa-engineer-wave-1:
  verdict: Ready for Reviewer
  artifact: "qa/qa-report.md + 16 test files"
  ← Chỉ kiểm tra file tồn tại, không chạy test
  ← Không đếm pass/fail
  ← Không xác nhận test thực sự pass
```

```yaml
# ✅ QA stage PHẢI CHẠY (đúng):
engineering-qa-engineer-wave:
  verdict: |
    - Chạy npm test → đếm pass/fail
    - Chạy npm run e2e → đếm pass/fail
    - Chỉ Pass nếu E2E >90% + Unit >95%
  artifact: |
    - Test results: 14/14 E2E pass
    - Test results: 81/81 Unit pass
    - Verdict dựa trên số liệu thực
```

### Tại sao module khác "ổn" còn M-001 "lỏng"?

Cùng pipeline template, nhưng:
- **Module khác ổn**: QA stage có verification gate (chạy test + đếm kết quả)
- **M-001 lỏng lẻo**: QA stage chỉ kiểm tra artifact (file tồn tại)

→ **Không phải bug của code, là bug của pipeline design.**

---

## 2. BUG/CR/HOTFIX HANDLING — GLOBAL PROCESS

### Rule: NEVER self-fix — ALWAYS dispatch PMO

```
Phát hiện bug/issue → Dispatch PMO ngay
                        ↓
                   PMO quyết định:
                  - Hotfix pipeline (tech-lead → dev → qa → reviewer)
                  - Full feature pipeline (ba → sa → tech-lead → dev → qa → reviewer)
```

**Chi tiết:**
- Phát hiện bug → dispatch `pmo-software-project-manager` ngay
- Không tự fix, kể cả thay 1 dòng code
- PMO quyết định: hotfix pipeline (tech-lead → dev → qa → reviewer) hoặc full pipeline (ba → sa → tech-lead → dev → qa → reviewer)
- Đảm bảo traceability, QA verify, reviewer approve trước khi merge

**Lý do:**
- Đảm bảo traceability (ai fix, khi nào, tại sao)
- QA verify mọi thay đổi
- Reviewer approve trước khi merge
- Không bỏ sót edge cases
- Audit trail đầy đủ

---

## 3. QA VERIFICATION — STANDARD OPERATING PROCEDURE

### QA Gate Requirements

**QA stage VERDICT chỉ valid khi có test results thực tế:**

| Gate | Required | Threshold | Verification |
|------|----------|-----------|-------------|
| **Unit Tests** | Chạy `npm test` | **>95% pass rate** | Đếm pass/fail |
| **E2E Tests** | Chạy `npm run e2e` | **>90% pass rate** | Đếm pass/fail |
| **Smoke Tests** | Chạy manual trên browser | **100% pass** | Screenshot evidence |
| **Code Review** | Reviewer approve | — | Verdict envelope từ reviewer |

**Verdict chỉ "Pass" nếu:**
- ✅ Tất cả gate trên đã pass
- ✅ Có test results (số liệu thực)
- ✅ Có screenshot/trace evidence (nếu có fail)

### QA Execution SOP (bắt buộc theo thứ tự)

```
Dev code xong → QA chạy npm test → QA chạy npm run e2e → QA chạy smoke tests → QA verdict → Reviewer approve
```

### QA Evidence Template

QA phải return evidence theo format:

```json
{
  "verdict": "Pass",
  "confidence": "high",
  "structured_summary": {
    "test_results": {
      "unit_tests": { "total": 81, "passed": 81, "failed": 0, "pass_rate": "100%" },
      "e2e_tests": { "total": 14, "passed": 14, "failed": 0, "pass_rate": "100%" },
      "smoke_tests": { "total": 5, "passed": 5, "failed": 0 }
    },
    "evidence_files": [
      "test-results/unit-test-report.html",
      "test-results/e2e-test-report.html",
      "docs/intel/screenshots/smoke-01-login.png"
    ]
  }
}
```

### QA Must NOT Return (M-001 pattern — STRICTLY FORBIDDEN)

```yaml
# ❌ BỊ LỖI — Paper verification:
qa-verdict: "Pass"
artifact: "qa/qa-report.md + 16 test files"
← Không có pass/fail counts
← Không chạy test thực tế
← Chỉ verify file existence
```

---

## 4. QA GATE DEFINITION (GLOBAL TEMPLATE — ALL MODULES)

**Áp dụng cho TẤT CẢ module (M-001, M-002, M-003, ...):**

```yaml
engineering-qa-engineer-wave:
  job: |
    - Run npm test → count pass/fail
    - Run npm run e2e → count pass/fail
    - Run smoke tests → count pass/fail
    - Generate test report with evidence
  verdict: |
    - IF E2E pass_rate >= 90% AND Unit pass_rate >= 95% → "Pass ✅"
    - ELSE → "Fail ❌" + report which tests failed
  gate: |
    - Pass IF: E2E >90% + Unit >95%
    - Fail IF: any critical test failed
```

**Không có ngoại lệ.** Đây là quy tắc bắt buộc cho mọi module trong dự án.

---

## 5. CLOSE-MODULE CHECKLIST (GLOBAL — ALL MODULES)

**Checklist trước khi close-module:**

```yaml
close-module-checklist:
  - [ ] QA verdict có pass/fail counts (không chỉ "Pass")
  - [ ] E2E tests đã chạy thực tế (>90% pass)
  - [ ] Unit tests đã chạy thực tế (>95% pass)
  - [ ] Reviewer đã approve với test evidence
  - [ ] Test evidence files tồn tại:
      - docs/intel/test-evidence/{F-NNN}.json
      - tests/e2e/{F-NNN}.spec.ts
      - docs/intel/screenshots/{F-NNN}-step-NN-{state}.png
```

---

## 6. E2E TEST FIX PATTERNS (REFERENCE)

### Pattern 1: Duplicate table selectors

```typescript
// ❌ OLD (fails — strict mode violation):
await expect(page.getByRole('table')).toBeVisible();

// ✅ NEW (unique-select):
await expect(page.getByRole('table')
  .filter({ hasText: /^Cột1Cột2Cột3/ }))
  .toBeVisible();
```

### Pattern 2: Missing button text labels

```typescript
// ❌ OLD (timeout):
await page.getByRole('button', { name: /thêm/i }).click();

// ✅ NEW (find actual label):
await page.getByRole('button', { name: /tạo mới|thêm mới|add/i }).click();
// Hoặc dùng icon selector:
await page.locator('.ant-btn-primary:has-text("Tạo")').click();
```

### Pattern 3: Login locator inconsistency

```typescript
// ❌ OLD (inconsistent):
await page.getByLabel('Tài Khoản').fill('admin');

// ✅ NEW (use placeholder like login.spec.ts):
await page.getByPlaceholder('Nhập tài khoản').fill('admin');
```

---

## 7. KEY TAKEAWAYS (MANDATORY RULES)

### Rule 1: QA Must Execute, Not Verify Files

**QA stage verdict chỉ valid khi có test results (pass/fail counts), không chỉ artifact existence.**

### Rule 2: Always Dispatch PMO for Bugs

**Phát hiện bug → dispatch PMO ngay. Không tự fix. PMO quyết định pipeline.**

### Rule 3: E2E Gate Before Close

**close-module chỉ pass nếu E2E >90% pass với evidence thực tế.**

### Rule 4: ai-kit-scaffold patchSummary Bug

**`ai-kit-scaffold` có bug mapping `patchSummary` → `patch_summary`. Workaround: dispatch PMO với context trực tiếp.**

---

**End of Quality Standards — Version 1.0**
