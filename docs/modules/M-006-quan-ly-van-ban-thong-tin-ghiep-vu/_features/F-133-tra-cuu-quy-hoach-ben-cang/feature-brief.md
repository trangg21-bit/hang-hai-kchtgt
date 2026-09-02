---
id: F-133
name: Tra cứu quy hoạch bến cảng
slug: tra-cuu-quy-hoach-ben-cang
module-id: M-006
status: proposed
classification: local
priority: medium
created: 2026-09-02
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Tra cứu quy hoạch bến cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-133
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (chỉ đọc — tra cứu)
**Tham chiếu:** tài liệu nền chung của module (chưa có `ba/01-base-pattern.md` cho M-006) + TKCT + nguồn sự thật Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #38 "TT quy hoạch bến cảng hàng hải".

> **⚠️ Data Scope:** Trường "Đơn vị quản lý" (`orgUnitId`, `SelectOrgCode`) là trường đơn vị phân quyền dữ liệu — xem mục 5 dòng 3 và AGENTS.md mục Data Scope Convention.

---

## 1. Mô tả ngắn

Chức năng tra cứu (chỉ đọc) hồ sơ quy hoạch bến cảng hàng hải: xem danh sách, lọc theo đơn vị/nhóm cảng biển-cảng cạn và xem chi tiết đầy đủ (thông tin chung, kế hoạch quy hoạch, dự báo hàng hóa, danh mục quy hoạch chi tiết, tệp đính kèm). Không tạo/sửa. Cùng F-132 (tạo mới) và F-134 (cập nhật) dùng chung ma trận #38. Người dùng: lãnh đạo, cán bộ đơn vị, Cục (tra cứu).

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #38 (41 trường), dùng chung cho F-132/133/134. **Cột áp dụng cho F-133 = Danh sách / Bộ lọc / Xem chi tiết.** Cờ: ✓ = có, — = không. Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel**.

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

- Ma trận Excel cụm #38 **không có trường "Trạng thái"**; trạng thái ban hành (Hiện hành/Đã thay thế/Lịch sử theo legacy F-132) cần **SA chốt**.
- **Không có thao tác phê duyệt** trong chức năng tra cứu (chỉ đọc).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-133-01 | Tra cứu chỉ đọc — không cho phép tạo/sửa/xóa. | Read |
| BR-133-02 | Kết quả tra cứu giới hạn theo phạm vi đơn vị (`orgUnitId`) của người dùng. | Read |

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `portplanning:read` |

**Admin Cục:** xem full + metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — trạng thái ban hành (theo legacy; Excel không khai báo → SA chốt) |
| 2 | Có bước phê duyệt không | Không — tra cứu chỉ đọc |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (Đơn vị quản lý) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — nhánh "Nếu Nhóm = Cảng biển" / "Nếu Nhóm = Cảng cạn" theo "Nhóm" |
| 5 | Quyền riêng | `portplanning:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (chỉ xem/tải tệp đính kèm) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + drawer Xem chi tiết convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/portplannings` | Danh sách quy hoạch bến cảng (lọc theo đơn vị, nhóm) | `portplanning:read` |
| GET | `/api/portplannings/{id}` | Chi tiết hồ sơ quy hoạch | `portplanning:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Dùng chung cấu trúc bảng với F-132 (xem F-132 §7): bảng `port_planning` + bảng con `port_planning_cargo_forecast`, `port_planning_detail`, `port_planning_file`. Quy ước 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.
