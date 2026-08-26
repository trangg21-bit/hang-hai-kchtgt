# KHUNG MẪU CHUẨN XÂY DỰNG MÀN HÌNH QUẢN LÝ KCHTGT (INFRASTRUCTURE SCREEN BLUEPRINT)

> **MÀN HÌNH THAM CHIẾU CHUẨN CHÍNH THỨC (GOLDEN STANDARD):**
> 🌟 **Quản lý Cảng biển (`/port` — `frontend/src/services/port/PortListPage.tsx`)**
> 
> **MỤC ĐÍCH**: Đây là tài liệu khung mẫu chuẩn (Golden Template) lấy trực tiếp từ màn hình Cảng biển (`/port`). Khi AI hoặc Developer cần xây dựng bất kỳ màn hình quản lý hạ tầng mới nào (Hải đăng, Luồng tàu, Bến cảng, Đê kè, Trạm radar, Trạm bờ, VTS, AIS...), **BẮT BUỘC** sao chép và kế thừa theo đúng chuẩn màn hình Cảng biển này để đảm bảo:
> 1. Đồng bộ 100% giao diện, căn lề, cỡ chữ, và hành vi trải nghiệm.
> 2. Không gây lỗi chéo (Zero Side Effects) sang các màn hình khác khi dùng chung component/hàm.
> 3. Không mất thời gian căn chỉnh thủ công từng màn hình.

---

## 1. NGUYÊN TẮC BẢO VỆ CHỐNG LỖI LIÊN ĐỚI (ZERO BREAKING CHANGES)

1. **Tuyệt đối KHÔNG sửa logic component dùng chung** (`DataTable.tsx`, `FilterTableLayout.tsx`, `AppDrawer.tsx`, `theme.ts`, `tokens.ts`) trừ khi có yêu cầu nâng cấp toàn hệ thống và đã kiểm tra ảnh hưởng trên toàn bộ 28 màn hình.
2. **Không tự chế CSS riêng, không hardcode màu/padding**: Chỉ sử dụng tokens từ `tokens.ts` và styles chuẩn từ `theme.ts`.
3. **Mọi dropdown `Select` có tìm kiếm BẮT BUỘC dùng hàm bỏ dấu tiếng Việt**:
   ```tsx
   filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
   ```
4. **Hiển thị thông tin người dùng BẮT BUỘC là Họ và tên (`fullName`)**: Không hiển thị email (ví dụ `admin@hh.gov.vn`) hay UUID.
5. **Cột Thao tác BẮT BUỘC truyền qua prop `rowActions={rowActions}` của `DataTable`**: Không tự chèn cột `{ title: 'Thao tác' }` vào mảng `columns`.

---

## 2. CODE MẪU FRONTEND CHUẨN CHO MÀN HÌNH DANH SÁCH (`<Feature>List.tsx`)

```tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Space, Typography, Tag } from 'antd';
import { PlusOutlined, FileExcelOutlined, EyeOutlined, EditOutlined, DeleteOutlined, HistoryOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// ── Components dùng chung ──────────────────────────────────────────
import { ScreenHeader, DataTable, Pagination } from '../../components/list-view';
import FilterTableLayout, { type StatusTab } from '../../components/list-view/FilterTableLayout';
import EmptyState from '../../components/EmptyState';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
import toast, { modal } from '../../components/ToastNotification';

// ── Tokens & Theme ──────────────────────────────────────────────────
import { colors } from '../../theme';
import {
  statusOperational, statusAttention, statusCritical, statusDraft,
  textPrimary, textSecondary, textTertiary,
  fontSizeMd, fontSizeSm, fontSizeLg, fontWeightBold, fontWeightMedium,
  radiusPill, radiusSm, radiusMd, surfaceCard, surfacePage, borderDefault,
  spaceXs, spaceSm, spaceMd, spaceLg, spaceFormField,
  primaryButtonStyle, outlineButtonStyle, selectStyle, inputStyle,
} from '../../tokens';

// ── Stores & Services ───────────────────────────────────────────────
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { getProvinceNameById } from '../../types/common';
import { userService } from '../../services/userService';
import { organizationService } from '../../services/organizationService';

// ── Types ───────────────────────────────────────────────────────────
import { ApprovalStatus, ConditionStatus } from '../../types/enums';

export default function InfrastructureFeatureList() {
  const user = useAuthStore((s) => s.user);
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // Data & Pagination
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filter States
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>(undefined);
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>(undefined);

  // Dropdown Lookups & User Mapping
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // 1. Nạp danh mục Lookup & User Mapping (Họ và tên)
  useEffect(() => {
    (async () => {
      try {
        const [orgRes, userRes] = await Promise.allSettled([
          organizationService.list({ pageSize: 1000 }),
          userService.list({ pageSize: 1000 }),
        ]);
        if (orgRes.status === 'fulfilled' && orgRes.value) {
          setOrgUnits(orgRes.value.data || (orgRes.value as any).content || []);
        }
        if (userRes.status === 'fulfilled' && userRes.value) {
          const users = userRes.value.data || (userRes.value as any).content || [];
          const m = new Map<string, string>();
          users.forEach((u: any) => {
            const name = u.fullName || u.username || u.id;
            m.set(u.id, name);
            if (u.username) m.set(u.username, name);
            if (u.email) m.set(u.email, name);
          });
          setUserMap(m);
        }
      } catch {}
    })();
  }, []);

  // 2. Tab Status Counts (6 Tabs chuẩn)
  const getTabCount = (st: string) => statusCounts[st] || 0;
  const statusTabs: StatusTab[] = useMemo(() => [
    { key: 'ALL', label: 'Tất cả', count: getTabCount('ALL'), active: activeTab === 'ALL' },
    { key: 'DRAFT', label: 'Lưu tạm', count: getTabCount('DRAFT'), active: activeTab === 'DRAFT' },
    { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', count: getTabCount('PENDING_APPROVAL'), active: activeTab === 'PENDING_APPROVAL' },
    { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', count: getTabCount('APPROVED_LEVEL1'), active: activeTab === 'APPROVED_LEVEL1' },
    { key: 'APPROVED', label: 'Đã duyệt', count: getTabCount('APPROVED'), active: activeTab === 'APPROVED' },
    { key: 'REJECTED', label: 'Bị trả về', count: (statusCounts['REJECTED_LEVEL1'] || 0) + (statusCounts['REJECTED_LEVEL2'] || 0), active: activeTab === 'REJECTED' },
  ], [statusCounts, activeTab]);

  // 3. Cấu hình Cột Bảng chuẩn (Columns)
  const columns: any[] = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center',
      fixed: 'left',
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      key: 'name',
      label: 'TÊN / MÃ KCHT',
      width: 240,
      fixed: 'left',
      render: (_: any, record: any) => (
        <div style={{ lineHeight: '1.4' }}>
          <div
            onClick={() => { setSelectedRecord(record); setDrawerMode('view'); setDrawerOpen(true); }}
            style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeMd, cursor: 'pointer' }}
          >
            {record.name || '—'}
          </div>
          <div style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>
            {record.code || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 200,
      ellipsis: false,
      render: (val: string) => val || '—',
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      align: 'center',
      ellipsis: false,
      render: (status: any) => (
        <Tag color="success" style={{ borderRadius: radiusPill, padding: '2px 10px', fontSize: fontSizeMd }}>
          {status || 'Đang hoạt động'}
        </Tag>
      ),
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 180,
      align: 'center',
      ellipsis: false,
      render: (status: any) => (
        <Tag color="processing" style={{ borderRadius: radiusPill, padding: '2px 10px', fontSize: fontSizeMd }}>
          {status || 'Đã duyệt'}
        </Tag>
      ),
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 200,
      ellipsis: false,
      render: (val: string, record: any) => {
        const raw = val || record.updatedByName || record.createdByName || record.updatedBy || record.createdBy || '—';
        const name = userMap.get(raw) || userMap.get(record.updatedBy || '') || userMap.get(record.createdBy || '') || raw;
        const date = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35' }}>
            <div style={{ fontWeight: fontWeightBold, color: '#0F172A', fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
  ], [page, pageSize, userMap]);

  // 4. Menu Thao tác dòng (rowActions)
  //
  // ⚠️ BẮT BUỘC: nút "Chỉnh sửa" phải gọi `canEditApprovalRecord()` — CẤM tự viết lại
  // điều kiện trạng thái ở từng màn. Ma trận chuẩn xem `approval-2-level-spec.md` mục 3.9:
  //   DRAFT / REJECTED_LEVEL1 / REJECTED_LEVEL2 -> hiện, cần `<resource>:update`
  //   PENDING_APPROVAL / APPROVED_LEVEL1        -> ẨN (hồ sơ đóng băng trong vòng duyệt)
  //   APPROVED                                  -> hiện, cần `<resource>:approvec2` (T12)
  //   ARCHIVED                                  -> ẨN
  const rowActions = useCallback((record: any) => {
    const isOwner = record.createdBy === user?.id;
    const st = record.approvalStatus;
    const isDraftOrRejected = st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2';

    const actions: any[] = [
      { key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => { setSelectedRecord(record); setDrawerMode('view'); setDrawerOpen(true); } },
    ];

    if (canEditApprovalRecord(st, { hasPerm, resource: '<resource>' })) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => { setSelectedRecord(record); setDrawerMode('edit'); setDrawerOpen(true); } });
    }

    actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => { setSelectedRecord(record); setDrawerMode('view'); setDrawerOpen(true); } });

    // Xóa mềm: chỉ khi Lưu tạm (approval-2-level-spec.md mục 3.6)
    if (st === 'DRAFT' && hasPerm('<resource>:delete')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        danger: true,
        icon: <DeleteOutlined />,
        onClick: () => {
          modal.confirm({
            title: 'Xác nhận xóa bản ghi',
            content: `Bạn có chắc chắn muốn xóa "${record.name}" không?`,
            onOk: async () => { await deleteRecord(record.id); toast.success('Xóa thành công'); loadData(); },
          });
        },
      });
    }

    return actions;
  }, [user?.id, hasPerm]);

  // 5. Sidebar lọc trái
  const sidebarFilterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceMd }}>
      <div>
        <label style={{ display: 'block', fontSize: fontSizeSm, fontWeight: fontWeightBold, color: textSecondary, marginBottom: spaceXs }}>
          Đơn vị quản lý
        </label>
        <OrgUnitTreeSelect
          organizations={orgUnits}
          placeholder="Tất cả"
          allowClear
          listHeight={256}
          value={filterOrgUnitId}
          onChange={setFilterOrgUnitId}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: fontSizeSm, fontWeight: fontWeightBold, color: textSecondary, marginBottom: spaceXs }}>
          Tìm kiếm từ khóa
        </label>
        <input
          style={inputStyle}
          placeholder="Tìm theo mã, tên..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div style={{ padding: spaceMd }}>
      <ScreenHeader
        title="Quản lý Tài sản KCHTGT"
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Danh mục quản lý' }]}
        actions={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedRecord(null); setDrawerMode('create'); setDrawerOpen(true); }} style={primaryButtonStyle}>
              Thêm mới
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => {}} style={outlineButtonStyle}>
              Xuất Excel
            </Button>
          </Space>
        }
      />

      <FilterTableLayout
        filterContent={sidebarFilterContent}
        statusTabs={statusTabs}
        onStatusTabChange={(key) => { setActiveTab(key); setPage(1); }}
        onFilterApply={() => { setPage(1); }}
        onFilterReset={() => { setFilterOrgUnitId(undefined); setFilterKeyword(''); setPage(1); }}
      >
        <DataTable
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 'max-content', y: 560 }}
          emptyState={<EmptyState description="Không có dữ liệu bản ghi" />}
        />

        <div style={{ marginTop: spaceMd, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, s) => { setPage(p); setPageSize(s); }} />
        </div>
      </FilterTableLayout>
    </div>
  );
}
```

---

## 3. CẤU TRÚC CHUẨN FORM DRAWER 5 TAB (UI VÀ LOGIC BACKEND)

Mọi form chi tiết/thêm mới/chỉnh sửa đều mở `AppDrawer` với `size="50%"` chia thành **5 Tab đồng nhất**:

### 3.1. Tab 1 - Thông tin chung & CÔNG THỨC CHUẨN ĐỊNH VỊ TABS TRONG DRAWER (ZERO PIXEL DRIFT):

> 🏷️ **QUY CHUẨN MÀU SẮC, ĐỘ ĐẬM & CỠ CHỮ CỦA NHÃN FORM (FORM LABEL SPECIFICATION):**
> - **Màu chữ (Label Color)**: `sidebarBg` (`#12468C` - Xanh Navy thương hiệu Cục Hàng hải).
> - **Độ đậm (Font Weight)**: `fontWeightBold` / `600` (đậm rõ nét, tuyệt đối không dùng màu đen thường `#000000`).
> - **Cỡ chữ (Font Size)**: `fontSizeMd` / `13px`.
> - **Khoảng cách đáy (Margin Bottom)**: `spaceFormField` / `12px`.
> - **Dấu sao bắt buộc (*)**: Nằm bên phải nhãn (`margin-left: 4px`, `order: 1`), màu đỏ `#ff4d4f`.
> - **Cách dùng**: Đã được inject CSS toàn cục qua `.ant-form-item-label > label`, hoặc dùng helper `{...labelProps('Tên nhãn')}` từ `tokens.ts`.

> 📌 **CÔNG THỨC CHUẨN ĐỊNH VỊ TABS TRONG DRAWER (LẤY TỪ MÀN CẢNG BIỂN `/port`):**
> 1. **Khung Drawer Body Padding**: `padding: '0 24px 12px 24px'` (Top padding = 0, đã tự động có trong `drawerProps`).
> 2. **Thanh TabBar (`<Tabs tabBarStyle={drawerTabBarStyle} />`)**: 
>    `drawerTabBarStyle = { marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: '#ffffff' }`
>    - **TUYỆT ĐỐI CẤM**: Không dùng `marginTop` âm (như `marginTop: -8`), không dùng `type="card"`.
> 3. **Nội dung bên trong từng Tab**: Bắt buộc bọc trong `<div style={drawerTabContentStyle}>` (`paddingTop: 16px`).
>    - Khoảng cách từ đường gạch chân của Tab đến hàng Form đầu tiên luôn luôn chuẩn xác là **16px**.

- **BẮT BUỘC** import các style presets từ `frontend/src/tokens.ts`:
  ```tsx
  import {
    formFieldStyle,         // marginBottom: spaceFormField (12px)
    formRowGutter,          // [16, 16] cho <Row gutter={formRowGutter}>
    inputStyle,             // borderRadius: radiusPill (999px), height: 40px
    selectStyle,            // borderRadius: radiusPill (999px), height: 40px
    readonlyInputStyle,     // borderRadius: radiusPill (999px), height: 40px, backgroundColor: '#f5f5f5'
    formTreeSelectStyle,    // width: '100%', borderRadius: radiusPill (999px), height: 40px
    drawerTabBarStyle,      // { marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: '#ffffff' }
    drawerTabContentStyle,  // { paddingTop: 16 } (cách đường Tab đúng 16px)
    ATTACHMENT_HELPER_TEXT, // 'Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤10MB.'
  } from '../../tokens';
  ```
> 📐 **QUY CHUẨN CHIỀU DÀI CÁC Ô, KHOẢNG CÁCH & BỘ LỌC PHỤ THUỘC (FORM GRID & CASCADING SPECIFICATION):**
> 1. **Bố cục Lưới 2 Cột Đối Xứng**:
>    - Mỗi hàng Form dùng `<Row gutter={formRowGutter}>` (khoảng cách giữa 2 cột là **16px**, khoảng cách giữa các hàng là **16px**).
>    - Hai cột đều nhau: `<Col span={12}>` (chiều dài mỗi ô chiếm đúng **50%** chiều rộng của form).
>    - Hàng dài toàn dòng (Địa điểm chi tiết, Vùng phủ sóng, Ghi chú): `<Col span={24}>` (chiều dài chiếm **100%**).
> 2. **Kích thước & Hình dạng Ô Nhập liệu (Input Dimensions)**:
>    - Chiều cao cố định: **`height: 40px`** cho mọi ô Input, Select, TreeSelect đơn dòng.
>    - Bo góc viên thuốc tròn chuẩn: **`borderRadius: radiusPill` (`999px`)**.
>    - Ô văn bản nhiều dòng (`Input.TextArea`): Bo cong mềm mại góc lớn **`borderRadius: 20`** (hoặc `style={textAreaStyle}`) kết hợp đệm lề trong **`padding: '10px 16px'`** để tạo đường cong đồng điệu 100% với ô Input viên thuốc mà không bị lẹm chữ.
>    - Khoảng cách đáy mỗi Form Item: `marginBottom: spaceFormField` (**`12px`**).
> 3. **Quy tắc Dropdown phụ thuộc đơn vị quản lý (Cascading Filter & Placeholders)**:
>    - **Ô cha (`Đơn vị quản lý`)**: `<OrgUnitTreeSelect style={formTreeSelectStyle} placeholder="Chọn đơn vị quản lý..." />`.
>    - **Các ô con phụ thuộc (`Thuộc cảng biển`, `Thuộc hệ thống VTS`, `Thuộc TTDH VTS`...)**:
>      - **Khi chưa chọn Đơn vị quản lý**: Bị vô hiệu hóa (`disabled={!formOrgUnitId}`), hiển thị placeholder mờ: `placeholder="Vui lòng chọn đơn vị quản lý trước"`.
>      - **Khi đã chọn Đơn vị quản lý**: Tự động mở khóa (`disabled={false}`), lọc danh sách options theo `orgUnitId` đang chọn, hiển thị `placeholder="Chọn <tên_loai_ha_tang>..."`.
>      - **Khi thay đổi Đơn vị quản lý**: Tự động reset giá trị của các ô con phụ thuộc về `undefined` nếu giá trị cũ không còn thuộc đơn vị mới chọn.

### 3.2. Tab 2 - Thông số kỹ thuật:
- Các trường số liệu chuyên ngành (Chiều dài, Chiều rộng, Cao trình, Tải trọng, Công suất...).
- Căn phải cho các ô nhập số (`InputNumber`), có đơn vị đo rõ ràng.

### 3.3. Tab 3 - Thông tin vị trí (Từ UI đến Backend):

> 📌 **QUY CHUẨN KHỞI TẠO TAB VỊ TRÍ GIS KHI TẠO MỚI (LẤY TỪ MÀN BẾN CẢNG / CẢNG BIỂN `/port`):**
> 1. **Trạng thái ban đầu khi mở form Thêm mới**:
>    - **Loại đối tượng**: Để trống (`placeholder="Chọn loại đối tượng"`, `allowClear`). **TUYỆT ĐỐI KHÔNG** tự động gán mặc định `'POINT'`.
>    - **Biểu tượng**: Để trống (`placeholder="Chọn biểu tượng bản đồ"`), bị vô hiệu hóa (`disabled={!watchedGeom}`) khi chưa chọn Loại đối tượng.
>    - **Hệ quy chiếu**: Hiển thị `placeholder="Chọn hệ quy chiếu"`, disabled (tự động điền khi người dùng chọn Loại đối tượng).
>    - **Quy tắc hiển thị**: Hiển thị `placeholder="Chọn quy tắc hiển thị"`, disabled (tự động điền khi người dùng chọn Loại đối tượng).
>    - **Danh sách tọa độ (`coordinateList`)**: Mặc định là mảng rỗng `[]`, hiển thị khung trống *"Chưa có tọa độ nào."* cùng nút *"Thêm tọa độ"*. **TUYỆT ĐỐI KHÔNG** tự động sinh sẵn hàng `0° 0' 0.00"`.
> 2. **Hành vi tương tác & Số lượng tọa độ tối thiểu theo Loại hình học (`GEOMETRY_POINT_COUNT`)**:
>    - **Đối tượng Điểm (`POINT`)**: Tự động khởi tạo ít nhất **1 điểm tọa độ**.
>    - **Đối tượng Đường (`LINE`)**: Tự động khởi tạo ít nhất **2 điểm tọa độ**.
>    - **Đối tượng Vùng (`POLYGON`)**: Tự động khởi tạo ít nhất **3 điểm tọa độ**.
>    - **Chức năng chọn trên bản đồ (*"Chọn vị trí trên bản đồ"*)**: Vẫn luôn hiện diện và hoạt động cho tất cả các loại đối tượng (chấm điểm cho Point, vẽ đường cho Line, vẽ đa giác khép kín cho Polygon).
>    - **Quy tắc xóa dòng tọa độ**: Chỉ cho phép xóa khi số lượng dòng hiện tại lớn hơn số lượng tối thiểu (`coordinateList.length > minCount`).
>    - **Validation khi Lưu**: Bắt buộc kiểm tra số lượng tọa độ hợp lệ $\ge \text{minCount}$ trước khi gửi dữ liệu lên server.
>    - Khi người dùng bấm xóa Loại đối tượng (`allowClear`), tự động reset toàn bộ Hệ quy chiếu, Quy tắc hiển thị, Biểu tượng và danh sách tọa độ về rỗng `[]`.

- **Frontend UI**: Tích hợp component dùng chung `<GisLocationSelector />` hoặc Form GIS Drawer:
  ```tsx
  import GisLocationSelector from '../../components/gis/GisLocationSelector';

  <GisLocationSelector
    value={gisValue}
    onChange={setGisValue}
    defaultGeometryType="POINT" // 'POINT' | 'LINE' | 'POLYGON'
  />
  ```
  - **Loại hình học**: Dropdown chọn Đối tượng Điểm (`POINT`), Đường (`LINE`), Vùng (`POLYGON`).
  - **Biểu tượng bản đồ**: Dropdown chọn icon bản đồ từ danh mục `SymbolList` (có preview hình ảnh trực quan).
  - **Hệ quy chiếu**: Hiển thị Tag pill `WGS 84 / VN-2000` & Định dạng `Độ, Phút, Giây (DMS)`.
  - **Nhập Tọa độ Compact DMS**: Bộ 3 ô nhập Độ `°`, Phút `'`, Giây `"` cho Vĩ độ (Latitude) và Kinh độ (Longitude) kèm nút *"Chọn vị trí trên bản đồ"* mở Modal Map Picker.
- **Backend Logic & CSDL**:
  - **Entity**: `InfrastructureSpatial` (lưu `refId`, `refType`, `geometryType`, `coordinates` GeoJSON/WKT, `symbolId`, `spatialReference`).
  - **Endpoints REST**:
    - `GET /api/v1/<resource>/{id}/spatial`: Lấy thông tin không gian GIS của hạ tầng.
    - `PUT /api/v1/<resource>/{id}/spatial`: Cập nhật tọa độ và biểu tượng GIS.

### 3.4. Tab 4 - Tệp đính kèm (Từ UI đến Backend):
- **Frontend UI**:
  - Khu vực tải lên kéo thả `Upload.Dragger` (hỗ trợ PDF, DOCX, XLSX, PNG, JPG, CAD $\le 10\text{MB}$).
  - Bảng danh sách tệp đính kèm gồm các cột: `Tên tài liệu`, `Loại tệp`, `Dung lượng (KB/MB)`, `Cán bộ tải lên` (Họ và tên), `Ngày tải lên` (`DD/MM/YYYY HH:mm`), `Thao tác` (Nút Tải về `DownloadOutlined` và Nút Xóa `DeleteOutlined`).
- **Backend Logic & CSDL**:
  - **Entity**: `InfrastructureAttachment` (lưu `id`, `refId`, `refType`, `fileName`, `filePath`, `fileSize`, `fileType`, `uploadedBy`, `createdAt`).
  - **Validation**: Bắt buộc chặn file $> 10\text{MB}$ và kiểm tra MIME type an toàn.
  - **Endpoints REST**:
    - `GET /api/v1/<resource>/{id}/attachments`: Danh sách tệp đính kèm.
    - `POST /api/v1/<resource>/{id}/attachments`: Tải lên tệp mới (Multipart/form-data).
    - `GET /api/v1/<resource>/{id}/attachments/{attachmentId}/download`: Tải tệp về máy.
    - `DELETE /api/v1/<resource>/{id}/attachments/{attachmentId}`: Xóa tệp đính kèm (chỉ khi bản ghi ở trạng thái DRAFT hoặc REJECTED).

### 3.5. Tab 5 - Lịch sử thay đổi & Phê duyệt (Từ UI đến Backend):
- **Frontend UI**:
  - **Khung bộ lọc bên trong Drawer**: Ô tìm kiếm từ khóa + Lọc theo khoảng ngày (`Từ ngày` - `Đến ngày`).
  - **Bố cục lưới Timeline 2 cột**: `gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)'`, gap: `16px`.
  - **Cột trái (Metadata)**:
    - Dòng 1: Thời gian `HH:mm DD/MM/YYYY` + Badge hành động (`Tạo mới`, `Chỉnh sửa`, `Gửi duyệt`, `Phê duyệt cấp Cảng vụ`, `Phê duyệt cấp Cục`, `Trả về cấp Cảng vụ`, `Trả về cấp Cục`, `Xóa`) với `borderRadius: 999` và `flexWrap: 'wrap'` (chống tràn đè sang card bên phải).
    - Dòng 2: Người cập nhật: **Họ và tên đầy đủ** (`userMap.get(actor)`).
    - Dòng 3: Đơn vị quản lý.
  - **Cột phải (Card chi tiết thay đổi)**:
    - Card có viền trái gradient màu sắc theo hành động (`actionMeta.color`).
    - Tiêu đề: `"Thông tin thêm mới:"` (khi tạo mới) hoặc `"Thông tin thay đổi:"` (khi cập nhật).
    - Danh sách thay đổi: Tên trường tiếng Việt rõ nghĩa + Diff trực quan `<Giá trị cũ> → <Giá trị mới>` (hoặc Badge cũ $\rightarrow$ Badge mới).
    - Khung Lý do từ chối / Ghi chú (nếu có): Hiển thị khung cảnh báo màu riêng biệt.
  - **Làm sạch dữ liệu**: Tự động gom nhóm các thay đổi trong cùng 1 giây của cùng 1 người, lọc bỏ triệt để các trường rỗng hoặc không có sự thay đổi (`ov === nv`).
- **Backend Logic & CSDL**:
  - **Entity**: `InfrastructureHistory` (bảng `infrastructure_history` lưu `refId`, `refType`, `approvalLevel`, `status`, `approvedBy`, `reason`, `changedField`, `previousValue`, `newValue`, `createdAt`).
### 2.1. CỘT KIỂM TOÁN PHÊ DUYỆT TRÊN BẢNG DANH SÁCH (chốt 26/08/2026)

Ngoài bộ cột cố định, bảng danh sách KCHT **hiển thị thêm 6 cột kiểm toán** ghi vết đủ 3 mốc của
quy trình phê duyệt 2 cấp. Trước đây các trường này chỉ có ở màn Chi tiết, nên người quản lý phải
mở từng hồ sơ mới biết ai gửi / ai duyệt / duyệt lúc nào.

| # | Nhãn cột | Trường | Bề rộng | Nội dung |
| :-: | :--- | :--- | :-: | :--- |
| 1 | Ngày gửi phê duyệt | `submittedAt` | 150px | `DD/MM/YYYY HH:mm`, rỗng thì `—` |
| 2 | Cán bộ gửi phê duyệt | `submittedBy` | 170px | **Họ và tên**, không phơi UUID |
| 3 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `approvedDateLevel1` | 150px | `DD/MM/YYYY HH:mm` |
| 4 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `approverLevel1` | 170px | **Họ và tên** |
| 5 | Ngày phê duyệt cấp Cục | `approvedDateLevel2` | 150px | `DD/MM/YYYY HH:mm` |
| 6 | Cán bộ phê duyệt cấp Cục | `approverLevel2` | 170px | **Họ và tên** |

**Quy định bắt buộc:**

- Đặt **sau** cột "Cán bộ cập nhật", **trước** cột "Thao tác".
- Tất cả đều **read-only**, không sắp xếp được trên client (sắp xếp phải chạy ở server nếu cần).
- Hiển thị **họ và tên** cán bộ lấy từ `userMap`; **cấm** để lộ UUID ra giao diện.
- Bảng chắc chắn tràn ngang khi bật đủ 6 cột — đó là chấp nhận được, `DataTable` đã có scroll ngang
  và 2 cột đầu (STT, Tên/Mã) đã `fixed: 'left'` nên vẫn tra cứu được.
- Bề rộng nêu trên là **tối thiểu**; `DataTable.headerMinWidth()` sẽ tự nới thêm nếu nhãn dài hơn.

**Điều kiện tiên quyết:** entity phải kế thừa `BaseApprovableEntity` để có đủ `submittedAt`,
`submittedBy`, `approverLevel1/2`, `approvedDateLevel1/2`. Loại KCHT nào chưa kế thừa thì phải
chuyển trước, kèm migration bổ sung cột.

---

### 3.6. Footer Drawer - QUY CHUẨN BỘ 3 NÚT HÀNH ĐỘNG KHI TẠO MỚI (LẤY TỪ MÀN CẢNG BIỂN `/port`):

> 🔘 **QUY CÁCH VÀ MÀU SẮC BỘ 3 NÚT TẠI CHÂN DRAWER FORM TẠO MỚI:**
> - Tất cả các nút bấm chân Form Drawer **BẮT BUỘC** có chiều cao cố định **`height: 40px`** và bo góc viên thuốc tròn chuẩn **`borderRadius: radiusPill` (`999px`)**.
> 
> | # | Nút hành động | Kiểu hiển thị (Style Preset) | Màu sắc (Semantic Token) | Trạng thái phê duyệt đích | Hành vi nghiệp vụ |
> | :-: | :--- | :--- | :--- | :---: | :--- |
> | 1 | **`Lưu tạm`** | `outlineButtonStyle` | Nền trắng, viền & chữ Xanh Navy (`#12468C`) | `DRAFT` (0) | Lưu thông tin nháp, chỉ người tạo nhìn thấy, chưa gửi vào luồng phê duyệt |
> | 2 | **`Lưu và gửi phê duyệt`** | `primaryButtonStyle` | Nền Xanh Dương (`#1B84FF`), chữ trắng | `PENDING_APPROVAL` (2) | Lưu bản ghi và lập tức chuyển trạng thái sang Chờ Cảng vụ/Chi cục duyệt (Vòng 1) |
> | 3 | **`Lưu và phê duyệt`** | Primary Green Button | Nền Xanh Lá Cây `statusOperational` (`#1BAF7A` / `#00A389`), chữ trắng | `APPROVED` (5) | Dành cho cấp có thẩm quyền phê duyệt trực tiếp: Lưu và duyệt có hiệu lực ngay |
> 
> - **Khi Chỉnh sửa (`isEdit`)**: bộ nút phụ thuộc **trạng thái phê duyệt của hồ sơ đang sửa**
>   (theo `approval-2-level-spec.md` mục 3.9 — quy tắc 12). **CẤM** dùng chung một nút "Cập nhật" cho mọi trạng thái:
>
> | Trạng thái hồ sơ đang sửa | Các nút chân Form | Kết quả sau khi lưu |
> | :--- | :--- | :--- |
> | `DRAFT`, `REJECTED_LEVEL1`, `REJECTED_LEVEL2` | `Hủy` · `Lưu tạm` · `Lưu và gửi phê duyệt` | Giữ `DRAFT` / chuyển `PENDING_APPROVAL` |
> | `APPROVED` | `Hủy` · **`Lưu và phê duyệt`** (nút xanh lá `statusOperational`) | **Giữ nguyên `APPROVED`**, bản cũ ghi vào nhật ký thay đổi |
> | `PENDING_APPROVAL`, `APPROVED_LEVEL1`, `ARCHIVED` | *Không mở được form sửa — nút "Chỉnh sửa" đã bị ẩn ở `rowActions`* | — |
>
> - ⚠️ **Tuyệt đối không hạ hồ sơ `APPROVED` về `DRAFT` khi sửa**: `/options` chỉ trả về bản ghi
>   `APPROVED` (quy tắc APPROVED ONLY), hạ trạng thái sẽ làm hồ sơ đang khai thác biến mất khỏi
>   mọi dropdown của các màn hình khác.
> - **Mã nguồn JSX Mẫu chuẩn Footer**:
>   ```tsx
>   footer={
>     isEdit && editingStatus === 'APPROVED' ? (
>       // T12 - Sửa hồ sơ đã duyệt: giữ nguyên APPROVED, bản cũ vào nhật ký
>       <>
>         <Button onClick={onCancel} style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}>
>           Hủy
>         </Button>
>         <Button type="primary" onClick={() => handleSubmit('APPROVE')} loading={submitting && actionType === 'APPROVE'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill, height: 40 }}>
>           Lưu và phê duyệt
>         </Button>
>       </>
>     ) : isEdit ? (
>       // DRAFT / REJECTED_LEVEL1 / REJECTED_LEVEL2: sửa rồi lưu tạm hoặc gửi (lại) duyệt
>       <>
>         <Button onClick={onCancel} style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}>
>           Hủy
>         </Button>
>         <Button onClick={() => handleSubmit('DRAFT')} loading={submitting && actionType === 'DRAFT'} style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}>
>           Lưu tạm
>         </Button>
>         <Button type="primary" onClick={() => handleSubmit('SUBMIT')} loading={submitting && actionType === 'SUBMIT'} style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}>
>           Lưu và gửi phê duyệt
>         </Button>
>       </>
>     ) : (
>       <>
>         <Button onClick={() => handleSubmit('DRAFT')} loading={submitting && actionType === 'DRAFT'} style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}>
>           Lưu tạm
>         </Button>
>         <Button type="primary" onClick={() => handleSubmit('SUBMIT')} loading={submitting && actionType === 'SUBMIT'} style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}>
>           Lưu và gửi phê duyệt
>         </Button>
>         <Button type="primary" onClick={() => handleSubmit('APPROVE')} loading={submitting && actionType === 'APPROVE'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill, height: 40 }}>
>           Lưu và phê duyệt
>         </Button>
>       </>
>     )
>   }
>   ```

---

## 4. PROMPT CHUẨN ĐỂ YÊU CẦU AI XÂY DỰNG MÀN HÌNH MỚI (COPY & PASTE)

Khi bạn muốn AI xây dựng bất kỳ màn hình nào, chỉ cần gửi câu lệnh sau:

```text
Hãy xây dựng/chuẩn hóa màn hình [TÊN PHÂN HỆ / VÍ DỤ: ĐÈN BIỂN / TRẠM RADAR / TUYẾN LUỒNG].
BẮT BUỘC tuân thủ 100% tài liệu Golden Template tại docs/conventions/infrastructure-screen-template.md:
1. UI Danh sách: ScreenHeader + FilterTableLayout + StatusTabs + DataTable + Pagination.
2. Bảng: Cột STT cố định trái (60px), Cột Tên/Mã cố định trái (240px, cả 2 dòng đều dùng fontSizeMd 13px), Cột Cán bộ cập nhật (Họ và tên cán bộ 13px + ngày giờ), Badge Tình trạng (160px) và Trạng thái (180px) không có '...' thừa, **6 cột kiểm toán phê duyệt** (xem §2.1), Cột Thao tác truyền qua rowActions (60px).
3. Sidebar: OrgUnitTreeSelect + Tìm kiếm tiếng Việt không dấu (normalizeSearchText) + Cascading filters tự reset.
4. Drawer 5 Tab: 
   - Tab 1 Thông tin chung (Pill radius 999px, height 40px)
   - Tab 2 Thông số kỹ thuật
   - Tab 3 Vị trí GIS (GisLocationSelector, compact DMS, map preview)
   - Tab 4 Tệp đính kèm (Upload Dragger <=10MB, bảng file có tải về/xóa)
   - Tab 5 Lịch sử thay đổi (Timeline 2 cột minmax(310px, 0.38fr), Họ và tên cán bộ, Diff trường tiếng Việt)
5. Backend: DataScope, PermissionSeeder, Endpoint /options (chỉ trả về APPROVED), /attachments (<=10MB), /spatial, /history (ApprovalHistoryUtils).
6. Giữ nguyên vẹn các component dùng chung, không gây side-effect sang màn hình khác. Chạy npm run build và mvn test-compile để nghiệm thu.
```

