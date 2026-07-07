# UI Specification: CauCang — Update Page

## Page: Update (Cập nhật Cầu cảng)

### 1. Component Structure
```
CauCangUpdatePage
├── PageHeader (title, breadcrumbs, backBtn)
└── CauCangForm (React Hook Form + Zod — same layout as Create)
    ├── FormSection (info fields)
    │   ├── maCau (Input, readonly) ← immutable
    │   ├── tenCau (Input)
    │   ├── benCangId (Select — parent BenCang)
    │   └── loaiCau (Input)
    ├── FormSection (statistics)
    │   ├── chieuDai (Input number)
    │   └── taiTrong (Input number)
    ├── FormSection (status)
    │   └── trangThaiHoatDong (Select)
    └── FormFooter (Cancel, Submit)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, hidden) | Required in Update request |
| maCau | string (length 50) | Input (readonly) | **Immutable** — loaded from GET, disabled, not submitted |
| tenCau | string (length 255) | Input (text) | Optional edit |
| benCangId | UUID | Select (dropdown of BenCang) | Optional edit |
| chieuDai | BigDecimal | Input (number, step=0.01) | Optional |
| taiTrong | BigDecimal | Input (number, step=0.01) | Optional |
| loaiCau | string (length 100) | Input (text) | Optional, free text |
| trangThaiHoatDong | string | Select | Optional edit |
| trangThaiPheDuyet | string | Badge (readonly) | Cannot be edited |

### 3. Zod Schema
```typescript
const schema = z.object({
  id: z.string().uuid("ID không được để trống"),
  tenCau: z.string().max(255, "Tên cầu tối đa 255 ký tự").optional().or(z.literal("")),
  benCangId: z.string().uuid().optional(),
  chieuDai: z.coerce.number().optional(),
  taiTrong: z.coerce.number().optional(),
  loaiCau: z.string().max(100, "Loại cầu tối đa 100 ký tự").optional().or(z.literal("")),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
});
```

### 4. Form/Table Layout
- **Identical to Create page layout** (2-column grid, same section order).
- **Key differences**:
  - `maCau`: Readonly text input (light gray, shows original value).
  - `trangThaiPheDuyet`: Readonly Badge display (not editable).
  - Form pre-populated with GET /api/v1/cau-cang/{id} data on mount.
  - If GET fails (404): Error screen with back button.
  - UpdateCauCangRequest is partial — only changed fields + id are sent.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get by ID (pre-populate) | /api/v1/cau-cang/{id} | GET | - |
| Update | /api/v1/cau-cang | PUT | { id, tenCau?, benCangId?, chieuDai?, taiTrong?, loaiCau?, trangThaiHoatDong? } |

### 6. RBAC Rules
| Role | Update |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **404**: "Không tìm thấy cầu cảng để cập nhật." with back button.
- **422 Validation**: Same as Create. No GPS pair constraint on CauCang.
- **No changes submitted**: Toast "Không có thay đổi nào được thực hiện." (preventive check).
- **Success**: Toast "Cập nhật cầu cảng thành công" + redirect to Detail page.

### 8. Accessibility
- Keyboard: Same tab order as Create, but maCau is skipped (readonly, focus=false).
- Readonly fields: `aria-readonly="true"` on maCau.
- Change tracking: Unsaved-changes warning on page unload if form is dirty.
