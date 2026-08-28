# CHK Conversion Recipe — module UI sync (dành cho worker general)

> Bản recipe chuẩn để chuyển 1 module KCHT sang giao diện chuẩn CHK (`/vts-system-chk`).
> Áp dụng cho: anchorage, transfer-area, storm-shelter, ship-repair-yard, berth, pier, dry-port, port (cảng biển), buoy, buoy-station.
> Module ĐÃ LÀM CHUẨN (tham chiếu): `buoy-berth` — xem 3 file của nó làm mẫu.
> KHÔNG dùng PMO. KHÔNG sửa backend. KHÔNG sửa file ngoài danh sách được giao.

## 1. THỨ TỰ ĐỌC (bắt buộc, đúng thứ tự)

1. `docs/GIAO_DIEN_CHK_PLAYBOOK.md` — toàn bộ (7 bước + gotcha + 12 điều vàng)
2. `frontend/src/themetokenchk.ts` — bộ token CHK (navy #273e7c, bảng #e4e4e4, pill badge, icons, styles). ĐỌC TRƯỚC KHI CODE.
3. `frontend/src/pages/buoy-berth/BuoyBerthListPage.tsx` — MẪU List chuẩn
4. `frontend/src/pages/buoy-berth/BuoyBerthForm.tsx` — MẪU Form/Drawer chuẩn
5. `frontend/src/pages/buoy-berth/BuoyBerthDetailContent.tsx` — MẪU Detail chuẩn
6. 3 file của module BẠN được giao (đọc kỹ trước khi sửa)

## 2. CHECKLIST CHUYỂN ĐỔI (13 điểm, theo từng file)

### ListPage
1. **Đổi import token**: `../../tokens` → `../../themetokenchk`, `../../theme` → `../../themetokenchk` (themetokenchk có export `colors`). Giữ NGUYÊN tên export — chỉ đổi path. Nếu token dùng không có trong themetokenchk → báo lại, không tự bịa.
2. **Bọc ThemeTokenProvider**: toàn bộ return của ListPage bọc `<ThemeTokenProvider tokens={themeTokenChk}>`. ⚠️ TUYỆT ĐỐI KHÔNG xóa import `ThemeTokenProvider` khi sửa import khác (dùng multi_edit).
3. **Empty state**: BỎ `emptyState` custom (emoji 📭 + text riêng). Render `DataTable` VÔ ĐIỀU KIỆN với columns — bảng rỗng vẫn hiện header. DataTable tự dùng `tableEmptyState` của themetokenchk ("Không có kết quả tìm kiếm").
4. **Scroll**: `scroll={{ x: 'max-content', y: <giữ y hiện tại nếu có> }}` — bỏ scroll x cứng (vd 2050/2600). Bỏ override CSS cell padding kiểu `<style>.list-view-table .ant-table-cell{padding-block:9.5px!important}</style>` nếu có.
5. **Badge trạng thái**: dùng `statusBadgeStyle(color)` từ themetokenchk (đã có sẵn?) — NẾU ListPage đã có hàm pill inline, thay bằng statusBadgeStyle. Cột Trạng thái/Tình trạng BẮT BUỘC pill 2 đầu: `borderRadius: radiusPill, padding: '2px 10px', fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: color15, border: 1px solid color40, color`.
6. **Icon action**: dùng `icons.create/view/edit/delete/submit/approve/reject/history` từ themetokenchk (không import @ant-design/icons riêng lẻ nữa — themetokenchk đã export icons.*).
7. **Action Chỉnh sửa** chỉ hiện khi `canEditApprovalRecord(record.approvalStatus)` (Lưu tạm/DRAFT hoặc Đã phê duyệt/APPROVED). Xóa tương tự `canDeleteApprovalRecord`.
8. **Phê duyệt**: dùng `ApprovalModal` chuẩn (components/shared) — KHÔNG modal tự chế. Level c1/c2 theo trạng thái.
9. **Lịch sử thay đổi**: render theo `renderBuoyBerthHistoryTimeline` (xem BuoyBerthListPage): group theo (thời gian + người + status + approvalLevel), grid 2 cột, badge thao tác qua `resolveHistoryActionMeta` (Thêm mới/Cập nhật/Phê duyệt cấp Cảng vụ/Từ chối cấp Cục...). Phân trang cuộn vô hạn 10/trang. Giữ NGUYÊN API history hiện có của module (chỉ đổi render). Phòng thủ `Array.isArray(records) ? records : []`.

### Form/Drawer
10. **Layout**: `Row gutter={[24, 0]}` + `Col span={12}`; label = `<span style={{color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd}}>`; `Form.Item style={{marginBottom: spaceFormField}}`.
11. **Tabs**: `tabBarStyle={drawerTabBarStyle}` + nội dung tab `style={drawerTabContentStyle}` (KHÔNG paddingTop: 16). Tab label có count: `'Thông tin vị trí (N)'`, `'File đính kèm (N)'`.
12. **showCount**: mọi `Input`/`TextArea` có `maxLength` → thêm `showCount`. Mã tự sinh: `Input disabled` + `style={readonlyInputStyle}` (KHÔNG hardcode #8c8c8c).
13. **Tab Thông tin vị trí (GPS)**: bảng 6 trường DMS riêng (`latD/latM/latS/lngD/lngM/lngS`), mỗi ô ghi trực tiếp — KHÔNG chuyển decimal qua lại; đổi loại đối tượng GIỮ tọa độ cũ; nút "Chọn tọa độ trên bản đồ" mở `GisLocationSelector`. Copy pattern từ BuoyBerthForm.
14. **Tab File đính kèm**: `Upload.Dragger` + bảng `Table size="small"` STT/Tên/Dung lượng/Người tải lên/Ngày tải lên (dataIndex đúng field backend: `uploadedBy`/`uploadedAt`, map tên qua userMap), pagination antd 10/trang. Copy từ BuoyBerthForm.
15. **Tab "Lịch sử & Phê duyệt"**: CHỈ hiện khi `drawerMode !== 'create'`.

### DetailContent
16. **Detail grid**: class `chk-detail-grid`/`chk-detail-row`/`chk-detail-label`/`chk-detail-value` (CSS có sẵn trong theme) — KHÔNG bịa `detail-grid`/`detail-row`.
17. **Bảng con**: `DetailTable` (components/shared) — header xám, phân trang antd, "Tổng cộng N". KHÔNG PagedTable.
18. **GIS**: nút "Xem vị trí trên bản đồ" mở GIS modal với `disabled` — GisLocationSelector ở chế độ XEM phải ẩn nút Thêm điểm / ô nhập DMS / nút xóa / drag / toolbar vẽ (nếu component chưa ẩn → chỉ sửa phần render modal, KHÔNG sửa GisLocationSelector.tsx — báo lại).
19. **Parse MULTIPOINT**: regex ĐÚNG `((?:\([^)]*\),?)+)` — TUYỆT ĐỐI không copy `(?:,[^)]+)*` (chỉ bắt 1 điểm). Nếu file đã fix rồi thì giữ nguyên.

## 3. QUY TẮC BẮT BUỘC (AGENTS.md — worker KHÔNG đọc AGENTS.md nên chép đây)

- **KHÔNG hardcode màu hex / spacing / font-size**: cấm `#12468C`, `#8c8c8c`, radius 6/7/10, font 12/14/16/18/24. Dùng token từ themetokenchk. Layout property (width, flex, minWidth, height) được phép số thô.
- **Text hiển thị PHẢI tiếng Việt có dấu**: label, button, toast, message. KHÔNG để tiếng Anh hoặc không dấu.
- **Import-then-export**: nếu cần re-export token từ themetokenchk trong cùng file + dùng nó → phải `import { x } from '...'; export { x };` (Vite dev bug — ReferenceError).
- KHÔNG sửa: `themetokenchk.ts`, `tokens.ts`, `theme.ts`, `components/list-view/*`, `components/shared/*`, `GisLocationSelector.tsx`, `ThemeTokenContext.tsx`, file của module khác, file backend.

## 4. VERIFY (bắt buộc trước khi báo xong)

```bash
cd frontend
npx tsc --noEmit -p tsconfig.app.json
```
- KHÔNG chạy `npm run build` (build trung tâm — coordinator chạy).
- KHÔNG chạy `tsc -p tsconfig.json` (project reference — không check code, luôn exit 0).
- Toàn dự án có ~90 lỗi typecheck pre-existing — KHÔNG sửa file khác; chỉ đảm bảo 3 file module BẠN KHÔNG xuất hiện trong danh sách lỗi.
- Nếu file bạn gây lỗi typecheck → sửa CHO ĐẾN KHI sạch.

## 5. BÁO CÁO (format cuối)

- Danh sách file đã sửa + tóm tắt thay đổi từng file
- Kết quả `npx tsc --noEmit -p tsconfig.app.json` (đếm lỗi tổng + xác nhận 3 file module KHÔNG trong danh sách lỗi)
- Điểm nào chưa làm được (nếu có) + lý do
- KHÔNG chạy git commit/push
