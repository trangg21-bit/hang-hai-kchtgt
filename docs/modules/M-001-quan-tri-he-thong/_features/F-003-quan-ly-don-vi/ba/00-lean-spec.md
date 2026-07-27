---
feature-id: F-003
document: lean-spec
output-mode: lean
last-updated: 2026-07-27T00:00:00Z
---

# Feature F-003: Quản lý đơn vị — Lean Business Analysis Spec

## 1. Summary

| Field | Value |
|---|---|
| Feature ID | F-003 |
| Feature Name | Quản lý đơn vị |
| Slug | quan-ly-don-vi |
| Module | M-001 (Quản trị hệ thống) |
| Classification | local |
| Priority | high |
| Complexity | Simple (8 business rules, 1 actor) |
| Tech Stack | Spring Boot + Spring Security + JWT + ReactJS + MSSQL 2022 |

**Business Intent:** Quản lý cấu trúc tổ chức đơn vị hành chính theo hệ thống phân cấp tối đa 3 cấp, bao gồm tạo mới, chỉnh sửa, xóa, phê duyệt và tra cứu thông tin đơn vị.

---

## 2. Scope

### In Scope

| # | Capability | Description |
|---|---|---|
| 1 | Xem cây cấu trúc đơn vị | Hiển thị cây phân cấp (tối đa 3 cấp), hỗ trợ expand/collapse (trừ cấp 3) |
| 2 | Tạo đơn vị mới | Tên, mã (unique), đơn vị cha (không bắt buộc), tỉnh/thành phố, địa chỉ, SĐT, trạng thái |
| 3 | Chỉnh sửa đơn vị | Cập nhật tên, đơn vị cha, địa điểm, SĐT, trạng thái |
| 4 | Xóa đơn vị | Chỉ xóa khi không có đơn vị con và không có người dùng trực thuộc |
| 5 | Phê duyệt đơn vị | Chuyển trạng thái từ Chờ phê duyệt → Sử dụng |
| 6 | Xem chi tiết đơn vị | Hiển thị toàn bộ thông tin đơn vị (chế độ chỉ xem) |
| 7 | Tìm kiếm và lọc | Tìm theo tên/mã, lọc theo trạng thái |

### Out of Scope

| # | Capability | Reason |
|---|---|---|
| 1 | Di chuyển đơn vị | Không thuộc phạm vi |
| 2 | Quản lý nhân sự trực thuộc | Thuộc F-001 (User Management) |
| 3 | Phân cấp quá 3 cấp | Giới hạn nghiệp vụ |
| 4 | Xuất báo cáo org chart | Không yêu cầu |
| 5 | Hệ số (coefficient) | Không thuộc phạm vi |

---

## 3. Actors & Permissions

| Actor | Access |
|---|---|
| Người dùng được phân quyền | Xem, tạo, sửa, xóa, phê duyệt đơn vị (theo phân quyền hệ thống) |

Quyền hạn cụ thể (xem, tạo, sửa, xóa, phê duyệt) theo phân quyền hệ thống.

---

## 4. User Stories (MoSCoW)

| ID | Story | Priority |
|---|---|---|
| US-003-01 | Là người dùng được phân quyền, tôi muốn xem cây cấu trúc đơn vị phân cấp để nắm được tổ chức hệ thống | Must |
| US-003-02 | Là người dùng có quyền tạo, tôi muốn tạo đơn vị mới với tên, mã, địa điểm, SĐT và trạng thái | Must |
| US-003-03 | Là người dùng có quyền sửa, tôi muốn chỉnh sửa thông tin đơn vị | Must |
| US-003-04 | Là người dùng có quyền xóa, tôi muốn xóa đơn vị khi không còn ràng buộc | Should |
| US-003-05 | Là người dùng có quyền phê duyệt, tôi muốn phê duyệt đơn vị đang chờ | Should |
| US-003-06 | Là người dùng, tôi muốn xem chi tiết đơn vị để biết đầy đủ thông tin | Should |
| US-003-07 | Là người dùng, tôi muốn tìm kiếm và lọc đơn vị theo tên/mã và trạng thái | Must |

---

## 5. Acceptance Criteria

| ID | Criterion | Negative Path |
|---|---|---|
| AC-003-01 | Mã đơn vị (code) phải duy nhất trong toàn hệ thống; không được trùng khi tạo mới | Tạo với mã đã tồn tại → "Mã đơn vị đã tồn tại" |
| AC-003-02 | Không cho phép tạo vòng lặp phân cấp (circular reference) | Chọn chính nó hoặc đơn vị con làm cha → lỗi |
| AC-003-03 | Đơn vị cha không bắt buộc; để trống → đơn vị cấp cao nhất | Tạo không chọn cha → level=1 |
| AC-003-04 | Hệ thống phân cấp giới hạn tối đa 3 cấp | Cố gắng tạo cấp 4 → lỗi |
| AC-003-05 | Không cho phép xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc | Xóa đơn vị có ràng buộc → lỗi kèm thông báo cụ thể |
| AC-003-06 | Cấp bậc (level) được tính tự động theo độ sâu trong cây | Tạo đơn vị con → level = level cha + 1 |
| AC-003-07 | Tên đơn vị không được để trống, tối đa 200 ký tự | Để trống → "Tên đơn vị không được để trống" |
| AC-003-08 | Đơn vị cấp 3 không có chức năng collapse/expand trên cây | Cấp 3 → không hiển thị mũi tên mở rộng |

---

## 6. Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-003-01 | Mã đơn vị (code) phải là duy nhất trong toàn hệ thống | Tạo/Sửa đơn vị | Dữ liệu master |
| BR-003-02 | Không cho phép tạo vòng lặp phân cấp (circular reference) | Phân cấp | Integrity constraint |
| BR-003-03 | Đơn vị gốc không có đơn vị cha; không chọn đơn vị cha khi tạo → đơn vị cấp cao nhất | Tạo đơn vị | Nghiệp vụ |
| BR-003-04 | Hệ thống phân cấp giới hạn tối đa 3 cấp | Phân cấp | Nghiệp vụ |
| BR-003-05 | Không cho phép xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc | Xóa đơn vị | Integrity constraint |
| BR-003-06 | Cấp bậc (level) được tính tự động theo độ sâu trong cây | Tính toán level | Business logic |
| BR-003-07 | Tên đơn vị không được để trống, tối đa 200 ký tự | Validation | UI/UX |
| BR-003-08 | Trên cây đơn vị, đơn vị cấp nhỏ nhất (cấp 3) không có chức năng collapse/expand | Hiển thị cây | UI/UX |

---

## 7. Entities

| Entity | Key Fields | Notes |
|---|---|---|
| **Đơn vị** | id, ten_don_vi, ma_don_vi (unique), don_vi_cha (nullable FK), cap_bac (auto), tinh_thanh_pho, dia_chi_chi_tiet, so_dien_thoai, trang_thai (Sử dụng/Không sử dụng/Chờ phê duyệt), ngay_tao | Bảng chính, tự tham chiếu qua don_vi_cha |

Trạng thái (trang_thai):
| Giá trị | Mô tả |
|---|---|
| Sử dụng | Đơn vị đang hoạt động |
| Không sử dụng | Đơn vị ngừng hoạt động |
| Chờ phê duyệt | Đơn vị chờ được phê duyệt (do hệ thống gán, không chọn thủ công) |

---

## 8. Screens Summary

| Màn hình | Mô tả |
|---|---|
| Cấu trúc cây đơn vị | Cây phân cấp + tìm kiếm/lọc + thao tác trên dòng (Xem, Sửa, Xóa, Phê duyệt) |
| Xem chi tiết | 7 trường thông tin (Label) + thanh thao tác (Sửa, Xóa, Phê duyệt, Quay lại) |
| Tạo mới / Chỉnh sửa | Form 7 trường + nút Lưu (luôn enable, validate khi nhấn) |
| Xác nhận xóa | Modal cảnh báo ràng buộc |

---

## 9. Form Fields (Tạo mới / Chỉnh sửa)

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Tên đơn vị | Textbox | Có | 2-200 ký tự |
| 2 | Mã đơn vị | Textbox | Có (tạo) / Không (sửa) | 2-30 ký tự, unique, chỉ sửa khi tạo |
| 3 | Đơn vị cha | Tree Selector | Không | Để trống = cấp cao nhất |
| 4 | Địa điểm (Tỉnh/TP) | Dropdown | Có | Danh mục hành chính |
| 5 | Địa điểm chi tiết | Textbox | Không | Tối đa 500 ký tự |
| 6 | Số điện thoại | Textbox | Không | 10-11 chữ số |
| 7 | Trạng thái | Dropdown | Có | Sử dụng / Không sử dụng. Mặc định: Sử dụng (tạo mới). Chờ phê duyệt do hệ thống gán. |
| — | Nút Lưu | Button | — | Luôn enable, validate khi nhấn |

---

## 10. Test Scenarios

| ID | Scenario | Expected Result |
|---|---|---|
| TS-003-01 | Tạo đơn vị với mã unique | Đơn vị được tạo, level tự động tính |
| TS-003-02 | Tạo đơn vị với mã trùng | Lỗi "Mã đơn vị đã tồn tại" |
| TS-003-03 | Tạo đơn vị không chọn đơn vị cha | Đơn vị cấp cao nhất, level=1 |
| TS-003-04 | Tạo đơn vị cấp 4 | Lỗi "Vượt quá 3 cấp" |
| TS-003-05 | Xóa đơn vị có đơn vị con | Lỗi kèm số lượng đơn vị con |
| TS-003-06 | Xóa đơn vị có người dùng | Lỗi "đang có người dùng trực thuộc" |
| TS-003-07 | Xóa đơn vị không ràng buộc | Xóa thành công |
| TS-003-08 | Phê duyệt đơn vị Chờ phê duyệt | Trạng thái → Sử dụng |
| TS-003-09 | Cây hiển thị đúng 3 cấp, cấp 3 không expand | Kiểm tra UI |
| TS-003-10 | Tìm kiếm theo tên/mã, lọc theo trạng thái | Kết quả chính xác |

---

## 11. Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Q1: Creates new domain elements? | Yes | Entity Đơn vị với self-referencing FK |
| Q2: Affects system architecture? | No | Sử dụng stack hiện có |
| Q3: Approach clear from existing architecture? | Yes | Tree pattern đơn giản |

**Triage Verdict:** Route to engineering-system-architect (Q1=Yes).
