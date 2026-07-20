# UI Specification: CauCang — Detail Page

## Page: Detail (Chi tiết Cầu cảng)

### 1. Component Structure
```
CauCangDetailPage
├── PageHeader (title, breadcrumbs, backBtn, actionButtons)
├── InfoCard (primary info: maCau, tenCau, benCangId)
├── StatsCard (chieuDai, taiTrong, loaiCau)
├── StatusCard (trangThaiHoatDong, trangThaiPheDuyet)
├── AuditCard (createdBy, updatedBy, createdAt, updatedAt, orgUnitId)
├── DocumentsSection (GiayTo list)
└── ActionFooter (Edit, Delete, Approve, Reject, History buttons)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal key) | Immutable |
| maCau | string (length 50) | TextBlock (large font) | Immutable after create, copy-to-clipboard |
| tenCau | string (length 255) | TextBlock | Primary identifier |
| benCangId | UUID | LinkCell → BenCang detail | FK to parent, clickable |
| chieuDai | BigDecimal (precision 15, scale 2) | NumberBlock (format: decimal2 + " m") | Optional |
| taiTrong | BigDecimal (precision 15, scale 2) | NumberBlock (format: decimal2 + " tấn") | Optional — this is the key metric for cranes |
| loaiCau | string (length 100) | TextBlock | Optional, no fixed enum in BE |
| trangThaiHoatDong | string (length 50) | Badge | HIỆN_HÀNH = green, TẠM_NGƯNG = amber |
| trangThaiPheDuyet | string (length 50) | Badge | CHỜ_PHE_DUYỆT = amber, ĐƯỢC_PHE_DUYỆT = green, TỪ_CHỐI = red |
| orgUnitId | UUID | TextBlock | Optional |
| createdBy | string | TextBlock | Read-only |
| updatedBy | string | TextBlock | Read-only |
| createdAt | LocalDateTime | DateTimeBlock | Read-only |
| updatedAt | LocalDateTime | DateTimeBlock | Read-only |

### 3. Zod Schema (Detail — display only, no validation)
```typescript
const rejectSchema = z.object({
  reason: z.string().min(10, "Lý do từ chối tối thiểu 10 ký tự").max(500),
});
```

### 4. Form/Table Layout
- **PageHeader**: Breadcrumbs (Trang chủ > Quản lý tài sản > Cầu cảng) + Title "[maCau] — [tenCau]" + Back + Edit/Delete/Approve.
- **InfoCard** (left, 2/3 width): Mã cầu (large) | Tên cầu | Bến cảng chủ (link)
- **StatsCard** (left): Chiều dài (m) | Tải trọng (tấn) | Loại cầu
- **StatusCard** (right, 1/3 width): Trạng thái hoạt động (Badge) | Trạng thái phê duyệt (Badge)
- **AuditCard** (bottom, full): Created/Updated by + dates, Org unit
- **DocumentsSection** (full width): GiayTo list table with download/delete.
- **ActionFooter** (sticky bottom): Edit | Delete | Approve | Reject | History — conditional on RBAC and approval status.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get by ID | /api/v1/cau-cang/{id} | GET | - |
| Get by Code | /api/v1/cau-cang/code/{maCau} | GET | - |
| Delete | /api/v1/cau-cang/{id} | DELETE | - |
| Approve | /api/v1/cau-cang/{id}/approve | POST | { userId } |
| Reject | /api/v1/cau-cang/{id}/reject | POST | `?reason=...` |
| History | /api/v1/cau-cang/{id}/history | GET | - |
| List GiayTo | /api/v1/giay-to/entity/cau-cang/{id} | GET | `?page=0&size=20` |

### 6. RBAC Rules
| Role | Edit | Delete | Approve | Reject | View History | Download Docs |
|---|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Doanh nghiệp cảng | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Nhân viên vận hành | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 7. Error Handling
- **404**: "Không tìm thấy cầu cảng với ID [id]."
- **403**: "Bạn không có quyền xem thông tin này."
- **GiayTo empty**: "Không có tài liệu đính kèm."

### 8. Accessibility
- Keyboard: All links/buttons focusable. Enter to follow, Space to toggle.
- ARIA: `role="region"` on cards, `aria-label` for each card, `aria-live="polite"` for dynamic changes.
- Color: Status badges use semantic colors + text labels (not color-only).
- Focus management: Modal close returns focus to triggering button.
