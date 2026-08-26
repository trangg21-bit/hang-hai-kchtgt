# Implementation record — PortListPage edit keeps approval status (TRI-1787651300305-b64e)

## Summary

Removed the APPROVED→PENDING status downgrade in the plain-edit payload of the Cảng biển (Port) list page, so an approved record **stays `APPROVED` on a normal "Cập nhật"** (use case 8: edit approved record keeps Đã duyệt; the backend records the UPDATED diff). The deliberate "Gửi duyệt" submit action is untouched.

## Change

- File: `frontend/src/services/port/PortListPage.tsx` (only file modified)
- Location: `handleUpdateFinish` edit payload, line 1242
- Before: `approvalStatus: selectedRecord.approvalStatus === 'APPROVED' ? 'PENDING' : selectedRecord.approvalStatus,`
- After: `approvalStatus: selectedRecord.approvalStatus,`
- Exactly one line changed (edit tool diff, 1 replacement). No other file was edited.

## Submit action untouched (verified by read)

- `handleConfirmSubmit` (line ~1418): `await updateCangBien({ id: submittingRecord.id, approvalStatus: 'PENDING' } as any);` — the "Gửi duyệt" action still sends `PENDING`. Not modified.

## Read-only verification — other 5 modules send NO status downgrade on plain edit

| Module | Edit path (frontend) | Evidence (file:line) | Plain "Cập nhật" payload |
|---|---|---|---|
| Bến cảng (Berth) | `BerthListPage.tsx:1062` → `BerthForm.tsx` `submit('UPDATE')` | `BerthForm.tsx:230-251` | No `approvalStatus`/`status` key; `saveAction` only when `saveAction !== 'UPDATE'` (`BerthForm.tsx:251`) |
| Cầu cảng (Pier) | `PierListPage.tsx:188` → `PierForm.tsx` `submit('UPDATE')` | `PierForm.tsx:169-177` | No `approvalStatus`/`status` key; `saveAction` only when `saveAction !== 'UPDATE'` (`PierForm.tsx:177`) |
| Cảng cạn (DryPort) | `DryPortListPage.tsx:1024-1025` → `runSave(values,'UPDATE',…)` | `DryPortListPage.tsx:884-952` | `saveAction: actionMap['UPDATE']` = `undefined` (actionMap only maps DRAFT/SUBMIT/SAVE_AND_APPROVE, L925); no `approvalStatus` key |
| Phao tiêu (Buoy) | `BuoyListPage.tsx:945` `updateBuoy(editingRecord.id, payload)` | `BuoyListPage.tsx:895-938` | No `status`, `approvalStatus`, or `saveAction` key in payload |
| Nhà trạm phao tiêu (BuoyStation) | `BuoyStationListPage.tsx:1282` → `BuoyStationFormContent.tsx` `handleSave('UPDATE')` | `BuoyStationFormContent.tsx:305-306` | Update path sends payload `p` with no `status`/`approvalStatus`/`saveAction` key (create-only `p.action`, L320) |

Workspace-wide sweep: the only `approvalStatus === 'APPROVED' ? 'PENDING'` pattern in `frontend/src` was the target line. All `PENDING_APPROVAL` matches elsewhere are type declarations / label maps / tab constants, not update payloads. No `saveAction: 'UPDATE'` or `status: 'PENDING'` payload assignment found anywhere. **No other frontend file forces a status downgrade on edit — no footprint expansion needed.**

## Verification

- `npm run build` (frontend): **exit 0**, `✓ built in 3.74s`, 4054 modules transformed. Only pre-existing chunk-size warning (>500 kB), non-blocking.
- Type-level diagnostics on the edited file are pre-existing biome lint findings (Symbol shadowing, forEach returns, a11y, hook deps — lines 84/544/709/886/…, none on line 1242) and unrelated to this one-line change; the declared gate is `npm run build`.
- Limitation: this dispatch's bash permission narrowing refused `git diff`/`git status` (configured restriction), so a git-level "only one file changed" confirmation could not be run; the edit tool's own 1-replacement diff plus the read-only inspection of all other files is the direct evidence instead.

## Risk / notes

- Backend default on plain edit must keep the current approval status (no `saveAction`); all 5 verified modules already rely on that default. Backend-side keep-approve + history-gating changes are covered by the sibling backend seats of this triage (PortService/BerthService/PierService/DryPortService/BuoyService/BuoyStationService) — out of this seat's scope.
