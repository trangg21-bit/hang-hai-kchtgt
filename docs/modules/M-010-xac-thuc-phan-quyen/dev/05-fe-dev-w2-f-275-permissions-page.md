# F-275 PermissionsPage.tsx — Implementation Summary

## File Created

| File | Status |
|---|---|
| `frontend/src/pages/PermissionsPage.tsx` | Created |

## Build Verification

```
npm run build → ✓ built in 1.30s (0 errors)
```

## Implementation Details

### List Screen Pattern

Follows the convention from `docs/conventions/form-and-list-patterns.md` and mirrors `UsersPage.tsx`:

- **ScreenHeader**: breadcrumb "Quản trị hệ thống > Quản lý quyền hạn" + "Thêm quyền hạn" button (primary variant)
- **FilterBar**: search input (tìm theo tên, mã quyền) + select dropdown for feature filter (Phản hiện / Báo cáo / Danh mục / Admin)
- **DataTable**: 6 columns — STT, Mã quyền (sortable), Tên quyền (sortable), Resource, Hành động, Mô tả. Row actions dropdown (Sửa/Xóa)
- **Pagination**: standard pagination + page size selector

### Modal Form

- **Create/Edit mode**: fields — Mã quyền (code, format `feature:action`), Tên quyền (name), Resource (select), Hành động (select), Mô tả (textarea)
- **Validation**: code required + regex pattern `^[a-z]+:[a-z]+$`, name required, resource required, action required
- **Footer**: Cancel (outlined) + Submit (primary), both pill radius

### Design Tokens Used

| Token | Source | Usage |
|---|---|---|
| `spaceFormField` (12px) | `tokens.ts` | Form.Item marginBottom |
| `radiusPill` (999px) | `tokens.ts` | Input / Select / Button borderRadius |
| `actionPrimary` | `tokens.ts` | Primary button background |
| `textSecondary` | `tokens.ts` | Cancel button color |
| `borderDefault` | `tokens.ts` | Cancel button border |
| `fontWeightBold` / `fontWeightMedium` | `tokens.ts` | Typography |
| `fontSizeMd` / `fontSizeLg` | `tokens.ts` | Typography |
| `cardStyle` | `tokens.ts` | Container card wrapper |
| `colors.sidebarBg` | `theme.ts` | Modal title + label color |

### API Integration

- Uses `api` from `../services/api` (Axios instance with `/api` baseURL)
- `@tanstack/react-query` hooks: `useQuery` for list, `useMutation` for create/update/delete
- Inline query functions (no separate service/hook file)
- API endpoints: `GET/POST /v1/permissions`, `PUT/DELETE /v1/permissions/{id}`
- Query params: `search`, `feature`, `page`, `size`, `sort`

### Conventions Complied

- ✅ No hardcoded hex colors
- ✅ All labels in Vietnamese with proper accents
- ✅ Search input trimmed before API calls (`.trim()`)
- ✅ `labelProps()` helper for consistent label styling
- ✅ `destroyOnHidden` + `maskClosable={false}` on Modal
- ✅ Loading/Error/Empty states handled via shared components
- ✅ Delete confirmation dialog via `Modal.confirm`
- ✅ Toast notifications via shared `ToastNotification`
- ✅ Permission list not imported via barrel; uses individual imports from `../components/list-view/`
