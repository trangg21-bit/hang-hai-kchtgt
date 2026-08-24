---
id: F-083
name: Phê duyệt Nhà trạm phao
slug: phe-duyet-nha-tram-phao
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:42Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Nhà trạm phao

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-083
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt — phê duyệt 2 cấp (C1: Cảng vụ/Chi cục, C2: Cục)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`, sheet `QL Nhà trạm phao tiêu`)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép người phê duyệt (approver) duyệt hoặc từ chối nhà trạm phao đang trong trạng thái chờ phê duyệt (PENDING_APPROVAL). Quy trình phê duyệt 2 cấp: Cấp 1 (Cảng vụ/Chi cục) chuyển trạng thái từ PENDING_APPROVAL → APPROVED_L1; Cấp 2 (Cục) chuyển từ APPROVED_L1 → APPROVED_L2 → PUBLISHED. Người phê duyệt phải nhập lý do phê duyệt/từ chối. Hệ thống ghi nhận lịch sử thay đổi (audit log) cho mọi hành động phê duyệt.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form phê duyệt (nguồn: Excel sheet `QL Nhà trạm phao tiêu`, cột "Xem chi tiết" — các trường trạng thái & kiểm toán):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Trạng thái | Có | Badge (read-only) — hiển thị trạng thái hiện tại | PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED |
| 2 | Lý do phê duyệt/từ chối | Có | InputTextArea — người phê duyệt nhập lý do | Bắt buộc khi duyệt hoặc từ chối |
| 3 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Không | Text (read-only) — hệ thống tự ghi | Cấp 1 |
| 4 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Không | Text (read-only) — hệ thống tự ghi | Cấp 1 |
| 5 | Nội dung phê duyệt cấp Cảng vụ/Chi cục | Không | Text (read-only) — từ lý do phê duyệt | Cấp 1 |
| 6 | Ngày phê duyệt cấp Cục | Không | Text (read-only) — hệ thống tự ghi | Cấp 2 |
| 7 | Cán bộ phê duyệt cấp Cục | Không | Text (read-only) — hệ thống tự ghi | Cấp 2 |
| 8 | Nội dung phê duyệt cấp Cục | Không | Text (read-only) — từ lý do phê duyệt | Cấp 2 |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- **Quy trình phê duyệt 2 cấp:**
  - **Cấp 1 (Cảng vụ/Chi cục):** PENDING_APPROVAL (2) → APPROVED_L1 (3)
  - **Cấp 2 (Cục):** APPROVED_L1 (3) → APPROVED_L2 (4) → PUBLISHED (5)
- **Từ chối:** Ở bất kỳ cấp nào, người phê duyệt có thể từ chối → REJECTED (6)
- Khi từ chối, người phê duyệt **bắt buộc** nhập lý do từ chối.
- Nhà trạm phao bị từ chối có thể được chỉnh sửa lại và gửi phê duyệt lại (F-081 → F-080 submit).
- `approvalLevel` (ApprovalLevel enum: LEVEL_0, LEVEL_1, LEVEL_2) theo dõi cấp đã duyệt.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-083-01 | Chỉ phê duyệt được nhà trạm phao có status=PENDING_APPROVAL hoặc APPROVED_L1 | Approve |
| BR-083-02 | Cấp 1 (Cảng vụ/Chi cục) chỉ duyệt từ PENDING_APPROVAL → APPROVED_L1 | Approve |
| BR-083-03 | Cấp 2 (Cục) chỉ duyệt từ APPROVED_L1 → APPROVED_L2 → PUBLISHED | Approve |
| BR-083-04 | Lý do phê duyệt/từ chối bắt buộc — không được để trống | Approve/Reject |
| BR-083-05 | Không thể tự duyệt — người tạo không được là người phê duyệt (4-eyes principle) | Approve |
| BR-083-06 | Khi từ chối, hệ thống chuyển status=REJECTED và ghi rejectionReason | Reject |
| BR-083-07 | Khi duyệt, hệ thống ghi audit log với actionType=APPROVE_L1 hoặc APPROVE_L2 | Approve |
| BR-083-08 | Người phê duyệt phải có quyền `nhatramphao:approve` | Approve |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-083-01** — Duyệt cấp 1 thành công: hệ thống chuyển status=APPROVED_L1, ghi approvalLevel=LEVEL_1, changedBy, changedAt, trả về HTTP 200.
- **AC-083-02** — Duyệt cấp 2 thành công: hệ thống chuyển status=APPROVED_L2 → PUBLISHED, ghi approvalLevel=LEVEL_2, trả về HTTP 200.
- **AC-083-03** — Từ chối thành công: hệ thống chuyển status=REJECTED, ghi rejectionReason, trả về HTTP 200.
- **AC-083-04** — Bỏ trống lý do phê duyệt/từ chối: hệ thống hiển thị lỗi validation tiếng Việt, không lưu.
- **AC-083-05** — Tự duyệt (người tạo = người phê duyệt): hệ thống trả về HTTP 403 Forbidden.
- **AC-083-06** — Phê duyệt nhà trạm phao không đúng trạng thái: hệ thống trả về HTTP 400 + thông báo lỗi.

### 4.3. User Stories kế thừa (nếu có)

- **US-083-01:** Là người phê duyệt cấp Cảng vụ/Chi cục, tôi muốn duyệt hoặc từ chối nhà trạm phao đang chờ phê duyệt để đẩy nhanh quy trình quản lý.
- **US-083-02:** Là người phê duyệt cấp Cục, tôi muốn duyệt nhà trạm phao đã được cấp Cảng vụ/Chi cục phê duyệt để hoàn tất quy trình.
- **US-083-03:** Là người phê duyệt, tôi muốn nhập lý do từ chối để người tạo biết nguyên nhân và chỉnh sửa lại.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Phê duyệt cấp 1 (Cảng vụ/Chi cục) | `nhatramphao:approve_l1` |
| Phê duyệt cấp 2 (Cục) | `nhatramphao:approve_l2` |
| Từ chối | `nhatramphao:reject` |

**Admin Cục:** Full quyền phê duyệt ở cả 2 cấp + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED → REJECTED |
| 2 | Có bước phê duyệt không | Có — 2 cấp: C1 (Cảng vụ/Chi cục), C2 (Cục) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — người phê duyệt chỉ duyệt nhà trạm phao thuộc đơn vị mình quản lý hoặc đơn vị con |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Lý do phê duyệt cấp Cục chỉ hiện sau khi cấp 1 đã duyệt |
| 5 | Quyền riêng | `nhatramphao:approve_l1`, `nhatramphao:approve_l2`, `nhatramphao:reject` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không — dùng chung popup phê duyệt từ list-view/ |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/nhatram-phao/{id}/approve` | Phê duyệt nhà trạm phao (cấp 1 hoặc 2) | `nhatramphao:approve_l1` hoặc `nhatramphao:approve_l2` |
| POST | `/api/v1/nhatram-phao/{id}/reject` | Từ chối nhà trạm phao | `nhatramphao:reject` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `nha_tram_phao` (Nhà trạm phao):**
- `id` UUID PK
- `code` VARCHAR UNIQUE (NT-{seq})
- `name` VARCHAR NOT NULL
- `orgUnitId` UUID NOT NULL FK (đơn vị quản lý)
- `operatingUnitId` UUID FK (đơn vị khai thác)
- `portId` UUID FK (thuộc cảng biển)
- `navigationChannelId` UUID FK (thuộc luồng hàng hải)
- `channelRouteId` UUID FK (tuyến luồng hàng hải)
- `locationProvince` VARCHAR
- `locationDetail` TEXT
- `constructionDate` DATE
- `status` SMALLINT NOT NULL DEFAULT 0 (DRAFT)
- `condition` VARCHAR NOT NULL (tình trạng)
- `totalArea` DECIMAL(10,2)
- `usableArea` DECIMAL(10,2)
- `staffCount` INT
- `lastMaintenanceYear` INT
- `notes` TEXT
- `objectType` VARCHAR (Điểm/Đường/Vùng)
- `symbol` VARCHAR
- `coordinateSystem` VARCHAR DEFAULT 'WGS84'
- `displayRule` TEXT
- `gisCoordinates` GEOMETRY (Point/Polygon/LineString)
- `approvalLevel` SMALLINT DEFAULT 0 (LEVEL_0) 🔴
- `approvedByL1` UUID FK 🔴
- `approvedAtL1` TIMESTAMP 🔴
- `approvalNoteL1` TEXT 🔴
- `approvedByL2` UUID FK 🔴
- `approvedAtL2` TIMESTAMP 🔴
- `approvalNoteL2` TEXT 🔴
- `rejectionReason` TEXT 🔴
- `createdBy` UUID FK
- `createdAt` TIMESTAMP NOT NULL
- `updatedBy` UUID FK
- `updatedAt` TIMESTAMP
- `deletedAt` TIMESTAMP (soft-delete)

**Bảng `nha_tram_phao_history` (Lịch sử nhà trạm phao):**
- `id` UUID PK 🔴
- `nhaTramPhaoId` UUID NOT NULL FK 🔴
- `actionType` VARCHAR NOT NULL (CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE) 🔴
- `changedField` VARCHAR 🔴
- `previousValue` TEXT 🔴
- `newValue` TEXT 🔴
- `changedBy` UUID NOT NULL FK 🔴
- `changedAt` TIMESTAMP NOT NULL 🔴
- `reason` TEXT 🔴
- `diffData` JSONB 🔴
