# HANDOFF — Phiên 2026-08-27: Khu chuyển tải + đồng bộ Khu neo đậu

> File bàn giao toàn bộ phiên làm việc. Mọi thay đổi đều ở trạng thái **local (chưa commit)** theo yêu cầu user.

## 1. Mục tiêu phiên
1. **Khu chuyển tải (Transfer Area)** — clone toàn bộ cấu trúc Khu neo đậu (DB + BE + FE: bộ lọc, danh sách, thêm mới, chỉnh sửa, chi tiết) theo CSV đặc tả 58 trường.
2. **Khu neo đậu** — tái cấu trúc tab/toggle + ẩn 2 cột nội dung phê duyệt cho đồng bộ với Khu chuyển tải.
3. Chỉ đạo user: **tự triển khai inline, KHÔNG dùng PMO** (bỏ qua directive dispatch của intake_triage — ghi nhận trong mỗi TRI record).

## 2. Backend — Khu chuyển tải (đã `mvn clean compile` PASS)
**File mới:**
- Migrations: `V20260828000000__create_transfer_areas.sql`, `V20260828010000__transfer_area_gis_mooring.sql`, `V20260828020000__add_transfer_area_anchor_point_audit_columns.sql`, `V20260828030000__convert_transfer_area_mooring_audit_to_uuid.sql`
- `port/entity/TransferArea.java` (+2 entity con mooring/anchor point), `port/repository/TransferAreaRepository.java` (+2 repo con), `port/dto/transferarea/` (11 file), `port/service/TransferAreaService.java` + `TransferAreaApprovalService.java`, `port/controller/TransferAreaController.java` (`/api/v1/transfer-area`)

**File sửa:**
- `config/PermissionSeeder.java` — block `transferarea:*` (10 quyền)
- `gis/spatial/entity/GisSpatialObjectType.java` — `POLYGON_TRANSSHIPMENT(36)`
- `gis/spatial/service/GisSpatialObjectService.java` — case `TRANSSHIPMENT_AREA`

**Điểm cần biết:**
- Mã tự sinh `{portCode}-CT-{seq}`; attachment EntityType `TRANSFER_AREA`; GIS `TRANSSHIPMENT_AREA`
- Lịch sử TẠM TẮT (bảng change_logs/approval_logs bị `V20260825162500` drop) — giống Anchorage
- Triển khai inline theo chỉ đạo user; triage records: `TRI-1787792881776-6edd`, `TRI-1787796293024-0ede`, `TRI-1787796842441-2400`, `TRI-1787801036154-f55f`, `TRI-1787801518186-962a`

## 3. Frontend
**Khu chuyển tải:** `types/port.ts`, `services/portService.ts` (transferAreaCRUD), `App.tsx` (route `/transfer-area`), `AppLayout.tsx` (menu "Quản lý khu chuyển tải"), `pages/transfer-area/` (ListPage, Form, DetailContent)
**Khu neo đậu:** `pages/anchorage/AnchorageForm.tsx`, `AnchorageDetailContent.tsx` (tái cấu trúc tab/toggle), `AnchorageListPage.tsx` (ẩn 2 cột nội dung phê duyệt, nhãn "Địa điểm (Tỉnh/Thành phố)")

**Cấu trúc chuẩn cả 2 module:**
- Form: tab Thông tin chung (field chính trực tiếp) + toggle ▼ Thông tin kỹ thuật / ▼ Thông tin công bố mở, đưa vào sử dụng / ▼ Thông tin khu nước neo buộc tàu; tab Thông tin vị trí + File đính kèm
- Chi tiết: 5 tab — 1 Thông tin chung (3 toggle) · 2 Vị trí · 3 File · 4 **Vận hành & bảo trì** (▼ Thông tin vận hành khai thác→"Danh sách vận hành khai thác", ▼ Thông tin bảo trì→"Danh sách thông tin bảo trì", ▼ Thông tin sự cố→"Danh sách thông tin sự cố") · 5 **Xử lý & theo dõi** (Trạng thái dòng đầu full-width)
- Bảng rỗng khu nước: PagedTable + emptyText 📄 "Chưa có dữ liệu"
- Multi-select Công năng: `maxTagCount={2}` + `+N` + pill — **CSS dùng class antd v6** `.ant-select-content` (v5 là `.ant-select-selection-overflow` — KHÔNG tồn tại trong v6!)

## 4. Verify
- BE: `"C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean compile -q` → **MVN_PASS** (mvn KHÔNG trên PATH — dùng bản bundled IntelliJ)
- FE: `npm run build` (frontend) → **VITE_PASS** (nhiều lần, lần cuối 2.76s)
- `npx tsc --noEmit -p tsconfig.app.json` → **baseline ĐỎ sẵn ~70 file pre-existing** (không thuộc thay đổi; biome lint warnings cũng là pattern có sẵn)

## 5. Việc còn lại cho USER
1. **Khởi động lại backend** → Flyway áp `V20260828020000` (thêm 4 cột audit điểm neo) + `V20260828030000` (convert audit bảng cha sang UUID) — bắt buộc để hết lỗi lưu tạm + ClassCastException
2. **Hard-refresh FE** (Ctrl+Shift+R)
3. Nếu mở FE từ `http://10.0.229.20:30008` → cần deploy `frontend/dist` lên server đó

## 6. Vấn đề đã xử lý trong phiên
- Migration trùng version `V20260826160000` (scada vs drop constraints) → rename → `V20260826160001`
- **Dev DB dùng chung 10.0.229.20**: luồng song song khác chiếm version `27100000/27110000` ("transmission table", "restore security level") → migration Khu chuyển tải đổi sang `V2026082800xxxx`; **bảng `public.transmission` tồn tại (luồng khác — không đụng)**
- Lỗi lưu tạm `column created_by does not exist` (bảng điểm neo thiếu audit) → `V20260828020000`
- Lỗi `ClassCastException String→UUID` (bảng cha audit VARCHAR) → `V20260828030000`
- Runtime `actionPrimary is not defined` (AnchorageForm thiếu import token) → đã thêm
- Multi-select công năng vỡ giao diện → CSS đúng class antd v6 `.ant-select-content`

## 7. Lưu ý / nợ kỹ thuật
- `historyFieldValue` map tỉnh có giá trị rác (`58:'Perth'`...) — kế thừa từ Anchorage (nên thay bằng `VIETNAM_PROVINCES` khi có dịp; history đang tạm tắt)
- Tài liệu: CSV đặc tả đã lưu `docs/inputs/HH_Tính năng & danh sách các trường thông tin(Khu chuyển tải).csv`; plan intel `docs/intel/transfer-area-module-plan.md`
- Memory đã lưu: transfer-area-clone, shared-dev-db-migration-version-collision, baseentity-audit-columns-must-be-uuid, fe-verify-tsc-baseline-transfer-area
- 2 deviation nhỏ so với cờ CSV (bộ lọc Tỉnh/TP hiện diện dù CSV Filter=FALSE; control Input thay InputTextArea cho Tên/Địa điểm chi tiết — chuẩn Anchorage)
