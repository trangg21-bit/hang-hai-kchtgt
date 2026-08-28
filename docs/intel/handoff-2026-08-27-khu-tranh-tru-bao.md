# HANDOFF — Phiên 2026-08-27: Khu tránh, trú bão (Storm Shelter Area)

> File bàn giao phiên clone module **Khu tránh, trú bão** theo CSV đặc tả. Toàn bộ thay đổi ở trạng thái **local (chưa commit)** theo yêu cầu user. Triage record: `docs/intel/_intake/TRI-1787805644906-f706.json` (C3) — theo chỉ đạo user: **triển khai inline, KHÔNG dùng PMO** (như phiên Khu chuyển tải).

## 1. Mục tiêu
Clone toàn bộ cấu trúc **Khu chuyển tải (TransferArea)** — DB + BE + FE (bộ lọc, danh sách, thêm mới, chỉnh sửa, chi tiết) — sang **Khu tránh, trú bão** theo CSV `docs/inputs/HH_Tính năng & danh sách các trường thông tin(Khu tránh, trú bão).csv`.

## 2. Backend (đã `mvn clean compile` PASS — exit 0)
**File mới:**
- Migrations: `V20260829000000__create_storm_shelter_areas.sql`, `V20260829010000__storm_shelter_gis_mooring.sql`, `V20260829020000__add_storm_shelter_anchor_point_audit_columns.sql`, `V20260829030000__convert_storm_shelter_mooring_audit_to_uuid.sql` (version 20260829 — sau transfer 20260828, tránh collision DB dùng chung)
- `port/entity/StormShelterArea.java` (+2 entity con mooring/anchor point), `port/repository/StormShelterAreaRepository.java` (+2 repo con), `port/dto/stormshelter/` (10 file), `port/service/StormShelterAreaService.java` + `StormShelterAreaApprovalService.java`, `port/controller/StormShelterAreaController.java` (`/api/v1/storm-shelter`)

**File sửa:**
- `config/PermissionSeeder.java` — block `stormshelter:*` (10 quyền: read, read:restricted, read:confidential, create, update, delete, approve, approvec1, approvec2, history)

**Điểm cần biết:**
- Mã tự sinh `{portCode}-TTB-{seq}` (khác transfer `-CT-`)
- Attachment EntityType `STORM_SHELTER` (folder `uploads/attachments/STORM_SHELTER/`)
- GIS: `GisSpatialObjectType.POLYGON_STORM_SHELTER(32)` + `InfrastructureType.STORM_SHELTER_AREA` — **đã tồn tại sẵn từ trước**, không cần sửa enum/service
- **KHÁC TransferArea**: THÊM `navigationChannelId`, `buoyStationId`, `classification` (3 trường + 3 filter mới trong search query); **BỎ** `operationalFunctions`, `activityStartDate`, `activityEndDate` (CSV không có)
- Lịch sử TẠM TẮT như Anchorage/Transfer (bảng change_logs/approval_logs đã bị V20260825162500 drop)

## 3. Frontend (worker FE đã làm, `npm run build` PASS — chunk `StormShelterListPage` trong bundle)
**File mới:** `pages/storm-shelter/StormShelterListPage.tsx`, `StormShelterForm.tsx`, `StormShelterDetailContent.tsx`
**File sửa:** `types/port.ts` (+StormShelterArea + Create/Update/Approval types), `services/portService.ts` (+stormShelterCRUD base `/v1/storm-shelter`, generateCode → `{stormShelterCode}`), `App.tsx` (route `/storm-shelter`, permission `stormshelter:read`), `AppLayout.tsx` (menu "Quản lý khu tránh trú bão" `/storm-shelter`, cạnh Khu chuyển tải/Khu neo đậu)

**⚠️ Lỗi đã sửa sau verify độc lập (FAIL → fix):** FE clone quên đổi tên 3 trường số lượng — `activeTransferCount`/`publishedTransferCount`/`underInvestmentTransferCount` (tên TransferArea) → BE dùng `activeStormShelterCount`/`publishedStormShelterCount`/`underInvestmentStormShelterCount`. Hậu quả nếu không sửa: Jackson bỏ qua âm thầm (fail-on-unknown-properties off) → 3 cột DB luôn NULL, "green-but-wrong". Đã rename đủ ở `types/port.ts` (3 interface StormShelter, dùng nearLine — interface TransferArea giữ nguyên), `StormShelterForm.tsx`, `StormShelterDetailContent.tsx`; build lại PASS (chunk hash đổi) + tsc 0 lỗi thuộc change.

**Cấu trúc chuẩn (giống transfer):** Form tab Thông tin chung (thứ tự CSV: Mã → Tên → ĐVQL → Cảng biển → Tỉnh/TP → Luồng HH → Bến phao → Phân loại → Địa điểm chi tiết → Tình trạng) + toggle kỹ thuật/công bố/khu nước; tab Vị trí + File. Chi tiết 5 tab.

## 4. Deviation so với cờ CSV (ghi nhận, như phiên trước)
1. **Xem chi tiết tab 1**: CSV để `Xem chi tiết=FALSE` cho toàn bộ trường tab 1/kỹ thuật/công bố — KHÔNG áp dụng, giữ cấu trúc detail 5 tab GIỐNG HỆT TransferArea (theo chỉ đạo "áp dụng cấu trúc giống hệt"), tránh tab detail trống.
2. **Phân loại (classification)**: CSV chỉ ghi `Select` không rõ nguồn. Hiện dùng hằng số `STORM_SHELTER_CLASSIFICATION_OPTIONS` (3 giá trị: cấp vùng / cấp tỉnh / khu neo tránh trú bão) định nghĩa trong `StormShelterForm.tsx` — **cần BA chốt danh mục chính thức** (chưa tìm thấy trong TKCT/hh.csdl).
3. Control `Input` thay `InputTextArea` cho Tên/Địa điểm chi tiết — chuẩn Anchorage (như phiên trước).

## 5. Verify
- BE: mvn clean compile (bundled IntelliJ Maven) → **exit 0 PASS**
- FE: `npm run build` (frontend) → **PASS**, chunk `StormShelterListPage-*.js` ~110KB
- `npx tsc --noEmit -p tsconfig.app.json` → baseline ĐỎ sẵn ~90 file pre-existing (không thuộc change); lỗi duy nhất thuộc change (`StormShelterDetailContent.tsx` import thừa `radiusMd`, mirror từ file nguồn) **đã xóa** — sau sửa, `storm-shelter/**` sạch 0 lỗi

## 6. Việc còn lại cho USER
1. **Khởi động lại backend** → Flyway áp 4 migration `V20260829*` (bắt buộc để tạo bảng; KHÔNG tự chạy backend theo quy định)
2. **Hard-refresh FE** (Ctrl+Shift+R)
3. Nếu mở FE từ `http://10.0.229.20:30008` → deploy `frontend/dist` lên server đó
4. Sau khi restart: cây phân quyền sẽ có nhóm quyền "Khu tránh trú bão" (tự seed từ PermissionSeeder) — gán quyền `stormshelter:*` cho nhóm/tài khoản cần dùng (đang tạm comment @PreAuthorize nên chưa chặn)
5. **Dữ liệu mẫu**: sau khi migration chạy, có thể insert dữ liệu mẫu trực tiếp vào DB dev để test (theo AGENTS.md — không dùng Java seeder)

## 7. Lưu ý / nợ kỹ thuật
- **Feedback UI (sau verify):** user yêu cầu thứ tự tab Thông tin chung KHỚP TransferAreaForm — Đơn vị quản lý + Thuộc cảng biển đứng TRƯỚC Mã + Tên (đã sửa, Row [ĐVQL|Cảng biển] lên đầu). Message validate chuẩn hóa: "<label> không được để trống" cho ĐVQL/Cảng biển/Tỉnh-TP/Tình trạng. Lưu ý: CSV ghi Mã trước nhưng user chốt theo chuẩn transfer area (ĐVQL trước vì select cảng phụ thuộc ĐVQL).
- **Bỏ trường Ghi chú (remarks)** khỏi UI storm-shelter theo user (CSV cờ F,F,F,F,F): đã xóa khỏi Form (type/edit-load/payload/Form.Item), DetailContent, ListPage (history maps), 3 interface StormShelter trong types/port.ts. **Cột remarks trong DB GIỮ NGUYÊN** (parity transfer area, migration đã chạy — muốn drop cột phải thêm migration mới).
- **Phân loại đã BA chốt**: STORM_SHELTER_CLASSIFICATION_OPTIONS = ['Tránh bão', 'Trú bão', 'Tránh, trú bão'] (user cung cấp; "Tránh báo" trong tin nhắn được hiểu là typo → "Tránh bão").
- `historyFieldValue` map tỉnh có giá trị rác — kế thừa từ Anchorage (history đang tạm tắt)
- Update optional FK (navigationChannelId/buoyStationId/classification): pattern `if != null` giống Anchorage — nếu FE gửi undefined sẽ không clear được giá trị cũ (hạn chế kế thừa, không phải regression mới)
- Memory đã lưu: `storm-shelter-clone`
