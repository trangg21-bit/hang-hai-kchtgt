# CHK Theme Standard Architecture (Quy chuẩn Giao diện CHK - Metronic 8 / PrimeNG)

Tài liệu quy định kiến trúc giao diện chuẩn theo **Phong cách Cục Hàng Không (CHK - `D:\project\chk`)**, được chuẩn hóa qua màn hình mẫu **Hệ thống VTS CHK** (`/vts-system-chk`).

---

## 1. Nguyên tắc cốt lõi (Core Principles)

| # | Đặc trưng | Giao diện cũ (`tokens.ts`) | Chuẩn CHK Theme (`themetokenchk.ts`) |
| :--- | :--- | :--- | :--- |
| 1 | **Màu chủ đạo (Action Primary)** | `#0E6FD6` (Xanh sáng) | `#273e7c` (Xanh Navy đậm trang trọng, uy quyền) |
| 2 | **Màu nền trang (Page Bg)** | `#f0f2f5` | `#eef0f8` (Xám ánh xanh Metronic 8) |
| 3 | **Bo góc Controls (Input/Button/Select)** | `radiusPill: 999px` (Viên thuốc) | `radiusPill: 999px` (Giữ viên thuốc — `.form-control`/`.btn` của Metronic) |
| 4 | **Bo góc Card/Drawer/Modal** | `radiusMd: 8px` | `radiusLg: 10px` (Khung sắc nét, gọn gàng) |
| 5 | **Bảng dữ liệu (DataTable)** | Header trắng/xanh nhạt | Header xám `#e4e4e4` + chữ navy `#273e7c` 600 + sọc ngựa vằn `#f9fafb` |
| 6 | **Badge Trạng thái** | Viên thuốc có viền | Pill Badge pastel viền nhạt (`statusBadgeStyle`: nền `color 15`, viền 1px `color 40`) — giữ chuẩn Pill Badge toàn hệ thống |
| 7 | **Thanh cuộn (Scrollbar)** | Dày 8px | Mảnh 3px (`scrollbarSize: 3`) tinh tế |

---

## 2. File Nguồn Chuẩn (Single Source of Truth)

Mọi màn hình áp dụng CHK Theme **BẮT BUỘC**:
1. Nhập token từ `frontend/src/themetokenchk.ts`.
2. Bọc toàn bộ JSX trong `<ThemeTokenProvider tokens={themeTokenChk}>`.
3. **TUYỆT ĐỐI CẤM** import chéo từ `frontend/src/tokens.ts` hoặc `frontend/src/theme.ts`.

```tsx
// ✅ ĐÚNG:
import * as themeTokenChk from '../../themetokenchk';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeSm,
  radiusSm, radiusLg, spaceFormField, spaceMd, spaceSm,
  inputStyle, selectStyle, primaryButtonStyle, outlineButtonStyle,
  statusBadgeStyle, icons,
} from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

return (
  <ThemeTokenProvider tokens={themeTokenChk}>
    {/* Screen Content */}
  </ThemeTokenProvider>
);
```

---

## 3. Quy chuẩn Thành phần Giao diện (Components Standard)

### 3.1. Bảng Dữ liệu (DataTable)
- Cột **STT**: `align: 'center'`, `fixed: 'left'`, rộng `60px`.
- Cột **Tên / Mã KCHT**: `fixed: 'left'`, rộng `260px`, dòng 1 Tên đối tượng click xem chi tiết (`cellTitleStyle`), dòng 2 Mã đối tượng (`cellSubtitleStyle`).
- Cột **Trạng thái & Tình trạng**: Dùng `statusBadgeStyle(color)`.
- Cột **Cán bộ cập nhật**: Rộng `220px`, dòng 1 Họ tên đậm `#0F172A`, dòng 2 Ngày giờ `DD/MM/YYYY HH:mm:ss`.
- Cột **Thao tác**: Truyền qua `rowActions` của `DataTable`.

### 3.2. Bộ lọc Sidebar (Filter Sidebar)
- Tiêu đề nhóm lọc: `color: colors.sidebarBg`, `fontWeight: fontWeightBold`, `fontSize: fontSizeMd`.
- Các trường nhập liệu (`Input`, `Select`, `OrgUnitTreeSelect`, `DatePicker.RangePicker`): Dùng `inputStyle` hoặc `selectStyle` (chiều cao 40px, bo tròn viên thuốc `radiusPill` 999px, viền `#e4e4e4`).
- Chân trang Sidebar: Chỉ giữ 2 nút **Làm mới** (`outlineButtonStyle`) và **Tìm kiếm** (`primaryButtonStyle`).

### 3.3. Form Drawer (Tạo mới / Xem chi tiết / Chỉnh sửa)
- Kích thước: `size="50%"` hoặc `width="50%"`, bo góc 10px (`cardRadius`).
- Tabs: Dạng dòng phẳng `tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}`.
- Lưới Form: 2 cột bằng `<Row gutter={16}><Col span={12}>`, khoảng cách `spaceFormField` (12px).
- Nút bấm chân Drawer:
  - Xem chi tiết: Nút duyệt C1/C2 (nếu có quyền) hoặc đóng.
  - Tạo mới: Nút **Lưu tạm** (`outlineButtonStyle`), **Lưu và gửi phê duyệt** (`primaryButtonStyle`), **Lưu và phê duyệt** (`background: statusOperational`).
  - Chỉnh sửa: Nút **Hủy** (`outlineButtonStyle`), **Cập nhật** (`primaryButtonStyle`).

---

## 4. Màn hình Tham chiếu Chuẩn (Reference Screen)

- Danh sách: [`frontend/src/pages/vtssystemchk/VtsSystemChkList.tsx`](frontend/src/pages/vtssystemchk/VtsSystemChkList.tsx)
- Form Drawer: [`frontend/src/pages/vtssystemchk/VtsSystemChkForm.tsx`](frontend/src/pages/vtssystemchk/VtsSystemChkForm.tsx)
- Bộ Theme Tokens: [`frontend/src/themetokenchk.ts`](frontend/src/themetokenchk.ts)
