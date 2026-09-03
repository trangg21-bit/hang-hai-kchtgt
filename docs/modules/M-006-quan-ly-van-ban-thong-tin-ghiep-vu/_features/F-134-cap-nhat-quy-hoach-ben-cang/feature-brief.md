---
id: F-134
name: Cập nhật quy hoạch bến cảng
slug: cap-nhat-quy-hoach-ben-cang
module-id: M-006
status: proposed
classification: local
priority: medium
created: 2026-09-02
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Cập nhật quy hoạch bến cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-134
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (có trạng thái ban hành, không khai báo luồng duyệt C1/C2 trong Excel)
**Tham chiếu:** tài liệu nền chung của module (chưa có `ba/01-base-pattern.md` cho M-006) + TKCT + nguồn sự thật Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #38 "TT quy hoạch bến cảng hàng hải".

> **⚠️ Data Scope:** Trường "Đơn vị quản lý" (`orgUnitId`, `SelectOrgCode`) là trường đơn vị phân quyền dữ liệu — xem mục 5 dòng 3 và AGENTS.md mục Data Scope Convention.

---

## 1. Mô tả ngắn

Chức năng cập nhật hồ sơ quy hoạch bến cảng hàng hải đã tồn tại: sửa thông tin chung, kế hoạch quy hoạch, dự báo hàng hóa, danh mục quy hoạch chi tiết và tệp đính kèm. Cùng F-132 (tạo mới) và F-133 (tra cứu) dùng chung ma trận #38. Người dùng: cán bộ đơn vị quản lý / Cục (cập nhật hồ sơ quy hoạch).

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #38 (41 trường), dùng chung cho F-132/133/134. **Cột áp dụng cho F-134 = Sửa.** Cờ: ✓ = có, — = không. Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel**.

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
- Trạng thái ban hành (Hiện hành/Đã thay thế/Lịch sử theo legacy F-132) cần **SA chốt**; lưu dạng số.
- **Không có bước phê duyệt** (cập nhật nội dung hồ sơ, không phát sinh approval log).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-134-01 | "Nhóm" (Cảng biển/cảng cạn) quyết định hiển thị nhánh trường "Nếu Nhóm = Cảng biển" hay "Nếu Nhóm = Cảng cạn". | Update |
| BR-134-02 | "Tổng cộng" (dự báo hàng hóa) tự tính (disabled), không cho sửa tay. | Update |
| BR-134-03 | "Đơn vị quản lý" là trường đơn vị phân quyền dữ liệu; khi sửa phải validate đơn vị trong phạm vi người dùng. | Update |
| BR-134-04 | Người cập nhật / Ngày cập nhật do hệ thống tự điền khi lưu. | Update |

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật | `portplanning:update` |

**Admin Cục:** full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — trạng thái ban hành (theo legacy; Excel không khai báo → SA chốt) |
| 2 | Có bước phê duyệt không | Không — Excel không khai báo luồng duyệt C1/C2 |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (Đơn vị quản lý) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — nhánh "Nếu Nhóm = Cảng biển" / "Nếu Nhóm = Cảng cạn" theo "Nhóm" |
| 5 | Quyền riêng | `portplanning:update` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — Upload/Attachment (File đính kèm) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + form/drawer convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/portplannings/{id}` | Cập nhật hồ sơ quy hoạch bến cảng | `portplanning:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Dùng chung cấu trúc bảng với F-132 (xem F-132 §7): bảng `port_planning` + bảng con `port_planning_cargo_forecast`, `port_planning_detail`, `port_planning_file`. Quy ước 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.
