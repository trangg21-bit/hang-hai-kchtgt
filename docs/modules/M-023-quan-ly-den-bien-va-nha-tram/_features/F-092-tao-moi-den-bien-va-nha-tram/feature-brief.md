---
id: F-092
name: Tạo mới Đèn biển và nhà trạm gắn với Đèn biển
slug: tao-moi-den-bien-va-nha-tram
module-id: M-023
status: proposed
classification: local
priority: high
created: 2026-08-05T00:00:00Z
last-updated: 2026-08-05T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Tạo mới Đèn biển và nhà trạm gắn với Đèn biển

**Tài liệu:** BA Feature Brief
**Feature:** F-092
**Module:** M-023 — Quản lý Đèn biển và nhà trạm gắn với Đèn biển
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-05
**Tham khảo:** `references/qlkc-052-quan-ly-den-bien-va-nha-tram.md`
**Nhóm KCHT:** `KCHT_ATHH` (An toàn hàng hải)

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép Chuyên viên / Cán bộ đơn vị quản lý tạo mới một bản ghi **Đèn biển và nhà trạm gắn với Đèn biển** (mã nhóm: DBNT) vào hệ thống. Bản ghi bao gồm 3 phần: thông tin cơ bản (đơn vị quản lý, cảng biển, tên, địa điểm...), thông tin kỹ thuật đèn biển & nhà trạm (chiều cao tháp, tâm sáng, chủng loại đèn, kết cấu, diện tích...), và tọa độ GIS + file đính kèm.

### 1.2. Tại sao cần tính năng này?

Đèn biển và nhà trạm gắn với đèn biển là hạ tầng an toàn hàng hải thiết yếu. Mỗi đèn biển cần được đăng ký vào hệ thống trước khi có thể: duyệt đưa vào sử dụng, gắn tài sản, theo dõi vận hành/bảo trì/sự cố, tra cứu công khai, và hiển thị trên bản đồ KCHT. Tạo mới là bước đầu tiên trong vòng đời DBNT.

### 1.3. Luồng hoạt động chính

Người dùng truy cập menu QLKC_052 → bấm "Thêm mới" → form `FormCrud` hiển thị 3 phần (InfoForm, LocationInformationForm, UploadFileTable) → điền thông tin → chọn 1 trong 3 nút lưu:

| Nút | `enumActionKcht` | Trạng thái sau lưu | Ý nghĩa |
|---|---|---|---|
| **Lưu tạm** | `LUU_TAM` | S_1 (Lưu tạm) | Lưu nháp, có thể sửa tiếp |
| **Lưu và gửi phê duyệt** | `LUU_VA_GUI_PHE_DUYET` | S_2 (Chờ Chi cục duyệt) | Gửi thẳng sang luồng phê duyệt |
| **Lưu và phê duyệt** | `LUU_VA_PHE_DUYET` | S_6 (Đã duyệt) | Chỉ Cấp Cục — duyệt luôn 1 bước |

Sau khi lưu thành công, hệ thống hiển thị thông báo và người dùng được quay lại danh sách.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (tại tính năng phân quyền).

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).
- **Nút "Lưu và phê duyệt":** Chỉ hiển thị với tài khoản Cấp Cục — cho phép duyệt thẳng lên S_6 (Đã duyệt), bỏ qua luồng PDKC_053.

> **Ghi chú:** Các trường `người tạo mới`, `thời gian tạo mới`, `người chỉnh sửa`, `thời gian cập nhật` cần được bổ sung vào bảng dữ liệu tương ứng và chỉ hiển thị đối với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-092-01:** Là Chuyên viên/Cán bộ đơn vị, tôi muốn tạo mới một bản ghi Đèn biển và nhà trạm gắn với Đèn biển với đầy đủ các trường thông tin cơ bản và kỹ thuật, để đăng ký đèn biển vào hệ thống quản lý.
- **US-092-02:** Là Chuyên viên, tôi muốn chọn "Lưu tạm" để lưu bản ghi ở trạng thái nháp, có thể quay lại sửa sau trước khi gửi duyệt.
- **US-092-03:** Là Chuyên viên, tôi muốn chọn "Lưu và gửi phê duyệt" để bản ghi được chuyển thẳng sang trạng thái chờ Chi cục duyệt.
- **US-092-04:** Là người dùng, tôi muốn hệ thống tự động sinh mã DBNT theo format `DBNT-{seq 6 chữ số}` để đảm bảo mã là duy nhất và không cần nhập tay.

### Mức Should (nên có)

- **US-092-05:** Là Cấp Cục, tôi muốn có nút "Lưu và phê duyệt" để duyệt thẳng bản ghi lên trạng thái Đã duyệt (S_6) mà không cần qua PDKC_053.

### Mức Could (có thể có sau)

- **US-092-06:** Là người dùng, tôi muốn form tự động điền sẵn đơn vị quản lý (`fkDonViQl`) theo đơn vị của tài khoản đang đăng nhập.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-092-01 — Hiển thị form tạo mới:** Người dùng bấm "Thêm mới" từ màn danh sách, hệ thống hiển thị form với 3 tab/thành phần: InfoForm (thông tin chung + kỹ thuật), LocationInformationForm (tọa độ GIS), UploadFileTable (file đính kèm). Form ở chế độ `FORM_MODE.Create`. Nếu không load được form (lỗi mạng, lỗi server), hiển thị thông báo lỗi và nút "Thử lại".

**AC-092-02 — Các trường bắt buộc:** Hệ thống yêu cầu nhập đầy đủ các trường: `fkDonViQl` (đơn vị quản lý), `fkDonViVh` (đơn vị vận hành), `ten` (tên đèn biển), `diaDiemDatTramDen` (địa điểm đặt trạm đèn), `capTramDen` (cấp trạm đèn), `tinhTrang` (tình trạng). Nếu thiếu trường nào, hiển thị lỗi validation màu đỏ tại field đó, không cho submit.

**AC-092-03 — Mã DBNT tự động sinh:** Trường `ma` hiển thị ở trạng thái disabled, giá trị được sinh tự động theo format `DBNT-{seq 6 chữ số}` (ví dụ: DBNT-000001). Mã chỉ được gán khi lưu thành công, không hiển thị trước. Nếu sinh mã thất bại (hết sequence), hiển thị lỗi hệ thống.

**AC-092-04 — Lưu tạm (S_1):** Người dùng chọn "Lưu tạm" → `POST ...?enumActionKcht=LUU_TAM`. Hệ thống lưu bản ghi với `status = S_1` (Lưu tạm). Hiển thị thông báo thành công, quay về danh sách. Nếu lưu thất bại, hiển thị thông báo lỗi, giữ nguyên form.

**AC-092-05 — Lưu và gửi phê duyệt (S_2):** Người dùng chọn "Lưu và gửi phê duyệt" → `POST ...?enumActionKcht=LUU_VA_GUI_PHE_DUYET`. Hệ thống lưu bản ghi với `status = S_2` (Chờ Chi cục duyệt). Bản ghi xuất hiện trong danh sách chờ duyệt của PDKC_053.

**AC-092-06 — Lưu và phê duyệt (S_6, chỉ Cấp Cục):** Nút "Lưu và phê duyệt" chỉ hiển thị với tài khoản Cấp Cục. Khi bấm → `POST ...?enumActionKcht=LUU_VA_PHE_DUYET`. Bản ghi được lưu với `status = S_6` (Đã duyệt). Nếu không phải Cấp Cục gọi API, trả về 403 Forbidden.

**AC-092-07 — Validate dữ liệu số:** Các trường `dienTich`, `chieuCaoThapDen`, `chieuCaoTamSang`, `dienTichSuDungTram` phải là số Decimal(20,4), min = 0. Nếu nhập giá trị âm hoặc không phải số → báo lỗi. `soLuongNhanSuBoTri` chỉ nhập số nguyên, tối đa 5 chữ số.

**AC-092-08 — Tọa độ GIS:** Form LocationInformationForm cho phép nhập ít nhất 1 cặp tọa độ (kinh độ, vĩ độ) thuộc hệ quy chiếu WGS-84 (mặc định). Tọa độ được lưu vào `zlstDataGeo`.

**AC-092-09 — File đính kèm:** UploadFileTable cho phép tải lên file PDF, ảnh. Không bắt buộc. File được lưu vào `zlstFileDk`.

**AC-092-10 — Đơn vị quản lý mặc định:** Trường `fkDonViQl` được điền sẵn theo đơn vị của người dùng đang đăng nhập. Khi CREATE, field này có thể thay đổi; khi EDIT sẽ bị disabled.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

**BR-092-01 — Trạng thái sau tạo mới:** Bản ghi sau khi tạo có thể ở 1 trong 3 trạng thái tùy action: S_1 (Lưu tạm), S_2 (Chờ Chi cục duyệt), hoặc S_6 (Đã duyệt — chỉ Cấp Cục).

**BR-092-02 — Mã DBNT là duy nhất toàn hệ thống:** Mã được sinh tự động format `DBNT-{seq 6 chữ số}`, không trùng với bất kỳ bản ghi DBNT nào khác (kể cả đã xóa mềm).

**BR-092-03 — Thuộc nhóm KCHT_ATHH:** DBNT dùng chung infrastructure `KchtAthhRestControllerImpl` và `KchtAthhDto`, **không** dùng chung với nhóm `KCHT_CB`.

**BR-092-04 — Chưa duyệt thì không được tham chiếu:** Bản ghi ở S_1 hoặc đang duyệt (S_2-S_5) không xuất hiện trong dropdown của module khác. Chỉ S_6 mới được tham chiếu bởi TCKC_018, TTVH_090/091/092, QLTS_108.

**BR-092-05 — Phải qua phê duyệt PDKC_053:** Luồng 2 cấp: Chi cục (S_2→S_3/S_4) → Cục (S_3→S_6/S_5). Ngoại lệ: Cấp Cục duyệt thẳng S_6.

**BR-092-06 — Liên kết Cảng biển:** `fkCangBien` → QLKC_037, chỉ CB đã duyệt, filter theo `fkDonViQl`.

**BR-092-07 — Module hậu duyệt:** Sau S_6, được dùng bởi: TCKC_018 (tra cứu), TTVH_090/091/092 (vận hành/bảo trì/sự cố), QLTS_108→PDTS_109 (tài sản), BCKCHT_170 (báo cáo), bản đồ layer 9.

**BR-092-08 — Tích hợp LGSP:** Nhận từ THKCHT_249, gửi ra CSDL_212.

**BR-092-09 — Sửa bản ghi đã duyệt:** Sửa S_6 → quay S_1/S_2 → cần duyệt lại.

---

## 6. Mô hình dữ liệu

Tính năng này tạo ra/sửa đổi các bảng dữ liệu sau trong cơ sở dữ liệu:

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **trường mới cần thêm** vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = **trường không cần thiết**, cần loại bỏ khỏi bảng.
> - Các trường không được đánh dấu là các trường hiện có, được giữ nguyên.

### 6.1. Bảng KCHT_ATHH — Thông tin Đèn biển và nhà trạm

Đây là bảng chính, lưu thông tin đèn biển thuộc nhóm KCHT_ATHH, kế thừa từ `KchtAthhDto`.

Các trường thông tin:

**A. Thông tin cơ bản (root fields):**

- **id:** mã số tự tăng, duy nhất cho mỗi dòng
- **ma:** mã DBNT (tự động sinh, format: `DBNT-{seq 6 chữ số}`, disabled trên form)
- **ten:** tên đèn biển (max 255, required)
- **fkDonViQl:** mã đơn vị quản lý (required khi CREATE, disabled khi EDIT, mặc định theo user)
- **fkCangBien:** mã cảng biển (FK → QLKC_037, optional, chỉ CB đã duyệt)
- **fkDonViVh:** mã đơn vị vận hành (required, DM `DON_VI_KHAI_THAC`)
- **diaDiem:** mã Tỉnh/Thành phố (DM `DON_VI_HANH_CHINH`)
- **diaDiemChiTiet:** địa điểm chi tiết (max 500)
- **tinhTrang:** tình trạng hoạt động (required, group `TINH_TRANG`, giá trị: Chưa khai thác/vận hành; Đang khai thác/vận hành; Dừng khai thác/vận hành)
- **status:** trạng thái phê duyệt (S_0: Đã xóa, S_1: Lưu tạm, S_2: Chờ CC, S_3: Chờ Cục, S_4: CC từ chối, S_5: Cục từ chối, S_6: Đã duyệt)
- **chungLoaiDenChinh:** chủng loại đèn chính (max 100, root KCHT_ATHH)
- **chungLoaiDenDuPhong:** chủng loại đèn dự phòng (max 100, root KCHT_ATHH)
- **ngayBd:** thời điểm đưa vào sử dụng (DD/MM/YYYY)
- **ngaySc:** thời điểm sửa chữa gần nhất (DD/MM/YYYY)
- **capTramDen:** cấp trạm đèn (required, group `CAP_TRAM_DEN`)
- **createdAt:** thời điểm tạo bản ghi
- **createdBy:** người tạo bản ghi
- **updatedAt:** thời điểm cập nhật
- **updatedBy:** người cập nhật

**B. Thông tin đặc thù (zobjDataSub — JSON column):**

- **diaBan:** địa bàn (max 500)
- **diaDiemDatTramDen:** địa điểm đặt trạm đèn (max 500, required)
- **dacDiemNhanDang:** đặc điểm nhận dạng (max 2000)
- **hinhDang:** hình dạng (max 255)
- **ketCau:** kết cấu (max 2000)
- **dienTich:** diện tích (m², Decimal(20,4), min=0)
- **chieuCaoThapDen:** chiều cao tháp đèn (m, Decimal(20,4), min=0)
- **chieuCaoTamSang:** chiều cao tâm sáng hải đồ (m, Decimal(20,4), min=0)
- **tamHieuLucDiaLy:** tầm hiệu lực địa lý (max 20)
- **tamHieuLucAnhSang:** tầm hiệu lực ánh sáng (max 20)
- **mauSacBenNgoaiCuaThapDen:** màu sắc bên ngoài tháp đèn (max 500)
- **nguonCungCapNangLuongChoDen:** nguồn năng lượng cho đèn (max 500)
- **soLuongNhanSuBoTri:** số lượng nhân sự (số nguyên, max 5 chữ số)
- **dienTichSuDungTram:** diện tích sử dụng trạm đèn (m², Decimal(20,4), min=0)
- **ghiChu:** ghi chú (max 2000)

**C. Tọa độ GIS (zlstDataGeo):** loaiDoiTuong (1:Điểm, 2:Đường, 3:Vùng), bieuTuong, heQuyChieu (WGS_84), kinhDo, viDo

**D. File đính kèm (zlstFileDk):** PDF, ảnh

### 6.2. Các bảng khác

Không có thêm bảng mới. Dùng chung infrastructure `KchtAthhDto` và `KchtAthhRestControllerImpl` của nhóm ATHH.

---

## 7. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng:

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| POST | `/api/v1/tskt/qlkc_052?enumActionKcht=LUU_TAM` | Tạo mới — Lưu tạm (S_1) | Chuyên viên, Cán bộ |
| POST | `/api/v1/tskt/qlkc_052?enumActionKcht=LUU_VA_GUI_PHE_DUYET` | Tạo mới — Lưu & Gửi duyệt (S_2) | Chuyên viên, Cán bộ |
| POST | `/api/v1/tskt/qlkc_052?enumActionKcht=LUU_VA_PHE_DUYET` | Tạo mới — Lưu & Duyệt thẳng (S_6) | Cấp Cục |

Request body gồm: root fields, `zobjDataSub` (JSON), `zlstDataGeo` (mảng tọa độ), `zlstFileDk` (mảng file).

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Form tạo mới

Form sử dụng component `FormCrud` (dùng chung toàn bộ nhóm ATHH) với `mode={FORM_MODE.Create}`, gồm 3 phần:

1. **InfoForm** — 28 trường, chia 2 nhóm: Thông tin cơ bản (8 field) + Thông tin kỹ thuật đèn biển & nhà trạm (20 field zobjDataSub)
2. **LocationInformationForm** — tọa độ GIS, loại đối tượng, biểu tượng, hệ quy chiếu
3. **UploadFileTable** — file đính kèm (không bắt buộc)

Footer: 3 nút "Lưu tạm" / "Lưu và gửi phê duyệt" / "Lưu và phê duyệt" (chỉ Cục).

### 8.2. Cơ chế sinh mã DBNT

Mã format `DBNT-{seq 6 chữ số}`, lấy từ database sequence, đảm bảo không trùng kể cả bản ghi đã xóa mềm. Chỉ gán khi INSERT, không hiển thị trước trên form.

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- Form load trong < 2 giây (bao gồm load danh mục Select: cảng biển, đơn vị vận hành, địa điểm, AppParams)
- API POST phản hồi trong < 1 giây

### 9.2. Khả năng mở rộng

- Dùng chung infrastructure `KchtAthhRestControllerImpl` + `KchtAthhDto` với toàn bộ ATHH
- `zobjDataSub` dạng JSON cho phép thêm field sau không cần ALTER TABLE

### 9.3. Bảo mật

- Phân quyền RBAC trên tất cả API
- Backend phải chặn `LUU_VA_PHE_DUYET` nếu user không phải Cấp Cục
- `createdBy`, `updatedBy` chỉ hiển thị với Admin Cục

### 9.4. Độ tin cậy

- Transaction rollback nếu lỗi: root + zobjDataSub + zlstDataGeo cùng thành công hoặc cùng rollback
- Sequence sinh mã atomic để tránh trùng khi concurrent

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: dưới 768px, menu thu gọn
- Loading skeleton khi đang tải
- Empty state cho dropdown
- Submit thất bại → toast lỗi, giữ form, không mất dữ liệu
- Tuân thủ WCAG 2.1 AA

### 9.6. Tuân thủ pháp lý

- Dữ liệu Đèn biển thuộc hạ tầng an toàn hàng hải quốc gia, tuân thủ quy định Cục Hàng hải Việt Nam

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình Tạo mới Đèn biển và nhà trạm gắn với Đèn biển dùng chung bố cục toàn hệ thống, bao gồm:

- **Thanh menu trái (sidebar):** rộng 272px, nền màu xanh dương đậm `#12468C`. Mục đang chọn được tô màu xanh sáng `#1B84FF`. Khi thu gọn (trên điện thoại), rộng còn 80px và chuyển thành nút hamburger.
- **Thanh tiêu đề trên cùng (header):** cao 64px, nền trắng, chứa tên người dùng và avatar.
- **Vùng nội dung chính:** nền xám nhạt pha xanh `#eaf0f6`, giúp các card trắng bên trong nổi bật hơn.

### 10.2. Hệ thống màu sắc

Mỗi màu sắc trong giao diện được gán một "vai trò" rõ ràng. Developer không được dùng màu theo cảm tính mà phải import đúng token:

| Khi cần... | Dùng token | Màu thực tế |
|---|---|---|
| Tiêu đề trang, số liệu quan trọng | `textPrimary` | `#0c2438` |
| Nhãn field, mô tả | `textSecondary` | `#566a7c` |
| Thời gian, trạng thái phụ, caption | `textTertiary` | `#93a3b3` |
| Nền card, modal, bảng | `surfaceCard` | `#FFFFFF` |
| Nền vùng nội dung chính | `surfacePage` | `#eaf0f6` |
| Viền card, đường kẻ | `borderDefault` | `rgba(11,46,79,0.09)` |
| Nút chính, link | `actionPrimary` | `#0E6FD6` |

### 10.3. Thang số — chỉ dùng giá trị cho phép

**Khoảng cách (spacing):** 4px, 8px, 12px, 16px, 24px, 32px. Trong đó 12px là khoảng cách mặc định giữa các trường trong form (`spaceFormField`), 16px là padding mặc định của card (`spaceMd`).

**Bo góc (radius):** 4px (cho ô textarea), 8px, 12px (cho card), 999px (dạng pill — dùng cho input, select, button).

**Cỡ chữ (font size):** 10px (metadata, caption), 13px (nhãn, nội dung), 15px (tiêu đề card, tiêu đề section), 18px (tiêu đề trang).

**Độ đậm chữ (font weight):** 400 (nội dung), 500 (nhãn, nút), 600 (số liệu quan trọng, tiêu đề).

**Font chữ:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` cho toàn bộ văn bản.

> **Cấm tuyệt đối:** spacing 6, 10, 14, 18; radius 6, 7, 10; font-size 12, 14, 16, 24.

### 10.4. Style có sẵn — dùng lại, đừng tự chế

Hệ thống đã định nghĩa sẵn các kiểu dáng phổ biến. Khi cần hiển thị:

- **Thời gian, caption:** dùng `metaStyle` (chữ nhỏ 10px, màu xám nhạt, weight 400)
- **Card nội dung:** dùng `cardStyle` (nền trắng, viền 0.5px, bo góc 12px, padding 16px)
- **Tag trạng thái:** dùng `badgeBaseStyle` (chữ nhỏ, weight 500, padding 2px-8px, pill)
- **Link, nút text:** dùng `actionStyle` (pill, màu actionPrimary, weight 500)
- **Đường kẻ ngăn cách:** dùng `dividerStyle`

### 10.5. Giới hạn màu nhấn — tối đa 3 lần mỗi màn

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình Tạo mới Đèn biển và nhà trạm gắn với Đèn biển:

1. Nút "Lưu tạm"
2. Nút "Lưu và gửi phê duyệt"
3. Nút "Lưu và phê duyệt" (nếu là Cấp Cục)

Các màu trạng thái (xanh lá cho thành công, vàng cho cảnh báo, đỏ cho lỗi) và màu chữ không tính vào giới hạn này.

### 10.6. Màn hình Tạo mới Đèn biển và nhà trạm gắn với Đèn biển

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** hiển thị đường dẫn breadcrumb "Quản lý Đèn biển và nhà trạm gắn với Đèn biển > Tạo mới".

2. **FormCrud (mode=Create):** Form chính gồm 3 tab/panel — InfoForm, LocationInformationForm, UploadFileTable.

3. **InfoForm — Thông tin cơ bản:**

| Cột | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Ghi chú |
|---|---|---|---|---|---|---|
| fkDonViQl | Đơn vị quản lý | SelectOrgCode | Có | Có | Đơn vị user | EDIT: disabled |
| fkCangBien | Thuộc cảng biển | SelectKcht (CB) | Có | Không | — | CB đã duyệt |
| fkDonViVh | Đơn vị vận hành | SelectCateOther | Có | Có | — | DM `DON_VI_KHAI_THAC` |
| ma | Mã đèn biển | Input (disabled) | Không | Có | Tự động sinh | `DBNT-{seq}` |
| ten | Tên đèn biển | InputTextArea | Có | Có | — | Max 255 |
| diaDiem | Địa điểm (Tỉnh/TP) | SelectCateOther | Có | Không | — | DM `DON_VI_HANH_CHINH` |
| diaDiemChiTiet | Địa điểm chi tiết | InputTextArea | Có | Không | — | Max 500 |
| tinhTrang | Tình trạng | SelectAppParams | Có | Có | Chưa khai thác/vận hành | Giá trị: Chưa khai thác/vận hành; Đang khai thác/vận hành; Dừng khai thác/vận hành |

4. **InfoForm — Thông tin kỹ thuật đèn biển & nhà trạm (zobjDataSub):**

| Cột | Nội dung | Loại điều khiển | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| diaBan | Địa bàn | InputTextArea | Không | Max 500 |
| diaDiemDatTramDen | Địa điểm đặt trạm đèn | InputTextArea | Có | Max 500 |
| dacDiemNhanDang | Đặc điểm nhận dạng | InputTextArea | Không | Max 2000 |
| hinhDang | Hình dạng | InputTextArea | Không | Max 255 |
| ketCau | Kết cấu | InputTextArea | Không | Max 2000 |
| dienTich | Diện tích (m²) | InputDecimal | Không | Dec(20,4), min=0 |
| chieuCaoThapDen | Chiều cao tháp đèn (m) | InputDecimal | Không | Dec(20,4), min=0 |
| chieuCaoTamSang | Chiều cao tâm sáng (m) | InputDecimal | Không | Dec(20,4), min=0 |
| tamHieuLucDiaLy | Tầm hiệu lực địa lý | Input | Không | Max 20 |
| tamHieuLucAnhSang | Tầm hiệu lực ánh sáng | Input | Không | Max 20 |
| chungLoaiDenChinh | Chủng loại đèn chính | Input | Không | Max 100 (root) |
| chungLoaiDenDuPhong | Chủng loại đèn dự phòng | Input | Không | Max 100 (root) |
| mauSacBenNgoaiCuaThapDen | Màu sắc tháp đèn | InputTextArea | Không | Max 500 |
| nguonCungCapNangLuongChoDen | Nguồn năng lượng | InputTextArea | Không | Max 500 |
| ngayBd | Ngày đưa vào SD | DatePicker | Không | root |
| ngaySc | Ngày sửa chữa gần nhất | DatePicker | Không | root |
| capTramDen | Cấp trạm đèn | SelectAppParams | Có | Group `CAP_TRAM_DEN` |
| soLuongNhanSuBoTri | Số lượng nhân sự | InputTextArea | Không | Chỉ số, max 5 |
| dienTichSuDungTram | Diện tích sử dụng trạm đèn (m²) | InputDecimal | Không | Dec(20,4), min=0 |
| ghiChu | Ghi chú | InputTextArea | Không | Max 2000 |

5. **LocationInformationForm — Thông tin vị trí (tọa độ GIS):**

| Cột | Nội dung | Loại điều khiển | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| loaiDoiTuong | Loại đối tượng | SelectAppParams | Không | 1:Điểm, 2:Đường, 3:Vùng |
| bieuTuong | Biểu tượng | SelectIcon | Không | Icon hiển thị trên bản đồ |
| heQuyChieu | Hệ quy chiếu | SelectAppParams | Không | Mặc định WGS_84 |
| quyTacHienThi | Quy tắc hiển thị | SelectAppParams | Không | |
| toaDo | Tọa độ | LongLatTable | Có | ≥ 1 cặp kinh độ/vĩ độ |

6. **UploadFileTable — File đính kèm:**

| Cột | Nội dung | Loại điều khiển | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| zlstFileDk | File đính kèm | UploadFileTable | Không | PDF, ảnh, tài liệu liên quan |

7. **Footer — Các nút hành động:** "Lưu tạm" / "Lưu và gửi phê duyệt" / "Lưu và phê duyệt" (chỉ Cục)

### 10.7. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị spinner của Ant Design hoặc khung xương (skeleton) — không hiển thị form trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng và dòng chữ "Không có dữ liệu" với màu chữ `textSecondary` và cỡ chữ `fontSizeMd`.
- **Lỗi tải dữ liệu:** hiển thị cảnh báo đỏ và nút "Thử lại" màu `actionPrimary`.
- **Lỗi submit:** hiển thị toast message lỗi, không đóng form, giữ nguyên dữ liệu đã nhập.

### 10.8. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| system-admin | Toàn bộ form + tất cả nút | |
| Cấp Cục | Form + 3 nút (gồm "Lưu và phê duyệt") | Duyệt thẳng S_6 |
| Chi cục / Cán bộ | Form + 2 nút (Lưu tạm, Lưu & Gửi duyệt) | Không có nút duyệt thẳng |
| Admin Cục | Full + thông tin người tạo/sửa, thời gian | Logic đặc biệt (mục 2.2) |

### 10.9. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger 80px
- Form chuyển thành dạng single column, các field xếp dọc
- Modal thu nhỏ còn 90% chiều rộng màn hình

### 10.10. Cấu trúc file nguồn tham khảo

```
src/pages/(base)/vmd-mtis-ui/tskt/tskt-qlkc/tskt-qlkc-dbat/qlkc-052/
├── index.tsx                          ← Trang danh sách
├── _action/[...slug].tsx              ← Router action dispatch
└── modules/
    ├── Create.tsx                     ← Form tạo mới → FormCrud
    ├── FormCrud.tsx                   ← Form CRUD chính (dùng chung ATHH)
    └── InfoForm.tsx                   ← Form schema (28 fields)

src/main/java/.../tskt/
├── webapi/Qlkc052RestController.java  ← extends KchtAthhRestControllerImpl
├── service/Qlkc052Service.java
└── dto/Qlkc052Dto.java                ← extends KchtAthhDto
```
