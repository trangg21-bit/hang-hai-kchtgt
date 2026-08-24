---
id: F-027
name: Quản lý Cảng cạn - Cập nhật
slug: ql-cct-cap-nhat
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-027 — Quản lý Cảng cạn - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (cập nhật → duyệt lại; bản ghi đã duyệt bắt buộc Lưu và phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung. Form giống hệt F-026 (mục 2) — chỉ khác các điểm nêu dưới đây.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`dryport:update`) chỉnh sửa thông tin Cảng cạn đã tồn tại; form 4 tab, 24 trường pre-filled từ API. **Mã CC-XXXXXX** và **Đơn vị quản lý** bất biến (read-only/disabled). Hai nút: **Lưu tạm** (giữ trạng thái; **không áp dụng cho bản ghi đã duyệt**) và **Lưu và phê duyệt** (cần `dryport:approve`). Với bản ghi đã duyệt (APPROVED): bắt buộc dùng "Lưu và phê duyệt" để phê duyệt lại — người không có `dryport:approve` không được sửa. Mọi thay đổi ghi vào change history. "Gửi phê duyệt" là hành động trên màn hình Danh sách, không nằm trên form này.

> **⚠️ Lưu ý đối chiếu Excel:** sheet `QL Cảng cạn` (nguồn sự thật) để cột **Sửa = Không** cho mọi trường. Sự tồn tại của F-027 (Cập nhật Cảng cạn) đang là **câu hỏi chờ BA/SA chốt** (mục 3.3 + câu hỏi #1 — `docs/intel/field-mismatch-report-m002-m003-vs-excel.md`): (a) Excel đúng → bỏ F-027; (b) Brief đúng → sửa Excel chuyển Sửa=true; (c) Sửa có điều kiện (vd: chỉ khi DRAFT, khóa ĐVQL). Bảng mục 2 dưới đây giữ nguyên cờ theo Excel (Sửa = Không); nội dung luồng sửa của mục 3-7 giữ nguyên chờ BA/SA chốt.

## 2. Trường dữ liệu

Cấu trúc theo entity `DryPort` (bảng `dry_ports`) — danh sách trường **khớp 100%** sheet `QL Cảng cạn` — file `HH_Tính năng & danh sách các trường thông tin.xlsx` (nguồn sự thật đã được xác nhận): tên trường, loại điều khiển và cờ hiển thị tại 5 màn hình (Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa) lấy nguyên theo Excel. Quy ước cột Bắt buộc: **Có*** = bắt buộc khi Gửi phê duyệt. Điểm khác biệt của F-027 so với F-026: `dryPortCode` và `orgUnitId` là **disabled trên màn Sửa** (bất biến vĩnh viễn).

| STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| | **Thông tin chung** | | | | | | | | |
| 1 | Đơn vị quản lý (bắt buộc) | Select | Có | Có | Có | Có | Có | Không | `orgUnitId` — **disabled, bất biến vĩnh viễn**; backend từ chối payload đổi đơn vị |
| 2 | Đơn vị khai thác | Text | Không | Có | Không | Có | Có | Không | `operatingUnit` |
| 3 | Khu vực | Text | Không | Có | Có | Có | Có | Không | `region` |
| 4 | Mã cảng cạn | Text (read-only, tự sinh CC-XXXXXX) | Có (hệ thống tự sinh) | Có | Có | Có | Có | Không | `dryPortCode` — **disabled, bất biến vĩnh viễn**; backend từ chối payload đổi mã |
| 5 | Tên cảng cạn (bắt buộc) | Text | Có | Có | Có | Có | Có | Không | `dryPortName` |
| 6 | Tỉnh/TP (bắt buộc) | Select | Có | Không | Có | Có | Có | Không | `provinceId` |
| 7 | Địa chỉ chi tiết (bắt buộc) | Text | Có | Không | Không | Có | Có | Không | `detailedLocation` |
| 8 | Hành lang vận tải | Text | Không | Có | Có | Có | Có | Không | `transportCorridor` |
| 9 | Công suất khai thác (TEU) (bắt buộc) | Number | Có | Không | Không | Có | Có | Không | `teuCapacity` |
| 10 | Tổng diện tích (m²) | Number | Không | Không | Không | Có | Có | Không | `area` |
| 11 | Diện tích kho (m²) | Number | Không | Không | Không | Có | Có | Không | `warehouseArea` |
| 12 | Diện tích bãi (m²) | Number | Không | Không | Không | Có | Có | Không | `yardArea` |
| 13 | Phương thức kết nối | Text | Không | Không | Không | Có | Có | Không | `connectionMode` |
| 14 | Tình trạng (bắt buộc) | Select | Có | Không | Có | Có | Có | Không | `portStatus` |
| 15 | Ghi chú | Textarea | Không | Không | Không | Có | Có | Không | `remarks` |
| | **Thông tin công bố** | | | | | | | | |
| 16 | Quyết định công bố số | Text | Không | Không | Không | Có | Có | Không | `announcementDecisionNumber` |
| 17 | Ngày ra quyết định | DatePicker | Không | Không | Không | Có | Có | Không | `announcementDecisionDate` |
| 18 | Đơn vị ra quyết định | Text | Không | Không | Không | Có | Có | Không | `announcementOrg` |
| | **Vị trí (GIS)** | | | | | | | | |
| 19 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Có | Không | `coordinateSystem`/`displayRule`/`mapSymbolId`/`spatialId` |
| 20 | Biểu tượng | Select | Không | Không | Không | Có | Có | Không | (GIS) |
| 21 | Hệ quy chiếu | Text | Không | Không | Không | Có | Có | Không | (GIS) |
| 22 | Quy tắc hiển thị | Text | Không | Không | Không | Có | Có | Không | (GIS) |
| 23 | Tọa độ | Bảng con (Kinh độ, Vĩ độ) | Không | Không | Không | Có | Có | Không | `coordinates[]` (GIS) |
| | **File đính kèm** | | | | | | | | |
| 24 | File đính kèm | Upload | Không | Không | Không | Có | Có | Không | `attachments[]` — quản lý tại F-026/F-030 |
| | **Trạng thái & Kiểm toán (chỉ ở trang Chi tiết)** | | | | | | | | |
| 25 | Trạng thái phê duyệt | Badge (read-only) | Không (read-only) | Có | Có | Có | Không | Không | `approvalStatus` |
| 26 | Người cập nhật | Text (read-only, chỉ Admin Cục) | Không (read-only) | Có | Không | Có | Không | Không | Kiểm toán — chỉ Admin Cục |
| 27 | Ngày cập nhật | Text (read-only, chỉ Admin Cục) | Không (read-only) | Có | Có | Có | Không | Không | Kiểm toán — chỉ Admin Cục |
| | **Thông tin quy hoạch** | | | | | | | | |
| 28 | Số quyết định quy hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 29 | Ngày quyết định quy hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin vận hành khai thác** | | | | | | | | |
| 30 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 31 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 32 | Ngày bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 33 | Ngày kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin bảo trì** | | | | | | | | |
| 34 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 35 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 36 | Thời gian bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 37 | Thời gian kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin sự cố** | | | | | | | | |
| 38 | Mã sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 39 | Loại sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 40 | Địa điểm | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 41 | Thời gian | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Lưu tạm:** giữ nguyên trạng thái, form ở lại; không áp dụng cho bản ghi đã duyệt.
- **Lưu và phê duyệt** (cần `dryport:approve`): đầy đủ 6 trường bắt buộc → trạng thái đã duyệt + ghi change history + approval log.
- **Bản ghi đã duyệt (APPROVED):** vẫn mở form cập nhật được, nhưng nút "Lưu tạm" bị ẩn — bắt buộc "Lưu và phê duyệt" để duyệt lại; không có `dryport:approve` thì không được sửa.
- Mọi cập nhật: ghi change history (từng trường thay đổi: old_value → new_value) + thông tin kiểm toán (operatorId, updatedBy, updatedAt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-027-01 | Mã CC-XXXXXX bất biến vĩnh viễn — sinh khi tạo mới (F-026), không bao giờ sửa; backend từ chối payload đổi mã | Update |
| BR-027-01a | Đơn vị quản lý bất biến vĩnh viễn — gán khi tạo mới, không bao giờ sửa; backend từ chối payload đổi đơn vị | Update |
| BR-027-02 | Lưu tạm giữ nguyên trạng thái; tối thiểu tên cảng cạn | Update (draft) |
| BR-027-03 | Lưu và phê duyệt: đủ 6 trường bắt buộc + `dryport:approve` → trạng thái đã duyệt | Update (approve) |
| BR-027-04 | Bản ghi APPROVED: chỉ "Lưu và phê duyệt" (không có "Lưu tạm"); cần `dryport:approve` để sửa | Update |
| BR-027-05 | Ghi change history cho mọi thay đổi (chỉ ghi trường thực sự thay đổi) | Update |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem cảng cạn (pre-fill) | `dryport:read` |
| Cập nhật Cảng cạn | `dryport:update` |
| Lưu và phê duyệt (bắt buộc với bản ghi APPROVED) | `dryport:update` + `dryport:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| admin / admin-operation / Cán bộ | Cập nhật theo permission được gán |
| Lãnh đạo | Thường được gán `dryport:approve` (phê duyệt lại) |
| Cá nhân | Không truy cập |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung; bản ghi APPROVED bắt buộc Lưu và phê duyệt |
| 2 | Có bước phê duyệt không | Có — cập nhật bản ghi đã duyệt phải Lưu và phê duyệt lại |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — dryPortCode + orgUnitId disabled; "Lưu tạm" ẩn với bản ghi APPROVED; nút "Lưu và phê duyệt" chỉ khi có `dryport:approve` |
| 5 | Quyền riêng | `dryport:update` (kèm `dryport:read`, `dryport:approve`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (đính kèm quản lý tại F-026/F-030) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports/{id}` | Pre-fill form | `dryport:read` |
| PUT | `/api/v1/dry-ports/{id}` | Cập nhật (body: action `draft`/`approve` + trường + coordinates[]) | `dryport:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `dry_ports`:** cấu trúc giống F-026 (mục 7) — F-027 không thêm trường; dryPortCode/orgUnitId bất biến.

**Bảng `change_history` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityId (UUID), entityType (NVARCHAR 50 — "DRY_PORT"), actionType (NVARCHAR 20 — CREATE / UPDATE / DELETE), fieldName (NVARCHAR 100), oldValue, newValue, changedBy (UUID), changedAt (TIMESTAMP) — ghi tự động, bất biến.
