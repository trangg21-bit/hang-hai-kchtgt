---
module-id: M-001
module-name: Quản trị hệ thống
document: base-pattern
version: 3.5
last-updated: 2026-08-17
---

# M-001: Quản trị hệ thống — Tài liệu nền dùng chung

## Tài liệu này dùng để làm gì?

Phân hệ Quản trị hệ thống có 6 chức năng. Giữa chúng có nhiều quy định được **lặp lại** (cách làm màn hình, cách phân quyền, cách ghi lịch sử...).

**Phần chung ở đây = những quy định được nhiều chức năng trong module dùng lại** — xác định bằng cách **so sánh các chức năng với nhau** (cái gì lặp lại ở 2+ chức năng thì gom vào đây), không phải khái niệm trừu tượng.

Tài liệu này gom phần chung đó vào **một chỗ**, để mỗi chức năng chỉ cần một tài liệu ngắn ghi **phần riêng của nó** — không phải viết lại những thứ giống nhau 6 lần.

## Ai cần đọc?

| Người đọc | Đọc phần nào |
|---|---|
| Người quản lý, người review | Mục 1 đến 3 — để hiểu phân hệ quy định gì |
| Người viết tài liệu (BA) | Cả tài liệu, đặc biệt mục 4 |
| Người lập trình (dev) | **Mục 3 trước khi code** — đây là quy tắc nghiệp vụ bắt buộc phải làm đúng |

---

## 1. Sáu chức năng của phân hệ

> **Phạm vi áp dụng:** tài liệu này là khung cho các chức năng **quản lý dạng CRUD** (danh sách + thêm/sửa/xóa + trạng thái). Chức năng **ngoài dạng này** (vd: log chỉ xem, chức năng có quy trình phê duyệt riêng, tích hợp bên ngoài) **vẫn dùng** các quy tắc chung ở mục 3 (phân quyền, trạng thái, lịch sử thay đổi); phần đặc thù của chúng nằm trong tài liệu của chính chức năng đó.

| Chức năng | Làm gì | Có gì đặc biệt |
|---|---|---|
| Quản lý tài khoản | Tạo tài khoản, khóa/mở khóa, duyệt tài khoản đăng ký | **Có bước phê duyệt** tài khoản đăng ký; gán quyền riêng qua màn **Quản lý tài khoản** |
| Quản lý nhóm người dùng | Tạo nhóm, gán quyền cho nhóm, thêm thành viên vào nhóm, khóa nhóm | Không |
| Quản lý đơn vị | Quản lý đơn vị theo cây cha-con | Không |
| Quản lý kết nối liên thông | Nhật ký hoạt động chia sẻ/tích hợp dữ liệu | Chỉ xem, không tạo/sửa/xóa |
| Quản lý log truy cập | Xem nhật ký hoạt động của hệ thống | Chỉ xem, không tạo/sửa/xóa |
| Quản lý biểu tượng bản đồ | Quản lý danh mục biểu tượng dùng cho bản đồ | Không |

## 2. Quy định chung — đọc thêm ở 3 chỗ này

Đây là quy định chung **của toàn bộ hệ thống** (không riêng phân hệ này), đã có sẵn, không chép lại ở đây — chỉ cần biết chỗ nào chứa gì:

| Chỗ đọc | Chứa gì | Dùng khi nào |
|---|---|---|
| `docs/conventions/` (3 file: list-screen-ui-standard, form-and-list-patterns, management-screen-ui-standard) | Cách dựng màn danh sách, form, cửa sổ: dùng 5 phần dùng chung (ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination), kích thước chuẩn (nút tròn, cao 40px, khoảng cách 12px) | Khi làm hoặc kiểm tra bất kỳ màn hình nào |
| `frontend/src/theme.ts` và `frontend/src/tokens.ts` | Toàn bộ màu sắc, khoảng cách, cỡ chữ đã định sẵn. **Cấm** ghi thẳng giá trị (ví dụ cấm viết màu `#12468C` vào code) | Khi viết giao diện — lấy màu từ đây |
| `AGENTS.md` mục "Permission Registration for New Modules" | Mô hình phân quyền **động theo nhóm người dùng và từng tài khoản** (xem mục 3.2); quy định **Admin Cục** xem thêm AGENTS.md mục "Feature Brief Template Convention" | Khi cần hiểu mô hình phân quyền hoặc quyền Admin Cục |

## 3. Quy tắc nghiệp vụ chung của phân hệ (đọc kỹ trước khi làm)

**3.1. Tài khoản**
- Các quy tắc nghiệp vụ của tài khoản (2 luồng tạo, khóa/mở khóa, đăng ký + phê duyệt, email duy nhất...) là **phần riêng của chức năng Quản lý tài khoản** — không lặp lại ở đây, xem feature-brief của chức năng đó. (Lưu ý: hệ thống **không có chức năng xóa tài khoản** — chỉ khóa để vô hiệu hóa.)
- Quy tắc chung duy nhất liên quan tài khoản: **quyền của một tài khoản = quyền gán riêng + quyền của các nhóm đang thuộc** (xem 3.2); quản trị viên gán quyền cho một nhóm qua màn **Phân quyền nhóm** và cho từng tài khoản qua màn **Quản lý tài khoản**.

**3.2. Phân quyền**
- Phân quyền theo **nhóm người dùng** và **từng tài khoản**: quản trị viên mở màn hình **Phân quyền nhóm** (F-002) để **tích chọn (checkbox)** quyền trên cây quyền cho một nhóm; gán quyền trực tiếp cho từng tài khoản qua màn **Quản lý tài khoản**.
- **Nhóm người dùng là động**: có thể thêm mới, sửa, xóa, đổi quyền bất kỳ lúc nào. Tài khoản thuộc nhóm nào thì có quyền của nhóm đó; tài khoản cũng có thể được gán thêm quyền riêng. **Quyền của một tài khoản = quyền gán riêng + quyền của các nhóm tài khoản đang thuộc.**
- Riêng các quyền đặc biệt `group:manage`, `admin:all`, `orgunit:scope_all`, `*` chỉ được gán **trực tiếp** cho tài khoản; nhóm **không thừa kế** được các quyền này (khớp `User.getAllPermissions()`).
- Tên quyền theo mẫu "việc:thao tác" (vd `navigationchannel:create` = quyền tạo luồng hàng hải). Máy chủ kiểm tra **từng thao tác** theo đúng quyền này — không có quyền thì bị chặn (lỗi 403), không phải chỉ ẩn nút ở màn hình.
- **Quyền mới phải được đăng ký** vào file đăng ký quyền của hệ thống (`PermissionSeeder.java`) thì mới xuất hiện trong cây quyền để tích chọn. Quên đăng ký thì không ai tích được quyền đó.
- Riêng tài khoản **quản trị hệ thống** (quyền đặc biệt ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN) được **vượt qua mọi kiểm tra quyền**.
- Riêng tài khoản **Admin Cục** được dùng **full quyền** — toàn bộ thao tác trong hệ thống — và được xem thêm thông tin nhạy cảm (người tạo, người sửa cuối, thời gian tạo/cập nhật) — xem 3.8.
- **Không còn vai trò cố định** — mô hình phân quyền cũ (gán quyền theo vai trò) đã được bỏ khỏi hệ thống; quyền được gán **động** qua nhóm/tài khoản như trên.
- **Ranh giới:** mục này mô tả **cơ chế chung** của toàn phân hệ; mỗi chức năng khai báo cụ thể ai được thao tác gì (bảng vai trò × thao tác) ở **mục 4** của tài liệu riêng.

**3.3. Đơn vị**
- Nghiệp vụ quản lý đơn vị (cấu trúc cây cha-con, phê duyệt đơn vị...) là **phần riêng của chức năng Quản lý đơn vị** — xem feature-brief của chức năng đó.
- Quy tắc **dùng chung** khi bất kỳ màn hình nào có trường/lọc đơn vị:
  - Chọn đơn vị phải dùng **danh sách dạng cây** (TreeSelect/Cascader), không dùng danh sách phẳng.
  - Màn hình chỉ gửi **mã đơn vị** (`orgUnitId`); việc giới hạn phạm vi dữ liệu theo đơn vị do máy chủ lo.
  - Tên đơn vị hiển thị do hệ thống tự nạp (`OrgUnitCacheService`) — màn hình không gọi thêm để đổi mã thành tên.

**3.4. Kết nối liên thông** — chỉ xem nhật ký hoạt động chia sẻ/tích hợp dữ liệu; không có thao tác tạo, sửa, xóa.

**3.5. Log truy cập** — chỉ xem và tra cứu, không có thao tác tạo, sửa, xóa.

**3.6. Biểu tượng bản đồ** — quản lý danh mục biểu tượng; các phân hệ khác lấy danh sách qua đường dẫn dùng chung.

**3.7. Trạng thái của bản ghi**
- Trạng thái lưu trong cơ sở dữ liệu dưới dạng **số** (không lưu chữ).
- Mỗi chức năng tự khai báo các trạng thái của nó trong tài liệu riêng (ví dụ tài khoản có: đang dùng / bị khóa).

**3.8. Lịch sử thay đổi (nhật ký thao tác)**
- Mọi thao tác thay đổi dữ liệu (tạo, sửa, khóa, xóa) phải ghi **ai làm, làm lúc nào**, và ghi vào sổ theo dõi lịch sử.
- Xóa là **xóa mềm**: đánh dấu đã xóa chứ không xóa hẳn khỏi cơ sở dữ liệu.
- Riêng tài khoản **Admin Cục** được dùng **full quyền** (xem 3.2) và được xem thêm: người tạo, người sửa cuối, thời gian tạo, thời gian cập nhật. Các tài khoản khác **không thấy** những thông tin này.

---

## 4. Mỗi chức năng có một tài liệu riêng — gồm các phần sau

> Cấu trúc chi tiết theo mẫu `docs/feature-brief-template.md` (khuôn BA điền). Tài liệu chức năng gồm: thông tin đầu file + 7 mục như dưới đây (mục 1 và 3 là thông tin mở đầu nằm ở khối tiêu đề của file; mục 8 gộp 2 mục "Phần kỹ thuật" 6–7 của mẫu):

1. **Tên và mã chức năng** (ví dụ: F-006 — Quản lý biểu tượng bản đồ)
2. **Mô tả ngắn**: chức năng này làm gì (3–5 dòng)
3. **Tham chiếu**: tài liệu này + tài liệu yêu cầu gốc của dự án (TKCT)
4. **Bảng trường dữ liệu**: tên trường, có bắt buộc không, kiểu, ràng buộc
5. **Trạng thái và phê duyệt**: theo mục 3.7 của tài liệu này; chức năng nào khác thì ghi rõ; chức năng nào có bước phê duyệt thì mô tả đầy đủ quy trình
6. **Quy tắc và phân quyền riêng**: chỉ ghi những quy tắc **chưa có** trong tài liệu này; chức năng nào có phân quyền cụ thể (ví dụ ai được tạo, ai được duyệt, ai được khóa) thì kèm **bảng vai trò × thao tác** ngay tại phần này — **bắt buộc kèm dòng khai báo Admin Cục** (có đặc biệt gì / không — mặc định theo mục 3.8 của tài liệu này)
7. **Điểm khác biệt so với mẫu chung** — *mục đích:* **mỗi feature-brief đều có bảng này, BA điền cho CHÍNH chức năng đang viết** (mỗi chức năng một bảng riêng). Mỗi dòng là một câu hỏi "chức năng này có đặc điểm X không" — trả lời **"có"** = dev phải xử lý thêm điều đó, trả lời **"không"** = không phải bận tâm. Người đọc nhìn bảng là biết ngay chức năng cần làm gì đặc biệt, không cần đọc cả tài liệu. Điền đủ 8 dòng, không bỏ trống:

| # | Điểm cần khai báo | Mặc định (không đặc biệt thì ghi gì) | Khai báo của chức năng này |
|---|---|---|---|
| 1 | Trạng thái riêng | Không có | |
| 2 | Có bước phê duyệt không | Không | |
| 3 | Có lọc theo cha-con / đơn vị không | Theo đơn vị | |
| 4 | Có trường chỉ hiện trong điều kiện nào không | Không | |
| 5 | Quyền riêng | Theo mẫu "việc:thao tác" | |
| 6 | Có đường dẫn dùng chung không cần đăng nhập không | Không | |
| 7 | Có tải lên tệp không | Không | |
| 8 | Giao diện có khác mẫu chung không | Không | |

**Ví dụ minh họa** (đã điền sẵn cho chức năng "Biểu tượng bản đồ" — chỉ để tham khảo cách điền, không phải nội dung của chức năng khác):

| # | Điểm cần khai báo | Mặc định | Khai báo của chức năng "Biểu tượng bản đồ" |
|---|---|---|---|
| 1 | Trạng thái riêng | Không có | Đang sử dụng / Không sử dụng |
| 2 | Có bước phê duyệt không | Không | Không |
| 3 | Có lọc theo cha-con / đơn vị không | Theo đơn vị | Không |
| 4 | Có trường chỉ hiện trong điều kiện nào không | Không | Không |
| 5 | Quyền riêng | Theo mẫu "việc:thao tác" | map:manage |
| 6 | Có đường dẫn dùng chung không cần đăng nhập không | Không | Có: lấy danh sách biểu tượng đang dùng |
| 7 | Có tải lên tệp không | Không | Có: ảnh biểu tượng |
| 8 | Giao diện có khác mẫu chung không | Không | Không |

8. **Phần kỹ thuật — BA đề xuất, SA chốt**: BA nêu sơ bộ chức năng sẽ gọi đường dẫn (API) nào, dùng bảng dữ liệu nào (🔴 trường mới / ~~trường bỏ~~), để người thiết kế kỹ thuật (SA) có cơ sở quyết định. Đây là **ý kiến đề xuất của BA, không phải quyết định cuối cùng** — SA chịu trách nhiệm chốt; khi review tài liệu **không bắt lỗi** phần này.

**Quy tắc quan trọng:** muốn thay đổi quy định chung ở mục 3 → **sửa tài liệu này trước**, rồi mới sửa tài liệu của từng chức năng — không để tài liệu chức năng mâu thuẫn với tài liệu này.

---

## 5. Tóm tắt

> Phân hệ Quản trị hệ thống có 6 chức năng. Phần giống nhau giữa chúng nằm gọn trong tài liệu này (mục 3). Mỗi chức năng chỉ cần một tài liệu ngắn ghi phần riêng, theo mẫu ở mục 4.
