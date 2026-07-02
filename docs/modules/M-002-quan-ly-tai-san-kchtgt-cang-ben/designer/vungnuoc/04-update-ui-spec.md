# UI Specification: VungNuoc — Update Page

## Page: Update (Cập nhật Vùng nước)

### 1. Component Structure
```
VungNuocUpdatePage
├── PageHeader (title, breadcrumbs, backBtn)
└── VungNuocForm (React Hook Form + Zod — same layout as Create)
    ├── FormSection (info fields)
    │   ├── maVungNuoc (Input, readonly) ← immutable
    │   ├── tenVungNuoc (Input)
    │   ├── cangBienId (Select — parent CangBien)
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
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, hidden) | Required in Update request |
| maVungNuoc | string (length 50) | Input (readonly) | **Immutable** — loaded from GET, disabled, not submitted |
| tenVungNuoc | string (length 255) | Input (text) | Optional edit |
| cangBienId | UUID | Select (dropdown of CangBien) | Optional edit |
| dienTich | BigDecimal | Input (number, step=0.01) | Optional |
| doSauMax | BigDecimal | Input (number, step=0.01) | Optional |
| doSauTrungBinh | BigDecimal | Input (number, step=0.01) | Optional |
| loaiVungNuoc | string (length 100) | Input (text) | Optional, free text |
| trangThaiHoatDong | string | Select | Optional edit |
| trangThaiPheDuyet | string | Badge (readonly) | Cannot be edited |

### 3. Zod Schema
```typescript
const schema = z.object({
  id: z.string().uuid("ID không được để trống"),
  tenVungNuoc: z.string().max(255, "Tên vùng nước tối đa 255 ký tự").optional().or(z.literal("")),
  cangBienId: z.string().uuid().optional(),
  dienTich: z.coerce.number().optional(),
  doSauMax: z.coerce.number().optional(),
  doSauTrungBinh: z.coerce.number().optional(),
  loaiVungNuoc: z.string().max(100, "Loại vùng nước tối đa 100 ký tự").optional().or(z.literal("")),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
});
```

### 4. Form/Table Layout
- **Identical to Create page layout** (2-column grid, same section order).
- **Key differences**:
  - `maVungNuoc`: Readonly text input (light gray, shows original value).
  - `trangThaiPheDuyet`: Readonly Badge display (not editable).
  - Form pre-populated with GET /api/v1/vung-nuoc/{id} data on mount.
  - If GET fails (404): Error screen with back button.
  - UpdateVungNuocRequest is partial — only changed fields + id are sent.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get by ID (pre-populate) | /api/v1/vung-nuoc/{id} | GET | - |
| Update | /api/v1/vung-nuoc | PUT | { id, tenVungNuoc?, cangBienId?, dienTich?, doSauMax?, doSauTrungBinh?, loaiVungNuoc?, trangThaiHoatDong? } |

### 6. RBAC Rules
| Role | Update |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **404**: "Không tìm thấy vùng nước để cập nhật." with back button.
- **422 Validation**: Same as Create. No GPS pair constraint on VungNuoc.
- **No changes submitted**: Toast "Không có thay đổi nào được thực hiện." (preventive check).
- **Success**: Toast "Cập nhật vùng nước thành công" + redirect to Detail page.

### 8. Accessibility
- Keyboard: Same tab order as Create, but maVungNuoc is skipped (readonly, focus=false).
- Readonly fields: `aria-readonly="true"` on maVungNuoc.
- Change tracking: Unsaved-changes warning on page unload if form is dirty.
