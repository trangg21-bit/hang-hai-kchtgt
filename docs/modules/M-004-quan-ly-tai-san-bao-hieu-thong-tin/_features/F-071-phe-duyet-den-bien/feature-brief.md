---
id: F-071
name: "Phê duyệt Đèn biển"
slug: phe-duyet-den-bien
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:17Z"
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Đèn biển

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-071
**Module:** M-004 — Quản lý tài sản báo hiệu thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Quản lý quy trình phê duyệt 2 cấp cho đèn biển, bao gồm 4 thao tác: (1) Gửi phê duyệt — operator gửi đèn biển từ DRAFT lên PENDING_APPROVAL; (2) Phê duyệt L1 — approver_L1 xem xét và phê duyệt cấp 1, đưa lên APPROVED_L1; (3) Phê duyệt L2 — approver_L2 phê duyệt cấp cuối, đưa lên PUBLISHED và đồng bộ lên GIS M-007; (4) Từ chối — bất kỳ approver nào cũng có thể từ chối với lý do, đưa về DRAFT. Quy trình đảm bảo mọi thay đổi thông tin đèn biển đều được kiểm duyệt trước khi công bố.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã đèn biển | Input (disabled) | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 2 | Tên đèn biển | InputTextArea | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 3 | Đơn vị quản lý | SelectOrgCode | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 4 | Thuộc cảng biển | SelectKcht (CB) | Không | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 5 | Đơn vị vận hành | SelectCateOther | Không | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 6 | Địa điểm (Tỉnh/TP) | SelectCateOther | Không | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 7 | Địa điểm chi tiết | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 8 | Tình trạng | SelectAppParams | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 9 | Chủng loại đèn chính | Input | Không | Không | Có | Có | Có | Không | Immutable, không cho sửa |
| 10 | Chủng loại đèn dự phòng | Input | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 11 | Cấp trạm đèn | SelectAppParams | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 12 | Địa bàn | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 13 | Đặc điểm nhận dạng | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 14 | Hình dạng | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 15 | Chiều cao tháp đèn (m) | InputDecimal | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 16 | Chiều cao tâm sáng (m) | InputDecimal | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 17 | Tầm hiệu lực địa lý | Input | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 18 | Tầm hiệu lực ánh sáng | Input | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 19 | Màu sắc tháp đèn | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 20 | Nguồn năng lượng | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 21 | Thời điểm đưa vào sử dụng | DatePicker | Không | Không | Có | Có | Có | Không | Immutable, không cho sửa |
| 22 | Thời điểm sửa chữa gần nhất | DatePicker | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 23 | Địa điểm đặt trạm đèn | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 24 | Kết cấu | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 25 | Diện tích (m²) | InputDecimal | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 26 | Diện tích sử dụng trạm đèn (m²) | InputDecimal | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 27 | Số lượng nhân sự bố trí | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 28 | Ghi chú | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 29 | Loại đối tượng (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 30 | Biểu tượng (GIS) | SelectIcon | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 31 | Hệ quy chiếu (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 32 | Quy tắc hiển thị (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 33 | Tọa độ (GIS) | LongLatTable | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 34 | Danh sách file | UploadFileTable | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 35 | Ngày cập nhật | Textarea | Có | Có | Có | Có | Không | Không | Read-only, hệ thống tự điền |
| 36 | Cán bộ cập nhật | Textarea | Không | Không | Có | Có | Không | Không | Read-only, hệ thống tự điền |
| 37 | Ngày gửi phê duyệt | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 38 | Cán bộ gửi phê duyệt | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 39 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 40 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 41 | Nội dung phê duyệt | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 42 | Ngày phê duyệt cấp Cục | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 43 | Cán bộ phê duyệt cấp Cục | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 44 | Nội dung phê duyệt | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 45 | Trạng thái (Trạng thái phê duyệt) | Select (Dropdown) | Có | Có | Có | Có | Không | Không | Read-only, hệ thống tự quản |
| 46 | Mã kế hoạch (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only vận hành |
| 47 | Tên kế hoạch (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only vận hành |
| 48 | Ngày bắt đầu (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only vận hành |
| 49 | Ngày kết thúc (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only vận hành |
| 50 | Mã kế hoạch (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only bảo trì |
| 51 | Tên kế hoạch (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only bảo trì |
| 52 | Thời gian bắt đầu (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only bảo trì |
| 53 | Thời gian kết thúc (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only bảo trì |
| 54 | Mã sự cố | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only sự cố |
| 55 | Loại sự cố | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only sự cố |
| 56 | Địa điểm (sự cố) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only sự cố |
| 57 | Thời gian (sự cố) | Text (read-only) | Không | Không | Không | Có | Có | Không | Khối read-only sự cố |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- **7 trạng thái:** DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED (và REJECTED → DRAFT).
- **Quy trình 2 cấp:**
  - **Gửi phê duyệt:** Operator gửi đèn biển từ DRAFT lên PENDING_APPROVAL.
  - **Phê duyệt L1 (Cảng vụ/Chi cục):** Approver_L1 kiểm tra thông tin, có thể phê duyệt L1 hoặc từ chối với lý do. Nếu được phê duyệt L1, đèn biển chuyển sang APPROVED_L1.
  - **Phê duyệt L2 (Cục):** Approver_L2 kiểm tra lại và phê duyệt L2 — đèn biển chuyển sang PUBLISHED và được đồng bộ lên GIS M-007.
  - **Từ chối:** Bất kỳ approver nào cũng có thể từ chối với lý do ≥ 10 ký tự, đưa về DRAFT.
  - **4-eyes principle:** Người phê duyệt không thể phê duyệt bản ghi do chính mình tạo.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-071-01 | Phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL | Approve |
| BR-071-02 | Phê duyệt L2 yêu cầu entity đã được phê duyệt L1 (APPROVED_L1) | Approve |
| BR-071-03 | Từ chối yêu cầu lý do từ chối (rejectionReason) tối thiểu 10 ký tự | Reject |
| BR-071-04 | Sau khi phê duyệt L2, BeaconLight được đồng bộ lên GIS M-007 | Approve |
| BR-071-05 | Người phê duyệt không thể phê duyệt bản ghi do chính mình tạo | Approve |
| BR-071-06 | Trạng thái khởi tạo mặc định là DRAFT | Create |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-071-01** — Gửi phê duyệt thành công: Operator có thể gửi phê duyệt đèn biển ở trạng thái DRAFT — chuyển sang PENDING_APPROVAL, ghi lịch sử.
- **AC-071-02** — Phê duyệt L1 thành công: Approver_L1 phê duyệt thành công đèn biển ở trạng thái PENDING_APPROVAL — chuyển sang APPROVED_L1.
- **AC-071-03** — Từ chối tự phê duyệt: Approver_L1 không thể phê duyệt đèn biển do chính mình tạo — trả về lỗi "Bạn không thể phê duyệt bản do chính mình gửi".
- **AC-071-04** — Phê duyệt L2 thành công: Approver_L2 phê duyệt thành công đèn biển ở trạng thái APPROVED_L1 — chuyển sang PUBLISHED và đồng bộ lên GIS.
- **AC-071-05** — Từ chối với lý do đủ dài: Từ chối với lý do ≥ 10 ký tự — đèn biển quay về DRAFT, ghi lịch sử REJECT.
- **AC-071-06** — Từ chối với lý do quá ngắn: Từ chối với lý do < 10 ký tự — bị từ chối với lỗi "Lý do từ chối phải có ít nhất 10 ký tự".

### 4.3. User Stories kế thừa (nếu có)

- **US-071-01:** Như một người vận hành, tôi muốn gửi đèn biển đi phê duyệt để đảm bảo thông tin được kiểm duyệt trước khi công bố.
- **US-071-02:** Như một người phê duyệt cấp 1, tôi muốn xem xét và phê duyệt/từ chối đèn biển để đảm bảo chất lượng dữ liệu.
- **US-071-03:** Như một người phê duyệt cấp 2, tôi muốn phê duyệt cuối cùng và đồng bộ lên GIS để thông tin hiển thị trên bản đồ hàng hải.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Gửi phê duyệt | `beaconlight:submit` |
| Phê duyệt L1 | `beaconlight:approve_l1` |
| Phê duyệt L2 | `beaconlight:approve_l2` |
| Từ chối | `beaconlight:reject` |
| Xem chi tiết | `beaconlight:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (ngày tạo, ngày cập nhật, cán bộ cập nhật, ngày gửi phê duyệt, cán bộ gửi phê duyệt, ngày phê duyệt cấp Cảng vụ/Chi cục, cán bộ phê duyệt cấp Cảng vụ/Chi cục, nội dung phê duyệt, ngày phê duyệt cấp Cục, cán bộ phê duyệt cấp Cục, nội dung phê duyệt).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp: Cảng vụ/Chi cục (L1) → Cục (L2); đồng bộ GIS sau phê duyệt L2 |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, controller khai `@DataScope`, aspect kích hoạt Hibernate global filter `orgUnitFilter`, đơn vị cha xem được đơn vị con (subtree), Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — khối read-only vận hành/bảo trì/sự cố chỉ hiển thị khi có dữ liệu liên kết từ bảng kế hoạch/bảo trì/sự cố |
| 5 | Quyền riêng | `beaconlight:submit`, `beaconlight:approve_l1`, `beaconlight:approve_l2`, `beaconlight:reject`, `beaconlight:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — 5 trường quy ước GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ), khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/beacon-lights/{id}` | Xem chi tiết đèn biển theo UUID để chuẩn bị form phê duyệt | `beaconlight:read` |
| POST | `/api/beacon-lights/{id}/submit` | Gửi phê duyệt đèn biển | `beaconlight:submit` |
| POST | `/api/beacon-lights/{id}/approve-l1` | Phê duyệt cấp 1 (Cảng vụ/Chi cục) | `beaconlight:approve_l1` |
| POST | `/api/beacon-lights/{id}/approve-l2` | Phê duyệt cấp 2 (Cục) | `beaconlight:approve_l2` |
| POST | `/api/beacon-lights/{id}/reject` | Từ chối đèn biển | `beaconlight:reject` |
| GET | `/api/beacon-history?type=BEACON_LIGHT` | Xem lịch sử thao tác trên đèn biển | `beaconlight:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `beacon_light` (Đèn biển):** 🔴`code` (VARCHAR 50, unique, not null), 🔴`name` (VARCHAR 200, not null), 🔴`org_unit_id` (UUID, not null, FK → org_unit), 🔴`port_id` (UUID, FK → port), 🔴`operating_unit_id` (UUID, FK → org_unit), 🔴`province` (VARCHAR 100), 🔴`detail_location` (TEXT), 🔴`status` (INT, not null — trạng thái), 🔴`main_light_type` (VARCHAR 100), 🔴`backup_light_type` (VARCHAR 100), 🔴`station_level` (INT, not null), 🔴`area` (TEXT), 🔴`landmark_features` (TEXT), 🔴`shape` (TEXT), 🔴`tower_height_m` (DECIMAL), 🔴`light_center_height_m` (DECIMAL), 🔴`geographic_range` (DECIMAL), 🔴`light_range` (DECIMAL), 🔴`tower_color` (TEXT), 🔴`energy_source` (TEXT), 🔴`commissioning_date` (DATE), 🔴`last_repair_date` (DATE), 🔴`station_location` (TEXT), 🔴`structure` (TEXT), 🔴`area_m2` (DECIMAL), 🔴`used_area_m2` (DECIMAL), 🔴`staff_count` (VARCHAR 50), 🔴`notes` (TEXT), 🔴`gis_object_type` (VARCHAR 50), 🔴`gis_icon` (VARCHAR 50), 🔴`gis_coordinate_system` (VARCHAR 50), 🔴`gis_display_rule` (VARCHAR 50), 🔴`gis_coordinates` (TEXT — JSON), 🔴`approval_status` (INT), 🔴`approval_level` (INT), 🔴`approved_by` (UUID), 🔴`approved_date` (TIMESTAMP), 🔴`rejection_reason` (TEXT), 🔴`created_at` (TIMESTAMP), 🔴`updated_at` (TIMESTAMP), 🔴`created_by` (UUID), 🔴`updated_by` (UUID), 🔴`deleted_at` (TIMESTAMP), 🔴`deleted_by` (UUID)

**Bảng `beacon_history` (Lịch sử đèn biển):** 🔴`id` (UUID, PK), 🔴`entity_id` (UUID, FK → beacon_light), 🔴`beacon_type` (VARCHAR 50), 🔴`action_type` (VARCHAR 50 — CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE), 🔴`changed_field` (TEXT), 🔴`previous_value` (TEXT — JSON), 🔴`new_value` (TEXT — JSON), 🔴`changed_by` (UUID), 🔴`changed_at` (TIMESTAMP)

**Bảng `beacon_file` (File đính kèm đèn biển):** 🔴`id` (UUID, PK), 🔴`beacon_id` (UUID, FK → beacon_light), 🔴`file_name` (VARCHAR 255), 🔴`file_path` (VARCHAR 500), 🔴`file_size` (BIGINT), 🔴`uploaded_at` (TIMESTAMP), 🔴`uploaded_by` (UUID)