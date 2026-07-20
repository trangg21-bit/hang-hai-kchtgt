# UI Specification: CangBien — Detail Page

## Page: Detail (Chi tiết Cảng biển)

### 1. Component Structure
```
CangBienDetailPage
├── PageHeader (title, breadcrumbs, backBtn, actionButtons)
├── InfoCard (primary info: maCang, tenCang, tinhThanhPho)
├── GeoCard (GPS: viDo, kinhDo with map placeholder, isGpsPaired status)
├── StatsCard (dienTich, khaNangTiepNhan)
├── StatusCard (trangThaiHoatDong, trangThaiPheDuyet)
├── AuditCard (createdBy, updatedBy, createdAt, updatedAt, orgUnitId)
├── DocumentsSection (GiayTo list: fileName, fileSize, mimeType, createdAt, download/delete)
└── ActionFooter (Edit, Delete, Approve, Reject, History buttons)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal key) | Immutable |
| maCang | string (length 50) | TextBlock (large font) | Immutable after create, copy-to-clipboard |
| tenCang | string (length 255) | TextBlock | Primary identifier |
| tinhThanhPho | string (length 100) | TextBlock | Optional |
| viDo | BigDecimal (precision 10, scale 6) | TextBlock + mapPin icon | -90 to 90, paired with kinhDo |
| kinhDo | BigDecimal (precision 10, scale 6) | TextBlock + mapPin icon | -180 to 180, paired with viDo |
| dienTich | BigDecimal (precision 15, scale 2) | NumberBlock (format: decimal2 + " m²") | > 0 |
| khaNangTiepNhan | BigDecimal (precision 15, scale 2) | NumberBlock (format: decimal2) | Optional |
| trangThaiHoatDong | string (length 50) | Badge (active/inactive color) | HIỆN_HÀNH = green, TẠM_NGƯNG = amber |
| trangThaiPheDuyet | string (length 50) | Badge (color-coded) | CHỜ_PHE_DUYỆT = amber, ĐƯỢC_PHE_DUYỆT = green, TỪ_CHỐI = red |
| orgUnitId | UUID | TextBlock | Optional |
| createdBy | string | TextBlock | Read-only |
| updatedBy | string | TextBlock | Read-only |
| createdAt | LocalDateTime | DateTimeBlock | Read-only |
| updatedAt | LocalDateTime | DateTimeBlock | Read-only |

### 3. Zod Schema (Detail — display only, no validation)
```typescript
// Detail page is read-only; no Zod schema needed.
// However, the Approve/Reject actions use inline Zod:
const rejectSchema = z.object({
  reason: z.string().min(10, "Lý do từ chối tối thiểu 10 ký tự").max(500),
});
```

### 4. Form/Table Layout
- **PageHeader**: Breadcrumbs (Trang chủ > Quản lý tài sản > Cảng biển) + Title "[maCang] — [tenCang]" + Back button + Edit/Delete/Approve action buttons (conditional on RBAC).
- **InfoCard** (left column, 2/3 width):
  - Row 1: Mã cảng + Copy icon | Tên cảng
  - Row 2: Tỉnh/thành phố
- **GeoCard** (left column):
  - Row 1: Vĩ độ + Kinh độ (side by side)
  - If isGpsPaired == true: show map placeholder with pin icon
  - If either is null: show "Chưa có thông tin GPS" with info callout
- **StatsCard** (right column, 1/3 width):
  - Diện tích (m²), Khả năng tiếp nhận
- **StatusCard** (right column):
  - Trạng thái hoạt động (Badge), Trạng thái phê duyệt (Badge)
- **AuditCard** (bottom, full width): Created/Updated by + dates, Org unit
- **DocumentsSection** (full width, below cards): Table of attached GiayTo with download/delete.
- **ActionFooter** (sticky bottom): Edit | Delete | Approve | Reject | History — conditional on RBAC and approval status.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get by ID | /api/v1/cang-bien/{id} | GET | - |
| Get by Code | /api/v1/cang-bien/code/{maCang} | GET | (alternative lookup) |
| Delete | /api/v1/cang-bien/{id} | DELETE | - |
| Approve | /api/v1/cang-bien/{id}/approve | POST | { userId } |
| Reject | /api/v1/cang-bien/{id}/reject | POST | `?reason=...` |
| History | /api/v1/cang-bien/{id}/history | GET | - |
| List GiayTo | /api/v1/giay-to/entity/cang-bien/{id} | GET | `?page=0&size=20` |

### 6. RBAC Rules
| Role | Edit | Delete | Approve | Reject | View History | Download Docs |
|---|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Doanh nghiệp cảng | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Nhân viên vận hành | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 7. Error Handling
- **404**: "Không tìm thấy cảng biển với ID [id]." with back button.
- **403**: "Bạn không có quyền xem thông tin này."
- **GiayTo list empty**: Show callout "Không có tài liệu đính kèm."
- **Map load fail**: Show fallback text "Vĩ độ: [x], Kinh độ: [y]" with info callout.

### 8. Accessibility
- Keyboard: All links/buttons are focusable. Enter to follow links, Space to toggle.
- ARIA: `role="region"` on each card with descriptive `aria-label`, `aria-live="polite"` for dynamic status changes.
- Color: Status badges use semantic colors + text labels (not color-only) for WCAG 2.1 AA compliance.
- Focus management: Modal close returns focus to triggering button.
