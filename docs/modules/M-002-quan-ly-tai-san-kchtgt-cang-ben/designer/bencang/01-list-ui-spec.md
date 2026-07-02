# UI Specification: BenCang — List Page

## Page: List (Danh sách Bến cảng)

### 1. Component Structure
```
BenCangListPage
├── PageHeader (title, breadcrumbs)
├── FiltersBar (searchInput, statusFilter, approvalFilter, cangBienFilter, applyBtn, resetBtn)
├── DataTable
│   ├── columns: maBen, tenBen, cangBienName, tuyenDuongThuy, chieuDai, chieuRong, loaiBen, doSauLuong, trangThaiHoatDong, trangThaiPheDuyet, createdAt
│   ├── RowActions (view, edit, approve, reject, delete)
│   └── Pagination (page, pageSize, totalItems)
├── ApproveRejectModal (batch approve/reject)
└── DeleteConfirmModal (single delete)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Validation |
|---|---|---|---|
| id | UUID | (internal key) | Required |
| maBen | string (length 50) | TextCell | Immutable after create, unique |
| tenBen | string (length 255) | TextCell | Required |
| cangBienId | UUID | TextCell (shows cangBien.tenCang) | Required FK |
| tuyenDuongThuy | string (length 255) | TextCell | Optional |
| viDo | BigDecimal (precision 10, scale 6) | TextCell (display-only) | Optional |
| kinhDo | BigDecimal (precision 10, scale 6) | TextCell (display-only) | Optional |
| chieuDai | BigDecimal (precision 15, scale 2) | NumberCell | Optional |
| chieuRong | BigDecimal (precision 15, scale 2) | NumberCell | Optional |
| loaiBen | string (length 100) | TextCell | Optional, no fixed enum |
| doSauLuong | BigDecimal (precision 10, scale 2) | NumberCell | Optional |
| trangThaiHoatDong | string (length 50) | SelectBadge | Enum: HIỆN_HÀNH / TẠM_NGƯNG |
| trangThaiPheDuyet | string (length 50) | Badge (color-coded) | Enum: CHỜ_PHE_DUYỆT / ĐƯỢC_PHE_DUYỆT / TỪ_CHỐI |
| orgUnitId | UUID | TextCell | Optional |
| createdBy | string | TextCell | Read-only |
| updatedBy | string | TextCell | Read-only |
| createdAt | LocalDateTime | DateTimeCell | Read-only |
| updatedAt | LocalDateTime | DateTimeCell | Read-only |

### 3. Zod Schema (List Filters)
```typescript
const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
  approvalStatus: z.enum(["CHỜ_PHE_DUYỆT", "ĐƯỢC_PHE_DUYỆT", "TỪ_CHỐI"]).optional(),
  cangBienId: z.string().uuid().optional(),
  orgUnitId: z.string().uuid().optional(),
  sortBy: z.enum(["maBen", "tenBen", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

### 4. Form/Table Layout
- **FiltersBar** (top): search input (300px) + 3 filter dropdowns (status, approval status, parent CangBien) + Apply/Reset. Collapsible on mobile.
- **DataTable** columns (left to right): `STT` | `Mã bến` (120px) | `Tên bến` (250px, truncate) | `Cảng biển chủ` (180px, clickable → CangBien detail) | `Tuyến đường thủy` (200px, truncate) | `Chiều dài` (100px, right) | `Chiều rộng` (100px, right) | `Loại bến` (100px, truncate) | `Độ sâu luồng` (110px, right) | `Trạng thái HĐ` (100px) | `Phê duyệt` (110px) | `Ngày tạo` (140px) | `Hành động` (120px, sticky right).
- **RowActions**: 👁 Detail | ✏ Edit | ✅ Approve | ❌ Reject | 🗑 Delete — conditional on RBAC and approval status.
- **Pagination**: bottom, "Hiển thị X-Y của Z kết quả".

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| List | /api/v1/ben-cang | GET | `?page=0&size=20&orgUnitId=...` |
| Get by ID | /api/v1/ben-cang/{id} | GET | - |
| Create | /api/v1/ben-cang | POST | CreateBenCangRequest body |
| Update | /api/v1/ben-cang | PUT | UpdateBenCangRequest body |
| Delete | /api/v1/ben-cang/{id} | DELETE | - |
| Approve | /api/v1/ben-cang/{id}/approve | POST | { userId } |
| Reject | /api/v1/ben-cang/{id}/reject | POST | `?reason=...` |
| History | /api/v1/ben-cang/{id}/history | GET | - |

### 6. RBAC Rules
| Role | Create | Read | Update | Delete | Approve | Reject | View History |
|---|---|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Doanh nghiệp cảng | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Nhân viên vận hành | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 7. Error Handling
- **409 Conflict** (duplicate maBen): Toast "Mã bến 'X' đã tồn tại." (inline + toast).
- **422 Validation**: React Hook Form maps BE errors to inline field messages.
- **404 Not Found**: Toast "Không tìm thấy bến cảng."
- **Network timeout**: Toast "Kết nối thất bại. Vui lòng thử lại." with retry.
- **Soft-delete confirmation**: Modal with "Bạn có chắc chắn muốn xóa bến cảng '[maBen]'? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ."

### 8. Accessibility
- Keyboard: Tab order from FiltersBar → Table header → Table rows → Pagination. Arrow keys for row nav. Space/Enter for RowActions.
- ARIA: `role="grid"`, `role="rowgroup"`, `aria-sort` on sortable columns, `aria-label` on icon buttons.
- Color contrast: Badge colors meet WCAG 2.1 AA ≥ 4.5:1.
- Screen reader: Hidden decorative elements (`aria-hidden="true"`), labels for inputs, error messages via `aria-describedby`.
