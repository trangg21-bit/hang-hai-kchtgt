# End-to-End Review: Quản lý đơn vị (Organization Unit Management)

**Date:** 2026-07-17  
**Scope:** `frontend/src/pages/organizations/`, `frontend/src/services/organizationService.ts`, `src/main/java/com/hanghai/kchtg/orgunit/**`  
**Reviewer:** PMO Orchestrator (manually reviewed all key files)

## Executive Summary

**Verdict: Changes-requested** — 2 critical runtime bugs, 5 medium gaps, 5 low issues.

---

## Critical Defects (must-fix)

### 🔴 DEF-01: Reject dialog shows literal `{org.name}` instead of actual name

**File:** `frontend/src/pages/organizations/UnitList.tsx:151`  
**Severity:** HIGH  
**Category:** String interpolation / Template literal bug

The `{org.name}` is inside a JSX string literal, not a JavaScript template literal. It renders as the literal text `{org.name}` on screen.

**Fix:** Use JSX expression: `Từ chối "{org.name}"?`

---

### 🔴 DEF-02: Reject comments always empty — variable captured by closure

**File:** `frontend/src/pages/organizations/UnitList.tsx:144-151`  
**Severity:** HIGH  
**Category:** React closure over mutable primitive

```tsx
let comments = '';
confirm({
  content: (<div>...<Input onChange={(e) => { comments = e.target.value; }} /></div>),
  onOk: async () => { await organizationService.reject(org.id, comments); }
});
```

`comments` is a string primitive. `onChange` creates a new string, but `onOk` captured the original `''`. Always sends empty comments.

**Fix:** Use `useRef`: `const commentsRef = useRef('');` → `commentsRef.current`

---

## Medium Issues (should-fix)

### 🟠 DEF-03: UnitForm.tsx missing `detailAddress` field

**File:** `frontend/src/pages/organizations/UnitForm.tsx:68-89`  
UnitForm loads detailAddress but has no form field and omits it from create/update payloads. Data lost on save.

### 🟠 DEF-04: Parent selector rule inconsistent

**File:** `UnitList.tsx:81` (`selectedType !== 'CUC'`) vs `UnitForm.tsx:68` (`values.type === 'TCT' ? undefined`)  
Different rules for when to show/clear parent. Standardize to one.

### 🟠 DEF-05: contactPhone mapped from item.phone

**File:** `frontend/src/services/organizationService.ts:112,169,253`  
`contactPhone: item.phone` should be `contactPhone: item.contactPhone ?? item.phone`

### 🟠 DEF-06: list() response omits detailAddress

**File:** `frontend/src/services/organizationService.ts:158-189`  
Both mapping passes in `list()` omit `detailAddress`.

### 🟠 DEF-07: Path computed before entity persisted

**File:** `src/main/java/com/hanghai/kchtg/orgunit/service/OrganizationService.java:218-220`  
`computePath(request.getParentId(), unit.getId())` called BEFORE `orgUnitRepo.save(unit)`. UUID may be null. Move after save.

---

## Low Issues (nice-to-fix)

| ID | File:Line | Issue |
|---|---|---|
| DEF-08 | `UnitList.tsx:144` | `searchResults` useMemo misses `filterStatus` in deps |
| DEF-09 | `UnitList.tsx:85` | Unnecessary `(org as any)` cast for `detailAddress` |
| DEF-10 | `UnitForm.tsx:46` | Hardcoded fallback `'ORG_' + id` for code |
| DEF-11 | `OrgUnit.java:52` vs `CreateOrgUnitRequest.java:27` | Entity `@NotBlank` on code but DTO correctly omits — by design |
| DEF-12 | `M001DataSeeder.java:95` | Fragile `"024" + 1234567` phone pattern |

---

## Verification Matrix

| # | Check | Status | Defects |
|---|---|---|---|
| 1 | Create flow | ⚠️ | DEF-03 (UnitForm page), DEF-07 (path) |
| 2 | Edit flow | ⚠️ | DEF-04 (parent rule), DEF-09 (type cast) |
| 3 | Delete flow | ✅ | — |
| 4 | Tree display | ✅ | — |
| 5 | Search/filter | ⚠️ | DEF-08 (dep array) |
| 6 | Error paths | ⚠️ | DEF-02 (comments) |
| 7 | Catch blocks | ⚠️ | DEF-01 (name), DEF-02 (comments) |
| 8 | Column alignment | ✅ | — |
| 9 | detailAddress round-trip | ❌ | DEF-03, DEF-06 |

---

## Recommended Fix Order

1. **DEF-01, DEF-02** — Critical runtime bugs in reject flow (user-visible)
2. **DEF-07** — Potential data corruption in path computation
3. **DEF-03, DEF-04, DEF-06** — Functional gaps in form and data mapping
4. **DEF-05** — contactPhone data mapping
5. **DEF-08–DEF-12** — Low severity, fix at convenience

**Not verified (requires build environment):**
- `npx tsc -p frontend/tsconfig.app.json --noEmit`
- `mvn compile -q`
