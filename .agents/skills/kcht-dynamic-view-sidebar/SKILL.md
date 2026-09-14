---
name: kcht-dynamic-view-sidebar
description: >-
  Quy chuẩn và hướng dẫn áp dụng component DynamicViewSidebar theo chuẩn mefobase-core cho Drawer Xem chi tiết hồ sơ KCHT.
  Kích hoạt khi tạo mới, refactor Drawer xem chi tiết hoặc chuyển đổi view chi tiết thủ công sang schema khai báo ViewFieldConfig[].
---

# KCHT Dynamic View Sidebar Standard & Automation Skill

## 1. Giới thiệu & Phạm vi áp dụng

Skill này hướng dẫn AI tự động áp dụng component **`DynamicViewSidebar`** vào các màn hình Xem chi tiết (Detail / View Drawer) trong dự án Quản lý Kết cấu hạ tầng giao thông Hàng hải (BXD/Cục Hàng hải).

Thiết kế theo triết lý cấu hình hướng khai báo (declarative schema) của `mefobase-core`, giúp thay thế toàn bộ mã JSX thủ công phức tạp (CSS grid, thẻ span nhãn/giá trị lặp lại) bằng các cấu hình `ViewFieldConfig[]`, `ViewSectionConfig[]` và `ViewTabConfig[]`.

### Vị trí & Cách import
Component được đặt tại `frontend/src/components/shared/dynamic-view-sidebar/` và đã được re-export tập trung tại `frontend/src/components/list-view`:

```tsx
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewFieldConfig,
  type ViewSectionConfig,
  type ViewTabConfig,
  type DynamicViewSidebarProps,
} from '@/components/list-view';
// hoặc import từ:
import {
  DynamicViewSidebar,
  ViewFieldType,
} from '@/components/shared/dynamic-view-sidebar';
```

---

## 2. Các quy tắc chuẩn mực bắt buộc (MANDATORY)

1. **Tuân thủ `erasableSyntaxOnly` (CẤM dùng TypeScript enum)**:
   Mọi kiểu trường hiển thị phải dùng `const object as const` và `type alias`:
   ```ts
   export const ViewFieldType = {
     Text: 'text',
     Number: 'number',
     Date: 'date',
     DateTime: 'datetime',
     Badge: 'badge',
     Tag: 'tag',
     Custom: 'custom',
   } as const;
   export type ViewFieldType = (typeof ViewFieldType)[keyof typeof ViewFieldType];
   ```

2. **Quy chuẩn bố cục & Thẩm mỹ Design System**:
   - **Nhãn trường**: Cố định `width: 220px`, màu `colors.sidebarBg` (#12468C), font 13.5px, độ đậm 600, tự động có dấu hai chấm `:` ngăn cách.
   - **Giá trị trường**: Cỡ chữ 13.5px, màu `#1e293b`, tự động xuống dòng (`wordBreak: 'break-word'`), tự động fallback hiển thị gạch ngang `'—'` nếu giá trị là `null`, `undefined` hoặc chuỗi rỗng.
   - **Lưới hiển thị 2 cột**: Mặc định hiển thị 2 cột cân xứng (`colSpan: 12`), các trường dài như Vị trí / Địa chỉ / Ghi chú đặt `colSpan: 24` để chiếm trọn hàng ngang.
   - **Khung Section**: Hộp thẻ bo viền trắng `sectionBoxStyle` (`#ffffff`, border `1px solid #e2e8f0`, bo góc 8px, padding `12px 18px 8px 18px`, bóng nhẹ), có tiêu đề kèm icon semantic màu `actionPrimary`.
   - **Thu gọn / Mở rộng Section (`collapsible`)**: Hỗ trợ toggle đóng mở các section phụ như "Thông tin phê duyệt".
   - **Pill Badge**: Các trường trạng thái, tình trạng vận hành hiển thị dạng viên thuốc tròn 2 đầu (`borderRadius: 999px`) với màu semantic (`statusOperational`, `statusAttention`, `statusCritical`, `statusDraft`).

3. **Chỉ lấy chuẩn 1 trường, không fallback toán tử linh tinh**:
   Không dùng toán tử `??`, `||`, ternary bừa bãi khi trích xuất giá trị hiển thị.

4. **Chiều rộng phải giống DynamicFormSidebar và không cho phép tùy chỉnh từng màn**:
   - `DynamicViewSidebar` dùng trực tiếp `DRAWER_FORM_WIDTH`, cùng nguồn với `DynamicFormSidebar`.
   - **CẤM** khai báo prop `width` trong `DynamicViewSidebarProps` và **CẤM** truyền `width` tại mọi `XxxAssetDetailContent.tsx`.
   - Không dùng các biến thể `900`, `980`, `1000`, `1040`, `60vw`, `90vw` hoặc biểu thức `Math.min(window.innerWidth, ...)` cho Drawer chi tiết tài sản.
   - `rootClassName`/`className` chỉ được dùng để định danh scope style, không được đổi chiều rộng Drawer.
   - Sau khi sửa, quét `rg -n -A 30 "<DynamicViewSidebar" frontend/src` và xác nhận không còn `width=` trong khối gọi component.

5. **Hai tab vòng đời tài sản phải đồng nhất trên toàn bộ menu Tài sản KCHT hàng hải**:
   - **TUYỆT ĐỐI CẤM sửa / hack vào common-component (`DynamicViewSidebar.tsx`)**:
     - Các component dùng chung của hệ thống phải giữ nguyên bản, không được tự ý viết hàm normalizer (`normalizeAssetLifecycleTab`), không can thiệp logic ngầm ép key/label bên trong common component.
     - Mọi quy chuẩn chuẩn hóa hiển thị bắt buộc phải được ghi rõ trong SKILL này và cấu hình chính xác, tường minh tại từng file `XxxAssetDetailContent.tsx`.
   - **Đồng nhất 1 loại hiển thị duy nhất: BẢNG (`CommonTable` kèm `TableOption`)**:
     - CẢ HAI tab `exploitation` và `adjustments` **BẮT BUỘC** hiển thị dữ liệu dạng bảng qua `CommonTable` với `TableOption`.
     - **TUYỆT ĐỐI CẤM** dùng dạng danh sách thẻ / card / div tự chế (`div.chk-detail-row`, `div.chk-detail-grid`, `sectionBoxStyle` lồng `map()` thủ công, v.v.). Mọi màn hình tài sản phải có giao diện bảng đồng nhất 100%.
   - **Tab khai thác tài sản**:
     - Khóa duy nhất: `key: 'exploitation'`, tiêu đề: `label: 'Khai thác tài sản'`, số lượng: `badgeCount: exploitationRows.length`.
     - Icon: `<BankOutlined />`.
     - Bảng `CommonTable<AssetExploitationResponse>` gồm 11 cột chuẩn: Đơn vị khai thác (rộng 220), Danh mục tài sản (200), ĐVT (120), Số lượng (120, align right), Thời hạn khai thác (160, Date), Tổng tiền thu được VNĐ (200, Money, align right), Chi phí liên quan VNĐ (190, Money, align right), Nộp NSNN VNĐ (220, Money, align right), Số tiền DA VNĐ (220, Money, align right), Ghi chú (200), Ngày cập nhật (140, Date).
   - **Tab lịch sử thay đổi nguyên giá**:
     - Khóa duy nhất: `key: 'adjustments'`, tiêu đề: `label: 'Lịch sử thay đổi nguyên giá'`, số lượng: `badgeCount: combinedAdjustments.length`.
     - Icon: `<AuditOutlined />`.
     - Bảng `CommonTable<AdjustmentRowItem>` gồm 12 cột chuẩn: Loại biến động (Tag Tăng/Giảm dạng pill với màu semantic), Mã yêu cầu (160), Số quyết định (180), Ngày ra quyết định (165, Date), Ngày điều chỉnh (150, Date), Nguyên giá trước VNĐ (200, Money, align right), Nguyên giá sau VNĐ (190, Money, align right), Giá trị còn lại trước VNĐ (210, Money, align right), Giá trị còn lại sau VNĐ (200, Money, align right), Lý do điều chỉnh (200), Ghi chú (200), Trạng thái phê duyệt (140, Template/Status pill).
   - Nội dung tùy biến của tab view bắt buộc khai báo bằng `customContent`; **CẤM** dùng `customRender` vì `DynamicViewSidebar` không đọc prop này và sẽ tạo tab trắng.
   - Không nhúng số lượng trực tiếp vào `label` (như `"Khai thác tài sản (0)"`); số lượng phải truyền qua `badgeCount` để component lõi định dạng badge thống nhất.
   - Mọi nội dung tab tùy biến phải nằm trong vùng cuộn chuẩn do `DynamicViewSidebar` cung cấp; không đặt lại chiều rộng Drawer hoặc tạo vùng cuộn ngang riêng ngoài bảng.

---

## 3. Các loại trường hiển thị (`ViewFieldType`)

| Type | Ý nghĩa | Cách tự động định dạng |
|---|---|---|
| `ViewFieldType.Text` | Văn bản thông thường | Hiển thị chuỗi kèm prefix/suffix |
| `ViewFieldType.Number` | Số tiền VNĐ hoặc số lượng | Tự động format dấu phẩy ngăn cách hàng nghìn qua `fmtNum` kèm suffix (vd: `VNĐ`, `m²`) |
| `ViewFieldType.Date` | Ngày tháng | Tự động format `DD/MM/YYYY` |
| `ViewFieldType.DateTime` | Ngày giờ | Tự động format `DD/MM/YYYY HH:mm:ss` |
| `ViewFieldType.Badge` | Badge trạng thái viên thuốc | Tự động bọc style `statusBadgeStyle` với màu từ `badgeColor` |
| `ViewFieldType.Tag` | Tag nhận diện (như mã tài sản) | Badge nổi bật với màu thương hiệu `actionPrimary` |
| `ViewFieldType.Custom` | Tùy biến JSX | Render qua hàm `render(value, record)` |

---

## 4. Cấu trúc Mẫu Chuẩn (Reference Implementation)

### 4.1. File cấu hình Detail Drawer (`XxxAssetDetailContent.tsx`)

```tsx
import React, { useMemo } from 'react';
import { BankOutlined, SlidersOutlined, AuditOutlined } from '@ant-design/icons';
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from '@/components/list-view';
import { colors, fontWeightBold, statusOperational, statusAttention, statusCritical } from '@/themetokenchk';

export interface AssetDetailProps {
  open: boolean;
  selectedRecord?: Record<string, any>;
  onClose: () => void;
}

export default function AssetDetailDrawer({
  open,
  selectedRecord: r,
  onClose,
}: AssetDetailProps) {
  const viewTabs = useMemo<ViewTabConfig[]>(() => {
    if (!r) return [];

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin cơ bản & Quản lý vận hành',
            icon: <BankOutlined />,
            fields: [
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: ViewFieldType.Tag,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
                    {String(val || '—')}
                  </span>
                ),
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: ViewFieldType.Badge,
                badgeColor: (val) => (val === 'Tốt' ? statusOperational : statusAttention),
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                colSpan: 24, // Full hàng
              },
            ],
          },
          {
            key: 'value_info',
            title: 'Thông tin giá trị & Khấu hao',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'originalValue',
                label: 'Nguyên giá',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
            ],
          },
          {
            key: 'approval_info',
            title: 'Thông tin phê duyệt',
            icon: <AuditOutlined />,
            collapsible: true, // Cho phép thu gọn/mở rộng
            defaultCollapsed: false,
            fields: [
              {
                name: 'approvalStatus',
                label: 'Trạng thái',
                type: ViewFieldType.Badge,
                badgeColor: () => statusOperational,
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.DateTime,
              },
            ],
          },
        ],
      },
      {
        key: 'files',
        label: 'Hồ sơ tài sản',
        badgeCount: 0,
        customContent: () => <div>Nội dung tệp đính kèm...</div>,
      },
    ];
  }, [r]);

  return (
    <DynamicViewSidebar
      open={open}
      onClose={onClose}
      record={r}
      title={`Chi tiết tài sản${r ? ` - ${r.assetName}` : ''}`}
      tabs={viewTabs}
    />
  );
}
```

### 4.2. File danh sách (`XxxAssetList.tsx`)

```tsx
<AssetDetailDrawer
  open={drawerMode === 'detail'}
  selectedRecord={selected}
  onClose={() => setDrawerMode(undefined)}
/>
```

### 4.3. Cấu hình Chuẩn cho 2 Tab Vòng Đời Tài sản (BẢNG TableOption)

Tuyệt đối không dùng dạng thẻ/card. Khai báo 2 tab bằng `CommonTable` kèm `TableOption`:

```tsx
// 1. Tab Khai thác tài sản
{
  key: 'exploitation',
  label: 'Khai thác tài sản',
  badgeCount: exploitationRows.length,
  icon: <BankOutlined />,
  customContent: (
    <div style={{ padding: '4px 0' }}>
      <CommonTable<AssetExploitationResponse>
        options={exploitationTableOption}
        dataSource={exploitationRows}
        total={exploitationRows.length}
      />
    </div>
  ),
}

// 2. Tab Lịch sử thay đổi nguyên giá
{
  key: 'adjustments',
  label: 'Lịch sử thay đổi nguyên giá',
  badgeCount: combinedAdjustments.length,
  icon: <AuditOutlined />,
  customContent: (
    <div style={{ padding: '4px 0' }}>
      <CommonTable<AdjustmentRowItem>
        options={adjustmentTableOption}
        dataSource={combinedAdjustments}
        total={combinedAdjustments.length}
      />
    </div>
  ),
}
```

---

## 5. Checklist Kiểm tra Hoàn tất (Zero Errors Verification)

- [ ] 1. Không dùng `enum` trong toàn bộ code mới.
- [ ] 2. Nhãn hiển thị chuẩn `width: 220px`, màu `colors.sidebarBg`, `fontWeight: 600`.
- [ ] 3. Tự động format ngày (`Date`/`DateTime`) và số tiền (`Number`).
- [ ] 4. Dọn sạch 100% Unused Imports / Unused Variables.
- [ ] 5. Chạy `npx tsc --noEmit` đạt mã 0 (0 lỗi).
- [ ] 6. Chạy `npx eslint` đạt mã 0 (0 errors, 0 warnings).
- [ ] 7. `DynamicViewSidebar` và `DynamicFormSidebar` cùng dùng `DRAWER_FORM_WIDTH`; model và mọi màn tài sản không còn prop `width` tùy chỉnh.
- [ ] 8. Tất cả màn tài sản dùng đúng hai key/label `exploitation` và `adjustments`, truyền số lượng bằng `badgeCount`.
- [ ] 9. Không còn `customRender` trong bất kỳ `XxxAssetDetailContent.tsx`; tab tùy biến đều dùng `customContent` và hiển thị được cả khi danh sách rỗng.
