---
feature-id: HF-002
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 1
task: fix-integration-token-header
verdict: Blocked
last-updated: 2026-07-14
---

# Frontend Implementation Summary — HF-002: X-Integration-Token Header Fix

## Problem Statement

The frontend dashboard calls `/api/v1/integration/share/**` endpoints without the required `X-Integration-Token` header. The backend `IntegrationTokenAdvice` validates this header and returns `401 Unauthorized`, which triggers the axios response interceptor's auth redirect to `/login`, breaking the dashboard load.

## Implementation Plan

Add the `X-Integration-Token` header to the axios request interceptor in `frontend/src/services/api.ts`. The header value uses `VITE_INTEGRATION_TOKEN` env var with fallback to `integration-secret-token-2026`.

## Designer Spec Coverage

| Requirement | Status | Notes |
|---|---|---|
| Fix 401 on integration endpoints | **Partial** | Fix is fully specified but cannot be applied due to edit permission block |
| No other behavior changes | **Not tested** | Cannot verify without applying the change |
| TypeScript compilation | **Pass** | Pre-fix `npx tsc --noEmit` returns exit code 0 |

## Component / Token Mapping

| Requirement | Component | Token | Gap |
|---|---|---|---|
| Add header to all axios requests | `api.ts` request interceptor | N/A (infra fix) | None — single line addition |

## Files Changed

| File | Purpose |
|---|---|
| `frontend/src/services/api.ts` | **BLOCKED — not applied.** Insert one line in request interceptor: `config.headers['X-Integration-Token'] = import.meta.env.VITE_INTEGRATION_TOKEN || 'integration-secret-token-2026';` |

## Implementation Detail

### Location
`frontend/src/services/api.ts`, request interceptor block (lines 13-20)

### Code Change
Insert AFTER the `if (token)` block and BEFORE `return config;`:

```ts
config.headers['X-Integration-Token'] = import.meta.env.VITE_INTEGRATION_TOKEN || 'integration-secret-token-2026';
```

### Request Interceptor — Before
```ts
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
```

### Request Interceptor — After
```ts
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Integration-Token'] = import.meta.env.VITE_INTEGRATION_TOKEN || 'integration-secret-token-2026';
    return config;
  },
  (error) => Promise.reject(error),
);
```

## Accessibility Compliance

N/A — this is an infrastructural fix to the HTTP client, not a UI component. No accessibility changes required.

## Tests

No new tests needed. The change is a header injection that is transparent to existing tests.

## Verification Evidence

| Check | Command | Exit Code | Scope |
|---|---|---|---|
| Pre-fix TypeScript compilation | `npx tsc --noEmit` (from `frontend/`) | 0 | Full TS project |
| Header presence check | `grep -r "X-Integration-Token" frontend/src/` | No matches found | All TS files |

## Known Limitations

1. **Edit permission blocked:** The `edit` and `write` tools are blocked for paths under `frontend/src/` because the permission glob pattern `src/**` does not match `frontend/src/**`. The fix is fully specified but must be applied manually by the orchestrator or via shell.
2. **Env var required for production:** The `VITE_INTEGRATION_TOKEN` environment variable must be configured in the frontend `.env` (or `.env.local`) file for non-default tokens.
3. **Global header injection:** The header is added to ALL requests, not just integration endpoints. This is harmless — the backend only validates it on `/api/v1/integration/share/**` paths.

## Out of Scope (Confirmed)

- Backend `IntegrationTokenAdvice` — no changes needed
- `dashboardApi.ts` — no changes needed (calls through `api.get()` which is fixed)
- `.env` / `.env.example` files — must be configured separately by ops/infra
- Response interceptor — no changes needed
- Any other frontend files — no changes needed

## Blockers

1. **EDIT-PERMISSION-BLOCKED:** The `edit` and `write` tools cannot modify `frontend/src/services/api.ts`. The permission pattern `src/**` does not match `frontend/src/**`. The fix must be applied manually.

## Verdict

<verdict_envelope>
  <verdict>Blocked</verdict>
  <confidence>medium</confidence>
  <structured_summary>
    <key_findings>
      <item>X-Integration-Token header is missing from axios request interceptor in frontend/src/services/api.ts</item>
      <item>Backend IntegrationTokenAdvice validates this header and returns 401 when absent</item>
      <item>Fix is a single line addition in the request interceptor</item>
      <item>Pre-fix TypeScript compilation passes (exit code 0)</item>
    </key_findings>
    <artifacts_produced>
      <item>docs/hotfixes/HF-002-integration-token-header/dev/05-fe-dev-w1-fix-integration-token-header.md</item>
      <item>docs/hotfixes/HF-002-integration-token-header/dev/05-fe-dev-w1-frontend-implementation-summary.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <item>EDIT-PERMISSION-BLOCKED: Cannot modify frontend/src/services/api.ts via edit/write tools due to glob pattern mismatch (src/** vs frontend/src/**). Fix must be applied manually by orchestrator or via shell.</item>
  </blockers>
</verdict_envelope>
