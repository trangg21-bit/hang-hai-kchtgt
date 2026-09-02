---
id: F-130
name: Quản lý thông tin bảo trì
slug: quan-ly-thong-tin-bao-tri
module-id: M-006
status: proposed
classification: local
priority: medium
created: 2026-09-02
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý thông tin bảo trì

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-130
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền chung của module (chưa có `ba/01-base-pattern.md` cho M-006) + TKCT + nguồn sự thật Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #36 "Thông tin bảo trì".

> **⚠️ Data Scope:** Trường "Đơn vị quản lý" (`orgUnitId`, `SelectOrgCode`) là trường đơn vị phân quyền dữ liệu — xem mục 5 dòng 3 và AGENTS.md mục Data Scope Convention.

---

## 1. Mô tả ngắn

Chức năng quản lý kế hoạch bảo trì KCHT: lập kế hoạch bảo trì (đơn vị, loại công việc, thời gian dự kiến), liệt kê danh sách công trình và kinh phí bảo trì, đính kèm tệp kế hoạch; khi kế hoạch ở trạng thái "Hoàn thành" thì ghi nhận kết quả xác nhận bảo trì thực tế kèm tệp xác nhận. Người dùng: cán bộ đơn vị quản lý KCHT (tạo/sửa), lãnh đạo/cục tra cứu.

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #36 (25 trường). Cờ: ✓ = có, — = không. Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel**.

| # | Nhóm (TAB) | Trường | Loại điều khiển | DS | Lọc | Xem | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Kế hoạch bảo trì | Đơn vị quản lý | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Kế hoạch bảo trì | Đơn vị bảo trì | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Kế hoạch bảo trì | Loại kết cấu hạ tầng bảo trì | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | Kế hoạch bảo trì | Mã kế hoạch bảo trì | Input Text (disabled, tự sinh) | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Kế hoạch bảo trì | Tên kế hoạch bảo trì | InputTextArea | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6 | Kế hoạch bảo trì | Thời gian bắt đầu bảo trì dự kiến | DatePicker | ✓ | — | ✓ | ✓ | ✓ |
| 7 | Kế hoạch bảo trì | Thời gian kết thúc bảo trì dự kiến | DatePicker | ✓ | — | ✓ | ✓ | ✓ |
| 8 | Kế hoạch bảo trì | Tên công việc bảo trì | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 9 | Kế hoạch bảo trì | Loại công việc bảo trì | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 10 | Kế hoạch bảo trì | Nội dung bảo trì | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 11 | Kế hoạch bảo trì | Trạng thái bảo trì | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 12 | Kế hoạch bảo trì | Ghi chú | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 13 | File kế hoạch bảo trì | Tên file | Upload/Attachment | — | — | ✓ | ✓ | ✓ |
| 14 | Danh sách công trình | Mã kết cấu hạ tầng | Select | — | — | ✓ | ✓ | ✓ |
| 15 | Danh sách công trình | Tên kết cấu hạ tầng | Input Text (disabled) | — | — | ✓ | ✓ | ✓ |
| 16 | Danh sách công trình | Thuộc cảng biển | Input Text (disabled) | — | — | ✓ | ✓ | ✓ |
| 17 | Danh sách công trình | Địa điểm | InputTextArea (disabled) | — | — | ✓ | ✓ | ✓ |
| 18 | Danh sách công trình | Kinh phí bảo trì | InputDecimal | — | — | ✓ | ✓ | ✓ |
| 19 | Xác nhận bảo trì (hiện khi trạng thái = Hoàn thành) | Thời gian bắt đầu bảo trì | DatePicker | — | — | ✓ | — | ✓ |
| 20 | Xác nhận bảo trì (hiện khi trạng thái = Hoàn thành) | Thời gian kết thúc bảo trì | DatePicker | — | — | ✓ | — | ✓ |
| 21 | Xác nhận bảo trì (hiện khi trạng thái = Hoàn thành) | Nội dung kết quả bảo trì | InputTextArea | — | — | ✓ | — | ✓ |
| 22 | Xác nhận bảo trì (hiện khi trạng thái = Hoàn thành) | Ghi chú (kết quả) | InputTextArea | — | — | ✓ | — | ✓ |
| 23 | File xác nhận bảo trì | Tên file | Upload/Attachment | — | — | ✓ | — | ✓ |
| 24 | Trạng thái | Cán bộ cập nhật | Text (hiển thị, không nhập) | — | — | ✓ | — | — |
| 25 | Trạng thái | Ngày cập nhật | DatePicker (hiển thị, không nhập) | — | — | ✓ | — | — |

> Ghi chú nhóm: theo vị trí TAB trong Excel, "Kinh phí bảo trì" (số 18) nằm trong nhóm "Danh sách công trình" (không phải nhóm "Xác nhận bảo trì" như tóm tắt 18–22). Xem diff-report.md.

## 3. Trạng thái và phê duyệt

- Excel cụm #36 **không khai báo luồng phê duyệt**. Trạng thái nghiệp vụ ở trường "Trạng thái bảo trì" (số 11); TAB "Xác nhận bảo trì" chỉ hiển thị khi **trạng thái = Hoàn thành**.
- Trạng thái lưu dạng số; bộ giá trị cụ thể chưa được Excel khai báo → **SA chốt**.
- **Không có bước phê duyệt**.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-130-01 | Mã kế hoạch bảo trì tự sinh, không cho nhập tay. | Create |
| BR-130-02 | TAB "Xác nhận bảo trì" chỉ hiển thị/ghi nhận khi trạng thái = Hoàn thành. | Update |
| BR-130-03 | "Đơn vị quản lý" là trường đơn vị phân quyền dữ liệu; khi tạo phải gán đơn vị trong phạm vi người dùng. | Create / Update |
| BR-130-04 | Trường Tên KCHT / Thuộc cảng biển / Địa điểm trong danh sách công trình tự điền từ mã KCHT (disabled). | Create / Update |
| BR-130-05 | Cán bộ cập nhật / Ngày cập nhật do hệ thống tự điền. | Create / Update |

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `maintenanceplan:read` |
| Tạo mới | `maintenanceplan:create` |
| Sửa | `maintenanceplan:update` |
| Xóa | `maintenanceplan:delete` |

**Admin Cục:** full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — "Trạng thái bảo trì" (giá trị chưa khai báo, SA chốt) |
| 2 | Có bước phê duyệt không | Không — Excel không khai báo luồng duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (Đơn vị quản lý) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — TAB "Xác nhận bảo trì" hiện khi trạng thái = Hoàn thành |
| 5 | Quyền riêng | `maintenanceplan:read/create/update/delete` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — Upload/Attachment (file kế hoạch + file xác nhận) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + form/drawer convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/maintenanceplans` | Danh sách kế hoạch bảo trì | `maintenanceplan:read` |
| GET | `/api/maintenanceplans/{id}` | Chi tiết kế hoạch bảo trì | `maintenanceplan:read` |
| POST | `/api/maintenanceplans` | Tạo mới kế hoạch bảo trì | `maintenanceplan:create` |
| PUT | `/api/maintenanceplans/{id}` | Sửa / ghi nhận xác nhận bảo trì | `maintenanceplan:update` |
| DELETE | `/api/maintenanceplans/{id}` | Xóa mềm | `maintenanceplan:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `maintenance_plan` (kế hoạch bảo trì):** 🔴 `org_unit_id` (Đơn vị quản lý), 🔴 `maintenance_unit_id` (Đơn vị bảo trì), 🔴 `infrastructure_type` (Loại KCHT bảo trì), 🔴 `code` (Mã kế hoạch — tự sinh), 🔴 `name` (Tên kế hoạch), 🔴 `expected_start_date`, 🔴 `expected_end_date`, 🔴 `work_name` (Tên công việc), 🔴 `work_type` (Loại công việc), 🔴 `content` (Nội dung bảo trì), 🔴 `status` (Trạng thái bảo trì), 🔴 `note` (Ghi chú), 🔴 `updated_by`, 🔴 `updated_at`.

**Bảng con `maintenance_work` (danh sách công trình):** 🔴 `maintenance_plan_id` (FK), 🔴 `infrastructure_id` (Mã KCHT), 🔴 `name` (Tên KCHT), 🔴 `port_name` (Thuộc cảng biển), 🔴 `location` (Địa điểm), 🔴 `cost` (Kinh phí bảo trì).

**Bảng con `maintenance_plan_file` (tệp):** 🔴 `maintenance_plan_id`, 🔴 `file_name`.

**Bảng con `maintenance_confirmation` (xác nhận bảo trì — hiện khi Hoàn thành):** 🔴 `maintenance_plan_id`, 🔴 `actual_start_date`, 🔴 `actual_end_date`, 🔴 `result_content`, 🔴 `result_note`.

> Ghi chú: brief cũ (F-130 legacy) chưa có §2/§7 — SA đối chiếu tên bảng/entity với schema hiện có; các trường 🔴 là đề xuất từ ma trận Excel.
