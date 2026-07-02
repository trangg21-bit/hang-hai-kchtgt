# UI Specification: CangBien — Delete Page

## Page: Delete Confirm (Xác nhận xóa Cảng biển)

### 1. Component Structure
```
CangBienDeleteModal
├── ModalHeader (title: "Xác nhận xóa", icon: 🗑)
├── DeleteInfoCard
│   ├── Mã cảng: [maCang]
│   ├── Tên cảng: [tenCang]
│   ├── Tỉnh/thành phố: [tinhThanhPho]
│   └── Người tạo: createdBy, createdAt
├── WarningCallout
│   ├── tone: warning
│   └── "Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ trong hệ thống."
├── CheckboxConfirm
│   └── "Tôi xác nhận muốn xóa cảng biển này"
└── ModalFooter (Cancel, Confirm Delete)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, from route/list) | Used in DELETE endpoint |
| maCang | string | TextBlock | Display only |
| tenCang | string | TextBlock | Display only |
| tinhThanhPho | string | TextBlock | Display only |
| createdBy | string | TextBlock | Display only |
| createdAt | LocalDateTime | TextBlock | Display only |

### 3. Zod Schema
```typescript
const deleteSchema = z.object({
  confirmed: z.boolean().refine(val => val === true, {
    message: "Bạn cần xác nhận để xóa",
  }),
});
```

### 4. Form/Table Layout
- **Modal**: Centered overlay, max-width 480px.
- **DeleteInfoCard**: Read-only display of entity info in a clean list format.
- **WarningCallout**: Amber/warning tone callout explaining soft-delete behavior.
- **CheckboxConfirm**: Required checkbox before Confirm button enables.
- **ModalFooter**: Cancel (gray, left), Delete (red, right, disabled until confirmed).

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Delete | /api/v1/cang-bien/{id} | DELETE | - |

### 6. RBAC Rules
| Role | Delete |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ |
| Doanh nghiệp cảng | ❌ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **403 Forbidden**: "Bạn không có quyền xóa cảng biển này."
- **404 Not Found**: "Không tìm thấy cảng biển để xóa."
- **Record has children** (ben-cang/cau-cang/vung-nuoc dependent records): Toast "Không thể xóa vì cảng biển này có dữ liệu liên quan. Vui lòng xóa các bản ghi con trước."
- **Success**: Toast "Xóa cảng biển thành công" + close modal + refresh list.
- **Network error**: Toast "Kết nối thất bại. Vui lòng thử lại." + keep modal open.

### 8. Accessibility
- Modal: `role="alertdialog"` (destructive action), `aria-modal="true"`.
- Focus: Focus trapped within modal. Esc shows browser-native confirm dialog.
- Confirm button: Red danger color, only enabled when checkbox is checked.
- Screen reader: Warning callout announced on modal open via `aria-live="assertive"`.
