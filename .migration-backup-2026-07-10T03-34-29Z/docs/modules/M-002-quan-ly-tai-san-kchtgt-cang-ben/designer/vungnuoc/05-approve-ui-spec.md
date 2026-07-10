# UI Specification: VungNuoc — Approve Page

## Page: Approve/Reject (Phê duyệt/Từ chối Vùng nước)

### 1. Component Structure
```
VungNuocApprovalModal
├── ModalHeader (title: "Phê duyệt Vùng nước", subtitle: "[maVungNuoc] — [tenVungNuoc]")
├── ApprovalSummaryCard
│   ├── Thông tin: maVungNuoc, tenVungNuoc, cangBienId (name), loaiVungNuoc
│   ├── Diện tích, Độ sâu tối đa, Độ sâu trung bình
│   └── Người tạo: createdBy, createdAt
├── TabSwitcher (Phê duyệt / Từ chối)
├── ApprovalForm
│   ├── reason (TextArea, required on Reject, min 10 chars)
│   └── confirmCheckbox (required)
├── ApprovalHistoryList (past records)
└── ModalFooter (Cancel, Confirm)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, from route) | Used in endpoint path |
| maVungNuoc | string | TextBlock | Display only |
| tenVungNuoc | string | TextBlock | Display only |
| cangBienId | UUID | TextBlock (resolves to tenCang) | Display only |
| dienTich | BigDecimal | TextBlock | Display only |
| doSauMax | BigDecimal | TextBlock | Display only |
| doSauTrungBinh | BigDecimal | TextBlock | Display only |
| loaiVungNuoc | string | TextBlock | Display only |
| trangThaiPheDuyet | string | Badge | Current: CHỜ_PHE_DUYỆT |
| reason | string | TextArea | Required on Reject, min 10 chars |

### 3. Zod Schema
```typescript
const approveSchema = z.object({
  confirmed: z.boolean().refine(val => val === true, {
    message: "Bạn cần xác nhận hành động này",
  }),
});

const rejectSchema = z.object({
  reason: z.string()
    .min(10, "Lý do từ chối tối thiểu 10 ký tự")
    .max(500, "Lý do từ chối tối đa 500 ký tự")
    .min(1, "Lý do từ chối không được để trống"),
  confirmed: z.boolean().refine(val => val === true, {
    message: "Bạn cần xác nhận hành động này",
  }),
});
```

### 4. Form/Table Layout
- **Modal**: Centered overlay, max-width 600px, scrollable body.
- **ApprovalSummaryCard** (top, read-only): 2-column grid with all key VungNuoc fields. Badge for current approval status.
- **TabSwitcher**: "Phê duyệt" (✅) and "Từ chối" (❌) tabs. Default = Phê duyệt.
- **ApprovalForm**:
  - Phê duyệt tab: Only confirmCheckbox visible. No reason required.
  - Từ chối tab: TextArea for reason (min 10 chars) + confirmCheckbox.
- **ApprovalHistoryList**: Timeline-style past approve/reject records.
- **ModalFooter**: Cancel (left), Confirm (right, disabled until form valid).

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Approve | /api/v1/vung-nuoc/{id}/approve | POST | { userId } |
| Reject | /api/v1/vung-nuoc/{id}/reject | POST | `?reason=...` |

### 6. RBAC Rules
| Role | Approve | Reject |
|---|---|---|
| Admin | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ | ❌ |
| Doanh nghiệp cảng | ❌ | ❌ |
| Nhân viên vận hành | ❌ | ❌ |

### 7. Error Handling
- **403**: "Bạn không có quyền phê duyệt vùng nước này."
- **404**: "Không tìm thấy vùng nước để phê duyệt."
- **422** (reason too short): Inline "Lý do từ chối tối thiểu 10 ký tự".
- **Concurrent modification**: Toast "Vùng nước này đã được phê duyệt/từ chối trước đó." + close modal.
- **Success**: Toast "Phê duyệt/Từ chối vùng nước thành công" + close + refresh.

### 8. Accessibility
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` + `aria-describedby`.
- Focus trap: Tab within modal. Esc closes with confirm prompt if form dirty.
- Tab switching: Arrow keys left/right, Enter/Space to activate.
- Confirm checkbox: Required before submit.
- Screen reader: Tab change via `aria-live="polite"`, errors via `aria-live="assertive"`.
