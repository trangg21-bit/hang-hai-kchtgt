# HANDOFF — Phiên 2026-08-27: Bến phao (BuoyBerth) — Hoàn thiện theo feedback

> File bàn giao TOÀN BỘ phiên làm việc Khu tránh trú bão + Bến phao (2026-08-27). Toàn bộ thay đổi **local (chưa commit)** theo yêu cầu user. Triển khai **inline, KHÔNG dùng PMO** (chỉ đạo user, ghi trong các TRI record).
> Triage records: `docs/intel/_intake/TRI-1787805644906-f706.json` (Khu tránh trú bão), `TRI-1787812046828-a57e.json` (Bến phao — C3).

## ⚠️ BÀI HỌC QUAN TRỌNG (đừng lặp lại)
**`BuoyStation` ≠ `BuoyBerth`**:
- `BuoyStation` (package `station/`, bảng `buoy_station`) = **Nhà trạm Phao, tiêu** — module CŨ, KHÔNG ĐƯỢC ĐỤNG
- `BuoyBerth` (package `port/`, bảng `buoy_berths`) = **Bến phao** — module MỚI tạo phiên này
- Đã 1 lần suýt nhầm (rework nhầm vào BuoyStation) → đã `git restore` + xóa migration nhầm (diff chỉ gồm edit của phiên, an toàn)

## 1. Module Bến phao (`BuoyBerth`) — ĐÃ HOÀN CHỈNH

### Backend (`/api/v1/buoy-berth`)
- Migration `V20260829040000__create_buoy_berths.sql` (bảng chính, không bảng con) + `V20260829050000__create_operating_units_and_seed_data.sql`
- `port/entity/BuoyBerth.java` + `BuoyBerthRepository` (search: code/name/portId/waterwayId/classification/provinceId/approvalStatus/operationalStatus/updated range)
- `port/dto/buoyberth/` (7 file), `BuoyBerthService` + `BuoyBerthApprovalService` (duyệt 2 cấp), `BuoyBerthController` (CRUD + approve/reject/history + attachments `BUOY_BERTH`)
- GIS: `GisSpatialObjectType.POLYGON_BUOY_BERTH(37, "Bến phao")` (mới thêm) + `InfrastructureType.BUOY_BERTH` (có sẵn) + case trong `GisSpatialObjectService`
- Permission: `buoyberth:*` (10 quyền) trong `PermissionSeeder.java`
- Mã tự sinh `{portCode}-BP-{seq}`

### Frontend
- 3 page mới `pages/buoy-berth/` (ListPage + Form + DetailContent) + `types/port.ts` + `portService.ts` (`buoyBerthCRUD`) + `App.tsx` (route `/buoy-berth`) + `AppLayout.tsx` (menu "Quản lý bến phao", icon `AimOutlined` — AnchorOutlined không tồn tại trong package icon đang cài)
- Form theo CSV: ĐVQL → Cảng biển → **Đơn vị khai thác** (sau ĐVQL theo user) → Luồng HH → Mã → Tên → Tỉnh/TP → Địa điểm chi tiết → Phân cấp công trình (Cấp đặc biệt/1/2/3/4 — user chốt) → Tình trạng → [Kỹ thuật & đăng kiểm] → [Công bố] → [Phạm vi khu nước — textarea kiểu Ghi chú, maxLength 2000]
- Validate pattern Khu chuyển tải: maxLength 20 + atMax cho 9 trường kỹ thuật/counts; Tên 255; Địa điểm chi tiết 500; công bố 2000×2; phạm vi 2000

## 2. Bảng `operating_units` — Đơn vị khai thác RIÊNG
- User yêu cầu: bảng Đơn vị khai thác riêng, **cấu trúc giống** bảng `operating_organizations` (Đơn vị vận hành), **import cùng dữ liệu** (526 đơn vị DM_DON_VI_VH_KT, **giữ nguyên id** để tương thích bản ghi cũ)
- Migration `V20260829050000`: `CREATE TABLE operating_units (id/code/parent_code/name)` + `INSERT ... SELECT ... FROM operating_organizations ON CONFLICT (code) DO NOTHING`
- Entity `OperatingUnit` + `OperatingUnitRepository` (common package)
- Endpoint mới `GET /api/common/options/operating-units` (CommonOptionsService.getOperatingUnitOptions + controller)
- `BuoyBerthService.resolveOperatingOrgName` đọc từ `OperatingUnitRepository` (KHÔNG còn orgUnitCache / operating_organizations)
- FE Form load options từ `/common/options/operating-units` (fallback `DEFAULT_OPERATING_ORGANIZATIONS` — dữ liệu giống nhau)
- ⚠️ **Lỗi đã sửa**: `CommonOptionsService` constructor viết tay — QUÊN thêm tham số `OperatingUnitRepository` → `this.x = x` tự gán → "might not have been initialized" → **mvn FAIL → IntelliJ báo lỗi dây chuyền** (`cannot find symbol OperatingOrganizationOptionResponse`, `package mapicon.service does not exist`). Đã thêm tham số → mvn PASS.

## 3. "Thuộc bến phao" — trỏ ĐÚNG vào Quản lý Bến phao
- **6 chỗ / 4 file** của Khu neo đậu + Khu tránh trú bão (Form + ListPage filter + detail): đổi nguồn từ `fetchBuoyStationList`/`/v1/buoy-station` (Nhà trạm Phao, tiêu) → **`buoyBerthCRUD.search`** (`/v1/buoy-berth`, `approvalStatus: 'APPROVED'`, label `buoyBerthName`)
- Files: `AnchorageForm.tsx`, `AnchorageListPage.tsx` (label map "Thuộc trạm phao tiêu" → "Thuộc bến phao"), `StormShelterForm.tsx`, `StormShelterListPage.tsx`

## 4. Tab "Kết cấu hạ tầng" (chi tiết Bến phao)
- Tách thành tab riêng (sau File, trước Vận hành & bảo trì); tên tab **"Kết cấu hạ tầng"** (user đổi — bỏ "thuộc bến phao")
- Load 2 loại KCHT: `Promise.all([anchorageCRUD.search({buoyStationId}), stormShelterCRUD.search({buoyStationId})])` → map `{id, infraName, infraType: 'ANCHORAGE'|'STORM_SHELTER'}`
- Bảng: **STT** (PagedTable tự render — KHÔNG thêm cột thủ công, tránh trùng) · **Loại KCHT** (pill: Khu neo đậu = xanh actionPrimary / Khu tránh trú bão = vàng statusAttention) · **Tên KCHT** (clickable) · **Thao tác** (👁 "Xem chi tiết")
- Filter "Chọn loại kết cấu hạ tầng" (allowClear) lọc 2 loại
- Tiêu đề "Danh sách kết cấu hạ tầng thuộc bến phao" + filter SÁT CẠNH (flex gap 12)
- Placeholder filter = "Chọn loại kết cấu hạ tầng" (user chốt)

## 5. Drawer chi tiết KCHT — chuẩn bến cảng
- `onViewInfraDetail` (prop) → **`AppDrawer size={950}`** (drawer con mở chồng — dùng px cố định, **KHÔNG dùng width %** vì nested drawer % bị co kích thước)
- Click Tên hoặc 👁 → fetch `anchorageCRUD.findById` / `stormShelterCRUD.findById` → render `AnchorageDetailContent` / `StormShelterDetailContent` trong drawer "Chi tiết kết cấu hạ tầng"
- ⚠️ **Lỗi đã sửa**: `onViewInfraDetail` thêm vào interface nhưng **quên destructure** trong component → TS "Cannot find name" ×2 → đã thêm vào destructuring

## 6. REVERT đã làm (theo yêu cầu user)
- **Yêu cầu bị revert**: "Chi tiết thông tin khu nước neo buộc tàu ... tab con chưa hoạt động giống như vậy hãy sửa" — ban đầu tôi tách "Thông tin khu nước neo buộc tàu" từ toggle → tab con riêng ở 3 module (TransferAreaDetailContent, AnchorageDetailContent, StormShelterDetailContent). **User yêu cầu revert** → đã khôi phục nguyên trạng: toggle trong tab 1 + state `waterAreaOpen` (3 file, đã build PASS, chunk TransferAreaListPage về đúng 112.00 kB như cũ)
- **KHÔNG revert** các fix khác: bảng operating_units, Thuộc bến phao, tab Kết cấu hạ tầng, drawer 950px, wrap text, '2026-02', validate

## 7. Các fix khác trong phiên
- **Bug `'2026-02'`**: `lastInspectionDate` DatePicker picker="month" gửi `YYYY-MM` nhưng BE `LocalDate` cần `YYYY-MM-DD` → fix FE format
- **Wrap text "Phạm vi khu nước neo buộc tàu"** (chi tiết): thêm `wordBreak: 'break-word'` (giữ `pre-wrap`)
- **Label**: "Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)", "Thời điểm đã đăng kiểm gần nhất"
- **Sản lượng hàng thông qua = bắt buộc** (user chốt qua question tool — lệch CSV, cần BA duyệt): FE rule + BE `@NotNull`
- **Khu tránh trú bão + Khu chuyển tải**: dấu phẩy "khu tránh, trú bão" toàn chuỗi hiển thị (57 chuỗi FE+BE); bỏ Ghi chú, DWT (khu tránh trú bão); thứ tự form ĐVQL/Cảng biển trước Mã/Tên; icon menu (khu tránh trú bão = SafetyOutlined, khu chuyển tải = ExportOutlined)

## 8. Verify (bằng chứng thực thi)
- BE: `mvn clean compile -q` → **exit 0, MVN_EXIT_0_OK** (nhiều lần)
- FE: `npm run build` → **exit 0** (chunk `BuoyBerthListPage-*.js` ~101 kB; `TransferAreaListPage` 112.00 kB sau revert)
- FE: `npx tsc --noEmit -p tsconfig.app.json` → exit 2 = **baseline pre-existing ~100 file** (không thuộc change); **0 lỗi thuộc change** (mọi per-file summary xác nhận; `1 transfer-area/TransferAreaDetailContent.tsx:10` = baseline cũ, `3 buoy-station/BuoyStationListPage.tsx:103` = lỗi cũ module không đụng)

## 9. Việc còn lại cho USER
1. **Restart backend** → Flyway tạo `buoy_berths` + `operating_units` (import 526 đơn vị tự động)
2. **Hard-refresh FE** (Ctrl+Shift+R) / deploy `frontend/dist` lên `10.0.229.20:30008`
3. **IntelliJ**: nếu còn báo đỏ → Maven → Reload All Projects (hoặc File → Invalidate Caches / Restart) — đọc class mới `OperatingUnit`/`OperatingUnitRepository`
4. Gán quyền `buoyberth:*` cho nhóm/tài khoản
5. **BA duyệt**: (a) Sản lượng hàng thông qua bắt buộc (lệch CSV); (b) danh mục Phân cấp công trình (Cấp đặc biệt/1/2/3/4)

## 10. Nợ kỹ thuật / lưu ý
- Bản ghi cũ lưu `buoyStationId` từ Nhà trạm Phao, tiêu → id không khớp danh mục Bến phao mới → chọn lại khi sửa
- Cột BE `mooring_water_area_scope` VARCHAR(1000) vs FE maxLength 2000 (convention transfer/storm); `public_decision` VARCHAR(500) vs FE 2000 — nhập >giới hạn DB sẽ lỗi (đang theo convention chung, chưa đổi)
- Cột `remarks`/`max_vessel_dwt` của buoy_berths vẫn tồn tại trong DB (parity) nhưng không hiển thị
- Memory đã lưu: `buoyberth-clone`, `buoystation-vs-buoyberth`, `clone-rename-count-fields`
