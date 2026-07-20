# UI Specification: BenCang — Delete Page

## Page: Delete Confirm (Xác nhận xóa Bến cảng)

### 1. Component Structure
```
BenCangDeleteModal
├── ModalHeader (title: "Xác nhận xóa", icon: 🗑)
├── DeleteInfoCard
│   ├── Mã bến: [maBen]
│   ├── Tên bến: [tenBen]
│   ├── Cảng biển chủ: [cangBien.tenCang]
│   ├── Tuyến đường thủy: [tuyenDuongThuy]
│   └── Người tạo: createdBy, createdAt
├── WarningCallout
│   ├── tone: warning
│   └── "Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ."
├── CheckboxConfirm
│   └── "Tôi xác nhận muốn xóa bến cảng này"
└── ModalFooter (Cancel, Confirm Delete)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, from route) | Used in DELETE endpoint |
| maBen | string | TextBlock | Display only |
| tenBen | string | TextBlock | Display only |
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
| Delete | /api/v1/ben-cang/{id} | DELETE | - |

### 6. RBAC Rules
| Role | Delete |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ |
| Doanh nghiệp cảng | ❌ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **403**: "Bạn không có quyền xóa bến cảng này."
- **404**: "Không tìm thấy bến cảng để xóa."
- **Success**: Toast "Xóa bến cảng thành công" + close + refresh.
- **Network error**: Toast "Kết nối thất bại. Vui lòng thử lại."

### 8. Accessibility
- Modal: `role="alertdialog"`, `aria-modal="true"`.
- Focus trapped. Esc shows native confirm.
- Confirm: Red danger color, enabled only when checkbox checked.
- Screen reader: Warning announced via `aria-live="assertive"` on open.
