# UI Specification: CangCan — Detail Page

## Page: Detail (Chi tiết Cảng cạn)

### 1. Component Structure
```
CangCanDetailPage
├── PageHeader (title, breadcrumbs, backBtn, actionButtons)
├── InfoCard (primary info: maCangCan, tenCangCan, tinhThanhPho)
├── GeoCard (GPS: viDo, kinhDo with map placeholder, isGpsPaired status)
├── StatsCard (dienTich, congSuatTEU)
├── StatusCard (trangThaiHoatDong, trangThaiPheDuyet)
├── AuditCard (createdBy, updatedBy, createdAt, updatedAt, orgUnitId)
├── DocumentsSection (GiayTo list)
└── ActionFooter (Edit, Delete, Approve, Reject, History buttons)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal key) | Immutable |
| maCangCan | string (length 50) | TextBlock (large font) | Immutable after create, copy-to-clipboard |
| tenCangCan | string (length 255) | TextBlock | Primary identifier |
| tinhThanhPho | string (length 100) | TextBlock | Optional |
| viDo | BigDecimal (precision 10, scale 6) | TextBlock + mapPin icon | Optional, -90 to 90, paired with kinhDo |
| kinhDo | BigDecimal (precision 10, scale 6) | TextBlock + mapPin icon | Optional, -180 to 180, paired with viDo |
| dienTich | BigDecimal (precision 15, scale 2) | NumberBlock (format: decimal2 + " m²") | > 0 |
| congSuatTEU | BigDecimal (precision 15, scale 2) | NumberBlock (format: decimal2 + " TEU") | Optional |
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
- **PageHeader**: Breadcrumbs (Trang chủ > Quản lý tài sản > Cảng cạn) + Title "[maCangCan] — [tenCangCan]" + Back + Edit/Delete/Approve.
- **InfoCard** (left, 2/3 width): Mã cảng cạn (large) | Tên cảng cạn | Tỉnh/thành phố
- **GeoCard** (left): Vĩ độ + Kinh độ (side by side). If both present → map placeholder. If either absent → "Chưa có thông tin GPS". Note: GPS pair constraint (isGpsPaired) applies — both must be present or both absent.
- **StatsCard** (right, 1/3 width): Diện tích (m²) | Công suất TEU
- **StatusCard** (right): Trạng thái hoạt động (Badge) | Trạng thái phê duyệt (Badge)
- **AuditCard** (bottom, full): Created/Updated by + dates, Org unit
- **DocumentsSection** (full width): GiayTo list table with download/delete.
- **ActionFooter** (sticky bottom): Edit | Delete | Approve | Reject | History — conditional on RBAC and approval status.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get by ID | /api/v1/cang-can/{id} | GET | - |
| Delete | /api/v1/cang-can/{id} | DELETE | - |
| Approve | /api/v1/cang-can/{id}/approve | POST | { userId } |
| Reject | /api/v1/cang-can/{id}/reject | POST | `?reason=...` |
| History | /api/v1/cang-can/{id}/history | GET | - |
| List GiayTo | /api/v1/giay-to/entity/cang-can/{id} | GET | `?page=0&size=20` |

### 6. RBAC Rules
| Role | Edit | Delete | Approve | Reject | View History | Download Docs |
|---|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Doanh nghiệp cảng | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Nhân viên vận hành | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 7. Error Handling
- **404**: "Không tìm thấy cảng cạn với ID [id]."
- **403**: "Bạn không có quyền xem thông tin này."
- **GiayTo empty**: "Không có tài liệu đính kèm."
- **Map load fail**: Fallback text "Vĩ độ: [x], Kinh độ: [y]"

### 8. Accessibility
- Keyboard: All links/buttons focusable. Enter to follow, Space to toggle.
- ARIA: `role="region"` on cards, `aria-label` for each card, `aria-live="polite"` for dynamic changes.
- Color: Status badges use semantic colors + text labels (not color-only).
- Focus management: Modal close returns focus to triggering button.
