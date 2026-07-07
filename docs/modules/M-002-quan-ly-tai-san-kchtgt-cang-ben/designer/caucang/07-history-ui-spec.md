# UI Specification: CauCang — History Page

## Page: History (Lịch sử thay đổi Cầu cảng)

### 1. Component Structure
```
CauCangHistoryPage
├── PageHeader (title: "Lịch sử thay đổi", breadcrumbs, backBtn)
├── EntitySummaryCard (read-only: maCau, tenCau, benCangId, chieuDai, taiTrong, loaiCau)
└── HistoryTimeline
    ├── TimelineItem (each change record)
    │   ├── timestamp (left side)
    │   ├── actor (user who made change)
    │   ├── action type (field changed, old value → new value)
    │   └── reason (if reject, optional)
    └── EmptyState (no records)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Notes |
|---|---|---|---|
| id | UUID | (internal, from route) | Used in GET endpoint |
| maCau | string | TextBlock | Display only |
| tenCau | string | TextBlock | Display only |
| benCangId | UUID | TextBlock (resolves to tenBen) | Display only |
| historyRecords | Object[] | TimelineItem array | From GET /{id}/history |

### 3. Zod Schema (None — display-only page)
```typescript
// History page is purely read-only. No Zod schema needed.
```

### 4. Form/Table Layout
- **PageHeader**: "Lịch sử thay đổi — [maCau] | [tenCau]", breadcrumbs, Back.
- **EntitySummaryCard** (top): Compact display of key fields + status badge.
- **HistoryTimeline** (main): Vertical timeline, alternating left/right on desktop, single column on mobile.
  - Each item: timestamp (bold), actor name, field changes (old → new with diff colors: red strikethrough for old, green for new), reason (if reject) as note.
  - Sort: newest first.
- **EmptyState**: "Chưa có thay đổi nào được ghi nhận."

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get History | /api/v1/cau-cang/{id}/history | GET | - |

### 6. RBAC Rules
| Role | View History |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **404**: "Không tìm thấy cầu cảng." with back.
- **403**: "Bạn không có quyền xem lịch sử."
- **API error**: Toast "Không thể tải lịch sử." with retry.
- **Empty**: Shown as empty state (not error).

### 8. Accessibility
- Timeline: `role="list"` with `aria-label`. Each item: `role="listitem"`, `aria-time`.
- Keyboard: Tab to each item, Enter to expand/collapse.
- Color: Old values (red), new values (green) with sufficient contrast + text labels.
- Screen reader: Each item announced with full context.
