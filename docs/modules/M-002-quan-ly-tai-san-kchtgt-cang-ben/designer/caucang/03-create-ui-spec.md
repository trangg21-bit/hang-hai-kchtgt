# UI Specification: CauCang — Create Page

## Page: Create (Tạo mới Cầu cảng)

### 1. Component Structure
```
CauCangCreatePage
├── PageHeader (title, breadcrumbs, backBtn)
└── CauCangForm (React Hook Form + Zod)
    ├── FormSection (info fields)
    │   ├── maCau (Input)
    │   ├── tenCau (Input)
    │   ├── benCangId (Select — dropdown of BenCang entities)
    │   └── loaiCau (Input)
    ├── FormSection (statistics)
    │   ├── chieuDai (Input number)
    │   └── taiTrong (Input number)
    ├── FormSection (status)
    │   └── trangThaiHoatDong (Select)
    └── FormFooter (Cancel, Submit)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Validation |
|---|---|---|---|
| maCau | string (length 50) | Input (text) | **Required**, @NotBlank, @Size(max=50), unique on submit |
| tenCau | string (length 255) | Input (text) | **Required**, @NotBlank, @Size(max=255) |
| benCangId | UUID | Select (dropdown of BenCang) | **Required**, @NotNull — loads BenCang list for parent selection |
| chieuDai | BigDecimal | Input (number, step=0.01) | Optional |
| taiTrong | BigDecimal | Input (number, step=0.01) | Optional — key metric for crane capacity |
| loaiCau | string (length 100) | Input (text) | Optional, **no fixed enum in BE** — free text |
| trangThaiHoatDong | string | Select | Optional; default HIỆN_HÀNH |

### 3. Zod Schema
```typescript
const schema = z.object({
  maCau: z.string().min(1, "Mã cầu không được để trống").max(50, "Mã cầu tối đa 50 ký tự"),
  tenCau: z.string().min(1, "Tên cầu không được để trống").max(255, "Tên cầu tối đa 255 ký tự"),
  benCangId: z.string().uuid("Bến cảng chủ không được để trống"),
  chieuDai: z.coerce.number().optional(),
  taiTrong: z.coerce.number().optional(),
  loaiCau: z.string().max(100, "Loại cầu tối đa 100 ký tự").optional().or(z.literal("")),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional().default("HIỆN_HÀNH"),
});
```

### 4. Form/Table Layout
- **Form layout**: 2-column grid (label width 180px, field width 1fr, gap 24px).
- **Info Section** (4 fields):
  - Row 1: `Mã cầu` (required) | `Tên cầu` (required)
  - Row 2: `Bến cảng chủ` (required, Select — dropdown loaded from GET /api/v1/ben-cang, search within dropdown, optional) | `Loại cầu` (optional, free text, no fixed enum)
- **Statistics Section** (2 fields):
  - Row 1: `Chiều dài (m)` (optional) | `Tải trọng (tấn)` (optional) — key metric for crane capacity
- **Status Section** (1 field):
  - Row 1: `Trạng thái hoạt động` (Select: HIỆN_HÀNH [default], TẠM_NGƯNG)
- **Submit validation**: zod.validate() → POST /api/v1/cau-cang. On 409 → toast + field error on maCau. On 422 → map BE errors to fields.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Create | /api/v1/cau-cang | POST | { maCau, tenCau, benCangId, chieuDai?, taiTrong?, loaiCau?, trangThaiHoatDong? } |

### 6. RBAC Rules
| Role | Create |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **409 Conflict** (duplicate maCau): Toast "Mã cầu 'X' đã tồn tại" + inline error on maCau.
- **422 Validation**:
  - `maCau` → "Mã cầu không được để trống" / "Mã cầu tối đa 50 ký tự"
  - `tenCau` → "Tên cầu không được để trống" / "Tên cầu tối đa 255 ký tự"
  - `benCangId` → "Bến cảng chủ không được để trống"
- **Success**: Toast "Tạo mới cầu cảng thành công" + redirect to Detail page.

### 8. Accessibility
- Keyboard: Tab order: maCau → tenCau → benCangId → chieuDai → taiTrong → loaiCau → trangThaiHoatDong → Cancel → Submit.
- Labels: Every input has visible `<label>` via `htmlFor`/`id`.
- Required indicators: `*` (red) after required field labels.
- Error announcement: `aria-live="assertive"` on error container.
- Submit button: `aria-disabled` during API call to prevent double-submission.
