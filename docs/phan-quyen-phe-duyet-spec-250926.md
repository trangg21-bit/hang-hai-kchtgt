# Đặc tả nghiệp vụ: Phân quyền & Quy trình phê duyệt hồ sơ KCHT hàng hải

> Bản tổng hợp 2026-09-25 — gom toàn bộ quyết định của cuộc họp rà soát rule phân quyền & quy trình phê duyệt (2026-09-24/25).
> Dùng chung cho BA / DEV / QA và tester thật (test manual). Mọi mục đều ghi rõ trạng thái: **CHỐT** (đã quyết, ghi kèm ngày) hoặc **CHỜ CHỐT** (đã nêu, chưa quyết).

## 1. Phạm vi luồng phê duyệt (CHỐT 2026-09-25)

| Luồng | Áp dụng cho | Cách chạy |
|---|---|---|
| **2 cấp** (mặc định) | Mọi loại KCHT và tài sản | Cảng vụ/Chi cục duyệt C1 → Cục duyệt C2 → Đã duyệt |
| **1 cấp** (ngoại lệ) | Chỉ **cảng cạn** | Duyệt 1 cấp → Đã duyệt, **không** trình Cục |

- **Chấp nhận rủi ro**: luồng 1 cấp và luồng Cục tự duyệt không có kiểm soát độc lập (chỉ 1 người vừa tạo vừa ký) — người phê duyệt **chịu trách nhiệm** với quyết định của mình.
- Hồ sơ chỉ được đưa vào báo cáo tổng hợp khi ở trạng thái **Đã duyệt**.

## 2. Mô hình phân quyền

- **Không có vai trò (Role)** — hệ thống dùng mô hình permission-based: mỗi quyền có mã `<resource>:<action>`, ví dụ `buoyberth:approvec2`, `transferarea:read`.
- **2 hình thức gán quyền**:
  - Gán **trực tiếp cho tài khoản** — màn Quản lý tài khoản (`UsersPage`, API `/users/{id}/permissions`).
  - Gán **qua nhóm người dùng** — màn Phân quyền nhóm (F-002).
  - Quyền hiệu lực = **hợp nhất** (union) của cả hai nguồn. Nhóm đổi quyền thì mọi thành viên đổi theo.
- **Quyền đặc biệt** chỉ gán trực tiếp cho tài khoản (nhóm không thừa kế): `admin:all`, `orgunit:scope_all`.
- **Bộ quyền chuẩn của mỗi loại tài sản**: mỗi loại tài sản KCHT (bến phao, khu neo đậu, khu chuyển tải, ...) có sẵn một bộ **9 quyền**, tương ứng 9 thao tác nghiệp vụ mà người dùng có thể được phép làm trên hồ sơ loại đó:

| Quyền (ví dụ với bến phao) | Người dùng được phép |
|---|---|
| `buoyberth:read` | Xem danh sách + chi tiết hồ sơ |
| `buoyberth:create` | Tạo mới hồ sơ |
| `buoyberth:update` | Sửa hồ sơ |
| `buoyberth:delete` | Xóa hồ sơ (chỉ được xóa khi hồ sơ đang Lưu tạm) |
| `buoyberth:approvec1` | Duyệt cấp 1 (Cảng vụ / Chi cục) |
| `buoyberth:rejectc1` | Từ chối cấp 1 (Cảng vụ / Chi cục) |
| `buoyberth:approvec2` | Duyệt cấp 2 (Cục) |
| `buoyberth:rejectc2` | Từ chối cấp 2 (Cục) |
| `buoyberth:history` | Xem lịch sử thay đổi của hồ sơ |

- **Hệ thống tự quản lý danh mục quyền — người dùng không cần thao tác gì**: mỗi lần khởi động, hệ thống tự kiểm tra danh mục quyền, **tự bổ sung quyền nào còn thiếu** và **tự xóa các quyền cũ không còn dùng** (khoảng 45 mã quyền thế hệ trước, ví dụ `user:edit`, `user:delete`, `group:manage`, `orgunit:manage`, `anchoragearea:...`). Bất kỳ tài liệu hoặc màn hình nào còn nhắc tới các mã quyền cũ này đều đã **lỗi thời** và cần cập nhật.

## 3. Quyền duyệt và quyền sửa (CHỐT 2026-09-24, bổ sung 2026-09-25)

| # | Rule |
|---|---|
| R1 | Quyền **duyệt** và quyền **sửa** là 2 quyền riêng, **không bao hàm nhau**. |
| R2 | Tài khoản có quyền duyệt thì khi phân quyền **bắt buộc cấp kèm quyền sửa**. Nếu cấu hình thiếu → tài khoản đó **không sửa và không duyệt lại được** hồ sơ Đã duyệt (cách xử lý duy nhất: cấp bổ sung quyền sửa cho chính tài khoản đó). |
| R3 | Tài khoản **chỉ có quyền sửa** (không có quyền duyệt): chỉ sửa được hồ sơ **Lưu tạm** và hồ sơ **bị trả về**; **KHÔNG sửa được hồ sơ Đã duyệt** — nút "Chỉnh sửa" phải ẩn, backend từ chối (403). |
| R4 | Muốn sửa hồ sơ **Đã duyệt**: phải có **quyền sửa + quyền duyệt** (duyệt C1 hoặc C2 **đều được**, không bắt buộc là cấp duyệt cuối). Kết quả tùy cấp duyệt của tài khoản: **(a)** có quyền duyệt C2 (Cục) → nút **"Lưu và phê duyệt"** → hồ sơ **giữ nguyên trạng thái Đã duyệt**, bản cũ ghi vào nhật ký thay đổi; **(b)** chỉ có quyền duyệt C1 (Cảng vụ/Chi cục), luồng 2 cấp → hồ sơ **quay lại luồng duyệt**: "Lưu và gửi phê duyệt" → **Chờ duyệt C1**, hoặc "Lưu và phê duyệt" (tự duyệt C1) → **Chờ duyệt C2** — trình cấp trên theo luồng 2 cấp bình thường, hồ sơ **không giữ nguyên Đã duyệt**; **(c)** luồng 1 cấp (cảng cạn) → C1 là cấp cuối, "Lưu và phê duyệt" → **giữ nguyên Đã duyệt**, không trình lại Cục. Bắt buộc chỉnh sửa ít nhất 1 trường thông tin thì mới cho phép Lưu và gửi phê duyệt / Lưu và phê duyệt  |
| R5 | **Cục sửa + duyệt lại** hồ sơ Đã duyệt → đơn vị Cảng vụ/Chi cục **xem được** sự thay đổi (qua lịch sử) nhưng **không có thông báo**. *(Cơ chế thông báo: CHỜ CHỐT — mục 7)* |

### 3.1. Bảng quyết định: ai sửa được hồ sơ theo trạng thái (cho tester)

| Trạng thái hồ sơ | Không có quyền sửa | Chỉ có quyền sửa | Quyền sửa + duyệt C1 | Quyền sửa + duyệt C2 (Cục) |
|---|---|---|---|---|
| Lưu tạm (DRAFT) | ❌ Không có nút sửa | ✅ Sửa được (kể cả bản của đồng nghiệp cùng đơn vị) | ✅ Sửa được | ✅ Sửa được |
| Bị Cảng vụ/Chi cục trả về | ❌ | ✅ Sửa + gửi lại → Chờ duyệt C1 | ✅ Sửa + gửi lại | ✅ Sửa + gửi lại → thẳng Chờ duyệt C2 (bỏ vòng 1) |
| Bị Cục trả về | ❌ | ✅ Sửa + gửi lại → Chờ duyệt C1 | ✅ Sửa + gửi lại | ✅ Sửa + gửi lại → thẳng Chờ duyệt C2 (bỏ vòng 1) |
| Chờ duyệt C1 | ❌ | ❌ | ❌ Đóng băng — chỉ thao tác duyệt/từ chối, không sửa | ❌ |
| Chờ duyệt C2 | ❌ | ❌ | ❌ | ❌ Đóng băng — chỉ thao tác duyệt/từ chối, không sửa |
| **Đã duyệt** — luồng 2 cấp | ❌ Không có nút sửa | ❌ **Không sửa được** (giống như không có quyền sửa) | ✅ Sửa được: "Lưu và gửi phê duyệt" → Chờ duyệt C1; "Lưu và phê duyệt" (tự duyệt C1) → **Chờ duyệt C2** — trình cấp trên theo luồng 2 cấp | ✅ Sửa được: "Lưu và phê duyệt" → **giữ nguyên Đã duyệt**, bản cũ ghi nhật ký thay đổi |
| **Đã duyệt** — cảng cạn (luồng 1 cấp) | ❌ Không có nút sửa | ❌ **Không sửa được** | ✅ Sửa được: "Lưu và phê duyệt" → **giữ nguyên Đã duyệt**, không trình lại Cục | — (luồng 1 cấp không có C2) |
| Đã xóa (lịch sử) | ❌ | ❌ | ❌ | ❌ |

### 3.2. Bảng quyết định: nút hiển thị chân form khi mở hồ sơ Đã duyệt (cho tester)

| Quyền của tài khoản | Nút hiển thị | Kết quả khi bấm |
|---|---|---|
| Không có quyền sửa | Không có nút "Chỉnh sửa" | — |
| Chỉ có quyền sửa (không có quyền duyệt) | **Giống như không có quyền sửa** — không có nút "Chỉnh sửa" trên hồ sơ Đã duyệt | — |
| Quyền sửa + quyền duyệt (C1 hoặc C2) | `Hủy` · `Lưu và gửi phê duyệt` · `Lưu và phê duyệt` (xanh lá) | Tùy cấp duyệt của tài khoản — xem bảng 3.1, dòng "Đã duyệt" |

## 4. Quy trình phê duyệt (CHỐT 2026-09-25)

- **Bỏ nguyên tắc 4 mắt**: người tạo **được tự duyệt** hồ sơ do chính mình tạo, nếu được phân quyền duyệt. Tài khoản tạo thuộc cấp nào thì duyệt cấp đó:
  - Tạo thuộc **Chi cục / Cảng vụ** → tự duyệt được C1, sau đó Cục duyệt C2 như thường.
  - Tạo thuộc **Cục** → vào thẳng "Chờ duyệt C2" (bỏ vòng 1), tự duyệt được C2.
- **Hồ sơ thuộc về ĐƠN VỊ, không thuộc cá nhân**: cán bộ trong đơn vị có quyền sửa thì sửa được bản Lưu tạm của đồng nghiệp; người sửa cuối được ghi ở "Cán bộ cập nhật".
- **C2 không trùng C1**: người duyệt C2 phải khác người duyệt C1 **khi C1 do cán bộ cấp Chi cục/Cảng vụ duyệt**; khi C1 là cấp Cục (luồng "Lưu và phê duyệt" trực tiếp của Cục) thì C1 và C2 cùng một người là bình thường (hệ thống đã chặn đúng 2 trường hợp này).
- **Lưu và phê duyệt khi tạo mới**: tài khoản có quyền duyệt cấp cuối có thể tạo thẳng hồ sơ Đã duyệt.
- **Từ chối → sửa → gửi lại**:
  - Bị C1 trả về → sửa → gửi lại → quay về **"Chờ duyệt C1"** (duyệt lại từ đầu).
  - Bị C2 trả về → sửa → gửi lại → người gửi là Chi cục/Cảng vụ: quay về **"Chờ duyệt C1"** (đi lại cả 2 cấp); người gửi là **Cục**: vào thẳng **"Chờ duyệt C2"**.
- **Nhiều tài khoản cùng đơn vị có quyền duyệt**: điều kiện duyệt = (a) có quyền menu phê duyệt của loại hồ sơ đó + (b) đúng cấp đơn vị. Không khóa hồ sơ, không phân công, không hàng đợi — **ai bấm duyệt trước thì người đó được ghi tên** vào hồ sơ ("Người cấp Cảng vụ/Chi cục duyệt" / "Người cấp Cục duyệt").
- **Chống đè dữ liệu**: khi hồ sơ đã bị người khác **đổi trạng thái**, người đang mở form phải **tải lại** mới được thao tác (áp dụng cho mọi tài khoản, kể cả khi 2 người cùng sửa một bản Lưu tạm).
- **Lý do từ chối tối thiểu 10 ký tự**: hiện chỉ chặn ở giao diện. *(Có chặn cả server không: CHỜ CHỐT — mục 7)*

### 4.1. Bảng quyết định: luồng gửi lại sau khi bị từ chối (cho tester)

| Trạng thái bị trả về | Người gửi lại | Trạng thái sau khi gửi | Cấp duyệt tiếp theo |
|---|---|---|---|
| Bị Cảng vụ/Chi cục trả về | Bất kỳ cán bộ đơn vị có quyền | Chờ duyệt C1 | C1 → C2 (đi lại từ đầu) |
| Bị Cục trả về | Chi cục / Cảng vụ | Chờ duyệt C1 | C1 → C2 (đi lại cả 2 cấp) |
| Bị Cục trả về | Cục | Chờ duyệt C2 | C2 (bỏ vòng 1) |

### 4.2. Bảng quyết định: ai duyệt được hồ sơ (cho tester)

| Người thao tác | Hồ sơ mình tạo | Hồ sơ người khác tạo trong phạm vi đơn vị | Hồ sơ ngoài phạm vi đơn vị |
|---|---|---|---|
| Chi cục/Cảng vụ có quyền duyệt C1 | ✅ Tự duyệt C1 *(chốt 25/09; code chưa align — `approveC1` còn chặn, làm sau)* | ✅ Duyệt C1 | ❌ Không thấy / không duyệt được |
| Cục có quyền duyệt C2 | ✅ Tự duyệt C2 *(nút "Lưu và phê duyệt" trực tiếp — code đã hỗ trợ; nút duyệt thường code còn chặn, làm sau)* | ✅ Duyệt C2 | ✅ (Cục thấy toàn bộ) |
| Tài khoản không thuộc Cục được cấu hình `approvec2` | — | — | ❌ **Bị chặn 2 lớp** (xem mục 5) |

## 5. Phạm vi đơn vị & chặn theo cấp (CHỐT 2026-09-25)

- **Data scope**: đơn vị nào chỉ xem dữ liệu đơn vị đó; đơn vị cha xem được đơn vị con (cây con); Cục xem toàn bộ (qua `orgunit:scope_all` / `admin:all`).
- **Mỗi tài khoản chỉ thao tác trên hồ sơ thuộc phạm vi đơn vị của mình**: xem danh sách, sửa, trình duyệt, duyệt C1/C2, từ chối — tất cả đều bị giới hạn theo đơn vị. Hồ sơ **ngoài phạm vi thì tài khoản không nhìn thấy**, nên không thể thao tác — kể cả gọi thẳng API. Đây là lớp bảo vệ tự động của hệ thống, không cần cấu hình thêm.
- **Tạo tài khoản**: khi tạo tài khoản cho cán bộ, người tạo **bắt buộc chọn đơn vị** của tài khoản đó, và chỉ được chọn đơn vị **nằm trong phạm vi quản lý của chính mình** (hệ thống chặn chọn đơn vị ngoài phạm vi).
- **Chặn quyền duyệt C2 theo 2 lớp**:
  1. **Màn phân quyền**: ẩn/không cho tích quyền `approvec2` cho tài khoản **không thuộc cấp Cục**.
  2. **Backend**: khi bấm duyệt C2, kiểm tra cấp đơn vị của tài khoản — gọi thẳng API cũng không lọt.

### 5.1. Bảng quyết định: chặn C2 (cho tester)

| Tài khoản | Màn phân quyền hiển thị quyền duyệt C2? | Gọi API duyệt C2 trực tiếp? |
|---|---|---|
| Thuộc đơn vị cấp Cục | ✅ Tích được | ✅ Thành công |
| Thuộc Chi cục / Cảng vụ (cấp dưới) | ❌ Không hiển thị / không tích được | ❌ Bị chặn (403 hoặc từ chối) |

## 6. Quy trình kiểm thử manual gợi ý (bộ case tối thiểu)

1. Tạo 2 tài khoản cùng đơn vị: A chỉ quyền sửa, B có sửa + duyệt C1.
2. A tạo hồ sơ Lưu tạm → B mở sửa được → người sửa cuối ghi B.
3. A gửi duyệt → B duyệt C1 (B khác người tạo? — không còn bắt buộc; A có thể tự duyệt nếu A có quyền).
4. Hồ sơ Chờ duyệt C2 → thử sửa → phải bị chặn (đóng băng).
5. Cục duyệt C2 → hồ sơ Đã duyệt.
6. A (chỉ quyền sửa) mở hồ sơ Đã duyệt → **không có nút sửa**; gọi API sửa → 403.
7. B mở hồ sơ Đã duyệt (B có sửa + duyệt C1, hồ sơ 2 cấp) → **có nút sửa**; chân form hiện `Hủy` · `Lưu và gửi phê duyệt` · `Lưu và phê duyệt`. Bấm "Lưu và gửi phê duyệt" → Chờ duyệt C1; bấm "Lưu và phê duyệt" → tự duyệt C1, hồ sơ lên Chờ duyệt C2 để Cục duyệt.
8. Tài khoản Cục có sửa + duyệt C2 mở hồ sơ Đã duyệt → nút "Lưu và phê duyệt" → sửa → trạng thái vẫn Đã duyệt, lịch sử ghi bản cũ.
9. Cục từ chối hồ sơ → người gửi Chi cục sửa → gửi lại → trạng thái "Chờ duyệt C1".
10. Từ chối với lý do dưới 10 ký tự → giao diện chặn.
11. Hai tài khoản cùng mở 1 hồ sơ → A đổi trạng thái → B thao tác → phải báo "tải lại".
12. Màn phân quyền: thử gán `approvec2` cho tài khoản Chi cục → không gán được; gọi API duyệt C2 bằng tài khoản đó → bị chặn.
13. Cảng cạn (luồng 1 cấp): duyệt C1 → hồ sơ Đã duyệt, không xuất hiện bước C2; sửa hồ sơ Đã duyệt cần sửa + duyệt C1.

## 7. Việc CHỜ CHỐT (đã nêu trong họp, chưa có quyết định)

| # | Vấn đề | Ghi chú |
|---|---|---|
| 1 | Cơ chế thông báo khi Cục sửa hồ sơ Đã duyệt | Để như hiện tại: đơn vị C1 xem được, không thông báo |
| 2 | Lý do từ chối ≥ 10 ký tự có chặn ở server không | Hiện chỉ chặn giao diện, gọi API vẫn lọt => Dev check lại  |
| 3 | Nhóm chỉ nhận thành viên cùng đơn vị (hoặc cây con) của nhóm | Code hiện không so sánh đơn vị khi thêm thành viên Dev check lại|
| 4 | Xóa permission khỏi danh mục → có thu hồi tự động quyền đã gán không | Hiện xóa mã nhưng nhóm/tài khoản đã gán vẫn giữ quyền => Dev check lại |
| 5 | Endpoint Xóa người dùng (`user:delete`) | Mã quyền không tồn tại → endpoint luôn 403; đã có Khóa tài khoản thay thế => Dev check lại|
| 6 | Mã bypass ngầm `infraasset:manage` | Không bao giờ được seed; cần xóa hoặc ghi rõ chủ ý => Dev check lại |
| 7 | Người tạo tài khoản không có phạm vi đơn vị (scope null) → lớp chặn "chỉ chọn đơn vị trong phạm vi" bị bỏ qua | Cần xác minh thực tế không có tài khoản nào rơi vào trường hợp này => Dev check lại|

## 8. Việc CODE ghi nhận cho giai đoạn sau 
1. **Ưu tiên cao nhất**: sửa nhánh fail-open khi không xác định được loại tài sản trong kiểm tra quyền duyệt (hiện coi như "có quyền trên bất kỳ tài sản nào") → chuyển fail-closed.
2. Re-enable `@PreAuthorize` đang bị comment ở màn **Khu tránh trú bão** và **Bến phao** (Khu neo đậu, Khu chuyển tải đã xong).
3. Siết danh sách người dùng: thêm endpoint picker tối thiểu (`/api/users/options`) cho mọi tài khoản đã đăng nhập; danh sách đầy đủ + chi tiết yêu cầu `user:read`/`user:manage`; gỡ skip GET `/api/users/**`.
4. Chặn 2 lớp quyền duyệt C2 (đã chốt — mục 5).
5. Chặn thành viên nhóm khác đơn vị (nếu chốt mục 7.3).
6. Cập nhật feature-brief F-275 (M-010) — hiện mô tả mô hình Role đã bị xóa khỏi code.
7. Bỏ chặn tự duyệt còn lại ở `approveC1`/`approveC2` cho đúng chốt bỏ 4 mắt (hiện `InfrastructureApprovalService` vẫn chặn người tạo tự duyệt; riêng luồng Cục "Lưu và phê duyệt" trực tiếp code đã hỗ trợ).
8. Align chốt bổ sung R4 (25/09): cho phép tài khoản có `update` + `approvec1` mở sửa hồ sơ Đã duyệt (hiện backend `assertEditable` + frontend `approvalEditPolicy` chỉ cho duyệt cấp cuối); "Lưu và phê duyệt" của C1 → Chờ duyệt C2, không giữ Đã duyệt.

## 9. Tài liệu liên quan

| Tài liệu | Vai trò |
|---|---|
| `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` | Quy trình nghiệp vụ gốc (quy tắc 8–16 đã đồng bộ chốt họp) |
| `docs/conventions/approval-2-level-spec.md` mục 3.9 | Ma trận chuẩn quyền chỉnh sửa theo trạng thái |
| `docs/intel/authorization-rules.md` mục 1 | Mô hình permission-based + 2 hình thức gán quyền |
| `docs/modules/M-010.../F-275-phan-quyen-3-muc/feature-brief.md` | ⚠️ Lỗi thời (mô tả mô hình Role cũ) — chờ pipeline cập nhật |
