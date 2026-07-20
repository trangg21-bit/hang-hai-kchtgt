# UI Specification: CangCan — Update Page

## Page: Update (Cập nhật Cảng cạn)

### 1. Component Structure
```
CangCanUpdatePage
├── PageHeader (title, breadcrumbs, backBtn)
└── CangCanForm (React Hook Form + Zod — same layout as Create)
    ├── FormSection (info fields)
    │   ├── maCangCan (Input, readonly) ← immutable
    │   ├── tenCangCan (Input)
    │   └── tinhThanhPho (Input)
    ├── FormSection (geography)
    │   ├── viDo (Input number)
    │   └── kinhDo (Input number)
    ├── FormSection (statistics)
    │   ├── dienTich (Input number)
    │   └── congSuatTEU (Input number)
    ├── FormSection (status)
    │   ├── trangThaiHoatDong (Select)
    │   └── trangThaiPheDuyet (Select, readonly)
    └── FormFooter (Cancel, Submit)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, hidden) | Required in Update request, filled from route param |
| maCangCan | string (length 50) | Input (readonly) | **Immutable** — loaded from GET detail, disabled, not submitted |
| tenCangCan | string (length 255) | Input (text) | Optional edit, @Size(max=255) |
| tinhThanhPho | string (length 100) | Input (text) | Optional edit, @Size(max=100) |
| viDo | BigDecimal (-90 to 90) | Input (number, step=0.000001) | @DecimalMin(-90), @DecimalMax(90) |
| kinhDo | BigDecimal (-180 to 180) | Input (number, step=0.000001) | @DecimalMin(-180), @DecimalMax(180) |
| dienTich | BigDecimal (> 0) | Input (number, step=0.01) | @DecimalMin(value="0", inclusive=false) |
| congSuatTEU | BigDecimal | Input (number, step=0.01) | Optional |
| trangThaiHoatDong | string | Select | Optional edit |
| trangThaiPheDuyet | string | Input (readonly, disabled) | **Cannot be edited** — set to current value, not submitted |

### 3. Zod Schema
```typescript
const schema = z.object({
  id: z.string().uuid("ID không được để trống"),
  tenCangCan: z.string().max(255, "Tên cảng cạn tối đa 255 ký tự").optional().or(z.literal("")),
  tinhThanhPho: z.string().max(100, "Tỉnh/thành phố tối đa 100 ký tự").optional().or(z.literal("")),
  viDo: z.coerce.number().min(-90, "Vĩ độ phải từ -90 đến 90").max(90, "Vĩ độ phải từ -90 đến 90").optional(),
  kinhDo: z.coerce.number().min(-180, "Kinh độ phải từ -180 đến 180").max(180, "Kinh độ phải từ -180 đến 180").optional(),
  dienTich: z.coerce.number().positive("Diện tích phải lớn hơn 0").optional(),
  congSuatTEU: z.coerce.number().optional(),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
}).refine(data => (data.viDo === undefined) === (data.kinhDo === undefined), {
  message: "Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau",
  path: ["kinhDo"],
});
```

### 4. Form/Table Layout
- **Identical to Create page layout** (2-column grid, same section order).
- **Key differences**:
  - `maCangCan`: Readonly text input (background light gray, shows original value).
  - `trangThaiPheDuyet`: Readonly text (Badge displayed, not editable).
  - Form pre-populated with GET /api/v1/cang-can/{id} data on mount.
  - If GET fails (404): Show error screen with back button.
  - Only changed fields need to be sent to BE (UpdateCangCanRequest is partial — all fields optional except id).

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get by ID (pre-populate) | /api/v1/cang-can/{id} | GET | - |
| Update | /api/v1/cang-can | PUT | { id, tenCangCan?, tinhThanhPho?, viDo?, kinhDo?, dienTich?, congSuatTEU?, trangThaiHoatDong? } |

### 6. RBAC Rules
| Role | Update |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **404**: "Không tìm thấy cảng cạn để cập nhật." with back button.
- **409 Conflict** (if maCangCan is submitted despite readonly — should not happen, but defensive): Toast + inline error.
- **422 Validation** (BE): Same mapping as Create page. Note: `isGpsPaired` validation applies on update too (GPS pair constraint).
- **No changes submitted**: Toast "Không có thay đổi nào được thực hiện." (preventive check on frontend before submit).
- **Success**: Toast "Cập nhật cảng cạn thành công" + redirect to Detail page.

### 8. Accessibility
- Keyboard: Identical tab order to Create page, but maCangCan is skipped (readonly, focus=false).
- Readonly fields: `aria-readonly="true"` on maCangCan input and trangThaiPheDuyet display.
- Change tracking: If form is dirty (modified fields), show unsaved-changes warning on page unload.
