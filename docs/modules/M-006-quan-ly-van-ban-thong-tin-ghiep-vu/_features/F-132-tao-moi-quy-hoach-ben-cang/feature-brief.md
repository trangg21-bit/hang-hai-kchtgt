---
id: F-132
name: Tạo mới quy hoạch bến cảng
slug: tao-moi-quy-hoach-ben-cang
module-id: M-006
status: proposed
classification: local
priority: medium
created: 2026-09-02
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Tạo mới quy hoạch bến cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-132
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (có trạng thái ban hành, không khai báo luồng duyệt C1/C2 trong Excel)
**Tham chiếu:** tài liệu nền chung của module (chưa có `ba/01-base-pattern.md` cho M-006) + TKCT + nguồn sự thật Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #38 "TT quy hoạch bến cảng hàng hải".

> **⚠️ Data Scope:** Trường "Đơn vị quản lý" (`orgUnitId`, `SelectOrgCode`) là trường đơn vị phân quyền dữ liệu — xem mục 5 dòng 3 và AGENTS.md mục Data Scope Convention.

---

## 1. Mô tả ngắn

Chức năng tạo mới hồ sơ quy hoạch bến cảng hàng hải: nhập thông tin chung (quyết định, nhóm cảng biển/cảng cạn), kế hoạch quy hoạch, dự báo hàng hóa thông qua cảng, danh mục quy hoạch chi tiết (hiện trạng và sau quy hoạch) và tệp đính kèm. Cùng với F-133 (tra cứu) và F-134 (cập nhật) dùng chung ma trận #38. Người dùng: cán bộ đơn vị quản lý / Cục (tạo hồ sơ quy hoạch).

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #38 (41 trường), dùng chung cho F-132/133/134. **Cột áp dụng cho F-132 = Tạo mới.** Cờ: ✓ = có, — = không. Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel**.

| # | Nhóm (TAB) | Trường | Loại điều khiển | DS | Lọc | Xem | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Thông tin chung | Đơn vị quản lý | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Thông tin chung | Số quyết định quy hoạch | Input Text | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Thông tin chung | Ngày quyết định quy hoạch | DatePicker | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | Thông tin chung | Cảng biển quy hoạch | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Thông tin chung | Nhóm | Select (Cảng biển/cảng cạn) | ✓ | ✓ | — | — | — |
| 6 | Nếu Nhóm = Cảng biển | Cảng biển quy hoạch | Select | — | ✓ | — | — | — |
| 7 | Nếu Nhóm = Cảng biển | Nhóm cảng biển | Select | — | ✓ | — | — | — |
| 8 | Nếu Nhóm = Cảng cạn | Cảng cạn quy hoạch | Select | ✓ | ✓ | — | — | — |
| 9 | Nếu Nhóm = Cảng cạn | Hành lang vận tải | Text | ✓ | ✓ | — | — | — |
| 10 | Nếu Nhóm = Cảng cạn | Khu vực | Select | ✓ | ✓ | ✓ | — | — |
| 11 | Kế hoạch quy hoạch | Dự báo quy hoạch đến năm | DatePicker (chọn năm) | — | — | ✓ | ✓ | ✓ |
| 12 | Kế hoạch quy hoạch | Nội dung quy hoạch | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 13 | Kế hoạch quy hoạch | Nhu cầu sử dụng đất và mặt nước | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 14 | Kế hoạch quy hoạch | Nhu cầu vốn đầu tư | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 15 | Kế hoạch quy hoạch | Giải pháp thực hiện quy hoạch | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 16 | Kế hoạch quy hoạch | Dự án ưu tiên đầu tư | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 17 | Kế hoạch quy hoạch | Tổ chức thực hiện quy hoạch | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 18 | Dự báo hàng hóa thông qua cảng | Phân loại cảng, bến cảng, cầu cảng | Select | — | — | ✓ | ✓ | ✓ |
| 19 | Dự báo hàng hóa thông qua cảng | Cảng, bến cảng, cầu cảng | Select | — | — | ✓ | ✓ | ✓ |
| 20 | Dự báo hàng hóa thông qua cảng | Hàng container (Trọng lượng tối thiểu - tối đa) | DoubleInput | — | — | ✓ | ✓ | ✓ |
| 21 | Dự báo hàng hóa thông qua cảng | Hàng tổng hợp, rời (Trọng lượng tối thiểu - tối đa) | DoubleInput | — | — | ✓ | ✓ | ✓ |
| 22 | Dự báo hàng hóa thông qua cảng | Hàng lỏng, khí (Trọng lượng tối thiểu - tối đa) | DoubleInput | — | — | ✓ | ✓ | ✓ |
| 23 | Dự báo hàng hóa thông qua cảng | Tổng cộng (Trọng lượng tối thiểu - tối đa) | DoubleInput (disabled, tự tính) | — | — | ✓ | ✓ | ✓ |
| 24 | Dự báo hàng hóa thông qua cảng | Ghi chú (dự báo hàng hóa) | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 25 | Danh mục quy hoạch chi tiết — Hiện trạng | Phân loại cảng, bến cảng, cầu cảng | Select | — | — | ✓ | ✓ | ✓ |
| 26 | Danh mục quy hoạch chi tiết — Hiện trạng | Cảng, bến cảng, cầu cảng | Select | — | — | ✓ | ✓ | ✓ |
| 27 | Danh mục quy hoạch chi tiết — Hiện trạng | Công năng khai thác | Select | — | — | ✓ | ✓ | ✓ |
| 28 | Danh mục quy hoạch chi tiết — Hiện trạng | Phân loại | Select | — | — | ✓ | ✓ | ✓ |
| 29 | Danh mục quy hoạch chi tiết — Hiện trạng | Ghi chú (quy hoạch chi tiết) | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 30 | Danh mục quy hoạch chi tiết — Hiện trạng | Số lượng cầu cảng | Input Text | — | — | ✓ | ✓ | ✓ |
| 31 | Danh mục quy hoạch chi tiết — Hiện trạng | Chiều dài (m) | InputDecimal | — | — | ✓ | ✓ | ✓ |
| 32 | Danh mục quy hoạch chi tiết — Hiện trạng | Cỡ tàu (tấn) | Input Text | — | — | ✓ | ✓ | ✓ |
| 33 | Danh mục quy hoạch chi tiết — Sau quy hoạch | Số lượng cầu cảng (KB thấp - KB cao) | DoubleInput | — | — | ✓ | ✓ | ✓ |
| 34 | Danh mục quy hoạch chi tiết — Sau quy hoạch | Chiều dài (m) (KB thấp - KB cao) | DoubleInput | — | — | ✓ | ✓ | ✓ |
| 35 | Danh mục quy hoạch chi tiết — Sau quy hoạch | Dự kiến Cỡ tàu (tấn) | Input Text | — | — | ✓ | ✓ | ✓ |
| 36 | Danh mục quy hoạch chi tiết — Sau quy hoạch | Dự kiến công suất (Triệu tấn) (KB thấp - KB cao) | DoubleInput | — | — | ✓ | ✓ | ✓ |
| 37 | Danh mục quy hoạch chi tiết — Sau quy hoạch | Diện tích vùng đất (ha) | InputDecimal | — | — | ✓ | ✓ | ✓ |
| 38 | Danh mục quy hoạch chi tiết — Sau quy hoạch | Diện tích vùng nước (ha) | InputDecimal | — | — | ✓ | ✓ | ✓ |
| 39 | File đính kèm | Tên file | Upload/Attachment | — | — | ✓ | ✓ | ✓ |
| 40 | Thông tin cập nhật | Người cập nhật | Text (hiển thị, không nhập) | ✓ | — | ✓ | — | — |
| 41 | Thông tin cập nhật | Ngày cập nhật | DatePicker (hiển thị, không nhập) | ✓ | — | ✓ | — | — |

## 3. Trạng thái và phê duyệt

- Ma trận Excel cụm #38 **không có trường "Trạng thái"** và **không khai báo luồng phê duyệt C1/C2**.
- Brief cũ (F-132 legacy) tham chiếu trạng thái ban hành `HIEN_HANH` (Hiện hành) / `DA_THAY_THE` (Đã thay thế) / `LICH_SU` (Lịch sử) — cần **SA chốt** việc bổ sung trường trạng thái và quy trình ban hành (lưu tạm → ban hành → lịch sử).
- Trạng thái lưu dạng số (theo tài liệu nền mục 3.7).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-132-01 | "Nhóm" (Cảng biển/cảng cạn) quyết định hiển thị nhánh trường "Nếu Nhóm = Cảng biển" hay "Nếu Nhóm = Cảng cạn". | Create |
| BR-132-02 | "Tổng cộng" (dự báo hàng hóa) tự tính từ các dòng hàng container/tổng hợp rời/lỏng khí (disabled). | Create / Update |
| BR-132-03 | "Đơn vị quản lý" là trường đơn vị phân quyền dữ liệu; khi tạo phải gán đơn vị trong phạm vi người dùng. | Create / Update |
| BR-132-04 | Người cập nhật / Ngày cập nhật do hệ thống tự điền. | Create / Update |

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới | `portplanning:create` |

**Admin Cục:** full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — trạng thái ban hành (Hiện hành/Đã thay thế/Lịch sử theo legacy; Excel không khai báo → SA chốt) |
| 2 | Có bước phê duyệt không | Không — Excel không khai báo luồng duyệt C1/C2 |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (Đơn vị quản lý) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — nhánh "Nếu Nhóm = Cảng biển" / "Nếu Nhóm = Cảng cạn" theo giá trị "Nhóm" |
| 5 | Quyền riêng | `portplanning:create` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — Upload/Attachment (File đính kèm) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + form/drawer convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/portplannings` | Tạo mới hồ sơ quy hoạch bến cảng | `portplanning:create` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `port_planning` (quy hoạch bến cảng hàng hải):** 🔴 `org_unit_id` (Đơn vị quản lý), 🔴 `decision_no` (Số quyết định), 🔴 `decision_date` (Ngày quyết định), 🔴 `seaport_id` (Cảng biển quy hoạch), 🔴 `group` (Nhóm: cảng biển/cảng cạn), 🔴 `transport_corridor` (Hành lang vận tải), 🔴 `area` (Khu vực), 🔴 `planning_year` (Dự báo quy hoạch đến năm), 🔴 `planning_content`, 🔴 `land_water_demand`, 🔴 `capital_demand`, 🔴 `implementation_solution`, 🔴 `priority_project`, 🔴 `implementation_org`, 🔴 `updated_by`, 🔴 `updated_at`.

**Bảng con `port_planning_cargo_forecast` (dự báo hàng hóa):** 🔴 `port_planning_id`, 🔴 `port_category` (Phân loại), 🔴 `port_name` (Cảng, bến cảng, cầu cảng), 🔴 `container_min`, 🔴 `container_max`, 🔴 `general_cargo_min`, 🔴 `general_cargo_max`, 🔴 `liquid_min`, 🔴 `liquid_max`, 🔴 `total_min`, 🔴 `total_max`, 🔴 `note`.

**Bảng con `port_planning_detail` (danh mục quy hoạch chi tiết — hiện trạng/sau quy hoạch):** 🔴 `port_planning_id`, 🔴 `phase` (Hiện trạng / Sau quy hoạch), 🔴 `port_category`, 🔴 `port_name`, 🔴 `exploitation_function` (Công năng khai thác), 🔴 `classification` (Phân loại), 🔴 `berth_count` (Số lượng cầu cảng), 🔴 `length` (Chiều dài), 🔴 `ship_size` (Cỡ tàu), 🔴 `capacity` (Dự kiến công suất), 🔴 `land_area` (Diện tích vùng đất), 🔴 `water_area` (Diện tích vùng nước), 🔴 `note`.

**Bảng con `port_planning_file` (tệp đính kèm):** 🔴 `port_planning_id`, 🔴 `file_name`.

> Ghi chú: brief cũ F-132 có 3 file con (Bang-B Kế hoạch quy hoạch / Bang-C Dự báo hàng hóa / Bang-D Danh mục quy hoạch chi tiết) ở định dạng 11-mục legacy — SA hợp nhất về ma trận #38 ở trên; các trường 🔴 là đề xuất, chưa đối chiếu với schema đang chạy.
