---
feature-id: M-024
document: dev-w1-implementation-summary
scope: v2 — dashboard-first, 6-block navigation (reopened cycle 2026-09-04)
status: done
source-of-truth: frontend/src/config/navigation.tsx
last-updated: 2026-09-04
---

# M-024 FE Dev Wave 1 — Implementation Summary (v2 dashboard-first navigation)

> Work order: M-024 v2 navigation — code đã implement inline (routing-off), KHÔNG
> re-implement. Dev wave-1 gồm 3 nhiệm vụ: (1) fix gate defect INC-039 trong
> `frontend/e2e/integration/menu-permissions.spec.ts`, (2) xác nhận (read-only) code
> hiện hữu khớp design plan + lean-spec AC-024, (3) viết summary này.
> Văn bản nghiệp vụ: `ba/00-lean-spec.md` (AC-024 §8); thiết kế: `design/00-design-plan.md`.
> Oracle QA: `qa/acceptance-map.json` (wave 1, 9 AC).

## 1. Duty 1 — Fix gate defect INC-039 (`tests_call_production`)

**File sửa duy nhất:** `frontend/e2e/integration/menu-permissions.spec.ts`
(90 dòng sau sửa; KHÔNG đụng `playwright.config.ts`, `AppLayout.test.tsx`, `navigation.tsx`).

| Thay đổi | Trước | Sau |
|---|---|---|
| Import production module | chỉ import `@playwright/test` | `import { NAV_GROUPS } from '../../src/config/navigation';` (dòng 1–4) — import module production duy nhất của menu model |
| 6 nhãn khối | mảng hardcode 6 string `'Quản lý KCHT hàng hải' … 'Quản trị hệ thống'` trong test T2 | `const groupLabels = NAV_GROUPS.map((group) => group.label);` — DERIVE từ `NAV_GROUPS` (giữ nguyên thứ tự kcht→admin trùng thứ tự cũ nên semantics T2 không đổi) |
| Hygiene (cùng file, zero-warning) | `const BASE_URL` unused; `function parseJwt(token): any` | bỏ `BASE_URL`; bỏ annotation `: any` (type inference giữ nguyên hành vi T1) |

Semantics/assertions của T1–T5 không đổi: T2 vẫn assert đủ 6 nhãn hiển thị trên
landing; T3 vẫn click `Quản trị hệ thống` → `/users` + assert không còn `PHÊ DUYỆT`;
T4/T5 giữ nguyên deep-link `/dai-ttdh` + VHF disabled.

## 2. Duty 2 — Confirm code v2 khớp design plan + lean-spec (ADDR 0039 anchors, mở trong phiên này)

| Yêu cầu thiết kế / lean-spec | Anchor đã mở (file:line) | Khớp |
|---|---|---|
| `NAV_GROUPS` 6 khối (BR-024-01) | `navigation.tsx:161` `export const NAV_GROUPS: NavGroup[]`; `GroupId` union 6 giá trị `'kcht'\|'asset'\|'plan'\|'gis'\|'report'\|'admin'` `:31`; labels `:164` (kcht), `:171` (asset), `:183` (plan), `:194` (gis), `:208` (report), `:218` (admin) | ✅ đúng 6 khối, đúng thứ tự |
| Cây 28 loại KCHT cha–con | `kchtTree` bắt đầu `navigation.tsx:76`; nhánh `kcht-vienthong` root `'Đài viễn thông hàng hải'` + `vhf-disabled` (`disabled: true`, `note`) ngay cuối cây (quan sát trực tiếp ~`:149-155`); 28 = số loại theo ma trận `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` (đếm node độc lập thuộc QA wave 2, acceptance-map AC-024-03) | ✅ cấu trúc + quy ước disabled |
| Helpers `groupOfPath` / `locateRoute` / `accessibleTree` / `firstAccessibleRoute` | `navigation.tsx:256`, `:312`, `:277`, `:294` (grep `^export (function…)`); kèm `findGroup :251`, `matchesRoute :241`, `SEGMENT_ALIAS :235`, `collectRoutes :332` | ✅ đủ 4 helper thiết kế yêu cầu |
| AppLayout sidebar-per-block qua `buildNavMenuItems` | `AppLayout.tsx:43` import helpers; `buildNavMenuItems` `:119`; `activeGroup = groupOfPath(location.pathname)` `:277`; `menuItems = filterEmptyChildren(activeGroup ? buildNavMenuItems(activeGroup, canAccessMenu, navigate) : rawMenuItems)` `:545` | ✅ sidebar chỉ cây khối active |
| Landing-note ở `/` + nút `'Về trang chủ'` | `AppLayout.tsx:689` note `'Chọn một khối chức năng bên phải để bắt đầu.'`; nút `title="Về trang chủ"` `:642` | ✅ |
| HomeLanding landing 6 card | `HomeLanding.tsx:19` import `NAV_GROUPS, firstAccessibleRoute`; `NAV_GROUPS.map` `:58`; `home = firstAccessibleRoute(group, canAccessRoute)` `:59`; `disabled = !home` `:60`; render label/disabled `:65-89` | ✅ 6 card + trạng thái không quyền |
| App.tsx `'/'→HomeLanding`, `'/dashboard'→HomePage` | `App.tsx:145` `<Route path="/" element={<HomeLanding />} />`; `:146` `<Route path="/dashboard" element={<HomePage />} />`; lazy `:45-46` | ✅ dashboard-first |
| Không còn nhóm PHÊ DUYỆT (AC-024-07) | `GroupId :31` chỉ 6 id, không có id phê duyệt; cây kcht đọc hết không còn nhánh `PHÊ DUYỆT` | ✅ |

**Kết luận Duty 2:** implementation hiện hữu khớp design plan §1/§3 và lean-spec AC-024
— xác nhận bằng anchor đã mở trực tiếp (không phải register claim). Không phát hiện sai lệch
cần sửa code; design plan (sau khi SA sửa citation `SEGMENT_ALIAS`) dẫn đúng các anchor trên.

## 3. Duty 3 — Mapping AC-024-01..09 → implementation anchor

| AC | Nội dung (lean-spec §8) | Implementation anchor | E2E battery (spec file, semantics giữ nguyên) |
|---|---|---|---|
| AC-024-01 | Landing `/` hiển thị 6 khối (cổng vào) | `HomeLanding.tsx:58-89` + `App.tsx:145` | T2 |
| AC-024-02 | Click khối → route đầu khối + sidebar cây khối | `HomeLanding.tsx:59` (`firstAccessibleRoute`) → navigate; `AppLayout.tsx:119/545` | T3 (admin → `/users`) |
| AC-024-03 | Cây kcht đủ 28 loại theo ma trận cha–con | `navigation.tsx:76-155` (`kchtTree`) | T4 (đếm node/chuỗi cha–con — QA wave 2) |
| AC-024-04 | Nhánh `Đài viễn thông hàng hải` root riêng; VHF disabled không navigate | `navigation.tsx` nhánh `kcht-vienthong` (~`:149-155`) | T4, T5 |
| AC-024-05 | User thiếu quyền → node ẩn; submenu hết con → ẩn nhánh | `navigation.tsx:277` (`accessibleTree`) + `canAccessMenu`; `AppLayout.tsx:545` (`filterEmptyChildren`) | QA wave 2 (user hạn chế) |
| AC-024-06 | Click node lá navigate đúng; selected/openKeys đồng bộ | `navigation.tsx:312` (`locateRoute`) → `{key, openKeys}`; `AppLayout.tsx:552-554` | T3/T5 (URL giữ nguyên khi click disabled) |
| AC-024-07 | Không còn nhóm PHÊ DUYỆT trong menu | `navigation.tsx:31/161` (6 khối, không có phê duyệt) | T3 (`getByText(/PHÊ DUYỆT/i)` count 0) |
| AC-024-08 | `/dashboard` truy cập được (Dashboard KPI) | `App.tsx:146` → `HomePage` | QA wave 2 |
| AC-024-09 | Deep-link suy đúng khối + mở đúng nhánh | `navigation.tsx:256` (`groupOfPath`) + `:235` (`SEGMENT_ALIAS`) + `:241` (`matchesRoute`) | T4 (`goto('/dai-ttdh')`) |

## 4. Verification evidence (đã chạy trong phiên này)

- **Typecheck (required gate):** `./node_modules/.bin/tsc --noEmit` — exit 0, không output.
  Ghi chú môi trường: `corepack pnpm exec tsc --noEmit` KHÔNG chạy được vì pnpm 11
  auto-install chạy `pnpm install --frozen-lockfile` và fail sẵn có
  `ERR_PNPM_OUTDATED_LOCKFILE` (package.json thêm 11 deps — leaflet/echarts/recharts/vitest… —
  mà `pnpm-lock.yaml` chưa cập nhật; lỗi có trước, không thuộc change này). Đã chạy đúng
  binary mà `pnpm exec` sẽ resolve: `frontend/node_modules/.bin/tsc` — exit 0.
- Dependencies: cài bằng `corepack pnpm install --lockfile=false` (KHÔNG ghi đè
  `pnpm-lock.yaml` — repo sạch, không file tracked nào bị sửa ngoài spec file).
- `lsp diagnostics` trên spec file: **No errors or warnings reported** (đã dọn 2 warning
  biome pre-existing: `BASE_URL` unused, `any` explicit).
- Không chạy backend (đúng constraint); không chạy e2e (cần webServer wave 2 — oracle QA).

**Files modified:** chỉ `frontend/e2e/integration/menu-permissions.spec.ts`.
**Files written:** file này (dev summary). Không chạy `git add/commit/push` — thay đổi để local unstaged.

## 5. Risks / notes

- **Stale lockfile (pre-existing):** `frontend/pnpm-lock.yaml` lệch `frontend/package.json`
  (11 deps). Bất kỳ `pnpm install --frozen-lockfile`/`pnpm exec` nào sẽ fail cho tới khi
  lockfile được cập nhật — nên xử lý ở một change riêng (không thuộc M-024 scope).
- Vòng typecheck dùng TypeScript 6.0.3 (fresh install) — nếu môi trường chuẩn khác version,
  chạy lại gate sau khi lockfile được đồng bộ.
- AC-024-05/08 phủ bởi QA wave 2 (acceptance-map); spec file T1–T5 không cover 2 AC này.
