# UI Specification: BenCang — Detail Page

## Page: Detail (Chi tiết Bến cảng)

### 1. Component Structure
```
BenCangDetailPage
├── PageHeader (title, breadcrumbs, backBtn, actionButtons)
├── InfoCard (primary info: maBen, tenBen, cangBienId, tuyenDuongThuy)
├── GeoCard (GPS: viDo, kinhDo with map placeholder)
├── StatsCard (chieuDai, chieuRong, loaiBen, doSauLuong)
├── StatusCard (trangThaiHoatDong, trangThaiPheDuyet)
├── AuditCard (createdBy, updatedBy, createdAt, updatedAt, orgUnitId)
├── DocumentsSection (GiayTo list)
└── ActionFooter (Edit, Delete, Approve, Reject, History buttons)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal key) | Immutable |
| maBen | string (length 50) | TextBlock (large font) | Immutable after create, copy-to-clipboard |
| tenBen | string (length 255) | TextBlock | Primary identifier |
| cangBienId | UUID | LinkCell → CangBien detail | FK to parent, clickable |
| tuyenDuongThuy | string (length 255) | TextBlock | Optional |
| viDo | BigDecimal (precision 10, scale 6) | TextBlock + mapPin icon | Optional |
| kinhDo | BigDecimal (precision 10, scale 6) | TextBlock + mapPin icon | Optional |
| chieuDai | BigDecimal (precision 15, scale 2) | NumberBlock (format: decimal2 + " m") | Optional |
| chieuRong | BigDecimal (precision 15, scale 2) | NumberBlock (format: decimal2 + " m") | Optional |
| loaiBen | string (length 100) | TextBlock | Optional, no fixed enum in BE |
| doSauLuong | BigDecimal (precision 10, scale 2) | NumberBlock (format: decimal2 + " m") | Optional |
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
- **PageHeader**: Breadcrumbs (Trang chủ > Quản lý tài sản > Bến cảng) + Title "[maBen] — [tenBen]" + Back + Edit/Delete/Approve.
- **InfoCard** (left, 2/3 width): Mã bến (large) | Tên bến | Cảng biển chủ (link) | Tuyến đường thủy
- **GeoCard** (left): Vĩ độ + Kinh độ (side by side). If both present → map placeholder. If either absent → "Chưa có thông tin GPS".
- **StatsCard** (right, 1/3 width): Chiều dài (m) | Chiều rộng (m) | Loại bến | Độ sâu luồng (m)
- **StatusCard** (right): Trạng thái hoạt động (Badge) | Trạng thái phê duyệt (Badge)
- **AuditCard** (bottom, full): Created/Updated by + dates, Org unit
- **DocumentsSection** (full width): GiayTo list table with download/delete.
- **ActionFooter** (sticky bottom): Edit | Delete | Approve | Reject | History — conditional on RBAC and approval status.

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get by ID | /api/v1/ben-cang/{id} | GET | - |
| Delete | /api/v1/ben-cang/{id} | DELETE | - |
| Approve | /api/v1/ben-cang/{id}/approve | POST | { userId } |
| Reject | /api/v1/ben-cang/{id}/reject | POST | `?reason=...` |
| History | /api/v1/ben-cang/{id}/history | GET | - |
| List GiayTo | /api/v1/giay-to/entity/ben-cang/{id} | GET | `?page=0&size=20` |

### 6. RBAC Rules
| Role | Edit | Delete | Approve | Reject | View History | Download Docs |
|---|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Doanh nghiệp cảng | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Nhân viên vận hành | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 7. Error Handling
- **404**: "Không tìm thấy bến cảng với ID [id]."
- **403**: "Bạn không có quyền xem thông tin này."
- **GiayTo empty**: "Không có tài liệu đính kèm."
- **Map load fail**: Fallback text "Vĩ độ: [x], Kinh độ: [y]"

### 8. Accessibility
- Keyboard: All links/buttons focusable. Enter to follow, Space to toggle.
- ARIA: `role="region"` on cards, `aria-label` for each card, `aria-live="polite"` for dynamic changes.
- Color: Status badges use semantic colors + text labels (not color-only).
- Focus management: Modal close returns focus to triggering button.
