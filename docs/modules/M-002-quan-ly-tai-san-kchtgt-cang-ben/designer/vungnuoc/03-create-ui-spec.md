# UI Specification: VungNuoc — Create Page

## Page: Create (Tạo mới Vùng nước)

### 1. Component Structure
```
VungNuocCreatePage
├── PageHeader (title, breadcrumbs, backBtn)
└── VungNuocForm (React Hook Form + Zod)
    ├── FormSection (info fields)
    │   ├── maVungNuoc (Input)
    │   ├── tenVungNuoc (Input)
    │   ├── cangBienId (Select — dropdown of CangBien entities)
    │   └── loaiVungNuoc (Input)
    ├── FormSection (statistics)
    │   ├── dienTich (Input number)
    │   ├── doSauMax (Input number)
    │   └── doSauTrungBinh (Input number)
    ├── FormSection (status)
    │   └── trangThaiHoatDong (Select)
    └── FormFooter (Cancel, Submit)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Validation |
|---|---|---|---|
| maVungNuoc | string (length 50) | Input (text) | **Required**, @NotBlank, @Size(max=50), unique on submit |
| tenVungNuoc | string (length 255) | Input (text) | **Required**, @NotBlank, @Size(max=255) |
| cangBienId | UUID | Select (dropdown of CangBien) | **Required**, @NotNull — loads CangBien list for parent selection |
| dienTich | BigDecimal | Input (number, step=0.01) | Optional |
| doSauMax | BigDecimal | Input (number, step=0.01) | Optional — maximum depth |
| doSauTrungBinh | BigDecimal | Input (number, step=0.01) | Optional — average depth |
| loaiVungNuoc | string (length 100) | Input (text) | Optional, **no fixed enum in BE** — free text |
| trangThaiHoatDong | string | Select | Optional; default HIỆN_HÀNH |

### 3. Zod Schema
```typescript
const schema = z.object({
  maVungNuoc: z.string().min(1, "Mã vùng nước không được để trống").max(50, "Mã vùng nước tối đa 50 ký tự"),
  tenVungNuoc: z.string().min(1, "Tên vùng nước không được để trống").max(255, "Tên vùng nước tối đa 255 ký tự"),
  cangBienId: z.string().uuid("Cảng biển chủ không được để trống"),
  dienTich: z.coerce.number().optional(),
  doSauMax: z.coerce.number().optional(),
  doSauTrungBinh: z.coerce.number().optional(),
  loaiVungNuoc: z.string().max(100, "Loại vùng nước tối đa 100 ký tự").optional().or(z.literal("")),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional().default("HIỆN_HÀNH"),
});
```

### 4. Form/Table Layout
- **Form layout**: 2-column grid (label width 180px, field width 1fr, gap 24px).
- **Info Section** (4 fields):
  - Row 1: `Mã vùng nước` (required) | `Tên vùng nước` (required)
  - Row 2: `Cảng biển chủ` (required, Select — dropdown loaded from GET /api/v1/cang-bien, search within dropdown, optional) | `Loại vùng nước` (optional, free text, no fixed enum)
- **Statistics Section** (3 fields):
  - Row 1: `Diện tích (m²)` (optional) | `Độ sâu tối đa (m)` (optional)
  - Row 2: `Độ sâu trung bình (m)` (optional)
- **Status Section** (1 field):
  - Row 1: `Trạng thái hoạt động` (Select: HIỆN_HÀNH [default], TẠM_NGƯNG)
- **Submit validation**: zod.validate() → POST /api/v1/vung-nuoc. On 409 → toast + field error on maVungNuoc. On 422 → map BE errors to fields.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Create | /api/v1/vung-nuoc | POST | { maVungNuoc, tenVungNuoc, cangBienId, dienTich?, doSauMax?, doSauTrungBinh?, loaiVungNuoc?, trangThaiHoatDong? } |

### 6. RBAC Rules
| Role | Create |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **409 Conflict** (duplicate maVungNuoc): Toast "Mã vùng nước 'X' đã tồn tại" + inline error on maVungNuoc.
- **422 Validation**:
  - `maVungNuoc` → "Mã vùng nước không được để trống" / "Mã vùng nước tối đa 50 ký tự"
  - `tenVungNuoc` → "Tên vùng nước không được để trống" / "Tên vùng nước tối đa 255 ký tự"
  - `cangBienId` → "Cảng biển chủ không được để trống"
- **Success**: Toast "Tạo mới vùng nước thành công" + redirect to Detail page.

### 8. Accessibility
- Keyboard: Tab order: maVungNuoc → tenVungNuoc → cangBienId → dienTich → doSauMax → doSauTrungBinh → loaiVungNuoc → trangThaiHoatDong → Cancel → Submit.
- Labels: Every input has visible `<label>` via `htmlFor`/`id`.
- Required indicators: `*` (red) after required field labels.
- Error announcement: `aria-live="assertive"` on error container.
- Submit button: `aria-disabled` during API call to prevent double-submission.
