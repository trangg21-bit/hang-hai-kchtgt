# UI Specification: BenCang — Approve Page

## Page: Approve/Reject (Phê duyệt/Từ chối Bến cảng)

### 1. Component Structure
```
BenCangApprovalModal
├── ModalHeader (title: "Phê duyệt Bến cảng", subtitle: "[maBen] — [tenBen]")
├── ApprovalSummaryCard
│   ├── Thông tin: maBen, tenBen, cangBienId (name), tuyenDuongThuy
│   ├── GPS: viDo, kinhDo (if present)
│   ├── Chiều dài, Chiều rộng, Loại bến, Độ sâu luồng
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
| maBen | string | TextBlock | Display only |
| tenBen | string | TextBlock | Display only |
| cangBienId | UUID | TextBlock (resolves to tenCang) | Display only |
| tuyenDuongThuy | string | TextBlock | Display only |
| viDo/kinhDo | BigDecimal | TextBlock | Display only, conditional |
| chieuDai/chieuRong/doSauLuong | BigDecimal | TextBlock | Display only |
| loaiBen | string | TextBlock | Display only, free text |
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
- **ApprovalSummaryCard** (top, read-only): 2-column grid with all key BenCang fields. Badge for current approval status.
- **TabSwitcher**: "Phê duyệt" (✅) and "Từ chối" (❌) tabs. Default = Phê duyệt.
- **ApprovalForm**:
  - Phê duyệt tab: Only confirmCheckbox visible. No reason required.
  - Từ chối tab: TextArea for reason (min 10 chars) + confirmCheckbox.
- **ApprovalHistoryList**: Timeline-style past approve/reject records.
- **ModalFooter**: Cancel (left), Confirm (right, disabled until form valid).

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Approve | /api/v1/ben-cang/{id}/approve | POST | { userId } |
| Reject | /api/v1/ben-cang/{id}/reject | POST | `?reason=...` |

### 6. RBAC Rules
| Role | Approve | Reject |
|---|---|---|
| Admin | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ | ❌ |
| Doanh nghiệp cảng | ❌ | ❌ |
| Nhân viên vận hành | ❌ | ❌ |

### 7. Error Handling
- **403**: "Bạn không có quyền phê duyệt bến cảng này."
- **404**: "Không tìm thấy bến cảng để phê duyệt."
- **422** (reason too short): Inline "Lý do từ chối tối thiểu 10 ký tự".
- **Concurrent modification**: Toast "Bến cảng này đã được phê duyệt/từ chối trước đó." + close modal.
- **Success**: Toast "Phê duyệt/Từ chối bến cảng thành công" + close + refresh.

### 8. Accessibility
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` + `aria-describedby`.
- Focus trap: Tab within modal. Esc closes with confirm prompt if form dirty.
- Tab switching: Arrow keys left/right, Enter/Space to activate.
- Confirm checkbox: Required before submit.
- Screen reader: Tab change via `aria-live="polite"`, errors via `aria-live="assertive"`.
