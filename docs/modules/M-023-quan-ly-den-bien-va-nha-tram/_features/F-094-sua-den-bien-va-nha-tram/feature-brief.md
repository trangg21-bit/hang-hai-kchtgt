---
id: F-094
name: Sửa Đèn biển và nhà trạm gắn với Đèn biển
slug: sua-den-bien-va-nha-tram
module-id: M-023
status: proposed
classification: local
priority: high
created: 2026-08-05T00:00:00Z
last-updated: 2026-08-05T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Sửa Đèn biển và nhà trạm gắn với Đèn biển

**Tài liệu:** BA Feature Brief
**Feature:** F-094
**Module:** M-023 — Quản lý Đèn biển và nhà trạm gắn với Đèn biển
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-05
**Tham khảo:** `references/qlkc-052-quan-ly-den-bien-va-nha-tram.md` (mục 5)
**Nhóm KCHT:** `KCHT_ATHH`

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép Chuyên viên / Cán bộ chỉnh sửa thông tin một bản ghi **Đèn biển và nhà trạm gắn với Đèn biển** đã tồn tại. Form sửa dùng chung `FormCrud` với `mode=Edit`, load dữ liệu hiện tại từ API detail, cho phép thay đổi tất cả các trường ngoại trừ mã (`ma`) và đơn vị quản lý (`fkDonViQl`).

### 1.2. Tại sao cần tính năng này?

Thông tin đèn biển có thể thay đổi theo thời gian (nâng cấp thiết bị, thay đổi đặc tính kỹ thuật, điều chỉnh tọa độ...). Cần có khả năng cập nhật mà không phải xóa và tạo lại.

### 1.3. Luồng hoạt động chính

Danh sách DBNT → bấm "Sửa" trên dòng → load dữ liệu từ API detail → hiển thị form Edit với dữ liệu đã điền sẵn → chỉnh sửa → chọn 1 trong 3 nút:

| Nút | `enumActionKcht` | Trạng thái sau lưu |
|---|---|---|
| **Cập nhật** | `LUU_TAM` | S_1 (Lưu tạm) — nếu đang S_6 thì quay về S_1 |
| **Cập nhật và gửi phê duyệt** | `LUU_VA_GUI_PHE_DUYET` | S_2 (Chờ Chi cục duyệt) |
| **Cập nhật và phê duyệt** (chỉ Cục) | `LUU_VA_PHE_DUYET` | S_6 (Đã duyệt) |

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
- **Nút "Cập nhật và phê duyệt":** Chỉ hiển thị với tài khoản Cấp Cục.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-094-01:** Là Chuyên viên, tôi muốn sửa thông tin Đèn biển và nhà trạm đã tạo để cập nhật dữ liệu khi có thay đổi thực tế.
- **US-094-02:** Là Chuyên viên, tôi muốn chọn "Cập nhật" để lưu thay đổi và giữ bản ghi ở trạng thái Lưu tạm (hoặc quay về Lưu tạm nếu trước đó đã duyệt).
- **US-094-03:** Là Chuyên viên, tôi muốn chọn "Cập nhật và gửi phê duyệt" để gửi bản ghi đã sửa sang luồng duyệt lại.

### Mức Should (nên có)

- **US-094-04:** Là Cấp Cục, tôi muốn nút "Cập nhật và phê duyệt" để sửa và duyệt thẳng mà không cần qua PDKC_053.

### Mức Could (có thể có sau)

- **US-094-05:** Là người dùng, tôi muốn thấy lịch sử các lần sửa trước đó ngay trên form sửa.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-094-01 — Hiển thị form sửa:** Bấm "Sửa" từ danh sách → gọi `GET .../detail?id=...&ma=...` → form `FormCrud` mode=Edit hiển thị với dữ liệu đã điền sẵn. Nếu load thất bại, hiển thị lỗi.

**AC-094-02 — Trường khóa không sửa được:** `ma` (mã DBNT) luôn disabled. `fkDonViQl` (đơn vị quản lý) disabled khi EDIT. Các trường còn lại cho phép sửa.

**AC-094-03 — Cập nhật (S_1):** `PUT ...?enumActionKcht=LUU_TAM` → nếu bản ghi đang S_6 → quay S_1; nếu đang S_1 → giữ S_1. Thông báo thành công.

**AC-094-04 — Cập nhật và gửi duyệt (S_2):** `PUT ...?enumActionKcht=LUU_VA_GUI_PHE_DUYET` → status = S_2. Xuất hiện trong PDKC_053.

**AC-094-05 — Cập nhật và duyệt (S_6, Cục):** `PUT ...?enumActionKcht=LUU_VA_PHE_DUYET` → status = S_6. Chỉ Cấp Cục.

**AC-094-06 — Validate:** Cùng rule validate như tạo mới (required fields, decimal, max length). Nếu lỗi → hiển thị tại field, không submit.

**AC-094-07 — Điều kiện hiển thị nút Sửa:** Chỉ hiển thị khi: (Cục + Lưu tạm) / (Chi cục + Lưu tạm + đúng đơn vị) / (Từ chối + đúng đơn vị) / (Đã duyệt + đúng đơn vị).

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-094-01 — Sửa bản ghi đã duyệt thì quay về duyệt lại:** Bản ghi S_6 sau khi sửa (với action LUU_TAM hoặc LUU_VA_GUI_PHE_DUYET) sẽ quay về S_1 hoặc S_2, và cần được duyệt lại qua PDKC_053 trước khi module khác tham chiếu.

**BR-094-02 — Không sửa được mã và đơn vị quản lý:** `ma` và `fkDonViQl` bị khóa khi sửa để đảm bảo tính toàn vẹn dữ liệu.

**BR-094-03 — Cùng rule validate như tạo mới:** Tất cả rule validate từ F-092 áp dụng tương tự cho form sửa.

---

## 6. Mô hình dữ liệu

Dùng chung bảng KCHT_ATHH với F-092. Không có bảng mới. Xem chi tiết mô hình dữ liệu tại F-092 mục 6.

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/tskt/qlkc_052/detail?id=...&ma=...` | Load dữ liệu cũ | Người dùng được phân quyền |
| PUT | `/api/v1/tskt/qlkc_052?enumActionKcht=LUU_TAM` | Cập nhật (S_1) | Chuyên viên, Cán bộ |
| PUT | `/api/v1/tskt/qlkc_052?enumActionKcht=LUU_VA_GUI_PHE_DUYET` | Cập nhật & Gửi duyệt (S_2) | Chuyên viên, Cán bộ |
| PUT | `/api/v1/tskt/qlkc_052?enumActionKcht=LUU_VA_PHE_DUYET` | Cập nhật & Duyệt (S_6) | Cấp Cục |

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Form sửa

Dùng `FormCrud` với `mode=Edit`. Khác biệt so với Tạo mới:

| Khía cạnh | Tạo mới (Create) | Sửa (Edit) |
|---|---|---|
| Mode | FORM_MODE.Create | FORM_MODE.Edit |
| Dữ liệu khởi tạo | Trống / default | Load từ API detail |
| fkDonViQl | Chọn được | **Disabled** |
| ma | Ẩn / disabled | Hiển thị mã hiện tại (disabled) |
| Nút chính | "Lưu tạm" | "Cập nhật" |

### 8.2. Điều kiện hiển thị nút Sửa trên danh sách

| Vai trò | Trạng thái bản ghi | Hiển thị nút Sửa? |
|---|---|---|
| Cấp Cục | Lưu tạm (S_1) | ✅ |
| Cấp Cục | Từ chối (S_4, S_5) | ✅ |
| Cấp Cục | Đã duyệt (S_6) | ✅ |
| Chi cục (đúng đơn vị) | Lưu tạm (S_1) | ✅ |
| Chi cục (đúng đơn vị) | Từ chối (S_4, S_5) | ✅ |
| Chi cục (đúng đơn vị) | Đã duyệt (S_6) | ✅ |
| Chi cục (khác đơn vị) | Bất kỳ | ❌ |
| Khách / Tra cứu | Bất kỳ | ❌ |

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- API detail phản hồi trong < 500ms
- Form load + đổ dữ liệu trong < 2 giây

### 9.2. Bảo mật

- Backend phải kiểm tra quyền sửa: user phải thuộc đúng đơn vị QL hoặc là Cấp Cục
- `LUU_VA_PHE_DUYET` chỉ cho phép với Cấp Cục

### 9.3. Độ tin cậy

- Transaction rollback nếu lỗi khi update
- Ghi log lịch sử thay đổi (phục vụ F-097)

### 9.4. Trải nghiệm người dùng

- Form load có skeleton
- Submit thất bại → toast lỗi, giữ form, không mất dữ liệu đã sửa
- Tuân thủ WCAG 2.1 AA

---

## 10. Yêu cầu giao diện người dùng

Dùng chung toàn bộ token màu sắc, thang số, style với F-092.

### 10.1. Màn hình Sửa

Giống form Tạo mới (F-092 mục 10.6), khác biệt:

1. **ScreenHeader:** breadcrumb "Quản lý Đèn biển và nhà trạm gắn với Đèn biển > Sửa"
2. **FormCrud (mode=Edit):** Dữ liệu điền sẵn từ API detail
3. **Footer:** "Cập nhật" / "Cập nhật và gửi phê duyệt" / "Cập nhật và phê duyệt" (Cục)

### 10.2. Cấu trúc file nguồn tham khảo

```
qlkc-052/modules/Edit.tsx → FormCrud mode=Edit
Qlkc052RestController.java → PUT endpoint
```
