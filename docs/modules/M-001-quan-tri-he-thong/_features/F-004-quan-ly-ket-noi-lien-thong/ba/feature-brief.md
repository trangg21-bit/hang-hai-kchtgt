---
id: F-004
name: Quan ly ket noi lien thong chia se du lieu
slug: quan-ly-ket-noi-lien-thong-chia-se-du-lieu
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-07-27T00:00:00Z
last-updated: 2026-07-27T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý kết nối liên thông chia sẻ dữ liệu

**Tài liệu:** BA Feature Brief
**Feature:** F-004
**Module:** M-001 — Quản trị hệ thống
**Người viết:** Business Analyst
**Ngày tạo:** 27/07/2026

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Quản lý kết nối liên thông chia sẻ dữ liệu là tính năng cho phép người quản trị hệ thống xem **nhật ký (log)** của toàn bộ hoạt động chia sẻ và tích hợp dữ liệu giữa hệ thống KCHTGT với các hệ thống bên ngoài.

Có 2 loại trao đổi dữ liệu được ghi nhận:

- **Tích hợp dữ liệu:** hệ thống KCHTGT chủ động kết nối đến hệ thống khác để lấy hoặc gửi dữ liệu. Ví dụ: hệ thống tự động gửi dữ liệu cảng biển sang hệ thống hải quan mỗi ngày.
- **Chia sẻ dữ liệu:** hệ thống bên ngoài gọi API của KCHTGT để lấy dữ liệu. Ví dụ: một đơn vị đối tác truy cập API để lấy thông tin luồng hàng hải.

Người quản trị có thể tra cứu lịch sử của cả 2 loại trên — biết được ai đã gửi/nhận dữ liệu gì, lúc nào, kết quả ra sao.

### 1.2. Tại sao cần tính năng này?

1. **Truy vết giao dịch dữ liệu:** Khi có sự cố (dữ liệu không đồng bộ, sai lệch số liệu), admin cần biết lần trao đổi gần nhất diễn ra lúc nào, ai gửi, ai nhận, kết quả thế nào.

2. **Kiểm toán:** Các cơ quan quản lý có thể yêu cầu cung cấp nhật ký chia sẻ dữ liệu để đối chiếu. Màn hình này cho phép tra cứu nhanh thay vì phải mở database.

3. **Giám sát hoạt động:** Admin có thể xem tổng quan hoạt động liên thông — bao nhiêu giao dịch thành công, bao nhiêu thất bại, hệ thống nào đang gửi/nhận nhiều nhất.

### 1.3. Luồng hoạt động chính

Người quản trị đăng nhập vào hệ thống, từ thanh menu bên trái chọn mục "Quản lý kết nối liên thông chia sẻ dữ liệu". Hệ thống hiển thị màn hình với 2 tab: "Tích hợp dữ liệu" và "Chia sẻ dữ liệu".

**Tab Tích hợp dữ liệu:** Admin chọn loại trao đổi "Tích hợp dữ liệu", nhập tiêu chí tìm kiếm (tên kết nối, hệ thống gửi, trạng thái), bấm "Tìm kiếm". Hệ thống hiển thị danh sách tích hợp dạng bảng với các cột: STT, Tên tài khoản, Tên kết nối, Hệ thống gửi, Hệ thống nhận, Trạng thái, Thao tác. Thao tác gồm 2 nút: "Xem lịch sử kết nối" và "Sửa".

Khi chọn "Xem lịch sử kết nối", hệ thống mở bảng con hiển thị chi tiết từng lần trao đổi. Bảng lịch sử có các cột: STT, ID, Thông tin gửi (Loại, Tên, Số tham chiếu, Thời gian, Mục đích, Đơn vị, Người), Thông tin nhận (Thời gian, Mã), Thao tác (Xem nội dung gửi, Xem nội dung nhận). Phía trên bảng con có thanh tìm kiếm với các trường: Loại gửi, Số tham chiếu, Thời gian (từ ngày - đến ngày). Nút "Tìm kiếm nâng cao" mở rộng thêm các trường: Mã nhận, ID, Mục đích gửi.

Khi chọn "Sửa", hệ thống mở popup cho phép chỉnh sửa 3 trường: Tên kết nối, Password, và Trạng thái (Sử dụng / Không sử dụng). Đây là chức năng duy nhất cho phép thay đổi dữ liệu trên màn hình này.

**Tab Chia sẻ dữ liệu:** Admin chọn loại trao đổi "Chia sẻ dữ liệu", bấm "Tìm kiếm" (không cần nhập tiêu chí lọc). Hệ thống hiển thị danh sách chia sẻ dạng bảng với các cột: STT, Tên tài khoản, Tên kết nối, Hệ thống gửi, Hệ thống nhận, ID, Trạng thái, Thao tác (Xem chi tiết).

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. system-admin (Quản trị viên cấp cao)

Có toàn quyền với màn hình:
- Xem toàn bộ nhật ký tích hợp dữ liệu (tìm kiếm, xem lịch sử, xem nội dung gửi/nhận)
- Sửa thông tin kết nối (tên kết nối, password, trạng thái) trong tab Tích hợp
- Xem toàn bộ nhật ký chia sẻ dữ liệu (xem danh sách, xem chi tiết)

### 2.2. Các vai trò khác

Các vai trò khác không có quyền truy cập. Menu yêu cầu quyền `connection:read`.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-004-01:** Là system-admin, tôi muốn xem danh sách nhật ký tích hợp dữ liệu (tìm theo tên kết nối, hệ thống gửi, trạng thái) để tra cứu lịch sử đồng bộ.
- **US-004-02:** Là system-admin, tôi muốn xem lịch sử kết nối của một bản ghi tích hợp (thông tin gửi, thông tin nhận) để biết chi tiết từng lần trao đổi.
- **US-004-03:** Là system-admin, tôi muốn xem chi tiết nội dung gửi và nội dung nhận của một giao dịch tích hợp để kiểm tra dữ liệu thực tế đã trao đổi.
- **US-004-04:** Là system-admin, tôi muốn xem danh sách nhật ký chia sẻ dữ liệu để biết những hệ thống nào đã truy cập dữ liệu.
- **US-004-05:** Là system-admin, tôi muốn sửa thông tin kết nối (tên kết nối, password, trạng thái) khi cần cập nhật cấu hình.

### Mức Should (nên có)

- **US-004-06:** Là system-admin, tôi muốn tìm kiếm trong bảng lịch sử kết nối theo Loại gửi, Số tham chiếu, và khoảng thời gian để nhanh chóng tìm được giao dịch cần kiểm tra.
- **US-004-07:** Là system-admin, tôi muốn tìm kiếm nâng cao trong bảng lịch sử kết nối theo Mã nhận, ID, và Mục đích gửi khi cần tra cứu chuyên sâu.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-004-01 — Tab Tích hợp dữ liệu:** Admin chọn tab "Tích hợp dữ liệu", hệ thống hiển thị form tìm kiếm với các trường: Tên kết nối, Hệ thống gửi, Trạng thái (Sử dụng / Không sử dụng). Sau khi bấm "Tìm kiếm", hiển thị danh sách dạng bảng phân trang với các cột: STT, Tên tài khoản, Tên kết nối, Hệ thống gửi, Hệ thống nhận, Trạng thái (tag màu), Thao tác. Nếu không có kết quả, hiển thị "Không tìm thấy kết quả".

**AC-004-02 — Xem lịch sử kết nối (Tích hợp):** Admin bấm "Xem lịch sử kết nối" trên một dòng, hệ thống mở bảng con với thanh tìm kiếm phía trên gồm: Loại gửi (dropdown), Số tham chiếu (input text), Thời gian từ ngày - đến ngày (date range picker). Bảng con hiển thị các cột: STT, ID, Thông tin gửi (Loại, Tên, Số tham chiếu, Thời gian, Mục đích, Đơn vị, Người), Thông tin nhận (Thời gian, Mã), Thao tác. Thao tác gồm 2 nút: "Xem nội dung gửi" và "Xem nội dung nhận" — mỗi nút mở popup hiển thị nội dung chi tiết.

**AC-004-03 — Tìm kiếm nâng cao trong lịch sử:** Trên bảng lịch sử kết nối, nút "Tìm kiếm nâng cao" mở rộng thêm các trường tìm kiếm: Mã nhận, ID, Mục đích gửi. Admin có thể kết hợp với các trường tìm kiếm cơ bản để lọc chính xác giao dịch cần tìm.

**AC-004-04 — Sửa kết nối (Tích hợp):** Admin bấm "Sửa" trên một dòng trong tab Tích hợp, hệ thống mở popup cho phép chỉnh sửa 3 trường: Tên kết nối, Password, Trạng thái (Sử dụng / Không sử dụng). Đây là chức năng duy nhất cho phép ghi dữ liệu trên màn hình này. Sau khi lưu, toast "Đã cập nhật kết nối".

**AC-004-03 — Xem nội dung gửi/nhận:** Popup hiển thị toàn bộ nội dung dữ liệu đã gửi đi hoặc nhận về (dạng JSON hoặc text), có nút Đóng.

**AC-004-04 — Tab Chia sẻ dữ liệu:** Admin chọn tab "Chia sẻ dữ liệu", bấm "Tìm kiếm" (không cần nhập tiêu chí). Hệ thống hiển thị danh sách dạng bảng phân trang với các cột: STT, Tên tài khoản, Tên kết nối, Hệ thống gửi, Hệ thống nhận, ID, Trạng thái (tag màu), Thao tác. Cột ID hiển thị mã định danh của giao dịch chia sẻ.

**AC-004-05 — Xem chi tiết (Chia sẻ):** Admin bấm "Xem chi tiết" trên một dòng trong tab Chia sẻ, hệ thống hiển thị popup với toàn bộ thông tin chi tiết của giao dịch chia sẻ đó.

**AC-004-06 — Phân quyền:** Menu "Quản lý kết nối liên thông chia sẻ dữ liệu" chỉ hiển thị nếu có quyền `connection:read`.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-004-01 — Hai loại trao đổi:** Hệ thống phân biệt 2 loại: TÍCH HỢP (hệ thống chủ động gửi/nhận) và CHIA SẺ (hệ thống ngoài gọi API lấy dữ liệu). Mỗi loại có giao diện tra cứu và cột hiển thị khác nhau.

**BR-004-02 — ID chỉ có trong Chia sẻ:** Cột ID chỉ hiển thị trong tab Chia sẻ dữ liệu. Đây là mã định danh của giao dịch chia sẻ được hệ thống sinh ra khi có đối tác gọi API. Tab Tích hợp không có cột này.

**BR-004-03 — Trạng thái Sử dụng / Không sử dụng:** Trạng thái phản ánh kết nối có đang hoạt động hay không, không phải kết quả của từng giao dịch. Sử dụng = kết nối đang hoạt động, Không sử dụng = kết nối đã ngừng.

**BR-004-04 — Dữ liệu chủ yếu là chỉ đọc:** Nhật ký tích hợp và chia sẻ được ghi tự động bởi module M-009 (Liên thông & Tích hợp). Người dùng không thể thêm, xóa các bản ghi log. Ngoại lệ duy nhất: chức năng "Sửa" cho phép cập nhật Tên kết nối, Password và Trạng thái của kết nối.

---

## 6. Mô hình dữ liệu

Tính năng này là màn hình VIEWER — không tạo bảng mới. Nó đọc dữ liệu từ các bảng đã có trong module M-009:

- **Bảng integration_logs** (hoặc tương đương): lưu nhật ký mỗi lần hệ thống tích hợp dữ liệu với bên ngoài. Các trường: id, tenTaiKhoan, tenKetNoi, heThongGui, heThongNhan, trangThai, thoiGian. Có bảng con lưu chi tiết từng giao dịch: loai, ten, soThamChieu, thoiGianGui, mucDich, donVi, nguoiGui, thoiGianNhan, maNhan, noiDungGui, noiDungNhan.
- **Bảng sharing_logs** (hoặc tương đương): lưu nhật ký mỗi lần đối tác gọi API chia sẻ dữ liệu. Các trường: id, maGiaoDich, tenTaiKhoan, tenKetNoi, heThongGui, heThongNhan, trangThai, thoiGian, noiDungChiTiet.

---

## 7. API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/lien-thong/tich-hop | Danh sách nhật ký tích hợp (filter: tenKetNoi, heThongGui, trangThai) | `connection:read` |
| GET | /api/lien-thong/tich-hop/{id}/lich-su | Lịch sử kết nối của một bản ghi tích hợp (filter: loaiGui, soThamChieu, tuNgay-denNgay, maNhan, id, mucDich) | `connection:read` |
| PUT | /api/lien-thong/tich-hop/{id} | Sửa thông tin kết nối (tenKetNoi, password, trangThai) | `connection:read` |
| GET | /api/lien-thong/tich-hop/lich-su/{id}/noi-dung-gui | Nội dung gửi chi tiết | `connection:read` |
| GET | /api/lien-thong/tich-hop/lich-su/{id}/noi-dung-nhan | Nội dung nhận chi tiết | `connection:read` |
| GET | /api/lien-thong/chia-se | Danh sách nhật ký chia sẻ | `connection:read` |
| GET | /api/lien-thong/chia-se/{id} | Chi tiết một giao dịch chia sẻ | `connection:read` |

---

## 8. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` và `frontend/src/tokens.ts`. Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 8.1. Bố cục chung

Dùng `AppLayout.tsx`: sidebar `272px` nền `#12468C`, header `64px`, nền `#eaf0f6`.

### 8.2. Màn hình chính — 2 tab

Màn hình có 2 tab nằm ngang: "Tích hợp dữ liệu" và "Chia sẻ dữ liệu".

### 8.3. Tab Tích hợp dữ liệu

**FilterBar:** Input tên kết nối + Input hệ thống gửi + Select trạng thái (Sử dụng / Không sử dụng) + nút "Tìm kiếm" (`actionPrimary`, 1 lần).

**DataTable:**

| Cột | Nội dung |
|---|---|
| STT | Số thứ tự |
| Tên tài khoản | Người thực hiện |
| Tên kết nối | Tên cấu hình kết nối |
| Hệ thống gửi | Hệ thống nguồn |
| Hệ thống nhận | Hệ thống đích |
| Trạng thái | Tag: Sử dụng=xanh lá, Không sử dụng=xám |
| Thao tác | "Xem lịch sử kết nối" + "Sửa" |

**Bảng con — Lịch sử kết nối:**

**Thanh tìm kiếm:** Loại gửi (dropdown) + Số tham chiếu (input) + Thời gian từ - đến (date range) + nút "Tìm kiếm nâng cao" mở rộng thêm: Mã nhận, ID, Mục đích gửi.

**Bảng:**

| Cột | Nội dung |
|---|---|
| STT | Số thứ tự |
| ID | Mã giao dịch |
| Thông tin gửi | Loại, Tên, Số tham chiếu, Thời gian, Mục đích, Đơn vị, Người |
| Thông tin nhận | Thời gian, Mã |
| Thao tác | "Xem nội dung gửi" + "Xem nội dung nhận" |

### 8.4. Tab Chia sẻ dữ liệu

Không có FilterBar — chỉ có nút "Tìm kiếm" để load danh sách.

**DataTable:** STT, Tên tài khoản, Tên kết nối, Hệ thống gửi, Hệ thống nhận, ID, Trạng thái (tag), Thao tác ("Xem chi tiết").

### 8.5. Popup nội dung

Popup hiển thị nội dung gửi hoặc nội dung nhận dạng JSON/text, có nút Đóng.

### 8.6. Trạng thái giao diện

- **Đang tải:** skeleton
- **Không có dữ liệu:** "Không tìm thấy kết quả"
- **Lỗi:** Alert + Thử lại

### 8.7. Token sử dụng

- Màu chữ: `textPrimary`, `textSecondary`
- Nút chính: `actionPrimary`, 1 lần/màn (nút Tìm kiếm)
- Form spacing: `spaceFormField = 12px`
- Input/Select: `radiusPill = 999px`, `height = 40`
- Tag trạng thái: Sử dụng=xanh lá, Không sử dụng=xám

---

## 9. Khoảng trống so với code hiện tại

Đây là tính năng **hoàn toàn mới** — chưa có code BE lẫn FE. Cần xây dựng từ đầu:

| # | Công việc | Mức độ |
|---|---|---|
| 1 | Tạo API `/api/lien-thong/*` (6 endpoints) | Cao |
| 2 | Tạo bảng integration_logs và sharing_logs nếu chưa có | Cao |
| 3 | Xây dựng FE: 2 tab + bảng chính + bảng lịch sử + popup nội dung | Cao |
| 4 | Dùng shared list-view components (ScreenHeader, FilterBar, DataTable, Pagination) | Cao |
| 5 | Dùng theme token, không hardcode | Trung bình |

---

## 10. Môi trường kỹ thuật

- **Backend:** Spring Boot + Spring Security + JWT
- **Frontend:** ReactJS với Ant Design v5
- **Database:** MSSQL 2022
- **Phân quyền:** `connection:read`
