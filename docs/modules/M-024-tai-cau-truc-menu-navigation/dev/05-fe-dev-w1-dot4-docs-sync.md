# FE Dev — Đợt 4 Docs-Sync: Xác nhận trạng thái code (không code change)

- **Stage:** engineering-frontend-developer-wave-1 (wave 1) — nhiệm vụ docs-sync đợt 4
- **Module:** M-024 — Tái cấu trúc menu navigation (F-292)
- **Ngày:** 2026-09-03 (phiên làm việc hiện tại)
- **Phạm vi:** Xác nhận (read-only) code đợt 4 đã hiện diện đúng tại `frontend/src/components/AppLayout.tsx`, `frontend/src/themetokenchk.ts`, `frontend/src/theme.ts` — **KHÔNG có code change nào** trong phiên này và không sửa bất kỳ file code/theme/token/test nào.

## Kết luận

Code đợt 4 đã ở đúng trạng thái thiết kế (design/00-design-plan.md, anchor đã được SA sửa và chốt). Toàn bộ anchor dưới đây được xác nhận bằng grep/read trực tiếp trong phiên này — khớp 100% với số dòng và giá trị nêu trong dispatch note. **Không cần thay đổi gì.**

## Bảng anchor đã xác nhận (verify bằng grep trực tiếp, 2026-09-03)

| # | Nội dung anchor | Vị trí | Giá trị quan sát được | Khớp |
|---|---|---|---|---|
| 1 | `AppLayout.tsx` import từ `themetokenchk` | dòng 41–42 | `import { layout } from '../themetokenchk';` (41), `import * as themeTokenChk from '../themetokenchk';` (42) | ✅ |
| 2 | `AppLayout.tsx` import `ThemeTokenProvider` | dòng 43 | `import { ThemeTokenProvider } from '../context/ThemeTokenContext';` | ✅ |
| 3 | Wrap `ThemeTokenProvider` — Sider | dòng 717 | `<ThemeTokenProvider tokens={themeTokenChk}>` | ✅ |
| 4 | Fallback `var(--bg-sidebar, #1a3f83)` — Sider | dòng 729 | `background: isMenuFullScreen ? '#fff' : 'var(--bg-sidebar, #1a3f83)',` | ✅ |
| 5 | Wrap `ThemeTokenProvider` — Drawer | dòng 740 | `<ThemeTokenProvider tokens={themeTokenChk}>` | ✅ |
| 6 | Fallback `var(--bg-sidebar, #1a3f83)` — Drawer | dòng 745 | `styles={{ body: { padding: 0, background: 'var(--bg-sidebar, #1a3f83)' }, wrapper: { width: 260 } }}` | ✅ |
| 7 | `themetokenchk.ts` `sidebarBg` | dòng 73 | `export const sidebarBg = '#1a3f83';` | ✅ |
| 8 | `themetokenchk.ts` `sidebarActiveBg` | dòng 85 | `export const sidebarActiveBg = '#1B84FF';` | ✅ |
| 9 | `themetokenchk.ts` `sidebarSearchBg` | dòng 88 | `export const sidebarSearchBg = 'rgba(255, 255, 255, 0.12)';` | ✅ |
| 10 | `themetokenchk.ts` export `themeCssVariables` | dòng 487 | `export const themeCssVariables: Record<string, string> = {` | ✅ |
| 11 | CSS vars trong `themetokenchk.ts` | dòng 505–507 | `'--bg-sidebar': sidebarBg` (505), `'--sidebar-search-bg': sidebarSearchBg` (506), `'--sidebar-active-bg': sidebarActiveBg` (507) | ✅ |
| 12 | `theme.ts` `sidebarBg` REVERT | dòng 50 | `sidebarBg: '#12468C',      // nền sidebar xanh dương đồng nhất (v3)` | ✅ |

### Ghi chú thêm (trạng thái nguyên khối, không bị xáo trộn)

- `themetokenchk.ts` dòng 100–102 export nhóm `sidebarBg`/`sidebarActiveBg`/`sidebarSearchBg`; dòng 460–468 map các token này vào `components` AntD (`siderBg`, `darkItemBg`, `darkSubMenuItemBg`, `darkItemHoverBg` = `sidebarBg`; `darkItemSelectedBg` = `sidebarActiveBg`).
- `theme.ts` dòng 287 vẫn gán `--bg-sidebar: ${colors.sidebarBg}` (tức `#12468C`) — đúng thiết kế: `theme.ts` (nền v3 `#12468C`) giữ vai trò global fallback, còn `themetokenchk.ts` (CHK `#1a3f83`) là nguồn hiệu lực cho Sidebar/Drawer khi bọc `ThemeTokenProvider`.

## Đối chiếu sidebar-search (đợt 1 — đã xong, giữ nguyên)

Nhiệm vụ đợt này là docs-sync và **không** sửa code, nên trạng thái chức năng search sidebar (đợt 1) chỉ được xác nhận là **còn nguyên vẹn**, không phải là đối tượng thay đổi:

| Nội dung | Vị trí quan sát | Trạng thái |
|---|---|---|
| `filterMenuByQuery` (export, trim→lowercase→substring trên `label` string; submenu giữ nếu ≥1 descendant khớp; empty/whitespace trả về chính `items`) | AppLayout.tsx 141–153 | Nguyên vẹn |
| `collectOpenableKeys` (export, gom key của mọi node có children) | AppLayout.tsx 155–161 | Nguyên vẹn |
| `searchQuery` state + `setSearchQuery` | AppLayout.tsx 172 | Nguyên vẹn |
| Lọc sau permission gating: `menuItems = filterEmptyChildren(rawMenuItems)` (513) → `displayedItems`/`effectiveOpenKeys` (515–518) | AppLayout.tsx 513–518 | Nguyên vẹn |
| Input có kiểm soát, `placeholder="Tìm kiếm"` (tiếng Việt có dấu), không form/không Enter/không API | AppLayout.tsx 583–589 | Nguyên vẹn |
| Menu render `items={displayedItems}` + `openKeys={effectiveOpenKeys}` | AppLayout.tsx 599/601 | Nguyên vẹn |
| CSS class `.sidebar-search` | đã tồn tại trong theme.ts (không sửa) | Nguyên vẹn |

## Xác nhận hành vi — phiên này (executed verification)

Phiên này là docs-sync (không có code change), nhưng để đáp ứng verification gate, đã chạy lại kiểm chứng thực thi trong `frontend/`:

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | exit 0 (không có lỗi typecheck) |
| `npx vitest run src/components/AppLayout.test.tsx` | 1 file passed, **18/18 tests passed** (13ms) |

Test file `frontend/src/components/AppLayout.test.tsx` tồn tại và được vitest thu thập (không bị loại khỏi collection). 18 test khớp đúng oracle QA-w1: `filterMenuByQuery` A1–A13 (label match, `.trim` VAL-024-06, whitespace-only restore cùng reference, case-insensitive, parent/child keep+drop D-5a, divider hygiene, restore-on-clear, output⊆input, ReactNode-label guard, no-mutation, empty-result) + `collectOpenableKeys` B1–B5 (auto-open recursive, không key mồ côi, empty/flat → [], deterministic, chain ≥3 cấp). Bằng chứng trạng thái code cũng đã được QA-w1 và code-reviewer xác nhận ở các stage trước. Mọi khẳng định anchor trong tài liệu này đều từ grep/read trực tiếp phiên hiện tại.

## Không có thay đổi gì trong phiên này

- ✅ Không sửa `AppLayout.tsx`, `themetokenchk.ts`, `theme.ts`, `tokens.ts` hay bất kỳ file test nào.
- ✅ Không chạy `git` (tuân thủ ràng buộc).
- ✅ Không có migration, không sửa backend, không sửa màn hình module khác, không thêm dependency.
- ✅ File duy nhất được tạo trong phiên này: tài liệu summary này.
