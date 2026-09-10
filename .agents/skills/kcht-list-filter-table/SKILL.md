---
name: kcht-list-filter-table
description: >-
  Quy chuẩn và hướng dẫn phối hợp chuẩn bộ 4 thành phần trong màn hình danh sách KCHT hàng hải:
  FilterTableLayout + TableFilter (mode="fieldsOnly") + CommonStatusTabs (statusTabsNode) + CommonTable (dataSource).
  Kích hoạt khi tạo mới hoặc refactor bất kỳ màn hình danh sách nào có thanh lọc Sidebar, tab trạng thái và bảng dữ liệu.
---

# KCHT List Screen Standard: FilterTableLayout + TableFilter + CommonStatusTabs + CommonTable

## 1. Giới thiệu & Phạm vi áp dụng
Skill này thiết lập quy chuẩn **bất biến** khi kết hợp 4 component nòng cốt cho màn hình danh sách (List Screen) trong hệ thống Quản lý Kết cấu hạ tầng giao thông Hàng hải (BXD / Cục Hàng hải):
1. **`FilterTableLayout`**: Layout tổng chia 2 cột: Sidebar bộ lọc bên trái (rộng 280px) và Khu vực bảng dữ liệu bên phải.
2. **`TableFilter`**: Render danh sách các ô nhập liệu tìm kiếm/lọc trong Sidebar.
3. **`CommonStatusTabs`**: Dãy 6 tab trạng thái phê duyệt semantic (Tất cả, Lưu tạm, Chờ Cảng vụ duyệt, Chờ Cục duyệt, Đã duyệt, Từ chối).
4. **`CommonTable`**: Bảng dữ liệu chuẩn Ant Design + ABP Zero style.

Tất cả các component trên đều được import trực tiếp từ:
```ts
import {
  ScreenHeader,
  FilterTableLayout,
  TableFilter,
  CommonStatusTabs,
  CommonTable,
  TableColumnType,
  type TableOption,
  type FilterOption,
  type ScreenHeaderAction,
} from '@/components/list-view';
```

### Màn hình mẫu chuẩn đối chiếu (Golden Screen Reference)
Mọi màn hình danh sách KCHTGT **BẮT BUỘC** phải có bố cục và trải nghiệm thị giác tương tự 100% màn hình mẫu chuẩn:
- **`frontend/src/pages/assetmovement/PortTerminalAssetList.tsx`** (Quản lý tài sản bến cảng - `/asset/port-terminal`).
- **`frontend/src/pages/assetmovement/TransferAreaAssetList.tsx`** (Quản lý tài sản khu chuyển tải - `/asset/transfer-area`).

Cụ thể bố cục 2 cột bất biến:
- **Header**: Breadcrumb cấp 1 > cấp 2, nút `+ Thêm mới` pill bo tròn màu xanh ở góc phải trên.
- **Sidebar trái (280px)**: `hideFilterToggle={true}`, chứa các trường lọc `radiusPill` (cao 40px), đáy chỉ có 2 nút: `Reload` tròn và `Tìm kiếm` pill xanh.
- **Khu vực phải**: Card trên chứa dãy 6 tab trạng thái `CommonStatusTabs` có badge viên thuốc; Card dưới chứa bảng `CommonTable` chiếm trọn chiều cao còn lại.

### Bảng Quy chuẩn Màu sắc Nút & Controls Tương tác (MANDATORY)

| Vị trí | Nút / Control | Hình dáng (Shape) | Chiều cao / Size | Màu nền (Background) | Màu chữ / Icon | Viền (Border) |
|---|---|---|---|---|---|---|
| **ScreenHeader** | `+ Thêm mới` | Viên thuốc (`radiusPill` 999px) | `40px` | `actionPrimary` (`#204e9c` / Navy) | `#FFFFFF` (Trắng) | Không viền (`border: 'none'`) |
| **Sidebar Đáy** | `Tìm kiếm` | Viên thuốc (`radiusPill` 999px) | `40px`, padding: `0 14px` | `actionPrimary` (`#204e9c` / Navy) | `#FFFFFF` (Trắng) | `1px solid #204e9c` |
| **Sidebar Đáy** | `Làm mới (Reload)` | Tròn (`shape="circle"`) | `38px x 38px` | Trắng / Trong suốt | `textSecondary` (`#5E6278`) | `1px solid #e4e4e4` (`borderDefault`) |
| **Bảng (DataTable)** | `Hành động (...)` | Tròn (`shape="circle"`) | `32px x 32px` | `#FFFFFF` (Trắng) | `textSecondary` (`#5E6278`) | `1px solid #e4e4e4` (`borderDefault`) |
| **Drawer Footer** | `Lưu tạm` | Viên thuốc (`radiusPill` 999px) | `40px` | `#FFFFFF` (Trắng) | `textSecondary` (`#5E6278`) | `1px solid #e4e4e4` |
| **Drawer Footer** | `Lưu và gửi duyệt` | Viên thuốc (`radiusPill` 999px) | `40px` | `#0284C7` (Xanh da trời Sky) | `#FFFFFF` (Trắng) | `border: 'none'` |
| **Drawer Footer** | `Lưu và phê duyệt` | Viên thuốc (`radiusPill` 999px) | `40px` | `statusOperational` (`#1BAF7A` / Emerald) | `#FFFFFF` (Trắng) | `border: 'none'` |
| **Modal / Drawer** | `Hủy / Đóng` | Viên thuốc (`radiusPill` 999px) | `40px` | `#FFFFFF` (Trắng) | `textSecondary` (`#5E6278`) | `1px solid #e4e4e4` |

---

## 2. Các lỗi sai nghiêm trọng CẤM MẮC PHẢI (Anti-Patterns)

### ❌ Lỗi 1: `TableFilter` bị nhân đôi nút Tìm kiếm & mất hết ô lọc
- **Nguyên nhân**: `TableFilter` mặc định có `mode="full"`, tự sinh ra Header và Footer (chứa nút Reload + Tìm kiếm). Khi đặt vào trong `FilterTableLayout` (vốn đã có sẵn Footer Reload + Tìm kiếm), giao diện sẽ bị **2 cặp nút Tìm kiếm/Reload (một ở đỉnh, một ở đáy)** và phần nội dung ở giữa bị co rúm hoặc trống rỗng.
- **Quy tắc bắt buộc**: Khi dùng trong `FilterTableLayout`, **BẮT BUỘC** truyền `mode="fieldsOnly"`.

### ❌ Lỗi 2: Sai prop `filters` thành `filterConfig`
- **Nguyên nhân**: `TableFilter` nhận danh sách các trường qua prop **`filters={filterConfigs}`** (hoặc cấu hình trọn gói `config`). Nếu truyền `filterConfig={...}`, component sẽ không nhận được danh sách trường -> **Sidebar lọc bị trắng xóa hoàn toàn**.
- **Quy tắc bắt buộc**: Luôn dùng **`filters={filterConfigs}`**.

### ❌ Lỗi 3: Sai chữ ký callback `onChange` của `TableFilter`
- **Nguyên nhân**: `TableFilter` gọi `onChange(nextValues)` với tham số là toàn bộ object `values: Partial<T>`, KHÔNG phải `(key, val)`.
- **Quy tắc bắt buộc**: Dùng `onChange={setDraftFilters}`.

### ❌ Lỗi 4: Thừa dropdown `approvalStatus` trong Sidebar
- **Nguyên nhân**: Trạng thái phê duyệt đã được hiển thị bằng dãy 6 tab semantic `CommonStatusTabs` ở ngay trên đầu bảng. Đưa thêm `approvalStatus` vào Sidebar sẽ gây xung đột giá trị lọc giữa tab và sidebar.
- **Quy tắc bắt buộc**: **KHÔNG** đưa `approvalStatus` vào danh sách `filters` của `TableFilter`.

### ❌ Lỗi 5: Đặt `CommonStatusTabs` sai vị trí
- **Nguyên nhân**: Nhúng thẻ `<div>` chứa `CommonStatusTabs` vào trong `children` của `FilterTableLayout` làm hỏng chiều cao `calc(100vh - ...)` và vỡ viền card của layout.
- **Quy tắc bắt buộc**: Luôn truyền `CommonStatusTabs` qua prop **`statusTabsNode={...}`** của `FilterTableLayout`.

### ❌ Lỗi 6: Nhầm prop dữ liệu của `CommonTable`
- **Nguyên nhân**: Dùng `data={data}` thay vì `dataSource={data}`. `CommonTable` nhận prop `dataSource: T[]`.
- **Quy tắc bắt buộc**: Luôn truyền **`dataSource={data}`**.

### ❌ Lỗi 7: Quên `hideFilterToggle` trên `FilterTableLayout`
- **Nguyên nhân**: Theo quy chuẩn hệ thống KCHTGT Hàng hải, thanh Sidebar hiển thị trực tiếp toàn bộ trường lọc trên thanh cuộn dọc 280px (`overflowY: 'auto'`), không có nút toggle mở rộng/thu gọn.
- **Quy tắc bắt buộc**: Luôn đặt **`hideFilterToggle={true}`** trên `FilterTableLayout`.

### ❌ Lỗi 8: Dùng sai prop `variant` cho nút Thêm mới
- **Nguyên nhân**: Trong `ScreenHeaderAction`, dùng `type: 'primary'` thay vì `variant: 'primary'`. `ScreenHeader` chỉ áp dụng màu nền `actionPrimary` và bo tròn pill khi khai báo `variant: 'primary'`.
- **Quy tắc bắt buộc**: Luôn dùng `{ key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary', onClick: ... }`.

### ❌ Lỗi 9: Dùng sai prop `tokens` cho `ThemeTokenProvider`
- **Nguyên nhân**: Truyền `<ThemeTokenProvider value={themeTokenChk}>` thay vì `tokens={themeTokenChk}`. Do đó context nhận `undefined` và fallback về bộ token mặc định (xanh sáng thay vì xanh navy thương hiệu CHK).
- **Quy tắc bắt buộc**: Luôn bọc ngoài cùng bằng `<ThemeTokenProvider tokens={themeTokenChk}>`.

---

## 3. Khung mã chuẩn (Golden Pattern Template)

```tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dayjs } from 'dayjs';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  ScreenHeader,
  FilterTableLayout,
  TableFilter,
  CommonStatusTabs,
  CommonTable,
  TableColumnType,
  type TableOption,
  type FilterOption,
  type ScreenHeaderAction,
} from '@/components/list-view';
import { ThemeTokenProvider } from '@/context/ThemeTokenContext';
import * as themeTokenChk from '@/themetokenchk';

export default function StandardAssetListPage() {
  const [data, setData] = useState<MyAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filters chính thức (khi nhấn Tìm kiếm hoặc chuyển Tab)
  const [filters, setFilters] = useState<MyAssetFilters>({});

  // Draft filters (lưu giá trị người dùng đang gõ/chọn trên Sidebar trước khi nhấn Tìm kiếm)
  const [draftFilters, setDraftFilters] = useState<MyAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});

  // 1. Tải dữ liệu
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMyAssets({ ...filters, page: page - 1, size: pageSize });
      setData(res.content);
      setTotal(res.totalElements);

      // Thống kê số lượng tab trạng thái
      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchMyAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) => fetchMyAssets({ ...baseFilters, approvalStatus })),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((k, i) => [k, statusPages[i].totalElements])),
      });
    } catch (cause: unknown) {
      setError('Không thể tải danh sách bản ghi.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 2. Xử lý Áp dụng bộ lọc (Nhấn nút Tìm kiếm ở đáy Sidebar)
  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange;
    setFilters({
      ...draftFilters,
      updatedFrom: range?.[0]?.format('YYYY-MM-DD'),
      updatedTo: range?.[1]?.format('YYYY-MM-DD'),
    });
  }, [draftFilters]);

  // 3. Xử lý Làm mới bộ lọc (Nhấn nút Reload tròn ở đáy Sidebar)
  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setFilters({});
    setPage(1);
  }, []);

  // 4. Danh sách trường lọc Sidebar
  const filterOptions = useMemo<FilterOption[]>(() => [
    {
      key: 'orgUnitId',
      label: 'Đơn vị quản lý',
      type: 'treeSelect',
      organizations,
    },
    {
      key: 'usingOrgUnitId',
      label: 'Đơn vị sử dụng',
      type: 'treeSelect',
      organizations,
    },
    {
      key: 'assetCode',
      label: 'Mã tài sản',
      type: 'text',
      placeholder: 'Tìm theo mã tài sản',
    },
    {
      key: 'assetName',
      label: 'Tên tài sản',
      type: 'text',
      placeholder: 'Tìm theo tên tài sản',
    },
    {
      key: 'assetCondition',
      label: 'Tình trạng tài sản',
      type: 'select',
      placeholder: 'Chọn tình trạng',
      options: ASSET_CONDITIONS.map((val) => ({ value: val, label: val })),
    },
    {
      key: 'updatedRange',
      label: 'Ngày cập nhật',
      type: 'dateRange',
    },
    // TUYỆT ĐỐI KHÔNG thêm approvalStatus vào đây!
  ], [organizations]);

  return (
    <ThemeTokenProvider value={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
        {/* Header trên cùng */}
        <ScreenHeader
          title="Quản lý tài sản"
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý tài sản' }]}
          actions={headerActions}
        />

        {/* Layout chia 2 cột: Sidebar lọc (trái) + Bảng (phải) */}
        <FilterTableLayout
          hideFilterToggle={true}
          statusTabsNode={
            <CommonStatusTabs
              activeKey={filters.approvalStatus || 'all'}
              counts={statusCounts}
              onChange={(_key, status) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, approvalStatus: status }));
              }}
            />
          }
          loading={loading}
          error={Boolean(error)}
          errorMessage={error}
          onRetry={() => void loadData()}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          filterContent={
            <TableFilter
              mode="fieldsOnly"
              filters={filterOptions}
              values={draftFilters}
              onChange={setDraftFilters}
            />
          }
        >
          {/* Bảng dữ liệu chiếm trọn không gian chính */}
          <CommonTable<MyAsset>
            options={tableOptions}
            dataSource={data}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
          />
        </FilterTableLayout>
      </div>
    </ThemeTokenProvider>
  );
}
```

---

## 4. Checklist tự kiểm tra trước khi hoàn thành (Self-Verification Checklist)
Mỗi khi tạo mới hoặc sửa bất kỳ màn hình danh sách nào, AI **BẮT BUỘC** đối soát toàn bộ 7 mục:
- [ ] `TableFilter` có `mode="fieldsOnly"`.
- [ ] `TableFilter` nhận `filters={filterOptions}`, KHÔNG dùng `filterConfig`.
- [ ] `TableFilter` nhận `onChange={setDraftFilters}`.
- [ ] `FilterTableLayout` có `hideFilterToggle={true}`.
- [ ] `FilterTableLayout` nhận `onFilterApply={handleFilterApply}` và `onFilterReset={handleFilterReset}`.
- [ ] `CommonStatusTabs` được truyền qua prop `statusTabsNode={...}` của `FilterTableLayout`, KHÔNG nằm trong thẻ con `<div>`.
- [ ] `CommonTable` nhận dữ liệu qua `dataSource={data}`, KHÔNG dùng `data={data}`.
- [ ] TypeScript & ESLint pass 100% (`0 errors, 0 warnings`).
