
---
feature-id: F-284
document: lean-spec
output-mode: retrospective
last-updated: 2026-07-10
---

# F-284: Bản đồ & Bảng chi tiết Dashboard — Lean Spec

## 1. User Story

> **As a** system operator / port manager
> **I want** a map area and a detailed infrastructure table on the dashboard
> **So that** I can quickly see the geographic layout of maritime infrastructure and browse detailed KCHT records without pagination.

## 2. Map Placeholder

| Property | Value |
|---|---|
| Height | 300px |
| Background | `surfacePage` (#F8F9FA) |
| Content | `EnvironmentOutlined` icon (`fontSizeStat`: 28px, `textTertiary`) + "Bản đồ KCHTGT hàng hải" label (`metaStyle`) |
| Layout | flexbox, column, centered |
| Container | plain `div` (no Card wrapper) with `borderRadius: radiusLg` (12px) |

**Note:** The map area is a placeholder — no actual GIS/map library is integrated.

## 3. Infrastructure Table (Ant Design `<Table>`)

### Columns

| # | Title | DataIndex | Width | Notes |
|---|---|---|---|---|
| 1 | STT | `stt` | 60px | Row number |
| 2 | Loại KCHT | `loai` | 130px | e.g. Cảng biển, Luồng HH |
| 3 | Tên | `ten` | auto | — |
| 4 | Địa điểm | `diaDiem` | 150px | Province/location |
| 5 | Trạng thái | `trangThai` | 140px | Rendered as `<Tag color={…}>` |
| 6 | Ghi chú | `ghiChu` | auto | `ellipsis: true` |

### Status → Tag Color Mapping

| Status | Tag Color | Token |
|---|---|---|
| Đang vận hành | `green` | `statusOperational` (#1BAF7A) |
| Chưa khai thác | `gold` | `statusAttention` (#EDA100) |
| Dừng khai thác | `red` | `statusCritical` (#E34948) |
| (unknown) | `default` | fallback |

### Table Properties

| Prop | Value |
|---|---|
| `scroll.y` | 300px |
| `pagination` | `false` |
| `size` | `small` |
| `rowKey` | `stt` |
| Wrapper | Card-style div with `surfaceCard` bg, `0.5px solid ${borderDefault}`, `radiusLg` |

## 4. Mock Data — `InfraRow[]` (10 rows)

| STT | Loại | Tên | Địa điểm | Trạng thái | Ghi chú |
|---|---|---|---|---|---|
| 1 | Cảng biển | Cảng Hải Phòng | Hải Phòng | Đang vận hành | Cảng tổng hợp quốc gia |
| 2 | Cảng biển | Cảng Cái Mép – Thị Vải | Bà Rịa - Vũng Tàu | Đang vận hành | Cảng nước sâu cửa ngõ |
| 3 | Luồng HH | Luồng Sông Chanh | Quảng Ninh | Đang vận hành | Độ sâu -10.5m CDL |
| 4 | Bến cảng | Bến cảng Nhà Rồng | TP. Hồ Chí Minh | Chưa khai thác | Đang nâng cấp mở rộng |
| 5 | Khu neo đậu | Khu neo đậu Vịnh Vân Phong | Khánh Hòa | Đang vận hành | Tránh bão, chờ luồng |
| 6 | Khu chuyển tải | Khu chuyển tải Hòn La | Quảng Bình | Đang vận hành | Phục vụ cảng Hòn La |
| 7 | Cảng biển | Cảng Đà Nẵng | Đà Nẵng | Dừng khai thác | Đang sửa chữa cầu tàu |
| 8 | Luồng HH | Luồng Định An – Cần Thơ | Trà Vinh | Đang vận hành | Độ sâu -6.5m CDL |
| 9 | Bến cảng | Bến phao xăng dầu B12 | Quảng Ninh | Đang vận hành | Bến phao chuyên dùng |
| 10 | Khu neo đậu | Khu neo đậu Cửa Việt | Quảng Trị | Chưa khai thác | Đang hoàn thiện thủ tục |

## 5. Layout

```
┌─────────────────────────────────────────────┐
│  Bản đồ & Chi tiết        ← Title level 5   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────── Map placeholder ───────────┐  │
│  │     🗺  (EnvironmentOutlined icon)      │  │
│  │     Bản đồ KCHTGT hàng hải              │  │
│  │     height: 300px, bg: surfacePage      │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────── Ant Table (infrastructure) ─────┐  │
│  │  STT │ Loại KCHT │ Tên │ Địa điểm │ …  │  │
│  │ ─────────────────────────────────────── │  │
│  │  1   │ Cảng biển  │ …    │ …       │ …  │  │
│  │  …   │ …          │ …    │ …       │ …  │  │
│  │  scroll Y: 300px, no pagination          │  │
│  │  bg: surfaceCard, border: 0.5px solid    │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

The section sits below the "Phê duyệt & Khai thác" row, as part of the full-page `HomeDashboard` component inside `FilterProvider`.

## 6. Semantic Token Compliance

| Token | Used For | Value |
|---|---|---|
| `surfacePage` | Map placeholder background | #F8F9FA |
| `surfaceCard` | Table wrapper background | #FFFFFF |
| `borderDefault` | Table wrapper border | #E5E7EB |
| `radiusLg` | Map placeholder + table card border-radius | 12px |
| `radiusMd` | (tooltip style) | 8px |
| `fontSizeStat` | Map icon size | 28px |
| `fontSizeSm` | (chart tick size) | 11px |
| `fontSizeMd` | (layout gap) | 13px |
| `textTertiary` | Map placeholder text color | #9CA3AF |
| `metaStyle` | Map label text style | (11px, #9CA3AF, 400) |
| `spaceSm` | Map flex gap | 8px |
| `spaceMd` | Section margin + card padding | 12px |
| `spaceLg` | Card gap | 16px |

No hardcoded hex values in the map/table region — all colors use token imports.

## 7. States

| State | Behavior | Coded? |
|---|---|---|
| **Normal (populated)** | Map placeholder visible + table renders 10 `infraData` rows | ✅ Yes — default render |
| **Loading** | Table shows Ant Design's loading spinner (not explicitly configured — `loading` prop not set) | ❌ Not implemented |
| **Empty** | Table renders empty body with "No data" default text (Ant Design default) | ⚠️ Partial — no empty-text customization |
| **Error** | No error boundary or fallback for fetch failure | ❌ Not implemented |

**Note:** This is a mock-data-only feature. Loading, empty, and error states require real API integration (out of scope for the mock phase).

## 8. Pipeline Triage

| Question | Answer |
|---|---|
| Q1: Creates new domain elements? | No — mock data uses local inline `InfraRow[]` interface, no backend model |
| Q2: Affects system architecture? | No |
| Q3: Approach clear from existing architecture? | Yes — follows existing Ant Design table patterns in the codebase |
| **Verdict** | Route to `engineering-technical-lead` for API integration planning |
