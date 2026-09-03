---
id: F-124
name: Xử lý tài sản KCHT
slug: xu-ly-tai-san-kcht
module-id: M-005
status: proposed
classification: local
priority: high
created: 2026-06-16T04:41:00Z
last-updated: 2026-07-21T08:00:25Z
locked-fields: []
consumed_by_modules: []
source-paths:
  - src/main/java/com/hanghai/kchtg/assetmovement/controller/HoSoXuLyTaiSanController.java
  - src/main/java/com/hanghai/kchtg/assetmovement/service/HoSoXuLyTaiSanService.java
---
# Đặc tả nghiệp vụ: Xử lý tài sản KCHT

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-124 — Xử lý tài sản KCHT
**Module:** M-005 — Quản lý biến động tài sản KCHTGT
**Loại:** chức năng có bước phê duyệt (tối đa 2 cấp: Cảng vụ/Chi cục → Cục)
**Tham chiếu:**
- Nguồn sự thật (ma trận trường): Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` — sheet `30->43`, cụm **#32 "QL Đề nghị xử lý tài sản KCHTGT HH"** (khối cột 103–110, 68 dòng × 128 cột). Trích xuất bằng openpyxl (như M-007 verify-report) vì bản markdown bị cắt dòng ở 2000 ký tự.
- Tài liệu yêu cầu gốc (hh.csdl): URD v3.0 **III.7.51 Quản lý đề nghị xử lý tài sản KCHTGT hàng hải** (`docs/intel/temp_extract/20260616T031810-3cef57d6c3853955-ZOxvv1/URD_MTIS_VMD_v3.0_PHCV-00000000.txt`, ~dòng 65700 trở đi).
- Tài liệu nền module M-005: `ba/00-lean-spec.md` (chưa có `ba/01-base-pattern.md` — phần CHUNG sẽ bổ sung khi module mở lại).

> ⚠️ Các mục 6–7 là đề xuất của BA, SA chốt khi triển khai. Ô Excel không đối chiếu chắc tới từng ô → ghi rõ **UNRESOLVED**, không bịa.

---

## 1. Mô tả ngắn

- Chức năng cho phép đơn vị quản lý lập **Đề nghị xử lý tài sản KCHTGT HH** khi tài sản cần xử lý (điều chuyển, bàn giao, thanh lý, phá bỏ…): chọn **Hình thức xử lý đề nghị**, kèm **Lý do đề nghị xử lý**, gắn một **Tài sản** cụ thể (thông tin tài sản hiển thị tự động từ hồ sơ tài sản) và **File đính kèm**.
- Bản ghi có **Trạng thái** hiển thị dạng badge và đi qua **luồng phê duyệt tối đa 2 cấp (Cảng vụ/Chi cục → Cục)**; toàn bộ thông tin gửi duyệt/phê duyệt (ngày, cán bộ, nội dung) được lưu ngay trên bản ghi.
- Người dùng: chuyên viên/lãnh đạo Cục, Phòng ban trực thuộc Cục, Cảng vụ/Chi cục (theo URD III.7.51.1); đơn vị quản lý theo phân quyền dữ liệu.

## 2. Trường dữ liệu

Cờ ma trận đọc trực tiếp từ Excel cụm #32 (không suy diễn): ✓ = true, — = false. Cột "Bắt buộc" lấy theo URD III.7.51.3 (M = bắt buộc; X = hiển thị/cho phép, không bắt buộc).

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| — | *Thông tin chung* (section — Excel: DS —, Lọc —, Xem —, Tạo —, Sửa —) | — | — | — |
| 1 | Đơn vị đề nghị | Có (M) | `SelectOrgCode` (cây đơn vị) | DS ✓, Lọc ✓, Xem ✓, Tạo ✓, Sửa ✓. `orgUnitId` — trường DataScope, bắt buộc |
| 2 | Số đề nghị | Có (M) | `Input Text` (disabled khi sửa) | DS ✓, Lọc ✓, Xem ✓, Tạo ✓, Sửa ✓. `dossierNo` |
| 3 | Ngày đề nghị | Có (M) | `DatePicker` | DS ✓, Lọc ✓, Xem ✓, Tạo ✓, Sửa ✓. `requestDate` |
| 4 | Hình thức xử lý đề nghị | Có (M) | `Select` (danh mục: Điều chuyển / Bàn giao / Thanh lý / Phá bỏ…) | DS ✓, Lọc ✓, Xem ✓, Tạo ✓, Sửa ✓. `processingType` |
| 5 | Lý do đề nghị xử lý | Có (M) | `InputTextArea` | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓. `processingReason` |
| — | *Thông tin tài sản* (section — Excel: DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓) | — | — | Chọn 1 tài sản → tự động hiển thị thông tin bên dưới (read-only, lấy từ hồ sơ tài sản) |
| 6 | Loại tài sản | Có (M) | `Select` | DS ✓, Lọc ✓, Xem ✓, Tạo ✓, Sửa ✓. `assetTypeId` |
| 7 | Tài sản | Có (M) | `Select` (chọn tài sản trong loại đã chọn) | DS ✓, Lọc ✓, Xem ✓, Tạo ✓, Sửa ✓. `assetId` |
| 8 | Địa chỉ | Không (X) | `InputTextArea` (disabled) | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓. Hiển thị từ tài sản |
| 9 | Năm đưa vào sử dụng | Không (X) | `DatePicker (chọn năm)` (disabled) | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓ |
| 10 | Thông số cơ bản | Không (X) | `Input Text` (disabled) | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓ |
| 11 | Diện tích (đất, sàn sử dụng: m2) | Không (X) | `Input Text` (disabled) | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓ |
| 12 | Diện tích (sàn sử dụng: m2) | Không (X) | `Input Text` (disabled) | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓ |
| 13 | Nguyên giá (VNĐ) | Không (X) | `InputMoney` (disabled) | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓. `originalValue` |
| 14 | Giá trị còn lại (VNĐ) | Không (X) | `InputMoney` (disabled) | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓. `residualValue` |
| 15 | Tình trạng tài sản | Không (X) | `Select` (disabled) | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓ |
| — | *File đính kèm* (section — Excel: DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓) | — | — | — |
| 16 | File đính kèm | Không | `UploadFileTable` | DS —, Lọc —, Xem ✓, Tạo ✓, Sửa ✓. Bảng con file: STT + Tên file (URD III.7.51.3 #17–18) |
| — | *Trạng thái* (section — Excel: DS —, Lọc —, Xem ✓, Tạo —, Sửa —) | — | — | Nhóm theo dõi/phê duyệt, hiển thị ở Danh sách/Xem chi tiết |
| 17 | Trạng thái | Có (hệ thống) | `Select` hiển thị dạng **badge** (read-only) | DS ✓, Lọc ✓, Xem ✓, Tạo —, Sửa —. Giá trị xem §3 |
| 18 | Cán bộ cập nhật | Có (hệ thống) | `Text` (hiển thị, không nhập) | DS ✓, Lọc —, Xem ✓, Tạo —, Sửa —. `updatedByName` |
| 19 | Ngày cập nhật | Có (hệ thống) | `DatePicker` (hiển thị, không nhập) | DS ✓, Lọc ✓, Xem ✓, Tạo —, Sửa —. `updatedAt` |
| 20 | Ngày gửi phê duyệt | Có (hệ thống) | `Text` (read-only) | DS ✓, Lọc —, Xem ✓, Tạo —, Sửa —. `submittedAt` |
| 21 | Cán bộ gửi phê duyệt | Có (hệ thống) | `Text` (read-only) | DS ✓, Lọc —, Xem ✓, Tạo —, Sửa —. `submittedBy` |
| 22 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Có (hệ thống) | `Text` (read-only) | DS ✓, Lọc —, Xem ✓, Tạo —, Sửa —. `approvedL1At` |
| 23 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Có (hệ thống) | `Text` (read-only) | DS ✓, Lọc —, Xem ✓, Tạo —, Sửa —. `approvedL1By` |
| 24 | Nội dung phê duyệt | Không (hệ thống) | `Text` (read-only) | DS —, Lọc —, Xem ✓, Tạo —, Sửa —. `approvedL1Note` |
| 25 | Ngày phê duyệt cấp Cục | Có (hệ thống) | `Text` (read-only) | DS ✓, Lọc —, Xem ✓, Tạo —, Sửa —. `approvedL2At` |
| 26 | Cán bộ phê duyệt cấp Cục | Có (hệ thống) | `Text` (read-only) | DS ✓, Lọc —, Xem ✓, Tạo —, Sửa —. `approvedL2By` |
| 27 | Nội dung phê duyệt | Không (hệ thống) | `Text` (read-only) | DS —, Lọc —, Xem ✓, Tạo —, Sửa —. `approvedL2Note` |

> ⚠️ UNRESOLVED: `Đơn vị đề nghị` — URD ghi "X/M" (Thêm mới) và "X" (Cập nhật): hiểu là bắt buộc chọn và **không đổi khi sửa** (giống dòng 2 "disabled khi sửa"). Các trường 8–15 chỉ hiển thị sau khi chọn tài sản — BA/SA chốt khi scaffold.

## 3. Trạng thái và phê duyệt

- Trạng thái lưu dạng **số nguyên (Enum ORDINAL)** theo convention dự án; hiển thị trên UI bằng **badge trạng thái** (viên thuốc, màu semantic — convention list-screen).
- Đề xuất ánh xạ trạng thái chuẩn **M-1006 (7 trạng thái, theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`)** — SA chốt khi mở lại module:

| Nhãn UI (đề xuất) | Trạng thái hệ thống | Ý nghĩa |
|---|---|---|
| Lưu tạm | `DRAFT` | Mới tạo, chưa gửi duyệt; sửa/xóa được |
| Chờ Cảng vụ/Chi cục duyệt | `PENDING_L1` | Đã gửi phê duyệt cấp 1 (Excel: ghi Ngày/Cán bộ gửi phê duyệt) |
| Chờ Cục duyệt | `PENDING_L2` | Cấp Cảng vụ/Chi cục đã duyệt, chờ Cục |
| Bị Cảng vụ/Chi cục trả về | `REJECTED_L1` | Cấp 1 từ chối (kèm nội dung phê duyệt) → sửa/gửi lại |
| Bị Cục trả về | `REJECTED_L2` | Cấp Cục từ chối (kèm nội dung phê duyệt) → sửa/gửi lại |
| Đã duyệt | `APPROVED` | Cấp Cục duyệt → hoàn tất; khóa sửa thông tin chính |
| Đã xóa (lịch sử) | `DELETED` | Xóa khi đang Lưu tạm; lưu đối chiếu |

- **Luồng phê duyệt (theo cột phê duyệt trong Excel #32):** Lưu tạm → Gửi phê duyệt (ghi `Ngày gửi phê duyệt`/`Cán bộ gửi phê duyệt`) → Cấp Cảng vụ/Chi cục duyệt (ghi `Ngày/Cán bộ/Nội dung phê duyệt` cấp 1) → Cấp Cục duyệt (ghi `Ngày/Cán bộ/Nội dung phê duyệt` cấp 2) → Đã duyệt. Từ chối ở cấp nào phải nhập nội dung phê duyệt. Nguyên tắc **4-eyes**: người đề nghị không tự duyệt.
- Mọi thay đổi trạng thái ghi vào lịch sử tập trung + thông tin kiểm toán đầy đủ (`operatorId`, `approvedBy`, thời gian).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc RIÊNG của chức năng; phần CHUNG (DataScope, badge, cache tên đơn vị, đa ngôn ngữ) theo AGENTS.md và tài liệu nền module.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-124-01 | Đề nghị xử lý phải xác định đúng 1 Tài sản (Loại tài sản + Tài sản bắt buộc khi tạo) | Create |
| BR-124-02 | Hình thức xử lý đề nghị chọn từ danh mục (điều chuyển/bàn giao/thanh lý/phá bỏ…), không nhập tự do | Create |
| BR-124-03 | Giá trị xử lý (nếu có) không vượt quá giá trị còn lại của tài sản | Create/Update |
| BR-124-04 | Thông tin tài sản (8–15) hiển thị read-only từ hồ sơ tài sản tại thời điểm chọn — không nhập tay | Create |
| BR-124-05 | Chỉ gửi phê duyệt khi trạng thái Lưu tạm (hoặc sau khi bị trả về đã sửa lại) và đủ trường bắt buộc | Submit |
| BR-124-06 | Sau khi gửi duyệt: khóa sửa/xóa; chỉ còn theo dõi phê duyệt | Edit/Delete |
| BR-124-07 | 4-eyes: người lập đề nghị không được tự phê duyệt bản ghi do mình tạo | Approve |
| BR-124-08 | Từ chối ở bất kỳ cấp nào bắt buộc nhập nội dung phê duyệt (lưu + lịch sử) | Reject |
| BR-124-09 | Mọi ô text nhập liệu phải `.trim()` trước khi gửi API; tên đơn vị luôn lấy từ cây đơn vị qua `OrgUnitCacheService` | All |
| BR-124-10 | Mọi thay đổi ghi đủ kiểm toán (`operatorId`/`updatedBy`) và lịch sử tập trung | All |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-124-01** — Tạo mới: chọn đủ Hình thức xử lý, Lý do, Loại tài sản + Tài sản → Lưu tạm/Đề nghị thành công; thiếu trường bắt buộc → chặn + báo lỗi tiếng Việt.
- **AC-124-02** — Sau khi chọn Tài sản, các trường 8–15 tự điền read-only, không chỉnh được.
- **AC-124-03** — Gửi duyệt ghi `Ngày/Cán bộ gửi phê duyệt`, badge chuyển "Chờ Cảng vụ/Chi cục duyệt".
- **AC-124-04** — Phê duyệt 2 cấp ghi đủ Ngày/Cán bộ/Nội dung; từ chối phải có nội dung; bản ghi Đã duyệt khóa sửa.
- **AC-124-05** — Danh sách đủ 4 trạng thái loading/error/empty/data; lọc theo DataScope + Trạng thái + khoảng ngày.

### 4.3. User Stories kế thừa (nếu có)

- **US-124-01:** Là chuyên viên đơn vị, tôi lập đề nghị xử lý tài sản kèm lý do/file để trình cấp trên duyệt.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo/Sửa/Xóa đề nghị xử lý tài sản | `processingrecord:manage` (đề xuất; đúng theo PermissionSeeder + controller hiện có) |
| Xem danh sách/chi tiết | xác thực (`isAuthenticated()` — controller hiện có) |
| Gửi phê duyệt / Phê duyệt cấp Cảng vụ/Chi cục | đề xuất thêm `processingrecord:approve` (hoặc theo resource phê duyệt chung F-127 khi module mở lại) — **UNRESOLVED, SA chốt** |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền — full quyền + xem thêm metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — badge trạng thái kèm bộ trường theo dõi phê duyệt (18–27) hiển thị ở Danh sách/Xem chi tiết |
| 2 | Có bước phê duyệt không | Có — tối đa 2 cấp: Cảng vụ/Chi cục → Cục (theo cột phê duyệt trong Excel #32) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — `Đơn vị đề nghị` = `orgUnitId` + DataScope |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Thông tin tài sản (8–15) chỉ hiển thị sau khi chọn Tài sản; nhóm Trạng thái chỉ ở Danh sách/Xem chi tiết |
| 5 | Quyền riêng | `processingrecord:manage` (+ `processingrecord:approve` đề xuất) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable, bảng con file) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

> Code hiện có của M-005 (package `com.hanghai.kchtg.assetmovement`) đặt tên khác brief cũ (`AssetProcessingRecordController`, bảng `asset_processing_records`) — các đường dẫn dưới đây theo code hiện có, BA đề xuất; SA chốt khi module mở lại.

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/asset/asset-processing-records` | Danh sách đề nghị xử lý (phân trang + lọc DataScope/Trạng thái/ngày) | `isAuthenticated()` |
| POST | `/api/v1/asset/asset-processing-records` | Tạo mới đề nghị xử lý (draft) | `processingrecord:manage` |
| GET | `/api/v1/asset/asset-processing-records/{id}` | Chi tiết đề nghị (kèm thông tin tài sản + trạng thái/phê duyệt) | `isAuthenticated()` |
| PUT | `/api/v1/asset/asset-processing-records/{id}` | Sửa (chỉ khi Lưu tạm) | `processingrecord:manage` |
| DELETE | `/api/v1/asset/asset-processing-records/{id}` | Xóa (chỉ khi Lưu tạm) | `processingrecord:manage` |
| POST | `/api/v1/asset/asset-processing-records/{id}/submit` | Gửi phê duyệt (ghi Ngày/Cán bộ gửi) | đề xuất `processingrecord:approve` (UNRESOLVED) |
| POST | `/api/v1/asset/asset-processing-records/{id}/approve` | Phê duyệt cấp theo user (L1/L2) / từ chối kèm nội dung | đề xuất `processingrecord:approve` (UNRESOLVED) |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm (so với bảng `asset_processing_records` đang có); ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `asset_processing_records`** (Hồ sơ/Đề nghị xử lý tài sản — theo code hiện có, mở rộng theo Excel #32):
- `id` UUID PK; 🔴 `org_unit_id` UUID NOT NULL (Đơn vị đề nghị — DataScope, index) · 🔴 `dossier_no` (Số đề nghị, unique) · 🔴 `request_date` DATE (Ngày đề nghị) · `processing_type` SMALLINT/ENUM (Hình thức xử lý đề nghị) · 🔴 `processing_reason` (Lý do đề nghị xử lý) · `asset_id` UUID FK (Tài sản — #7)
- Nhóm thông tin tài sản read-only (snapshot hiển thị, 🔴 nếu muốn lưu lịch sử): `asset_address`, `commissioning_year`, `basic_specs`, `land_floor_area`, `floor_area`, `original_value`, `residual_value`, `asset_condition` — hoặc KHÔNG lưu, hiển thị qua FK `asset_id` (SA chốt 1 trong 2 — UNRESOLVED)
- Nhóm trạng thái & phê duyệt: `approval_status` SMALLINT/ENUM (7 trạng thái M-1006 — §3), `submitted_at`, `submitted_by`, `approved_l1_at/by/note`, `approved_l2_at/by/note`, `rejected_reason`…; audit kế thừa `BaseEntity` (`created_by/at`, `updated_by/at`, `deleted_at/by`) + `@Version`
- 🔴 `org_unit_name` KHÔNG lưu — hiển thị qua `OrgUnitCacheService`
- Cột enum lưu số nguyên `@Enumerated(ORDINAL)`; tên bảng/cột/field tiếng Anh, message/giao diện tiếng Việt có dấu

**Bảng con `asset_processing_record_file`** (🔴 File đính kèm #16): `id`, `record_id` FK, `stt`, `file_name`, `file_path`, `created_by`, `created_at`.

**Lịch sử:** ghi vào bảng tập trung (`infrastructure_history` + approval-history) — không tạo bảng lịch sử riêng (convention dự án).
