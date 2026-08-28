# 🎨 GIAO DIỆN CHK — PLAYBOOK & HANDOFF (dùng cho mọi phiên sửa giao diện)

> **Mục đích file này:** ghi lại toàn bộ kiến thức + phương pháp đã dùng để đồng bộ màn
> **Quản lý bến phao** theo chuẩn **Hệ thống VTS CHK** (`/vts-system-chk`), để các phiên
> sau chỉ cần: đọc file này → bảo sửa module nào → làm đúng quy trình → xong.
> **KHÔNG dùng PMO** cho việc sửa giao diện này (đã triage C0–C1, làm inline).
>
> Cập nhật lần cuối: 2026-08-28 — áp dụng thành công cho module `buoy-berth` (Bến phao);
> hotfix cùng ngày: **regex MULTIPOINT chỉ lưu 1 tọa độ** + **GIS view-mode còn nút Thêm điểm** + **Lịch sử thay đổi chuẩn VTS CHK** (chi tiết mục 3, 5 & 6).

---

## 1. NGUỒN THAM CHIẾU CHUẨN (đọc trước khi sửa bất kỳ module nào)

| Thứ tự | File | Vai trò |
|---|---|---|
| 1 | `frontend/src/themetokenchk.ts` | **Bộ theme token CHK** (màu navy #273e7c, bảng xám #e4e4e4, viên thuốc 999px, sort icon SVG, empty state "Không có kết quả tìm kiếm"). Song song 1:1 với `tokens.ts` |
| 2 | `frontend/src/pages/vtssystemchk/VtsSystemChkList.tsx` | **Màn chuẩn List CHK** — cách bọc `ThemeTokenProvider`, columns, rowActions, filter, history timeline |
| 3 | `frontend/src/pages/vtssystemchk/VtsSystemChkForm.tsx` | **Màn chuẩn Form/Drawer CHK** — layout Row/Col, tab, bảng GPS DMS 6 trường, Upload.Dragger, GIS modal |
| 4 | `frontend/src/components/list-view/` | `ScreenHeader`, `FilterTableLayout`, `StatusTabs`, `DataTable`, `Pagination`, `PagedTable` — đều đọc token qua `useThemeToken()` |
| 5 | `frontend/src/components/shared/` | `AppDrawer`, `ApprovalModal`, `DetailTable`, `ApprovalStatusBadge`, `AttachmentList`, `FormSaveFooter` |
| 6 | `frontend/src/context/ThemeTokenContext.tsx` | Cơ chế phân phát token: `<ThemeTokenProvider tokens={themeTokenChk}>` + `useThemeToken()` |
| 7 | `frontend/src/utils/approvalEditPolicy.ts` | Policy sửa/xóa theo trạng thái phê duyệt (`canEditApprovalRecord`, `canDeleteApprovalRecord`) |
| 8 | `frontend/src/components/gis/GisLocationSelector.tsx` | Bản đồ chuyên dụng chọn tọa độ (POINT/LINE/POLYGON). **Khi `disabled` (chế độ XEM) PHẢI ẩn mọi thao tác sửa** — xem mục 6 gotcha 10 |

---

## 2. 7 BƯỚC SỬA GIAO DIỆN MỘT MODULE THEO CHUẨN CHK

### Bước 1 — Xác định footprint
- Tìm các file màn hình của module: `frontend/src/pages/<module>/` hoặc `frontend/src/services/<module>/`
- Liệt kê đủ: ListPage + Form + DetailContent (thường 3 file)

### Bước 2 — Triage (bắt buộc, trước khi sửa)
- Gọi `intake_triage` với **đủ** candidate_files (thiếu file sẽ bị tripwire chặn giữa chừng → mất thời gian)
- Class thường ra **C1** (3 file / 1 package) → làm inline, không PMO
- **Đừng vượt LOC budget 200**: nếu sắp vượt → re-triage ngay với đủ file

### Bước 3 — Đổi import token sang themetokenchk
```ts
// Trước: import { … } from '../../tokens';  +  import { colors } from '../../theme';
// Sau:
import { … } from '../../themetokenchk';       // giữ nguyên tên export, chỉ đổi path
import { colors } from '../../themetokenchk';  // themetokenchk có export colors
```

### Bước 4 — Bọc ThemeTokenProvider (chỉ ở ListPage)
```tsx
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
// ...
return (
  <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      {/* ...toàn bộ màn hình... */}
    </div>
  </ThemeTokenProvider>
);
```
> ⚠️ **ĐỪNG BAO GIỜ xóa import `ThemeTokenProvider` khi thêm import khác** — dùng `multi_edit`
> với oldString sát thực tế. Đã từng vô tình xóa → lỗi runtime `ThemeTokenProvider is not defined`.

### Bước 5 — Đồng bộ 7 điểm chuẩn CHK
| # | Điểm | Chuẩn CHK |
|---|---|---|
| 1 | **Empty state bảng** | Không truyền `emptyState` custom — `DataTable` tự dùng `tableEmptyState` của themetokenchk ("Không có kết quả tìm kiếm") |
| 2 | **Header cột khi bảng rỗng** | Render `DataTable` **vô điều kiện** với `columns` (không nhánh `dataSource.length === 0` riêng) → header luôn hiện |
| 3 | **Scroll bảng** | `scroll={{ x: 'max-content' }}` — bỏ override padding cell kiểu `<style>.list-view-table .ant-table-cell{padding-block:9.5px!important}` |
| 4 | **Form layout** | `Row gutter={[24, 0]}` + `Col span={12}`; label = `<span style={{color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd}}>`; `Form.Item style={{marginBottom: spaceFormField}}` |
| 5 | **Tab form** | `tabBarStyle={drawerTabBarStyle}` + nội dung tab `style={drawerTabContentStyle}` (KHÔNG `paddingTop: 16`) |
| 6 | **showCount** | Mọi `Input`/`TextArea` có `maxLength` → thêm `showCount` (0/255, 0/500, 0/2000) |
| 7 | **Mã tự sinh** | `Input disabled` + `style={readonlyInputStyle}` — KHÔNG hardcode `#8c8c8c` |

### Bước 6 — Đồng bộ các thành phần phức tạp
- **Bảng con trong form/detail** → dùng `Table size="small"` + pagination antd (10/trang, `showSizeChanger:false`, state `xxxPage`) — KHÔNG dùng `PagedTable` ở đây
- **Bảng con detail** → `DetailTable` (components/shared) — header xám, phân trang antd, "Tổng cộng N"
- **Detail grid** → class `chk-detail-grid` / `chk-detail-row` / `chk-detail-label` / `chk-detail-value` (CSS có sẵn trong theme) — KHÔNG tự bịa `detail-grid`/`detail-row`
- **Badge** → `statusBadgeStyle(color)` từ themetokenchk — KHÔNG inline pill thủ công
- **Icon action** → `icons.create/view/edit/delete/submit/approve/reject/history` từ themetokenchk — KHÔNG import icon antd riêng lẻ cho action
- **Tab label count** → `label: \`File đính kèm (${list.length})\``
- **Bộ lọc** → KHÔNG dấu `*` sau "Đơn vị quản lý" (đó là filter, không phải required)

### Bước 7 — Verify bắt buộc
```bash
cd frontend
npx tsc --noEmit -p tsconfig.app.json   # ⚠️ dùng tsconfig.app.json, KHÔNG tsconfig.json
npm run build
```

---

## 3. TỌA ĐỘ GPS — CHUẨN CHK (lưu 6 trường DMS riêng biệt)

> **Vì sao:** lưu decimal `{latitude, longitude}` rồi chuyển đổi qua lại DMS↔decimal mỗi lần
> nhập → **mất tọa độ** khi có nhiều điểm (LINE/POLYGON). CHK lưu 6 trường DMS, mỗi ô nhập
> ghi trực tiếp 1 trường → không bao giờ mất.

```ts
// State:
const [coordinateList, setCoordinateList] = useState<Array<{
  latD: number | null; latM: number | null; latS: number | null;
  lngD: number | null; lngM: number | null; lngS: number | null;
}>>([]);

// Ghi trực tiếp từng ô:
const updateGpsPoint = (i, field: 'lat'|'lng', d, m, s) => {
  setCoordinateList(p => { const n = [...p]; n[i] = {
    ...n[i],
    [field==='lat'?'latD':'lngD']: d,
    [field==='lat'?'latM':'lngM']: m,
    [field==='lat'?'latS':'lngS']: s,
  }; return n; });
};

// Chỉ chuyển decimal → DMS lúc: load edit + chọn từ GIS modal (ddToDms)
// Chỉ chuyển DMS → decimal lúc save:
const manualCoords = coordinateList.map(c => ({
  latitude: (c.latD??0) + (c.latM??0)/60 + (c.latS??0)/3600,
  longitude: (c.lngD??0) + (c.lngM??0)/60 + (c.lngS??0)/3600,
}));
```

- **renderDmsGroup** nhận `(dVal, mVal, sVal, maxDeg, onChange)` — KHÔNG tự `ddToDms` bên trong
- Đổi Loại đối tượng → **giữ** tọa độ cũ, chỉ thêm dòng trống cho đủ (Điểm 1 / Đường 2 / Vùng 3)
- Chọn tọa độ trên bản đồ → **THÊM MỚI** 1 điểm vào cuối (không ghi đè)

### Parse WKT MULTIPOINT — regex ĐÚNG (bắt đủ N điểm)

> **Lỗi đã gặp 2026-08-28:** regex `/MULTIPOINT\s*\(([^)]+(?:,[^)]+)*)/` chỉ bắt được **điểm ĐẦU TIÊN** —
> `[^)]+` dừng ở dấu `)` đầu của cặp `(lng lat)` đầu, nhóm `(?:,[^)]+)*` không đi tiếp qua `)` được. Hậu quả:
> chọn NHIỀU điểm loại "Đối tượng điểm" trên bản đồ → form chỉ merge 1 điểm → lưu 1 tọa độ; mở lại edit/detail cũng chỉ hiện 1.

```ts
// ✅ ĐÚNG — bắt đủ N điểm (pattern chuẩn, đang dùng trong GisLocationSelector.tsx):
const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));

// ❌ SAI — chỉ bắt điểm đầu tiên (đã fix 8 file/4 module 2026-08-28):
// wkt.match(/MULTIPOINT\s*\(([^)]+(?:,[^)]+)*)/)
```

⚠️ Ngoài ra còn 2 biến thể **CHẠY ĐÚNG** đang dùng ở anchorage/transfer-area/berth/pier/dry-port/buoy/buoy-station: `([^)]+(?:\)\,[^)]+)*)`. Khi sửa đừng copy mù pattern — test bằng node trước: `'MULTIPOINT((1 2),(3 4),(5 6))'` phải trả **3 điểm**.

---

## 4. ACTION & PHÊ DUYỆT — CHUẨN CHK

```ts
// Edit action — chỉ hiện khi Lưu tạm hoặc Đã phê duyệt:
const st = record.approvalStatus || '';
const editable = ['DRAFT','NHAP','APPROVED','DA_PHE_DUYET'].includes(st) && hasPerm('<resource>:update');
if (editable) actions.push({ key:'edit', label:'Chỉnh sửa', icon: icons.edit, onClick: ... });

// Xóa — chỉ DRAFT:
if (hasPerm('<resource>:delete') && ['DRAFT','NHAP'].includes(st)) actions.push({...});

// Phê duyệt — dùng ApprovalModal chuẩn:
<ApprovalModal
  visible={approveModalOpen}
  level={record.approvalStatus === 'APPROVED_LEVEL2' ? 'c2' : 'c1'}
  onConfirm={(content) => handleApprove(record, content)}
  onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
/>
```

---

## 5. LỊCH SỬ — CHUẨN CHK (timeline + badge thao tác)

### Quy tắc nghiệp vụ ghi lịch sử (quyết định 2026-08-28)

- **TẠO MỚI KHÔNG ghi lịch sử** — chỉ **CHỈNH SỬA** mới ghi (bến phao). Khi làm module khác, hỏi user trước khi ghi create-history.
- Chỉnh sửa (update) → ghi 1 record UPDATED kèm diff các trường (`Tên=Giá trị cũ; ...` → `Tên=Giá trị mới; ...`); **khi chỉ đổi approvalStatus** → status record = `PROPOSED` (submit) / `APPROVED` (saveAction APPROVED) / `UNDER_REVIEW` (chờ cấp cục) / `DRAFT_SAVED` (lưu tạm) thay vì `UPDATED` để badge hiện đúng (Trình duyệt / Phê duyệt cấp Cục).
- Duyệt C1/C2 → status `APPROVED` + approvalLevel 1/2; từ chối → `REJECTED` kèm lý do vào reason; xóa mềm → `DELETED`.

### Text trạng thái trong lịch sử PHẢI khớp 100% label list/detail

- Không dùng `ApprovalStatus.getLabel()` (enum legacy sai: APPROVED_LEVEL1 = "Chờ Cục duyệt"...). Dùng đúng label của StatusTabs/APPROVAL_STYLE_MAP module:
  `Lưu tạm` / `Chờ phê duyệt cấp Cảng vụ/Chi cục` / `Chờ phê duyệt cấp cục` / `Đã phê duyệt` / `Từ chối cấp Cảng vụ/Chi cục` / `Từ chối cấp cục`
- BE viết `changedField="Trạng thái phê duyệt"`, `newValue="Trạng thái phê duyệt=<label>"` (format `Tên=Giá trị; ...`); FE parse bằng `historyChangeRows`/`parseHistoryAssignments`.
- Badge thao tác: `resolveHistoryActionMeta` **ưu tiên reason ghi sẵn** ("Phê duyệt cấp Cảng vụ" / "Phê duyệt cấp Cục" / "Từ chối cấp Cảng vụ" / "Từ chối cấp Cục") trước khi suy từ newValue — tránh nhầm badge khi label khác nhau giữa các module.

### Timeline render

- Dùng `renderBuoyBerthHistoryTimeline` làm mẫu: group theo `(thời gian + người thay đổi + status + approvalLevel)`, grid 2 cột
- Badge thao tác dùng hàm `resolveHistoryActionMeta(group, changes)`:
  - `CREATED`/reason chứa "tạo mới" → **Thêm mới** (xanh lá)
  - `UPDATED`/reason chứa "cập nhật" → **Cập nhật** (xanh navy)
  - Field `approvalStatus` đổi: REJECTED_LEVEL1 → **Từ chối cấp Cảng vụ**; REJECTED_LEVEL2 → **Từ chối cấp Cục**; APPROVED_LEVEL1 → **Phê duyệt cấp Cảng vụ** (#13C2C2); APPROVED → **Phê duyệt cấp Cục** (xanh lá)
- Bản ghi thêm mới: `oldValue` null/'(null)'/'' → hiện "Thông tin thêm mới:" + giá trị mới
- Bản ghi sửa: "Thông tin thay đổi:" + `giá trị cũ → giá trị mới`
- History drawer: phân trang cuộn vô hạn (10/trang, "Đã tải N+"/"Tổng cộng N"), tìm kiếm + lọc ngày gọi API (`page/pageSize/keyword/fromDate/toDate`) — chuẩn VtsSystemChkList

---

## 6. GOTCHA ĐÃ HỌC (đọc kỹ, tránh lặp lại lỗi)

| # | Gotcha | Chi tiết |
|---|---|---|
| 1 | **typecheck frontend PHẢI dùng `tsconfig.app.json`** | `frontend/tsconfig.json` chỉ là project reference (`files: []`) — `tsc -p tsconfig.json` KHÔNG check code, luôn exit 0 kể cả thiếu import. Dùng `npx tsc --noEmit -p tsconfig.app.json` |
| 2 | **Vite dev không typecheck** | esbuild bỏ qua lỗi thiếu import → lỗi chỉ vỡ ở runtime. Luôn chạy tsc app config sau mỗi đợt sửa |
| 3 | **Đừng xóa import đang dùng khi thêm import mới** | Dùng `multi_edit` oldString sát thực tế. Đã từng xóa `ThemeTokenProvider` → `ReferenceError` runtime |
| 4 | **Toàn dự án có ~90 file lỗi typecheck pre-existing** | Không phải do bạn gây ra. Chỉ cần đảm bảo file module của bạn KHÔNG xuất hiện trong danh sách lỗi |
| 5 | **Vite v8 dev-mode re-export bug** | `export { x } from './tokens'` + dùng x trong cùng file → ReferenceError dev. Luôn `import { x } ... ; export { x };` (AGENTS.md mục đầu) |
| 6 | **Đừng tự bịa class/CSS layout** | Dùng class chuẩn trong theme (`chk-detail-*`, `list-view-table`). Đã từng bịa `detail-grid` → vỡ layout vì CSS không tồn tại |
| 7 | **Đừng hardcode màu/spacing** | Cấm `#12468C`, `#8c8c8c`, radius 6/7/10, font 12/14/16 — dùng token |
| 8 | **Backend giới hạn 10 file đính kèm** | Nếu lỗi "Tối đa 10 file" khi lưu → kiểm tra `BuoyBerthService.uploadAttachments` (đã bỏ check `> 10`). Các service KCHT khác (Berth, Anchorage, StormShelter...) VẪN còn check |
| 9 | **Regex parse MULTIPOINT hỏng → chỉ lưu 1 tọa độ** | `/MULTIPOINT\s*\(([^)]+(?:,[^)]+)*)/` chỉ bắt điểm đầu tiên (dừng ở `)` đầu). Biến thể `(?:\),[^)]+)*` hoặc `((?:\([^)]*\),?)+)` chạy đúng. Đã fix 8 file/4 module (buoy-berth, dai-ttdh, ship-repair-yard, storm-shelter) 2026-08-28 — xem mục 3 |
| 10 | **GisLocationSelector khi `disabled` (chế độ XEM) phải ẩn hết thao tác sửa** | `disabled` chỉ gate Select loại đối tượng + nút mở bản đồ — phải gate THÊM: nút "Thêm điểm", ô nhập DMS, nút xóa dòng, drag-sắp xếp, toolbar vẽ Geoman (removeControls), text hướng dẫn "Nhấp vào bản đồ..." |
| 11 | **Dùng token nhưng quên import → ReferenceError runtime** | Vite dev không typecheck → lỗi `X is not defined` chỉ vỡ ở runtime. Trước khi dùng token từ themetokenchk, kiểm tra import đã có (lỗi `primaryButtonStyle` ở BuoyBerthDetailContent 2026-08-28) |
| 12 | **Lịch sử thay đổi PHẢI ghi `infrastructure_history` — không bao giờ change_logs/approval_logs** | Bảng `change_logs`/`approval_logs` đã bị migration V20260825162500 drop — code cũ còn comment `[TẠM TẮT]` trả rỗng. Chuẩn VTS CHK: ghi `InfrastructureHistory` (refType=BUOY_BERTH, changedField/previousValue/newValue dạng `Tên=Giá trị; ...`, status PROPOSED/UPDATED/APPROVED/REJECTED/DELETED) + endpoint history phân trang (`page/pageSize/keyword/fromDate/toDate`) trả HistoryEntry. Đã fix bến phao 2026-08-28 |
| 13 | **API trả non-array → crash `xxx is not iterable`** | `res.data?.data || res.data || []` trả OBJECT khi API đổi shape (backend cũ) hoặc envelope lỗi → `setState(object)` → useMemo/renderer `[...state]` crash. Phòng thủ: API layer `Array.isArray(data) ? data : []` + mọi setter guard + useMemo/renderer `Array.isArray` (lỗi `historyRecords is not iterable` 2026-08-28) |
| 14 | **Sau khi sửa BE phải RESTART backend để test** | Backend chạy bản cũ → API trả shape cũ → lỗi runtime phía FE (đã gặp 2026-08-28: history trả `{changeHistory:...}` → crash). DB bến phao là Postgres REMOTE 10.0.229.20:5432 — máy dev không có psql/docker để debug trực tiếp |

---

## 7. PROMPT CHUẨN — copy-paste vào phiên mới

> Thay `<MODULE>` / `<Tên màn hình>` bằng module cần sửa (vd: `anchorage` / "Quản lý khu neo đậu").

```text
Sửa giao diện của module <MODULE> (màn <Tên màn hình>) cho đồng bộ 100% với màn Hệ thống VTS CHK (/vts-system-chk).

TRƯỚC TIÊN: đọc docs/GIAO_DIEN_CHK_PLAYBOOK.md và làm ĐÚNG theo 7 bước trong đó (không dùng PMO, làm inline C1).

Cụ thể:
1. Đổi import token sang frontend/src/themetokenchk.ts (thay '../../tokens' + '../../theme')
2. Bọc toàn bộ ListPage bằng <ThemeTokenProvider tokens={themeTokenChk}> (giữ import ThemeTokenProvider!)
3. Empty state bảng dùng mặc định CHK ("Không có kết quả tìm kiếm"), bảng rỗng VẪN hiện header cột (render DataTable vô điều kiện với columns), scroll x 'max-content'
4. Form thêm/sửa: Row gutter=[24,0] + Col span=12, tabBarStyle=drawerTabBarStyle + drawerTabContentStyle, showCount cho mọi input maxLength, mã tự sinh readonlyInputStyle
5. Tab Thông tin vị trí: bảng GPS lưu 6 trường DMS riêng (latD/latM/latS/lngD/lngM/lngS), mỗi ô ghi trực tiếp — KHÔNG chuyển decimal qua lại; đổi loại đối tượng giữ tọa độ cũ; nút "Chọn tọa độ trên bản đồ" mở GisLocationSelector
6. Tab File đính kèm: Upload.Dragger + bảng STT/Tên/Dung lượng/Người tải lên/Ngày tải lên (dataIndex đúng field backend: uploadedBy/uploadedAt, map tên qua userMap), pagination antd 10/trang
7. Tab label có count: 'Thông tin vị trí (N)', 'File đính kèm (N)'
8. Chi tiết: chk-detail-grid/chk-detail-row/chk-detail-label/chk-detail-value + DetailTable cho bảng con + nút "Xem vị trí trên bản đồ" (GIS modal disabled)
9. Badge dùng statusBadgeStyle(color); icon action dùng icons.* từ themetokenchk
10. Action Chỉnh sửa chỉ hiện khi Lưu tạm (DRAFT) hoặc Đã phê duyệt (APPROVED); phê duyệt dùng ApprovalModal chuẩn (level c1/c2)
11. Lịch sử: timeline + badge thao tác resolveHistoryActionMeta (Thêm mới/Cập nhật/Phê duyệt cấp Cảng vụ/Từ chối cấp Cục...)
12. GIS modal ở chế độ XEM ("Xem vị trí trên bản đồ chuyên dụng"): truyền `disabled` VÀ GisLocationSelector phải ẩn nút Thêm điểm / ô nhập DMS / nút xóa / drag / toolbar vẽ (mục 6 gotcha 10)
13. Parse MULTIPOINT phải dùng regex ĐÚNG bắt đủ N điểm (mục 3) — TUYỆT ĐỐI không copy pattern `(?:,[^)]+)*`

SAU KHI SỬA: chạy verify
cd frontend
npx tsc --noEmit -p tsconfig.app.json
npm run build
Báo cáo: danh sách file đã sửa + kết quả 2 lệnh verify + xác nhận module của tôi KHÔNG nằm trong danh sách lỗi typecheck toàn dự án.
```

---

## 8. GHI NHỚ NHANH — 12 ĐIỀU VÀNG

1. Đọc `themetokenchk.ts` trước khi code bất kỳ UI nào
2. Mọi màn muốn giống CHK phải copy pattern từ `vtssystemchk`, không tự bịa
3. `tsc -p tsconfig.app.json` — không bao giờ `tsconfig.json`
4. Bảng con form/detail: `Table size="small"` + pagination antd — không PagedTable
5. Detail grid: class `chk-detail-*` — không `detail-*`
6. Badge: `statusBadgeStyle` — không inline pill
7. GPS: 6 trường DMS riêng — không decimal chuyển đổi qua lại
8. Edit action: chỉ DRAFT/APPROVED
9. Phê duyệt: `ApprovalModal` — không modal tự chế
10. Lịch sử: timeline + `resolveHistoryActionMeta` — không Collapse đơn giản
11. MULTIPOINT regex: dùng `((?:\([^)]*\),?)+)` — không bao giờ `(?:,[^)]+)*` (chỉ bắt 1 điểm)
12. GisLocationSelector `disabled` = chế độ xem: ẩn hết nút thêm/sửa/xóa/toolbar vẽ
