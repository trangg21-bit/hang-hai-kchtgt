---
name: kcht-status-tabs
description: >-
  Quy chuẩn và hướng dẫn áp dụng component động CommonStatusTabs cho thanh tab trạng thái phê duyệt
  (Tất cả, Lưu tạm, Chờ Cảng vụ duyệt, Chờ Cục duyệt, Đã duyệt, Từ chối) trong mọi màn hình danh sách KCHT hàng hải.
  Kích hoạt khi tạo mới hoặc refactor màn hình danh sách có dãy tab trạng thái hoặc filter approvalStatus.
---

# KCHT Status Tabs Standard & Automation Skill

## 1. Giới thiệu & Phạm vi áp dụng
Skill này hướng dẫn AI tự động áp dụng component **`CommonStatusTabs`** vào mọi màn hình danh sách trong dự án Quản lý Kết cấu hạ tầng giao thông Hàng hải (BXD/Cục Hàng hải).

Component được đặt tại:
`frontend/src/components/shared/common-status-tabs/` và có thể import từ:
```ts
import { CommonStatusTabs, STANDARD_APPROVAL_TABS } from '@/components/list-view';
// hoặc
import { CommonStatusTabs } from '@/components/shared/common-status-tabs';
```

---

## 2. Quy chuẩn 6 Tab trạng thái phê duyệt bất biến

Dãy tab trạng thái phê duyệt **BẮT BUỘC** tuân thủ đúng thứ tự, nhãn và màu sắc semantic sau:

| STT | Mã Tab (`key`) | Tiêu đề (`label`) | Mã màu (`color`) | Semantic Token | Giá trị query API (`queryStatus`) |
|:---:|---|---|---|---|---|
| **1** | `all` | **Tất cả** | `#0E6FD6` | `actionPrimary` | `undefined` (không lọc) |
| **2** | `DRAFT` | **Lưu tạm** | `#93A3B3` | `statusDraft` | `'DRAFT'` |
| **3** | `PENDING_APPROVAL` | **Chờ Cảng vụ duyệt** | `#EDA100` | `statusAttention` | `'PENDING_APPROVAL'` |
| **4** | `APPROVED_LEVEL1` | **Chờ Cục duyệt** | `#0284C7` | `statusInfo` | `'APPROVED_LEVEL1'` |
| **5** | `APPROVED` | **Đã duyệt** | `#1BAF7A` | `statusOperational` | `'APPROVED'` |
| **6** | `REJECTED_LEVEL1` | **Từ chối** | `#E34948` | `statusCritical` | `'REJECTED_LEVEL1'` |

### Quy tắc số lượng bản ghi (MANDATORY):
1. **Số lượng tab Tất cả**: Bắt buộc bằng tổng số các tab con:
   $$\text{Tất cả} = \text{Lưu tạm} + \text{Chờ Cảng vụ duyệt} + \text{Chờ Cục duyệt} + \text{Đã duyệt} + \text{Từ chối}$$
   `CommonStatusTabs` đã cài đặt sẵn logic tự động cộng dồn này, không cần tính toán thủ công ở component cha.
2. **Gộp trạng thái Từ chối**: Nếu backend trả về riêng `REJECTED_LEVEL1` và `REJECTED_LEVEL2`, component tự động gộp cả 2 vào tab "Từ chối".
3. **Tuyệt đối không dùng mã legacy**: Không dùng các mã cũ như `PROPOSED (1)`, `APPROVED_LEVEL2 (4)`, `REJECTED (6)` mà chỉ dùng các enum chuỗi chuẩn trên.

---

## 3. Cách AI tự động áp dụng vào màn hình danh sách

### Trường hợp 1: Dữ liệu đếm số lượng từ API (`counts: Record<string, number>`)
Khi màn hình gọi API thống kê số lượng theo trạng thái:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScreenHeader,
  FilterTableLayout,
  CommonStatusTabs,
  CommonTable,
} from '@/components/list-view';

export default function AssetListPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState<number>(1);

  // Xử lý chuyển tab trạng thái
  const handleTabChange = useCallback((tabKey: string, queryStatus?: string) => {
    setActiveTab(tabKey);
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      approvalStatus: queryStatus, // 'all' sẽ trả về undefined
    }));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader ... />

      <FilterTableLayout
        hideStatusTabs={true} // Ẩn statusTabs cũ của layout để dùng CommonStatusTabs
        onFilterApply={handleSearch}
        onFilterReset={handleReset}
        filterContent={...}
      >
        {/* Thanh Tab trạng thái động chuẩn */}
        <div style={{ marginBottom: 10, padding: '10px 16px', background: '#fff', borderRadius: 8 }}>
          <CommonStatusTabs
            activeKey={activeTab}
            counts={statusCounts}
            onChange={handleTabChange}
          />
        </div>

        {/* Bảng dữ liệu */}
        <CommonTable ... />
      </FilterTableLayout>
    </div>
  );
}
```

---

### Trường hợp 2: Tự động đếm từ danh sách bản ghi client-side (`dataSource`)
Khi dữ liệu được load toàn bộ về client hoặc phân trang local, truyền thẳng `dataSource`:

```tsx
<CommonStatusTabs
  activeKey={activeTab}
  dataSource={recordList}
  statusField="approvalStatus" // Tự động group count theo trường này
  onChange={(tabKey, queryStatus) => {
    setActiveTab(tabKey);
    // Lọc local:
    // const filtered = queryStatus ? recordList.filter(r => r.approvalStatus === queryStatus) : recordList;
  }}
/>
```

---

### Trường hợp 3: Màn hình phi phê duyệt (Quản lý User, Danh mục...) với `customTabs`
Đối với các màn hình không có luồng phê duyệt 2 cấp mà chỉ có trạng thái hoạt động:

```tsx
<CommonStatusTabs
  activeKey={activeTab}
  customTabs={[
    { key: 'all', label: 'Tất cả', color: '#0E6FD6', count: totalCount },
    { key: 'ACTIVE', label: 'Đang sử dụng', color: '#1BAF7A', count: activeCount },
    { key: 'INACTIVE', label: 'Tạm dừng', color: '#E34948', count: inactiveCount },
  ]}
  onChange={(key) => {
    setActiveTab(key);
    setFilters(prev => ({ ...prev, status: key === 'all' ? undefined : key }));
  }}
/>
```

---

## 4. Checklist kiểm tra khi hoàn thành màn hình (Self-Verification)
- [ ] Tab "Tất cả" luôn đứng đầu tiên, có số lượng bằng tổng các tab con.
- [ ] Khi click tab "Tất cả", tham số `approvalStatus` gửi về backend là `undefined`.
- [ ] Tab đang chọn có đường gạch chân màu `#0E6FD6`, chữ in đậm `600`.
- [ ] Badge số lượng hiển thị hình viên thuốc bo tròn (`radiusPill`), màu nền mờ `${tabColor}15` và chữ màu `${tabColor}`.
- [ ] Không có cảnh báo hoặc lỗi đỏ trong TypeScript và ESLint (`0 errors, 0 warnings`).
