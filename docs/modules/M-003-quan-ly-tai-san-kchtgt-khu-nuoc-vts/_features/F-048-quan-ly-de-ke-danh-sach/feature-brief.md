---
id: F-048
name: "Danh sách Đê/kè"
slug: ql-de-ke-danh-sach
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-11T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Danh sách Đê/kè

**Tài liệu:** BA Feature Brief
**Feature:** F-048
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Giao diện danh sách Đê/kè hiển thị toàn bộ các công trình đê/kè thuộc phạm vi quản lý của người dùng, kèm khả năng tìm kiếm nhanh, lọc theo nhiều tiêu chí, phân trang và sắp xếp. Đây là màn hình trung tâm của nhóm Đê/kè: từ đây người dùng điều hướng đến toàn bộ các thao tác khác — xem chi tiết (F-048-detail), tạo mới (F-044), chỉnh sửa (F-045), phê duyệt (F-047), xóa (F-046) và xem lịch sử (F-049). Nghiệp vụ tham khảo từ màn hình QLKC_074 (Quản lý đê/kè) của hệ thống tham chiếu.

### 1.2. Tại sao cần tính năng này?

Đê/kè là công trình bảo vệ bờ quan trọng. Cán bộ quản lý tài sản và lãnh đạo cần một giao diện duy nhất để nắm bắt nhanh chóng công trình nào đang hoạt động, công trình nào đang chờ phê duyệt, và công trình nào cần xử lý gấp — từ đó hỗ trợ ra quyết định vận hành, phân bổ nguồn lực và giám sát tuân thủ quy trình phê duyệt theo quy định quản lý nhà nước về hàng hải.

### 1.3. Luồng hoạt động chính

1. Người dùng vào menu **Quản lý KCHTGT Khu nước & VTS > Quản lý đê/kè**, hệ thống hiển thị danh sách công trình thuộc đơn vị mình.
2. Người dùng tìm kiếm nhanh, chọn bộ lọc hoặc chuyển tab trạng thái để thu hẹp danh sách theo nhu cầu.
3. Người dùng chọn một dòng để xem chi tiết, chỉnh sửa, xóa, gửi duyệt, phê duyệt hoặc xem lịch sử, tùy theo quyền và trạng thái của công trình đó.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (xem chi tiết tại tính năng Phân quyền). Danh sách luôn được lọc theo `orgUnitId` của người dùng đăng nhập — người dùng không thấy công trình ngoài phạm vi đơn vị mình, trừ Admin Cục.

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

### Mức Must (bắt buộc có)

- **US-048-01:** Là Chuyên viên, tôi muốn xem toàn bộ danh sách đê/kè thuộc đơn vị mình để nắm được hiện trạng tài sản.
- **US-048-02:** Là Chuyên viên, tôi muốn tìm kiếm nhanh theo mã hoặc tên đê/kè để tra cứu một bản ghi cụ thể mà không cần cuộn qua toàn bộ danh sách.
- **US-048-03:** Là Chuyên viên, tôi muốn lọc theo loại kết cấu, tình trạng và địa điểm để thu hẹp danh sách theo nhu cầu công việc.
- **US-048-04:** Là Trưởng phòng, tôi muốn thấy ngay các công trình đang "Chờ phê duyệt" qua tab trạng thái để xử lý phê duyệt kịp thời.
- **US-048-05:** Là người dùng bất kỳ, tôi muốn click vào một dòng để xem chi tiết công trình đó.

### Mức Should (nên có)

- **US-048-06:** Là Chuyên viên, tôi muốn chuyển đến màn hình chỉnh sửa hoặc xóa trực tiếp từ danh sách để không phải qua trang chi tiết trước.
- **US-048-07:** Là Chuyên viên, tôi muốn gửi duyệt hoặc phê duyệt trực tiếp từ danh sách để tiết kiệm thời gian.
- **US-048-08:** Là người dùng, tôi muốn đổi số bản ghi hiển thị mỗi trang (20/50/100) theo nhu cầu.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-048-01 — Hiển thị danh sách mặc định:** Khi mở màn hình, hệ thống hiển thị danh sách với phân trang (mặc định 20 dòng/trang), sắp xếp theo `updatedAt` giảm dần, giới hạn theo `orgUnitId` của người dùng. Chỉ hiển thị bản ghi `isDeleted = false`.

**AC-048-02 — Phân trang tùy chọn:** Người dùng chọn 20/50/100 bản ghi/trang từ dropdown; bảng tải lại đúng số lượng đã chọn và giữ nguyên các bộ lọc đang áp dụng.

**AC-048-03 — Tìm kiếm nhanh:** Người dùng nhập từ khóa vào ô tìm kiếm (khớp `ma` hoặc `dikeRevetmentName`, dạng substring, không phân biệt hoa/thường) và nhấn Enter hoặc chờ debounce 400ms; hệ thống hiển thị kết quả khớp trong vòng 500ms.

**AC-048-04 — Lọc theo loại kết cấu:** Dropdown "Loại kết cấu" hiển thị danh mục `LOAI_KCCT_DE_KE`: đê chắn sóng / đê chắn cát / kè hướng dòng / kè bảo vệ bờ. Chọn một giá trị lọc bảng tương ứng.

**AC-048-05 — Lọc theo địa điểm:** Dropdown Địa điểm liệt kê các Tỉnh/Thành phố đang có công trình; chọn một giá trị sẽ lọc bảng chỉ còn công trình thuộc địa điểm đó.

**AC-048-06 — Lọc theo tình trạng:** Dropdown "Tình trạng" gồm "Tất cả", "Chưa khai thác/vận hành", "Đang khai thác/vận hành", "Dừng khai thác/vận hành". Chọn một giá trị lọc bảng tương ứng.

**AC-048-07 — Tab trạng thái phê duyệt:** 4 tab "Tất cả / Chờ phê duyệt / Đang duyệt / Đã phê duyệt / Từ chối", mỗi tab hiển thị số lượng bản ghi tương ứng; chuyển tab lọc lại danh sách theo `approvalStatus` mà không mất các bộ lọc khác đang áp dụng.

**AC-048-08 — Cột hiển thị đầy đủ:** Mỗi dòng hiển thị đúng các cột: STT, Đơn vị quản lý, Mã đê kè, Tên đê kè, Địa điểm, Loại kết cấu, Chiều dài, Tình trạng, Trạng thái phê duyệt, Ngày cập nhật, Thao tác.

**AC-048-09 — Xem chi tiết:** Click vào mã hoặc tên đê/kè (hoặc nút "Xem") điều hướng đến màn hình xem chi tiết với đúng `id` của dòng được chọn.

**AC-048-10 — Chỉnh sửa:** Nút "Sửa" chỉ hiển thị cho người dùng có quyền `dikerevetment:update` và bản ghi đủ điều kiện (xem F-045). Click điều hướng đến màn hình chỉnh sửa với form được điền sẵn dữ liệu.

**AC-048-11 — Xóa:** Nút "Xóa" chỉ hiển thị khi `approvalStatus = PROPOSED` và người dùng có quyền `dikerevetment:delete` + cùng đơn vị (hoặc Cấp Cục). Click mở hộp thoại xác nhận trước khi gọi DELETE.

**AC-048-12 — Gửi phê duyệt:** Nút "Gửi phê duyệt" hiển thị khi `approvalStatus = PROPOSED` hoặc `REJECTED` + cùng đơn vị. Click gửi yêu cầu phê duyệt (xem F-047).

**AC-048-13 — Phê duyệt:** Nút "Phê duyệt" chỉ hiển thị cho Cấp Cục khi `approvalStatus = PROPOSED`. Click phê duyệt trực tiếp (xem F-047).

**AC-048-14 — Lịch sử:** Nút "Lịch sử" luôn hiển thị cho mọi vai trò có quyền xem; click điều hướng đến màn hình lịch sử thay đổi (F-049).

**AC-048-15 — Công trình đã xóa không hiển thị:** Công trình có `isDeleted = true` không xuất hiện trong danh sách chính ở bất kỳ bộ lọc nào.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-048-01 — Phân trang mặc định:** Danh sách hiển thị mặc định 20 bản ghi/trang, có thể đổi sang 50 hoặc 100.

**BR-048-02 — Sắp xếp mặc định:** Danh sách sắp xếp mặc định theo `updatedAt` giảm dần (bản ghi thay đổi gần nhất lên đầu).

**BR-048-03 — Phạm vi dữ liệu theo đơn vị quản lý:** Người dùng chỉ thấy công trình thuộc `orgUnitId` của mình. Admin Cục xem được toàn bộ hệ thống.

**BR-048-04 — Tìm kiếm khớp trên nhiều trường:** Từ khóa tìm kiếm được áp dụng đồng thời trên `ma` và `dikeRevetmentName` theo kiểu OR.

**BR-048-05 — Ẩn dữ liệu đã xóa:** Công trình có `isDeleted = true` bị loại khỏi mọi truy vấn danh sách.

**BR-048-06 — Điều kiện hiển thị nút hành động:** Các nút Sửa, Xóa, Gửi duyệt, Phê duyệt chỉ hiển thị khi bản ghi đủ điều kiện về trạng thái và phân quyền (xem chi tiết từng tính năng: F-045, F-046, F-047).

---

## 6. Vòng đời và liên kết

> ⚠ **QUAN TRỌNG CHO DEVELOPER:** Danh sách Đê/kè là **màn hình trung tâm** của nhóm Đê/kè — mọi tính năng khác đều xuất phát từ hoặc quay trở lại danh sách này. Xem sơ đồ vòng đời đầy đủ tại F-044 mục 6.1.

### 6.1. Trạng thái hiển thị trên danh sách

| Trạng thái | Mã | Badge màu | Xuất hiện trong danh sách? |
|---|---|---|---|
| Chờ phê duyệt | PROPOSED | Vàng | ✅ Có |
| Đang duyệt | UNDER_REVIEW | Xanh dương | ✅ Có |
| Đã phê duyệt | APPROVED | Xanh lá | ✅ Có |
| Từ chối | REJECTED | Đỏ | ✅ Có |
| Đã xóa | `isDeleted = true` | — | ❌ Không |

### 6.2. Các tính năng liên quan

| Tên tính năng | Mối liên kết với Danh sách |
|---|---|
| Xem chi tiết | Click mã/tên hoặc nút "Xem" từ danh sách để mở |
| Tạo mới (F-044) | Nút "Tạo mới" trên thanh công cụ; sau khi tạo xong quay lại danh sách |
| Cập nhật (F-045) | Nút "Sửa" trên mỗi dòng |
| Xóa (F-046) | Nút "Xóa" trên mỗi dòng |
| Phê duyệt (F-047) | Nút "Gửi duyệt" / "Phê duyệt" trên mỗi dòng |
| Lịch sử (F-049) | Nút "Lịch sử" trên mỗi dòng |

---

## 7. Mô hình dữ liệu

Tính năng này chỉ đọc dữ liệu (read-only), không tạo hay sửa bảng. Bảng được truy vấn: `dike_revetment`. Các trường chính phục vụ hiển thị và lọc: `id`, `ma`, `dikeRevetmentName`, `orgUnitId`, `location`, `dikeRevetmentType`, `length`, `status`, `approvalStatus`, `updatedAt`, `isDeleted`.

---

## 8. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/dike-revetment?page=&size=&sortBy=&keyword=&dikeRevetmentType=&status=&approvalStatus=&location=` | Lấy danh sách có phân trang, tìm kiếm và lọc | `dikerevetment:read` |
| GET | `/api/v1/dike-revetment/search` | Tìm kiếm nâng cao | `dikerevetment:read` |

---

## 9. Chi tiết nghiệp vụ

### 9.1. Cột hiển thị

| STT | Cột | Nguồn dữ liệu | Loại hiển thị | Ghi chú |
|---|---|---|---|---|
| 1 | STT | Tự động đánh số | Text | |
| 2 | Mã + Tên đê kè | `ma` + `dikeRevetmentName` | Text (link) | Click mở xem chi tiết. Hiển thị: [Mã] - [Tên] |
| 3 | Địa điểm | `location` | Text | Tỉnh/TP |
| 4 | Chiều dài (m) | `length` | Number | |
| 5 | Đơn vị quản lý | `orgUnitId` (join) | Text | |
| 6 | Thuộc cảng biển | `cangBienId` (join) | Text | |
| 7 | Loại kết cấu công trình | `dikeRevetmentType` | Tag | Đê chắn sóng / Đê chắn cát / Kè hướng dòng / Kè bảo vệ bờ |
| 8 | Đơn vị vận hành | `donViVanHanhId` (join) | Text | |
| 9 | Thời điểm đưa vào khai thác | `commissioningDate` | Text (năm) | |
| 10 | Tình trạng | `status` | Tag | Chưa khai thác/vận hành / Đang khai thác/vận hành / Dừng khai thác/vận hành |
| 11 | Trạng thái | `approvalStatus` | Badge | Vàng: PROPOSED / Xanh dương: UNDER_REVIEW / Xanh lá: APPROVED / Đỏ: REJECTED |
| 12 | Ngày cập nhật | `updatedAt` | Text (dd/MM/yyyy HH:mm) | Sắp xếp mặc định |
| 13 | Người cập nhật | `updatedBy` (join) | Text | |
| 14 | Thao tác | — | Nhóm nút | Xem / Sửa / Xóa / Gửi duyệt / Phê duyệt / Lịch sử |

### 9.2. Bộ lọc

| Field | Loại | Mô tả |
|---|---|---|
| Tìm kiếm nhanh | Input (debounce 400ms) | Tìm theo `ma` hoặc `dikeRevetmentName` |
| Tình trạng | Select | Chưa khai thác/vận hành / Đang khai thác/vận hành / Dừng khai thác/vận hành |
| Đơn vị quản lý | SelectOrgCode | Mặc định = đơn vị user (Admin Cục được đổi) |
| Thuộc cảng biển | Select | Chỉ cảng biển đã duyệt |
| Loại kết cấu công trình | Select | Danh mục LOAI_KCCT_DE_KE: đê chắn sóng / đê chắn cát / kè hướng dòng / kè bảo vệ bờ |
| Địa điểm (Tỉnh/Thành phố) | Select | Danh mục Tỉnh/TP |
| Thời điểm đưa vào khai thác | DatePicker (year) | Lọc theo năm đưa vào khai thác |
| Ngày cập nhật (Từ ngày - đến ngày) | RangePicker | Tối đa 1 năm |
| Tab trạng thái | StatusTabs | Tất cả / Chờ duyệt / Đang duyệt / Đã duyệt / Từ chối |

### 9.3. Hành động trên mỗi dòng

| Nút | Điều kiện hiển thị | Hành động |
|---|---|---|
| Xem chi tiết | Luôn hiển thị | Mở trang chi tiết |
| Sửa | PROPOSED/REJECTED + cùng đơn vị; APPROVED + Cấp Cục | Mở form sửa (F-045) |
| Xóa | PROPOSED + (cùng đơn vị hoặc Cấp Cục) | Mở popup xác nhận → DELETE (F-046) |
| Gửi phê duyệt | PROPOSED/REJECTED + cùng đơn vị | Gửi yêu cầu duyệt (F-047) |
| Phê duyệt | PROPOSED + Cấp Cục | Phê duyệt trực tiếp (F-047) |
| Lịch sử | Luôn hiển thị | Mở lịch sử (F-049) |

---

## 10. Yêu cầu phi chức năng

- Tải danh sách lần đầu ≤ 1 giây (20 bản ghi)
- Áp dụng bộ lọc/tìm kiếm ≤ 500ms
- Responsive: mobile chuyển bảng thành dạng card
- Loading skeleton, empty state "Không tìm thấy công trình nào phù hợp"
- Tuân thủ WCAG 2.1 AA

---

## 11. Yêu cầu giao diện

### 11.1. Bố cục

Dùng chung bố cục hệ thống: sidebar 272px (#12468C), header 64px, nền #eaf0f6.

### 11.2. Màu badge trạng thái

| Trạng thái | Màu |
|---|---|
| PROPOSED (Chờ duyệt) | #FAAD14 (vàng) |
| UNDER_REVIEW (Đang duyệt) | #1890FF (xanh dương) |
| APPROVED (Đã duyệt) | #52C41A (xanh lá) |
| REJECTED (Từ chối) | #FF4D4F (đỏ) |

### 11.3. Màn hình

1. **ScreenHeader:** breadcrumb "Quản lý KCHTGT Khu nước & VTS > Đê/kè" + nút "Tạo mới"
2. **FilterBar:** ô tìm kiếm nhanh + Tình trạng + Đơn vị QL + Thuộc cảng biển + Loại kết cấu công trình + Địa điểm (Tỉnh/TP) + Thời điểm đưa vào khai thác (year) + Ngày cập nhật (RangePicker từ-đến)
3. **StatusTabs:** Tất cả / Chờ duyệt / Đang duyệt / Đã duyệt / Từ chối
4. **DataTable:** sticky header, hover row, 14 cột (9.1), click dòng → chi tiết
5. **Pagination:** 20/50/100 dòng/trang

### 11.4. Mobile

- Sidebar → hamburger 80px
- Bảng → card
- FilterBar → panel gập/mở
- StatusTabs → dropdown
