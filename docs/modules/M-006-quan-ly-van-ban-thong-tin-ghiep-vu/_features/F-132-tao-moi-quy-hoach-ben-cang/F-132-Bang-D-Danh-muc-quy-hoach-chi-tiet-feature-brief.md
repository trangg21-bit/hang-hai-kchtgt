---
id: F-132-Bang-D-Danh-muc-quy-hoach-chi-tiet
name: Danh mục quy hoạch chi tiết (Bảng D)
slug: danh-muc-quy-hoach-chi-tiet
module-id: M-006
status: proposed
classification: local
priority: medium
created: 2026-08-13T00:00:00Z
last-updated: 2026-08-13T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Danh mục quy hoạch chi tiết (Bảng D)

**Tài liệu:** BA Feature Brief
**Feature:** F-132-Bang-D-Danh-muc-quy-hoach-chi-tiet
**Module:** M-006 — Quản lý văn bản & Thông tin nghiệp vụ
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-13

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Bảng D — **Danh mục quy hoạch chi tiết** (`zlstDanhMucChiTiet`) là danh sách con nằm trong form Tạo mới quy hoạch bến cảng (F-132). Mỗi dòng mô tả quy hoạch chi tiết của một cảng/bến/cầu cụ thể: công năng khai thác, số lượng cầu cảng, chiều dài, cỡ tàu, công suất, diện tích vùng đất/nước. Bảng hỗ trợ 5 thao tác:

1. **Thêm mới:** nhập thủ công từng dòng qua form
2. **Tải file mẫu:** tải file mẫu (Excel/CSV) để nhập liệu
3. **Thêm mới từ file:** import file tạo mới hàng loạt
4. **Cập nhật từ file:** import file cập nhật dòng đã tồn tại
5. **Xóa:** xóa từng dòng đã tạo

> ⚠ **Quan trọng:** Mọi thao tác trên bảng D chỉ thao tác trên **dữ liệu trong bảng (in-memory, chưa lưu DB)**. Dữ liệu chỉ được lưu vào DB khi người dùng nhấn nút **"Lưu"** ở form Tạo mới quy hoạch bến cảng (F-132) — lúc đó toàn bộ `zlstDanhMucChiTiet` được gửi cùng `POST /api/v1/port-planning`.

### 1.2. Tại sao cần tính năng này?

Danh mục quy hoạch chi tiết là bảng thông số kỹ thuật chi tiết của quy hoạch — số cầu cảng, chiều dài, cỡ tàu, công suất, diện tích đất/nước. Việc nhập liệu thủ công + import file giúp nhập nhanh, chính xác khối lượng lớn chỉ tiêu kỹ thuật.

### 1.3. Luồng hoạt động chính

1. Người dùng mở form Tạo mới quy hoạch bến cảng (F-132).
2. Tại bảng D — Danh mục quy hoạch chi tiết, người dùng chọn thao tác:
   - **Thêm mới** → form nhập → Lưu → hiển thị trong bảng
   - **Tải file mẫu** → tải file mẫu → **Thêm mới từ file** hoặc **Cập nhật từ file**
   - **Xóa** → popup xác nhận → xóa khỏi bảng
3. Khi hoàn tất, nhấn "Lưu" ở form quy hoạch chính để lưu toàn bộ vào DB.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

Các thao tác trong bảng D được bảo vệ bởi quyền `portplanning:create` (thừa hưởng từ form Tạo mới quy hoạch F-132).

### 2.2. Logic phân quyền đặc biệt

Không có phân quyền riêng cho bảng D.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-D-01:** Là Planner, tôi muốn thêm mới dòng danh mục quy hoạch chi tiết thủ công để nhập chỉ tiêu kỹ thuật cho từng cảng/bến/cầu.
- **US-D-02:** Là Planner, tôi muốn tải file mẫu để biết cấu trúc file cần điền khi nhập hàng loạt.
- **US-D-03:** Là Planner, tôi muốn thêm mới từ file để tạo hàng loạt dòng danh mục nhanh chóng.
- **US-D-04:** Là Planner, tôi muốn cập nhật từ file để sửa hàng loạt dòng đã tồn tại.
- **US-D-05:** Là Planner, tôi muốn xóa dòng đã tạo mới để dọn dẹp dữ liệu nhập sai.

### Mức Should (nên có)

- **US-D-06:** Là Planner, tôi muốn hệ thống hiển thị thông báo rõ ràng khi import thành công/thất bại.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### 4.1. Thêm mới (thủ công)

**AC-D-01 — Hiển thị form thêm mới:** Người dùng nhấn "Thêm mới", hệ thống hiển thị form với các trường: Phân loại (CB/BC/CC), Cảng/bến/cầu cụ thể, Công năng khai thác, Phân loại, Số lượng cầu cảng, Chiều dài, Cỡ tàu, Số cầu cảng KB thấp/cao, Chiều dài KB thấp/cao, Dự kiến cỡ tàu, Dự kiến công suất KB thấp/cao, Diện tích vùng đất, Diện tích vùng nước.

**AC-D-02 — Validation bắt buộc:** Trường "Phân loại (CB/BC/CC)" và "Cảng, bến, cầu cụ thể" là bắt buộc. Bỏ trống → lỗi "Trường này là bắt buộc", chặn submit.

**AC-D-03 — Trùng dòng:** Cặp "Phân loại + Cảng, bến, cầu cụ thể" phải duy nhất trong bảng D. Trùng → lỗi "Cảng, bến, cầu cụ thể đã tồn tại", chặn submit.

**AC-D-04 — Lưu dòng:** Nhấn "Lưu", dòng được thêm vào cuối bảng D (chỉ hiển thị, **không lưu DB**). Thông báo "Đã thêm danh mục quy hoạch chi tiết".

**AC-D-05 — Hủy:** Nhấn "Hủy" đóng form, không thêm dòng.

### 4.2. Tải file mẫu

**AC-D-06 — Tải file mẫu:** Nhấn "Tải file mẫu", hệ thống tải về file Excel/CSV với header đúng các cột của bảng D (xem mục 9.2).

### 4.3. Thêm mới từ file

**AC-D-07 — Chọn file:** Nhấn "Thêm mới từ file", mở hộp thoại chọn file. Chỉ chấp nhận `.xlsx`, `.xls`, `.csv`.

**AC-D-08 — Đọc và validate:** Hệ thống đọc dữ liệu, validate từng dòng (header đúng, Phân loại và Cảng/bến/cầu không rỗng, không trùng, giá trị số hợp lệ).

**AC-D-09 — Tạo mới hàng loạt:** Validate hợp lệ → tạo mới các dòng trong bảng D. Thông báo "Đã thêm N dòng từ file".

**AC-D-10 — Không sửa dòng đang có:** File "thêm mới từ file" không ghi đè dòng đang có. Dòng trùng "Cảng, bến, cầu cụ thể" bị bỏ qua kèm cảnh báo.

### 4.4. Cập nhật từ file

**AC-D-11 — Xác định dòng qua Cảng, bến, cầu cụ thể:** Khi "cập nhật từ file", hệ thống dùng "Cảng, bến, cầu cụ thể" để xác định dòng cần cập nhật.

**AC-D-12 — Cập nhật dòng tồn tại:** Nếu "Cảng, bến, cầu cụ thể" đã tồn tại trong bảng, hệ thống cập nhật các trường còn lại.

**AC-D-13 — Không tạo dòng mới:** Nếu "Cảng, bến, cầu cụ thể" không tồn tại, hệ thống **không tạo dòng mới** — bỏ qua kèm cảnh báo "Không tìm thấy dòng có Cảng, bến, cầu cụ thể [X]".

### 4.5. Xóa

**AC-D-14 — Popup xác nhận:** Nhấn "Xóa" trên dòng, hiển thị popup "Bạn có chắc chắn muốn xóa dòng [Cảng, bến, cầu cụ thể]? Thao tác này không thể hoàn tác."

**AC-D-15 — Xóa dòng:** Nhấn "Xóa" trong popup, dòng được xóa khỏi bảng D (chưa lưu DB). Nhấn "Hủy" đóng popup.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-D-01 — Dữ liệu in-memory:** Mọi thao tác trên bảng D chỉ thay đổi dữ liệu trong bảng, **không ghi DB**. Chỉ lưu khi nhấn "Lưu" ở form Tạo mới quy hoạch bến cảng (F-132).

**BR-D-02 — Cảng, bến, cầu cụ thể là khóa định danh:** Trường "Cảng, bến, cầu cụ thể" (kết hợp "Phân loại") đóng vai trò khóa định danh trong bảng D — dùng để xác định dòng khi cập nhật từ file.

**BR-D-03 — Thêm mới từ file không ghi đè:** File "thêm mới từ file" chỉ tạo mới, không ghi đè dòng đang có.

**BR-D-04 — Cập nhật từ file không tạo mới:** File "cập nhật từ file" chỉ cập nhật dòng đã tồn tại, không tạo dòng mới.

**BR-D-05 — Định dạng file:** Chỉ chấp nhận `.xlsx`, `.xls`, `.csv`. Header file mẫu phải khớp đúng các cột của bảng D.

---

## 6. Vòng đời và liên kết với các tính năng khác

### 6.1. Quan hệ với F-132

Bảng D là **danh sách con** của form Tạo mới quy hoạch bến cảng (F-132). Dữ liệu được gom vào `zlstDanhMucChiTiet` khi lưu quy hoạch chính.

### 6.2. Các bảng con khác

Bảng D cùng cấp với:
- Bảng B — Kế hoạch quy hoạch (`zlstKeHoach`)
- Bảng C — Dự báo hàng hóa thông qua cảng (`zlstDuBaoHhQuaCang`)
- Bảng E — File đính kèm (`zlstFileDk`)

---

## 7. Mô hình dữ liệu

### 7.1. Bảng `zlstDanhMucChiTiet` — Danh mục quy hoạch chi tiết

Mỗi dòng = quy hoạch chi tiết của một cảng/bến/cầu cụ thể:

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `phanLoaiCangBenCangCauCang` | ENUM (CB/BC/CC) | Có | Phân loại: Cảng biển / Bến cảng / Cầu cảng |
| `cangBenCangCauCang` | TEXT | Có | Cảng, bến, cầu cụ thể — **khóa định danh** |
| `congNangKhaiThac` | TEXT | Không | Công năng khai thác |
| `phanLoai` | TEXT | Không | Phân loại |
| `ghiChu` | TEXT | Không | Ghi chú |
| `soLuongCauCang` | INTEGER | Không | Số lượng cầu cảng |
| `chieuDai` | DECIMAL(20,4) | Không | Chiều dài (m) |
| `coTau` | TEXT | Không | Cỡ tàu (tấn) |
| `soLuongCauCangKbThap` | INTEGER | Không | Số cầu cảng KB thấp |
| `soLuongCauCangKbCao` | INTEGER | Không | Số cầu cảng KB cao |
| `chieuDaiKbThap` | DECIMAL(20,4) | Không | Chiều dài KB thấp |
| `chieuDaiKbCao` | DECIMAL(20,4) | Không | Chiều dài KB cao |
| `duKienCoTau` | TEXT | Không | Dự kiến cỡ tàu (tấn) |
| `duKienCongSuatKbThap` | DECIMAL(20,4) | Không | Dự kiến công suất KB thấp |
| `duKienCongSuatKbCao` | DECIMAL(20,4) | Không | Dự kiến công suất KB cao |
| `dienTichVungDat` | DECIMAL(20,4) | Không | Diện tích vùng đất (ha) |
| `dienTichVungNuoc` | DECIMAL(20,4) | Không | Diện tích vùng nước (ha) |

> **Ghi chú:** Dữ liệu được quản lý dạng danh sách in-memory. Khi lưu quy hoạch chính, danh sách này serialize thành mảng `zlstDanhMucChiTiet` gửi trong request body.

---

## 8. API Endpoints

Bảng D không có API riêng. Dữ liệu `zlstDanhMucChiTiet` gửi kèm trong request body của API tạo quy hoạch chính:

```json
{
  "fkDonViQl": "...",
  "fkCangBien": "...",
  "quyetDinhSo": "174/QĐ-BGTVT",
  "quyetDinhNgay": "2024-03-20",
  "zlstDanhMucChiTiet": [
    {
      "phanLoaiCangBenCangCauCang": "CC",
      "cangBenCangCauCang": "G17.43.000001-CC-000001",
      "congNangKhaiThac": "Bốc xếp container",
      "phanLoai": "Cầu cảng tổng hợp",
      "soLuongCauCang": 5,
      "chieuDai": 1200.0,
      "coTau": "50000",
      "soLuongCauCangKbThap": 3,
      "soLuongCauCangKbCao": 7,
      "chieuDaiKbThap": 800.0,
      "chieuDaiKbCao": 1500.0,
      "duKienCoTau": "70000",
      "duKienCongSuatKbThap": 10.0,
      "duKienCongSuatKbCao": 15.0,
      "dienTichVungDat": 80.0,
      "dienTichVungNuoc": 200.0
    }
  ]
}
```

---

## 9. Chi tiết nghiệp vụ từng phần

### 9.1. Thêm mới (thủ công)

**Form thêm mới** chia 3 nhóm thông tin (gom nhóm):

#### A. Thông tin quy hoạch chi tiết (trường 1-5)

| STT | Tên trường | Loại điều khiển | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| 1 | Phân loại (CB/BC/CC) | Select | Có | Chọn: Cảng biển / Bến cảng / Cầu cảng |
| 2 | Cảng, bến, cầu cụ thể | SelectKcht | Có | Chọn cảng/bến/cầu cụ thể. Là khóa định danh, duy nhất trong bảng. |
| 3 | Công năng khai thác | Select | Không | Chọn công năng khai thác |
| 4 | Phân loại | Select | Không | Chọn phân loại |
| 5 | Ghi chú | Textarea | Không | Nhập ghi chú |

#### B. Hiện trạng (trường 6-8)

| STT | Tên trường | Loại điều khiển | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| 6 | Số lượng cầu cảng | Number Input | Không | Nhập số lượng cầu cảng hiện tại (0-99999) |
| 7 | Chiều dài (m) | Number Input | Không | Nhập chiều dài hiện tại (Decimal 20,4) |
| 8 | Cỡ tàu (tấn) | Number Input | Không | Nhập cỡ tàu hiện tại |

#### C. Sau quy hoạch (trường 9-14)

| STT | Tên trường | Loại điều khiển | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| 9 | Số cầu cảng KB thấp/cao | Number Input ×2 | Không | Nhập số cầu cảng kỳ báo cáo thấp/cao |
| 10 | Chiều dài KB thấp/cao | Number Input ×2 | Không | Nhập chiều dài kỳ báo cáo thấp/cao |
| 11 | Dự kiến cỡ tàu (tấn) | Number Input | Không | Nhập dự kiến cỡ tàu |
| 12 | Dự kiến công suất KB thấp/cao | Number Input ×2 | Không | Nhập dự kiến công suất thấp/cao |
| 13 | Diện tích vùng đất (ha) | Number Input | Không | Nhập diện tích vùng đất |
| 14 | Diện tích vùng nước (ha) | Number Input | Không | Nhập diện tích vùng nước |

**Nút hành động:**

| Nút | Hành động |
| --- | --- |
| **Lưu** | Validate → thêm dòng vào cuối bảng D (chỉ hiển thị, không lưu DB). Thông báo "Đã thêm danh mục quy hoạch chi tiết". |
| **Hủy** | Đóng form, không thêm dòng. |

### 9.2. Tải file mẫu

Nhấn "Tải file mẫu" → tải file Excel/CSV về máy. File mẫu có **header các cột** tương ứng:

**Nhóm A — Thông tin quy hoạch chi tiết:**

| # | Cột trong file | Tương ứng trường | Bắt buộc |
| --- | --- | --- | --- |
| 1 | Phân loại (CB/BC/CC) | `phanLoaiCangBenCangCauCang` | Có |
| 2 | Cảng, bến, cầu cụ thể | `cangBenCangCauCang` | Có |
| 3 | Công năng khai thác | `congNangKhaiThac` | Không |
| 4 | Phân loại | `phanLoai` | Không |
| 5 | Ghi chú | `ghiChu` | Không |

**Nhóm B — Hiện trạng:**

| # | Cột trong file | Tương ứng trường | Bắt buộc |
| --- | --- | --- | --- |
| 6 | Số lượng cầu cảng | `soLuongCauCang` | Không |
| 7 | Chiều dài (m) | `chieuDai` | Không |
| 8 | Cỡ tàu (tấn) | `coTau` | Không |

**Nhóm C — Sau quy hoạch:**

| # | Cột trong file | Tương ứng trường | Bắt buộc |
| --- | --- | --- | --- |
| 9 | Số cầu cảng KB thấp | `soLuongCauCangKbThap` | Không |
| 10 | Số cầu cảng KB cao | `soLuongCauCangKbCao` | Không |
| 11 | Chiều dài KB thấp | `chieuDaiKbThap` | Không |
| 12 | Chiều dài KB cao | `chieuDaiKbCao` | Không |
| 13 | Dự kiến cỡ tàu (tấn) | `duKienCoTau` | Không |
| 14 | Dự kiến công suất KB thấp | `duKienCongSuatKbThap` | Không |
| 15 | Dự kiến công suất KB cao | `duKienCongSuatKbCao` | Không |
| 16 | Diện tích vùng đất (ha) | `dienTichVungDat` | Không |
| 17 | Diện tích vùng nước (ha) | `dienTichVungNuoc` | Không |

### 9.3. Thêm mới từ file

**Quy trình:**

1. Nhấn "Thêm mới từ file" → mở hộp thoại chọn file (`.xlsx`, `.xls`, `.csv`).
2. Chọn file → hệ thống đọc dữ liệu.
3. Validate từng dòng theo bảng lỗi dưới đây.
4. Tạo mới các dòng hợp lệ vào bảng D.
5. Hiển thị thông báo kết quả.

**Các case và exception:**

| Tình huống | Xử lý |
| --- | --- |
| File rỗng (0 dòng dữ liệu) | Lỗi "File rỗng, không có dữ liệu để thêm" |
| File sai định dạng (không phải xlsx/xls/csv) | Lỗi "Định dạng file không được hỗ trợ" |
| Header không khớp các cột mẫu | Lỗi "Cấu trúc file không đúng với file mẫu" |
| "Phân loại (CB/BC/CC)" trống hoặc sai giá trị (khác CB/BC/CC) | Dòng bị bỏ qua, cảnh báo "Dòng [N]: Phân loại không hợp lệ" |
| "Cảng, bến, cầu cụ thể" trống | Dòng bị bỏ qua, cảnh báo "Dòng [N]: Cảng, bến, cầu cụ thể không được để trống" |
| "Cảng, bến, cầu cụ thể" trùng dòng đã có trong bảng | Dòng bị bỏ qua (không ghi đè), cảnh báo "Dòng [N]: Cảng, bến, cầu cụ thể đã tồn tại" |
| Giá trị số (số lượng, chiều dài, diện tích...) không phải số hợp lệ hoặc âm | Dòng bị bỏ qua, cảnh báo "Dòng [N]: Giá trị số không hợp lệ" |
| Giá trị KB thấp > KB cao | Dòng bị bỏ qua, cảnh báo "Dòng [N]: Giá trị KB thấp lớn hơn KB cao" |
| Tất cả dòng hợp lệ | Thêm toàn bộ, thông báo "Đã thêm N dòng từ file" |
| Có dòng lỗi + dòng hợp lệ | Thêm dòng hợp lệ, cảnh báo danh sách dòng bị bỏ qua |

> **Nguyên tắc:** "Thêm mới từ file" **chỉ tạo mới**, không sửa dòng đang có.

### 9.4. Cập nhật từ file

**Quy trình:**

1. Nhấn "Cập nhật từ file" → mở hộp thoại chọn file.
2. Chọn file → hệ thống đọc dữ liệu.
3. Với mỗi dòng, xác định dòng qua trường "Cảng, bến, cầu cụ thể".
4. Nếu tìm thấy → cập nhật thông tin dòng đó.
5. Nếu không tìm thấy → bỏ qua (không tạo mới).

**Các case và exception:**

| Tình huống | Xử lý |
| --- | --- |
| File rỗng | Lỗi "File rỗng, không có dữ liệu để cập nhật" |
| File sai định dạng | Lỗi "Định dạng file không được hỗ trợ" |
| Header không khớp | Lỗi "Cấu trúc file không đúng với file mẫu" |
| "Cảng, bến, cầu cụ thể" tồn tại trong bảng | Cập nhật các trường còn lại của dòng đó |
| "Cảng, bến, cầu cụ thể" **không** tồn tại trong bảng | Bỏ qua dòng, cảnh báo "Không tìm thấy dòng có Cảng, bến, cầu cụ thể [X]" — **không tạo mới** |
| "Phân loại (CB/BC/CC)" sai giá trị | Bỏ qua, cảnh báo "Dòng [N]: Phân loại không hợp lệ" |
| Giá trị số không hợp lệ hoặc KB thấp > KB cao | Bỏ qua, cảnh báo "Dòng [N]: Giá trị số không hợp lệ" |
| Tất cả dòng hợp lệ | Cập nhật toàn bộ, thông báo "Đã cập nhật N dòng từ file" |

> **Nguyên tắc:** "Cập nhật từ file" **chỉ cập nhật dòng đã tồn tại**, không tạo dòng mới.

### 9.5. Xóa

**Quy trình:**

1. Nhấn nút "Xóa" trên dòng.
2. Hiển thị popup: "Bạn có chắc chắn muốn xóa dòng **[Cảng, bến, cầu cụ thể]**? Thao tác này không thể hoàn tác."
3. Nhấn "Xóa" → xóa dòng khỏi bảng D (chưa lưu DB). Thông báo "Đã xóa danh mục quy hoạch chi tiết".
4. Nhấn "Hủy" → đóng popup, giữ nguyên dòng.

---

## 10. Yêu cầu phi chức năng

### 10.1. Hiệu năng

- Mở form thêm mới ≤ 300ms
- Import file ≤ 2 giây cho file ≤ 1000 dòng
- Tải file mẫu ≤ 1 giây

### 10.2. Bảo mật

- Quyền `portplanning:create` được kiểm tra trước khi thao tác trên bảng D
- File import không được chứa macro/script

### 10.3. Độ tin cậy

- Import file validate từng dòng, không làm hỏng toàn bộ nếu 1 dòng lỗi
- Dữ liệu in-memory không bị mất nếu chưa nhấn "Lưu" form chính

### 10.4. Trải nghiệm người dùng

- Form thêm mới có loading skeleton
- Thông báo kết quả import rõ ràng (số dòng thành công + danh sách dòng bị bỏ qua)
- Popup xóa có màu cảnh báo đỏ

---

## 11. Yêu cầu giao diện người dùng

### 11.1. Bố cục

Bảng D nằm trong form Tạo mới quy hoạch, là một section có tiêu đề "Danh mục quy hoạch chi tiết".

### 11.2. Thành phần

1. **Thanh công cụ:** nút "Thêm mới", "Tải file mẫu", "Thêm mới từ file", "Cập nhật từ file".
2. **DataTable:** cột: STT, Phân loại, Cảng/bến/cầu cụ thể, Công năng khai thác, Phân loại, Số lượng cầu cảng, Chiều dài, Cỡ tàu, Số cầu cảng KB thấp/cao, Chiều dài KB thấp/cao, Dự kiến cỡ tàu, Dự kiến công suất KB thấp/cao, Diện tích vùng đất, Diện tích vùng nước, Thao tác (Xóa).
3. **Phân trang:** 10/20/50 dòng/trang.

### 11.3. Trạng thái giao diện

- **Đang import:** spinner "Đang đọc file..."
- **Bảng trống:** empty state "Chưa có danh mục quy hoạch chi tiết nào"
- **Import lỗi:** cảnh báo đỏ + danh sách dòng bị bỏ qua
