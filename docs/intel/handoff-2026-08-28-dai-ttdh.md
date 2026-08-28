# HANDOFF — Phiên 2026-08-28: Đài TTDH (DaiTtdh) — Tạo mới theo cấu trúc 3 module mẫu

> File bàn giao TOÀN BỘ phiên làm việc Đài TTDH (2026-08-28). Toàn bộ thay đổi **local (chưa commit)** theo yêu cầu user. Triển khai **inline, KHÔNG dùng PMO** (chỉ đạo user, ghi trong TRI record).
> Triage record: `docs/intel/_intake/TRI-1787880714256-dcd3.json` (C3, full_pipeline — user override inline như Khu chuyển tải).

## ⚠️ BÀI HỌC QUAN TRỌNG (đừng lặp lại)
**`CoastalStation*` (station package) ≠ `DaiTtdh` (port package)**:
- `CoastalStationVTS`/`CoastalStationList`/`COASTAL_RADIO_STATION` (package `station/`, route `/station/coastal`) = **tính năng CŨ (Trạm bờ / Đài duyên hải VTS) — KHÔNG ĐƯỢC ĐỤNG**
- `DaiTtdh` (package `port/`, bảng `dai_ttdh`, route `/dai-ttdh`) = **Đài TTDH — module MỚI tạo phiên này** (user chỉ đạo tạo mới hoàn toàn, không dùng lại resource/permission cũ)
- User chốt: "COASTAL_RADIO_STATION và CoastalStationList là của tính năng khác — hãy tạo mới cho tính năng đài TTDH"

## 1. Module Đài TTDH (`DaiTtdh`) — ĐÃ HOÀN CHỈNH

### Backend (`/api/v1/dai-ttdh`)
- Migration `V20260829060000__create_dai_ttdh.sql` (bảng `dai_ttdh` — KHÔNG bảng con, không có khu nước neo buộc tàu)
- `port/entity/DaiTtdh.java` (+ @Filter orgUnitFilter + recordSecurityLevelFilter, @FieldNameConstants)
- `DaiTtdhRepository` (search: search/code/name/stationLevel/provinceId/operationalStatus/approvalStatus/updated range, unaccent; `findMaxDaiTtdhSeq` cho mã DTTDH-{seq})
- `port/dto/daittdh/` (6 file: Create/Update/Response + Approve/Reject/Attachment)
- `DaiTtdhService` + `DaiTtdhApprovalService` (duyệt 2 cấp CANG_VU → CUC), `DaiTtdhController` (CRUD + approve/reject/history + attachments `DAI_TTDH`)
- GIS: `GisSpatialObjectType.POINT_DAI_TTDH(15, "Đài TTDH")` (mới) + `InfrastructureType.DAI_TTDH` (mới) + case trong `GisSpatialObjectService`
- Permission: `daittdh:*` (10 quyền: read/read:restricted/read:confidential/create/update/delete/approve/approvec1/approvec2/history) trong `PermissionSeeder.java` (block 8.2.4b)
- Mã tự sinh `DTTDH-{seq}` — **KHÔNG có prefix cảng biển** (CSV Đài TTDH không có trường cảng biển — khác Khu chuyển tải `{portCode}-CT-{seq}` / Bến phao `-BP-`)

### Frontend
- 3 page mới `pages/dai-ttdh/` (ListPage + Form + DetailContent) + `types/port.ts` + `portService.ts` (`daiTtdhCRUD`) + `App.tsx` (route `/dai-ttdh`) + `AppLayout.tsx` (menu "Quản lý đài TTDH") + `usePermissions.ts` (`daittdh: 'Quản lý Đài TTDH'`)
- Form theo CSV: ĐVQL → ĐV khai thác → **Mã đài (disabled tự sinh)** → Tên đài → **Phân loại đài** (Đài thông tin duyên hải loại I–V, stationLevel 0-4) → Tỉnh/TP → Địa điểm chi tiết → Tình trạng → **Vùng phủ sóng (1/2 dòng) + Dịch vụ cung cấp (1/2 dòng, cùng 1 Row sau địa điểm chi tiết)** → Ghi chú
- **Mã tự sinh DTTDH-{seq} ngay khi mở form tạo mới**: gọi `daiTtdhCRUD.generateCode()` trong `afterOpenChange` của create drawer (ListPage) SAU `resetFields()` — tránh bị resetFields xóa (lỗi đã gặp khi để trong useEffect của Form); Tình trạng mặc định `NOT_YET_OPERATIONAL` ("Chưa khai thác") set cùng lúc trong afterOpenChange
- **Dịch vụ cung cấp — 9 dịch vụ CHÍNH THỨC (user chốt 2026-08-28)**: INMARSAT_DISTRESS (Dịch vụ trực canh cấp cứu INMARSAT) · COSPAS_SARSAT_DISTRESS · DSC_DISTRESS · RTP_DISTRESS · MSI_RTP (phát MSI RTP) · MSI_NAVTEX (phát MSI NAVTEX) · MSI_EGC (phát MSI EGC) · LRIT (nhận dạng & truy theo tầm xa) · MARITIME_INFO_CONNECT (kết nối thông tin ngành hàng hải) — lưu VARCHAR nối dấu phẩy, map text khi hiển thị
- Tab GIS: Loại đối tượng / Biểu tượng / Hệ quy chiếu / Quy tắc hiển thị / Tọa độ (LongLatTable DMS, giống 3 module mẫu)
- Tab File đính kèm: upload nhiều file (PDF/DOC/XLS/JPG/PNG/TIFF, ≤10 file, ≤20MB) — giống hệt 3 module mẫu
- Validate pattern 3 module mẫu: Tên 255, Địa điểm chi tiết 500, Vùng phủ sóng/Ghi chú 2000
- Đơn vị khai thác: options từ `GET /api/common/options/operating-units` (fallback `DEFAULT_OPERATING_ORGANIZATIONS`) — giống Bến phao

## 2. Khác biệt so với 3 module mẫu (theo CSV Đài TTDH)
| Điểm | Khu chuyển tải / Bến phao | Đài TTDH |
|---|---|---|
| Mã tự sinh | `{portCode}-CT-{seq}` / `{portCode}-BP-{seq}` | `DTTDH-{seq}` (không cảng biển) |
| Thuộc cảng biển | Có (portId) | **KHÔNG có** (bỏ portId/waterway) |
| Bảng con | Có (khu nước neo buộc tàu + điểm neo) | **KHÔNG có** |
| Trường đặc thù | Kỹ thuật/công bố/hoạt động | **Vùng phủ sóng + Dịch vụ cung cấp (multi) + Phân loại đài (Loại I-V)** |
| Đơn vị khai thác | operating_org_id (BuoyBerth) | operating_unit_id (OperatingUnit) |

## 3. Điểm cần user xác nhận
- **Phân loại đài**: CSV ghi SelectAppParams, tôi chốt dropdown cố định "Loại I → Loại V" (stationLevel SMALLINT 0-4) theo F-092 — nếu có bảng AppParams riêng thì đổi nguồn options.
- **Dịch vụ cung cấp**: 9 dịch vụ cố định tôi tự đặt tên (theo F-092 "9 dịch vụ cố định") — cần BA chốt danh sách chính xác.
- **Sửa (Edit)**: CSV Đài TTDH đánh dấu cột Sửa = FALSE cho toàn bộ TAB 1 (banner F-092/F-096 ghi rõ "Sửa = false toàn bộ trường"). Form Sửa tôi vẫn cho sửa các trường TAB 1 (giống 3 module mẫu theo chỉ đạo "giống hệt") — **nếu user muốn khóa TAB 1 khi sửa (chỉ GIS + file được sửa) thì báo, đổi 1 chỗ trong Form**.

## 4. Verify (đã chạy, kết quả trong phiên)
- BE: `"C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean compile -q` → exit 0
- FE: `npx tsc --noEmit -p tsconfig.app.json` → exit 0; `npm run build` → exit 0 (chunk mới `DaiTtdhListPage-B_DxzNb9.js`)
- Verify subagent riêng: bổ sung sau khi hoàn tất
- Lưu ý: biome lint còn warnings (a11y/key/any) — GIỐNG HỆT các file mẫu BuoyBerth/TransferArea (pre-existing pattern), không chặn build

## 5. Chưa làm (chờ user)
- Chưa insert dữ liệu mẫu vào bảng `dai_ttdh` (user có thể yêu cầu khi cần test — theo thói quen "tự động chèn dữ liệu mẫu" của dự án)
- Chưa migrate DB thật (migration đã tạo file, khi chạy app Flyway sẽ tự áp dụng)
