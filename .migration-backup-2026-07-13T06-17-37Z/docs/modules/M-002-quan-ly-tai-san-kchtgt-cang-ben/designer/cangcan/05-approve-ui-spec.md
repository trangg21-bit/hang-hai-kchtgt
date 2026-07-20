# UI Specification: CangCan — Approve Page

## Page: Approve/Reject (Phê duyệt/Từ chối Cảng cạn)

### 1. Component Structure
```
CangCanApprovalModal
├── ModalHeader (title: "Phê duyệt Cảng cạn", subtitle: "[maCangCan] — [tenCangCan]")
├── ApprovalSummaryCard
│   ├── Thông tin: maCangCan, tenCangCan, tinhThanhPho
│   ├── GPS: viDo, kinhDo (if present)
│   ├── Diện tích, Công suất TEU
│   └── Người tạo: createdBy, createdAt
├── TabSwitcher (Phê duyệt / Từ chối)
├── ApprovalForm
│   ├── reason (TextArea, visible only on Reject tab, min 10 chars)
│   └── confirmCheckbox (required, text: "Tôi xác nhận hành động này")
├── ApprovalHistoryList (past approval/rejection records, read-only)
└── ModalFooter (Cancel, Confirm)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, from route) | Used in endpoint path |
| maCangCan | string | TextBlock | Display only |
| tenCangCan | string | TextBlock | Display only |
| tinhThanhPho | string | TextBlock | Display only |
| viDo | BigDecimal | TextBlock | Display only, conditional |
| kinhDo | BigDecimal | TextBlock | Display only, conditional |
| dienTich | BigDecimal | TextBlock | Display only |
| congSuatTEU | BigDecimal | TextBlock | Display only |
| trangThaiPheDuyet | string | Badge | Current state: CHỜ_PHE_DUYỆT |
| reason | string | TextArea | Required on Reject, min 10 chars |
| userId | string | (from auth session) | Extracted from Authentication object |

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
- **ApprovalSummaryCard** (top, read-only): 2-column grid showing all key fields of the CangCan entity. Badge for current approval status.
- **TabSwitcher**: Two tabs — "Phê duyệt" (green icon ✅) and "Từ chối" (red icon ❌). Default tab = Phê duyệt.
- **ApprovalForm**:
  - On Phê duyệt tab: Only the confirmCheckbox is visible. No reason required.
  - On Từ chối tab: TextArea for reason (min 10 chars) + confirmCheckbox.
- **ApprovalHistoryList** (bottom of modal): Timeline-style list of past approve/reject actions with userId, timestamp, reason (if reject).
- **ModalFooter**: Cancel (left), Confirm (right, disabled until form valid).

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Approve | /api/v1/cang-can/{id}/approve | POST | Body empty; userId from session auth |
| Reject | /api/v1/cang-can/{id}/reject | POST | Query param: `?reason=...` (min 10 chars) |

### 6. RBAC Rules
| Role | Approve | Reject |
|---|---|---|
| Admin | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ | ❌ |
| Doanh nghiệp cảng | ❌ | ❌ |
| Nhân viên vận hành | ❌ | ❌ |

### 7. Error Handling
- **403 Forbidden**: "Bạn không có quyền phê duyệt cảng cạn này."
- **404 Not Found**: "Không tìm thấy cảng cạn để phê duyệt."
- **422 Validation** (reason too short on reject): Inline error "Lý do từ chối tối thiểu 10 ký tự".
- **Concurrent modification** (record already approved/rejected): Toast "Cảng cạn này đã được phê duyệt/từ chối trước đó." + close modal.
- **Success Approve**: Toast "Phê duyệt cảng cạn thành công" + close modal + refresh list.
- **Success Reject**: Toast "Từ chối cảng cạn thành công" + close modal + refresh list.

### 8. Accessibility
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` + `aria-describedby`.
- Focus trap: Tab stays within modal. Esc closes modal (with confirm prompt if form dirty).
- Tab switching: Arrow keys left/right to switch tabs, Enter/Space to activate.
- Confirm checkbox: Required before submit button becomes enabled.
- Screen reader: Tab change announces via `aria-live="polite"`, form errors via `aria-live="assertive"`.
