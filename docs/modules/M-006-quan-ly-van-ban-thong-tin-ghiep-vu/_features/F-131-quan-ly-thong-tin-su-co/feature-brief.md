---
id: F-131
name: Quản lý thông tin sự cố
slug: quan-ly-thong-tin-su-co
module-id: M-006
status: proposed
classification: local
priority: medium
created: 2026-09-02
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý thông tin sự cố

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-131
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền chung của module (chưa có `ba/01-base-pattern.md` cho M-006) + TKCT + nguồn sự thật Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #37 "Thông tin sự cố".

> **⚠️ Data Scope:** Trường "Đơn vị quản lý" (`orgUnitId`, `SelectOrgCode`) là trường đơn vị phân quyền dữ liệu — xem mục 5 dòng 3 và AGENTS.md mục Data Scope Convention.

---

## 1. Mô tả ngắn

Chức năng ghi nhận và theo dõi thông tin sự cố KCHT: ghi nhận sự cố (loại, thời gian, địa điểm, KCHT bị ảnh hưởng, thiệt hại), cập nhật diễn biến sự cố, đính kèm tệp; khi sự cố chuyển sang trạng thái xử lý thì ghi nhận thông tin chỉ đạo/xử lý sự cố và tệp kết quả. Người dùng: cán bộ đơn vị quản lý KCHT (ghi nhận/xử lý), lãnh đạo/cục tra cứu.

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #37 (24 trường). Cờ: ✓ = có, — = không. Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel**.

| # | Nhóm (TAB) | Trường | Loại điều khiển | DS | Lọc | Xem | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Thông tin sự cố | Đơn vị quản lý | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Thông tin sự cố | Loại sự cố | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Thông tin sự cố | Mã sự cố | Input Text (disabled, tự sinh) | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | Thông tin sự cố | Thời gian xảy ra sự cố | RangePicker | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Thông tin sự cố | Địa điểm xảy ra sự cố | InputTextArea | ✓ | — | ✓ | ✓ | — |
| 6 | Thông tin sự cố | Loại kết cấu hạ tầng xảy ra sự cố | Select | — | — | ✓ | ✓ | — |
| 7 | Thông tin sự cố | Mã kết cấu hạ tầng xảy ra sự cố | Select | — | — | ✓ | ✓ | ✓ |
| 8 | Thông tin sự cố | Tên kết cấu hạ tầng xảy ra sự cố | Input Text (disabled) | — | — | ✓ | ✓ | ✓ |
| 9 | Thông tin sự cố | Nội dung sự cố | InputTextArea | ✓ | — | ✓ | ✓ | ✓ |
| 10 | Thông tin sự cố | Tình trạng thiệt hại | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 11 | Thông tin sự cố | Trạng thái sự cố | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 12 | Thông tin sự cố | Ghi chú | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 13 | Diễn biến sự cố | Thời gian (Từ ngày - đến ngày) | RangePicker (trong bảng) | — | — | ✓ | ✓ | ✓ |
| 14 | Diễn biến sự cố | Sự kiện | InputTextArea (trong bảng) | — | — | ✓ | ✓ | ✓ |
| 15 | File thông tin sự cố | Tên file | Upload/Attachment | — | — | ✓ | ✓ | ✓ |
| 16 | Chỉ đạo xử lý sự cố (hiện khi trạng thái = Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng) | Cán bộ chỉ đạo xử lý sự cố | Select (trong bảng) | — | — | ✓ | — | ✓ |
| 17 | Chỉ đạo xử lý sự cố (hiện khi trạng thái = Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng) | Nội dung chỉ đạo xử lý sự cố | InputTextArea (trong bảng) | — | — | ✓ | — | ✓ |
| 18 | Chỉ đạo xử lý sự cố (hiện khi trạng thái = Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng) | Ngày chỉ đạo xử lý sự cố | DatePicker (trong bảng) | — | — | ✓ | — | ✓ |
| 19 | Chỉ đạo xử lý sự cố (hiện khi trạng thái = Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng) | Biện pháp xử lý sự cố | InputTextArea (trong bảng) | — | — | ✓ | — | ✓ |
| 20 | Chỉ đạo xử lý sự cố (hiện khi trạng thái = Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng) | Kết quả xử lý sự cố | InputTextArea (trong bảng) | — | — | ✓ | — | ✓ |
| 21 | Chỉ đạo xử lý sự cố (hiện khi trạng thái = Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng) | Ghi chú (xử lý) | InputTextArea (trong bảng) | — | — | ✓ | — | ✓ |
| 22 | File kết quả xử lý sự cố | Tên file | Upload/Attachment | — | — | ✓ | — | ✓ |
| 23 | Trạng thái | Cán bộ cập nhật | Text (hiển thị, không nhập) | ✓ | — | ✓ | — | ✓ |
| 24 | Trạng thái | Ngày cập nhật | DatePicker (hiển thị, không nhập) | ✓ | — | ✓ | — | — |

## 3. Trạng thái và phê duyệt

- Excel cụm #37 **không khai báo luồng phê duyệt**. Trạng thái nghiệp vụ ở trường "Trạng thái sự cố" (số 11); TAB "Chỉ đạo xử lý sự cố" chỉ hiển thị khi trạng thái = **Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng**.
- Trạng thái lưu dạng số; bộ giá trị (gồm cả "Đã xử lý đang theo dõi", "Không thể xử lý", "Đã đóng") chưa được liệt kê đầy đủ trong Excel → **SA chốt**.
- **Không có bước phê duyệt** (chỉ đạo xử lý nội bộ, không phát sinh approval log).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-131-01 | Mã sự cố tự sinh, không cho nhập tay. | Create |
| BR-131-02 | TAB "Chỉ đạo xử lý sự cố" chỉ hiển thị khi trạng thái ∈ {Đã xử lý đang theo dõi, Không thể xử lý, Đã đóng}. | Update |
| BR-131-03 | "Đơn vị quản lý" là trường đơn vị phân quyền dữ liệu; khi tạo phải gán đơn vị trong phạm vi người dùng. | Create / Update |
| BR-131-04 | Tên KCHT xảy ra sự cố tự điền từ mã KCHT (disabled). | Create / Update |
| BR-131-05 | Cán bộ cập nhật / Ngày cập nhật do hệ thống tự điền. | Create / Update |

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `incident:read` |
| Tạo mới | `incident:create` |
| Sửa | `incident:update` |
| Xóa | `incident:delete` |

**Admin Cục:** full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — "Trạng thái sự cố" (bộ giá trị chưa khai báo đầy đủ, SA chốt) |
| 2 | Có bước phê duyệt không | Không — Excel không khai báo luồng duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (Đơn vị quản lý) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — TAB "Chỉ đạo xử lý sự cố" hiện khi trạng thái ∈ {Đã xử lý đang theo dõi, Không thể xử lý, Đã đóng} |
| 5 | Quyền riêng | `incident:read/create/update/delete` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — Upload/Attachment (file thông tin sự cố + file kết quả xử lý) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + form/drawer convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/incidents` | Danh sách sự cố (lọc theo đơn vị, loại, trạng thái) | `incident:read` |
| GET | `/api/incidents/{id}` | Chi tiết sự cố | `incident:read` |
| POST | `/api/incidents` | Ghi nhận sự cố mới | `incident:create` |
| PUT | `/api/incidents/{id}` | Cập nhật diễn biến / chỉ đạo xử lý | `incident:update` |
| DELETE | `/api/incidents/{id}` | Xóa mềm | `incident:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `incident` (thông tin sự cố):** 🔴 `org_unit_id` (Đơn vị quản lý), 🔴 `incident_type` (Loại sự cố), 🔴 `code` (Mã sự cố — tự sinh), 🔴 `occurred_from` / 🔴 `occurred_to` (Thời gian xảy ra), 🔴 `location` (Địa điểm xảy ra), 🔴 `infrastructure_type` (Loại KCHT xảy ra sự cố), 🔴 `infrastructure_id` (Mã KCHT), 🔴 `infrastructure_name` (Tên KCHT), 🔴 `content` (Nội dung sự cố), 🔴 `damage_status` (Tình trạng thiệt hại), 🔴 `status` (Trạng thái sự cố), 🔴 `note` (Ghi chú), 🔴 `updated_by`, 🔴 `updated_at`.

**Bảng con `incident_evolution` (diễn biến sự cố):** 🔴 `incident_id`, 🔴 `from_date`, 🔴 `to_date`, 🔴 `event`.

**Bảng con `incident_handling` (chỉ đạo/xử lý — hiện theo trạng thái):** 🔴 `incident_id`, 🔴 `handler` (Cán bộ chỉ đạo), 🔴 `directive_content` (Nội dung chỉ đạo), 🔴 `directive_date` (Ngày chỉ đạo), 🔴 `measure` (Biện pháp xử lý), 🔴 `result` (Kết quả xử lý), 🔴 `note` (Ghi chú xử lý).

**Bảng con `incident_file` (tệp):** 🔴 `incident_id`, 🔴 `file_name`.

> Ghi chú: brief cũ (F-131 legacy) chưa có §2/§7 — SA đối chiếu tên bảng/entity với schema hiện có; các trường 🔴 là đề xuất từ ma trận Excel.
