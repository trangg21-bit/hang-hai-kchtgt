---
id: F-078
name: "Danh sách Cầu cảng"
slug: ui-ql-cc-danh-sach
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:25Z"
last-updated: "2026-07-30"
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Danh sách Cầu cảng

**Tài liệu:** BA Feature Brief
**Feature:** F-078
**Module:** M-002 — Quản lý tài sản KCHTGT Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-30

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Giao diện danh sách Cầu cảng hiển thị toàn bộ các cầu cảng thuộc phạm vi quản lý của người dùng, kèm khả năng tìm kiếm nhanh, lọc theo nhiều tiêu chí, phân trang và sắp xếp. Đây là màn hình trung tâm của module Cầu cảng: từ đây người dùng điều hướng đến toàn bộ các thao tác khác — xem chi tiết, tạo mới, chỉnh sửa, phê duyệt, xóa và xem lịch sử thay đổi. Nghiệp vụ tham khảo từ màn hình QLKC_040 (Quản lý cầu cảng) của hệ thống tham chiếu, đối chiếu và số hóa lại trên nền tảng quản lý tài sản KCHTGT hiện tại. Nguồn: TKCT UC 12.

### 1.2. Tại sao cần tính năng này?

Cầu cảng là hạ tầng then chốt trực tiếp tiếp nhận tàu. Cán bộ quản lý tài sản và lãnh đạo cần một giao diện duy nhất để nắm bắt nhanh chóng cầu cảng nào đang hoạt động, cầu cảng nào đang chờ phê duyệt, và cầu cảng nào cần xử lý gấp — từ đó hỗ trợ ra quyết định vận hành, phân bổ nguồn lực và giám sát tuân thủ quy trình phê duyệt theo quy định quản lý nhà nước về hàng hải.

### 1.3. Luồng hoạt động chính

1. Người dùng vào menu **Quản lý KCHT Hàng Hải > Quản lý cầu cảng**, hệ thống hiển thị danh sách cầu cảng thuộc đơn vị mình.
2. Người dùng tìm kiếm nhanh, chọn bộ lọc hoặc chuyển tab trạng thái để thu hẹp danh sách theo nhu cầu.
3. Người dùng chọn một dòng để xem chi tiết, chỉnh sửa, xóa, phê duyệt hoặc xem lịch sử, tùy theo quyền và trạng thái của cầu cảng đó.
4. Giao diện hỗ trợ điều hướng bàn phím: Tab để di chuyển giữa các trường lọc/hàng dữ liệu, Enter để kích hoạt hành động đang được focus.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (tại tính năng phân quyền). Danh sách luôn được lọc theo `donViQuanLy` của người dùng đăng nhập — người dùng không thấy cầu cảng ngoài phạm vi đơn vị mình, trừ Admin Cục.

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

- **US-078-01:** Là Quản lý tài sản, tôi muốn xem toàn bộ danh sách Cầu cảng thuộc đơn vị mình để nắm được hiện trạng tài sản.
- **US-078-02:** Là Quản lý tài sản, tôi muốn tìm kiếm nhanh theo mã hoặc tên cầu cảng để tra cứu một bản ghi cụ thể mà không cần cuộn qua toàn bộ danh sách.
- **US-078-03:** Là Quản lý tài sản, tôi muốn lọc theo Cảng biển, Bến cảng và tình trạng để thu hẹp danh sách theo nhu cầu công việc.
- **US-078-04:** Là Lãnh đạo, tôi muốn thấy ngay các cầu cảng đang "Chờ phê duyệt" qua tab trạng thái để xử lý phê duyệt kịp thời.
- **US-078-05:** Là người dùng bất kỳ, tôi muốn click vào một dòng để xem chi tiết cầu cảng đó.

### Mức Should (nên có)

- **US-078-06:** Là Quản lý tài sản, tôi muốn chuyển đến màn hình chỉnh sửa hoặc xóa trực tiếp từ danh sách để không phải qua trang chi tiết trước.
- **US-078-07:** Là Quản lý tài sản, tôi muốn xem lịch sử thay đổi của một cầu cảng ngay từ danh sách.
- **US-078-08:** Là người dùng, tôi muốn đổi số bản ghi hiển thị mỗi trang (20/100) và đổi hướng sắp xếp theo nhu cầu.

### Mức Could (có thể có sau)

- **US-078-09:** Là người dùng, tôi muốn điều hướng toàn bộ danh sách chỉ bằng bàn phím (Tab/Enter) mà không cần dùng chuột.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-078-01 — Hiển thị danh sách mặc định:** Khi mở màn hình, hệ thống gọi `GET /api/v1/cau-cang?page=1&pageSize=20&sortBy=updatedAt&sortOrder=DESC` giới hạn theo `donViQuanLy` của người dùng, và hiển thị tối đa 20 bản ghi/trang. Nếu API lỗi, hiển thị cảnh báo đỏ kèm nút "Thử lại".

**AC-078-02 — Phân trang tùy chọn:** Người dùng chọn 20 hoặc 100 bản ghi/trang từ dropdown; bảng tải lại đúng số lượng đã chọn và giữ nguyên các bộ lọc đang áp dụng.

**AC-078-03 — Tìm kiếm nhanh:** Người dùng nhập từ khóa vào ô tìm kiếm (khớp `maCau` hoặc `tenCau`, dạng substring, không phân biệt hoa/thường) và nhấn Enter hoặc chờ debounce 400ms; hệ thống hiển thị kết quả khớp trong vòng 500ms. Nếu không có kết quả, hiển thị trạng thái rỗng (mục 10.8).

**AC-078-04 — Lọc theo Cảng biển / Bến cảng (cascading):** Chọn "Thuộc cảng biển" sẽ lọc dropdown "Thuộc bến cảng" chỉ còn các Bến cảng con của Cảng biển đó và đã ở trạng thái `DUOC_PHE_DUYET`; nếu đổi Cảng biển, lựa chọn Bến cảng đang chọn bị reset. Nếu không chọn Cảng biển, dropdown Bến cảng hiển thị toàn bộ Bến cảng đã duyệt trong phạm vi đơn vị.

**AC-078-05 — Lọc theo Địa điểm:** Dropdown Địa điểm liệt kê các Tỉnh/Thành phố (danh mục `DM_DON_VI_HANH_CHINH`) đang có cầu cảng; chọn một giá trị sẽ lọc bảng chỉ còn cầu cảng thuộc địa điểm đó.

**AC-078-06 — Lọc theo tình trạng:** Dropdown "Tình trạng" gồm "Tất cả", "Hiện hành" (HIEN_HANH), "Tạm ngừng" (TAM_NGUNG). Chọn một giá trị lọc bảng tương ứng.

**AC-078-07 — Tab trạng thái phê duyệt:** 4 tab "Tất cả / Chờ phê duyệt / Đã phê duyệt / Từ chối" mỗi tab hiển thị số lượng bản ghi tương ứng; chuyển tab lọc lại danh sách theo `trangThaiPheDuyet` mà không mất các bộ lọc khác đang áp dụng.

**AC-078-08 — Cột hiển thị đầy đủ:** Mỗi dòng hiển thị đúng các cột mô tả tại mục 9.1: STT, Mã cầu cảng, Tên cầu cảng, Thuộc cảng biển, Thuộc bến cảng, Địa điểm, Kích thước (Chiều dài × Chiều rộng), Tình trạng, Trạng thái phê duyệt, Ngày cập nhật.

**AC-078-09 — Xem chi tiết:** Click vào mã hoặc tên cầu cảng (hoặc nút "Xem") điều hướng đến màn hình xem chi tiết cầu cảng với đúng `id`/`maCau` của dòng được chọn.

**AC-078-10 — Chỉnh sửa:** Nút "Chỉnh sửa" chỉ hiển thị cho Admin hoặc Quản lý tài sản thuộc đúng `donViQuanLy` với cầu cảng; click điều hướng đến màn hình chỉnh sửa với form được điền sẵn dữ liệu.

**AC-078-11 — Xóa:** Nút "Xóa" chỉ hiển thị khi `trangThaiPheDuyet = CHO_PHE_DUYET` và cầu cảng chưa được gửi phê duyệt; click mở hộp thoại xác nhận trước khi gọi `DELETE /api/v1/cau-cang/:id`. Nếu cầu cảng đang có dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố), hệ thống chặn xóa và hiển thị cảnh báo.

**AC-078-12 — Phê duyệt:** Nút "Phê duyệt" chỉ hiển thị cho Lãnh đạo/Admin khi `trangThaiPheDuyet = CHO_PHE_DUYET`; click điều hướng đến màn hình phê duyệt.

**AC-078-13 — Lịch sử:** Nút "Lịch sử" luôn hiển thị cho mọi vai trò có quyền xem; click điều hướng đến màn hình lịch sử thay đổi của cầu cảng được chọn.

**AC-078-14 — Cầu cảng đã xóa không hiển thị:** Cầu cảng có `deletedAt != null` không xuất hiện trong danh sách chính ở bất kỳ bộ lọc nào (chỉ có thể tra cứu lại qua màn hình Lịch sử).

**AC-078-15 — Điều hướng bàn phím:** Phím Tab di chuyển focus tuần tự qua: ô tìm kiếm → các dropdown lọc → tab trạng thái → các hàng dữ liệu → các nút hành động trên hàng đang focus → phân trang. Phím Enter kích hoạt phần tử đang focus.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

**BR-078-01 — Phân trang mặc định:** Danh sách hiển thị mặc định 20 bản ghi/trang, có thể đổi sang 100 bản ghi/trang. Không hỗ trợ hiển thị "tất cả" trong một trang.

**BR-078-02 — Sắp xếp mặc định:** Danh sách sắp xếp mặc định theo `updatedAt` giảm dần (bản ghi thay đổi gần nhất lên đầu). Người dùng có thể đổi hướng sắp xếp nhưng không đổi được cột sắp xếp.

**BR-078-03 — Phạm vi dữ liệu theo đơn vị quản lý:** Người dùng chỉ thấy cầu cảng thuộc `donViQuanLy` của mình. Admin Cục xem được toàn bộ hệ thống và có thể chọn lọc theo đơn vị bất kỳ (mục 2.2).

**BR-078-04 — Tìm kiếm khớp trên nhiều trường:** Từ khóa tìm kiếm được áp dụng đồng thời trên `maCau` và `tenCau` theo kiểu OR — trả về bản ghi khớp ở bất kỳ trường nào.

**BR-078-05 — Lọc theo bến cảng phụ thuộc cảng biển:** Dropdown "Thuộc bến cảng" luôn được lọc theo "Thuộc cảng biển" đã chọn (nếu có) và chỉ hiển thị Bến cảng ở trạng thái `DUOC_PHE_DUYET`, phản ánh đúng thứ tự phân cấp Cảng biển → Bến cảng → Cầu cảng.

**BR-078-06 — Ẩn dữ liệu đã xóa:** Cầu cảng có `deletedAt != null` bị loại khỏi mọi truy vấn danh sách, không phân biệt bộ lọc đang áp dụng.

**BR-078-07 — Điều kiện hiển thị nút Xóa:** Nút "Xóa" chỉ hiển thị khi đồng thời: (1) `trangThaiPheDuyet = CHO_PHE_DUYET` và chưa gửi phê duyệt, (2) người dùng thuộc đúng `donViQuanLy` hoặc có vai trò Admin/Lãnh đạo. Cầu cảng đã gửi duyệt, đã duyệt hoặc bị từ chối không hiển thị nút Xóa.

**BR-078-08 — Điều kiện hiển thị nút Phê duyệt:** Nút "Phê duyệt" chỉ hiển thị cho vai trò Lãnh đạo hoặc Admin, và chỉ khi `trangThaiPheDuyet = CHO_PHE_DUYET`.

**BR-078-09 — Điều kiện hiển thị nút Chỉnh sửa:** Nút "Chỉnh sửa" hiển thị cho Admin hoặc Quản lý tài sản thuộc đúng đơn vị quản lý với cầu cảng, ở mọi trạng thái phê duyệt (kể cả `DUOC_PHE_DUYET`) — vì sửa một cầu cảng đã duyệt sẽ đưa nó quay về `CHO_PHE_DUYET`.

**BR-078-10 — Điều hướng bàn phím bắt buộc:** Toàn bộ thao tác trên màn hình (lọc, chọn dòng, kích hoạt hành động) phải thực hiện được bằng Tab/Enter, không phụ thuộc chuột, để đáp ứng WCAG 2.1 AA.

---

## 6. Vòng đời và liên kết với các tính năng khác

> ⚠ **QUAN TRỌNG CHO DEVELOPER:** Danh sách Cầu cảng là **màn hình trung tâm** của module Cầu cảng — mọi tính năng khác trong nhóm đều xuất phát từ hoặc quay trở lại danh sách này. Dưới đây là vòng đời cầu cảng và các tính năng liên quan cần nắm khi phát triển.

### 6.1. Vòng đời cầu cảng

```mermaid
stateDiagram-v2
    [*] --> LUU_TAM: Tạo mới (lưu tạm)
    LUU_TAM --> CHO_PHE_DUYET: Gửi phê duyệt
    CHO_PHE_DUYET --> DUOC_PHE_DUYET: Phê duyệt
    CHO_PHE_DUYET --> TU_CHOI: Từ chối
    LUU_TAM --> DA_XOA: Xóa (chỉ khi chưa gửi duyệt)
    TU_CHOI --> CHO_PHE_DUYET: Sửa & gửi lại
    DUOC_PHE_DUYET --> CHO_PHE_DUYET: Sửa (cần duyệt lại)

    state DUOC_PHE_DUYET {
        [*] --> SU_DUNG: Cầu cảng được duyệt
        SU_DUNG --> GAN_TAI_SAN: Gắn tài sản (module khác)
        SU_DUNG --> VAN_HANH: Vận hành / Bảo trì (module khác)
        SU_DUNG --> BAO_CAO: Báo cáo thống kê
    }
```

### 6.2. Trạng thái hiển thị trên danh sách

| Trạng thái | Mã | Badge màu | Xuất hiện trong danh sách? |
|---|---|---|---|
| Lưu tạm | CHO_PHE_DUYET (chưa gửi duyệt) | Xám | ✅ Có |
| Chờ phê duyệt | CHO_PHE_DUYET (đã gửi duyệt) | Vàng | ✅ Có |
| Đã phê duyệt | DUOC_PHE_DUYET | Xanh dương | ✅ Có |
| Từ chối | TU_CHOI | Đỏ | ✅ Có |
| Đã xóa | DA_XOA (`deletedAt != null`) | — | ❌ Không (chỉ xem lại qua màn hình Lịch sử) |

### 6.3. Các tính năng liên quan trực tiếp

| Tên tính năng | Mối liên kết với Danh sách Cầu cảng |
|---|---|
| Xem chi tiết Cầu cảng | Click mã/tên hoặc nút "Xem" từ danh sách để mở |
| Tạo mới Cầu cảng | Nút "Tạo mới" trên thanh công cụ của danh sách; sau khi tạo xong quay lại danh sách |
| Cập nhật Cầu cảng | Nút "Chỉnh sửa" trên mỗi dòng; chỉ hiện theo BR-078-09 |
| Phê duyệt Cầu cảng | Nút "Phê duyệt" trên mỗi dòng; chỉ hiện theo BR-078-08 |
| Xóa Cầu cảng | Nút "Xóa" trên mỗi dòng; chỉ hiện theo BR-078-07 |
| Lịch sử Cầu cảng | Nút "Lịch sử" trên mỗi dòng, luôn hiển thị |

### 6.4. Module tham chiếu ngược (cầu cảng là con)

Cầu cảng luôn thuộc về một Bến cảng, Bến cảng thuộc về một Cảng biển. Bộ lọc "Thuộc cảng biển" / "Thuộc bến cảng" phản ánh đúng thứ tự phân cấp bắt buộc này:

```markmap
- Cảng biển (CB)
  - Bến cảng (BC) — phải có CB cha đã duyệt
    - Cầu cảng (CC) — phải có BC cha đã duyệt, hiển thị trong danh sách
```

---

## 7. Mô hình dữ liệu

Tính năng này chỉ đọc dữ liệu (read-only), không tạo hay sửa bảng. Các bảng được truy vấn để phục vụ hiển thị danh sách và bộ lọc:

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **trường mới cần thêm** vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = **trường không cần thiết**, cần loại bỏ khỏi bảng.
> - Các trường không được đánh dấu là các trường hiện có, được giữ nguyên.

### 7.1. Bảng CauCang — Thông tin Cầu cảng

Các trường được truy vấn để hiển thị trên bảng danh sách và phục vụ bộ lọc:

- **id:** UUID, định danh bản ghi
- **maCau:** chuỗi 6-10 ký tự, duy nhất toàn hệ thống — hiển thị cột "Mã cầu cảng"
- **tenCau:** tên cầu cảng — hiển thị cột "Tên cầu cảng", có thể click để mở màn hình xem chi tiết
- <span style="color:red;font-weight:bold">**donViQuanLy:** UUID, đơn vị quản lý — dùng để giới hạn phạm vi dữ liệu hiển thị</span>
- <span style="color:red;font-weight:bold">**cangBienId:** UUID, khóa ngoại đến CangBien — dùng cho cột "Thuộc cảng biển" và bộ lọc cascading</span>
- **benCangId:** UUID, khóa ngoại đến BenCang — dùng cho cột "Thuộc bến cảng"
- <span style="color:red;font-weight:bold">**diaDiem:** chuỗi, địa điểm (Tỉnh/Thành phố) — dùng cho cột và bộ lọc "Địa điểm"</span>
- **chieuDai:** số thập phân (mét) — hiển thị trong cột "Kích thước"
- **chieuRong:** số thập phân (mét) — hiển thị trong cột "Kích thước"
- **trangThaiHoatDong:** enum (HIEN_HANH, TAM_NGUNG) — badge cột "Tình trạng", dùng cho bộ lọc
- **trangThaiPheDuyet:** enum (CHO_PHE_DUYET, DUOC_PHE_DUYET, TU_CHOI) — badge cột "Trạng thái phê duyệt", dùng cho tab lọc
- **updatedAt:** timestamp — hiển thị cột "Ngày cập nhật", dùng làm khóa sắp xếp mặc định
- **deletedAt:** timestamp (nullable) — bản ghi có giá trị khác null bị loại khỏi mọi kết quả danh sách (BR-078-06)
- <span style="color:red;font-weight:bold">**createdBy, createdAt, updatedBy:** chỉ truy vấn và hiển thị bổ sung khi người dùng là Admin Cục (mục 2.2)</span>

### 7.2. Bảng CangBien — Cảng biển (JOIN)

Truy vấn JOIN qua `cangBienId` để lấy tên hiển thị ở cột "Thuộc cảng biển" và danh sách dropdown lọc (chỉ lấy Cảng biển ở trạng thái `DUOC_PHE_DUYET`).

### 7.3. Bảng BenCang — Bến cảng (JOIN)

Truy vấn JOIN qua `benCangId` để lấy tên hiển thị ở cột "Thuộc bến cảng" và danh sách dropdown lọc (chỉ lấy Bến cảng ở trạng thái `DUOC_PHE_DUYET`, lọc theo `cangBienId` đã chọn — BR-078-05).

---

## 8. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng:

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/cau-cang?page=&pageSize=&sortBy=&sortOrder=&search=&cangBienId=&benCangId=&diaDiem=&trangThaiHoatDong=&trangThaiPheDuyet=` | Lấy danh sách Cầu cảng có phân trang, sắp xếp, tìm kiếm và lọc, giới hạn theo đơn vị quản lý của người dùng | Tất cả người dùng đã đăng nhập |
| GET | `/api/v1/cang-bien?trangThaiHoatDong=HIEN_HANH&trangThaiPheDuyet=DUOC_PHE_DUYET` | Lấy danh sách Cảng biển đã duyệt cho dropdown lọc | Tất cả người dùng đã đăng nhập |
| GET | `/api/v1/ben-cang?cangBienId={id}&trangThaiPheDuyet=DUOC_PHE_DUYET` | Lấy danh sách Bến cảng đã duyệt, lọc theo Cảng biển, cho dropdown lọc | Tất cả người dùng đã đăng nhập |
| DELETE | `/api/v1/cau-cang/:id` | Xóa mềm cầu cảng — được gọi từ nút "Xóa" trên danh sách | Admin, Lãnh đạo hoặc Quản lý tài sản cùng đơn vị |

---

## 9. Chi tiết nghiệp vụ từng phần

### 9.1. Cột hiển thị trên bảng danh sách

| STT | Cột | Nguồn dữ liệu | Loại hiển thị | Ghi chú |
|---|---|---|---|---|
| 1 | STT | Tự động đánh số theo trang | Text | |
| 2 | Mã cầu cảng | `maCau` | Text, click để mở màn hình xem chi tiết | |
| 3 | Tên cầu cảng | `tenCau` | Text, click để mở màn hình xem chi tiết | |
| 4 | Thuộc cảng biển | `cangBienId` → `CangBien.ten` | Text | Ẩn trên mobile (xem tại card chi tiết) |
| 5 | Thuộc bến cảng | `benCangId` → `BenCang.ten` | Text | |
| 6 | Địa điểm | `diaDiem` | Text | Tên Tỉnh/Thành phố |
| 7 | Kích thước | `chieuDai` × `chieuRong` | Text (m) | Định dạng "150.5 × 20.0 m" |
| 8 | Tình trạng | `trangThaiHoatDong` | Badge | Xanh lá: HIEN_HANH; Cam: TAM_NGUNG |
| 9 | Trạng thái phê duyệt | `trangThaiPheDuyet` | Badge | Vàng: CHO_PHE_DUYET; Xanh dương: DUOC_PHE_DUYET; Đỏ: TU_CHOI |
| 10 | Ngày cập nhật | `updatedAt` | Text (dd/MM/yyyy HH:mm) | Khóa sắp xếp mặc định |
| 11 | Thao tác | — | Nhóm nút | Xem tại mục 9.3 |

### 9.2. Bộ lọc và tìm kiếm

| Field | Loại điều khiển | Mô tả |
|---|---|---|
| Tìm kiếm nhanh | Input (debounce 400ms) | Tìm theo `maCau` hoặc `tenCau`, khớp substring không phân biệt hoa/thường |
| Thuộc cảng biển | Select (SelectKcht — chỉ CB đã duyệt) | Lọc theo `cangBienId`; đổi giá trị sẽ reset bộ lọc Bến cảng |
| Thuộc bến cảng | Select (SelectKcht — chỉ BC đã duyệt, lọc theo Cảng biển đã chọn) | Lọc theo `benCangId` |
| Địa điểm | Select (danh mục `DM_DON_VI_HANH_CHINH`) | Lọc theo `diaDiem` |
| Tình trạng | Select | Tất cả / Hiện hành (HIEN_HANH) / Tạm ngừng (TAM_NGUNG) |
| Tab trạng thái phê duyệt | StatusTabs (4 tab, có đếm số lượng) | Tất cả / Chờ phê duyệt / Đã phê duyệt / Từ chối |
| Đơn vị quản lý | Select (SelectOrgCode) — chỉ hiển thị/thao tác được cho Admin Cục | Người dùng thường bị khóa cố định = đơn vị của mình |

### 9.3. Hành động trên mỗi dòng

| Nút | Điều kiện hiển thị | Hành động |
|---|---|---|
| Xem chi tiết | Luôn hiển thị | Điều hướng đến màn hình xem chi tiết với `id`/`maCau` |
| Chỉnh sửa | Admin hoặc QLTS cùng `donViQuanLy` (BR-078-09) | Điều hướng đến màn hình chỉnh sửa, form điền sẵn dữ liệu |
| Xóa | `trangThaiPheDuyet = CHO_PHE_DUYET` và chưa gửi duyệt (BR-078-07) | Mở hộp thoại xác nhận → `DELETE /api/v1/cau-cang/:id` |
| Phê duyệt | Lãnh đạo/Admin và `trangThaiPheDuyet = CHO_PHE_DUYET` (BR-078-08) | Điều hướng đến màn hình phê duyệt |
| Lịch sử | Luôn hiển thị | Điều hướng đến màn hình lịch sử thay đổi |

### 9.4. Phân trang và sắp xếp

- Mặc định: trang 1, 20 bản ghi/trang, sắp xếp `updatedAt` giảm dần.
- Người dùng có thể đổi số bản ghi/trang (20 hoặc 100) — lựa chọn được giữ nguyên khi chuyển trang hoặc đổi bộ lọc.
- Đổi hướng sắp xếp (tăng/giảm) trên cột `updatedAt` bằng cách click tiêu đề cột.

---

## 10. Yêu cầu phi chức năng

### 10.1. Hiệu năng

- Thời gian tải danh sách lần đầu (20 bản ghi) ≤ 1 giây.
- Thời gian phản hồi khi áp dụng bộ lọc hoặc tìm kiếm ≤ 500ms.
- Dropdown cascading (Cảng biển → Bến cảng) phản hồi ≤ 300ms khi đổi lựa chọn.

### 10.2. Khả năng mở rộng

- Cấu trúc bộ lọc cho phép bổ sung thêm tiêu chí lọc (VD: theo loại kết cấu, tình trạng) mà không thay đổi API hiện có.
- Sẵn sàng bổ sung export Excel/PDF trong tương lai (hiện ngoài phạm vi — mục Out of Scope trước đây).

### 10.3. Bảo mật

- Phân quyền RBAC được áp dụng trên tất cả các API liên quan đến tính năng.
- Mọi request phải kèm JWT token hợp lệ.
- Dữ liệu được lọc theo `donViQuanLy` của người dùng ở tầng backend, không phụ thuộc vào tham số gửi từ client.
- Các nút Chỉnh sửa/Xóa/Phê duyệt chỉ hiển thị và chỉ được backend chấp nhận khi đúng vai trò và đúng phạm vi đơn vị.

### 10.4. Độ tin cậy

- Dữ liệu danh sách được làm mới sau mỗi thao tác Xóa/Phê duyệt/Chỉnh sửa thành công để tránh hiển thị trạng thái cũ.
- Cầu cảng đã xóa mềm không bao giờ xuất hiện lại trong danh sách chính (BR-078-06).

### 10.5. Trải nghiệm người dùng

- Giao diện responsive: trên điện thoại (dưới 768px), thanh menu thu gọn.
- Có loading skeleton khi đang tải dữ liệu.
- Có trạng thái rỗng (empty state) với hướng dẫn thân thiện khi không có kết quả tìm kiếm/lọc.
- Tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA.

### 10.6. Tuân thủ pháp lý

- Mã cầu cảng hiển thị tuân thủ chuẩn mã hóa VN-614 theo quy định của Cục Hàng hải Việt Nam.
- Dữ liệu tuân thủ Thông tư 48/2017/TT-BGTVT.

---

## 11. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 11.1. Bố cục chung

Màn hình Danh sách Cầu cảng dùng chung bố cục toàn hệ thống, bao gồm:

- **Thanh menu trái (sidebar):** rộng 272px, nền màu xanh dương đậm `#12468C`. Mục đang chọn được tô màu xanh sáng `#1B84FF`. Khi thu gọn (trên điện thoại), rộng còn 80px và chuyển thành nút hamburger.
- **Thanh tiêu đề trên cùng (header):** cao 64px, nền trắng, chứa tên người dùng và avatar.
- **Vùng nội dung chính:** nền xám nhạt pha xanh `#eaf0f6`, giúp các card trắng bên trong nổi bật hơn.

### 11.2. Hệ thống màu sắc

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

### 11.3. Thang số — chỉ dùng giá trị cho phép

**Khoảng cách (spacing):** 4px, 8px, 12px, 16px, 24px, 32px. Trong đó 12px là khoảng cách mặc định giữa các trường trong form (`spaceFormField`), 16px là padding mặc định của card (`spaceMd`).

**Bo góc (radius):** 4px (cho ô textarea), 8px, 12px (cho card), 999px (dạng pill — dùng cho input, select, button).

**Cỡ chữ (font size):** 10px (metadata, caption), 13px (nhãn, nội dung), 15px (tiêu đề card, tiêu đề section), 18px (tiêu đề trang).

**Độ đậm chữ (font weight):** 400 (nội dung), 500 (nhãn, nút), 600 (số liệu quan trọng, tiêu đề).

**Font chữ:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` cho toàn bộ văn bản.

> **Cấm tuyệt đối:** spacing 6, 10, 14, 18; radius 6, 7, 10; font-size 12, 14, 16, 24.

### 11.4. Style có sẵn — dùng lại, đừng tự chế

Hệ thống đã định nghĩa sẵn các kiểu dáng phổ biến. Khi cần hiển thị:

- **Thời gian, caption:** dùng `metaStyle` (chữ nhỏ 10px, màu xám nhạt, weight 400)
- **Card nội dung:** dùng `cardStyle` (nền trắng, viền 0.5px, bo góc 12px, padding 16px)
- **Tag trạng thái:** dùng `badgeBaseStyle` (chữ nhỏ, weight 500, padding 2px-8px, pill)
- **Link, nút text:** dùng `actionStyle` (pill, màu actionPrimary, weight 500)
- **Đường kẻ ngăn cách:** dùng `dividerStyle`

### 11.5. Giới hạn màu nhấn — tối đa 3 lần mỗi màn

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình Danh sách Cầu cảng:

1. Nút "Tạo mới" (hành động chính trên thanh công cụ)
2. Đường gạch chân của tab trạng thái đang chọn (StatusTabs)
3. Link "Xem chi tiết" trên mã/tên cầu cảng

Các màu trạng thái (xanh lá cho thành công, vàng cho cảnh báo, đỏ cho lỗi) và màu chữ không tính vào giới hạn này.

### 11.6. Màn hình Danh sách Cầu cảng

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** hiển thị đường dẫn breadcrumb "Quản lý KCHT Hàng Hải > Quản lý cầu cảng", kèm nút "Tạo mới" ở góc phải.

2. **FilterBar:** thanh lọc nằm ngang phía trên bảng, gồm: ô tìm kiếm nhanh (maCau/tenCau), dropdown "Thuộc cảng biển", dropdown "Thuộc bến cảng" (cascading), dropdown "Địa điểm", dropdown "Tình trạng", và dropdown "Đơn vị quản lý" (chỉ Admin Cục thao tác được).

3. **StatusTabs:** 4 tab nằm ngang: "Tất cả", "Chờ phê duyệt", "Đã phê duyệt", "Từ chối". Mỗi tab hiển thị số lượng bản ghi trong nhóm đó. Tab đang chọn có đường gạch chân màu `actionPrimary`.

4. **DataTable:** bảng dữ liệu với tiêu đề cột cố định khi cuộn (sticky header), dòng được tô sáng khi di chuột qua (hover row). Các cột hiển thị:

| Cột | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Ghi chú |
|---|---|---|---|---|---|---|
| STT | Số thứ tự dòng | Text (tự động) | Không | Có | Tự động đánh số | |
| Mã cầu cảng | `maCau` | Text (link) | Không | Có | — | Click mở màn hình xem chi tiết |
| Tên cầu cảng | `tenCau` | Text (link) | Không | Có | — | Click mở màn hình xem chi tiết |
| Thuộc cảng biển | Tên `CangBien` | Text | Không | Có | — | Ẩn trên mobile |
| Thuộc bến cảng | Tên `BenCang` | Text | Không | Có | — | |
| Địa điểm | `diaDiem` | Text | Không | Không | — | |
| Kích thước | `chieuDai` × `chieuRong` | Text | Không | Không | — | Đơn vị mét |
| Tình trạng | `trangThaiHoatDong` | Badge | Không | Có | — | Xanh lá/Cam |
| Trạng thái phê duyệt | `trangThaiPheDuyet` | Badge | Không | Có | — | Vàng/Xanh dương/Đỏ |
| Ngày cập nhật | `updatedAt` | Text | Không | Có | — | Khóa sắp xếp mặc định |
| Thao tác | Nhóm nút | Button group | Không | Có | — | Xem/Sửa/Xóa/Phê duyệt/Lịch sử theo phân quyền |

5. **Pagination:** thanh điều hướng trang ở cuối bảng, hiển thị tổng số dòng, số trang, và dropdown chọn số bản ghi/trang (20/100).

### 11.7. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị spinner của Ant Design hoặc khung xương (skeleton) — không hiển thị bảng trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng và dòng chữ "Không tìm thấy cầu cảng nào phù hợp" với màu chữ `textSecondary` và cỡ chữ `fontSizeMd`, kèm gợi ý "Thử điều chỉnh bộ lọc hoặc tạo mới cầu cảng".
- **Lỗi tải dữ liệu:** hiển thị cảnh báo đỏ và nút "Thử lại" màu `actionPrimary`.

### 11.8. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| Quản lý tài sản (cùng đơn vị) | Danh sách của đơn vị mình; nút Xem, Chỉnh sửa, Xóa (khi đủ điều kiện), Lịch sử | Không thấy nút Phê duyệt |
| Lãnh đạo | Danh sách của đơn vị mình; nút Xem, Phê duyệt (khi Chờ phê duyệt), Lịch sử | Mặc định không có nút Chỉnh sửa/Xóa trừ khi kiêm nhiệm Quản lý tài sản |
| Admin | Danh sách của đơn vị mình; đầy đủ mọi nút hành động | |
| Admin Cục | Toàn bộ danh sách trên hệ thống, không giới hạn đơn vị; thêm dropdown lọc theo đơn vị; thêm thông tin người tạo/người sửa/thời gian tạo/thời gian cập nhật | Logic đặc biệt (mục 2.2) |

### 11.9. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger 80px.
- Bảng dữ liệu chuyển thành dạng thẻ (card): mỗi cầu cảng là một card hiển thị Mã, Tên, Bến cảng cha, hai badge trạng thái, và nhóm nút hành động thu gọn trong menu "...".
- Thanh lọc (FilterBar) chuyển thành panel có thể gập/mở.
- StatusTabs chuyển thành dropdown chọn trạng thái để tiết kiệm không gian ngang.
- Modal xác nhận xóa thu nhỏ còn 90% chiều rộng màn hình.
