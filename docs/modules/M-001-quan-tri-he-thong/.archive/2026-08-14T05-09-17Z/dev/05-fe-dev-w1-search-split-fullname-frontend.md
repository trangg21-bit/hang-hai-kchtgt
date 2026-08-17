# FE Dev Summary — Wave 1: Tách ô tìm kiếm (search + fullName) — F-001

**Stage:** engineering-frontend-developer-wave-1
**Module:** M-001 — Quản trị hệ thống
**Feature:** F-001 — Quản lý tài khoản người dùng (bộ lọc màn danh sách)
**Ngày:** 2026-08-14
**Trạng thái:** Pass (build xanh)

## 1. Objective

Tách 1 ô tìm kiếm của bộ lọc màn hình Quản lý người dùng thành 2 ô input riêng biệt theo
`docs/modules/M-001-quan-tri-he-thong/ba/00-lean-spec.md` (AC-001-15..19, BR-001-07..11):

| Ô input | Tham số API | Ý nghĩa |
|---|---|---|
| Ô 1 — "Tìm theo email / tên đăng nhập" | `search` | email HOẶC username (LIKE contains, case-insensitive) |
| Ô 2 — "Tìm theo họ tên" | `fullName` | họ tên, không phân biệt dấu (backend xử lý qua `toSearchLike`) |

Cả hai AND-kết hợp với tab trạng thái + bộ lọc đơn vị; `statusCounts` trả về từ backend phản ánh
cùng tập filter kết hợp (bao gồm `fullName` mới).

## 2. Files changed (chỉ 3 file, đúng write-surface)

### 2.1 `frontend/src/hooks/useUsers.ts`
- `interface ListParams` thêm `fullName?: string;` (sau `search`). Dòng hiện tại:
  `search?: string;` → `search?: string;` + `fullName?: string;`
- `useUsers(params)` không đổi logic — queryKey `['users', params]` đã bao gồm object params nên
  `fullName` mới tự động tham gia vào cache key và truyền xuống `userService.list(params)`.

### 2.2 `frontend/src/services/userService.ts`
- `list()`: thêm `fullName?: string;` vào type params.
- Gửi lên API: `fullName: params.fullName?.trim() || undefined` — whitespace → không gửi (AC-001-19).

### 2.3 `frontend/src/pages/UsersPage.tsx`
- State mới: `fullNameInput` (raw input) + `fullName` (giá trị đã commit), song song với
  `searchInput`/`search` hiện có.
- `useUsers({ page, pageSize, search: search || undefined, fullName: fullName || undefined, ... })`.
- `handleFilterApply`: `const nextFullName = fullNameInput.trim();` — so sánh `nextFullName === fullName`
  trong `sameFilters`, `setFullName(nextFullName)`, deps cập nhật đủ (`fullName`, `fullNameInput`).
- `handleFilterReset`: reset cả 2 ô (`setFullNameInput('')`/`setFullName('')`), `alreadyReset`
  bao gồm `!fullName`, deps cập nhật.
- `filterContent` (bên trong `FilterTableLayout` — không tạo layout mới):
  - Ô 1: placeholder `Tìm theo email / tên đăng nhập` → `searchInput`.
  - Ô 2 (mới): label `Họ tên` + placeholder `Tìm theo họ tên` → `fullNameInput`, `allowClear`,
    `onPressEnter={handleFilterApply}`.
  - Ô đơn vị: giữ nguyên `OrgUnitTreeSelect` (TreeSelect dạng cây, value = `orgUnitId`) — không đổi.
- `emptyDescription`: thêm `fullName` vào điều kiện filter-active (empty state đúng ngữ cảnh).
- Status tabs: không sửa — `statusCounts` lấy từ response API, backend tính trên cùng tập filter
  kết hợp đã nhận `fullName`.

## 3. UI constraints compliance

- **Token, không hardcode:** import thêm `spaceXs` từ `frontend/src/tokens.ts`; ô mới dùng
  `radiusPill` (999), `height: 40`, `spaceFormField` (12), `spaceXs` (4), `fontSizeMd`, `fontWeightBold`,
  `colors.sidebarBg` — đúng 3 file chuẩn (`theme.ts`/`tokens.ts` đã đọc trước khi code, chỉ đọc không sửa).
- **Không layout mới:** vẫn dùng `FilterTableLayout` + `ScreenHeader`/`DataTable`/`Pagination`/tabs sẵn có.
- **OrgUnit filter:** giữ `OrgUnitTreeSelect` (cây, `value=orgUnitId`) — không đổi.
- **Ngôn ngữ:** placeholder/label tiếng Việt có dấu; tên biến/tham số tiếng Anh chuẩn (`search`,
  `fullName`).
- **trim():** cả 2 ô được `.trim()` trước khi commit state và trước khi gửi API (service layer
  `params.fullName?.trim() || undefined`).

## 4. Verification

- Command: `npm run build` (workdir `frontend/`)
- Result: **exit code 0** — `✓ built in 984ms`, `4033 modules transformed`.
- Chunk-size warning (`Some chunks are larger than 500 kB`) — pre-existing, không chặn build, ngoài
  phạm vi.
- Không chạy test/lint/typecheck khác: package `build` script chỉ là `vite build`; không có test
  suite liên quan file này trong scope (frontend tests nằm ở `frontend/tests` / `frontend/e2e`,
  không có test cho UsersPage hook/service — ghi nhận là gap, xem mục 6).

## 5. Scope integrity

- Chỉ 3 file frontend được ghi (tool-recorded: 3 `multi_edit` calls, mỗi call 1 file, tất cả thành
  công với đúng hunk dự kiến). Không sửa backend, không sửa `theme.ts`/`tokens.ts`, không tạo layout
  mới, không thao tác git.

## 6. Risks / notes

- **Pre-existing lint (không do thay đổi này):** `useExhaustiveDependencies` tại
  `handleFilterReset` (thiếu `filterOrganizationId` trong deps) và `useJsxKeyInIterable`/
  `noArrayIndexKey` trong drawer chi tiết — đã tồn tại trước khi sửa (xác minh bằng read bản gốc
  dòng 210-217: `alreadyReset` đã dùng `filterOrganizationId` mà deps không có). Không thuộc build
  gate (`vite build` không chạy biome/eslint). Đề xuất PMO dispatch riêng nếu muốn dọn.
- **Status-tab counters:** phụ thuộc backend đã nhận `fullName` và tính `statusCounts` trên tập
  filter kết hợp (đã được lean spec/BA khẳng định; phần này thuộc BE wave, không verify được ở
  frontend).
- **Visual verification:** chưa render thật (không khởi động dev server trong scope); build +
  source-verified. Giao diện 2 ô nằm trong `filterContent` đã được đọc lại trực tiếp (xem mục 2.3).

## 7. Evidence anchors

- `frontend/src/hooks/useUsers.ts` — ListParams `fullName?: string` (edit tool diff 1 replacement).
- `frontend/src/services/userService.ts` — type + `fullName: params.fullName?.trim() || undefined`
  (edit tool diff 1 replacement).
- `frontend/src/pages/UsersPage.tsx` — 9 replacements (import `spaceXs`, 2 state, useUsers call,
  handleFilterApply, handleFilterReset, emptyDescription, 2-input filterContent) — đọc lại vùng
  filterContent xác nhận 2 ô input.
- Build log: `npm run build` → exit 0, `✓ built in 984ms`.
