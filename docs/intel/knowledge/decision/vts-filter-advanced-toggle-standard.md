# Quy chuẩn kiến trúc: Nút Bộ lọc nâng cao & Bố cục bộ lọc Sidebar (VTS & Bến cảng)

**Ngày ban hành**: 2026-09-09  
**Phạm vi áp dụng**: Màn hình danh sách Hệ thống VTS (VtsSystemList.tsx), Trung tâm điều hành VTS (VtsOperationCenterList.tsx), Bến cảng (BerthListPage.tsx) và toàn bộ các phân hệ KCHTGT.

---

## 1. Nguyên nhân & Bối cảnh phát sinh
- Trước đây, khi cấu hình hideFilterToggle={true} trên FilterTableLayout, nút tròn Bộ lọc nâng cao (icon FilterOutlined) ở góc dưới footer sidebar đã bị ẩn đi (isibility: 'hidden'). Việc này làm mất hoàn toàn khả năng thu gọn / mở rộng bộ lọc nâng cao, khiến người dùng phản ánh: *mất filter nâng cao rồi note lại để lần sau k bị*.
- Đồng thời, các trường bộ lọc bị sắp xếp lộn xộn giữa vùng Cơ bản và vùng Nâng cao (ví dụ: Tình trạng bị giấu trong Nâng cao, Thuộc cảng biển lại nằm ở Cơ bản), làm mất đi tính nhất quán so với màn hình mẫu chuẩn Bến cảng (BerthListPage.tsx).

---

## 2. Quy tắc bắt buộc (MANDATORY RULES)

### Quy tắc 1: CẤM dùng hideFilterToggle={true} trên các màn hình VTS và Bến cảng
- Tất cả màn hình danh sách có nhiều hơn 3 tiêu chí lọc **BẮT BUỘC PHẢI CÓ** nút toggle Bộ lọc nâng cao.
- Quản lý state bằng:
  `	sx
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  `
- Cấu hình prop trên FilterTableLayout:
  `	sx
  <FilterTableLayout
    filterCollapsed={filterCollapsed}
    onToggleCollapse={() => setFilterCollapsed((value) => !value)}
    ...
  >
  `
- **TUYỆT ĐỐI CẤM** truyền hideFilterToggle={true}.

### Quy tắc 2: Phân chia 2 vùng bộ lọc rõ ràng
Bộ lọc trên Sidebar được phân định nghiêm ngặt thành 2 nhóm:
1. **Bộ lọc cơ bản (Luôn hiển thị)**:
   - 1. **Đơn vị quản lý** (OrgUnitTreeSelect)
   - 2. **Tên KCHT** (Input tìm kiếm theo tên)
   - 3. **Tình trạng hoạt động** (Select ConditionStatus / OperationalStatus)
2. **Bộ lọc nâng cao (Ẩn / hiện theo nút tròn toggle {filterCollapsed && (<>...</>)})**:
   - 4. **Thuộc cảng biển** (Select có 
ormalizeSearchText)
   - 5. **Thuộc luồng / Thuộc hệ thống VTS** (nếu có)
   - 6. **Mã KCHT** (Input tìm kiếm theo mã)
   - 7. **Địa điểm (Tỉnh / TP)** (Select VIETNAM_PROVINCE_OPTIONS)
   - 8. **Thời gian bắt đầu hoạt động** (nếu có, RangePicker)
   - 9. **Ngày cập nhật** (RangePicker)

### Quy tắc 3: Chuẩn Wrapper và CSS Responsive StatusTabs & Cỡ chữ 13.5px
- Container chính của toàn trang:
  `	sx
  <div className=vts-page-wrapper style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
  `
- Toàn bộ cỡ chữ bảng, input, select, drawer, modal con được ép đồng nhất:
  `css
  .vts-page-wrapper,
  .vts-page-wrapper .ant-table,
  .vts-page-wrapper .ant-table-cell,
  .vts-page-wrapper .ant-input,
  .vts-page-wrapper .ant-select,
  ... {
    font-size: 13.5px !important;
  }
  `
- StatusTabs căn giữa khi rộng và cuộn ngang mượt mà khi màn hình hẹp:
  `css
  .vts-page-wrapper div:has(> button[aria-pressed]) {
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    justify-content: center !important;
    justify-content: safe center !important;
    align-items: center !important;
    scrollbar-width: thin !important;
    scrollbar-color: #cbd5e1 #f8fafc !important;
    scroll-behavior: smooth !important;
    padding: 2px 16px 6px 16px !important;
    gap: 20px !important;
  }
  `

---

## 3. Checklist tự kiểm tra khi thao tác UI màn hình danh sách
- [x] Nút tròn Bộ lọc nâng cao ở góc phải footer sidebar hiển thị rõ ràng và bấm toggle trơn tru.
- [x] Đơn vị quản lý, Tên và Tình trạng luôn nằm trong nhóm Cơ bản (trên cùng).
- [x] Cảng biển, Mã, Địa điểm, Thời gian hoạt động, Ngày cập nhật nằm trong nhóm Nâng cao (ẩn theo toggle).
- [x] StatusTabs có thanh cuộn mượt và căn giữa justify-content: center !important; justify-content: safe center !important;.
- [x] Cỡ chữ bảng và form đạt chuẩn 13.5px.
- [x] Không còn lỗi TypeScript hoặc cảnh báo unused import trong file.
