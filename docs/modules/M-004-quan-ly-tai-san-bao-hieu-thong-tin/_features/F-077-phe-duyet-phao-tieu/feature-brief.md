---
id: F-077
name: "Phê duyệt Phao tiêu"
slug: phe-duyet-phao-tieu
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Phao tiêu

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-077
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT) + Excel `HH_Tính năng & danh sách các trường thông tin.xlsx` sheet "QL Phao tiêu"

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Quản lý quy trình phê duyệt 2 cấp cho phao tiêu: (1) Gửi phê duyệt — operator gửi phao tiêu từ trạng thái DRAFT lên PENDING_APPROVAL; (2) Phê duyệt L1 — approver_L1 xem xét và phê duyệt cấp 1, đưa lên APPROVED_L1; (3) Phê duyệt L2 — approver_L2 phê duyệt cấp cuối, đưa lên PUBLISHED và đồng bộ lên GIS M-007; (4) Từ chối — bất kỳ approver nào cũng có thể từ chối với lý do ≥ 10 ký tự, đưa về DRAFT. Người phê duyệt không thể tự phê duyệt bản ghi do chính mình tạo. Mỗi bước đều ghi lịch sử và gửi thông báo.

## 2. Trường dữ liệu

Bảng mô tả các trường liên quan đến quy trình phê duyệt trên form/phê duyệt phao tiêu:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Lý do từ chối | Có | TextArea, tối thiểu 10 ký tự | BR-012; bắt buộc khi từ chối |
| 2 | Trạng thái hiện tại | Không | Badge (read-only) | Hiển thị trạng thái trước khi thao tác — BR-010, BR-011 |
| 3 | Người tạo (creatorId) | Không | Text (read-only) | Dùng để kiểm tra self-approval — BR-014 |
| 4 | Ngày gửi phê duyệt | Không | Text (read-only) | Tự động điền khi gửi — Excel row 45 |
| 5 | Cán bộ gửi phê duyệt | Không | Text (read-only) | Tự động điền khi gửi — Excel row 46 |
| 6 | Ngày phê duyệt cấp Cảng vụ/Chi cục (L1) | Không | Text (read-only) | Điền sau khi approve L1 — Excel row 47 |
| 7 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục (L1) | Không | Text (read-only) | Điền sau khi approve L1 — Excel row 48 |
| 8 | Nội dung phê duyệt L1 | Không | Text (read-only) | Ghi chú phê duyệt — Excel row 49 |
| 9 | Ngày phê duyệt cấp Cục (L2) | Không | Text (read-only) | Điền sau khi approve L2 — Excel row 50 |
| 10 | Cán bộ phê duyệt cấp Cục (L2) | Không | Text (read-only) | Điền sau khi approve L2 — Excel row 51 |
| 11 | Nội dung phê duyệt L2 | Không | Text (read-only) | Ghi chú phê duyệt — Excel row 52 |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Enum `ApprovalStatus`: DRAFT(0) → PROPOSED(1) → PENDING_APPROVAL(2) → APPROVED_LEVEL1(3) → APPROVED_LEVEL2(4) → APPROVED(5) → REJECTED(6).
- Enum `ApprovalLevel`: NONE(0), L1(1), L2(2).
- Quy trình phê duyệt 2 cấp:
  1. **Gửi phê duyệt** (POST `/api/buoys/{id}/submit-approval`): Operator gửi từ DRAFT → PENDING_APPROVAL. Chỉ thực hiện được khi status = DRAFT.
  2. **Phê duyệt L1** (POST `/api/buoys/{id}/approve-l1`): Approver_L1 phê duyệt từ PENDING_APPROVAL → APPROVED_LEVEL1.
  3. **Phê duyệt L2** (POST `/api/buoys/{id}/approve-l2`): Approver_L2 phê duyệt từ APPROVED_LEVEL1 → APPROVED_LEVEL2 → PUBLISHED. Sau khi duyệt L2, tự động đồng bộ lên GIS M-007 qua `PointObjectSyncService.syncToMapBuoy()`.
  4. **Từ chối** (POST `/api/buoys/{id}/reject`): Bất kỳ approver nào cũng có thể từ chối với lý do ≥ 10 ký tự → quay về DRAFT.
- Người phê duyệt không thể phê duyệt bản ghi do chính mình tạo (BR-014).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-077-01 | Gửi phê duyệt chỉ thực hiện được khi status = DRAFT | Submit |
| BR-077-02 | Phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL | Approve L1 — BR-010 |
| BR-077-03 | Phê duyệt L2 yêu cầu entity đã được phê duyệt L1 (APPROVED_LEVEL1) | Approve L2 — BR-011 |
| BR-077-04 | Từ chối yêu cầu lý do từ chối tối thiểu 10 ký tự | Reject — BR-012 |
| BR-077-05 | Sau khi phê duyệt L2, Buoy được đồng bộ lên GIS M-007 | Approve L2 — BR-013 |
| BR-077-06 | Người phê duyệt không thể phê duyệt bản ghi do chính mình tạo (creatorId != approverId) | Mọi bước approve — BR-014 |
| BR-077-07 | Trạng thái khởi tạo mặc định là DRAFT | Create — BR-015 |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-077-01** — Gửi phê duyệt thành công: Operator gửi phao tiêu ở trạng thái DRAFT → chuyển sang PENDING_APPROVAL, ghi lịch sử SUBMIT. Khi lỗi: hiển thị thông báo "Không thể gửi phê duyệt — phao tiêu không ở trạng thái DRAFT".
- **AC-077-02** — Phê duyệt L1 thành công: Approver_L1 phê duyệt phao tiêu ở trạng thái PENDING_APPROVAL → chuyển sang APPROVED_LEVEL1. Khi lỗi: hiển thị thông báo "Phao tiêu không ở trạng thái chờ phê duyệt".
- **AC-077-03** — Phê duyệt L1 bị chặn self-approval: Approver_L1 không thể phê duyệt phao tiêu do chính mình tạo → trả về lỗi 403 "Bạn không thể phê duyệt bản ghi do chính mình tạo".
- **AC-077-04** — Phê duyệt L2 thành công: Approver_L2 phê duyệt phao tiêu ở trạng thái APPROVED_LEVEL1 → chuyển sang APPROVED_LEVEL2/PUBLISHED và đồng bộ lên GIS M-007. Khi lỗi: hiển thị thông báo "Phao tiêu chưa được phê duyệt cấp 1".
- **AC-077-05** — Từ chối với lý do đủ dài: Lý do ≥ 10 ký tự → phao tiêu quay về DRAFT, ghi lịch sử REJECT. Khi lỗi: hiển thị thông báo "Từ chối thành công".
- **AC-077-06** — Từ chối với lý do quá ngắn: Lý do < 10 ký tự → bị từ chối với lỗi validate "Lý do từ chối phải có ít nhất 10 ký tự".

### 4.3. User Stories kế thừa (nếu có)

- **US-077-01:** Là operator, tôi muốn gửi phao tiêu đi phê duyệt để người quản lý cấp 1 và cấp 2 xem xét.
- **US-077-02:** Là approver_L1, tôi muốn phê duyệt/từ chối phao tiêu ở cấp Cảng vụ/Chi cục để kiểm tra chất lượng dữ liệu.
- **US-077-03:** Là approver_L2, tôi muốn phê duyệt cuối cùng ở cấp Cục để công bố dữ liệu lên bản đồ hàng hải.
- **US-077-04:** Là admin, tôi muốn xem toàn bộ lịch sử phê duyệt (ai, khi nào, kết quả) để phục vụ thanh tra.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Gửi phê duyệt | `buoy:submit-approval` |
| Phê duyệt L1 | `buoy:approve-l1` |
| Phê duyệt L2 | `buoy:approve-l2` |
| Từ chối | `buoy:reject` |
| Xem lịch sử phê duyệt | `buoy:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (ngày gửi phê duyệt, cán bộ gửi, ngày phê duyệt L1/L2, cán bộ phê duyệt L1/L2, nội dung phê duyệt).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp: L1 (Cảng vụ/Chi cục) + L2 (Cục), đồng bộ GIS khi duyệt L2 |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (Excel row 3), filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `buoy:submit-approval`, `buoy:approve-l1`, `buoy:approve-l2`, `buoy:reject` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (Excel row 39-40) hiển thị ở chi tiết, không ảnh hưởng phê duyệt |
| 8 | Giao diện khác mẫu chung | Không — dùng chung ScreenHeader + FilterBar + StatusTabs + DataTable + Pagination |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/buoys/{id}/submit-approval` | Gửi phao tiêu đi phê duyệt (DRAFT → PENDING_APPROVAL) | `buoy:submit-approval` |
| POST | `/api/buoys/{id}/approve-l1` | Phê duyệt cấp 1 (PENDING_APPROVAL → APPROVED_LEVEL1) | `buoy:approve-l1` |
| POST | `/api/buoys/{id}/approve-l2` | Phê duyệt cấp 2 (APPROVED_LEVEL1 → APPROVED_LEVEL2/PUBLISHED + sync GIS) | `buoy:approve-l2` |
| POST | `/api/buoys/{id}/reject` | Từ chối phao tiêu (→ DRAFT, cần lý do ≥ 10 ký tự) | `buoy:reject` |
| GET | `/api/buoys/{id}` | Xem chi tiết phao tiêu (bao gồm thông tin phê duyệt) | `buoy:read` |
| GET | `/api/beacon-history?type=BUOY&entityId={id}` | Xem lịch sử thao tác trên phao tiêu | `buoy:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `buoy` (Phao tiêu):**

- `id` (UUID, PK)
- `code` (VARCHAR(50), UNIQUE, tự sinh `{mã nhà trạm}-PT-{seq}`)
- `name` (VARCHAR(200), NOT NULL)
- `type` (SMALLINT, BuoyType enum: CARDINAL/SECTOR/SPECIAL/SAFE_WATER/ISOLATED_DANGER)
- `subtype` (SMALLINT, Phân loại phao/tiêu — SelectAppParams)
- `orgUnitId` (UUID, NOT NULL khi tạo) — Excel row 3
- `nhaTramId` (UUID, FK nha_tram_phao) — Excel row 4
- `address` (VARCHAR(500)) — Excel row 10
- `addressDetail` (TEXT) — Excel row 11
- `status` (SMALLINT, BeaconStatus enum)
- `approvalStatus` (SMALLINT, ApprovalStatus enum)
- `approvalLevel` (SMALLINT, ApprovalLevel enum)
- `shape` (VARCHAR(50)) — Excel row 14
- `structure` (TEXT) — Excel row 15
- `area` (DECIMAL) — Excel row 16
- `height` (DECIMAL) — Excel row 17
- `diameter` (DECIMAL) — Excel row 18
- `lightType` (SMALLINT, SelectAppParams) — Excel row 19
- `towerHeight` (DECIMAL) — Excel row 20
- `lightCenterHeight` (DECIMAL, NOT NULL) — Excel row 21
- `lightSpecies` (VARCHAR(100)) — Excel row 22
- `towerColor` (TEXT) — Excel row 23
- `lightPowerSource` (TEXT) — Excel row 24
- `lightRange` (DECIMAL, 0.01–100.0) — Excel row 25
- `commissionDate` (DATE) — Excel row 27
- `lastRepairDate` (DATE) — Excel row 28
- `lightCharacteristic` (TEXT) — Excel row 29
- `color` (VARCHAR(50)) — Excel row 30
- `flashType` (VARCHAR(100)) — Excel row 31
- `flashPeriod` (VARCHAR(100)) — Excel row 32
- `geometryType` (VARCHAR(20), Point/LineString/Polygon) — Excel row 35
- `geometry` (GEOMETRY, WGS84) — Excel row 34
- `symbolId` (UUID, FK) — Excel row 36
- `crs` (VARCHAR(50)) — Excel row 37
- `displayRule` (TEXT) — Excel row 38
- `creatorId` (UUID, FK)
- `approverL1Id` (UUID, FK) — Excel row 48
- `approverL2Id` (UUID, FK) — Excel row 51
- `submittedAt` (TIMESTAMP) — Excel row 45
- `submittedById` (UUID, FK) — Excel row 46
- `approvedL1At` (TIMESTAMP) — Excel row 47
- `approvedL2At` (TIMESTAMP) — Excel row 50
- `rejectionReason` (TEXT)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)
- `deletedAt` (TIMESTAMP, soft-delete)

**Bảng `beacon_history` (Lịch sử thao tác):**

- `id` (UUID, PK)
- `entityId` (UUID, FK → buoy.id)
- `beaconType` (VARCHAR(50), cố định = 'BUOY')
- `actionType` (VARCHAR(50): CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE/SUBMIT)
- `changedField` (TEXT, danh sách trường thay đổi khi UPDATE)
- `previousValue` (JSON)
- `newValue` (JSON)
- `changedBy` (UUID, FK)
- `changedAt` (TIMESTAMP)
- `rejectionReason` (TEXT, khi actionType = REJECT)
