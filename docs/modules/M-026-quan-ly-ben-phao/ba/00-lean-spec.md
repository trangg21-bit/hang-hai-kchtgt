---
id: M-026
name: "Quản lý Bến phao"
slug: quan-ly-ben-phao
module-id: M-026
status: proposed
classification: local
priority: medium
created: 2026-08-28
last-updated: 2026-08-28
locked-fields: []
consumed_by_modules: []
---

# Lean Spec — Module M-026 "Quản lý Bến phao" (BuoyBerth)

**Phạm vi tài liệu:** Đặc tả nghiệp vụ nền (single source of truth) cho toàn bộ module M-026. Các feature-brief F-318..F-323 chỉ ghi phần RIÊNG, tham chiếu tài liệu này cho phần CHUNG.
**Nguồn yêu cầu gốc (TKCT):** `docs/inputs/HH_Tính năng & danh sách các trường thông tin(QL bến phao).csv` + sheet **"QL bến phao"** trong `HH_Tính năng & danh sách các trường thông tin.xlsx` (Excel là SOURCE OF TRUTH cho thứ tự form: Mã #1, Tên #2 đứng đầu; nhãn "Thời điểm **đã** đăng kiểm gần nhất").
**Tài liệu chung bắt buộc đọc trước:** `docs/feature-brief-template.md` (khuôn 7 mục), `docs/conventions/approval-2-level-spec.md` (phê duyệt 2 cấp C1→C2), `docs/conventions/infrastructure-feature-standard-architecture.md` (kiến trúc KCHT chuẩn), `docs/conventions/form-and-list-patterns.md`, `docs/conventions/list-screen-ui-standard.md`, `frontend/src/theme.ts`, `frontend/src/tokens.ts`.

> **⚠️ CẢNH BÁO ĐỊNH DANH:** **BuoyBerth (Bến phao)** ≠ **BuoyStation (Nhà trạm Phao, tiêu)**. BuoyStation là module cũ (package `station/`, bảng `buoy_station`) — tài liệu và code của M-026 KHÔNG được đọc/ghi vào BuoyStation.

---

## 1. Mô tả ngắn

Bến phao (buoy berth) là Kết cấu hạ tầng hàng hải (KCHTGT) thuộc cảng biển: một cụm phao neo trong khu nước để tàu neo buộc, xếp dỡ hàng. Module M-026 quản lý hồ sơ bến phao theo đúng mẫu chung KCHT: danh sách + bộ lọc, tạo mới, cập nhật, xóa mềm, phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục), xem chi tiết (drawer 7 tab: Thông tin chung, GIS, File đính kèm, Kết cấu hạ tầng, Vận hành & bảo trì, Xử lý & theo dõi, Phê duyệt/Lịch sử), và lịch sử.

**Đối tượng dùng:** Cán bộ Cảng vụ/Chi cục nhập hồ sơ; lãnh đạo Cảng vụ/Chi cục duyệt vòng 1 (C1); lãnh đạo Cục duyệt vòng 2 (C2); Admin Cục xem toàn bộ + metadata; cán bộ vận hành khai thác xem dữ liệu đã duyệt.

**Điểm đặc thù so với mẫu chung:** mã tự sinh `{portCode}-BP-{seq:03d}`; GIS dạng **vùng** `POLYGON_BUOY_BERTH(37)`; bảng danh mục riêng `operating_units` (Đơn vị khai thác, 526 đơn vị import từ `DM_DON_VI_VH_KT`, giữ nguyên id); phân cấp công trình là chuỗi tự do (Cấp đặc biệt/1/2/3/4), không phải catalog enum.

## 2. Actors & Use Cases

| Actor | Mô tả | Quyền liên quan |
|---|---|---|
| Cán bộ nhập liệu (Cảng vụ/Chi cục, cấp huyện/tỉnh) | Tạo, sửa, gửi duyệt, xóa hồ sơ DRAFT | `buoyberth:create/update/delete/submit` (qua `update`+saveAction) |
| Lãnh đạo Cảng vụ/Chi cục | Duyệt/từ chối vòng 1 (C1) | `buoyberth:approve`, `buoyberth:approvec1` |
| Lãnh đạo Cục | Duyệt/từ chối vòng 2 (C2) | `buoyberth:approve`, `buoyberth:approvec2` |
| Cán bộ xem (mọi cấp trong DataScope) | Xem danh sách, chi tiết, lịch sử | `buoyberth:read`, `buoyberth:history` |
| Admin Cục | Full quyền + xem metadata (người tạo, người sửa, thời gian) | `buoyberth:*` + `orgunit:scope_all` |

**Use Cases:**
- UC-01 Tạo mới hồ sơ bến phao (Lưu tạm / Lưu và gửi duyệt) — F-318
- UC-02 Sinh mã tự động `{portCode}-BP-{seq:03d}` — F-318
- UC-03 Cập nhật hồ sơ (DRAFT, REJECTED_*, APPROVED qua "Lưu và phê duyệt") — F-319
- UC-04 Xóa mềm hồ sơ DRAFT — F-320
- UC-05 Gửi duyệt (submit) — F-318/F-321
- UC-06 Duyệt C1 (Cảng vụ/Chi cục) — F-321
- UC-07 Duyệt C2 (Cục) — F-321
- UC-08 Từ chối C1/C2 (bắt buộc lý do ≥ 10 ký tự) — F-321
- UC-09 Tìm kiếm/lọc danh sách + xem chi tiết drawer — F-322
- UC-10 Xem lịch sử thay đổi & phê duyệt — F-323
- UC-11 Tải lên/tải về/xóa file đính kèm — F-318/F-322

## 3. Domain Model

**Entity chính: `BuoyBerth`** — bảng `buoy_berths`, package `port/`, kế thừa `BaseEntity` (audit: createdBy/updatedBy/createdAt/updatedAt/deletedAt/deletedBy; `@FieldNameConstants`; `@Filter(orgUnitFilter)` + `@Filter(recordSecurityLevelFilter)`).

**Quan hệ:**
| Entity | Quan hệ | Ghi chú |
|---|---|---|
| `Port` (Cảng biển, M-002) | N:1 — `portId` NOT NULL | Chỉ được tạo khi port `APPROVED`; `orgUnitId` của bến phao lấy từ `port.orgUnitId` |
| Luồng hàng hải (M-003) | N:1 — `waterwayId` nullable | Dropdown `/options` chỉ trả bản ghi APPROVED |
| `OperatingUnit` (Đơn vị khai thác) | N:1 — `operatingOrgId` nullable | Bảng riêng `operating_units` (migration V20260829050000), 526 đơn vị import từ `DM_DON_VI_VH_KT` |
| OrgUnit (Đơn vị quản lý) | N:1 — `orgUnitId` | Gán tự động từ cảng biển cha; DataScope |
| `GisSpatialObject` | 1:1 — `spatialId` | `GisSpatialObjectType.POLYGON_BUOY_BERTH(37, "Bến phao")`, prefix tên `BUOY_BERTH_{code}`, `InfrastructureType.BUOY_BERTH` |
| `Attachment` | 1:N — refType `BUOY_BERTH` | File ≤ 10MB: PDF/DOCX/XLSX/PNG/JPG/CAD |

**Enum (lưu INT, `@Enumerated(EnumType.ORDINAL)`, không lưu chuỗi):**
- `approvalStatus` → `ApprovalStatus` (7 trạng thái chuẩn, mục 5)
- `operationalStatus` → `OperationalStatus`: OPERATIONAL (Đang khai thác/vận hành), NOT_YET_OPERATIONAL (Chưa khai thác/vận hành), SUSPENDED (Dừng khai thác/vận hành)
- `securityLevel` → `RecordSecurityLevel` (NORMAL/RESTRICTED/CONFIDENTIAL, SMALLINT mặc định 0)

**Trường chuỗi tự do (KHÔNG enum):** `classification` VARCHAR(100) — "Phân cấp công trình" = Cấp đặc biệt/1/2/3/4 (user chốt 2026-08-27; code lưu String, không catalog enum).

## 4. Ma trận trường dữ liệu nghiệp vụ (List / Filter / Detail / Create / Edit)

Thứ tự trình bày = **thứ tự Excel sheet "QL bến phao"** (SOURCE OF TRUTH cho form). Cờ List/Filter/Detail/Create/Edit = CSV `docs/inputs/HH_...(QL bến phao).csv`. **Điểm đã chốt (a):** `cargoThroughput` (Sản lượng hàng thông qua) = **BẮT BUỘC** (code `@NotNull` + FE required; CSV không đánh dấu — user xác nhận bắt buộc) → đánh "Có" trong ma trận.

| # Excel | Trường (nhãn hiển thị, tiếng Việt có dấu) | Tên code/DB (English) | Bắt buộc | Kiểu / ràng buộc | List | Filter | Detail | Create | Edit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|
| **TAB 1 — Thông tin chung** | | | | | | | | | | |
| 1 | Mã bến phao | `buoyBerthCode` | Có (tự sinh) | Input disabled, tự sinh `{portCode}-BP-{seq:03d}` | ✅ | ✅ | ✅ | ✅ | ✅ | Bất biến sau tạo; unique |
| 2 | Tên bến phao (bắt buộc) | `buoyBerthName` | **Có** | TextArea, max 255 | ✅ | ✅ | ✅ | ✅ | ✅ | `@NotBlank` |
| 3 | Đơn vị quản lý (bắt buộc) | `orgUnitId` | **Có** | OrgUnitTreeSelect | ✅ | ✅ | ✅ | ✅ | ✅ | FE required; BE tự gán từ `port.orgUnitId` (drift c.3) |
| 4 | Thuộc cảng biển (bắt buộc khi tạo) | `portId` | **Có** | Select KCHT (CB) `/options` | ✅ | ✅ | ✅ | ✅ | ✅ | `@NotNull`; cascading theo orgUnit |
| 5 | Thuộc luồng hàng hải | `waterwayId` | Không | Select KCHT (LHH) `/options` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 6 | Địa điểm (Tỉnh/TP) (bắt buộc) | `provinceId` | **Có** | Select Tỉnh/TP, tìm tiếng Việt không dấu | ✅ | ✅ | ✅ | ✅ | ✅ | `@NotNull` |
| 7 | Địa điểm chi tiết | `detailedLocation` | Không | TextArea, max 500 | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 8 | Phân cấp công trình | `classification` | Không | Select Cấp đặc biệt/1/2/3/4, VARCHAR(100) | ✅ | ✅ | ✅ | ✅ | ✅ | KHÔNG enum (chốt b) |
| 9 | Tình trạng (bắt buộc) | `operationalStatus` | **Có** | Select: Đang/Chưa/Dừng khai thác | ✅ | ✅ | ✅ | ✅ | ✅ | FE default NOT_YET_OPERATIONAL; `@NotNull` |
| **Thông tin kỹ thuật & đăng kiểm** | | | | | | | | | | |
| 10 | Đơn vị khai thác (bắt buộc) | `operatingOrgId` | **Có** (CSV) | Select `/common/options/operating-units` | ❌ | ❌ | ✅ | ✅ | ✅ | FE required; BE thiếu `@NotNull` (drift c.4) |
| 11 | Độ sâu khu nước hiện tại (m) | `currentWaterDepth` | Không | InputNumber ≥ 0, NUMERIC(10,2) | ❌ | ❌ | ✅ | ✅ | ✅ | Nhãn FE: "…(theo TBHH gần nhất) (m)" |
| 12 | Cao độ đáy bến thiết kế | `bottomElevationDesign` | Không | InputNumber, NUMERIC(10,2) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 13 | Cỡ tàu khai thác theo công bố (DWT) | `maxVesselDWT` | Không | InputNumber ≥ 0, NUMERIC(15,2) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 14 | Cỡ tàu khai thác theo quy hoạch | `plannedVesselDWT` | Không | InputNumber ≥ 0, NUMERIC(15,2) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 15 | Thời điểm đã đăng kiểm gần nhất | `lastInspectionDate` | Không | DatePicker (tháng/năm) → DATE | ❌ | ❌ | ✅ | ✅ | ✅ | Nhãn chuẩn có chữ "đã" (Excel) |
| 16 | Thời điểm đăng kiểm tiếp theo | `nextInspectionDate` | Không | DatePicker → DATE | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 17 | Thời hạn khai thác | `operationExpiryDate` | Không | DatePicker → DATE | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 18 | Năng lực thông qua thiết kế | `designCapacity` | Không | InputDecimal, NUMERIC(15,2) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 19 | Số lượng bến phao đang khai thác | `activeBuoyBerthCount` | Không | InputDecimal (INTEGER) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 20 | Số lượng bến phao đã công bố | `publishedBuoyBerthCount` | Không | InputDecimal (INTEGER) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 21 | Số lượng bến phao đang được thỏa thuận đầu tư XD | `underInvestmentBuoyBerthCount` | Không | InputDecimal (INTEGER) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 22 | **Sản lượng hàng thông qua** | `cargoThroughput` | **Có** (chốt a) | InputDecimal ≥ 0, NUMERIC(15,2) | ❌ | ❌ | ✅ | ✅ | ✅ | Code `@NotNull` + FE required; CSV không đánh dấu |
| **Thông tin công bố mở, đưa vào sử dụng** | | | | | | | | | | |
| 23 | Thời điểm công bố mở, đưa vào sử dụng | `openingAnnouncementDate` | Không | DatePicker → TIMESTAMP | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 24 | Quyết định công bố / VB cho phép khai thác | `publicDecision` | Không | TextArea, FE max 2000, DB VARCHAR(500) | ❌ | ❌ | ✅ | ✅ | ✅ | drift c.2 |
| 25 | Văn bản thỏa thuận đầu tư xây dựng | `investmentAgreement` | Không | TextArea, FE max 2000, DB TEXT | ❌ | ❌ | ✅ | ✅ | ✅ | |
| **Thông tin phạm vi khu nước neo buộc tàu** | | | | | | | | | | |
| 26 | Phạm vi khu nước neo buộc tàu | `mooringWaterAreaScope` | Không | TextArea (kiểu Ghi chú), FE max 2000, DB VARCHAR(1000) | ❌ | ❌ | ✅ | ✅ | ✅ | drift c.1 |
| **TAB 2 — Vị trí (GIS)** | | | | | | | | | | |
| 27 | Loại đối tượng | `geometryType` | Không | Select Điểm/Đường/Vùng (GIS) | ❌ | ❌ | ✅ | ✅ | ✅ | KCHT bến phao lưu POLYGON (37) |
| 28 | Biểu tượng | `mapSymbolId` | Không | Select SymbolList | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 29 | Hệ quy chiếu | `coordinateSystem` | Không | Text (WGS 84 / VN-2000) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 30 | Quy tắc hiển thị | `displayRule` | Không | Text (DMS…) | ❌ | ❌ | ✅ | ✅ | ✅ | |
| 31 | Tọa độ GIS | `coordinates` (+`latitude/longitude`) | Không | LocationInformationForm / Compact DMS + Map Picker | ❌ | ❌ | ✅ | ✅ | ✅ | `gis_spatial_objects` tập trung |
| **TAB 3 — File đính kèm** | | | | | | | | | | |
| 32 | File đính kèm | `Attachment` (refType BUOY_BERTH) | Không | UploadFileTable, ≤ 10MB, PDF/DOCX/XLSX/PNG/JPG/CAD | ❌ | ❌ | ✅ | ✅ | ✅ | |
| **TAB 4 — Kết cấu hạ tầng thuộc bến phao** | | | | | | | | | | |
| 33 | Tên kết cạu hạ tầng | (KCHT con: anchorage/storm-shelter) | Không | Text (read-only) | ❌ | ❌ | ✅ | ❌ | ❌ | Load Khu neo đậu + Khu tránh, trú bão có `buoyStationId`… (xem drift c.5) |
| 34 | Loại kết cấu hạ tầng | `infraType` | Không | Dropdown bộ lọc (ANCHORAGE/STORM_SHELTER) | ❌ | ❌ | ✅ | ❌ | ❌ | |
| **TAB 5 — Vận hành & bảo trì** | | | | | | | | | | |
| 35–38 | Thông tin vận hành khai thác (Mã kế hoạch, Tên, Ngày bắt đầu, Ngày kết thúc) | (kế hoạch vận hành) | Không | Text (read-only) | ❌ | ❌ | ✅ | ❌ | ❌ | |
| 39–42 | Thông tin bảo trì (Mã, Tên, Thời gian bắt đầu, kết thúc) | (kế hoạch bảo trì) | Không | Text (read-only) | ❌ | ❌ | ✅ | ❌ | ❌ | |
| 43–46 | Thông tin sự cố (Mã, Loại, Địa điểm, Thời gian) | (sự cố) | Không | Text (read-only) | ❌ | ❌ | ✅ | ❌ | ❌ | |
| **TAB 6 — Xử lý & theo dõi** | | | | | | | | | | |
| 47 | Trạng thái | `approvalStatus` | — | Badge read-only | ✅ | ✅ | ✅ | ❌ | ❌ | 7 trạng thái chuẩn; nguồn nhãn duy nhất `ApprovalStatusBadge` |
| 48 | Ngày cập nhật | `updatedAt` | — | Text read-only | ✅ | ✅ | ✅ | ❌ | ❌ | RangePicker DD/MM/YYYY |
| 49 | Cán bộ cập nhật | `updatedBy` (fullName) | — | Text read-only | ✅ | ❌ | ✅ | ❌ | ❌ | Hiển thị Họ và tên, không UUID |
| 50 | Ngày gửi phê duyệt | `submittedForApprovalAt` | — | Text read-only | ✅ | ❌ | ✅ | ❌ | ❌ | |
| 51 | Cán bộ gửi phê duyệt | `submittedForApprovalBy` | — | Text read-only | ✅ | ❌ | ✅ | ❌ | ❌ | |
| 52 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `portAuthorityApprovedAt` | — | Text read-only | ✅ | ❌ | ✅ | ❌ | ❌ | C1 |
| 53 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `portAuthorityApprovedBy` | — | Text read-only | ✅ | ❌ | ✅ | ❌ | ❌ | C1 |
| 54 | Nội dung phê duyệt | `portAuthorityApprovalContent` | — | Text read-only | ❌ | ❌ | ✅ | ❌ | ❌ | C1, max 1000 |
| 55 | Ngày phê duyệt cấp Cục | `departmentApprovedAt` | — | Text read-only | ✅ | ❌ | ✅ | ❌ | ❌ | C2 |
| 56 | Cán bộ phê duyệt cấp Cục | `departmentApprovedBy` | — | Text read-only | ✅ | ❌ | ✅ | ❌ | ❌ | C2 |
| 57 | Nội dung phê duyệt | `departmentApprovalContent` | — | Text read-only | ❌ | ❌ | ✅ | ❌ | ❌ | C2, max 1000 |

**Bộ lọc danh sách (Filter=TRUE):** `orgUnitId` (OrgUnitTreeSelect cây, giữ value orgUnitId) · `search` (Mã+Tên, không dấu) · `buoyBerthCode` · `buoyBerthName` · `portId` · `waterwayId` · `classification` · `provinceId` · `operationalStatus` · `approvalStatus` (StatusTabs) · `updatedFrom/updatedTo` (RangePicker). Cấu hình `FilterTableLayout` với `hideFilterToggle={true}`, sidebar cuộn 280px, đáy chỉ 2 nút **Reload + Tìm kiếm**.

## 5. Trạng thái và phê duyệt (2 cấp)

**Phần phê duyệt: theo `docs/conventions/approval-2-level-spec.md` (mục 3).** Tập đóng 7 trạng thái, lưu INT (ORDINAL):

| # | Trạng thái nghiệp vụ | `ApprovalStatus` (ordinal) | Ghi chú |
|---|---|---|---|
| 1 | Lưu tạm | `DRAFT` (0) | Mặc định khi tạo (saveAction=DRAFT) |
| 2 | Chờ Cảng vụ/Chi cục duyệt (vòng 1) | `APPROVED_LEVEL1` (3) | Gửi duyệt (submit) |
| 3 | Chờ Cục duyệt (vòng 2) | `APPROVED_LEVEL2` (4) | C1 đã duyệt xong |
| 4 | Bị Cảng vụ/Chi cục trả về | `REJECTED_LEVEL1` (8) | C1 từ chối |
| 5 | Bị Cục trả về | `REJECTED_LEVEL2` (9) | C2 từ chối |
| 6 | Đã duyệt | `APPROVED` (5) | Hoàn tất, có hiệu lực |
| 7 | Đã xóa (lịch sử) | `ARCHIVED` (7) | Xóa mềm DRAFT |

**Luồng chuyển trạng thái (khớp mục 3.2 tài liệu chung; mỗi dòng = 1 test case):**

| Từ | Hành động | Sang | Ai |
|---|---|---|---|
| (mới) | Lưu tạm | `DRAFT` | Người nhập |
| (mới) | Lưu và gửi duyệt | `APPROVED_LEVEL1` (chờ C1) | Người nhập |
| `DRAFT` | Gửi duyệt | `APPROVED_LEVEL1` | Người nhập |
| `APPROVED_LEVEL1` | Đồng ý (C1) | `APPROVED_LEVEL2` (chờ C2) | Cảng vụ/Chi cục |
| `APPROVED_LEVEL1` | Từ chối (C1) | `REJECTED_LEVEL1` | Cảng vụ/Chi cục |
| `APPROVED_LEVEL2` | Đồng ý (C2) | `APPROVED` | Cục |
| `APPROVED_LEVEL2` | Từ chối (C2) | `REJECTED_LEVEL2` | Cục |
| `REJECTED_LEVEL1` | Sửa + gửi lại | `APPROVED_LEVEL1` | Người nhập |
| `REJECTED_LEVEL2` | Sửa + gửi lại | `APPROVED_LEVEL1` | Người nhập |
| `APPROVED` | Sửa qua "Lưu và phê duyệt" | `APPROVED` (giữ nguyên) | Người có quyền phê duyệt |
| `DRAFT` | Xóa | `ARCHIVED` | Người nhập, quyền `buoyberth:delete` |

**Quy tắc bắt buộc (từ tài liệu chung, áp dụng nguyên vẹn):** chống tự duyệt (4-eyes — người duyệt không duyệt hồ sơ mình gửi); từ chối bắt buộc lý do ≥ 10 ký tự; đóng băng khi đang chờ duyệt (không sửa được `APPROVED_LEVEL1`/`APPROVED_LEVEL2`); re-submit luôn vào lại vòng 1; xóa mềm chỉ `DRAFT`; mỗi gửi/duyệt/từ chối ghi người thực hiện + thời điểm (submittedForApprovalAt/By, portAuthorityApprovedAt/By, departmentApprovedAt/By + nội dung phê duyệt).

**⚠️ ĐỘ LỆCH CODE (drift c.6 — ghi nhận, không sửa):** code `BuoyBerthApprovalService` dùng `APPROVED_LEVEL1` = "Chờ Cảng vụ duyệt" và `APPROVED_LEVEL2` = "Chờ Cục duyệt" (không dùng `PENDING_APPROVAL` như mục 3.1 tài liệu chung). Nhãn FE hiện tại cũng tự khai map trạng thái riêng thay vì dùng chung `ApprovalStatusBadge` (vi phạm quy tắc 3.10 tài liệu chung). Trạng thái nghiệp vụ vẫn đúng 7 giá trị; cần SA/QA đối chiếu khi xử lý drift.

## 6. Business Rules

Quy ước ID: `BR-{feature}-NN` theo từng feature (xem feature-brief). Quy tắc module (áp dụng mọi feature):

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-M026-01 | Mã bến phao tự sinh `{portCode}-BP-{seq:03d}`: lấy `port.portCode`, seq = max số hiện có (bản ghi chưa xóa) + 1; mã bất biến sau tạo | Create |
| BR-M026-02 | Chỉ tạo bến phao khi cảng biển cha có `approvalStatus = APPROVED` | Create |
| BR-M026-03 | `orgUnitId` gán tự động từ `port.orgUnitId` (không lấy từ request, không lấy từ đơn vị người thao tác) | Create/Update |
| BR-M026-04 | Chiều ghi: `portId` bắt buộc, trong phạm vi đơn vị user (DataScope); gán dữ liệu vào cảng ngoài phạm vi bị từ chối | Create/Update |
| BR-M026-05 | `cargoThroughput` bắt buộc, ≥ 0 | Create/Update |
| BR-M026-06 | Giá trị số ≥ 0 (`@DecimalMin("0")`): currentWaterDepth, bottomElevationDesign, maxVesselDWT, plannedVesselDWT, designCapacity, cargoThroughput; count ≥ 0 | Create/Update |
| BR-M026-07 | Chỉ xóa khi `DRAFT`; xóa mềm (ARCHIVED) + xóa bản ghi GIS tương ứng | Delete |
| BR-M026-08 | Xóa không ghi history (bảng change_logs/approval_logs đã drop — drift) | Delete |
| BR-M026-09 | `/options` chỉ trả bản ghi `APPROVED` (APPROVED ONLY) cho mọi dropdown cha (cảng biển, luồng HH, đơn vị khai thác) | Read |
| BR-M026-10 | DataScope: đơn vị nào xem dữ liệu đơn vị đó; cha xem subtree; Cục xem full | Read |
| BR-M026-11 | Thông báo/hiển thị tiếng Việt có dấu; code/DB/enum tiếng Anh chuẩn | Toàn module |
| BR-M026-12 | Enum lưu INT (`@Enumerated(ORDINAL)`); KHÔNG lưu chuỗi | Toàn module |
| BR-M026-13 | `classification` là chuỗi VARCHAR(100) tự do (Cấp đặc biệt/1/2/3/4), KHÔNG phải enum/catalog | Create/Update |

## 7. Validation rules (chi tiết)

| Trường | Ràng buộc BE (code) | Ràng buộc FE |
|---|---|---|
| buoyBerthName | `@NotBlank` + `@Size(max=255)` | required, maxLength 255 |
| portId | `@NotNull` ("Cảng biển chủ không được để trống") | required |
| provinceId | `@NotNull` | required |
| operationalStatus | `@NotNull` | required, default NOT_YET_OPERATIONAL |
| cargoThroughput | `@NotNull` + `@DecimalMin("0")` | required, min 0 |
| orgUnitId | KHÔNG `@NotNull` (tự gán từ port) | required (FE) — drift c.3 |
| operatingOrgId | KHÔNG `@NotNull` | required (FE) — drift c.4 |
| Các số | `@DecimalMin("0")`, precision/scale theo ma trận | InputNumber min 0, maxLength 20 |
| detailedLocation | max 500 | maxLength 500 |
| publicDecision | max 500 | maxLength 2000 — drift c.2 |
| mooringWaterAreaScope | max 1000 | maxLength 2000 — drift c.1 |
| rejectionReason | max 500, tối thiểu 10 ký tự khi từ chối (tài liệu chung 3.4) | required khi reject |
| portAuthority/departmentApprovalContent | max 1000 | Text read-only |

## 8. Data scope theo đơn vị

- Entity khai `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")`; controller `@DataScope` (đã có) — đúng convention.
- `orgUnitId` BẮT BUỘC có giá trị khi lưu: tự gán từ `port.orgUnitId` (BR-M026-03) — không để NULL.
- Chiều ghi: `validateAllowedOrgUnit`/DataScope đảm bảo không gán dữ liệu vào đơn vị ngoài phạm vi.
- **Ngoại lệ đã chốt:** không có — bến phao là dữ liệu nghiệp vụ theo đơn vị, không ngoại lệ.

## 9. Phân quyền (Admin Cục + buoyberth:*)

**10 quyền `buoyberth:*` ĐÃ SEED** trong `PermissionSeeder.java` (không seed lại — xác minh `config/PermissionSeeder.java:280-297`):

| Quyền | Mô tả | Ghi chú |
|---|---|---|
| `buoyberth:read` | Xem bến phao | |
| `buoyberth:read:restricted` | Xem bản ghi hạn chế | securityLevel RESTRICTED |
| `buoyberth:read:confidential` | Xem bản ghi mật | securityLevel CONFIDENTIAL |
| `buoyberth:create` | Thêm bến phao | |
| `buoyberth:update` | Cập nhật bến phao | gồm submit (saveAction) |
| `buoyberth:delete` | Xóa bến phao | chỉ DRAFT |
| `buoyberth:approve` | Phê duyệt bến phao | dùng cho approve/reject chung |
| `buoyberth:approvec1` | Phê duyệt C1 bến phao | Cảng vụ/Chi cục |
| `buoyberth:approvec2` | Phê duyệt C2 bến phao | Cục |
| `buoyberth:history` | Lịch sử phê duyệt bến phao | |

**⚠️ ĐỘ LỆCH CODE (drift c.7 — ghi nhận, không sửa):** `@PreAuthorize` trong `BuoyBerthController` đang bị **comment** ("TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)") — quyền đã seed nhưng chưa ép tại endpoint; FE vẫn chặn nút theo `hasPerm('buoyberth:*')`. Cần SA quyết định mở khóa khi xử lý drift.

**Admin Cục:** full quyền `buoyberth:*` + xem thêm metadata (người tạo `createdBy`, người sửa cuối `updatedBy`, thời gian tạo/cập nhật) — theo tài liệu nền mục 3.7/3.8; mặc định theo module, không có quyền riêng ngoài seed.

## 10. Quy ước hiển thị & UI

- **Danh sách:** `ScreenHeader + FilterBar + StatusTabs + DataTable + Pagination` từ `frontend/src/components/list-view/`; cột: STT (60px cố định trái) · Tên/Mã (cố định trái, Tên dòng 1 + Mã dòng 2, fontSizeMd 13px) · Đơn vị quản lý · Thuộc cảng biển · Địa điểm (Tỉnh/TP) · Phân cấp công trình · Tình trạng (pill) · Trạng thái (pill) · Thao tác (rowActions). Tiêu đề cột hiển thị đủ 100% chữ; nội dung dài cắt `...` + tooltip.
- **StatusTabs:** 6 tab màu semantic (Tất cả/Lưu tạm/Chờ Cảng vụ duyệt/Chờ Cục duyệt/Đã duyệt/Từ chối); số lượng Tất cả = tổng các tab con.
- **Drawer chi tiết (AppDrawer, 7 tab):** Thông tin chung · Thông tin vị trí (GIS — DMS compact + symbol preview) · File đính kèm (≤ 10MB) · **Kết cấu hạ tầng** (bảng STT/Loại KCHT/Tên KCHT/Thao tác; filter "Chọn loại kết cấu hạ tầng"; mở drawer con chi tiết Khu neo đậu/Khu tránh, trú bão — `AppDrawer size={950}` px cố định, không dùng %) · **Vận hành & bảo trì** · **Xử lý & theo dõi** (approval-audit columns: trạng thái, ngày/cán bộ cập nhật, ngày/cán bộ gửi PD, ngày/cán bộ duyệt C1/C2, nội dung PD) · Phê duyệt/Lịch sử (tab Phê duyệt + tab Thay đổi).
- **Form (AppDrawer):** Tab Lịch sử ẩn khi `drawerMode === 'create'`; Form.Item marginBottom `spaceFormField`; Input/Select/DatePicker/InputNumber `borderRadius: radiusPill, height: 40`; TextArea `textAreaStyle`; footer: Hủy (outlined) + nút hành động chính (primary), pill radius; KHÔNG hardcode màu/spacing — dùng `theme.ts`/`tokens.ts`.
- **Dữ liệu hiển thị:** tên đơn vị quản lý `orgUnitName` từ response (OrgUnitCacheService), tên cảng `portName` (PortCacheService), tên đơn vị khai thác `operatingOrgName` (OperatingUnitRepository) — frontend không tự map ID→tên.

## 11. Code drift register (ĐÃ GHI NHẬN — KHÔNG SỬA CODE)

| # | Drift | Bằng chứng | Trạng thái |
|---|---|---|---|
| c.1 | `mooring_water_area_scope` DB VARCHAR(1000) vs FE maxLength 2000 | entity `BuoyBerth.java:131`; FE form field `mooringWaterAreaScope` tại `BuoyBerthForm.tsx:582` | Document — nhập > 1000 ký tự sẽ lỗi DB |
| c.2 | `public_decision` DB VARCHAR(500) vs FE maxLength 2000 | entity `BuoyBerth.java:125`; FE form field `publicDecision` tại `BuoyBerthForm.tsx:561` | Document |
| c.3 | `orgUnitId` không `@NotNull` trong `CreateBuoyBerthRequest` dù CSV "bắt buộc" | `CreateBuoyBerthRequest.java`; service tự gán `port.getOrgUnitId()` (`BuoyBerthService.java:72` — create) | Document — đã xác minh tự gán từ cảng biển cha, không phải từ đơn vị người thao tác |
| c.4 | `operatingOrgId` không `@NotNull` BE dù CSV "bắt buộc" + FE required | `CreateBuoyBerthRequest.java`; `BuoyBerthForm.tsx:412` | Document |
| c.5 | Thứ tự form lệch nhau 3 nguồn: CSV (ĐVQL→Cảng biển→Luồng→Mã→Tên) vs Excel (Mã→Tên→ĐVQL→Cảng biển→Luồng) vs FE đã code (ĐVQL→Cảng biển→Đơn vị khai thác→Luồng→Mã→Tên…) | `(QL bến phao).csv`, Excel sheet, `BuoyBerthForm.tsx:398-584` | Document — Excel là source of truth cho thứ tự form; FE lệch |
| c.6 | Bản đồ trạng thái duyệt lệch tài liệu chung: code dùng `APPROVED_LEVEL1`/`APPROVED_LEVEL2` làm "chờ C1"/"chờ C2" thay vì `PENDING_APPROVAL`/`APPROVED_LEVEL1`; FE tự khai map nhãn, không dùng `ApprovalStatusBadge` | `BuoyBerthApprovalService.java`; `BuoyBerthListPage.tsx:79-99` | Document — trạng thái nghiệp vụ vẫn đúng 7 giá trị |
| c.7 | `@PreAuthorize` bị comment tại mọi endpoint `BuoyBerthController` (quyền đã seed, chưa ép) | `BuoyBerthController.java` (10 endpoint) | Document — cần SA quyết định |
| c.8 | Không ghi history khi create/update/delete (bảng `change_logs`/`approval_logs` đã drop bởi `V20260825162500`); `getHistory` trả rỗng | `BuoyBerthService.java` (comment "TẠM TẮT GHI LỊCH SỬ"); `BuoyBerthApprovalService.java` | Document — lịch sử hiện chỉ từ approval-audit columns trên entity |
| c.9 | `softDelete` không gọi `ApprovalHistoryUtils.recordSoftDelete` (bảng history không tồn tại) | `BuoyBerthService.java:270-281` | Document |

## 12. Tài liệu tham chiếu

- `docs/inputs/HH_Tính năng & danh sách các trường thông tin(QL bến phao).csv` (57 trường)
- `HH_Tính năng & danh sách các trường thông tin.xlsx` — sheet "QL bến phao" (thứ tự form chuẩn)
- `docs/intel/handoff-2026-08-27-buoy-berth.md` (triển khai inline phiên 2026-08-27)
- `docs/conventions/approval-2-level-spec.md`, `docs/conventions/infrastructure-feature-standard-architecture.md`
- Code: `src/main/java/com/hanghai/kchtg/port/{entity,dto/buoyberth,service,controller,repository}/BuoyBerth*.java`; `frontend/src/pages/buoy-berth/*.tsx`; `src/main/resources/db/migration/V20260829040000__create_buoy_berths.sql`, `V20260829050000__create_operating_units_and_seed_data.sql`
