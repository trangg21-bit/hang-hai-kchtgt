# Security Architect Review — M-022 Trang chủ Dashboard

| Field | Value |
|---|---|
| **Feature ID** | M-022 |
| **Feature Name** | Trang chủ Dashboard |
| **Stage** | engineering-security-architect |
| **Agent** | security-architect |
| **Verdict** | **LOW RISK** |
| **Date** | 2026-07-10 |
| **Source Files Reviewed** | `tokens.ts`, `FilterContext.tsx`, `FilterBar.tsx`, `KpiCard.tsx`, `TrendChartCard.tsx`, `Home.tsx` |

---

## 1. Scope & Threat Surface

M-022 is a **read-only analytics dashboard** rendered inside `AppLayout`. It displays aggregated KPIs, charts (Recharts), an approval section, a map placeholder, and an infrastructure table — all driven by hardcoded mock data with no backend API calls. User interaction is limited to three Ant Design Select dropdowns (year, province, infraType) that update React state and URL query params.

---

## 2. Threat Domain Assessment

### 2.1 Cross-Site Scripting (XSS)

| Vector | Analysis |
|---|---|
| **URL query params** | `FilterContext.tsx:23-29` reads `searchParams.get('year'\|'province'\|'type')`. Values flow into Ant Design `<Select>` controlled component — rendered via React JSX, not `innerHTML`. |
| **Render paths** | No `dangerouslySetInnerHTML`, `eval`, or `setTimeout(string)` anywhere in the 6 files. Recharts, Ant Design, and Typography components all use React's safe rendering. |
| **Risk** | **None** — the entire component tree is React/JSX with zero raw HTML insertion points. Ant Design Select escapes all string content. |
| **Evidence** | Verified by source review: all 6 files, 0 instances of `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or template-literal HTML construction. |

**Verdict: NO XSS surface. Acceptable.**

### 2.2 Sensitive Data Exposure

| Vector | Analysis |
|---|---|
| **Dashboard data** | All data is hardcoded mock arrays in `Home.tsx:68-147` — publicly available port names (Hải Phòng, Đà Nẵng, Cái Mép – Thị Vải) and synthetic numeric figures. |
| **PII or secrets** | Zero instances of PII, API keys, tokens, or personal identifying information in the dashboard. JWT auth token is managed by `authStore.ts` (M-010) — the dashboard never reads it. |
| **Risk** | **None** — mock data only. Reassess when real API data is integrated. |
| **Recommendation** | Before connecting real data, add a data classification review (public/internal/restricted) for dashboard fields. |

**Verdict: NO sensitive data in scope. Acceptable for current phase.**

### 2.3 Authentication & Route Protection

| Vector | Analysis |
|---|---|
| **Route guard** | `App.tsx:145` — `HomePage` at `/` has no `PermissionGuard` wrapper, unlike all other protected routes. |
| **Impact** | The dashboard currently contains only mock data. The only actionable element (`KpiCard` → `navigate('/asset/increase')`) is permission-gated at the target route. |
| **Risk** | **Low** — acceptable in mock-data phase. **Must add auth guard before real data integration.** |
| **Recommendation** | Add `PermissionGuard` to the `/` route or add a `useEffect` in AppLayout to redirect unauthenticated users to `/login`. |

**Verdict: LOW RISK — acceptable now, must fix pre-production.**

### 2.4 CSRF / Cross-Site Request Forgery

| Vector | Analysis |
|---|---|
| **Dashboard actions** | The dashboard performs zero API calls — no `POST`, `PUT`, `DELETE`, or `PATCH` requests. The only navigation is client-side React Router (`navigate('/asset/increase')`), which changes URL without a server request. |
| **Risk** | **None** — no server-mutating actions exist on this page. |
| **Verdict** | CSRF is not in scope for a read-only, no-API page. |

**Verdict: NO CSRF surface. Acceptable.**

### 2.5 Dependency Security

| Dependency | Version (range) | Known CVEs | Notes |
|---|---|---|---|
| `react` | ^18 | None critical | Mature, actively maintained |
| `antd` | ^5 | None critical | Ant Design v5 has no active critical CVEs |
| `@ant-design/icons` | ^5 | None | Icon library, no execution context |
| `recharts` | ^2 | None critical | Visualization library, no server calls |
| `react-router-dom` | ^6 | None critical | Client-side routing only |

**Risk:** **Low** — all dependencies are mainstream, actively maintained, and used only for rendering. No runtime dependency introduces network calls or eval.

### 2.6 Clickjacking

| Vector | Analysis |
|---|---|
| **iframe embed** | No `Content-Security-Policy: frame-ancestors 'self'` header or meta tag detected in scope. |
| **Impact** | An attacker could embed the dashboard in an iframe. The only actionable element (navigate to `/asset/increase`) targets a permission-gated route. |
| **Risk** | **Low** — low business impact; target route is gated. Should be mitigated at the web server / reverse proxy level. |
| **Recommendation** | Add `Content-Security-Policy: frame-ancestors 'self'` in `index.html` or web server config (e.g., Nginx `add_header`). |

---

## 3. Security Scorecard

| Category | Rating | Notes |
|---|---|---|
| XSS (Reflected / Stored / DOM) | ✅ Pass | 0 dangerous patterns in 6 files |
| Sensitive Data Exposure | ✅ Pass | Mock data only; no PII/API keys |
| Authentication/Routing | 🟡 Low Risk | `/` route lacks PermissionGuard (mock phase acceptable) |
| CSRF | ✅ N/A | No state-changing server calls |
| Injection (SQL / Command / Path) | ✅ N/A | Zero backend calls |
| Dependency Supply Chain | ✅ Pass | All mainstream, no critical CVEs |
| Clickjacking | 🟡 Low Risk | CSP `frame-ancestors` not set |
| Secrets Management | ✅ Pass | No secrets in source code |
| Input Validation (URL params) | 🟡 Low Risk | province/type not validated against allowed options set |

---

## 4. Final Verdict

| Criterion | Assessment |
|---|---|
| **Overall Risk** | **LOW RISK** — read-only dashboard with mock data, zero API calls, React-safe rendering, and no sensitive data. |
| **Critical Findings** | None |
| **High Findings** | None |
| **Medium Findings** | None |
| **Must-Fix Pre-Production** | Add `PermissionGuard` to `/` route before connecting real API data |
| **Should-Fix (Low Priority)** | Validate URL params against allowed option values; add CSP `frame-ancestors 'self'` |

**Verdict: LOW RISK — Pass.**

The dashboard presents minimal attack surface in its current form. The primary risk (unauthenticated access to `/`) is acceptable during development with mock data but must be addressed before production data flows through this page. All other vectors (XSS, CSRF, injection) are structurally eliminated by the architecture (React JSX + zero backend calls + Ant Design controlled components).
