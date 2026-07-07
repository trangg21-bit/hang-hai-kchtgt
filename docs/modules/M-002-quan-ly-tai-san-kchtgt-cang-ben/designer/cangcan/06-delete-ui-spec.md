# UI Specification: CangCan — Delete Page

## Page: Delete Confirm (Xác nhận xóa Cảng cạn)

### 1. Component Structure
```
CangCanDeleteModal
├── ModalHeader (title: "Xác nhận xóa", icon: 🗑)
├── DeleteInfoCard
│   ├── Mã cảng cạn: [maCangCan]
│   ├── Tên cảng cạn: [tenCangCan]
│   ├── Tỉnh/thành phố: [tinhThanhPho]
│   └── Người tạo: createdBy, createdAt
├── WarningCallout
│   ├── tone: warning
│   └── "Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ trong hệ thống."
├── CheckboxConfirm
│   └── "Tôi xác nhận muốn xóa cảng cạn này"
└── ModalFooter (Cancel, Confirm Delete)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, from route/list) | Used in DELETE endpoint |
| maCangCan | string | TextBlock | Display only |
| tenCangCan | string | TextBlock | Display only |
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
| Delete | /api/v1/cang-can/{id} | DELETE | - |

### 6. RBAC Rules
| Role | Delete |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ |
| Doanh nghiệp cảng | ❌ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **403 Forbidden**: "Bạn không có quyền xóa cảng cạn này."
- **404 Not Found**: "Không tìm thấy cảng cạn để xóa."
- **Record has children** (if dependent records exist): Toast "Không thể xóa vì cảng cạn này có dữ liệu liên quan."
- **Success**: Toast "Xóa cảng cạn thành công" + close modal + refresh list.
- **Network error**: Toast "Kết nối thất bại. Vui lòng thử lại." + keep modal open.

### 8. Accessibility
- Modal: `role="alertdialog"` (destructive action), `aria-modal="true"`.
- Focus: Focus trapped within modal. Esc shows browser-native confirm dialog.
- Confirm button: Red danger color, only enabled when checkbox is checked.
- Screen reader: Warning callout announced on modal open via `aria-live="assertive"`.
