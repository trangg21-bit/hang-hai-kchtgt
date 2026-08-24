---
id: F-089
name: "Phê duyệt Nhà trạm đèn"
slug: phe-duyet-nha-tram-den
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Nhà trạm đèn

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-089
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

Cho phép cấp phê duyệt (Cảng vụ/Chi cục và Cục) xem xét, phê duyệt hoặc từ chối hồ sơ nhà trạm đèn đã được gửi. Quy trình phê duyệt 2 cấp: Cấp 1 (Cảng vụ/Chi cục) duyệt từ PENDING_APPROVAL → APPROVED_L1; Cấp 2 (Cục) duyệt từ APPROVED_L1 → APPROVED_L2 → PUBLISHED. Mỗi cấp có thể chấp thuận hoặc từ chối kèm lý do. Toàn bộ quá trình được ghi nhận trong nhật ký lịch sử.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form phê duyệt/từ chối:

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Nội dung phê duyệt | Không | TextArea, tối đa 1000 ký tự | Nhận xét, ghi chú của cấp phê duyệt (tùy chọn) |
| 2 | Lý do từ chối | Có (nếu từ chối) | TextArea, tối đa 1000 ký tự | Bắt buộc khi chọn \"Từ chối\" |

> **Ghi chú:** Các trường \"Thông tin log cập nhật\" (ngày cập nhật, cán bộ cập nhật), \"Thông tin vận hành khai thác\", \"Thông tin bảo trì\", \"Thông tin sự cố\" là read-only, hiển thị trong màn xem chi tiết nhưng không phải trường nhập liệu của form phê duyệt.

## 3. Trạng thái và phê duyệt

- Quy trình phê duyệt 2 cấp theo `ba/00-lean-spec.md` mục 3.7:
  - **DRAFT** (0) — Chưa gửi phê duyệt, không áp dụng phê duyệt.
  - **PENDING_APPROVAL** (2) — Chờ phê duyệt cấp Cảng vụ/Chi cục (Cấp 1).
  - **APPROVED_L1** (3) — Đã được Cảng vụ/Chi cục phê duyệt, chờ phê duyệt cấp Cục (Cấp 2).
  - **APPROVED_L2** (4) — Đã được Cục phê duyệt.
  - **PUBLISHED** (5) — Đã đưa vào sử dụng chính thức.
  - **REJECTED** (6) — Bị từ chối ở bất kỳ cấp nào.
  - **DELETED** (7) — Đã xóa mềm.
- **Cấp 1 (Cảng vụ/Chi cục):**
  - Chỉ duyệt bản ghi có trạng thái PENDING_APPROVAL.
  - Phê duyệt → chuyển sang APPROVED_L1.
  - Từ chối → chuyển sang REJECTED, bắt buộc nhập lý do từ chối.
- **Cấp 2 (Cục):**
  - Chỉ duyệt bản ghi có trạng thái APPROVED_L1.
  - Phê duyệt → chuyển sang APPROVED_L2 → PUBLISHED.
  - Từ chối → chuyển sang REJECTED, bắt buộc nhập lý do từ chối.
- Khi từ chối, bản ghi quay về trạng thái REJECTED và có thể được tạo lại hoặc sửa lại từ feature F-086/F-087.
- Trạng thái lưu dạng số trong DB (ApprovalStatus enum ordinal), không lưu chữ.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-089-01 | Chỉ cấp Cảng vụ/Chi cục mới được duyệt bản ghi ở trạng thái PENDING_APPROVAL | Approve C1 |
| BR-089-02 | Chỉ cấp Cục mới được duyệt bản ghi ở trạng thái APPROVED_L1 | Approve C2 |
| BR-089-03 | Không cho phép tự duyệt (4-eyes principle): người gửi phê duyệt không được là người phê duyệt cùng cấp | Approve C1/C2 |
| BR-089-04 | Lý do từ chối là bắt buộc khi chọn \"Từ chối\" | Reject |
| BR-089-05 | Nội dung phê duyệt là tùy chọn, có thể để trống | Approve |
| BR-089-06 | Khi từ chối ở Cấp 1, chuyển ngay sang REJECTED; khi từ chối ở Cấp 2, chuyển ngay sang REJECTED | Reject |
| BR-089-07 | Khi phê duyệt Cấp 2 thành công, tự động chuyển từ APPROVED_L2 → PUBLISHED | Approve C2 |
| BR-089-08 | Ghi nhật ký lịch sử hành động APPROVE_L1, APPROVE_L2, hoặc REJECT với approverId, approvedAt/rejectedAt, nội dung phê duyệt/lý do từ chối | Approve/Reject |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-089-01** — Gửi request POST approve cho bản ghi PENDING_APPROVAL từ approver_L1, hệ thống chuyển sang APPROVED_L1, trả về HTTP 200.
- **AC-089-02** — Gửi request POST approve cho bản ghi APPROVED_L1 từ approver_L2, hệ thống chuyển sang PUBLISHED, trả về HTTP 200.
- **AC-089-03** — Gửi request POST reject cho bản ghi PENDING_APPROVAL với lý do từ chối, hệ thống chuyển sang REJECTED, trả về HTTP 200.
- **AC-089-04** — Gửi request POST reject cho bản ghi PENDING_APPROVAL không có lý do từ chối, hệ thống trả về lỗi validation HTTP 400.
- **AC-089-05** — Người gửi phê duyệt không thể tự phê duyệt bản ghi của mình (4-eyes principle), hệ thống trả về lỗi 403 Forbidden.
- **AC-089-06** — Gửi request approve cho bản ghi có trạng thái không phù hợp (vd: DRAFT, DELETED), hệ thống trả về lỗi 400 Bad Request.

### 4.3. User Stories kế thừa (nếu có)

- **US-089-01:** Là cán bộ phê duyệt cấp Cảng vụ/Chi cục, tôi muốn xem xét và phê duyệt/từ chối hồ sơ nhà trạm đèn để kiểm soát chất lượng dữ liệu.
- **US-089-02:** Là cán bộ phê duyệt cấp Cục, tôi muốn xem xét và phê duyệt/từ chối hồ sơ nhà trạm đèn đã được Cảng vụ/Chi cục phê duyệt để hoàn tất quy trình.
- **US-089-03:** Là cán bộ phê duyệt, tôi muốn bắt buộc nhập lý do từ chối để người tạo hồ sơ hiểu rõ nguyên do và có thể điều chỉnh.

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

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật + phê duyệt mọi bản ghi (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — NhaTramDenStatus: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED (7 trạng thái) |
| 2 | Có bước phê duyệt không | Có — Phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục), mỗi cấp có approve/reject riêng |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị người dùng, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — \"Lý do từ chối\" chỉ bắt buộc khi chọn \"Từ chối\"; \"Nội dung phê duyệt\" luôn tùy chọn |
| 5 | Quyền riêng | `nhatramden:approve` (phê duyệt), `nhatramden:read` (xem hồ sơ để duyệt) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — Popup phê duyệt/từ chối với trường lý do từ chối (bắt buộc khi reject), badge trạng thái 7 màu |

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
