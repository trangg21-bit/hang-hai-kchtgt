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

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** {F-XXX}
**Module:** {M-XXX} — {TÊN_MODULE}
**Loại:** chức năng thường (không có bước phê duyệt) — hoặc: chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

{MÔ_TẢ_3–5_DÒNG: chức năng này làm gì, ai dùng}

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | {TÊN_TRƯỜNG} | Có / Không | {Text / Select / TreeSelect / TextArea / Number...} + ràng buộc | {GHI_CHÚ / MÃ BR} |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng có bước phê duyệt → mô tả đầy đủ quy trình (mấy cấp, chuyển trạng thái thế nào).
- Không có bước phê duyệt → ghi rõ **"Không có bước phê duyệt"**.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-{XXX}-NN | {MÔ_TẢ_QUY_TẮC} | {Create / Update / Delete / Hierarchy...} |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-{XXX}-NN** — {TIÊU_ĐỀ}: {MÔ_TẢ}. Khi lỗi: {XỬ_LÝ}.

### 4.3. User Stories kế thừa (nếu có)

- **US-{XXX}-NN:** {NỘI_DUNG}.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| {THAO_TÁC} | `{resource}:{action}` |

**Admin Cục:** {khai báo đặc biệt gì / không — mặc định theo tài liệu nền mục 3.8: full quyền + xem thêm metadata người tạo/người sửa/thời gian}.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | {Có — ... / Không có} |
| 2 | Có bước phê duyệt không | {Không / Có — ...} |
| 3 | Lọc cha-con / theo đơn vị | {Theo đơn vị / Không / Có — ...} |
| 4 | Trường chỉ hiện trong điều kiện nào | {Không / Có — ...} |
| 5 | Quyền riêng | {liệt kê `<resource>:<action>`} |
| 6 | Đường dẫn dùng chung không cần đăng nhập | {Không / Có — ...} |
| 7 | Tải lên tệp | {Không / Có — ...} |
| 8 | Giao diện khác mẫu chung | {Không / Có — ...} |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/{resource}` | {MÔ_TẢ} | `{resource}:read` |
| POST | `/api/{resource}` | {MÔ_TẢ} | `{resource}:create` |
| PUT | `/api/{resource}/{id}` | {MÔ_TẢ} | `{resource}:update` |
| DELETE | `/api/{resource}/{id}` | {MÔ_TẢ} | `{resource}:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `{TÊN_BẢNG}` ({MÔ_TẢ}):** {liệt kê các trường, đánh dấu 🔴 cho trường mới, ~~gạch ngang~~ cho trường loại bỏ}.
