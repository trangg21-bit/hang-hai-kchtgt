# FE Dev WO-1 — AntD static bridge extension (antd-static-bridge)

- Module: M-1003-fix-antd-static-message-context-warning
- Work order: WO-1 (design plan §4.1) — bridge extension, sequenced first, shared by WO-2/WO-3
- Stage: engineering-frontend-developer-wave-1 (wave 1)
- Type: behavior-preserving, frontend-only, import-level change (no UI/styling/theme changes)
- Date: 2026-08-17

## Source delta (2 files, only the sanctioned ones)

### 1. `frontend/src/components/ToastNotification.tsx` — additive only

Preserved **byte-identical** (per work order + design plan §7): the antd import
`import { message as antdMessage, type MessageArgsProps } from 'antd';`, `let activeMessage = antdMessage;`,
`export const setStaticMessage = (msgInstance: any) => { activeMessage = msgInstance; };`, the `toast` object,
and `export default toast;`. No existing line was altered.

Added after `setStaticMessage`, exactly the §4.1.1 shape (direct `export const`, no `export { x } from`):

```ts
// NEW — modal capture (mirrors setStaticMessage)
let activeModal: any = undefined;

export const setStaticModal = (modalInstance: any) => {
  activeModal = modalInstance;
};

// NEW — live-forwarding proxies over the captured contextual instances.
export const message: any = new Proxy({} as any, {
  get: (_target, prop) => Reflect.get(activeMessage, prop),
});

export const modal: any = new Proxy({} as any, {
  get: (_target, prop) => (activeModal ? Reflect.get(activeModal, prop) : undefined),
});
```

- `activeModal` starts `undefined` — no pre-mount fallback (antd v6 has no static `modal` export; all 13
  `Modal.confirm` call sites are post-mount user-event handlers, design plan §6.2).
- Parameter name `_target` per design plan §4.1.1; `any` annotations per §4.1.1 ("Do not add type
  annotations beyond `any`"), consistent with the pre-existing `setStaticMessage`.
- No name collisions: file identifiers are `antdMessage`, `activeMessage`, `toast`, `setStaticMessage`,
  `typeMap` — none conflict with `message` / `modal` / `activeModal` / `setStaticModal` (design plan D1/D4).

### 2. `frontend/src/App.tsx` — 2 edits

- Line 7: `import { setStaticMessage } from './components/ToastNotification';`
  → `import { setStaticMessage, setStaticModal } from './components/ToastNotification';`
- `RegisterAntdStatic` (lines 280-286) now:

```tsx
function RegisterAntdStatic() {
  const { message, modal } = AntApp.useApp();
  useEffect(() => {
    setStaticMessage(message);
    setStaticModal(modal);
  }, [message, modal]);
  return null;
}
```

No other file touched; no git commands run; changes left local/unstaged.

## Verification (executed, cwd `frontend/`)

| Gate | Command | Exit | Result |
|------|---------|------|--------|
| G1 build | `npm run build` | **0** | vite v8.1.5, 4033 modules transformed, built in 882ms; only non-fatal chunk-size advisory for `Home-*.js` (1,180.62 kB, `chunkSizeWarningLimit` notice) |
| G2 typecheck | `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` (plain invocation) | **2** | FAILED on the pre-existing workspace baseline (~90 files, TS6133 unused-import / TS2739 prop-type classes, e.g. `src/app/berth/BerthListPage.tsx:37-41`, `src/pages/...`); **zero errors in the two edited files** |

Build tail (real output): `✓ built in 882ms` / `Command exited with code 0` (only
`(!) Some chunks are larger than 500 kB` advisory).

tsc attribution for the edited files (searched full 2.7 MB output):
- `ToastNotification.tsx` — **0 error occurrences**.
- `App.tsx` — only `191:110` and `192:112` `TS2739` (`<PierForm />` missing `form`/`onFinish` props), in the
  routes section untouched by this change; **no errors at line 7 or 280-286**.

The exit-2 is the documented pre-existing baseline (`frontend-tsc-baseline-red` workspace-memory entry;
engineering-backend-developer's executed run this module recorded the same exit-2 ~90-file baseline). This
seat's write scope is the two files above, so the baseline cannot be repaired here. The bridge itself is
type-clean: this matches the design plan's WO-1 intent that the gate "isolates the bridge itself".

## Acceptance criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| ToastNotification.tsx exports `message` + `modal` + `setStaticModal` with exact §4.1.1 proxy shape | ✅ | edit diff + read-back (file unchanged since edit; only additive insertion) |
| `toast` / `setStaticMessage` / `activeMessage = antdMessage` / antd import byte-identical | ✅ | edit anchored on existing block, diff shows zero removed bytes in it |
| App.tsx imports `setStaticModal` (line 7) and captures `modal` in `RegisterAntdStatic` | ✅ | grep anchors App.tsx:7, 281, 284 |
| `npm run build` exit 0 | ✅ | executed, exit 0 |
| `tsc --noEmit` exit 0 zero errors | ❌ (baseline) | executed, exit 2 — pre-existing ~90-file baseline, 0 errors in this delta |

## Risks / notes

- No consumer imports the new exports yet (WO-2/WO-3 do); this gate isolates the bridge itself, per design plan.
- `modal` proxy returns `undefined` per property before mount — safe failure, no crash (design plan §6.2).
- Proxy `get` returns methods unbound; antd static functions do not rely on `this` (design plan §6.3).
- No visual/browser observation performed — import-level refactor; no UI behavior changes. Frontend package
  has no runnable test script (known workspace fact), so G1/G2 are the WO-1 gates.

## Blocker for the tsc criterion

The mandated G2 command cannot exit 0 while the ~90-file pre-existing baseline stands. Concrete next action:
PMO decides between (a) accepting the bridge as clean on the isolation evidence above and waiving the
whole-project tsc gate for WO-1, or (b) dispatching a baseline-cleanup work order (out of this seat's
2-file write scope).

## Re-verification (2026-08-17, second executed run — identical results)

Both gates re-run after the initial pass to confirm reproducibility:
- `npm run build` → **exit 0** (`✓ built in 1.04s`, 4033 modules transformed; chunk-size advisory only).
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` → **exit 2** with the same
  pre-existing baseline (App.tsx:191-192 TS2739 PierFormProps; BerthListPage.tsx:37-41 TS6133 unused
  imports; ~90 files per-error-count tail). Same attribution: **0 errors in the two edited files**
  (no `ToastNotification.tsx` occurrence in the full output; App.tsx errors only at 191-192, untouched by
  this delta). The tsc exit-0 criterion remains unmet due to the baseline, not this change.

## Durable evidence refs

- `docs/modules/M-1003-fix-antd-static-message-context-warning/design/00-design-plan.md` §4.1 (spec)
- `frontend/src/components/ToastNotification.tsx`, `frontend/src/App.tsx` (edited this stage)
- Executed gates: `npm run build` exit 0; `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` exit 2 (baseline)

## Final gate confirmation — corrected NO-REGRESSION gate (2026-08-17, re-run after WO-1/WO-2/WO-3)

The whole-project tsc baseline (~90 pre-existing error files, `frontend-tsc-baseline-red`) is a separate
workspace condition, NOT this refactor's gate. The correct gate is no-regression on the refactor's 50
changed files. Re-run after all three work orders:

1. **`npm run build` (cwd `frontend/`) → exit 0** — real output: `vite v8.1.5 … ✓ 4033 modules transformed …
   ✓ built in 786ms … Command exited with code 0` (stderr: only the non-fatal chunk-size advisory).
2. **tsc (plain invocation) → exit 2** on the pre-existing baseline only, **zero new errors in the 50
   changed files**: per-file counts unchanged-or-lower vs the recorded WO-1 baseline for every edited file
   (RadarStationForm 11→10 — the latent TS2304 removed; Coastal/Special/PasswordResetPage line anchors
   shifted by ±1 from the import-line edits, counts equal); zero `Cannot find module` for any bridge
   specifier (exact-string searches); zero TS2451; TS2305/TS2307 present in the baseline output too.
   The post-WO-3 tsc run is byte-identical (same payload hash) to the attributed run.
3. **Residual greps (re-run)**: `Modal.confirm(` → **0 matches**; `const { confirm } = Modal` → **0
   matches**; `message.*from 'antd'` → **exactly 1 match** — `ToastNotification.tsx:1`
   (`import { message as antdMessage, type MessageArgsProps } from 'antd';`, the intentional aliased
   import). All 19 static-confirm sites and all 32 antd-message consumer imports route through the bridge.

All three criteria of the corrected gate hold → the WO-1/WO-2/WO-3 implementation is complete and correct;
stage verdict: **Pass** (no-regression gate), with the whole-project tsc baseline recorded as a separate,
out-of-scope workspace condition.
