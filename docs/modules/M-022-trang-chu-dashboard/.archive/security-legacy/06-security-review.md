# Security Architect Review — M-022 Trang chủ Dashboard

| Field | Value |
|---|---|
| **Feature ID** | M-022 |
| **Feature Name** | Trang chủ Dashboard |
| **Stage** | engineering-security-auditor |
| **Agent** | utility-security-auditor-review |
| **Verdict** | **LOW RISK** (updated for real-API state) |
| **Date** | 2026-07-13 |
| **Review Mode** | `review` — implementation-level |
| **BA Specs Reviewed** | F-280, F-281, F-282, F-283, F-284 (all updated 2026-07-13) |
| **Source Files Reviewed** | `Home.tsx`, `dashboardApi.ts`, `dashboardTypes.ts`, `api.ts`, `FilterContext.tsx`, `DashboardMap.tsx`, `App.tsx`, `AppLayout.tsx`, `authStore.ts` |
| **Previous Review Date** | 2026-07-10 |
| **Key Delta** | Mock-only → Real API integration (8 fetch functions + Leaflet map) |

---

## 1. Scope & Threat Surface

M-022 is a **read-only analytics dashboard** rendered inside `AppLayout`. It now makes **real API calls** to 8 parallel endpoints via `dashboardApi.fetchAll()` with per-block mock fallback via `Promise.allSettled`. The dashboard displays aggregated KPIs, ECharts stacked/polar bar charts, approval progress bars, a Leaflet map with Google Maps tiles, and a 10-row infrastructure table.

**Changes from prior review (2026-07-10):**
- Zero API calls → 8 fetch functions + 2 approval stats + `fetchYearOverYear`
- Map placeholder → Real Leaflet map loaded dynamically from unpkg CDN
- Recharts → ECharts (no XSS regression)
- 4 cargo types → 6 cargo types (all hardcoded series names)
- Province/infraType filters confirmed cosmetic-only (hardcoded `null` in API calls)

---

## 2. Threat Domain Assessment

### 2.1 Cross-Site Scripting (XSS)

| Vector | Analysis |
|---|---|
| **URL query params** | `FilterContext.tsx:23-29` reads `searchParams.get('year'\|'province'\|'type')`. Values flow into Ant Design `<Select>` controlled component — rendered via React JSX, not `innerHTML`. Province/type are cosmetic-only (never reach API). Year parsed to int with NaN→2026 fallback. |
| **ECharts tooltip HTML** | `Home.tsx:268-280` builds custom HTML tooltip via template literals. **Series names are hardcoded constants** (`'Nội địa', 'Nhập khẩu', ...`) — no user input or API response data flows into the tooltip HTML. |
| **Ant Design Table render** | `Home.tsx:198-231` — all `render` functions return React JSX. `pillBadge()` returns React `<span>` elements. Zero `dangerouslySetInnerHTML`. |
| **Render paths** | No `dangerouslySetInnerHTML`, `eval`, or `setTimeout(string)` anywhere in the reviewed files. ECharts, Ant Design, and Leaflet all use safe rendering within the React tree. |
| **Leaflet DOM injection** | Leaflet loads markers/popups via DOM. Currently no KCHT GeoJSON overlay is rendered (empty map). When overlays are added, ensure GeoJSON `properties` fields are escaped (Leaflet's `L.geoJSON()` and `bindPopup()` use `innerHTML` by default — see Must-Fix SF-004). |
| **Risk** | **Low** — no active XSS vector in current code. Series names are hardcoded. Template-literal tooltip uses only numbers + known strings. **Must verify when GeoJSON overlays are wired (future).** |

**Evidence:** Source review of all files — 0 instances of `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or template-literal HTML construction with user data.

**Verdict: NO active XSS surface. Future concern flagged for GeoJSON overlay integration (SF-004).**

### 2.2 Sensitive Data Exposure

| Vector | Analysis |
|---|---|
| **API response data** | All 8 API endpoints return aggregate statistics (tonnage, vessel counts, approval counts, asset status counts). Zero instances of PII, personal data, financial transactions, or user credentials in any response. |
| **JWT token** | Managed by `authStore.ts` (M-010 auth module). Stored in `localStorage`. Dashboard never reads or exposes the token. Axios interceptor (`api.ts:18-24`) auto-attaches the Bearer token — standard pattern. |
| **API request URLs** | URL paths contain endpoint names (`/cargo/summary`, `/assets/status`, `/ho-so-xu-ly`) but no sensitive data. Query params pass `periodType`, `page`, `size` — no secrets. |
| **Mock data** | All mock data is synthetic (port names: Hải Phòng, Đà Nẵng, Cái Mép – Thị Vải; numeric figures). No real production data leaked. |
| **Risk** | **None** — no sensitive data in transit or at rest in this module. |

**Verdict: NO sensitive data exposure. Acceptable.**

### 2.3 Authentication & Route Protection

| Vector | Analysis |
|---|---|
| **Route guard** | `App.tsx:124` — `<Route path="/" element={<HomePage />} />` has NO `PermissionGuard` wrapper. **All 80+ other routes use `PermissionGuard`.** |
| **Impact** | The dashboard now displays **real API data** (aggregate statistics). Unauthenticated users who know the URL can view dashboard KPIs, charts, approvals, and the map. |
| **AppLayout auth** | `AppLayout.tsx` reads `user` from authStore but does NOT redirect to `/login` for unauthenticated users. Dashboard renders regardless of auth state. |
| **Defense in depth** | The backend API endpoints are themselves protected by Spring Security (`/api/v1/integration/share/*`). An unauthenticated request would return 401, and the `api.ts` response interceptor (line 106-111) handles 401 by clearing the token and redirecting to `/login`. This means the **frontend renders but shows mock data fallback** for unauthenticated users. |
| **Risk** | **Low** — backend enforces auth at the API level. Unauthenticated users see fallback mock data (synthetic figures), not real data. However, the route is still accessible and should be hardened. |
| **Recommendation** | Add `PermissionGuard` to the `/` route with a broad permission (e.g., `'dashboard:view'` or fallback to any authenticated role). This aligns with the pattern used by all other routes. |

**Verdict: LOW RISK — backend auth provides defense-in-depth. Mock data shown to unauthenticated users. Should fix for consistency with rest of app.**

### 2.4 CSRF / Cross-Site Request Forgery

| Vector | Analysis |
|---|---|
| **Dashboard actions** | The dashboard performs **zero state-changing operations** — all API calls are `GET` requests. No `POST`, `PUT`, `DELETE`, or `PATCH`. |
| **Navigation** | The only navigation is `navigate('/asset/increase')` from pending approval cards — client-side React Router (no server request). Target route has `PermissionGuard`. |
| **Risk** | **None** — no state-changing endpoints accessed from this module. |

**Verdict: CSRF not in scope for read-only GET-only page.**

### 2.5 API Response Validation & Data Poisoning (NEW — added for API integration)

| Vector | Analysis |
|---|---|
| **Response envelope validation** | 7 of 8 fetch functions (`fetchCargoTotal`, `fetchCargoMonthly`, `fetchCargoAnnual`, `fetchCargoPassenger`, `fetchCargoDomestic`, `fetchCargoManagedArea`, `fetchAssetStatus`, `fetchApprovals`) ALL check `res.data.success` before accessing `.data.content` or `.data`. |
| **SF-001: fetchYearOverYear** | `dashboardApi.ts:184-212` — `fetchYearOverYear` accesses `currentRes.data.data.content` WITHOUT checking `res.data.success`. If API returns `{ success: false, data: null }`, accessing `.content` on null throws `TypeError: Cannot read properties of null (reading 'content')`. **Mitigation:** `fetchYearOverYear` is NOT called by the main `fetchAll()` pipeline — it is exported but unused by the dashboard data flow. Latent bug. |
| **fetchAssetApprovalStats / fetchKchtApprovalStats** | `dashboardApi.ts:175-187` — These use a try/catch with no `res.data.success` check. They fall through to `res.data?.data || default`. If the API returns 200 with `{ success: false, data: null }`, they silently return zeroed stats with no error indication. |
| **API response structure** | All API responses follow `ApiResponse<T> = { success: boolean, message: string, data: T, timestamp: string }`. Success field is checked in all main pipeline calls. |
| **Data type validation** | None of the fetch functions validate the **shape** of the response beyond the TypeScript interface. If a backend returns a structurally different object (e.g., `totalTons` as string instead of number), it would propagate through transforms and potentially cause rendering errors in ECharts. This is a **data integrity risk**, not a security vulnerability per se. |
| **Mock data fallback** | `fetchWithFallback` silently falls back to `MOCK_DATA` on ANY API failure. Users see synthetic data with no visible indicator. `console.warn` is written but no badge/"Dữ liệu mẫu" indicator is shown in the UI. |
| **Risk** | **Low** — main pipeline validates `success` flag. SF-001 is latent (unused). Approval stats endpoints have weaker validation. Mock fallback is visible only in dev console. |

**Verdict: LOW RISK. Fix SF-001 (fetchYearOverOver success check) before wiring it into the data pipeline. Consider adding mock-data badge per TrendChartCard pattern.**

### 2.6 Dependency Supply Chain

| Dependency | Version (range) | Known CVEs | Deployment | Notes |
|---|---|---|---|---|
| `react` | ^18 | None critical | Bundled | Mature, actively maintained |
| `antd` | ^5 | None critical | Bundled | Ant Design v5 no active critical CVEs |
| `echarts` | ^5 | None critical | Bundled | Mature visualization library |
| `echarts-for-react` | ^3 | None | Bundled | Thin wrapper, no network calls |
| `react-router-dom` | ^6 | None critical | Bundled | Client-side routing |
| `leaflet` | 1.9.4 | None critical | **Dynamic unpkg CDN** | **See SF-002** |
| `axios` | ^1 | None critical | Bundled | HTTP client |

#### SF-002: Leaflet CDN Supply Chain Risk (NEW — HIGH SEVERITY)

`DashboardMap.tsx:16-20` loads Leaflet CSS and JS dynamically from unpkg CDN:

```typescript
link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
```

**Risks:**
1. **No Subresource Integrity (SRI):** No `integrity` hash attribute on either the `<link>` or `<script>` tag. If unpkg is compromised, the served Leaflet bundle could contain malicious code.
2. **Full DOM and localStorage access:** The injected script runs in the same origin context — it can access `localStorage.getItem('auth_token')`, read form inputs, modify the DOM, and make authenticated API calls on behalf of the user.
3. **No fallback:** If unpkg is unreachable, the map silently fails (no tile layer renders, no error shown).
4. **Version pin at 1.9.4:** URL is pinned to a specific version, reducing but not eliminating the supply-chain risk.

**Mitigation options:**
- **Recommended:** Add SRI hashes to both Leaflet CSS and JS tags (generated from the official `leaflet@1.9.4` assets on unpkg).
- **Alternative:** Bundle Leaflet via npm (`npm install leaflet`) instead of CDN load — this eliminates the runtime supply-chain risk entirely but requires a rebuild.
- **Fallback:** Add error states with user-visible messages when Leaflet fails to load.

**Verdict: MEDIUM RISK. Add SRI integrity hashes or bundle Leaflet via npm. See Must-Fix SF-002.**

### 2.7 URL Query Param Injection (UPDATED for current scope)

| Vector | Analysis |
|---|---|
| **year param** | `FilterContext.tsx:24` — `parseInt(yearParam, 10)` with NaN→2026 fallback. **No range validation** (e.g., `year >= 2020 && year <= 2026`). Extremes like `year=9999` or `year=-1` would parse and pass to API calls. |
| **province param** | `FilterContext.tsx:25` — stored as raw string, passed as `null` to API in v1 (cosmetic-only). **Validated: not wired to API.** |
| **type param** | `FilterContext.tsx:26` — stored as raw string, passed as `null` to API in v1. **Validated: not wired to API.** |
| **URL encoding** | `URLSearchParams` auto-encodes values. Ant Design `<Select>` only renders from hardcoded option arrays — invalid values don't appear in the dropdown. |
| **Future risk** | When province/infraType filtering is wired in v2, unvalidated string values from URL params will be passed directly to API query parameters. This could enable **NoSQL injection** or **mass assignment** if the backend doesn't validate inputs. |
| **Risk** | **Low (current)** — province/type don't reach API in v1. **High (future)** — MUST validate against allowed options list before wiring. |

**Verdict: LOW RISK for current v1. Add allowlist validation before v2 wiring.**

### 2.8 Clickjacking

| Vector | Analysis |
|---|---|
| **iframe embed** | No `Content-Security-Policy: frame-ancestors 'self'` header detected. Same as previous review — still unaddressed. |
| **Impact** | Dashboard could be embedded in an iframe. All data is read-only aggregate statistics (no user actions), limiting damage. |
| **Risk** | **Low** — unchanged from prior review. Should be mitigated at web server/reverse proxy level. |

**Verdict: LOW RISK. Mitigate at infrastructure layer.**

### 2.9 Google Maps Tile Terms of Service (NEW — Legal/Compliance)

| Vector | Analysis |
|---|---|
| **Tile URL** | `DashboardMap.tsx:33` — `https://mt1.google.com/vt/lyrs=m&hl=vi&gl=vn&x={x}&y={y}&z={z}` |
| **API Key** | No API key is used. Google's tile service works without one for low-volume use but may be rate-limited or blocked per referrer. |
| **Attribution** | Empty `attribution: ''` — violates Google Maps Platform Terms of Service which require attribution text. |
| **Risk** | **Low (Legal)** — not a security vulnerability. Legal/compliance risk if Google enforces ToS. |
| **Recommendation** | Either add proper Google Maps attribution string, use a free tile provider (e.g., OpenStreetMap with proper attribution), or add a Google Maps API key if the project has one. |

**Verdict: COMPLIANCE RISK, not security. Fix attribution or switch tile provider.**

---

## 3. New Vectors Summary

| # | Vector | Severity | Block | Status | Source |
|---|--------|----------|-------|--------|--------|
| SF-001 | `fetchYearOverYear` missing `ApiResponse.success` validation | 🟡 Medium | Trend Charts (F-282) | **Latent (unused)** — not called by main pipeline. Fix before wiring. | `dashboardApi.ts:184-212` |
| SF-002 | Leaflet CDN without SRI hash | 🟡 Medium | Map (F-284) | **Active risk** — unpkg-loaded script has full origin access. | `DashboardMap.tsx:16-20` |
| SF-003 | `.catch()` swallows `fetchYearOverYear` errors silently | 🟢 Low | Home.tsx data pipeline | Active — `catch(() => setDashboardData(MOCK_DATA))` at Home.tsx:119 | `Home.tsx:119` |
| SF-004 | Leaflet GeoJSON `bindPopup()` uses `innerHTML` | 🟢 Low/Future | Map (F-284) | **Future risk** — Leaflet's default popup sets innerHTML. When KCHT overlays are added, ensure `properties` are sanitized. | `DashboardMap.tsx` (no overlays yet) |
| SF-005 | Google Maps tiles without attribution | 🟢 Low (Legal) | Map (F-284) | Active ToS compliance gap | `DashboardMap.tsx:33-36` |
| SF-006 | Province/infraType URL params not validated against allowlist | 🟡 Medium/Future | FilterBar (F-280) | Current: cosmetic-only (hardcoded null). **Before v2 wiring: add allowlist validation.** | `FilterContext.tsx:25-26` |
| SF-007 | Mock data fallback provides no user-visible indicator | 🟢 Low | All blocks | Users see synthetic data without knowing. `console.warn` only. | `dashboardApi.ts:195+` |

---

## 4. Compliance Considerations

| Standard | Requirement | Status | Gap |
|----------|------------|--------|-----|
| **OWASP ASVS V5** (Input Validation) | Validate all input from URL params | 🟡 Partial | Year has type validation but no range check. Province/type have no allowlist (cosmetic-only in v1). |
| **OWASP ASVS V14** (Configuration) | Subresource Integrity for CDN resources | ❌ **Fail** | Leaflet CDN has no SRI integrity attribute (SF-002). |
| **OWASP ASVS V8** (Data Protection) | Validate API responses before use | 🟡 Partial | Main pipeline checks `success` flag. `fetchYearOverYear` does not (SF-001). `fetchAssetApprovalStats`/`fetchKchtApprovalStats` do not. |
| **Google Maps ToS** | Display attribution | ❌ **Fail** | Empty `attribution: ''` (SF-005). |
| **Vietnam ATTT** (Cybersecurity Law) | Authentication for data systems | ✅ Pass | Backend enforces auth at API level. Dashboard uses existing JWT flow. |
| **OWASP ASVS V3** (Session Management) | Token stored securely | 🟡 Partial | JWT in localStorage (pre-existing architecture decision). Dashboard does not add new exposure. |

---

## 5. Security Scorecard

| Category | Rating | Notes |
|---|---|---|
| XSS (Reflected / Stored / DOM) | ✅ Pass | 0 dangerous patterns. Tooltip HTML uses only hardcoded data. |
| Sensitive Data Exposure | ✅ Pass | No PII, no secrets in dashboard data. |
| Authentication/Routing | 🟡 Low Risk | `/` route lacks PermissionGuard but backend enforces API auth. Unauthenticated users see mock data. |
| CSRF | ✅ N/A | Zero state-changing operations (all GET). |
| API Response Validation | 🟡 Low Risk | Main pipeline validates `success`. SF-001 is latent. Approval stats endpoints have weaker validation. |
| Input Validation (URL params) | 🟡 Low Risk | Year type-validated. Province/type cosmetic-only in v1. Must-fix before v2 wiring. |
| Dependency Supply Chain | 🟡 Medium Risk | **SF-002: Leaflet CDN without SRI hash.** Unpkg-loaded script has full origin access. |
| Clickjacking | 🟡 Low Risk | CSP `frame-ancestors` not set. Infrastructure-level mitigation. |
| Secrets Management | ✅ Pass | No secrets in source code. JWT in localStorage (existing pattern). |
| Legal/Compliance | 🟡 Low Risk | Google Maps attribution missing (SF-005). ToS risk. |

---

## 6. Must-Fix Items

| ID | Finding | Owner | Expected Evidence | Closure Criteria |
|----|---------|-------|-------------------|-----------------|
| **SF-002** | Leaflet CDN loaded without SRI hash — supply chain risk | Frontend Dev | Leaflet `<link>` and `<script>` tags have `integrity` attribute matching official leaflet@1.9.4 subresource hashes, OR Leaflet bundled via npm instead of CDN | `grep -r 'unpkg.com/leaflet' DashboardMap.tsx` returns 0 OR `integrity=` present on both link and script tags |
| **SF-001** | `fetchYearOverYear` accesses `.data.content` without `res.data.success` check | Frontend Dev | Function checks `res.data.success` before accessing `.data.data.content` and `.data.data.content.filter(...)` | `fetchYearOverYear` has `if (!res.data.success) throw new Error(...)` before data access |
| **SF-006** | Province/infraType URL params not validated against allowed values | Frontend Dev | Add allowlist validation when province/infraType move from `null` to real API params in v2 | `FilterContext.tsx` validates province and type against allowed option arrays before storing or before passing to API |

---

## 7. Should-Fix Items

| ID | Finding | Risk if Deferred | Priority |
|----|---------|------------------|----------|
| SF-003 | Mock data fallback provides no user-visible indicator | Users make decisions based on stale/synthetic data | Low — add when TrendChartCard is wired |
| SF-004 | Leaflet `bindPopup()` uses innerHTML — monitor when GeoJSON overlays are added | XSS via crafted GeoJSON properties | Low — no overlays currently rendered |
| SF-005 | Google Maps missing attribution | ToS violation, potential service block | Low — legal/compliance, not security |
| SF-007 | `/` route lacks PermissionGuard | Inconsistent with app-wide pattern, minor auth gap | Low — backend enforces API-level auth |

---

## 8. Final Verdict

| Criterion | Assessment |
|---|---|
| **Overall Risk** | **LOW RISK** — currently acceptable for deployment with known mitigations. |
| **Critical Findings** | None |
| **High Findings** | None |
| **Must-Fix (Pre-Prod)** | **SF-002**: Add SRI hashes to Leaflet CDN or bundle via npm. |
| **Should-Fix (Medium Priority)** | **SF-001**: Fix `fetchYearOverYear` success validation before wiring into data pipeline. |
| **Should-Fix (Low Priority)** | SF-003 through SF-007 as above. |
| **Key Improvement from v1** | 8 API fetch functions all check `res.data.success` in the main pipeline — good response validation hygiene. `Promise.allSettled` ensures per-block failure isolation. |

**Verdict: LOW RISK — Pass with 1 Must-Fix (SF-002: Leaflet CDN SRI).**

The dashboard's migration from mock-only to real API data introduced several new vectors, but the codebase handles them with reasonable care:
- **Main API pipeline** validates the `ApiResponse.success` envelope before accessing data ✅
- **Per-block failure isolation** via `Promise.allSettled` prevents any single API failure from crashing the page ✅
- **Backend API-level auth** provides defense-in-depth despite missing frontend PermissionGuard ✅
- **No sensitive data** is exposed across any of the 8 endpoints ✅
- **Zero state-changing operations** eliminates CSRF risk ✅

The **primary concern** is the Leaflet CDN supply chain (SF-002) — adding SRI hashes or switching to npm-bundled Leaflet closes this gap before production deployment.
