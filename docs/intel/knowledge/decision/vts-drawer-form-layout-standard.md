# Quy chuẩn kiến trúc: Bố cục Form Drawer Thêm mới & Chỉnh sửa (VTS & Chuẩn Bến cảng)

**Ngày ban hành**: 2026-09-09  
**Phạm vi áp dụng**: `VtsSystemForm.tsx`, `VtsOperationCenterForm.tsx`, `BerthForm.tsx` và toàn bộ các form nhập liệu KCHTGT.

---

## 1. Nguyên nhân & Bối cảnh

- Trước đây, trong Form Thêm mới / Chỉnh sửa của Hệ thống VTS (`VtsSystemForm.tsx`) và Trung tâm điều hành VTS (`VtsOperationCenterForm.tsx`), Tab "Thông tin chung" tự ý chẻ ra một Section Card riêng mang tên **"Thông tin địa lý & Vận hành"** (chứa Địa điểm Tỉnh/TP, Địa điểm chi tiết, Thời gian bắt đầu hoạt động, Tình trạng). Việc này làm giao diện phân mảnh, thừa thẻ card và lệch hoàn toàn so với màn hình mẫu chuẩn Bến cảng (`BerthForm.tsx`) cũng như màn Xem chi tiết (`VtsSystemDetailContent.tsx`).
- Đồng thời, Drawer Chỉnh sửa của VTS chỉ hiển thị 2 nút đơn giản `[Hủy]` + `[Cập nhật]` thay vì tuân thủ quy trình phê duyệt 2 cấp (`[Lưu tạm]`, `[Lưu và gửi phê duyệt]`, `[Lưu và phê duyệt]`).
- Chiều rộng Drawer đặt cố định `50%` thay vì co dãn theo `width="min(920px, 96vw)"`, tiêu đề chưa chuẩn `Chỉnh sửa thông tin — ...`, và các tab con chưa hiển thị số lượng bản ghi `(${count})`.

---

## 2. Quy chuẩn bắt buộc (MANDATORY RULES)

### Quy tắc 1: Cấu trúc 2 Section chuẩn tại Tab "Thông tin chung"

Tab "Thông tin chung" của Form VTS **CHỈ ĐƯỢC PHÉP CÓ 2 SECTION**:
1. **Section 1**: `<BankOutlined style={{ color: actionPrimary }} /> <span>Thông tin cơ bản & Quản lý vận hành</span>` (style `sectionBoxStyle`):
   - Gom toàn bộ thông tin định danh, đơn vị, liên kết cảng biển, địa phương, thời gian hoạt động, tình trạng và địa chỉ chi tiết vào cùng một khung nhóm.
   - **CẤM** tạo thêm bất kỳ section/card nào mang tên "Thông tin địa lý & Vận hành".
2. **Section 2**: `<FileTextOutlined style={{ color: actionPrimary }} /> <span>Phạm vi áp dụng & Thông báo hàng hải</span>` (cho Hệ thống VTS) hoặc `<span>Phạm vi phủ sóng & Ghi chú</span>` (cho TTĐH VTS):
   - Chứa các ô nhập vùng phủ sóng / phạm vi, thông báo hàng hải và ghi chú.
   - **BẮT BUỘC** thiết kế dưới dạng **ô `Input` 1 dòng** (`height: 40px`, `borderRadius: radiusPill`, `style={inputStyle}`, có `showCount` và `maxLength={2000}` hoặc `4000`), **kéo dài toàn bộ chiều rộng form (`<Col span={24}>`)** để tận dụng tối đa không gian hiển thị chuỗi dài (TUYỆT ĐỐI KHÔNG để dồn 1 bên `<Col span={12}>` làm trống nửa màn hình, và KHÔNG làm `TextArea` nhiều dòng).

### Quy tắc 2: Quy chuẩn Nút bấm & Đường viền Footer Drawer

1. **Khi Thêm mới (`isCreateMode`)**:
   - Luôn hiển thị đầy đủ 3 nút chuẩn đồng nhất với Bến cảng (`BerthListPage.tsx`):
     - `Lưu tạm` (`style={outlineButtonStyle}`, `actionType = 'draft'`)
     - `Lưu và gửi phê duyệt` (`type="primary" style={primaryButtonStyle}`, `actionType = 'submit'`)
     - `Lưu và phê duyệt` (`type="primary" style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}`, `actionType = 'approve'`)
   - Truyền trực tiếp React Fragment `<>...</>` vào `footer` của `AppDrawer`, **CẤM** tự ý bọc thêm thẻ `<div style={drawerFooterStyle}>` lặp bên trong vì `AppDrawer` đã bọc sẵn.
2. **Khi Chỉnh sửa (`isEditMode`)**:
   - Nếu hồ sơ ở trạng thái Nháp / Bị trả về (`DRAFT`, `NHAP`, `REJECTED_LEVEL1`, `REJECTED_LEVEL2`):
     - `Lưu tạm` (`style={outlineButtonStyle}`, `actionType = 'draft'`)
     - `Lưu và gửi phê duyệt` (`type="primary" style={primaryButtonStyle}`, `actionType = 'submit'`)
   - Luôn hiển thị nút `Lưu và phê duyệt` (`actionType = 'approve'`).
3. **Đường viền Footer Drawer (Thanh mảnh, không hardcode viền đậm)**:
   - Trong prop `styles` của `AppDrawer`, chỉ cấu hình `header` và `body`:
     ```tsx
     styles={{
       header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
       body: { padding: '0 24px 12px 24px', overflow: isDetailMode ? 'hidden' : undefined },
     }}
     ```
   - **TUYỆT ĐỐI KHÔNG** cấu hình `styles.footer` (như `borderTop: 1px solid #e4e4e4` trong `drawerStyles`) để đường viền trên cụm nút bấm giữ nguyên độ mờ và thanh mảnh tự nhiên của Ant Design Drawer (`1px solid rgba(5, 5, 5, 0.06)`), tránh bị thô đậm.
4. **Scope CSS & Cỡ chữ tiêu đề (13.5px & 16px)**:
   - `rootClassName="vts-drawer-scope"` và `className="vts-drawer-scope"` áp dụng xuyên suốt cho cả Thêm mới, Chỉnh sửa và Chi tiết để kế thừa quy tắc font-size 13.5px của `.vts-drawer-scope .ant-btn`.
   - Tiêu đề Drawer dùng `fontSize: 16` (`<span style={{ ...drawerTitleStyle, fontSize: 16 }}>...</span>`).

### Quy tắc 3: Tiêu đề, Kích thước & Nhãn Tab Drawer

1. **Chiều rộng Drawer**: `width={isDetailMode ? (typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000) : 'min(920px, 96vw)'}`
2. **Tiêu đề Drawer**:
   - Thêm mới: `Thêm mới hệ thống VTS` / `Thêm mới Trung tâm điều hành VTS`
   - Chỉnh sửa: `Chỉnh sửa thông tin — ${record.systemName || record.name}`
   - Chi tiết: `Chi tiết hệ thống VTS - ${record.systemName}` / `Chi tiết Trung tâm điều hành VTS - ${record.name}`
3. **Nhãn các Tab con có số lượng bản ghi**:
   - `VtsSystemForm`: `Thông tin chung`, `Thông tin vùng VTS (${zoneList.length})`, `File đính kèm (${attachmentList.length})`
   - `VtsOperationCenterForm`: `Thông tin chung`, `Thông tin vị trí (${coordinateList.length})`, `File đính kèm (${attachments.length})`

