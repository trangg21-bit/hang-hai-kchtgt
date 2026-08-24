---
id: F-090
name: "Xem chi tiết Nhà trạm đèn"
slug: xem-chi-tiet-nha-tram-den
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem chi tiết Nhà trạm đèn

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-090
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`, sheet `QL Đèn biển và nhà trạm`)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền xem (operator, approver, admin, viewer) xem toàn bộ thông tin chi tiết của một nhà trạm đèn đã tồn tại trong hệ thống. Màn hình hiển thị đầy đủ các nhóm thông tin: thông tin cơ bản, thông tin nhà trạm (địa điểm, kết cấu, diện tích, nhân sự), thông tin kỹ thuật đèn biển, thông tin vị trí GIS, file đính kèm, thông tin log cập nhật, thông tin vận hành/bảo trì/sự cố, và trạng thái phê duyệt. Dữ liệu hiển thị read-only; để chỉnh sửa cần chuyển sang feature F-087.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn xem chi tiết (read-only):

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã đèn biển | Có | Input (disabled) | Mã nhà trạm đèn, hiển thị read-only |
| 2 | Tên đèn biển | Có | Input (disabled) | Tên nhà trạm đèn, hiển thị read-only |
| 3 | Đơn vị quản lý | Có | SelectOrgCode (disabled) | Đơn vị quản lý, hiển thị read-only |
| 4 | Thuộc cảng biển | Không | SelectKcht (CB) (disabled) | Cảng biển thuộc về, hiển thị read-only |
| 5 | Đơn vị vận hành | Không | SelectCateOther (disabled) | Đơn vị vận hành, hiển thị read-only |
| 6 | Địa điểm (Tỉnh/TP) | Không | SelectCateOther (disabled) | Địa điểm cấp tỉnh, hiển thị read-only |
| 7 | Địa điểm chi tiết | Không | InputTextArea (disabled) | Địa điểm chi tiết, hiển thị read-only |
| 8 | Tình trạng | Không | SelectAppParams (disabled) | Tình trạng hiện tại, hiển thị read-only |
| 9 | Chủng loại đèn chính | Không | Input (disabled) | Chủng loại đèn chính, hiển thị read-only |
| 10 | Chủng loại đèn dự phòng | Không | Input (disabled) | Chủng loại đèn dự phòng, hiển thị read-only |
| 11 | Cấp trạm đèn | Không | SelectAppParams (disabled) | Cấp trạm đèn, hiển thị read-only |
| 12 | Địa bàn | Không | InputTextArea (disabled) | Địa bàn hoạt động, hiển thị read-only |
| 13 | Đặc điểm nhận dạng | Không | InputTextArea (disabled) | Đặc điểm nhận dạng, hiển thị read-only |
| 14 | Hình dạng | Không | InputTextArea (disabled) | Hình dạng tháp đèn, hiển thị read-only |
| 15 | Chiều cao tháp đèn (m) | Không | InputDecimal (disabled) | Chiều cao tháp đèn, hiển thị read-only |
| 16 | Chiều cao tâm sáng (m) | Không | InputDecimal (disabled) | Chiều cao tâm sáng, hiển thị read-only |
| 17 | Tầm hiệu lực địa lý | Không | Input (disabled) | Tầm hiệu lực địa lý, hiển thị read-only |
| 18 | Tầm hiệu lực ánh sáng | Không | Input (disabled) | Tầm hiệu lực ánh sáng, hiển thị read-only |
| 19 | Màu sắc tháp đèn | Không | InputTextArea (disabled) | Màu sắc tháp đèn, hiển thị read-only |
| 20 | Nguồn năng lượng | Không | InputTextArea (disabled) | Nguồn năng lượng, hiển thị read-only |
| 21 | Thời điểm đưa vào sử dụng | Không | DatePicker (disabled) | Ngày đưa vào sử dụng, hiển thị read-only |
| 22 | Thời điểm sửa chữa gần nhất | Không | DatePicker (disabled) | Ngày sửa chữa gần nhất, hiển thị read-only |
| 23 | Địa điểm đặt trạm đèn | Không | InputTextArea (disabled) | Địa điểm đặt nhà trạm, hiển thị read-only |
| 24 | Kết cấu | Không | InputTextArea (disabled) | Kết cấu xây dựng, hiển thị read-only |
| 25 | Diện tích (m²) | Không | InputDecimal (disabled) | Tổng diện tích nhà trạm, hiển thị read-only |
| 26 | Diện tích sử dụng trạm đèn (m²) | Không | InputDecimal (disabled) | Diện tích sử dụng thực tế, hiển thị read-only |
| 27 | Số lượng nhân sự bố trí | Không | InputTextArea (disabled) | Số nhân sự tại nhà trạm, hiển thị read-only |
| 28 | Ghi chú | Không | InputTextArea (disabled) | Ghi chú bổ sung, hiển thị read-only |
| 29 | Loại đối tượng (GIS) | Không | SelectAppParams (disabled) | Phân loại GIS, hiển thị read-only |
| 30 | Biểu tượng (GIS) | Không | SelectIcon (disabled) | Biểu tượng bản đồ, hiển thị read-only |
| 31 | Hệ quy chiếu (GIS) | Không | SelectAppParams (disabled) | Hệ quy chiếu tọa độ, hiển thị read-only |
| 32 | Quy tắc hiển thị (GIS) | Không | SelectAppParams (disabled) | Quy tắc style GIS, hiển thị read-only |
| 33 | Tọa độ (GIS) | Không | LongLatTable (disabled) | Bảng tọa độ, hiển thị read-only |
| 34 | Danh sách file đính kèm | Không | UploadFileTable (disabled) | Danh sách file, hiển thị read-only |
| 35 | Ngày cập nhật | Có | Textarea (disabled) | Thời gian cập nhật cuối, hiển thị read-only |
| 36 | Cán bộ cập nhật | Không | Textarea (disabled) | Người cập nhật cuối, hiển thị read-only |
| 37 | Ngày gửi phê duyệt | Không | Textarea (disabled) | Thời gian gửi phê duyệt, hiển thị read-only |
| 38 | Cán bộ gửi phê duyệt | Không | Textarea (disabled) | Người gửi phê duyệt, hiển thị read-only |
| 39 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Không | Textarea (disabled) | Thời gian duyệt C1, hiển thị read-only |
| 40 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Không | Textarea (disabled) | Người duyệt C1, hiển thị read-only |
| 41 | Nội dung phê duyệt (C1) | Không | Textarea (disabled) | Nội dung duyệt C1, hiển thị read-only |
| 42 | Ngày phê duyệt cấp Cục | Không | Textarea (disabled) | Thời gian duyệt C2, hiển thị read-only |
| 43 | Cán bộ phê duyệt cấp Cục | Không | Textarea (disabled) | Người duyệt C2, hiển thị read-only |
| 44 | Nội dung phê duyệt (C2) | Không | Textarea (disabled) | Nội dung duyệt C2, hiển thị read-only |
| 45 | Trạng thái (Trạng thái phê duyệt) | Có | Select (Dropdown, disabled) | Trạng thái hiện tại, hiển thị read-only |
| 46 | Mã kế hoạch (vận hành) | Không | Text (read-only) | Mã kế hoạch vận hành, hiển thị read-only |
| 47 | Tên kế hoạch (vận hành) | Không | Text (read-only) | Tên kế hoạch vận hành, hiển thị read-only |
| 48 | Ngày bắt đầu (vận hành) | Không | Text (read-only) | Ngày bắt đầu vận hành, hiển thị read-only |
| 49 | Ngày kết thúc (vận hành) | Không | Text (read-only) | Ngày kết thúc vận hành, hiển thị read-only |
| 50 | Mã kế hoạch (bảo trì) | Không | Text (read-only) | Mã kế hoạch bảo trì, hiển thị read-only |
| 51 | Tên kế hoạch (bảo trì) | Không | Text (read-only) | Tên kế hoạch bảo trì, hiển thị read-only |
| 52 | Thời gian bắt đầu (bảo trì) | Không | Text (read-only) | Thời gian bắt đầu bảo trì, hiển thị read-only |
| 53 | Thời gian kết thúc (bảo trì) | Không | Text (read-only) | Thời gian kết thúc bảo trì, hiển thị read-only |
| 54 | Mã sự cố | Không | Text (read-only) | Mã sự cố, hiển thị read-only |
| 55 | Loại sự cố | Không | Text (read-only) | Loại sự cố, hiển thị read-only |
| 56 | Địa điểm sự cố | Không | Text (read-only) | Địa điểm sự cố, hiển thị read-only |
| 57 | Thời gian sự cố | Không | Text (read-only) | Thời gian sự cố, hiển thị read-only |

## 3. Trạng thái và phê duyệt

- Hiển thị badge trạng thái với 7 màu tương ứng 7 trạng thái NhaTramDenStatus:
  - **DRAFT** (0) — Màu xám nhạt
  - **PENDING_APPROVAL** (2) — Màu vàng
  - **APPROVED_L1** (3) — Màu xanh dương nhạt
  - **APPROVED_L2** (4) — Màu xanh dương đậm
  - **PUBLISHED** (5) — Màu xanh lá
  - **REJECTED** (6) — Màu đỏ
  - **DELETED** (7) — Màu xám đậm
- Hiển thị approvalLevel badge (Cấp 1 / Cấp 2) khi đã qua phê duyệt.
- Dữ liệu hiển thị read-only, không cho phép chỉnh sửa trực tiếp trên màn xem chi tiết.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-090-01 | Chỉ hiển thị bản ghi mà người dùng có quyền xem theo phân quyền RBAC | Read |
| BR-090-02 | Hiển thị badge trạng thái với màu tương ứng cho từng trạng thái NhaTramDenStatus | Read |
| BR-090-03 | Hiển thị approvalLevel badge (Cấp 1 / Cấp 2) khi bản ghi đã qua phê duyệt | Read |
| BR-090-04 | Hiển thị đầy đủ 57 trường thông tin theo đúng thứ tự Excel | Read |
| BR-090-05 | Tất cả trường hiển thị read-only, không cho phép chỉnh sửa trực tiếp | Read |
| BR-090-06 | Admin Cục xem thêm metadata: người tạo, người sửa cuối, thời gian tạo/cập nhật | Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-090-01** — Gửi request GET /api/v1/nhatram-den/{id} với id hợp lệ, hệ thống trả về đầy đủ 57 trường thông tin, HTTP 200.
- **AC-090-02** — Gửi request GET cho id không tồn tại, hệ thống trả về lỗi 404 Not Found.
- **AC-090-03** — Gửi request GET cho bản ghi DELETED, hệ thống trả về dữ liệu nhưng hiển thị badge \"Đã xóa\" màu xám đậm.
- **AC-090-04** — Người dùng không có quyền `nhatramden:detail` gửi request GET, hệ thống trả về lỗi 403 Forbidden.
- **AC-090-05** — Admin Cục nhận thêm trường metadata (createdByName, updatedByName, createdAt, updatedAt) trong response.

### 4.3. User Stories kế thừa (nếu có)

- **US-090-01:** Là cán bộ nghiệp vụ, tôi muốn xem toàn bộ thông tin chi tiết của một nhà trạm đèn để nắm rõ đặc điểm, vị trí và trạng thái phê duyệt.
- **US-090-02:** Là cán bộ phê duyệt, tôi muốn xem chi tiết nhà trạm đèn kèm thông tin log phê duyệt để ra quyết định duyệt/từ chối.
- **US-090-03:** Là lãnh đạo, tôi muốn xem thông tin nhà trạm đèn kèm metadata (người tạo, người sửa, thời gian) để kiểm tra nguồn gốc dữ liệu.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới nhà trạm đèn | `nhatramden:create` |
| Xem danh sách nhà trạm đèn | `nhatramden:read` |
| Xem chi tiết nhà trạm đèn | `nhatramden:detail` |
| Cập nhật nhà trạm đèn | `nhatramden:update` |
| Xóa nhà trạm đèn | `nhatramden:delete` |
| Phê duyệt nhà trạm đèn | `nhatramden:approve` |
| Xem lịch sử nhà trạm đèn | `nhatramden:history` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — NhaTramDenStatus: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED (7 trạng thái, 7 màu badge) |
| 2 | Có bước phê duyệt không | Có — Phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục), hiển thị approvalLevel badge |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị người dùng, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `nhatramden:detail` (xem chi tiết), `nhatramden:read` (xem danh sách) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — trường \"Danh sách file đính kèm\" hiển thị file đã upload, có thể xem/tải xuống |
| 8 | Giao diện khác mẫu chung | Có — Màn xem chi tiết bao gồm 57 trường theo 7 nhóm (cơ bản, nhà trạm, kỹ thuật đèn, GIS, file, log/phê duyệt, vận hành/bảo trì/sự cố), badge trạng thái 7 màu |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/nhatram-den` | Tạo mới nhà trạm đèn (draft hoặc submit) | `nhatramden:create` |
| GET | `/api/v1/nhatram-den` | Danh sách nhà trạm đèn (phân trang) | `nhatramden:read` |
| GET | `/api/v1/nhatram-den/{id}` | Xem chi tiết nhà trạm đèn | `nhatramden:detail` |
| PUT | `/api/v1/nhatram-den/{id}` | Cập nhật nhà trạm đèn | `nhatramden:update` |
| DELETE | `/api/v1/nhatram-den/{id}` | Xóa mềm nhà trạm đèn | `nhatramden:delete` |
| POST | `/api/v1/nhatram-den/{id}/approve` | Phê duyệt (C1/C2) | `nhatramden:approve` |
| POST | `/api/v1/nhatram-den/{id}/reject` | Từ chối phê duyệt | `nhatramden:approve` |
| GET | `/api/v1/nhatram-den/{id}/history` | Lịch sử thay đổi | `nhatramden:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `nha_tram_den` (Nhà trạm đèn):**

Kế thừa từ `BaseEntity` (id, createdAt, updatedAt, createdByName, updatedByName, deletedAt, deletedByName) + các trường sau:

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| code | VARCHAR(50) | Có | Mã nhà trạm đèn, unique |
| name | VARCHAR(200) | Có | Tên nhà trạm đèn |
| orgUnitId | UUID | Có | Đơn vị quản lý (data scope) |
| portId | UUID | Không | Thuộc cảng biển |
| operatingUnitId | UUID | Không | Đơn vị vận hành |
| province | VARCHAR(100) | Không | Địa điểm (Tỉnh/TP) |
| detailedLocation | TEXT | Không | Địa điểm chi tiết |
| status | SMALLINT | Có | Trạng thái (ApprovalStatus ordinal) |
| conditionId | INTEGER | Không | Tình trạng (AppParams) |
| lightType | VARCHAR(50) | Không | Chủng loại đèn chính |
| backupLightType | VARCHAR(50) | Không | Chủng loại đèn dự phòng |
| stationLevel | VARCHAR(50) | Không | Cấp trạm đèn |
| jurisdiction | TEXT | Không | Địa bàn |
| landmark | TEXT | Not null | Đặc điểm nhận dạng |
| shape | TEXT | Không | Hình dạng |
| towerHeight | DECIMAL(6,2) | Không | Chiều cao tháp đèn (m) |
| lightCenterHeight | DECIMAL(6,2) | Không | Chiều cao tâm sáng (m) |
| geoRange | VARCHAR(50) | Không | Tầm hiệu lực địa lý |
| lightRange | DECIMAL(6,2) | Không | Tầm hiệu lực ánh sáng (hải lý) |
| towerColor | TEXT | Không | Màu sắc tháp đèn |
| energySource | TEXT | Không | Nguồn năng lượng |
| commissioningDate | DATE | Không | Thời điểm đưa vào sử dụng |
| lastRepairDate | DATE | Không | Thời điểm sửa chữa gần nhất |
| 🔴 stationLocation | TEXT | Không | Địa điểm đặt trạm đèn |
| 🔴 structure | TEXT | Không | Kết cấu |
| 🔴 area | DECIMAL(10,2) | Không | Diện tích (m²) |
| 🔴 usableArea | DECIMAL(10,2) | Không | Diện tích sử dụng trạm đèn (m²) |
| 🔴 staffCount | VARCHAR(100) | Không | Số lượng nhân sự bố trí |
| 🔴 note | TEXT | Không | Ghi chú |
| objectTypeId | INTEGER | Không | Loại đối tượng (GIS) |
| iconId | INTEGER | Không | Biểu tượng (GIS) |
| crsId | INTEGER | Không | Hệ quy chiếu (GIS) |
| displayRuleId | INTEGER | Không | Quy tắc hiển thị (GIS) |
| coordinates | JSONB | Không | Tọa độ (GIS) |
| isActive | BOOLEAN | Có | Default true |

**Bảng `nha_tram_den_attachment` (Đính kèm nhà trạm đèn):** 🔴 mới

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | UUID | Primary key |
| nhaTramDenId | UUID | FK → nha_tram_den.id |
| fileName | VARCHAR(255) | Tên file |
| filePath | VARCHAR(500) | Đường dẫn lưu trữ |
| fileSize | BIGINT | Kích thước file (bytes) |
| uploadedBy | UUID | Người upload |
| uploadedAt | TIMESTAMP | Thời gian upload |
