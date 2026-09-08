# Thiết kế Kỹ thuật Chuẩn hóa UI/UX: Quản lý Luồng Hàng Hải (Navigation Channel)

**Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS  
**Tài liệu chuẩn hóa:** `01-navigationchannel-ui-standardization.md`  
**Single Source of Truth (SSOT)** dành cho: Frontend Developer & QA Engineer  
**Mẫu tham chiếu chuẩn (Reference Template):** Quản lý bến cảng (`BerthListPage.tsx`, `BerthForm.tsx`, `BerthDetailContent.tsx`)  
**Design Tokens:** `frontend/src/themetokenchk.ts`, `frontend/src/tokens.ts`, `frontend/src/theme.ts`  
**Layout Container:** `frontend/src/components/AppLayout.tsx`  

---

## 1. Tổng quan & Mục tiêu chuẩn hóa

### 1.1. Hiện trạng giao diện Luồng hàng hải (`navigationchannel`)
- `NavigationChannelList.tsx` hiện đang dùng cấu trúc hỗn hợp: một số chế độ dùng `NavigationChannelForm` tích hợp inline modal/drawer, filter panel chưa khóa cứng cấu hình sidebar cố định `hideFilterToggle={true}`, danh sách bộ lọc chưa phân bổ chuẩn theo quy cách 280px scroll dọc.
- `NavigationChannelForm.tsx` đang gộp cả 3 chế độ (`create`, `edit`, `detail`) trong một component monolithic dài hơn 2000 dòng, dẫn đến code phình to, khó bảo trì, và không tái sử dụng được view xem chi tiết riêng biệt.
- **Chưa có file `NavigationChannelDetailContent.tsx`** độc lập: chế độ xem chi tiết hiện tại bị ràng buộc vào Form với các input disabled/readonly thay vì một giao diện dạng card/accordion chuyên biệt như `BerthDetailContent.tsx`.

### 1.2. Mục tiêu chuẩn hóa theo mẫu Bến Cảng (Berth Standard)
1. **Phân tách hoàn toàn màn hình Xem chi tiết (Detail) và Form Tạo mới/Sửa (Form)**:
   - Xây dựng component mới: `frontend/src/pages/navigationchannel/NavigationChannelDetailContent.tsx` (5 Tabs chuyên biệt).
   - Tinh gọn `NavigationChannelForm.tsx` chỉ phục vụ Tạo mới (`create`) và Chỉnh sửa (`edit`).
2. **Chuẩn hóa List Screen (`NavigationChannelList.tsx`)**:
   - Sử dụng `AppDrawer` trượt-phải (chiều rộng cố định `width="min(1080px, 96vw)"`) cho cả 3 chế độ: Thêm mới, Chỉnh sửa, Xem chi tiết. Tuyệt đối **CẤM** dùng Ant Design `<Modal>` lơ lửng cho CRUD/Detail.
   - Cấu hình `FilterTableLayout` với `hideFilterToggle={true}`, sidebar bộ lọc cố định chiều rộng 280px (`overflowY: 'auto'`), chân sidebar chỉ chứa đúng 2 nút: **Reload** + **Tìm kiếm**.
3. **Chuẩn hóa Drawer Xem chi tiết (5 Tabs)**:
   - **Tab 1: Thông tin chung**: Accordion sections (Thông tin cơ bản & Quản lý vận hành; Thông số kỹ thuật & Khai thác; Thông tin công bố mở, đưa vào sử dụng; Thông tin phê duyệt toggle).
   - **Tab 2: Thông tin vị trí**: Metadata GIS (Loại đối tượng, Biểu tượng, Hệ quy chiếu, Quy tắc hiển thị) + Bảng tọa độ GPS (`DetailTable`) + Nút "Xem vị trí trên bản đồ" (`GisLocationSelector` modal), sử dụng `DRAWER_TABLE_SCROLL_Y.withButton` / `detailGis`.
   - **Tab 3: File đính kèm**: Bảng tài liệu đính kèm kèm số lượng `File đính kèm (N)`, hiển thị tên tệp, dung lượng format (KB/MB), người tải lên, ngày tải lên.
   - **Tab 4: Tuyến luồng**: Bảng chi tiết các phân đoạn tuyến luồng (`channel_route_detail`), hiển thị 16+ thông số kỹ thuật chuẩn (Phân loại, Mã tuyến, Tên tuyến, Cấp luồng, Chiều dài, Độ sâu thiết kế/hiện trạng, Chiều rộng, Bán kính cong, Vũng quay tàu...).
   - **Tab 5: Vận hành & bảo trì**: 3 accordion sections (Vận hành khai thác, Bảo trì & nạo vét, Lịch sử sự cố/cảnh báo) tích hợp bảng `DetailTable` cố định chiều cao.
4. **Chuẩn hóa Lịch sử thay đổi (Audit Trail)**:
   - Mở từ nút "Lịch sử" trên Action Menu từng dòng (`rowActions`).
   - Hiển thị trong `AppDrawer` độc lập (width `720px` - `800px`), truy vấn trực tiếp từ bảng tập trung duy nhất `infrastructure_history` (không dùng `change_logs` hay `approval_logs`).
5. **Tuân thủ triệt để Theme & Semantic Tokens**:
   - Không hardcode màu HEX, spacing, font-size, border-radius.
   - Áp dụng các hằng số từ `themetokenchk.ts`: `DRAWER_TABLE_SCROLL_Y.*`, `getDatePickerProps`, `getRangePickerProps`.
   - Pill Badge chuẩn (`borderRadius: radiusPill` 999px, padding `2px 10px`, font-size 13px, font-weight 500) cho toàn bộ Trạng thái phê duyệt và Tình trạng hoạt động.
   - Tiêu đề cột bảng hiển thị đủ 100% chữ (không bị cắt `...`); nội dung ô dài áp dụng ellipsis + tooltip.
   - Ngân sách màu nhấn: tối đa 3 lần xuất hiện của `actionPrimary` trên mỗi màn hình.

---

## 2. Kiến trúc & Phân bổ Tệp nguồn (Architecture & Seam Contract)

```
frontend/src/pages/navigationchannel/
├── NavigationChannelList.tsx           [REFAC] List screen + Filter sidebar 280px + AppDrawer 1080px controller
├── NavigationChannelDetailContent.tsx   [NEW]   Component chi tiết 5 Tab (dạng Card & Accordion chuẩn Berth)
├── NavigationChannelForm.tsx            [REFAC] Form Tạo mới/Sửa 4 Tab bên trong AppDrawer
└── (services & types tích hợp)
    ├── ../../services/navigationChannelService.ts
    ├── ../../types/navigationChannel.ts
    └── ../../themetokenchk.ts
```

### 2.1. Ma trận Trách nhiệm Component

| Component | Đường dẫn | Trách nhiệm chính | Container |
|---|---|---|---|
| `NavigationChannelList` | `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | Quản lý bảng dữ liệu luồng hàng hải, StatusTabs phân loại trạng thái, Sidebar bộ lọc 280px, điều khiển mở AppDrawer (Create, Edit, Detail, History), Action menu dòng | Trang chính (`Route`) |
| `NavigationChannelDetailContent` | `frontend/src/pages/navigationchannel/NavigationChannelDetailContent.tsx` | **MỚI 100%**: Hiển thị chi tiết bản ghi luồng hàng hải qua 5 Tab read-only, cấu trúc accordion, bảng con tọa độ, file đính kèm, tuyến luồng, vận hành & bảo trì | `AppDrawer width="min(1080px, 96vw)"` |
| `NavigationChannelForm` | `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx` | Nhập liệu Thêm mới & Chỉnh sửa luồng hàng hải, validation form, bảng nhập tọa độ DMS, upload tài liệu `InfrastructureAttachmentTab`, bảng nhập tuyến luồng | `AppDrawer width="min(1080px, 96vw)"` |
| `HistoryDrawer` (Inline/Shared) | Rendered in `NavigationChannelList.tsx` | Tra cứu lịch sử thay đổi theo `infrastructure_history` với bộ lọc từ khóa và khoảng ngày | `AppDrawer width={760}` |

---

## 3. Đặc tả Chi tiết Màn hình Danh sách (`NavigationChannelList.tsx`)

### 3.1. Cấu trúc Bố cục Layout (`FilterTableLayout`)
- **`hideFilterToggle={true}`**: Khóa cố định sidebar bộ lọc ở trạng thái luôn mở bên trái bảng.
- **Sidebar lọc (Width 280px)**:
  - Container sidebar cấu hình style: `{ width: 280, minWidth: 280, maxWidth: 280, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', padding: '16px 12px' }`.
  - Thứ tự các trường lọc từ trên xuống:
    1. `Đơn vị quản lý`: `OrgUnitTreeSelect` dạng cây phân cấp theo DataScope.
    2. `Thuộc cảng biển`: `Select` danh sách Cảng biển (`seaportOptions`).
    3. `Từ khóa`: `Input` tìm kiếm theo Mã hoặc Tên luồng (`channelCode`, `channelName`).
    4. `Địa điểm (Tỉnh/TP)`: `Select` chọn Tỉnh/Thành phố từ `VIETNAM_PROVINCES` hỗ trợ search tiếng Việt không dấu.
    5. `Tình trạng hoạt động`: `Select` chọn từ `CONDITION_STATUS_OPTIONS` (`OPERATIONAL`, `STOPPED`, `MAINTENANCE`, `UNDER_CONSTRUCTION`).
    6. `Cấp luồng`: `Select` chọn phân cấp luồng.
    7. `Khoảng ngày cập nhật`: `DatePicker.RangePicker` với helper `getRangePickerProps()` từ `themetokenchk.ts`.
  - **Chân sidebar (Footer cố định)**: Chỉ chứa đúng 2 nút bấm:
    - Nút **Làm mới** (`ReloadOutlined`): Style `outlineButtonStyle` + `borderRadius: radiusPill` + `height: 38`.
    - Nút **Tìm kiếm** (`SearchOutlined`): Style `primaryButtonStyle` + `borderRadius: radiusPill` + `height: 38` + `background: actionPrimary`.

### 3.2. Thanh Trạng thái (`StatusTabs`)
- Hiển thị 6 tab semantic chuẩn theo quy tắc phân quyền và quy trình phê duyệt 2 cấp:
  1. `Tất cả` (Màu `#0E6FD6`): Số lượng = Tổng các tab con.
  2. `Lưu tạm` / Nháp (Màu `#93A3B3` - `statusDraft`).
  3. `Chờ Cảng vụ duyệt` (Màu `#EDA100` - `statusAttention`).
  4. `Chờ Cục duyệt` (Màu `#0284C7` - Xanh biển Cục).
  5. `Đã duyệt` (Màu `#1BAF7A` - `statusOperational`).
  6. `Từ chối` / Trả về (Màu `#E34948` - `statusCritical`).

### 3.3. Cột Dữ liệu Bảng Danh sách (`DataTable`)
Tuân thủ quy tắc: **Tiêu đề cột hiển thị 100% chữ không cắt; Nội dung ô bản ghi ellipsis khi vượt chiều rộng**.

| STT | Tên cột (`title`) | `dataIndex` | `width` | Căn lề | Định dạng & Render |
|---|---|---|---|---|---|
| 1 | **STT** | `stt` | `55px` | Center | Số thứ tự tính theo trang |
| 2 | **Mã luồng** | `channelCode` | `130px` | Left | Chữ in đậm `fontWeightMedium`, màu `actionPrimary` |
| 3 | **Tên luồng hàng hải** | `channelName` | `240px` | Left | Chữ in đậm `textPrimary`, tooltip khi text dài, click mở Drawer chi tiết |
| 4 | **Thuộc cảng biển** | `seaportId` | `180px` | Left | Tên cảng biển từ map tra cứu `seaportMap` |
| 5 | **Đơn vị quản lý** | `orgUnitName` | `200px` | Left | Tên đơn vị quản lý trực tiếp (`record.orgUnitName` hoặc `orgLabel`) |
| 6 | **Địa điểm (Tỉnh/TP)** | `provinceId` | `140px` | Left | Tên Tỉnh/Thành phố từ `VIETNAM_PROVINCES` |
| 7 | **Tình trạng** | `conditionStatus` | `150px` | Left | **Pill Badge** (`radiusPill`, nền nhạt `${color}15`, viền `${color}40`, chữ đậm) |
| 8 | **Trạng thái** | `approvalStatus` | `170px` | Left | **Pill Badge** 6 trạng thái chuẩn màu semantic |
| 9 | **Cán bộ cập nhật** | `updatedAt` | `190px` | Left | 2 dòng: Dòng 1 Tên cán bộ (`fontWeightBold`), Dòng 2 Ngày giờ `DD/MM/YYYY HH:mm` (`textTertiary`, 12px) |
| 10 | **Thao tác** | `actions` | `80px` | Center | Cố định bên phải (`fixed: 'right'`), Dropdown `rowActions` |

### 3.4. Quản lý Thao tác Dòng (`rowActions`)
1. **Xem chi tiết**: Quyền `navigationchannel:read` → `openDetailDrawer(record)`.
2. **Chỉnh sửa**: `canEditApprovalRecord(record.approvalStatus)` & `navigationchannel:update` → `openEditDrawer(record)`.
3. **Xóa**: `record.approvalStatus === 'DRAFT'` (hoặc `canDeleteApprovalRecord`) & `navigationchannel:delete` → Mở modal xác nhận xóa (nhập tên luồng hoặc chữ "XÓA").
4. **Gửi phê duyệt**: `record.approvalStatus === 'DRAFT'` → Mở modal xác nhận gửi phê duyệt.
5. **Cảng vụ phê duyệt / Từ chối**: Trạng thái `PENDING_APPROVAL` & quyền `navigationchannel:approve` → Mở popup duyệt C1 hoặc từ chối C1 kèm lý do.
6. **Cục phê duyệt / Từ chối**: Trạng thái `APPROVED_LEVEL1` & quyền `navigationchannel:approve` → Mở popup duyệt C2 hoặc từ chối C2 kèm lý do.
7. **Lịch sử**: Quyền `navigationchannel:history` → Mở `HistoryDrawer` của bản ghi.

### 3.5. Điều khiển Drawer trên Màn hình Danh sách
```tsx
{/* ── Detail Drawer ── */}
<AppDrawer
  title={
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
        Chi tiết Luồng hàng hải: {selectedRecord?.channelName}
      </span>
      {selectedRecord?.approvalStatus && (
        <ApprovalStatusBadge status={selectedRecord.approvalStatus} />
      )}
    </div>
  }
  width="min(1080px, 96vw)"
  open={detailDrawerOpen}
  onClose={() => setDetailDrawerOpen(false)}
  destroyOnClose
  footer={
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spaceSm }}>
      {canEdit && (
        <Button
          type="primary"
          style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 38 }}
          onClick={() => { setDetailDrawerOpen(false); openEditDrawer(selectedRecord!); }}
        >
          Chỉnh sửa
        </Button>
      )}
      <Button
        style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 38 }}
        onClick={() => setDetailDrawerOpen(false)}
      >
        Đóng
      </Button>
    </div>
  }
>
  {selectedRecord && (
    <NavigationChannelDetailContent
      record={selectedRecord}
      userMap={userMap}
      symbolMap={symbolMap}
      symbolImageMap={symbolImageMap}
      seaportMap={seaportMap}
    />
  )}
</AppDrawer>

{/* ── Create / Edit Drawer ── */}
<AppDrawer
  title={
    <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
      {drawerMode === 'create' ? 'Thêm mới Luồng hàng hải' : `Chỉnh sửa Luồng hàng hải: ${editingRecord?.channelName}`}
    </span>
  }
  width="min(1080px, 96vw)"
  open={formDrawerOpen}
  onClose={() => setFormDrawerOpen(false)}
  destroyOnClose
>
  <NavigationChannelForm
    id={editingRecord?.id}
    mode={drawerMode}
    open={formDrawerOpen}
    onClose={() => setFormDrawerOpen(false)}
    onSuccess={() => { setFormDrawerOpen(false); reloadTable(); }}
  />
</AppDrawer>
```

---

## 4. Đặc tả Chi tiết Component Mới: `NavigationChannelDetailContent.tsx`

Component này được tạo mới hoàn toàn, tuân thủ 100% mẫu cấu trúc và CSS layout của `BerthDetailContent.tsx`.

### 4.1. Khai báo Props & Style Tokens
```tsx
interface NavigationChannelDetailContentProps {
  record: NavigationChannelResponse;
  userMap: Map<string, string>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  seaportMap: Map<string, string>;
  onEdit?: () => void;
}
```

**Các Style Block chuẩn:**
- `sectionBoxStyle`: `{ background: surfaceCard, borderRadius: radiusMd, border: '1px solid #e4e4e4', marginBottom: spaceMd, padding: '12px 18px' }`
- `sectionHeaderStyle`: `{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }`
- `sectionTitleStyle`: `{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }`
- `detailLabelStyle`: `{ color: textSecondary, fontSize: fontSizeSm, fontWeight: fontWeightMedium }`
- Grid 2 cột: `.chk-detail-grid` với các dòng `.chk-detail-row` chia đều 2 cột (Cột 1 nhãn 160px, Cột 2 nhãn 160px) hoặc dòng toàn chiều rộng `.chk-detail-row--full`.

### 4.2. Cấu trúc 5 Tab Chi Tiết

```
Tabs (sticky top: 0, zIndex: 1, background: surfaceCard)
├── Tab 1: Thông tin chung
│   ├── Section 1: Thông tin cơ bản & Quản lý vận hành (BankOutlined)
│   ├── Section 2: Thông số kỹ thuật & Khai thác (SlidersOutlined)
│   ├── Section 3: Thông tin công bố mở, đưa vào sử dụng (FileTextOutlined — Accordion Collapsible)
│   └── Section 4: Thông tin phê duyệt (AuditOutlined — Accordion Collapsible, chuẩn AGENTS.md)
├── Tab 2: Thông tin vị trí (N)
│   ├── Bảng thuộc tính GIS (Loại đối tượng, Biểu tượng, Hệ quy chiếu, Quy tắc hiển thị)
│   └── Bảng tọa độ GPS (DetailTable + Nút "Xem vị trí trên bản đồ" mở GisLocationSelector Modal)
├── Tab 3: File đính kèm (N)
│   └── Bảng danh sách tệp đính kèm (DetailTable, scrollY={DRAWER_TABLE_SCROLL_Y.detailView})
├── Tab 4: Tuyến luồng (N)
│   └── Bảng chi tiết các phân đoạn tuyến luồng (DetailTable channel_route_detail)
└── Tab 5: Vận hành & bảo trì
    ├── Section Vận hành khai thác (Kế hoạch vận hành — DetailTable)
    ├── Section Bảo trì & nạo vét (Lịch sử nạo vét, duy tu luồng — DetailTable)
    └── Section Sự cố & cảnh báo (Lịch sử sự cố luồng — DetailTable)
```

### 4.3. Chi tiết từng Tab

#### Tab 1: "Thông tin chung"
- **Section 1: Thông tin cơ bản & Quản lý vận hành** (Luôn mở):
  - Mã luồng hàng hải (`channelCode`) & Tên luồng hàng hải (`channelName`).
  - Đơn vị quản lý (`orgUnitName` / `orgUnitId`) & Thuộc cảng biển (`seaportName` / `seaportId`).
  - Đơn vị khai thác/vận hành (`operatingUnitId`).
  - Địa điểm (Tỉnh/Thành phố `provinceId`) & Địa điểm chi tiết (`detailedLocation`).
  - Tình trạng hoạt động (`conditionStatus` dạng Pill Badge).
  - Trạm quản lý luồng (`managementStation`), Số lượng trạm (`stationCount`), Số lượng nhân sự (`stationStaffCount`), Diện tích trạm (`stationAreaSquareMeters` m²).
  - Số lượng phao tiêu báo hiệu: Số lượng phao (`buoyCount`), Số lượng tiêu (`beaconCount`).
  - Ghi chú (`notes`).
- **Section 2: Thông số kỹ thuật & Khai thác** (Luôn mở):
  - Cấp kỹ thuật của luồng (`channelGrade` / `routeGrade`).
  - Chiều dài toàn tuyến luồng (`totalLengthKm` km).
  - Chiều rộng thiết kế luồng (`designWidthM` m) & Độ sâu thiết kế (`designDepthM` m).
  - Độ sâu chuẩn tắc công bố hiện trạng (`currentDepthM` m).
  - Cao trình đáy luồng (`bottomElevationM` m).
  - Chế độ thủy triều / Biên độ triều (`tidalRegime` / `tidalRangeM`).
  - Trọng tải tàu thiết kế cho phép (`maxVesselTonnageDwt` DWT).
  - Phạm vi bảo vệ luồng hàng hải (`protectionScopeMeters` m) & Ghi chú phạm vi bảo vệ (`protectionNotes`).
- **Section 3: Thông tin công bố mở, đưa vào sử dụng** (Accordion có thể thu gọn, mặc định mở):
  - Số quyết định công bố đưa vào sử dụng (`announcementDecisionNumber`).
  - Ngày ban hành quyết định (`announcementDecisionDate`).
  - Đơn vị / Cơ quan ban hành quyết định (`announcementDecisionIssuer`).
  - Văn bản thỏa thuận đầu tư / hồ sơ pháp lý liên quan.
- **Section 4: Thông tin phê duyệt** (Accordion Toggle theo chuẩn AGENTS.md, mặc định đóng, có Badge trạng thái trên tiêu đề):
  - Trạng thái phê duyệt hiện tại (Pill Badge).
  - Cán bộ cập nhật cuối (`updatedBy`) & Thời gian cập nhật (`updatedAt`).
  - Cán bộ gửi phê duyệt (`submittedBy`) & Ngày gửi phê duyệt (`submittedAt`).
  - Cán bộ phê duyệt cấp Cảng vụ/Chi cục (`level1ApprovedBy`) & Ngày duyệt Cảng vụ (`level1ApprovedAt`).
  - Nội dung / Ý kiến phê duyệt cấp Cảng vụ (`level1ApprovalContent`).
  - Cán bộ phê duyệt cấp Cục (`level2ApprovedBy`) & Ngày duyệt Cục (`level2ApprovedAt`).
  - Nội dung / Ý kiến phê duyệt cấp Cục (`level2ApprovalContent`).
  - Lý do từ chối (nếu có — hiển thị màu `statusCritical`).

#### Tab 2: "Thông tin vị trí (N)"
- **Thẻ thuộc tính GIS**:
  - Loại đối tượng: `LINE` (Đối tượng đường) hoặc `POLYGON` (Đối tượng vùng) hoặc `POINT` (Đối tượng điểm).
  - Biểu tượng bản đồ: Icon hình ảnh + Tên biểu tượng từ `symbolMap` và `symbolImageMap`.
  - Hệ quy chiếu: `WGS-84` (1) hoặc `VN-2000` (2).
  - Quy tắc hiển thị: `Độ, phút, giây (DMS)`.
- **Thanh thao tác & Tiêu đề**:
  - Tiêu đề: `Tọa độ GPS (N)` (`sidebarBg`, `fontWeightBold`, `fontSizeMd`, height 32px).
  - Nút bấm: `Xem vị trí trên bản đồ` (`EnvironmentOutlined`, `outlineButtonStyle`, height 32px, `actionPrimary`). Khi click mở Modal `GisLocationSelector` ở chế độ readonly.
- **Bảng tọa độ `DetailTable`**:
  - Chiều cao bảng: `scrollY={DRAWER_TABLE_SCROLL_Y.withButton}`.
  - Cột: `STT` (50px), `Vĩ độ (Latitude - N)` (format `DD° MM' SS.SS" N`), `Kinh độ (Longitude - E)` (format `DD° MM' SS.SS" E`).

#### Tab 3: "File đính kèm (N)"
- Hiển thị danh sách tệp đính kèm trong bảng `DetailTable` với `scrollY={DRAWER_TABLE_SCROLL_Y.detailView}`.
- Cột: `STT` (50px), `Tên tài liệu` (`fileName` + icon `FileOutlined`, ellipsis tooltip), `Dung lượng` (`fileSize` format KB/MB), `Người tải lên` (`uploadedBy` map qua `userMap`), `Ngày tải lên` (`uploadedAt` format `DD/MM/YYYY HH:mm`), `Thao tác` (Nút tải xuống).

#### Tab 4: "Tuyến luồng (N)"
- Hiển thị danh sách các đoạn tuyến luồng con (`channel_route_detail`) của luồng hàng hải.
- Chiều cao bảng: `scrollY={DRAWER_TABLE_SCROLL_Y.detailView}`.
- Cột dữ liệu chuẩn:
  1. `STT` (50px, Center).
  2. `Phân loại tuyến` (`routeClassification`, 140px).
  3. `Mã tuyến` (`routeCode`, 120px, `fontWeightMedium`).
  4. `Tên tuyến luồng` (`routeName`, 200px, in đậm `textPrimary`).
  5. `Loại tuyến` (`routeType`: 1 = Công cộng, 2 = Chuyên dùng, 120px).
  6. `Cấp luồng` (`routeGrade`, 100px).
  7. `Chiều dài (km)` (`channelLengthKilometers`, 110px, Align Right).
  8. `Độ sâu thiết kế (m)` (`designDepthMeters`, 130px, Align Right).
  9. `Độ sâu hiện trạng (m)` (`currentDepthMeters`, 130px, Align Right).
  10. `Bề rộng thiết kế (m)` (`maximumDesignWidthMeters` / `minimumDesignWidthMeters`, 140px).
  11. `Bán kính cong nhỏ nhất (m)` (`minimumCurveRadiusMeters`, 160px).
  12. `Vị trí vũng quay tàu` (`turningBasinLocation`, 160px).
  13. `Bán kính vũng quay (m)` (`turningBasinRadiusMeters`, 140px).

#### Tab 5: "Vận hành & bảo trì"
- 3 Sections accordion (dùng chung style `sectionBoxStyle` và `sectionHeaderStyle` có toggle mở/gập):
  1. **Thông tin vận hành khai thác**: Bảng kế hoạch và thực tế điều hành phương tiện qua luồng (`DetailTable`, `scrollY={160}`).
  2. **Thông tin bảo trì & nạo vét**: Bảng lịch sử các đợt nạo vét duy tu luồng (`latestMaintenanceYear`, `latestDredgingVolumeCubicMeters`, đơn vị thi công, khối lượng nạo vét m³, ngày hoàn thành).
  3. **Lịch sử sự cố & cảnh báo**: Bảng ghi nhận sự cố hàng hải, mắc cạn, chướng ngại vật trên luồng.

---

## 5. Đặc tả Tinh gọn Form Tạo mới & Sửa (`NavigationChannelForm.tsx`)

### 5.1. Loại bỏ Chế độ Xem chi tiết khỏi Form
- Loại bỏ toàn bộ code render chế độ `detail` (read-only) trong `NavigationChannelForm.tsx`. Khi người dùng xem chi tiết, `NavigationChannelList.tsx` trực tiếp gọi `NavigationChannelDetailContent.tsx`.
- `NavigationChannelForm.tsx` chỉ còn 2 chế độ: `create` và `edit`.

### 5.2. Cấu trúc 4 Tab Nhập liệu của Form
1. **Tab 1: Thông tin chung**:
   - Nhập liệu các trường #1-#21 và thông tin công bố đưa vào sử dụng.
   - Các `Form.Item` áp dụng `marginBottom: spaceFormField` (12px).
   - Tất cả các control `Input`, `Select`, `InputNumber`, `DatePicker` dùng `borderRadius: radiusPill` (999px), `height: 40`.
   - `DatePicker` sử dụng helper `getDatePickerProps()` để dropdown calendar co dãn chuẩn không bị cắt.
2. **Tab 2: Thông tin vị trí**:
   - Chọn Loại đối tượng (`GisGeometryType`), Hệ quy chiếu (`WGS-84` / `VN-2000`), Biểu tượng bản đồ (`mapSymbolId`).
   - Bảng nhập danh sách tọa độ GPS hỗ trợ 3 ô Độ (°), Phút ('), Giây (") kèm tính toán tự động ra Tọa độ thập phân (DD).
   - Nút `Chọn tọa độ trên bản đồ` mở Modal `GisLocationSelector` để ghim điểm/đường/vùng trực quan.
3. **Tab 3: File đính kèm**:
   - Tích hợp component dùng chung `InfrastructureAttachmentTab` (refType: `NAVIGATION_CHANNEL`), hỗ trợ kéo thả tệp, giới hạn dung lượng và hiển thị danh sách tệp đính kèm chuẩn CHK.
4. **Tab 4: Tuyến luồng**:
   - Bảng động thêm/sửa/xóa các phân đoạn tuyến luồng (`ChannelRouteDetailRequest`).
   - Hỗ trợ thêm dòng mới, xóa dòng, nhập các thông số độ sâu, chiều dài, bán kính cong.

### 5.3. Footer Form chuẩn hóa
- Footer đặt cố định ở đáy `AppDrawer`:
  - Nút **Lưu tạm / Lưu thay đổi**: `Button type="primary"` + `primaryButtonStyle` + `borderRadius: radiusPill` + `height: 40`.
  - Nút **Hủy / Đóng**: `Button` + `outlineButtonStyle` + `borderRadius: radiusPill` + `height: 40`.

---

## 6. Đặc tả Chi tiết Audit Log: Lịch sử Thay đổi (`infrastructure_history`)

### 6.1. Nguyên tắc Truy xuất Dữ liệu
- **Tuyệt đối không dùng các bảng cũ**: `change_logs`, `approval_logs`.
- **Sử dụng bảng tập trung duy nhất**: `infrastructure_history` với `tableName = 'navigation_channels'` hoặc `refType = 'NAVIGATION_CHANNEL'` và `recordId = channelId`.

### 6.2. Giao diện History Drawer
- Container: `AppDrawer` mở từ cạnh phải, chiều rộng `760px` (`width={760}`).
- **Header Drawer**: Icon `HistoryOutlined` + Tiêu đề `Lịch sử thay đổi — [Tên luồng]`.
- **Thanh tìm kiếm & lọc ngày**:
  - `Input` tìm kiếm nội dung thay đổi (`historySearch`), `borderRadius: radiusPill`, `height: 38`.
  - `DatePicker.RangePicker` chọn khoảng ngày (`getRangePickerProps()`), `borderRadius: radiusPill`, `height: 38`.
- **Danh sách dòng thời gian (Timeline)**:
  - Nhóm theo phiên cập nhật / thời điểm thay đổi.
  - Phân loại hành động bằng Badge màu chuẩn (`resolveHistoryActionMeta`):
    - **Thêm mới**: Màu `statusOperational` (`#1BAF7A`).
    - **Cập nhật**: Màu `actionPrimary` (`#204e9c`).
    - **Phê duyệt cấp Cảng vụ**: Màu `#13C2C2` (Teal).
    - **Phê duyệt cấp Cục**: Màu `statusOperational` (`#1BAF7A`).
    - **Từ chối / Trả về**: Màu `statusCritical` (`#E34948`).
    - **Xóa**: Màu `#64748b` (Slate).
    - **Tải lên tệp**: Màu `#0284c7`.
    - **Xóa tệp**: Màu `#ea580c`.
  - Chi tiết từng trường thay đổi: Tên trường tiếng Việt (`historyFieldName`), Giá trị cũ (`historyOldValueStyle`), Mũi tên chuyển tiếp (`→`), Giá trị mới (`historyNewValueStyle`).

---

## 7. Quy chuẩn Token & Thiết kế UI/UX (Design & Theme Rules)

### 7.1. Bảng Đối chiếu Token Bắt Buộc

| Quy cách | Token / Constant từ `themetokenchk.ts` | Giá trị chuẩn | Quy tắc cấm |
|---|---|---|---|
| **Màu chính (Action)** | `actionPrimary`, `sidebarBg` | `#204e9c`, `#1a3f83` | Cấm `#1890ff`, `#12468C` |
| **Màu Thành công / Đã duyệt** | `statusOperational` | `#1BAF7A` | Cấm hardcode xanh lá cây |
| **Màu Cảnh báo / Chờ duyệt C1** | `statusAttention` | `#EDA100` | Cấm hardcode vàng |
| **Màu Chờ duyệt C2 (Cục)** | `#0284C7` | `#0284C7` | Cấm dùng màu tím hoặc tag mặc định |
| **Màu Lỗi / Từ chối** | `statusCritical` | `#E34948` | Cấm hardcode đỏ thô `#ff0000` |
| **Màu Lưu tạm (Draft)** | `statusDraft` | `#93A3B3` | Cấm màu đen/xám tối |
| **Bo góc Control / Button / Badge** | `radiusPill` | `999px` | Cấm `borderRadius: 4px` / `6px` cho control |
| **Khoảng cách Form Field** | `spaceFormField` | `12px` | Cấm `marginBottom: 14px` / `18px` |
| **Thứ bậc Text (Text Hierarchy)** | `textPrimary` → `textSecondary` → `textTertiary` | `#181C32` → `#5E6278` → `#A1A5B7` | Cấm hardcode `#333`, `#666`, `#999` |
| **Chiều cao Cuộn Bảng Drawer (Tab Thuần)** | `DRAWER_TABLE_SCROLL_Y.pureTable` / `detailView` | `'calc(100vh - 296px)'` | Cấm để bảng tự do gây scroll ngoài Drawer |
| **Chiều cao Cuộn Bảng Drawer (Tab có Nút)** | `DRAWER_TABLE_SCROLL_Y.withButton` / `detailGis` | `'calc(100vh - 370px)'` | Cấm làm lệch tọa độ Y của thanh phân trang |

### 7.2. Pill Badge Standard
Mọi hiển thị trạng thái duyệt và tình trạng hoạt động bắt buộc render qua hàm hoặc CSS inline:
```tsx
const pillBadgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: radiusPill, // 999px
  fontSize: fontSizeMd,     // 13.5px
  fontWeight: fontWeightMedium, // 500
  background: `${color}15`,
  border: `1px solid ${color}40`,
  color: color,
  whiteSpace: 'nowrap',
});
```

---

## 8. Kế hoạch Thực thi & Work Orders (Implementation Work Orders)

### 8.1. Danh sách Work Orders

#### `WO-001`: Xây dựng component `NavigationChannelDetailContent.tsx`
- **Owner Seat**: `engineering-frontend-developer`
- **Tệp tạo mới**: `frontend/src/pages/navigationchannel/NavigationChannelDetailContent.tsx`
- **Trách nhiệm**:
  - Triển khai đầy đủ 5 Tab chi tiết: Tab 1 Thông tin chung (4 accordion sections), Tab 2 Thông tin vị trí (GIS metadata + GPS table + nút mở bản đồ), Tab 3 File đính kèm, Tab 4 Tuyến luồng (bảng `channel_route_detail`), Tab 5 Vận hành & bảo trì (3 accordion sections).
  - Tích hợp `DetailTable`, `DRAWER_TABLE_SCROLL_Y.*`, `GisLocationSelector` popup readonly.
  - Sử dụng toàn bộ token từ `themetokenchk.ts`.

#### `WO-002`: Chuẩn hóa `NavigationChannelList.tsx`
- **Owner Seat**: `engineering-frontend-developer`
- **Tệp chỉnh sửa**: `frontend/src/pages/navigationchannel/NavigationChannelList.tsx`
- **Trách nhiệm**:
  - Chuyển container xem chi tiết, tạo mới, chỉnh sửa sang `AppDrawer` trượt-phải với `width="min(1080px, 96vw)"`.
  - Cấu hình `FilterTableLayout` với `hideFilterToggle={true}`, sidebar cố định `width: 280px`, scroll dọc độc lập, chân sidebar chỉ giữ 2 nút Reload + Tìm kiếm.
  - Tích hợp `NavigationChannelDetailContent` vào Detail Drawer.
  - Chuẩn hóa cột bảng danh sách (100% visible header, cell ellipsis, Pill Badge).
  - Chuẩn hóa History Drawer truy vấn từ `infrastructure_history`.

#### `WO-003`: Tinh gọn & Chuẩn hóa `NavigationChannelForm.tsx`
- **Owner Seat**: `engineering-frontend-developer`
- **Tệp chỉnh sửa**: `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx`
- **Trách nhiệm**:
  - Loại bỏ hoàn toàn nhánh render `detail` (chuyển giao cho `NavigationChannelDetailContent`).
  - Chuẩn hóa 4 Tab nhập liệu: Tab 1 Thông tin chung, Tab 2 Tọa độ GPS (DMS inputs + GIS map picker), Tab 3 `InfrastructureAttachmentTab`, Tab 4 Tuyến luồng.
  - Áp dụng các helper `getDatePickerProps()`, `radiusPill`, `spaceFormField`.

---

## 9. Ma trận Kiểm thử & Nghiệm thu (QA Acceptance Criteria)

| Mã AC | Tiêu chí nghiệm thu (Acceptance Criteria) | Phương pháp kiểm chứng (Oracle) |
|---|---|---|
| **AC-01** | Bấm "Xem chi tiết" mở Drawer trượt-phải 1080px, không dùng Modal | Drawer xuất hiện từ phải sang, width 1080px, hiển thị `NavigationChannelDetailContent` với 5 Tab |
| **AC-02** | Tab 1 Thông tin chung hiển thị đầy đủ 4 accordion sections | Section 1, 2, 3 hiển thị đúng thông số; Section 4 Phê duyệt hiển thị lịch sử duyệt & toggle gập/mở |
| **AC-03** | Tab 2 Thông tin vị trí hiển thị bảng tọa độ GPS và nút xem bản đồ | Bảng tọa độ có format DMS; bấm "Xem vị trí trên bản đồ" mở popup bản đồ GIS vị trí |
| **AC-04** | Tab 4 Tuyến luồng hiển thị danh sách các đoạn tuyến luồng | Bảng tuyến luồng hiển thị đủ các cột kỹ thuật (mã, tên, phân cấp, độ sâu, chiều dài...) |
| **AC-05** | Sidebar bộ lọc 280px luôn hiển thị, thanh cuộn độc lập, chân chỉ có 2 nút | `hideFilterToggle={true}`, width 280px, cuộn dọc mượt mà, chân sidebar có Reload và Tìm kiếm |
| **AC-06** | Lịch sử thay đổi truy vấn đúng `infrastructure_history` | Mở từ menu dòng, hiển thị timeline các đợt thêm mới/sửa/phê duyệt với badge màu chuẩn |
| **AC-07** | Không có lỗi TypeScript & ESLint, không có hex colors hardcode | Chạy `npx tsc --noEmit` pass 100%, code import token từ `themetokenchk.ts` |

---

## 10. Bằng chứng Thực tế (Evidence References)

Tài liệu thiết kế này được xây dựng dựa trên việc đọc và đối chiếu trực tiếp các tệp nguồn trong workspace:
- `frontend/src/pages/port/BerthListPage.tsx` (Mẫu List Screen chuẩn với AppDrawer và FilterTableLayout)
- `frontend/src/pages/port/BerthForm.tsx` (Mẫu Form chuẩn với 4 Tab nhập liệu)
- `frontend/src/pages/port/BerthDetailContent.tsx` (Mẫu Detail Content chuẩn 5 Tab dạng Accordion & Card)
- `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` (Hiện trạng màn hình danh sách luồng hàng hải)
- `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx` (Hiện trạng form luồng hàng hải)
- `frontend/src/themetokenchk.ts` & `frontend/src/tokens.ts` (Bộ token màu sắc, kích thước và hằng số layout)
- `frontend/src/types/navigationChannel.ts` (Cấu trúc dữ liệu và interface luồng hàng hải)
