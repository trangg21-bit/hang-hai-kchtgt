---
feature-id: M-003
stage: validation
agent: sdlc-qa
verdict: Fail
wave: UI-W1
critical-ac-total: 15
critical-ac-verified: 4
last-updated: 2026-07-01
---

# QA Report — M-003 UI Wave 1
## Module: Quản lý Tài sản KCHTGT Khu nước & VTS (Frontend Track)

---

## 1. Feature / Change Overview

| Field | Value |
|---|---|
| module-id | M-003 |
| wave | UI Wave 1 |
| scope | 5 entity page groups: luonghanghai, deke, cosuachua, tramradar, hethongvts |
| backend-status | Done, reviewer-approved |
| frontend-status | Service layer + types scaffolded; all 10 page components are Wave-2 placeholders |
| tsc-status | 0 errors in M-003 files; 286 pre-existing errors in non-M-003 files |
| playwright-run | Attempted; BLOCKED by missing live backend |

---

## 2. Test Scope

### 2.1 Included

| # | Area | Evidence type |
|---|---|---|
| 1 | Route wiring in App.tsx for all 5 entities (15 routes) | Analytical (code read) |
| 2 | PermissionGuard wrapping all M-003 routes | Analytical |
| 3 | Service layer endpoint paths (CRUD + approve C1/C2 + history) | Analytical |
| 4 | PheDuyetRequest field-name contract per entity | Analytical |
| 5 | Shared components: ApprovalActionBar, HistoryTimeline, AttachmentList, ApprovalStatusBadge, CrudPageLayout | Analytical |
| 6 | Self-approval guard logic in ApprovalActionBar | Analytical |
| 7 | Attachment read-only enforcement in AttachmentList | Analytical |
| 8 | TypeScript clean-build for M-003 files | Executed (tsc -b --noEmit) |
| 9 | Playwright spec execution (route reachability + placeholder render) | Executed (BLOCKED at login — no live backend) |

### 2.2 Excluded

| # | Area | Reason |
|---|---|---|
| 1 | Real list/table rendering with data | Pages are placeholders; not implemented in Wave 1 |
| 2 | Create form field validation and submission | Pages are placeholders |
| 3 | Approval C1→C2 XHR request body content | Pages are placeholders; no XHR fired |
| 4 | Pagination / search filter UI | Pages are placeholders |
| 5 | History timeline rendered with real data | Pages are placeholders |
| 6 | Attachment read-only assertion via browser | Pages are placeholders |
| 7 | Self-approval guard via browser interaction | Pages are placeholders |
| 8 | Mobile/tablet responsive behavior | Not meaningful for placeholders |
| 9 | Permission denial scenario (non-admin user) | No non-admin test account configured |

### 2.3 Assumptions and Constraints

- All 10 page components (`*List.tsx`, `*Form.tsx`) are intentional placeholders: `<Empty description="... — Placeholder for Wave 2" />`. This is the primary blocking finding.
- Playwright webServer config starts Vite (`npm run dev`); Vite starts cleanly. Backend API is not started — all login-dependent tests fail at `waitForURL(/\/users/)`.
- Existing test harness uses live backend; no route-mocking (`page.route`) anywhere in the e2e suite. M-003 specs follow the same pattern.
- Pre-existing TSC errors (286 errors in ConfirmModal.test.tsx, DataTable.test.tsx, FormField.test.tsx, etc.) are not M-003 regressions — they predate this wave.

---

## 3. Requirement Coverage Matrix

| Requirement | Test Condition | Coverage | Notes |
|---|---|---|---|
| Route /luong-hang-hai reachable + guarded | TC-M003-LHH-01,04 | Analytical-Pass | Route wired, PermissionGuard present in App.tsx |
| Route /de-ke reachable + guarded | TC-M003-DK-01,04 | Analytical-Pass | Route wired, PermissionGuard present |
| Route /co-so-sua-chua reachable + guarded | TC-M003-CSC-01,04 | Analytical-Pass | Route wired, PermissionGuard present |
| Route /tram-radar reachable + guarded | TC-M003-TR-01,04 | Analytical-Pass | Route wired, PermissionGuard present |
| Route /he-thong-vts reachable + guarded | TC-M003-VTS-01,04 | Analytical-Pass | Route wired, PermissionGuard present |
| List page renders table with data | TC-*-01 | FAIL | All 5 List pages are placeholders |
| Create form validates required fields | TC-*-02 | FAIL | All 5 Form pages are placeholders |
| Approval C1 XHR uses correct request body | TC-*-05 | FAIL | No approval UI wired |
| Approval C2 XHR uses correct request body | TC-*-05 | FAIL | No approval UI wired |
| Self-approval guard: C2 disabled when user == C1 approver | TC-M003-LHH-05 | Analytical-Pass | Logic present in ApprovalActionBar.tsx |
| History timeline renders entries | (no TC possible) | FAIL | Form pages are placeholders |
| Attachments render read-only (no upload) | (no TC possible) | PARTIAL | AttachmentList.tsx has `readonly` prop guard; not wired into any Form page yet |
| PheDuyetRequest field = trangThai for luonghanghai | Analytical | Analytical-Pass | types/luongHangHai.ts confirmed |
| PheDuyetRequest field = quyetDinh for deke | TC-M003-DK-05 | Analytical-Pass | types/deKe.ts confirmed |
| PheDuyetRequest field = quyetDinh (no nguoiPheDuyet) for cosuachua/tramradar/vts | TC-M003-CSC-05, TR-05, VTS-05 | Analytical-Pass | types confirmed |

---

## 4. Test Strategy

### 4.1 Happy Path
- Navigate to each entity list page after login → confirm render without crash (blocked at login step in execution).
- Navigate to create form → confirm form visible and required fields validated.

### 4.2 Negative Path
- Submit create form with missing required fields → assert validation error messages.
- Attempt approve C2 when currentUserId === nguoiPheDuyetC1 → button must be disabled with tooltip.

### 4.3 Edge Cases
- History endpoint returns empty array → `HistoryTimeline` renders "Chưa có lịch sử phê duyệt".
- Attachments array is empty → `AttachmentList` renders "Chưa có tài liệu đính kèm".
- CoordinateInput with kinhDo/viDo = null → no crash.

### 4.4 Permission / Role Cases
- Admin user can access all 5 entity routes.
- User without `luonghanghai:read` gets PermissionGuard denial on `/luong-hang-hai`.
- User without `approvec2` permission: C2 button not rendered (ApprovalActionBar.tsx hasPermission check).

### 4.5 Integration Cases
- Service `search()` returns `total = items.length` (client-side count) — verify pagination control is consistent with this.
- `coSuaChuaService.search()` does not pass `trangThaiPheDuyet` param — filter UI must not expose this as a functional filter.

### 4.6 Data / State Transition Cases
- ApprovalStatus state machine: PROPOSED → UNDER_REVIEW → APPROVED / REJECTED.
- LuongHangHai uses `approvalStatus` field; DeKe uses `trangThaiPheDuyet`; CoSuaChua/TramRadar/VTS use `trangThai` — all feed into `ApprovalStatusBadge` which handles string-based lookup; confirmed works for all.

### 4.7 Regression Scope
Routes, layout, and global QueryClient are shared — all M-003 routes added to App.tsx must not break existing routes. Code inspection confirms new routes are isolated in their own `<Route>` blocks with no changes to existing routes.

---

## 5. Test Cases

| ID | Scenario | Priority | Status |
|---|---|---|---|
| TC-M003-LHH-01 | /luong-hang-hai renders without crash | High | BLOCKED (no backend) |
| TC-M003-LHH-02 | /luong-hang-hai/create renders without crash | High | BLOCKED |
| TC-M003-LHH-03 | /luong-hang-hai/:id renders without crash | High | BLOCKED |
| TC-M003-LHH-04 | PermissionGuard wraps luonghanghai routes | High | BLOCKED |
| TC-M003-LHH-05 | Self-approval guard logic present in ApprovalActionBar | Critical | BLOCKED |
| TC-M003-DK-01 | /de-ke renders without crash | High | BLOCKED |
| TC-M003-DK-02 | /de-ke/create renders without crash | High | BLOCKED |
| TC-M003-DK-03 | /de-ke/:id renders without crash | High | BLOCKED |
| TC-M003-DK-04 | PermissionGuard wraps deke routes | High | BLOCKED |
| TC-M003-DK-05 | DeKe PheDuyetRequest uses quyetDinh field | Critical | BLOCKED |
| TC-M003-CSC-01 | /co-so-sua-chua renders without crash | High | BLOCKED |
| TC-M003-CSC-02 | /co-so-sua-chua/create renders without crash | High | BLOCKED |
| TC-M003-CSC-03 | /co-so-sua-chua/:id renders without crash | High | BLOCKED |
| TC-M003-CSC-04 | PermissionGuard wraps cosuachua routes | High | BLOCKED |
| TC-M003-CSC-05 | CoSuaChua PheDuyetRequest quyetDinh, no nguoiPheDuyet | Critical | BLOCKED |
| TC-M003-TR-01 | /tram-radar renders without crash | High | BLOCKED |
| TC-M003-TR-02 | /tram-radar/create renders without crash | High | BLOCKED |
| TC-M003-TR-03 | /tram-radar/:id renders without crash | High | BLOCKED |
| TC-M003-TR-04 | PermissionGuard wraps tramradar routes | High | BLOCKED |
| TC-M003-TR-05 | TramRadar PheDuyetRequest quyetDinh, coordinate fields | Critical | BLOCKED |
| TC-M003-VTS-01 | /he-thong-vts renders without crash | High | BLOCKED |
| TC-M003-VTS-02 | /he-thong-vts/create renders without crash | High | BLOCKED |
| TC-M003-VTS-03 | /he-thong-vts/:id renders without crash | High | BLOCKED |
| TC-M003-VTS-04 | PermissionGuard wraps vts routes | High | BLOCKED |
| TC-M003-VTS-05 | VTS PheDuyetRequest quyetDinh + doiTac field | Critical | BLOCKED |

Total: 25 TCs. All BLOCKED at login step — live backend required.

---

## 6. Execution Results

| Test Case ID | Status | Evidence / Notes |
|---|---|---|
| TC-M003-LHH-01..05 | BLOCKED | login `waitForURL(/\/users/)` timeout; backend API unreachable |
| TC-M003-DK-01..05 | BLOCKED | same blocker |
| TC-M003-CSC-01..05 | BLOCKED | same blocker |
| TC-M003-TR-01..05 | BLOCKED | same blocker |
| TC-M003-VTS-01..05 | BLOCKED | same blocker |

| Evidence Type | Command / Source | Result | Notes |
|---|---|---|---|
| Executed | `node_modules/.bin/tsc -b --noEmit` — M-003 files | PASS — 0 new errors | 286 pre-existing errors in non-M-003 files; M-003 files are clean |
| Executed | `playwright test e2e/m003-luong-hang-hai.spec.ts` | FAIL (5/5) | Login blocked — no backend; frontend Vite server started successfully |
| Analytical | Code read: App.tsx routes | PASS | All 15 M-003 routes present, all PermissionGuard-wrapped |
| Analytical | Code read: service layer endpoint paths | PASS | Correct paths; matches BE contract |
| Analytical | Code read: PheDuyetRequest field names per entity | PASS | luonghanghai=trangThai; deke/cosuachua/tramradar/vts=quyetDinh |
| Analytical | Code read: ApprovalActionBar self-approval guard | PASS | `isSelfApprovalC2` logic present; C2 button disabled when condition met |
| Analytical | Code read: AttachmentList readonly prop | PARTIAL — DEFECT | `readonly` prop exists and guards Upload.Dragger; but no upload endpoint exists on BE (CG-04 unresolved) |
| Analytical | Code read: all 10 page components | FAIL — BLOCKER | All 10 are `<Empty description="... Placeholder for Wave 2" />` |

---

## 7. Defects Found

| Defect ID | Title | Severity | Priority | Reproduction Steps | Expected | Actual | Impact |
|---|---|---|---|---|---|---|---|
| DEFECT-M003-UI-001 | All 5 List pages are Wave-2 placeholders — no functional UI | **Blocker** | P0 | Navigate to /luong-hang-hai, /de-ke, /co-so-sua-chua, /tram-radar, /he-thong-vts after login | Entity list table with data, search filter, pagination | `<Empty description="... Placeholder for Wave 2" />` | Entire M-003 frontend user-facing functionality is absent |
| DEFECT-M003-UI-002 | All 5 Form pages are Wave-2 placeholders — no functional UI | **Blocker** | P0 | Navigate to /luong-hang-hai/create (or any entity /create or /:id) | Create/edit form with field validation and submit | `<Empty description="... Placeholder for Wave 2" />` | No CRUD, no approval flow, no history, no attachments accessible |
| DEFECT-M003-UI-003 | AttachmentList has Upload.Dragger code despite no BE upload endpoint | **Major** | P1 | Render AttachmentList with `readonly=false` | Upload control absent or disabled | `Upload.Dragger` is rendered and functional when `readonly=false`; no upload endpoint exists (CG-04 in ui-spec unresolved) | If `readonly` prop is accidentally omitted in Wave-2, users see an upload control that will silently fail |
| DEFECT-M003-UI-004 | coSuaChuaService.search() missing trangThaiPheDuyet query param | **Minor** | P2 | Call coSuaChuaService search with trangThaiPheDuyet param | Filter is sent to backend | `search()` only sends `keyword, tinhThanh, trangThai`; trangThaiPheDuyet is typed in ListParams but not passed in the Axios call | Status filter will not work for CoSuaChua entity |
| DEFECT-M003-UI-005 | Pre-existing TSC errors in ConfirmModal.test.tsx, DataTable.test.tsx, FormField.test.tsx (286 total) | **Major** | P1 | Run `tsc -b --noEmit` | Zero errors | 286 errors in non-M-003 test files | These are pre-existing and not M-003 regressions, but block a clean CI build gate |

---

## 8. NFR Observations

### 8.1 Security Behavior
- PermissionGuard wraps all 15 M-003 routes in App.tsx. The permission strings used are: `luonghanghai:read`, `luonghanghai:create`, `deke:read`, `deke:create`, `cosuachua:read`, `cosuachua:create`, `tramradar:read`, `tramradar:create`, `vts:read`, `vts:create`. These are consistent with the BE contract.
- Self-approval guard in ApprovalActionBar disables C2 button when `currentUserId === nguoiPheDuyetC1`. Guard is client-side only — BE must enforce same rule server-side (BE was reviewer-approved, assumed correct).

### 8.2 Performance Concerns
- `coSuaChuaService.search()` and `heThongVTSService.search()` set `total = items.length` (client-side count, not from API). If BE paginates, total will be wrong and pagination controls will malfunction.
- All services set `staleTime: 30_000` via QueryClient — acceptable for entity lists.

### 8.3 Audit / Logging
- History entries are fetched via `GET /{id}/history` and rendered by `HistoryTimeline`. Component handles empty/error states correctly. Not testable via browser until Form pages are implemented.

### 8.4 Reliability / Resilience
- `HistoryTimeline` renders error state with retry button when `error` prop is set — correct defensive pattern.
- `AttachmentList` upload handler has try/catch with `message.error`. No crash path identified.

### 8.5 Usability Concerns
- `CrudPageLayout` sets `rowKey="id"` — all 5 entities have numeric `id` field, consistent.
- `ApprovalStatusBadge` handles unknown status strings gracefully (falls back to raw status string).

---

## 9. Regression Impact Assessment

M-003 UI Wave 1 adds 10 new page files and 15 new routes to App.tsx. All changes are purely additive:
- No existing routes modified.
- No existing components modified.
- No shared store or hook changes.
- 7 new shared components added to `frontend/src/components/shared/` — no modification of existing components.
- 5 new service files, 5 new type files — no modification of existing files.

**Regression risk: Low.** Pre-existing test failures (286 TSC errors) are not caused by M-003 changes.

---

## 10. Test Limitations / Gaps

| Gap | Root cause | Impact |
|---|---|---|
| All 25 E2E browser tests could not execute | Live backend API not running in CI/test environment | Cannot verify route reachability, PermissionGuard enforcement, or any rendered UI |
| Form validation, field constraints, required fields not testable | Form components are placeholders | Core acceptance criteria for create/edit not testable this wave |
| Approval XHR request body not verifiable | No approval UI rendered | Cannot verify trangThai vs quyetDinh field name contract in live requests |
| History timeline not testable | Form pages are placeholders | Cannot verify timeline renders with real data |
| Attachment read-only not testable via browser | Form pages are placeholders | Can only confirm via code inspection that `readonly=true` guards the Upload control |
| Non-admin permission denial scenario | Only admin test account available | Cannot test PermissionGuard denial branch |

---

## 11. Release Recommendation

**Do NOT release M-003 UI Wave 1 as user-facing functionality.**

The frontend implementation is incomplete — all 10 page components are stubs with no rendered UI. Routes are wired and TypeScript is clean, but the product is not testable at a functional level. Wave 2 must implement the actual List/Form components before this module can proceed to a meaningful QA execution.

The service layer (API paths, PheDuyetRequest field names, shared components) is correctly implemented and type-safe. These foundations are solid for Wave 2 to build on.

**Prerequisite for next QA pass:**
1. Implement LuongHangHaiList.tsx and LuongHangHaiForm.tsx (and similarly for all 5 entities) with real UI.
2. Provide a live backend + test data for E2E execution.
3. Resolve DEFECT-M003-UI-003 (AttachmentList upload guard) and DEFECT-M003-UI-004 (coSuaChua search param).

---

## 12. QA Verdict

**Fail**

Reason: Primary functional deliverable (5 entity CRUD pages with approval workflow) is not implemented. All page components are explicit Wave-2 placeholders. Zero functional acceptance criteria can be verified in a browser. This is not a testing environment problem — the code itself acknowledges it is incomplete.

Evidence split: 2 Executed / 6 Analytical.

---

## QA → Handoff Summary

**Verdict:** Fail

**AC coverage:** 4/15 critical ACs verified (route wiring + type contract — analytical only). 11/15 critical ACs are untestable because page components are placeholders.

**Evidence type split:** 2 executed (tsc clean-build + Playwright attempt) / 6 analytical (code inspection of routes, services, types, shared components).

**Defects found:** 2 Blockers, 2 Major, 1 Minor.

**Top defect for reviewer attention:** DEFECT-M003-UI-001 + DEFECT-M003-UI-002 — all 10 page components are Wave-2 placeholders. Zero functional UI exists. This is the defining issue of this wave.

**NFR observations:** PermissionGuard present on all routes. Self-approval guard coded in ApprovalActionBar. AttachmentList has unresolved upload-endpoint risk (CG-04). CoSuaChua search missing trangThaiPheDuyet param. Pre-existing 286 TSC errors in test files (not M-003 regressions).

**Test gaps reviewer should note:** No E2E browser execution was possible (live backend not running). Form validation, approval XHR body content, history timeline, and attachment read-only enforcement are all untestable this wave. These must be re-tested in Wave 2 when pages are implemented.

---

```json
{
  "agent": "sdlc-qa",
  "stage": "validation",
  "verdict": "Fail",
  "confidence": "high",
  "escalate_recommended": "false",
  "escalation_reason": "",
  "next_owner": "sdlc-reviewer",
  "coverage": { "critical_ac_total": 15, "critical_ac_verified": 4 },
  "evidence_type_split": { "executed": 2, "analytical": 6 },
  "missing_artifacts": [],
  "blockers": [
    "All 10 page components (LuongHangHaiList/Form, DeKeList/Form, CoSuaChuaList/Form, TramRadarList/Form, HeThongVTSList/Form) are Wave-2 placeholders with no rendered UI",
    "Live backend not running — E2E login blocked; all 25 Playwright tests BLOCKED"
  ],
  "risk_score": "4",
  "risk_level": "high",
  "evidence_refs": [
    "frontend/e2e/m003-luong-hang-hai.spec.ts",
    "frontend/e2e/m003-de-ke.spec.ts",
    "frontend/e2e/m003-co-so-sua-chua.spec.ts",
    "frontend/e2e/m003-tram-radar.spec.ts",
    "frontend/e2e/m003-he-thong-vts.spec.ts",
    "frontend/src/pages/luonghanghai/LuongHangHaiList.tsx",
    "frontend/src/pages/luonghanghai/LuongHangHaiForm.tsx",
    "frontend/src/components/shared/ApprovalActionBar.tsx",
    "frontend/src/components/shared/AttachmentList.tsx",
    "frontend/src/components/shared/HistoryTimeline.tsx",
    "frontend/src/App.tsx"
  ],
  "sub_dispatch_count": "0",
  "sub_dispatch_degraded": "false",
  "token_usage": {
    "input": "18000",
    "output": "7000",
    "this_agent": "25000",
    "pipeline_total": "25000"
  }
}
```
