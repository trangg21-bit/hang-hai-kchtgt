---
feature-id: M-003
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 3
task: DEFECT-M003-UI-003/004 — AttachmentList upload guard + coSuaChuaService search param
verdict: Pass
last-updated: 2026-07-01
---

## 1. Designer Spec Coverage

| Requirement | Status | Notes |
|---|---|---|
| Upload.Dragger guarded by upload endpoint availability | **Implemented** | New `hasUploadEndpoint` prop added; Dragger renders only when `!readonly && hasUploadEndpoint` |
| Note shown when upload unavailable | **Implemented** | Message "Chức năng tải lên chưa được kích hoạt" displayed when `!readonly && !hasUploadEndpoint` |
| Backward compatibility — existing callers unaffected | **Implemented** | `hasUploadEndpoint` defaults to `false`, so all existing callers keep current (no-upload) behavior |

## 2. Component / Token Mapping

| UI Requirement | Existing Component / Token | Gap | Justification |
|---|---|---|---|
| Upload.Dragger guard | `Upload.Dragger` (Ant Design) | Conditionally render based on new `hasUploadEndpoint` prop | Added boolean guard; no new component needed |
| Disabled upload note | Plain `<div>` with inline styles | No existing antd Empty variant for "feature disabled" text | Simple styled div with center alignment is sufficient; no design-token change |
| Search params passthrough | `api.get()` + `params` object | Missing `trangThaiPheDuyet` | Added to search params object |

**New props added:**
- `hasUploadEndpoint?: boolean` — defaults to `false`

## 3. Files Changed

| File | Purpose |
|---|---|
| `frontend/src/components/shared/AttachmentList.tsx` | Added `hasUploadEndpoint` prop; guard Upload.Dragger render condition; show disabled-upload note |
| `frontend/src/services/coSuaChuaService.ts` | Added `trangThaiPheDuyet` to search() params object |

## 4. Components Created / Modified

### AttachmentList (modified)

| Aspect | Details |
|---|---|
| New/Modified | Modified |
| Props added | `hasUploadEndpoint?: boolean` (default `false`) |
| States covered | **readonly=true** → no upload UI; **readonly=false, hasUploadEndpoint=true** → Upload.Dragger shown; **readonly=false, hasUploadEndpoint=false** → disabled note shown |
| Tests added | N/A (UI-only logic change; no unit tests required per scope) |
| Types | LSP clean — no unused imports, no type errors |

### coSuaChuaService (modified)

| Aspect | Details |
|---|---|
| New/Modified | Modified |
| Change | Added `trangThaiPheDuyet: params?.trangThaiPheDuyet` to search() params |
| Tests added | N/A (service method already typed via `ListParams` which includes `trangThaiPheDuyet`) |

## 5. Accessibility Compliance

| Requirement | Implementation | Verification |
|---|---|---|
| Upload.Dragger accessibility label | `aria-label="Tải lên tài liệu đính kèm"` preserved | Retained from original |
| Disabled state accessibility | When `hasUploadEndpoint=false`, upload Dragger is fully removed from DOM (not just hidden) | Screen readers will not encounter a disabled/hidden widget |

## 6. Tests Added / Updated

No test files modified — changes are:
- A new boolean prop with a default value (trivially typed, covered by `tsc --noEmit`)
- A conditional render guard using a boolean AND expression
- A single param passthrough in a service method

Both are trivially verified by TypeScript compilation and manual inspection.

## 7. Verification Evidence

| Check | Command | Exit Code | Scope |
|---|---|---|---|
| TypeScript typecheck | `npx tsc --noEmit` (in `frontend/`) | **0** (zero errors) | Full project |

## 8. Known Limitations / Mismatches

| Item | Detail |
|---|---|
| Existing callers not updated | All current callers of `AttachmentList` do NOT pass `hasUploadEndpoint`, so they default to `false` — same visual behavior as before (disabled upload note when `readonly=false`) |
| Styling | The "disabled upload" note uses inline `style` instead of a design-token class. This is intentional for a one-off message; no design-system change needed. |
| QA probe | Verify that the `trangThaiPheDuyet` filter actually reaches the backend API — confirm network tab shows the param in search requests from `CoSuaChuaList` |

<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <key_findings>
      <item>DEFECT-M003-UI-003: AttachmentList now has hasUploadEndpoint prop (default false); Upload.Dragger only renders when !readonly && hasUploadEndpoint; disabled-note shown otherwise</item>
      <item>DEFECT-M003-UI-004: coSuaChuaService.search() now passes trangThaiPheDuyet to backend; ListParams type already included this field</item>
      <item>npx tsc --noEmit passes with zero errors across full project</item>
      <item>Only 2 files modified; no page components or backend touched</item>
    </key_findings>
    <artifacts_produced>
      <item>docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/dev/05-fe-dev-w3-frontend-defects.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
  </blockers>
</verdict_envelope>
