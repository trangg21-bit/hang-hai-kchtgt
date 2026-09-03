---
id: F-129
name: Quản lý thông tin vận hành khai thác
slug: quan-ly-thong-tin-van-hanh
module-id: M-006
status: proposed
classification: local
priority: high
created: 2026-09-02
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý thông tin vận hành khai thác

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-129
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền chung của module (chưa có `ba/01-base-pattern.md` cho M-006) + tài liệu yêu cầu gốc (TKCT) + nguồn sự thật Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #35 "QL TT vận hành khai thác".

> **⚠️ Data Scope:** Trường "Đơn vị quản lý" (`orgUnitId`, `SelectOrgCode`) là trường đơn vị phân quyền dữ liệu — xem mục 5 dòng 3 và AGENTS.md mục Data Scope Convention.

---

## 1. Mô tả ngắn

Chức năng quản lý thông tin vận hành khai thác kết cấu hạ tầng hàng hải (KCHT): lập kế hoạch vận hành khai thác, liệt kê danh sách công trình thuộc kế hoạch, đính kèm tệp kế hoạch; khi kế hoạch ở trạng thái "Hoàn thành" thì ghi nhận kết quả xác nhận vận hành thực tế (thời gian hoạt động, công suất, tần suất sự cố) kèm tệp xác nhận. Người dùng: cán bộ đơn vị quản lý KCHT (tạo/sửa), lãnh đạo/cục tra cứu.

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #35 (30 trường). Cờ: ✓ = có (true), — = không (false). Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel**.

| # | Nhóm (TAB) | Trường | Loại điều khiển | DS | Lọc | Xem | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Kế hoạch vận hành khai thác | Đơn vị quản lý | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Kế hoạch vận hành khai thác | Đơn vị vận hành khai thác | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Kế hoạch vận hành khai thác | Loại kết cấu hạ tầng | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | Kế hoạch vận hành khai thác | Mã kế hoạch vận hành khai thác | Input Text (disabled, tự sinh) | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Kế hoạch vận hành khai thác | Tên kế hoạch vận hành khai thác | InputTextArea | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6 | Kế hoạch vận hành khai thác | Nội dung kế hoạch vận hành khai thác | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 7 | Kế hoạch vận hành khai thác | Trạng thái vận hành khai thác | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 8 | Kế hoạch vận hành khai thác | Ngày bắt đầu vận hành khai thác dự kiến | DatePicker | ✓ | — | ✓ | ✓ | ✓ |
| 9 | Kế hoạch vận hành khai thác | Ngày kết thúc vận hành khai thác dự kiến | DatePicker | ✓ | — | ✓ | ✓ | ✓ |
| 10 | Kế hoạch vận hành khai thác | Ghi chú | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 11 | Danh sách công trình | Mã kết cấu hạ tầng | Select | — | — | ✓ | ✓ | ✓ |
| 12 | Danh sách công trình | Tên kết cấu hạ tầng | Input Text | — | — | ✓ | ✓ | ✓ |
| 13 | Danh sách công trình | Địa điểm | Input Text | — | — | ✓ | ✓ | ✓ |
| 14 | Danh sách công trình | Thuộc cảng biển | Select | — | — | ✓ | ✓ | ✓ |
| 15 | File kế hoạch vận hành khai thác | Loại kế hoạch vận hành khai thác | Select | — | — | ✓ | ✓ | ✓ |
| 16 | File kế hoạch vận hành khai thác | Tên file | Upload/Attachment | — | — | ✓ | ✓ | ✓ |
| 17 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Ngày bắt đầu vận hành khai thác | DatePicker | — | — | ✓ | — | ✓ |
| 18 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Ngày kết thúc vận hành khai thác | DatePicker | — | — | ✓ | — | ✓ |
| 19 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Thời gian hoạt động | Input Text | — | — | ✓ | — | ✓ |
| 20 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Tình trạng hoạt động | Select | — | — | ✓ | — | ✓ |
| 21 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Thời gian ngừng hoạt động | Input Text | — | — | ✓ | — | ✓ |
| 22 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Tần suất sự cố | Input Text | — | — | ✓ | — | ✓ |
| 23 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Công suất tối đa | Input Text | — | — | ✓ | — | ✓ |
| 24 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Công suất thực tế | Input Text | — | — | ✓ | — | ✓ |
| 25 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Nội dung kết quả vận hành khai thác | InputTextArea | — | — | ✓ | — | ✓ |
| 26 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Ghi chú (kết quả) | InputTextArea | — | — | ✓ | — | ✓ |
| 27 | File xác nhận vận hành khai thác | Loại xác nhận vận hành khai thác | Select | — | — | ✓ | — | ✓ |
| 28 | File xác nhận vận hành khai thác | Tên file | Upload/Attachment | — | — | ✓ | — | ✓ |
| 29 | Trạng thái | Cán bộ cập nhật | Text (hiển thị, không nhập) | ✓ | — | ✓ | — | — |
| 30 | Trạng thái | Ngày cập nhật | DatePicker (hiển thị, không nhập) | ✓ | — | ✓ | — | — |

## 3. Trạng thái và phê duyệt

- Excel cụm #35 **không khai báo luồng phê duyệt** (không có cấp C1/C2). Trạng thái nghiệp vụ nằm ở trường "Trạng thái vận hành khai thác" (số 7) và TAB "Xác nhận vận hành khai thác" chỉ hiển thị khi **trạng thái = Hoàn thành**.
- Trạng thái lưu dạng số (theo tài liệu nền mục 3.7); bộ giá trị cụ thể chưa được Excel khai báo → **SA chốt** (gợi ý theo chuẩn 7 trạng thái phê duyệt của hệ thống, xem AGENTS.md).
- **Không có bước phê duyệt** (không phát sinh approval log) — chỉ là trạng thái vận hành nội bộ.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-129-01 | Mã kế hoạch vận hành khai thác tự sinh, không cho nhập tay. | Create |
| BR-129-02 | TAB "Xác nhận vận hành khai thác" chỉ hiển thị/ghi nhận khi trạng thái = Hoàn thành. | Update |
| BR-129-03 | "Đơn vị quản lý" là trường đơn vị phân quyền dữ liệu; khi tạo phải gán đơn vị trong phạm vi người dùng (không để NULL). | Create / Update |
| BR-129-04 | Cán bộ cập nhật / Ngày cập nhật do hệ thống tự điền, không cho nhập. | Create / Update |

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `operationplan:read` |
| Tạo mới | `operationplan:create` |
| Sửa | `operationplan:update` |
| Xóa | `operationplan:delete` |

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — "Trạng thái vận hành khai thác" (giá trị chưa khai báo, SA chốt) |
| 2 | Có bước phê duyệt không | Không — Excel không khai báo luồng duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (Đơn vị quản lý), lọc subtree, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — TAB "Xác nhận vận hành khai thác" hiện khi trạng thái = Hoàn thành |
| 5 | Quyền riêng | `operationplan:read/create/update/delete` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — Upload/Attachment (file kế hoạch + file xác nhận) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + form/drawer convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/operationplans` | Danh sách kế hoạch vận hành khai thác (lọc theo đơn vị, trạng thái) | `operationplan:read` |
| GET | `/api/operationplans/{id}` | Chi tiết kế hoạch | `operationplan:read` |
| POST | `/api/operationplans` | Tạo mới kế hoạch | `operationplan:create` |
| PUT | `/api/operationplans/{id}` | Sửa / ghi nhận xác nhận vận hành | `operationplan:update` |
| DELETE | `/api/operationplans/{id}` | Xóa mềm | `operationplan:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `operation_plan` (kế hoạch vận hành khai thác):** 🔴 `org_unit_id` (Đơn vị quản lý), 🔴 `operation_unit_id` (Đơn vị vận hành khai thác), 🔴 `infrastructure_type` (Loại KCHT), 🔴 `code` (Mã kế hoạch — tự sinh), 🔴 `name` (Tên kế hoạch), 🔴 `content` (Nội dung), 🔴 `status` (Trạng thái vận hành khai thác), 🔴 `expected_start_date`, 🔴 `expected_end_date`, 🔴 `note` (Ghi chú), 🔴 `updated_by`, 🔴 `updated_at`.

**Bảng con `operation_plan_work` (danh sách công trình):** 🔴 `operation_plan_id` (FK), 🔴 `infrastructure_id` (Mã KCHT), 🔴 `name` (Tên KCHT), 🔴 `location` (Địa điểm), 🔴 `port_id` (Thuộc cảng biển).

**Bảng con `operation_plan_file` (tệp):** 🔴 `operation_plan_id`, 🔴 `file_type` (Loại kế hoạch / Loại xác nhận), 🔴 `file_name` (Tên file).

**Bảng con `operation_confirmation` (xác nhận vận hành — hiện khi Hoàn thành):** 🔴 `operation_plan_id`, 🔴 `actual_start_date`, 🔴 `actual_end_date`, 🔴 `operating_time`, 🔴 `operating_status`, 🔴 `downtime`, 🔴 `incident_frequency`, 🔴 `max_capacity`, 🔴 `actual_capacity`, 🔴 `result_content`, 🔴 `result_note`.

> Ghi chú: brief cũ (F-129 legacy) tham chiếu entity `KeHoachVanHanh` trong package `vanban` — SA đối chiếu/đồng bộ tên bảng với entity hiện có; các trường 🔴 là đề xuất từ ma trận Excel, chưa đối chiếu với schema đang chạy.
