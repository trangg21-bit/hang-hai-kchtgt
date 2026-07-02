# UI Specification: CangCan — History Page

## Page: History (Lịch sử thay đổi Cảng cạn)

### 1. Component Structure
```
CangCanHistoryPage
├── PageHeader (title: "Lịch sử thay đổi", breadcrumbs, backBtn)
├── EntitySummaryCard (read-only: maCangCan, tenCangCan, tinhThanhPho)
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
| maCangCan | string | TextBlock | Display only |
| tenCangCan | string | TextBlock | Display only |
| tinhThanhPho | string | TextBlock | Display only |
| historyRecords | Object[] | TimelineItem array | From GET /{id}/history response |

### 3. Zod Schema (None — display-only page)
```typescript
// History page is purely read-only. No Zod schema needed.
// The response is rendered as-is from the API.
```

### 4. Form/Table Layout
- **PageHeader**: Title "Lịch sử thay đổi — [maCangCan] | [tenCangCan]", breadcrumbs (Trang chủ > Quản lý tài sản > Cảng cạn > Lịch sử), Back button.
- **EntitySummaryCard** (top, read-only): Compact display of maCangCan, tenCangCan, tinhThanhPho with badge for current status.
- **HistoryTimeline** (main content): Vertical timeline with alternating left/right layout on desktop, single column on mobile.
  - Each item: timestamp on left (bold), actor name below, field changes in the middle (old → new with color diff: red strikethrough for old, green for new), reason (if reject) shown as a note at bottom of the item.
  - Sort: newest first (descending by createdAt).
- **EmptyState**: If no history records, show empty state illustration with text "Chưa có thay đổi nào được ghi nhận."

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Get History | /api/v1/cang-can/{id}/history | GET | - |

### 6. RBAC Rules
| Role | View History |
|---|---|
| Admin | ✅ |
| Lãnh đạo | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 7. Error Handling
- **404 Not Found**: "Không tìm thấy cảng cạn." with back button.
- **403 Forbidden**: "Bạn không có quyền xem lịch sử."
- **API error**: Toast "Không thể tải lịch sử. Vui lòng thử lại." with retry button.
- **Empty history**: Shown as empty state (not an error).

### 8. Accessibility
- Timeline: `role="list"` with `aria-label="Lịch sử thay đổi"`.
- Each item: `role="listitem"` with `aria-time` for timestamp.
- Keyboard: Tab to each timeline item, Enter to expand/collapse details.
- Color: Old values (red) and new values (green) have sufficient contrast for colorblind users. Text labels accompany colors (not color-only encoding).
- Screen reader: Each timeline item announced with full context (actor, timestamp, field, old → new).
