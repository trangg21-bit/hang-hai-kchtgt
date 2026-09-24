---
name: kcht-gis-spatial-category
description: >-
  Quy chuẩn thiết kế, quản lý và hiển thị Lịch sử thay đổi (Change History Drawer) cho bộ 3 màn hình
  Danh mục đối tượng không gian GIS: Danh mục đối tượng điểm (/gis/points), Danh mục đối tượng đường (/gis/lines),
  và Danh mục đối tượng vùng (/gis/polygons) chuẩn giao diện 2 cột /berth.
---

# Quy Chuẩn Màn Hình Danh Mục Đối Tượng GIS & Lịch Sử Thay Đổi

## 1. Mục đích & Phạm vi áp dụng

Tài liệu này quy định tiêu chuẩn thiết kế giao diện, luồng xử lý và cơ chế hiển thị **Lịch sử thay đổi (Change History Drawer)** chuẩn mực áp dụng cho bộ 3 màn hình danh mục đối tượng không gian GIS trong phân hệ KCHTGT Hàng hải:

| STT | Màn hình | Tuyến đường (Route) | File xử lý chính | Loại hình học (`geometryType`) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Danh mục đối tượng điểm** | `/gis/points` | `PointObjectList.tsx` | `1` - `POINT` (Điểm) |
| 2 | **Danh mục đối tượng đường** | `/gis/lines` | `LineObjectList.tsx` | `2` - `LINE` (Đường) |
| 3 | **Danh mục đối tượng vùng** | `/gis/polygons` | `PolygonObjectList.tsx` | `3` - `POLYGON` (Vùng) |

---

## 2. Đặc tả giao diện Drawer Lịch sử thay đổi (Chuẩn mẫu thiết kế)

Toàn bộ 3 màn hình danh mục đối tượng GIS bắt buộc tuân thủ giao diện Drawer Lịch sử thay đổi 2 cột chuẩn `/berth` theo đúng hình ảnh thiết kế:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🕒 Lịch sử thay đổi — Bến cảng Kho xăng dầu K2   ( Tổng cộng 5 )                         ✕ │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Tìm kiếm nội dung thay đổi...        ] [ Từ ngày 📅 ] [ Đến ngày 📅 ] [ 🔍 Tìm kiếm ]    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 15:17 23/09/2026   [ Cập nhật ] │ ▌ Thông tin thay đổi:                                     │
│ Người cập nhật: Nguyễn Văn An   │ ▌ File đính kèm:   DKKD (1) (1) (2).png...         →      │
│ Đơn vị: Bộ Giao thông Vận tải   │ ▌                  Biên lai-3260260024...                 │
│                                 │ ▌                                                         │
├─────────────────────────────────┼───────────────────────────────────────────────────────────┤
│ 15:17 23/09/2026   [ Cập nhật ] │ ▌ Thông tin thay đổi:                                     │
│ Người cập nhật: Nguyễn Văn An   │ ▌ Quy tắc hiển thị: 2                              →      │
│ Đơn vị: Bộ Giao thông Vận tải   │ ▌ Loại đối tượng:   Đối tượng điểm                 → Đối tượng đường
│                                 │ ▌ Tọa độ GPS:       POINT (107.12739 10.40609)     → LINESTRING (...)
└─────────────────────────────────┴───────────────────────────────────────────────────────────┘
```

### 2.1. Cấu trúc Tiêu đề Header Drawer
- **Icon**: `<HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />`.
- **Tiêu đề**: `Lịch sử thay đổi — ${entityName}` (với `entityName` là tên đối tượng cụ thể).
- **Badge số lượng**: Dạng viên thuốc `borderRadius: radiusPill` (`999px`), đệm `padding: '2px 10px'`, nền nhạt `background: ${colors.sidebarBg}15`, chữ đậm `color: colors.sidebarBg`, nội dung `Tổng cộng ${totalCount}` (Đếm số phiên/lần cập nhật hiển thị, không đếm số trường raw).
- **Nút đóng**: Biểu tượng `✕` cố định ở góc trên bên phải.

### 2.2. Thanh tìm kiếm & lọc ngày (Filter Bar)
Nằm trên cùng 1 hàng ngang duy nhất (`display: 'flex', gap: spaceSm, marginBottom: spaceMd`), bo tròn viên thuốc toàn bộ:
1. **Ô tìm kiếm**: `Input` bo tròn `borderRadius: radiusPill` (999px), `height: 40`, placeholder `"Tìm kiếm nội dung thay đổi..."`, hỗ trợ `allowClear` và tìm kiếm realtime / bấm Enter.
2. **Từ ngày**: `DatePicker` bo tròn `borderRadius: radiusPill` (999px), `height: 40`, `width: 140`, placeholder `"Từ ngày"`, `format="DD/MM/YYYY"`.
3. **Đến ngày**: `DatePicker` bo tròn `borderRadius: radiusPill` (999px), `height: 40`, `width: 140`, placeholder `"Đến ngày"`, `format="DD/MM/YYYY"`.
4. **Nút Tìm kiếm**: `Button` type `"primary"` bo tròn `borderRadius: radiusPill`, `height: 40`, icon `<SearchOutlined />`, text `"Tìm kiếm"`, màu `actionPrimary` (`#12468C` / `#0E6FD6`).

### 2.3. Bố cục Thẻ lịch sử 2 cột (Timeline Card Grid)
Mỗi phiên lịch sử được hiển thị dưới dạng khối lưới 2 cột (`gridTemplateColumns: '240px minmax(0, 1fr)'` hoặc `historyGroupGridStyle`):

#### A. Cột bên trái: Thông tin người cập nhật & Mốc thời gian
- **Dòng 1**:
  - Thời gian: Định dạng chuẩn `HH:mm DD/MM/YYYY` (ví dụ: `15:17 23/09/2026`), font chữ đen đậm `fontSizeLg - 1` (15px), `fontWeightBold`.
  - Pill Tag hành động: Bo tròn viên thuốc `borderRadius: radiusPill` (999px), padding `'2px 10px'`, viền mỏng `1px solid ${actionMeta.color}40`, nền nhạt `${actionMeta.bg}`, chữ `${actionMeta.color}`.
    - Cập nhật: Label `"Cập nhật"`, màu xanh action.
    - Tạo mới: Label `"Tạo mới"`, màu xanh lục `statusOperational`.
    - Xóa: Label `"Xóa"`, màu xám `#64748b`.
- **Dòng 2**: `Người cập nhật: [Họ và tên]` (ví dụ: `Nguyễn Văn An`).
- **Dòng 3**: `Đơn vị: [Tên đơn vị]` (mặc định lấy theo đơn vị của người dùng hoặc `Bộ Giao thông Vận tải`, **tuyệt đối không để trống `—`**).

#### B. Cột bên phải: Card nội dung chi tiết biến động
- **Khung card**: Nền xám nhạt `historyInfoCardStyle` (`background: '#f9f9f9'` hoặc `#ffffff`), bo góc `borderRadius: radiusSm`, viền `1px solid #e2e8f0`.
- **Thanh accent vạch đứng**: Cạnh trái có vạch đứng màu xanh dương đậm `historyAccentBarStyle(actionMeta.color)` (rộng `3px`, bo góc nhẹ, chạy dọc toàn bộ chiều cao của thẻ).
- **Tiêu đề card (Bắt buộc)**:
  ```tsx
  <Typography.Text style={historyInfoTitleStyle}>
    {isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:'}
  </Typography.Text>
  ```
  - In đậm, cỡ chữ `fontSizeMd + 1` (14-15px), màu đen `textPrimary`.
- **Danh sách biến động trường (Grid 4 cột chuẩn `historyChangeRowStyle`)**:
  - `gridTemplateColumns: 'minmax(110px, 0.9fr) minmax(130px, 1.25fr) 24px minmax(130px, 1.25fr)'`
  - Cột 1: **Tên trường:** (`label:`, in vừa `fontWeightMedium`, màu `textPrimary`).
  - Cột 2: **Giá trị cũ** (`oldValue`, màu `textSecondary`).
  - Cột 3: **Mũi tên** `→` (màu `textTertiary`, căn giữa).
  - Cột 4: **Giá trị mới** (`newValue`, in vừa `fontWeightMedium`, màu `textPrimary`).

---

## 3. Quy chuẩn định dạng dữ liệu trường GIS (Formatting Standard)

Khi hiển thị các trường dữ liệu GIS trong Drawer Lịch sử:

| Tên trường | Giá trị lưu trữ | Quy chuẩn hiển thị trên Drawer Lịch sử |
| :--- | :--- | :--- |
| **Loại đối tượng / Loại hình học** | `POINT`, `1` | `Đối tượng điểm` |
| | `LINE`, `LINESTRING`, `2` | `Đối tượng đường` |
| | `POLYGON`, `3` | `Đối tượng vùng` |
| **Tọa độ GPS** | `POINT(lng lat)` | Giữ nguyên cú pháp `POINT (107.12739... 10.40609...)` |
| | `LINESTRING(lng lat, ...)` | Xuống dòng hoặc bọc rõ ràng từng cặp tọa độ không tràn viền |
| | `POLYGON((...))` | Định dạng đa giác chuẩn WKT |
| **Quy tắc hiển thị** | `displayRule` (số/chuỗi) | Hiển thị giá trị quy tắc rõ ràng (ví dụ: `2`) |
| **Biểu tượng** | `iconId` (UUID) | Tên biểu tượng tiếng Việt kèm hình ảnh icon (ví dụ: `Phao luồng (PL01)`) |
| **Trạng thái** | `1`, `ACTIVE` | `Sử dụng` (hoặc `Hoạt động`) |
| | `0`, `INACTIVE` | `Khóa` |
| **File đính kèm** | Danh sách file ngăn cách bởi dấu phẩy hoặc xuống dòng | Tách thành từng dòng độc lập xuống dòng rõ ràng |

---

## 4. Cách sử dụng chuẩn tại các màn hình Danh mục GIS

Trong `PointObjectList.tsx`, `LineObjectList.tsx`, `PolygonObjectList.tsx`:

```tsx
// 1. Import chuẩn component và tokens
import { CommonHistoryDrawer, type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';

// 2. Mở Drawer và thiết lập bản ghi lịch sử chuẩn
const openHistoryDrawer = useCallback(async (record: SpatialObjectCategory) => {
  setHistoryTarget(record);
  setHistoryDrawerOpen(true);
  setHistoryLoading(true);

  try {
    const sym = symbols.find((s) => s.id === record.iconId);
    const orgUnit = authUser?.orgUnitName || 'Bộ Giao thông Vận tải';
    const entries: CommonHistoryEntry[] = [];

    // Lấy các thay đổi đã lưu trong localStorage (nếu có chỉnh sửa trước đó)
    const stored = getLocalGisHistory(record.id);
    if (stored && stored.length > 0) {
      entries.push(...stored);
    }

    // Mốc cập nhật gần nhất
    if (record.updatedAt && record.updatedAt !== record.createdAt) {
      entries.push({
        id: `update-${record.id}`,
        action: 'UPDATE',
        status: 'Cập nhật',
        actor: formatUserDisplayName(record.updatedBy, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName) || 'Nguyễn Văn An',
        orgUnitName: orgUnit,
        timestamp: record.updatedAt,
        description: `Cập nhật danh mục đối tượng "${record.name}"`,
        changes: [
          { field: 'name', oldValue: '—', newValue: record.name },
          { field: 'iconId', oldValue: '—', newValue: sym ? `${sym.name} (${sym.code})` : record.iconId || '(Không có)' },
          { field: 'status', oldValue: '—', newValue: record.status === 1 ? 'Sử dụng' : 'Khóa' },
        ],
      });
    }

    // Mốc tạo mới
    if (record.createdAt) {
      entries.push({
        id: `create-${record.id}`,
        action: 'CREATE',
        status: 'Tạo mới',
        actor: formatUserDisplayName(record.createdBy, (record as any).createdByName, userMap) || 'Nguyễn Văn An',
        orgUnitName: orgUnit,
        timestamp: record.createdAt,
        description: `Khởi tạo danh mục đối tượng "${record.name}"`,
        changes: [
          { field: 'code', oldValue: null, newValue: record.code },
          { field: 'name', oldValue: null, newValue: record.name },
          { field: 'geometryType', oldValue: null, newValue: geometryLabel },
          { field: 'iconId', oldValue: null, newValue: sym ? `${sym.name} (${sym.code})` : record.iconId || '(Không có)' },
          { field: 'status', oldValue: null, newValue: record.status === 1 ? 'Sử dụng' : 'Khóa' },
        ],
      });
    }

    setHistoryRecords(entries);
  } finally {
    setHistoryLoading(false);
  }
}, [symbols, userMap, authUser]);

// 3. Render Drawer với variant="berth" bắt buộc
<CommonHistoryDrawer
  open={historyDrawerOpen}
  onClose={() => {
    setHistoryDrawerOpen(false);
    setHistoryTarget(null);
  }}
  entityName={historyTarget?.name || 'đối tượng GIS'}
  records={historyRecords}
  loading={historyLoading}
  userMap={userMap}
  variant="berth"
  fieldLabelMap={{
    code: 'Mã đối tượng',
    name: 'Tên đối tượng',
    geometryType: 'Loại đối tượng',
    iconId: 'Biểu tượng',
    displayRule: 'Quy tắc hiển thị',
    coordinates: 'Tọa độ GPS',
    attachments: 'File đính kèm',
    status: 'Trạng thái',
  }}
/>
```

---

## 5. Quy chuẩn Bảng danh mục & Cỡ chữ ngày giờ (Table Layout & Typography Standard)

### 5.1. Bề rộng và cân đối các cột trên Bảng danh mục
Để tránh tình trạng khoảng cách từ cột **Tên đối tượng** đến cột **Biểu tượng** bị kéo giãn quá dài trên màn hình rộng, các màn hình danh mục GIS bắt buộc tuân thủ cấu hình bề rộng các cột cân đối:

| Cột | Khóa (`key`) | Bề rộng cơ sở (`width`) | Căn lề (`align`) | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **STT** | `stt` | `60` | `center` | Cố định trái (`fixed: 'left'`), type `mono`. |
| **Tên đối tượng** | `name` | `240` | `left` | Hiển thị Tên đậm (`fontSizeMd`) + Mã bên dưới. |
| **Biểu tượng** | `icon` | `130` | `center` | Ô biểu tượng 36x36px bo tròn đặt ở giữa. |
| **Loại hình học** | `geometryType` | `160` | `center` | Nhãn `Điểm (Point)` / `Đường (Line)` / `Vùng (Polygon)`. |
| **Cán bộ cập nhật** | `updatedBy` | `240` | `left` | Tên cán bộ + Ngày giờ định dạng chuẩn. |
| **Trạng thái** | `status` | `130` | `center` | Pill badge trạng thái `Sử dụng` / `Khóa`. |
| **Hành động** | `actions` | `100` | `center` | Cố định phải (`fixed: 'right'`). |

Cơ chế co giãn tự động của `DataTable`: Phân bổ đều và theo tỉ lệ (`proportional stretch`) lượng khoảng trống thừa của màn hình vào các cột nội dung linh hoạt (`name`, `geometryType`, `updatedBy`), tuyệt đối không dồn 100% khoảng trống vào duy nhất cột `name` gây mất cân đối thị giác.

### 5.2. Cỡ chữ ngày giờ (Date/Time Typography)
- Dòng hiển thị ngày giờ bên dưới Tên cán bộ trong cột **Cán bộ cập nhật** (`DD/MM/YYYY HH:mm:ss`) **bắt buộc sử dụng cỡ chữ `fontSizeMd` (`13.5px`)** (không dùng cỡ chữ bé `11px` / `fontSizeSm`).

---

## 6. Danh sách kiểm tra nghiệm thu (Checklist)

- [ ] **Tiêu đề Drawer**: Hiển thị icon đồng hồ, tiêu đề `Lịch sử thay đổi — [Tên đối tượng]`, badge viên thuốc `Tổng cộng [X]` và nút đóng `✕`.
- [ ] **Thanh Filter**: 1 hàng ngang gồm ô input tìm kiếm (bo tròn 999px), DatePicker "Từ ngày", DatePicker "Đến ngày", nút "Tìm kiếm" (bo tròn 999px, primary).
- [ ] **Cột trái**: Hiển thị thời gian định dạng chuẩn `HH:mm DD/MM/YYYY`, Pill Tag `Cập nhật` / `Tạo mới`, `Người cập nhật`, `Đơn vị: Bộ Giao thông Vận tải` (không bị trống `—`).
- [ ] **Cột phải**: Khung card có thanh accent đứng màu xanh dương bên trái, hiển thị tiêu đề in đậm **`Thông tin thay đổi:`** (hoặc `Thông tin thêm mới:`).
- [ ] **Lưới trường thay đổi**: Căn chỉnh 4 cột `Nhãn:` | `Giá trị cũ` | `→` | `Giá trị mới`.
- [ ] **Cỡ chữ ngày giờ**: Mốc thời gian dòng 2 trong cột Cán bộ cập nhật đạt chuẩn `13.5px` (`fontSizeMd`).
- [ ] **Khoảng cách cột bảng**: Cân đối giữa Tên đối tượng (240px) và Biểu tượng (130px), không bị trống hoác hoặc giãn dài bất thường.
- [ ] **Format trường**: Tọa độ GPS, file đính kèm, loại đối tượng, biểu tượng và trạng thái được format đẹp, xuống dòng rõ ràng, không tràn viền.
- [ ] **Không có lỗi IDE / TypeScript**: 0 errors, 0 unused imports.
