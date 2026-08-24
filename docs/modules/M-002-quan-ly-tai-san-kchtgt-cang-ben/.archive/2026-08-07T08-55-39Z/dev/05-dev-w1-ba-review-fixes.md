# Implementation Summary — BA Review Fixes (F-008)

**Task:** TRI-1785470382663-629f
**Module:** M-002 (Cảng biển)
**Feature:** F-008 (Tạo mới Cảng biển)
**Wave:** 1

---

## Fix 1: AC-008-15 — Declare `canSubmitForApproval` in PortListPage.tsx

**File:** `frontend/src/services/port/PortListPage.tsx`
**Change:** Added variable declaration after `hasPerm` at line 162

```tsx
const canSubmitForApproval = hasPerm?.('admin:manage') || hasPerm?.('Port:approve');
```

The variable was already used at ~line 1608 in the conditional wrapping the "Gửi phê duyệt" button but was never declared — causing a reference error. The declaration computes whether the current user holds either `admin:manage` or `Port:approve` permission.

**Before/After:**
- Line 161 (unchanged): `const hasPerm = usePermissionStore((s) => s.hasPermission);`
- Line 162 (new): `const canSubmitForApproval = hasPerm?.('admin:manage') || hasPerm?.('Port:approve');`
- Line 163+ (unchanged): `// ── State ──` and all following code

---

## Fix 2: Section 8.1 — Port Code Tampering Detection in PortService.java

**File:** `src/main/java/com/hanghai/kchtg/port/service/PortService.java`
**Change:** Added format validation after auto-generate fallback block, before entity builder

```java
// Section 8.1: Tampering detection — mã cảng phải đúng format tự sinh CB-XXXXXX
if (!portCode.matches("^CB-\\d{6}$")) {
    throw new IllegalArgumentException("Mã cảng không hợp lệ");
}
```

This guards against tampering: if a port code is provided (not auto-generated), it MUST match the `CB-XXXXXX` format (CB prefix + 6 digits). Any deviation — including manual entry of a non-standard code — is rejected with an `IllegalArgumentException`.

**Insertion point:** Line 124, immediately after the `}` closing the auto-generate fallback block and immediately before `Port entity = Port.builder()`.

---

## Verification

| Check | Command | Result |
|---|---|---|
| Frontend typecheck | `npx tsc --noEmit` (frontend/) | ✅ Pass (exit 0) |
| Backend compile | `mvn compile` (workspace root) | ✅ Pass (exit 0) |

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/services/port/PortListPage.tsx` | +1 line (canSubmitForApproval declaration) |
| `src/main/java/com/hanghai/kchtg/port/service/PortService.java` | +4 lines (tampering detection guard) |

No other files modified.
