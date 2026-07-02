# UI Specification: BenCang — Update Page

## Page: Update (Cập nhật Bến cảng)

### 1. Component Structure
```
BenCangUpdatePage
├── PageHeader (title, breadcrumbs, backBtn)
└── BenCangForm (React Hook Form + Zod — same layout as Create)
    ├── FormSection (info fields)
    │   ├── maBen (Input, readonly) ← immutable
    │   ├── tenBen (Input)
    │   ├── cangBienId (Select — parent CangBien)
    │   └── tuyenDuongThuy (Input)
    ├── FormSection (geography)
    │   ├── viDo (Input number)
    │   └── kinhDo (Input number)
    ├── FormSection (statistics)
    │   ├── chieuDai (Input number)
    │   ├── chieuRong (Input number)
    │   ├── loaiBen (Input text)
    │   └── doSauLuong (Input number)
    ├── FormSection (status)
    │   └── trangThaiHoatDong (Select)
    └── FormFooter (Cancel, Submit)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, hidden) | Required in Update request |
| maBen | string (length 50) | Input (readonly) | **Immutable** — loaded from GET, disabled, not submitted |
| tenBen | string (length 255) | Input (text) | Optional edit |
| cangBienId | UUID | Select (dropdown of CangBien) | Optional edit |
| tuyenDuongThuy | string (length 255) | Input (text) | Optional edit |
| viDo | BigDecimal (-90 to 90) | Input (number, step=0.000001) | Optional |
| kinhDo | BigDecimal (-180 to 180) | Input (number, step=0.000001) | Optional |
| chieuDai | BigDecimal | Input (number, step=0.01) | Optional |
| chieuRong | BigDecimal | Input (number, step=0.01) | Optional |
| loaiBen | string (length 100) | Input (text) | Optional, free text |
| doSauLuong | BigDecimal | Input (number, step=0.01) | Optional |
| trangThaiHoatDong | string | Select | Optional edit |
| trangThaiPheDuyet | string | Badge (readonly) | Cannot be edited |

### 3. Zod Schema
```typescript
const schema = z.object({
  id: z.string().uuid("ID không được để trống"),
  tenBen: z.string().max(255, "Tên bến tối đa 255 ký tự").optional().or(z.literal("")),
  cangBienId: z.string().uuid().optional(),
  tuyenDuongThuy: z.string().max(255, "Tuyến đường thủy tối đa 255 ký tự").optional().or(z.literal("")),
  viDo: z.coerce.number().min(-90, "Vĩ độ phải từ -90 đến 90").max(90, "Vĩ độ phải từ -90 đến 90").optional(),
  kinhDo: z.coerce.number().min(-180, "Kinh độ phải từ -180 đến 180").max(180, "Kinh độ phải từ -180 đến 180").optional(),
  chieuDai: z.coerce.number().optional(),
  chieuRong: z.coerce.number().optional(),
  loaiBen: z.string().max(100, "Loại bến tối đa 100 ký tự").optional().or(z.literal("")),
  doSauLuong: z.coerce.number().optional(),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
});
```

### 4. Form/Table Layout
- **Identical to Create page layout** (2-column grid, same section order).
- **Key differences**:
  - `maBen`: Readonly text input (light gray, shows original value).
  - `trangThaiPheDuyet`: Readonly Badge display (not editable).
  - Form pre-populated with GET /api/v1/ben-cang/{id} data on mount.
  - If GET fails (404): Error screen with back button.
  - UpdateCangBienRequest is partial — only changed fields + id are sent.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get by ID (pre-populate) | /api/v1/ben-cang/{id} | GET | - |
| Update | /api/v1/ben-cang | PUT | { id, tenBen?, cangBienId?, tuyenDuongThuy?, viDo?, kinhDo?, chieuDai?, chieuRong?, loaiBen?, doSauLuong?, trangThaiHoatDong? } |

### 6. RBAC Rules
| Role | Update |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **404**: "Không tìm thấy bến cảng để cập nhật." with back button.
- **422 Validation**: Same as Create. No GPS pair constraint on BenCang.
- **No changes submitted**: Toast "Không có thay đổi nào được thực hiện." (preventive check).
- **Success**: Toast "Cập nhật bến cảng thành công" + redirect to Detail page.

### 8. Accessibility
- Keyboard: Same tab order as Create, but maBen is skipped (readonly, focus=false).
- Readonly fields: `aria-readonly="true"` on maBen.
- Change tracking: Unsaved-changes warning on page unload if form is dirty.
