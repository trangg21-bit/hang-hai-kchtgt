# UI Specification: CangBien — Create Page

## Page: Create (Tạo mới Cảng biển)

### 1. Component Structure
```
CangBienCreatePage
├── PageHeader (title, breadcrumbs, backBtn)
└── CangBienForm (React Hook Form + Zod)
    ├── FormSection (info fields)
    │   ├── maCang (Input)
    │   ├── tenCang (Input)
    │   └── tinhThanhPho (Input)
    ├── FormSection (geography)
    │   ├── viDo (Input number) + kinhDo (Input number)
    │   └── GPS pair constraint banner (dynamic)
    ├── FormSection (statistics)
    │   ├── dienTich (Input number)
    │   └── khaNangTiepNhan (Input number)
    ├── FormSection (status)
    │   ├── trangThaiHoatDong (Select)
    │   └── trangThaiPheDuyet (Select, default CHỜ_PHE_DUYỆT)
    └── FormFooter (Cancel, Submit)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Validation |
|---|---|---|---|
| maCang | string (length 50) | Input (text) | **Required**, @NotBlank, @Size(max=50), unique constraint on submit |
| tenCang | string (length 255) | Input (text) | **Required**, @NotBlank, @Size(max=255) |
| tinhThanhPho | string (length 100) | Input (text) | @Size(max=100), optional |
| viDo | BigDecimal (-90 to 90) | Input (number, step=0.000001) | @DecimalMin(-90), @DecimalMax(90), optional but paired with kinhDo |
| kinhDo | BigDecimal (-180 to 180) | Input (number, step=0.000001) | @DecimalMin(-180), @DecimalMax(180), optional but paired with viDo |
| dienTich | BigDecimal (> 0) | Input (number, step=0.01) | **Required**, @DecimalMin(value="0", inclusive=false) |
| khaNangTiepNhan | BigDecimal | Input (number, step=0.01) | Optional |
| trangThaiHoatDong | string | Select | Optional; default HIỆN_HÀNH |
| trangThaiPheDuyet | string | Select | Optional; default CHỜ_PHE_DUYỆT |

### 3. Zod Schema
```typescript
const schema = z.object({
  maCang: z.string().min(1, "Mã cảng không được để trống").max(50, "Mã cảng tối đa 50 ký tự"),
  tenCang: z.string().min(1, "Tên cảng không được để trống").max(255, "Tên cảng tối đa 255 ký tự"),
  tinhThanhPho: z.string().max(100, "Tỉnh/thành phố tối đa 100 ký tự").optional().or(z.literal("")),
  viDo: z.coerce.number().min(-90, "Vĩ độ phải từ -90 đến 90").max(90, "Vĩ độ phải từ -90 đến 90").optional(),
  kinhDo: z.coerce.number().min(-180, "Kinh độ phải từ -180 đến 180").max(180, "Kinh độ phải từ -180 đến 180").optional(),
  dienTich: z.coerce.number().positive("Diện tích phải lớn hơn 0"),
  khaNangTiepNhan: z.coerce.number().optional(),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
  trangThaiPheDuyet: z.enum(["CHỜ_PHE_DUYỆT", "ĐƯỢC_PHE_DUYỆT", "TỪ_CHỐI"]).optional().default("CHỜ_PHE_DUYỆT"),
}).refine(data => (data.viDo === undefined) === (data.kinhDo === undefined), {
  message: "Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau",
  path: ["kinhDo"], // error shown on kinhhDo field
});
```

### 4. Form/Table Layout
- **Form layout**: 2-column grid (label width 180px, field width 1fr, gap 24px).
- **Info Section** (3 fields):
  - Row 1: `Mã cảng` (required, 50 char limit) | `Tên cảng` (required, 255 char limit)
  - Row 2: `Tỉnh/thành phố` (optional, 100 char limit, spans full width)
- **Geography Section** (2 fields):
  - Row 1: `Vĩ độ` (optional, step 0.000001, hint: "-90 đến 90") | `Kinh độ` (optional, step 0.000001, hint: "-180 đến 180")
  - Dynamic banner below: If only one is filled → warning callout "Vui lòng nhập cả vĩ độ và kinh độ hoặc để trống cả hai."
- **Statistics Section** (2 fields):
  - Row 1: `Diện tích (m²)` (required, > 0, hint: "số thực dương") | `Khả năng tiếp nhận` (optional, hint: "số thực, có thể là 0")
- **Status Section** (2 fields):
  - Row 1: `Trạng thái hoạt động` (Select: HIỆN_HÀNH, TẠM_NGƯNG) | `Trạng thái phê duyệt` (Select: CHỜ_PHE_DUYỆT [default], ĐƯỢC_PHE_DUYỆT, TỪ_CHỐI)
- **Submit validation**: onFormSubmit → zod.validate() → if valid, POST /api/v1/cang-bien. On 409 → show toast + set field error on maCang. On 422 → map BE errors to form fields.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Create | /api/v1/cang-bien | POST | { maCang, tenCang, tinhThanhPho, viDo, kinhDo, dienTich, khaNangTiepNhan, trangThaiHoatDong, trangThaiPheDuyet } |

### 6. RBAC Rules
| Role | Create |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **409 Conflict** (maCang duplicate): Toast "Mã cảng 'X' đã tồn tại" + inline error on maCang field.
- **422 Validation** (BE annotations): React Hook Form maps to field-level errors:
  - `maCang` → "Mã cảng không được để trống" / "Mã cảng tối đa 50 ký tự"
  - `tenCang` → "Tên cảng không được để trống" / "Tên cảng tối đa 255 ký tự"
  - `viDo`/`kinhDo` → "Vĩ độ/Ekinh độ phải từ -90/180 đến 90/180"
  - `dienTich` → "Diện tích phải lớn hơn 0"
  - `isGpsPaired` → "Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau" (shown as form-level error)
- **Empty dienTich**: Zod catches before API call — "Diện tích phải lớn hơn 0".
- **Submit network error**: Toast "Kết nối thất bại. Vui lòng thử lại." with retry.
- **Success**: Toast "Tạo mới cảng biển thành công" + redirect to Detail page (by maCang or id).

### 8. Accessibility
- Keyboard: Tab order: maCang → tenCang → tinhThanhPho → viDo → kinhDo → dienTich → khaNangTiepNhan → trangThaiHoatDong → trangThaiPheDuyet → Cancel → Submit.
- Labels: Every input has a visible `<label>` linked via `htmlFor`/`id`.
- Required indicators: `*` after required field labels (styled red).
- Error announcement: `aria-live="assertive"` on error container for screen readers.
- Submit button: `aria-disabled` during API call to prevent double-submission.
