---
id: {F-XXX}
name: {TÊN_TÍNH_NĂNG}
slug: {slug-tinh-nang}
module-id: {M-XXX}
status: proposed
classification: local
priority: medium
created: {YYYY-MM-DD}
last-updated: {YYYY-MM-DD}
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: {TÊN_TÍNH_NĂNG}

**Tài liệu:** BA Feature Brief
**Feature:** {F-XXX}
**Module:** {M-XXX} — {TÊN_MODULE}
**Người viết:** Business Analyst
**Ngày cập nhật:** {YYYY-MM-DD}

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

{MÔ_TẢ_NGẮN_GỌN_VỀ_TÍNH_NĂNG}

### 1.2. Tại sao cần tính năng này?

{LÝ_DO_CẦN_TÍNH_NĂNG}

### 1.3. Luồng hoạt động chính

{MÔ_TẢ_LUỒNG_HOẠT_ĐỘNG_CHÍNH}

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền:

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | {MÔ_TẢ} | {MÔ_TẢ} | {MÔ_TẢ} | |
| admin (Security) | {MÔ_TẢ} | {MÔ_TẢ} | {MÔ_TẢ} | |
| admin-operation | {MÔ_TẢ} | {MÔ_TẢ} | {MÔ_TẢ} | |
| admin | {MÔ_TẢ} | {MÔ_TẢ} | {MÔ_TẢ} | |
| Lãnh đạo | {MÔ_TẢ} | {MÔ_TẢ} | {MÔ_TẢ} | |
| Cán bộ | {MÔ_TẢ} | {MÔ_TẢ} | {MÔ_TẢ} | |
| Cá nhân | {MÔ_TẢ} | {MÔ_TẢ} | {MÔ_TẢ} | |

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

> **Ghi chú:** Các trường `người tạo mới`, `thời gian tạo mới`, `người chỉnh sửa`, `thời gian cập nhật` cần được bổ sung vào bảng dữ liệu tương ứng và chỉ hiển thị đối với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-{XXX}-01:** Là {VAI_TRÒ}, tôi muốn {HÀNH_ĐỘNG} để {MỤC_ĐÍCH}.
- **US-{XXX}-02:** ...

### Mức Should (nên có)

- **US-{XXX}-03:** ...

### Mức Could (có thể có sau)

- **US-{XXX}-04:** ...

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-{XXX}-01 — {TIÊU_ĐỀ_AC}:** {MÔ_TẢ_CHI_TIẾT}. {XỬ_LÝ_KHI_LỖI}.

**AC-{XXX}-02 — {TIÊU_ĐỀ_AC}:** {MÔ_TẢ_CHI_TIẾT}. {XỬ_LÝ_KHI_LỖI}.

...

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

**BR-{XXX}-01 — {TÊN_QUY_TẮC}:** {MÔ_TẢ_QUY_TẮC}.

**BR-{XXX}-02 — {TÊN_QUY_TẮC}:** {MÔ_TẢ_QUY_TẮC}.

...

---

## 6. Mô hình dữ liệu

Tính năng này tạo ra/sửa đổi các bảng dữ liệu sau trong cơ sở dữ liệu:

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **trường mới cần thêm** vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = **trường không cần thiết**, cần loại bỏ khỏi bảng.
> - Các trường không được đánh dấu là các trường hiện có, được giữ nguyên.

### 6.1. Bảng {TÊN_BẢNG} — {MÔ_TẢ}

Đây là bảng chính, lưu {MÔ_TẢ_DỮ_LIỆU}.

Các trường thông tin:

- **id:** mã số tự tăng, duy nhất cho mỗi dòng
- **{tên_trường_hiện_có}:** {mô_tả}
- <span style="color:red;font-weight:bold">**{tên_trường_mới}:** {mô_tả_trường_mới_cần_thêm}</span>
- ~~**{tên_trường_không_cần}:** {mô_tả_trường_cần_loại_bỏ}~~
- **createdAt:** thời điểm tạo bản ghi

**Ví dụ cách đọc:** Trong bảng trên, `{tên_trường_mới}` là trường cần được thêm mới vào database, còn `{tên_trường_không_cần}` là trường đang có nhưng không còn cần thiết và sẽ bị loại bỏ.

### 6.2. Các bảng khác (nếu có)

{NẾU_CÓ_THÊM_BẢNG_KHÁC_THÌ_LIỆT_KÊ_TƯƠNG_TỰ}

---

## 7. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng:

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/{resource}` | {MÔ_TẢ} | {VAI_TRÒ} |
| POST | `/api/v1/{resource}` | {MÔ_TẢ} | {VAI_TRÒ} |
| PUT | `/api/v1/{resource}/{id}` | {MÔ_TẢ} | {VAI_TRÒ} |
| DELETE | `/api/v1/{resource}/{id}` | {MÔ_TẢ} | {VAI_TRÒ} |

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. {PHẦN_1}

{MÔ_TẢ_CHI_TIẾT}

### 8.2. {PHẦN_2}

{MÔ_TẢ_CHI_TIẾT}

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- {YÊU_CẦU_HIỆU_NĂNG}

### 9.2. Khả năng mở rộng

- {YÊU_CẦU_MỞ_RỘNG}

### 9.3. Bảo mật

- Phân quyền RBAC được áp dụng trên tất cả các API liên quan đến tính năng
- {YÊU_CẦU_BẢO_MẬT_KHÁC}

### 9.4. Độ tin cậy

- {YÊU_CẦU_TIN_CẬY}

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: trên điện thoại (dưới 768px), thanh menu thu gọn
- Có loading skeleton khi đang tải dữ liệu
- Có trạng thái rỗng (empty state) với hướng dẫn thân thiện
- Tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA

### 9.6. Tuân thủ pháp lý

- {YÊU_CẦU_PHÁP_LÝ}

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình {TÊN_TÍNH_NĂNG} dùng chung bố cục toàn hệ thống, bao gồm:

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

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình {TÊN_TÍNH_NĂNG}:

1. {VỊ_TRÍ_1}
2. {VỊ_TRÍ_2}
3. {VỊ_TRÍ_3} (nếu có)

Các màu trạng thái (xanh lá cho thành công, vàng cho cảnh báo, đỏ cho lỗi) và màu chữ không tính vào giới hạn này.

### 10.6. Màn hình {TÊN_MÀN_HÌNH}

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** hiển thị đường dẫn breadcrumb "{MODULE} > {TÊN_TÍNH_NĂNG}".

2. **FilterBar:** thanh lọc nằm ngang phía trên bảng, gồm: {LIỆT_KÊ_CÁC_BỘ_LỌC}.

3. **StatusTabs:** {SỐ_LƯỢNG} tab nằm ngang: {LIỆT_KÊ_CÁC_TAB}. Mỗi tab hiển thị số lượng bản ghi trong nhóm đó. Tab đang chọn có đường gạch chân màu `actionPrimary`.

4. **DataTable:** bảng dữ liệu với tiêu đề cột cố định khi cuộn (sticky header), dòng được tô sáng khi di chuột qua (hover row). Các cột hiển thị:

| Cột | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Ghi chú |
|---|---|---|---|---|---|---|
| STT | Số thứ tự dòng | Text (tự động) | Không | Có | Tự động đánh số | |
| {TÊN_CỘT_1} | {MÔ_TẢ} | {Text / Select / DatePicker / ...} | {Có / Không} | {Có / Không} | {GIÁ_TRỊ} | {GHI_CHÚ} |
| {TÊN_CỘT_2} | {MÔ_TẢ} | {Text / Select / DatePicker / ...} | {Có / Không} | {Có / Không} | {GIÁ_TRỊ} | {GHI_CHÚ} |
| ... | ... | ... | ... | ... | ... | ... |

**Giải thích các cột mới trong bảng màn hình:**

- **Loại điều khiển:** Xác định loại control UI hiển thị cho trường này trên form/dialog (ví dụ: Text, Select, DatePicker, TextArea, Number, Switch, Upload, ...).
- **Cho phép chỉnh sửa:** Trường này có được phép sửa sau khi tạo mới hay không (Có = editable, Không = read-only).
- **Bắt buộc:** Trường này có bắt buộc phải nhập khi tạo mới hay không (Có = required, Không = optional).
- **Giá trị mặc định:** Giá trị được điền sẵn khi mở form tạo mới (nếu có).

5. **Pagination:** thanh điều hướng trang ở cuối bảng, hiển thị tổng số dòng và số trang.

### 10.7. {TÊN_POPUP_HOẶC_MODAL} (nếu có)

{Khi có popup hoặc modal, mô tả tương tự}

### 10.8. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị spinner của Ant Design hoặc khung xương (skeleton) — không hiển thị bảng trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng và dòng chữ "{THÔNG_BÁO_KHÔNG_CÓ_DỮ_LIỆU}" với màu chữ `textSecondary` và cỡ chữ `fontSizeMd`.
- **Lỗi tải dữ liệu:** hiển thị cảnh báo đỏ và nút "Thử lại" màu `actionPrimary`.

### 10.9. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| system-admin | {MÔ_TẢ} | |
| admin (Security) | {MÔ_TẢ} | |
| admin-operation | {MÔ_TẢ} | |
| admin thường / Cán bộ | {MÔ_TẢ} | |
| Lãnh đạo | {MÔ_TẢ} | |
| Admin Cục | Xem full dữ liệu + thông tin người tạo, người sửa, thời gian tạo, thời gian cập nhật | Logic đặc biệt (xem mục 2.2) |

### 10.10. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger 80px
- Bảng dữ liệu chuyển thành dạng thẻ (card)
- Thanh lọc chuyển thành panel có thể gập/mở
- Modal thu nhỏ còn 90% chiều rộng màn hình
