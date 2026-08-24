---
id: F-091
name: "Quản lý Nhà trạm đèn - Lịch sử"
slug: quan-ly-nha-tram-den-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Nhà trạm đèn - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-091
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

Cho phép người dùng có quyền xem (operator, approver, admin, viewer) tra cứu lịch sử thay đổi của nhà trạm đèn dưới dạng danh sách phân trang hoặc timeline. Lịch sử ghi nhận mọi hành động: CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE. Mỗi bản ghi lịch sử chứa thông tin về hành động, người thực hiện, thời gian, trường thay đổi, giá trị cũ và giá trị mới. Dữ liệu lịch sử là read-only, không cho phép sửa/xóa.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn xem lịch sử (read-only):

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Ngày cập nhật | Có | Textarea (disabled) | Thời gian thay đổi (changedAt), hiển thị read-only |
| 2 | Cán bộ cập nhật | Không | Textarea (disabled) | Người thực hiện thay đổi (changedBy), hiển thị read-only |
| 3 | Ngày gửi phê duyệt | Không | Textarea (disabled) | Thời gian gửi phê duyệt (nếu có), hiển thị read-only |
| 4 | Cán bộ gửi phê duyệt | Không | Textarea (disabled) | Người gửi phê duyệt (nếu có), hiển thị read-only |
| 5 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Không | Textarea (disabled) | Thời gian duyệt C1 (nếu có), hiển thị read-only |
| 6 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Không | Textarea (disabled) | Người duyệt C1 (nếu có), hiển thị read-only |
| 7 | Nội dung phê duyệt (C1) | Không | Textarea (disabled) | Nội dung duyệt C1 (nếu có), hiển thị read-only |
| 8 | Ngày phê duyệt cấp Cục | Không | Textarea (disabled) | Thời gian duyệt C2 (nếu có), hiển thị read-only |
| 9 | Cán bộ phê duyệt cấp Cục | Không | Textarea (disabled) | Người duyệt C2 (nếu có), hiển thị read-only |
| 10 | Nội dung phê duyệt (C2) | Không | Textarea (disabled) | Nội dung duyệt C2 (nếu có), hiển thị read-only |
| 11 | Trạng thái (Trạng thái phê duyệt) | Có | Select (Dropdown, disabled) | Trạng thái sau thay đổi, hiển thị read-only |

> **Ghi chú:** Các trường \"Thông tin vận hành khai thác\", \"Thông tin bảo trì\", \"Thông tin sự cố\" là read-only, hiển thị trong màn xem chi tiết nhưng không phải trường nhập liệu của màn lịch sử. Màn lịch sử tập trung vào các trường log/phê duyệt.

## 3. Trạng thái và phê duyệt

- Lịch sử ghi nhận 6 loại hành động (actionType):
  - **CREATE** — Tạo mới nhà trạm đèn (từ DRAFT hoặc PENDING_APPROVAL).
  - **UPDATE** — Cập nhật thông tin nhà trạm đèn.
  - **APPROVE_L1** — Phê duyệt cấp Cảng vụ/Chi cục (PENDING_APPROVAL → APPROVED_L1).
  - **APPROVE_L2** — Phê duyệt cấp Cục (APPROVED_L1 → APPROVED_L2 → PUBLISHED).
  - **REJECT** — Từ chối phê duyệt ở bất kỳ cấp nào (chuyển sang REJECTED).
  - **SOFT_DELETE** — Xóa mềm nhà trạm đèn (chuyển sang DELETED).
- Dữ liệu lịch sử sắp xếp theo thời gian giảm dần (changedAt DESC).
- Hỗ trợ phân trang (mặc định 20 bản ghi/trang).
- Dữ liệu lịch sử là read-only, không cho phép sửa/xóa bản ghi lịch sử.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-091-01 | Lịch sử chỉ đọc (read-only) — không thể sửa/xóa bản ghi lịch sử | History |
| BR-091-02 | Chỉ hiển thị lịch sử của nhà trạm đèn mà người dùng có quyền xem theo phân quyền RBAC | History |
| BR-091-03 | Hỗ trợ lọc theo: entityId, actionType, changedBy, khoảng thời gian (from/to) | History |
| BR-091-04 | Sắp xếp mặc định theo thời gian giảm dần (changedAt DESC) | History |
| BR-091-05 | Phân trang mặc định 20 bản ghi/trang, hỗ trợ tùy chọn 20/50/100 | History |
| BR-091-06 | Admin Cục xem thêm metadata: operatorId, deletedAt, deletedByName | History |
| BR-091-07 | diffData dạng JSON cho các thay đổi phức tạp (đối tượng lồng nhau) | History |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-091-01** — Gửi request GET /api/v1/nhatram-den/{id}/history không có filter, hệ thống trả về danh sách tất cả lịch sử nhà trạm đèn (phân trang, mặc định 20 bản ghi), HTTP 200.
- **AC-091-02** — Gửi request GET với actionType=UPDATE, hệ thống trả về lịch sử chỉ gồm các hành động cập nhật.
- **AC-091-03** — Gửi request GET với entityId cụ thể, hệ thống trả về lịch sử chỉ của nhà trạm đèn đó.
- **AC-091-04** — Gửi request GET với from/to, hệ thống trả về lịch sử trong khoảng thời gian chỉ định.
- **AC-091-05** — Gửi request GET với actionType=CREATE, hệ thống trả về bản ghi CREATE ban đầu với đầy đủ diffData.
- **AC-091-06** — Gửi request GET cho id không tồn tại, hệ thống trả về danh sách rỗng (không lỗi 404).

### 4.3. User Stories kế thừa (nếu có)

- **US-091-01:** Là cán bộ nghiệp vụ, tôi muốn xem lịch sử thay đổi của nhà trạm đèn để theo dõi ai đã sửa gì và khi nào.
- **US-091-02:** Là cán bộ phê duyệt, tôi muốn xem lịch sử phê duyệt (ai duyệt, khi nào, nội dung) để kiểm tra tính hợp lệ của quy trình.
- **US-091-03:** Là lãnh đạo, tôi muốn lọc lịch sử theo khoảng thời gian và người thực hiện để kiểm toán dữ liệu.

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

**Admin Cục:** Full quyền + xem thêm metadata operatorId, deletedAt, deletedByName trong bản ghi lịch sử (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — NhaTramDenStatus: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED (7 trạng thái) |
| 2 | Có bước phê duyệt không | Có — Phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục), lịch sử ghi nhận APPROVE_L1, APPROVE_L2, REJECT |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị người dùng, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `nhatramden:history` (xem lịch sử), `nhatramden:read` (xem danh sách) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — Lịch sử hiển thị dạng timeline với diffData JSON, badge actionType màu (CREATE=xanh lá, UPDATE=xanh dương, APPROVE_L1=vàng, APPROVE_L2=tím, REJECT=đỏ, SOFT_DELETE=xám) |

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

**Bảng `nha_tram_den_history` (Lịch sử nhà trạm đèn):** 🔴 mới

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | UUID | Primary key |
| nhaTramDenId | UUID | FK → nha_tram_den.id |
| actionType | VARCHAR(20) | CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE |
| changedBy | UUID | Người thực hiện thay đổi |
| changedAt | TIMESTAMP | Thời gian thay đổi |
| changedByName | VARCHAR(200) | Tên người thực hiện |
| changedField | VARCHAR(200) | Trường thay đổi (nếu UPDATE) |
| previousValue | JSONB | Giá trị cũ |
| newValue | JSONB | Giá trị mới |
| diffData | JSONB | Diff chi tiết (đối tượng lồng nhau) |
| approvalLevel | SMALLINT | Cấp phê duyệt (1=Cảng vụ, 2=Cục) |
| approvalContent | TEXT | Nội dung phê duyệt/từ chối |
| rejectionReason | TEXT | Lý do từ chối |
| operatorId | UUID | Operator ID (Admin Cục xem được) |
| deletedAt | TIMESTAMP | Thời gian xóa mềm (nếu SOFT_DELETE) |
| deletedByName | VARCHAR(200) | Tên người xóa mềm |
