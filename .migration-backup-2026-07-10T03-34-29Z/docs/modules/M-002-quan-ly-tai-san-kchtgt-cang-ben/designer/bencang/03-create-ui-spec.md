# UI Specification: BenCang — Create Page

## Page: Create (Tạo mới Bến cảng)

### 1. Component Structure
```
BenCangCreatePage
├── PageHeader (title, breadcrumbs, backBtn)
└── BenCangForm (React Hook Form + Zod)
    ├── FormSection (info fields)
    │   ├── maBen (Input)
    │   ├── tenBen (Input)
    │   ├── cangBienId (Select — dropdown of CangBien entities)
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
| BE Field | Type | React Component | Validation |
|---|---|---|---|
| maBen | string (length 50) | Input (text) | **Required**, @NotBlank, @Size(max=50), unique on submit |
| tenBen | string (length 255) | Input (text) | **Required**, @NotBlank, @Size(max=255) |
| cangBienId | UUID | Select (dropdown of CangBien) | **Required**, @NotNull — loads CangBien list for parent selection |
| tuyenDuongThuy | string (length 255) | Input (text) | Optional |
| viDo | BigDecimal (-90 to 90) | Input (number, step=0.000001) | Optional |
| kinhDo | BigDecimal (-180 to 180) | Input (number, step=0.000001) | Optional |
| chieuDai | BigDecimal | Input (number, step=0.01) | Optional |
| chieuRong | BigDecimal | Input (number, step=0.01) | Optional |
| loaiBen | string (length 100) | Input (text) | Optional, **no fixed enum in BE** — free text |
| doSauLuong | BigDecimal | Input (number, step=0.01) | Optional |
| trangThaiHoatDong | string | Select | Optional; default HIỆN_HÀNH |

### 3. Zod Schema
```typescript
const schema = z.object({
  maBen: z.string().min(1, "Mã bến không được để trống").max(50, "Mã bến tối đa 50 ký tự"),
  tenBen: z.string().min(1, "Tên bến không được để trống").max(255, "Tên bến tối đa 255 ký tự"),
  cangBienId: z.string().uuid("Cảng biển chủ không được để trống"),
  tuyenDuongThuy: z.string().max(255, "Tuyến đường thủy tối đa 255 ký tự").optional().or(z.literal("")),
  viDo: z.coerce.number().min(-90, "Vĩ độ phải từ -90 đến 90").max(90, "Vĩ độ phải từ -90 đến 90").optional(),
  kinhDo: z.coerce.number().min(-180, "Kinh độ phải từ -180 đến 180").max(180, "Kinh độ phải từ -180 đến 180").optional(),
  chieuDai: z.coerce.number().optional(),
  chieuRong: z.coerce.number().optional(),
  loaiBen: z.string().max(100, "Loại bến tối đa 100 ký tự").optional().or(z.literal("")),
  doSauLuong: z.coerce.number().optional(),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional().default("HIỆN_HÀNH"),
});
```

### 4. Form/Table Layout
- **Form layout**: 2-column grid (label width 180px, field width 1fr, gap 24px).
- **Info Section** (4 fields):
  - Row 1: `Mã bến` (required) | `Tên bến` (required)
  - Row 2: `Cảng biển chủ` (required, Select — dropdown loaded from GET /api/v1/cang-bien, search within dropdown, optional) | `Tuyến đường thủy` (optional)
- **Geography Section** (2 fields):
  - Row 1: `Vĩ độ` (optional, step 0.000001) | `Kinh độ` (optional, step 0.000001)
  - Note: No GPS pair constraint on BenCang (unlike CangBien/CangCan).
- **Statistics Section** (4 fields):
  - Row 1: `Chiều dài (m)` (optional) | `Chiều rộng (m)` (optional)
  - Row 2: `Loại bến` (optional, free text input, no fixed enum) | `Độ sâu luồng (m)` (optional)
- **Status Section** (1 field):
  - Row 1: `Trạng thái hoạt động` (Select: HIỆN_HÀNH [default], TẠM_NGƯNG)
- **Submit validation**: zod.validate() → POST /api/v1/ben-cang. On 409 → toast + field error on maBen. On 422 → map BE errors to fields.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Create | /api/v1/ben-cang | POST | { maBen, tenBen, cangBienId, tuyenDuongThuy?, viDo?, kinhDo?, chieuDai?, chieuRong?, loaiBen?, doSauLuong?, trangThaiHoatDong? } |

### 6. RBAC Rules
| Role | Create |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **409 Conflict** (duplicate maBen): Toast "Mã bến 'X' đã tồn tại" + inline error on maBen.
- **422 Validation**: 
  - `maBen` → "Mã bến không được để trống" / "Mã bến tối đa 50 ký tự"
  - `tenBen` → "Tên bến không được để trống" / "Tên bến tối đa 255 ký tự"
  - `cangBienId` → "Cảng biển chủ không được để trống"
- **Success**: Toast "Tạo mới bến cảng thành công" + redirect to Detail page.

### 8. Accessibility
- Keyboard: Tab order: maBen → tenBen → cangBienId → tuyenDuongThuy → viDo → kinhDo → chieuDai → chieuRong → loaiBen → doSauLuong → trangThaiHoatDong → Cancel → Submit.
- Labels: Every input has visible `<label>` via `htmlFor`/`id`.
- Required indicators: `*` (red) after required field labels.
- Error announcement: `aria-live="assertive"` on error container.
- Submit button: `aria-disabled` during API call to prevent double-submission.
