# UI Specification: CangBien — List Page

## Page: List (Danh sách Cảng biển)

### 1. Component Structure
```
CangBienListPage
├── PageHeader (title, breadcrumbs)
├── FiltersBar (searchInput, statusFilter, orgUnitFilter, applyBtn, resetBtn)
├── DataTable
│   ├── columns: maCang, tenCang, tinhThanhPho, dienTich, khaNangTiepNhan, trangThaiHoatDong, trangThaiPheDuyet, createdAt
│   ├── RowActions (view, edit, approve, reject, delete)
│   └── Pagination (page, pageSize, totalItems)
├── ApproveRejectModal (batch approve/reject)
└── DeleteConfirmModal (single delete)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Validation |
|---|---|---|---|
| id | UUID | (internal key) | Required |
| maCang | string (length 50) | TextCell | Immutable after create |
| tenCang | string (length 255) | TextCell | Required |
| tinhThanhPho | string (length 100) | TextCell | Optional |
| viDo | BigDecimal (precision 10, scale 6) | TextCell (display-only) | -90 to 90 |
| kinhDo | BigDecimal (precision 10, scale 6) | TextCell (display-only) | -180 to 180 |
| dienTich | BigDecimal (precision 15, scale 2) | NumberCell (format: decimal2) | > 0 |
| khaNangTiepNhan | BigDecimal (precision 15, scale 2) | NumberCell (format: decimal2) | Optional |
| trangThaiHoatDong | string (length 50) | SelectBadge | Enum: HIỆN_HÀNH / TẠM_NGƯNG |
| trangThaiPheDuyet | string (length 50) | Badge (color-coded) | Enum: CHỜ_PHE_DUYỆT / ĐƯỢC_PHE_DUYỆT / TỪ_CHỐI |
| orgUnitId | UUID | TextCell | Optional |
| createdBy | string | TextCell | Read-only |
| updatedBy | string | TextCell | Read-only |
| createdAt | LocalDateTime | DateTimeCell (format: dd/MM/yyyy HH:mm) | Read-only |
| updatedAt | LocalDateTime | DateTimeCell (format: dd/MM/yyyy HH:mm) | Read-only |

### 3. Zod Schema (List Filters)
```typescript
const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
  approvalStatus: z.enum(["CHỜ_PHE_DUYỆT", "ĐƯỢC_PHE_DUYỆT", "TỪ_CHỐI"]).optional(),
  orgUnitId: z.string().uuid().optional(),
  sortBy: z.enum(["maCang", "tenCang", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

### 4. Form/Table Layout
- **FiltersBar** (top): search input (宽 300px) + 2 filter dropdowns (status, approval status) + Apply/Reset buttons. Collapsible on mobile.
- **DataTable** columns (left to right): `STT` | `Mã cảng` (120px, clickable → Detail) | `Tên cảng` (250px, truncate) | `Tỉnh/thành phố` (150px, truncate) | `Diện tích (m²)` (110px, right-align) | `Khả năng tiếp nhận` (130px, right-align) | `Trạng thái HĐ` (100px) | `Phe duyet` (110px) | `Ngày tạo` (140px) | `Hành động` (120px, sticky right).
- **RowActions**: icon buttons → 👁 Detail | ✏ Edit (if RBAC allows) | ✅ Approve (if pending) | ❌ Reject (if pending) | 🗑 Delete (if RBAC allows, with confirmation).
- **Pagination**: bottom of table, shows "Hiển thị X-Y của Z kết quả".

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| List | /api/v1/cang-bien | GET | `?page=0&size=20&orgUnitId=...` |
| Get by ID | /api/v1/cang-bien/{id} | GET | - |
| Create | /api/v1/cang-bien | POST | CreateCangBienRequest body |
| Update | /api/v1/cang-bien | PUT | UpdateCangBienRequest body |
| Delete | /api/v1/cang-bien/{id} | DELETE | - |
| Approve | /api/v1/cang-bien/{id}/approve | POST | { userId } |
| Reject | /api/v1/cang-bien/{id}/reject | POST | `?reason=...` (min 10 chars) |
| History | /api/v1/cang-bien/{id}/history | GET | - |

### 6. RBAC Rules
| Role | Create | Read | Update | Delete | Approve | Reject | View History |
|---|---|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Doanh nghiệp cảng | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Nhân viên vận hành | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 7. Error Handling
- **409 Conflict** (duplicate maCang): Toast "Mã cảng 'X' đã tồn tại. Vui lòng nhập mã khác." (inline + toast).
- **422 Validation** (BE @NotNull/@Size/@DecimalMin/@AssertTrue isGpsPaired): React Hook Form `formState.errors` mapped to inline field messages. Example: "Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau".
- **404 Not Found**: Toast "Không tìm thấy cảng biển." on detail load failure.
- **Network timeout**: Toast "Kết nối thất bại. Vui lòng thử lại." with retry button.
- **Soft-delete confirmation**: Modal with message "Bạn có chắc chắn muốn xóa cảng biển '[maCang]'? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ."

### 8. Accessibility
- Keyboard: Tab order from FiltersBar → Table header → Table rows → Pagination. Arrow keys for row navigation. Space/Enter to activate RowActions.
- ARIA: `role="grid"` on DataTable, `role="rowgroup"` on header/footer, `aria-sort` on sortable columns, `aria-label` on icon buttons.
- Color contrast: Badge colors (CHỜ_PHE_DUYỆT = amber, ĐƯỢC_PHE_DUYỆT = green, TỪ_CHỐI = red) meet WCAG 2.1 AA ≥ 4.5:1 contrast ratio.
- Screen reader: Hidden decorative elements (`aria-hidden="true"`), field labels for all inputs, error messages associated via `aria-describedby`.
