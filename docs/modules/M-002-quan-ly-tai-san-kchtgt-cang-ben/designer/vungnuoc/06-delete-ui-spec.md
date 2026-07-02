# UI Specification: VungNuoc — Delete Page

## Page: Delete Confirm (Xác nhận xóa Vùng nước)

### 1. Component Structure
```
VungNuocDeleteModal
├── ModalHeader (title: "Xác nhận xóa", icon: 🗑)
├── DeleteInfoCard
│   ├── Mã vùng nước: [maVungNuoc]
│   ├── Tên vùng nước: [tenVungNuoc]
│   ├── Cảng biển chủ: [cangBien.tenCang]
│   ├── Loại vùng nước: [loaiVungNuoc]
│   └── Người tạo: createdBy, createdAt
├── WarningCallout
│   ├── tone: warning
│   └── "Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ."
├── CheckboxConfirm
│   └── "Tôi xác nhận muốn xóa vùng nước này"
└── ModalFooter (Cancel, Confirm Delete)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, from route) | Used in DELETE endpoint |
| maVungNuoc | string | TextBlock | Display only |
| tenVungNuoc | string | TextBlock | Display only |
| cangBienId | UUID | TextBlock (resolves to tenCang) | Display only |
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
- **DeleteInfoCard**: Read-only entity info list.
- **WarningCallout**: Amber callout explaining soft-delete.
- **CheckboxConfirm**: Required before Confirm enables.
- **ModalFooter**: Cancel (gray, left), Delete (red, right, disabled until confirmed).

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Delete | /api/v1/vung-nuoc/{id} | DELETE | - |

### 6. RBAC Rules
| Role | Delete |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ |
| Doanh nghiệp cảng | ❌ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **403**: "Bạn không có quyền xóa vùng nước này."
- **404**: "Không tìm thấy vùng nước để xóa."
- **Success**: Toast "Xóa vùng nước thành công" + close + refresh.
- **Network error**: Toast "Kết nối thất bại. Vui lòng thử lại."

### 8. Accessibility
- Modal: `role="alertdialog"`, `aria-modal="true"`.
- Focus trapped. Esc shows native confirm.
- Confirm: Red danger color, enabled only when checkbox checked.
- Screen reader: Warning announced via `aria-live="assertive"` on open.
