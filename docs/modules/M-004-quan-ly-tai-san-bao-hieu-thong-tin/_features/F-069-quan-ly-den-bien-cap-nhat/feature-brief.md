---
id: F-069
name: "Quản lý Đèn biển - Cập nhật"
slug: quan-ly-den-bien-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:17Z"
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đèn biển - Cập nhật

> ### ⚠️ ĐÍNH CHÍNH 26/08/2026 — Quy tắc chỉnh sửa theo trạng thái (quy tắc 12)
>
> Mọi câu/BR/AC trong tài liệu này quy định khác với bảng dưới đây đều **HẾT HIỆU LỰC**.
> Nguồn có thẩm quyền: `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (bảng chuyển trạng thái mục 7 + Ca dùng 8),
> chuẩn hóa tại `docs/conventions/approval-2-level-spec.md` **mục 3.9**.
>
> | Trạng thái | Cho sửa? | Hành động | Ai được sửa | Quyền |
> | :--- | :---: | :--- | :--- | :--- |
> | `DRAFT` (Lưu tạm) | ✅ | Sửa tiếp, gửi duyệt | Người nhập | `<resource>:update` |
> | `PENDING_APPROVAL` (Chờ Cảng vụ/Chi cục duyệt) | ❌ | — | — | — |
> | `APPROVED_LEVEL1` (Chờ Cục duyệt) | ❌ | — | — | — |
> | `REJECTED_LEVEL1` (Bị Cảng vụ/Chi cục trả về) | ✅ | Sửa **+ gửi lại** | Người nhập | `<resource>:update` |
> | `REJECTED_LEVEL2` (Bị Cục trả về) | ✅ | Sửa **+ gửi lại** | Người nhập | `<resource>:update` |
> | `APPROVED` (Đã duyệt) | ✅ | Sửa qua **"Lưu và phê duyệt"** | Người có quyền phê duyệt | `<resource>:approvec2` |
> | `ARCHIVED` (Đã xóa) | ❌ | — | — | — |
>
> **Ba điểm bị đính chính so với nội dung cũ bên dưới:**
> 1. **KHÔNG** hạ hồ sơ `APPROVED` về `DRAFT` khi cập nhật. Hồ sơ **giữ nguyên `APPROVED`**, bản cũ ghi vào
>    nhật ký thay đổi (T12). Lý do: `/options` chỉ trả về bản ghi `APPROVED`, hạ trạng thái sẽ làm hồ sơ đang
>    khai thác biến mất khỏi mọi dropdown của các màn hình khác.
> 2. **PHẢI** cho sửa khi hồ sơ **bị trả về** (`REJECTED_LEVEL1`, `REJECTED_LEVEL2`) — đó là mục đích của việc
>    trả về; cấm sửa sẽ làm tắc quy trình.
> 3. **PHẢI** cấm sửa khi hồ sơ **đang chờ duyệt** (`PENDING_APPROVAL`, `APPROVED_LEVEL1`) — tránh việc nội dung
>    bị đổi sau khi cán bộ đã đọc, khiến cán bộ ký duyệt vào nội dung mình chưa từng xem.
>
> **Tập trạng thái legacy** dùng trong tài liệu này (`APPROVED_L1`, `APPROVED_L2`, `PUBLISHED`, `REJECTED`,
> `DELETED`) đã bị thay bằng 7 trạng thái chuẩn ở bảng trên (ánh xạ: `PUBLISHED`/`APPROVED_L2` → `APPROVED`,
> `APPROVED_L1` → `APPROVED_LEVEL1`, `REJECTED` → `REJECTED_LEVEL1`, `DELETED` → `ARCHIVED`).



**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-069
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

Cho phép người dùng cập nhật thông tin của một đèn biển đã tồn tại. Các trường có thể thay đổi bao gồm: tên, đơn vị quản lý, cảng biển thuộc, đơn vị vận hành, địa điểm, tình trạng, thông tin kỹ thuật (chủng loại đèn chính/dự phòng, cấp trạm đèn, địa bàn, đặc điểm nhận dạng, hình dạng, chiều cao tháp đèn, chiều cao tâm sáng, tầm hiệu lực địa lý/ánh sáng, màu sắc tháp đèn, nguồn năng lượng, thời điểm đưa vào sử dụng/sửa chữa gần nhất), thông tin nhà trạm (địa điểm đặt trạm, kết cấu, diện tích, số lượng nhân sự), tọa độ GIS, file đính kèm. Mã code không thể thay đổi sau khi tạo. Nếu đèn biển đã ở trạng thái đã phê duyệt (APPROVED_L1/APPROVED_L2/PUBLISHED), hệ thống tự động đưa về trạng thái DRAFT và yêu cầu phê duyệt lại. Hệ thống ghi lại lịch sử các thay đổi để truy vết.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã đèn biển | Input (disabled) | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 2 | Tên đèn biển | InputTextArea | Có | Có | Có | Có | Có | Có | Tối đa 200 ký tự |
| 3 | Đơn vị quản lý | SelectOrgCode | Có | Có | Có | Có | Có | Có | Theo phân cấp đơn vị |
| 4 | Thuộc cảng biển | SelectKcht (CB) | Không | Có | Có | Có | Có | Có | Lọc theo cảng biển |
| 5 | Đơn vị vận hành | SelectCateOther | Không | Có | Có | Có | Có | Có | |
| 6 | Địa điểm (Tỉnh/TP) | SelectCateOther | Không | Có | Có | Có | Có | Có | |
| 7 | Địa điểm chi tiết | InputTextArea | Không | Không | Không | Có | Có | Có | |
| 8 | Tình trạng | SelectAppParams | Có | Có | Có | Có | Có | Có | |
| 9 | Chủng loại đèn chính | Input | Không | Không | Có | Có | Có | Có | |
| 10 | Chủng loại đèn dự phòng | Input | Không | Không | Không | Có | Có | Có | |
| 11 | Cấp trạm đèn | SelectAppParams | Có | Có | Có | Có | Có | Có | |
| 12 | Địa bàn | InputTextArea | Không | Không | Không | Có | Có | Có | |
| 13 | Đặc điểm nhận dạng | InputTextArea | Không | Không | Không | Có | Có | Có | |
| 14 | Hình dạng | InputTextArea | Không | Không | Không | Có | Có | Có | |
| 15 | Chiều cao tháp đèn (m) | InputDecimal | Không | Không | Không | Có | Có | Có | |
| 16 | Chiều cao tâm sáng (m) | InputDecimal | Không | Không | Không | Có | Có | Có | |
| 17 | Tầm hiệu lực địa lý | Input | Không | Không | Không | Có | Có | Có | |
| 18 | Tầm hiệu lực ánh sáng | Input | Không | Không | Không | Có | Có | Có | |
| 19 | Màu sắc tháp đèn | InputTextArea | Không | Không | Không | Có | Có | Có | |
| 20 | Nguồn năng lượng | InputTextArea | Không | Không | Không | Có | Có | Có | |
| 21 | Thời điểm đưa vào sử dụng | DatePicker | Không | Không | Có | Có | Có | Có | |
| 22 | Thời điểm sửa chữa gần nhất | DatePicker | Không | Không | Không | Có | Có | Có | |
| 23 | Địa điểm đặt trạm đèn | InputTextArea | Không | Không | Không | Có | Có | Có | Khối nhà trạm |
| 24 | Kết cấu | InputTextArea | Không | Không | Không | Có | Có | Có | Khối nhà trạm |
| 25 | Diện tích (m²) | InputDecimal | Không | Không | Không | Có | Có | Có | Khối nhà trạm |
| 26 | Diện tích sử dụng trạm đèn (m²) | InputDecimal | Không | Không | Không | Có | Có | Có | Khối nhà trạm |
| 27 | Số lượng nhân sự bố trí | InputTextArea | Không | Không | Không | Có | Có | Có | Khối nhà trạm |
| 28 | Ghi chú | InputTextArea | Không | Không | Không | Có | Có | Có | |
| 29 | Loại đối tượng (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Có | 5 trường quy ước GIS |
| 30 | Biểu tượng (GIS) | SelectIcon | Không | Không | Không | Có | Có | Có | 5 trường quy ước GIS |
| 31 | Hệ quy chiếu (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Có | 5 trường quy ước GIS |
| 32 | Quy tắc hiển thị (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Có | 5 trường quy ước GIS |
| 33 | Tọa độ (GIS) | LongLatTable | Không | Không | Không | Có | Có | Có | 5 trường quy ước GIS |
| 34 | Danh sách file | UploadFileTable | Không | Không | Không | Có | Có | Có | |
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
- Chức năng có bước phê duyệt 2 cấp:
  - **7 trạng thái:** DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED (và REJECTED → DRAFT).
  - Khi cập nhật đèn biển đã ở trạng thái đã phê duyệt (APPROVED_L1/APPROVED_L2/PUBLISHED), hệ thống tự động đưa về trạng thái DRAFT và yêu cầu phê duyệt lại.
  - Người phê duyệt không thể phê duyệt bản ghi do chính mình tạo (4-eyes principle).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-069-01 | Mã code là duy nhất, không thể thay đổi sau khi tạo (immutable) | Update |
| BR-069-02 | Tên đèn biển không được để trống, tối đa 200 ký tự | Update |
| BR-069-03 | Tọa độ GIS phải tuân thủ chuẩn WGS84 (kinh độ -180~180, vĩ độ -90~90) | Update |
| BR-069-04 | Chiều cao tháp đèn và chiều cao tâm sáng phải ≥ 0 | Update |
| BR-069-05 | Tầm hiệu lực địa lý và tầm hiệu lực ánh sáng phải ≥ 0 | Update |
| BR-069-06 | Không thể thay đổi loại đèn (type) nếu đèn biển đã ở trạng thái APPROVED_L2 hoặc PUBLISHED | Update |
| BR-069-07 | Nếu đèn biển đã được phê duyệt (APPROVED_L1/APPROVED_L2/PUBLISHED), sau khi cập nhật status tự động chuyển về DRAFT và approvalStatus về PENDING | Update |
| BR-069-08 | Hệ thống từ chối cập nhật nếu đèn biển đã bị xóa (status = DELETED) | Update |
| BR-069-09 | Sau khi cập nhật, lịch sử được ghi với actionType = UPDATE và danh sách các trường thay đổi | Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-069-01** — Cập nhật thành công: Cập nhật thành công các trường thông tin của đèn biển — hệ thống trả về HTTP 200 và thông tin đã cập nhật.
- **AC-069-02** — Từ chối cập nhật mã code: Hệ thống từ chối cập nhật nếu mã code được gửi trong request — code là trường immutable.
- **AC-069-03** — Từ chối thay đổi loại đèn: Hệ thống từ chối thay đổi loại đèn (type) nếu đèn biển đã ở trạng thái APPROVED_L2 hoặc PUBLISHED.
- **AC-069-04** — Tự động hạ về DRAFT: Nếu đèn biển đã được phê duyệt (APPROVED_L1/APPROVED_L2/PUBLISHED), sau khi cập nhật status tự động chuyển về DRAFT và approvalStatus về PENDING.
- **AC-069-05** — Từ chối cập nhật đã xóa: Hệ thống từ chối cập nhật nếu đèn biển đã bị xóa (status = DELETED).
- **AC-069-06** — Ghi lịch sử UPDATE: Sau khi cập nhật, lịch sử được ghi với actionType = UPDATE và danh sách các trường thay đổi.

### 4.3. User Stories kế thừa (nếu có)

- **US-069-01:** Như một người vận hành, tôi muốn cập nhật thông tin đèn biển đã tồn tại để duy trì dữ liệu luôn chính xác.
- **US-069-02:** Như một quản trị viên, tôi muốn hệ thống tự động đưa về DRAFT khi sửa đèn biển đã được phê duyệt để đảm bảo quy trình kiểm duyệt.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật đèn biển | `beaconlight:update` |
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
| 2 | Có bước phê duyệt không | Có — 2 cấp: Cảng vụ/Chi cục (L1) → Cục (L2); tự động hạ về DRAFT khi sửa đèn đã phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, controller khai `@DataScope`, aspect kích hoạt Hibernate global filter `orgUnitFilter`, đơn vị cha xem được đơn vị con (subtree), Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — khối read-only vận hành/bảo trì/sự cố chỉ hiển thị khi có dữ liệu liên kết từ bảng kế hoạch/bảo trì/sự cố |
| 5 | Quyền riêng | `beaconlight:update`, `beaconlight:submit`, `beaconlight:approve_l1`, `beaconlight:approve_l2`, `beaconlight:reject`, `beaconlight:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — 5 trường quy ước GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ), khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/beacon-lights/{id}` | Xem chi tiết đèn biển theo UUID để chuẩn bị form sửa | `beaconlight:read` |
| PUT | `/api/beacon-lights/{id}` | Cập nhật đèn biển | `beaconlight:update` |
| POST | `/api/beacon-lights/{id}/submit` | Gửi phê duyệt đèn biển sau khi sửa | `beaconlight:submit` |
| POST | `/api/beacon-lights/{id}/approve-l1` | Phê duyệt cấp 1 (Cảng vụ/Chi cục) | `beaconlight:approve_l1` |
| POST | `/api/beacon-lights/{id}/approve-l2` | Phê duyệt cấp 2 (Cục) | `beaconlight:approve_l2` |
| POST | `/api/beacon-lights/{id}/reject` | Từ chối đèn biển | `beaconlight:reject` |
| GET | `/api/beacon-history?type=BEACON_LIGHT` | Xem lịch sử thao tác trên đèn biển | `beaconlight:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `beacon_light` (Đèn biển):** 🔴`code` (VARCHAR 50, unique, not null), 🔴`name` (VARCHAR 200, not null), 🔴`org_unit_id` (UUID, not null, FK → org_unit), 🔴`port_id` (UUID, FK → port), 🔴`operating_unit_id` (UUID, FK → org_unit), 🔴`province` (VARCHAR 100), 🔴`detail_location` (TEXT), 🔴`status` (INT, not null — trạng thái), 🔴`main_light_type` (VARCHAR 100), 🔴`backup_light_type` (VARCHAR 100), 🔴`station_level` (INT, not null), 🔴`area` (TEXT), 🔴`landmark_features` (TEXT), 🔴`shape` (TEXT), 🔴`tower_height_m` (DECIMAL), 🔴`light_center_height_m` (DECIMAL), 🔴`geographic_range` (DECIMAL), 🔴`light_range` (DECIMAL), 🔴`tower_color` (TEXT), 🔴`energy_source` (TEXT), 🔴`commissioning_date` (DATE), 🔴`last_repair_date` (DATE), 🔴`station_location` (TEXT), 🔴`structure` (TEXT), 🔴`area_m2` (DECIMAL), 🔴`used_area_m2` (DECIMAL), 🔴`staff_count` (VARCHAR 50), 🔴`notes` (TEXT), 🔴`gis_object_type` (VARCHAR 50), 🔴`gis_icon` (VARCHAR 50), 🔴`gis_coordinate_system` (VARCHAR 50), 🔴`gis_display_rule` (VARCHAR 50), 🔴`gis_coordinates` (TEXT — JSON), 🔴`approval_status` (INT), 🔴`approval_level` (INT), 🔴`approved_by` (UUID), 🔴`approved_date` (TIMESTAMP), 🔴`rejection_reason` (TEXT), 🔴`created_at` (TIMESTAMP), 🔴`updated_at` (TIMESTAMP), 🔴`created_by` (UUID), 🔴`updated_by` (UUID), 🔴`deleted_at` (TIMESTAMP), 🔴`deleted_by` (UUID)

**Bảng `beacon_history` (Lịch sử đèn biển):** 🔴`id` (UUID, PK), 🔴`entity_id` (UUID, FK → beacon_light), 🔴`beacon_type` (VARCHAR 50), 🔴`action_type` (VARCHAR 50 — CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE), 🔴`changed_field` (TEXT), 🔴`previous_value` (TEXT — JSON), 🔴`new_value` (TEXT — JSON), 🔴`changed_by` (UUID), 🔴`changed_at` (TIMESTAMP)

**Bảng `beacon_file` (File đính kèm đèn biển):** 🔴`id` (UUID, PK), 🔴`beacon_id` (UUID, FK → beacon_light), 🔴`file_name` (VARCHAR 255), 🔴`file_path` (VARCHAR 500), 🔴`file_size` (BIGINT), 🔴`uploaded_at` (TIMESTAMP), 🔴`uploaded_by` (UUID)