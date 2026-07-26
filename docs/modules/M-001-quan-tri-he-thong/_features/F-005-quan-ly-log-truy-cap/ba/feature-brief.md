---
id: F-005
name: Quan ly log truy cap
slug: quan-ly-log-truy-cap
module-id: M-001
status: done
classification: local
priority: medium
created: 2026-06-16T04:40:57Z
last-updated: 2026-07-27T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý log truy cập

**Tài liệu:** BA Feature Brief
**Feature:** F-005
**Module:** M-001 — Quản trị hệ thống
**Người viết:** Business Analyst
**Ngày cập nhật:** 27/07/2026

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Quản lý log truy cập là tính năng cho phép người quản trị hệ thống tra cứu, giám sát toàn bộ các tài khoản người dùng mỗi khi có tác động đến hệ thống — như đăng nhập, đăng xuất, xem báo cáo, thêm mới dữ liệu, sửa thông tin, xóa bản ghi, phê duyệt hồ sơ, xuất file, hay thay đổi cấu hình. Mỗi tác động được hệ thống tự động ghi lại thành một dòng nhật ký kèm thông tin người dùng, đơn vị công tác, thời gian, địa chỉ IP và kết quả.

Để dễ theo dõi, toàn bộ nhật ký được phân thành 5 nhóm:

- **Thao tác:** các hành động tác động đến dữ liệu nghiệp vụ — xem danh sách, xem chi tiết, thêm mới, sửa, xóa, xuất báo cáo, phê duyệt...
- **Đăng nhập:** mỗi lần đăng nhập hoặc đăng xuất khỏi hệ thống
- **Lỗi hệ thống:** mỗi khi hệ thống gặp lỗi hoặc ngoại lệ trong quá trình xử lý
- **Tài khoản:** mỗi khi tài khoản người dùng bị thay đổi — tạo mới, sửa thông tin, khóa, mở khóa, đặt lại mật khẩu
- **Cấu hình:** mỗi khi có thay đổi về cấu hình hệ thống

> **Đánh giá mức độ bao phủ:** 5 nhóm trên bao quát được toàn bộ hoạt động trong hệ thống — từ hành vi người dùng (Thao tác, Đăng nhập) đến sự kiện quản trị (Tài khoản, Cấu hình) và sự cố kỹ thuật (Lỗi hệ thống). Tuy nhiên, nhóm "Thao tác" hiện có phạm vi rất rộng (gộp chung xem, sửa, xóa, xuất, phê duyệt...). Để đáp ứng nhu cầu tra cứu "ai đang làm gì", trường `action` trong mỗi dòng log cần được thiết kế chi tiết, mô tả rõ loại thao tác cụ thể (ví dụ: `VIEW_LIST`, `CREATE_PORT`, `DELETE_BEACON`, `APPROVE_REQUEST`).

### 1.2. Tại sao cần tính năng này?

Có 3 lý do chính:

1. **Kiểm toán (audit):** Khi có sự cố hoặc thanh tra, cần biết chính xác ai đã làm gì, lúc nào, từ đâu. Log là bằng chứng không thể chối cãi vì không ai sửa hay xóa được.

2. **Phát hiện bất thường:** Nếu có 5 lần đăng nhập thất bại trong 1 giờ từ cùng một địa chỉ IP, hệ thống sẽ cảnh báo — có thể ai đó đang cố đoán mật khẩu.

3. **Tuân thủ pháp lý:** Các quy định về an toàn thông tin tại Việt Nam yêu cầu hệ thống phải lưu trữ nhật ký hoạt động tối thiểu 90 ngày và đảm bảo log không bị sửa đổi.

### 1.3. Luồng hoạt động chính

Người quản trị đăng nhập vào hệ thống, từ thanh menu bên trái chọn mục "Quản lý log truy cập". Hệ thống hiển thị giao diện gồm 5 tab tương ứng với 5 nhóm log: Thao tác, Đăng nhập, Lỗi hệ thống, Tài khoản, Cấu hình. Mặc định tab "Thao tác" được chọn.

Bảng danh sách hiển thị các trường: STT, Đơn vị (phòng ban của người dùng), Chức năng (hành động đã thực hiện), Địa chỉ IP, Thông tin trình duyệt, Phiên đăng nhập (mã session), Ngày truy cập, và cột Thao tác với biểu tượng "Xem chi tiết".

Người quản trị có thể lọc theo khoảng thời gian, đơn vị, email người dùng hoặc gõ từ khóa tìm kiếm. Khi click vào biểu tượng xem chi tiết trên một dòng, hệ thống mở popup "Chi tiết log truy cập" hiển thị toàn bộ thông tin của dòng log đó, bao gồm cả metadata dạng JSON.

Hệ thống tự động xóa những log đã quá 90 ngày vào 2 giờ sáng mỗi ngày, đảm bảo cơ sở dữ liệu không bị phình lên vô hạn.

---

## 2. Ai dùng? Dùng như thế nào?

Hệ thống có 7 nhóm người dùng, nhưng không phải ai cũng thấy giống nhau. Quyền xem log được phân cấp rõ ràng:

### 2.1. system-admin (Quản trị viên cấp cao)

Đây là người có quyền cao nhất đối với log. Họ có thể:
- Xem tất cả 5 nhóm log, không giới hạn
- Lọc và tìm kiếm log theo mọi tiêu chí
- Xem báo cáo thống kê tổng hợp (tổng lượt truy cập, số người dùng, tỷ lệ thành công, thời gian phản hồi trung bình)
- Cấu hình chính sách lưu trữ (ví dụ: đổi thời gian giữ log từ 90 ngày thành 180 ngày)
- Nhận cảnh báo khi phát hiện dấu hiệu tấn công (≥5 lần đăng nhập thất bại trong 1 giờ)

### 2.2. admin (Quản trị viên — Security Admin)

Người này phụ trách mảng bảo mật. Họ có thể:
- Xem tất cả 5 nhóm log
- Nhưng **không được xóa log** và **không được cấu hình retention policy**

### 2.3. admin-operation (Quản trị viên vận hành)

Người này chỉ phụ trách vận hành hàng ngày. Họ chỉ được xem 2 nhóm log liên quan đến hoạt động thông thường:
- **Thao tác:** ai đang làm gì trên hệ thống
- **Đăng nhập:** ai đang đăng nhập

Họ **không được xem** các nhóm nhạy cảm hơn như Lỗi hệ thống (chứa stack trace), Tài khoản (chứa thông tin thay đổi tài khoản), hay Cấu hình (thay đổi cấu hình hệ thống).

### 2.4. admin (Quản trị viên thông thường)

Chỉ xem được log của chính mình — những gì mình đã làm trên hệ thống. Không thấy log của người khác.

### 2.5. Lãnh đạo

Không xem log chi tiết. Chỉ xem báo cáo thống kê tổng hợp: có bao nhiêu người dùng hoạt động hôm nay, tỷ lệ thành công là bao nhiêu phần trăm, thời gian phản hồi trung bình. Đây là góc nhìn vĩ mô, không đi sâu vào từng dòng log.

### 2.6. Cán bộ

Giống admin thông thường — chỉ xem log của chính mình.

### 2.7. Cá nhân

Không có quyền truy cập vào màn hình log.

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-005-01:** Là system-admin, tôi muốn xem được toàn bộ 5 nhóm log để giám sát hoạt động hệ thống phục vụ kiểm toán và bảo mật.
- **US-005-02:** Là system-admin, tôi muốn lọc log theo khoảng thời gian, người dùng, loại log và mức độ nghiêm trọng để nhanh chóng tìm thấy những dòng log tôi cần.
- **US-005-03:** Là system-admin, tôi muốn tìm kiếm log theo từ khóa để tìm những dòng có chứa nội dung cụ thể.
- **US-005-07:** Là admin-operation, tôi chỉ muốn xem log truy cập và đăng nhập để giám sát hoạt động người dùng mà không thấy các log nhạy cảm như lỗi hệ thống hay thay đổi tài khoản.

### Mức Should (nên có)

- **US-005-04:** Là system-admin, tôi muốn xem chi tiết từng dòng log (loại trình duyệt, đường dẫn request, mã phản hồi HTTP, thời gian xử lý, metadata) để chẩn đoán sự cố.
- **US-005-06:** Là admin phụ trách một đơn vị, tôi muốn xem log trong phạm vi đơn vị của mình để giám sát hoạt động nội bộ.
- **US-005-08:** Là người dùng thông thường, tôi muốn xem lịch sử hoạt động của chính mình.
- **US-005-10:** Là system-admin, tôi muốn cấu hình thời gian lưu trữ log để phù hợp với chính sách của tổ chức.

### Mức Could (có thể có sau)

- **US-005-09:** Là lãnh đạo, tôi muốn xem thống kê tổng hợp (tổng lượt truy cập, số người dùng, tỷ lệ thành công, thời gian phản hồi trung bình) để có cái nhìn tổng quan về mức độ sử dụng hệ thống.
- **US-005-11:** Là system-admin, tôi muốn nhận cảnh báo khi có ≥5 lần đăng nhập thất bại trong 1 giờ để phát hiện tấn công dò mật khẩu.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-005-01 — Hiển thị 5 nhóm log:** Khi người dùng mở màn hình, hệ thống hiển thị danh sách log với đầy đủ 5 trường chính: người dùng, hành động, tài nguyên, mã phản hồi, thời gian. Nếu database chưa có dữ liệu, hiển thị thông báo thân thiện hướng dẫn người dùng thử thay đổi bộ lọc.

**AC-005-02 — Lọc theo thời gian:** Người dùng chọn ngày bắt đầu và ngày kết thúc, hệ thống chỉ hiển thị log trong khoảng thời gian đó. Nếu ngày bắt đầu lớn hơn ngày kết thúc, hiển thị lỗi "Ngày bắt đầu phải nhỏ hơn ngày kết thúc".

**AC-005-03 — Lọc theo người dùng, loại và mức độ:** Có thể lọc đồng thời theo tên người dùng, loại log (5 nhóm) và mức độ (4 mức). Nếu không có kết quả, hiển thị "Không có log nào phù hợp với bộ lọc".

**AC-005-04 — Tìm kiếm từ khóa:** Có ô tìm kiếm để gõ từ khóa. Hệ thống tìm trong nội dung log, không phân biệt chữ hoa/thường. Nếu để trống ô tìm kiếm, trả về toàn bộ kết quả theo các bộ lọc khác.

**AC-005-05 — Xem chi tiết log:** Khi click vào một dòng, hiển thị cửa sổ với đầy đủ thông tin: thời gian, loại, mức độ, người dùng, địa chỉ IP, trình duyệt, hành động, đường dẫn API, mã phản hồi, thời gian xử lý, nội dung, metadata dạng JSON. Nếu trường metadata trống, hiển thị "N/A".

**AC-005-07 — Log không thể sửa/xóa:** Mọi attempt gọi API để sửa hoặc xóa log đều bị từ chối với mã lỗi 403 và thông báo "Log không thể sửa đổi" hoặc "Log không thể xóa". Ngoại lệ duy nhất là cron job tự động dọn log cũ — đây là hành động của hệ thống, không phải của con người.

**AC-005-08 — Tự động xóa log cũ:** Mỗi ngày vào 2 giờ sáng, hệ thống tự động quét và xóa những log đã quá 90 ngày. Nếu cron job gặp lỗi, ghi log lỗi vào system log nhưng không làm gián đoạn hệ thống.

**AC-005-09 — Log đăng nhập:** Mỗi lần đăng nhập đều được ghi lại, kể cả thành công hay thất bại. Nếu đăng nhập thành công, mức độ là "info". Nếu thất bại, mức độ là "warning" và log chứa địa chỉ IP cùng lý do thất bại.

**AC-005-10 — Log thay đổi tài khoản:** Mọi thao tác liên quan đến tài khoản (tạo mới, sửa thông tin, khóa, mở khóa, đặt lại mật khẩu) đều được ghi lại. Nếu thao tác không hợp lệ, log ghi với mức độ "error".

**AC-005-11 — Log thay đổi cấu hình:** Mỗi khi ai đó thay đổi cấu hình hệ thống, log ghi lại người thay đổi, khóa cấu hình bị thay đổi, giá trị trước và sau khi thay đổi. Nếu giá trị không thay đổi, không tạo log.

**AC-005-12 — Tự động gán mức độ nghiêm trọng:** Hệ thống tự quyết định mức độ của từng log dựa trên ngữ cảnh: đăng nhập thất bại = warning, lỗi hệ thống = error, vi phạm bảo mật = critical. Nếu không xác định được, mặc định là info.

**AC-005-13 — Chỉ hệ thống được tạo log:** Người dùng hoặc admin không thể tự tạo log thủ công qua API. Mọi attempt đều bị từ chối với mã 403 và thông báo "Log chỉ được tạo tự động bởi hệ thống".

**AC-005-14 — Phân trang:** Danh sách log hiển thị phân trang với đầy đủ số thứ tự trang và tổng số dòng. Khi có trên 1.000 dòng, phân trang vẫn hoạt động mượt mà.

**AC-005-15 — Giao diện trên điện thoại:** Khi xem trên màn hình nhỏ hơn 768px, thanh menu bên trái thu gọn thành nút hamburger, log hiển thị dạng thẻ (card) thay vì bảng.

**AC-005-16 — Thống kê tổng hợp:** Màn hình thống kê hiển thị 4 chỉ số: tổng lượt truy cập, số người dùng duy nhất, tỷ lệ thành công (%), thời gian phản hồi trung bình. Có thể xem theo ngày hoặc theo tháng. Nếu không có dữ liệu trong khoảng thời gian đã chọn, tất cả chỉ số hiển thị 0.

**AC-005-17 — Cảnh báo đăng nhập bất thường:** Hệ thống tự động đếm số lần đăng nhập thất bại trong 1 giờ gần nhất. Nếu ≥5 lần, kích hoạt cảnh báo. Nếu dưới 5 lần, không cảnh báo.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

**BR-005-01 — 5 nhóm log với cấu trúc riêng:** Mỗi nhóm log (access, login, error, account, configuration) có cấu trúc trường metadata khác nhau. Ví dụ: log đăng nhập chứa IP và lý do thất bại; log cấu hình chứa giá trị trước/sau khi thay đổi; log lỗi chứa stack trace. Việc này giúp mỗi nhóm log chứa đúng thông tin cần thiết, không thừa không thiếu.

**BR-005-02 — Log là bất biến (immutable):** Một khi đã ghi vào database, dòng log đó không thể bị sửa hay xóa bởi bất kỳ ai. Ngoại lệ duy nhất: cron job dọn log cũ theo chính sách lưu trữ. Quy tắc này đảm bảo log là bằng chứng đáng tin cậy khi thanh tra hoặc điều tra sự cố.

**BR-005-03 — Chính sách lưu trữ 90 ngày:** Log được giữ trong 90 ngày kể từ ngày tạo. Sau 90 ngày, cron job tự động xóa. System-admin có thể thay đổi con số này (ví dụ: 180 ngày) nhưng không được đặt về 0 (giữ vĩnh viễn).

**BR-005-04 — Log đăng nhập ghi cả thành công và thất bại:** Cả hai trường hợp đều được ghi lại. Với lần thất bại, bắt buộc ghi địa chỉ IP và lý do (sai mật khẩu, tài khoản bị khóa, tài khoản không tồn tại...). Điều này giúp phát hiện tấn công dò mật khẩu.

**BR-005-05 — Log thay đổi tài khoản đầy đủ:** Mọi thao tác tạo, sửa, khóa, mở khóa, đặt lại mật khẩu đều phải có log. Log ghi rõ ai thực hiện, thao tác gì, trên tài khoản nào.

**BR-005-06 — Log thay đổi cấu hình có giá trị trước/sau:** Khi ai đó sửa cấu hình, log phải ghi rõ khóa cấu hình nào bị thay đổi, giá trị cũ là gì, giá trị mới là gì. Nếu giá trị không thay đổi (người dùng mở form sửa nhưng không sửa gì rồi nhấn Lưu), không tạo log.

**BR-005-07 — Tự động gán mức độ:** Hệ thống tự quyết định mức độ dựa trên logic: đăng nhập thất bại → warning, lỗi hệ thống → error, vi phạm bảo mật → critical, các trường hợp còn lại → info.

**BR-005-08 — Chỉ hệ thống tạo log:** Không có API nào cho phép người dùng hoặc admin tạo log thủ công. Mọi log đều được sinh ra tự động bởi interceptor hoặc các service của hệ thống. Điều này ngăn chặn việc "giả mạo" log.

**BR-024 — Phân quyền xem log:** Chỉ người có vai trò Admin hoặc Security Admin mới được xem toàn bộ log. Các vai trò khác bị giới hạn phạm vi.

**BR-025 — Log không sửa đổi được:** Quy tắc này lặp lại và củng cố BR-005-02: log là immutable ở mọi cấp độ, từ database cho đến API.

**BR-026 — Tự động dọn log:** Log sẽ bị xóa sau đúng số ngày quy định trong retention policy. Không xóa sớm hơn, không giữ lâu hơn (trừ khi admin thay đổi cấu hình).

**BR-028 — Cảnh báo đăng nhập bất thường:** Nếu trong vòng 1 giờ có ≥5 lần đăng nhập thất bại, hệ thống kích hoạt cảnh báo. Ngưỡng này đủ thấp để phát hiện tấn công nhưng đủ cao để tránh cảnh báo giả (người dùng quên mật khẩu và thử vài lần).

---

## 6. Mô hình dữ liệu

Tính năng này tạo ra 3 bảng dữ liệu mới trong cơ sở dữ liệu:

### 6.1. Bảng AccessLog — nơi lưu từng dòng nhật ký

Đây là bảng chính, lưu mọi dòng log. Mỗi dòng tương ứng với một sự kiện xảy ra trong hệ thống.

Các trường thông tin cơ bản:
- **id:** mã số tự tăng, duy nhất cho mỗi dòng
- **userId:** ID của người thực hiện hành động (có thể null nếu là hành động hệ thống)
- **username:** tên đăng nhập tại thời điểm đó (lưu kèm để tra cứu nhanh, không cần join bảng UserAccount)
- **email:** email người dùng (lưu kèm để hỗ trợ lọc và tìm kiếm)
- **donVi:** đơn vị/phòng ban của người dùng tại thời điểm thực hiện hành động (lưu kèm để hiển thị trên bảng và lọc, không cần join)
- **action:** mô tả ngắn gọn hành động, ví dụ "LOGIN", "LOGOUT", "VIEW_REPORT", "CREATE_PORT", "DELETE_BEACON", "APPROVE_REQUEST"
- **targetResource:** đối tượng bị tác động, ví dụ "/api/ports/123"
- **ipAddress:** địa chỉ IP của người dùng
- **userAgent:** thông tin trình duyệt (Chrome, Firefox,...)
- **sessionId:** mã phiên đăng nhập — các hành động trong cùng một lần đăng nhập có chung sessionId, giúp truy vết toàn bộ hoạt động trong một phiên
- **requestPath:** đường dẫn đầy đủ của request
- **responseCode:** mã HTTP trả về (200, 403, 500...)
- **duration_ms:** thời gian xử lý request tính bằng millisecond
- **status:** kết quả — SUCCESS hoặc FAILED
- **type:** loại log — access, login, error, account, configuration
- **severity:** mức độ — info, warning, error, critical
- **message:** nội dung mô tả chi tiết
- **metadata:** dữ liệu bổ sung dạng JSON, cấu trúc khác nhau tùy loại log
- **createdAt:** thời điểm ghi log

Điểm quan trọng: bảng này được thiết lập **INSERT-only** — chỉ có thêm mới, không có sửa hay xóa. Hệ thống tạo chỉ mục (index) trên các cặp (userId, createdAt), (action, createdAt), (donVi, createdAt) và (sessionId, createdAt) để truy vấn nhanh.

> **⚠️ Khoảng trống so với code hiện tại:** Entity `AccessLog` trong code hiện chưa có 3 trường `email`, `donVi`, và `sessionId`. Đây là các trường cần bổ sung để đáp ứng đặc tả BA: cột "Đơn vị" và "Phiên đăng nhập" trên bảng danh sách, và khả năng lọc theo email. Các trường này nên được lưu trực tiếp (denormalized) vào bảng AccessLog tại thời điểm ghi log để tránh join khi truy vấn.

### 6.2. Bảng LogRetentionPolicy — chính sách lưu trữ

Bảng này chỉ có **một dòng duy nhất** (singleton), lưu cấu hình về việc giữ log bao lâu:

- **retentionDays:** số ngày giữ log, mặc định 90
- **cleanupSchedule:** lịch chạy dọn log (cron expression), mặc định "0 0 2 * * ?" (2 giờ sáng mỗi ngày)
- **isActive:** chính sách có đang bật không

System-admin có thể sửa dòng này để thay đổi thời gian lưu trữ.

### 6.3. Bảng LogAggregate — thống kê tổng hợp

Mỗi ngày, hệ thống chạy một cron job vào 3 giờ sáng để tổng hợp số liệu từ bảng AccessLog, lưu kết quả vào bảng này để báo cáo nhanh:

- **date:** ngày thống kê (duy nhất)
- **totalAccesses:** tổng số lượt truy cập trong ngày
- **uniqueUsers:** số người dùng duy nhất trong ngày
- **successRate:** tỷ lệ request thành công (%)
- **avgDuration:** thời gian phản hồi trung bình (ms)

Nhờ bảng này, lãnh đạo có thể xem báo cáo thống kê theo tháng mà không cần quét toàn bộ bảng AccessLog (có thể lên đến hàng triệu dòng).

---

## 7. API Endpoints

Hệ thống cung cấp 7 API để phục vụ các thao tác liên quan đến log:

### 7.1. Xem danh sách log

**`GET /api/v1/logs`** — Lấy danh sách log có phân trang, hỗ trợ lọc theo: khoảng thời gian, người dùng, loại log, mức độ, từ khóa tìm kiếm. API này dành cho Admin và Security Admin.

### 7.2. Xem chi tiết một dòng log

**`GET /api/v1/logs/{id}`** — Lấy toàn bộ thông tin của một dòng log theo ID. API này dành cho Admin và Security Admin.

### 7.3. Tính toán thống kê

**`POST /api/v1/logs/aggregate`** — Kích hoạt tính toán lại thống kê tổng hợp (thường dùng khi cần xem số liệu ngay trong ngày, không đợi cron job 3 giờ sáng). Chỉ Security Admin mới được gọi.

### 7.4. Xem báo cáo thống kê

**`GET /api/v1/logs/aggregate`** — Xem báo cáo thống kê tổng hợp theo ngày hoặc tháng. API này dành cho Security Admin và Lãnh đạo.

### 7.5. Xem chính sách lưu trữ

**`GET /api/v1/logs/retention`** — Xem cấu hình retention hiện tại (bao nhiêu ngày, lịch dọn log...). Chỉ system-admin mới xem được.

### 7.6. Sửa chính sách lưu trữ

**`PUT /api/v1/logs/retention`** — Cập nhật số ngày lưu trữ hoặc lịch dọn log. Chỉ system-admin mới được sửa.

---

## 8. Chi tiết 5 nhóm log

Mỗi nhóm log có đặc điểm riêng về cách ghi và dữ liệu kèm theo:

### 8.1. Thao tác

Ghi lại mỗi khi người dùng thực hiện một hành động tác động đến dữ liệu nghiệp vụ: xem danh sách, xem chi tiết, thêm mới, sửa, xóa, xuất báo cáo, phê duyệt hồ sơ. Các trường quan trọng: hành động cụ thể là gì (CREATE, UPDATE, DELETE, VIEW, EXPORT, APPROVE...), thao tác trên đối tượng nào, mã HTTP trả về, mất bao lâu để xử lý. Mức độ mặc định là info, trừ khi thao tác thất bại thì nâng lên warning hoặc error.

### 8.2. Login (Đăng nhập)

Ghi lại mỗi lần đăng nhập. Nếu thành công: mức độ info. Nếu thất bại: mức độ warning, kèm địa chỉ IP và lý do. Nhóm này là đầu vào cho cơ chế cảnh báo tấn công (BR-028).

### 8.3. Error (Lỗi hệ thống)

Ghi lại khi hệ thống gặp lỗi hoặc ngoại lệ. Mức độ luôn là error. Trường metadata chứa stack trace để developer debug. Trường message mô tả lỗi.

### 8.4. Account (Tài khoản)

Ghi lại mọi thay đổi về tài khoản người dùng: tạo mới, sửa thông tin, khóa tài khoản, mở khóa, đặt lại mật khẩu. Trường metadata chứa giá trị trước và sau khi thay đổi (ví dụ: trạng thái cũ là "active", trạng thái mới là "locked").

### 8.5. Configuration (Cấu hình)

Ghi lại mọi thay đổi về cấu hình hệ thống. Metadata chứa khóa cấu hình bị thay đổi, giá trị cũ, giá trị mới. Nếu không có thay đổi thực sự, không tạo log.

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- Truy vấn danh sách log phải trả về trong dưới 2 giây với dataset lên đến 100.000 dòng
- Phân trang phải hoạt động mượt mà với dataset trên 1.000 dòng

### 9.2. Khả năng mở rộng

- Cơ chế ghi log dùng batch insert 500-1.000 dòng mỗi lần, không ghi từng dòng đơn lẻ
- Log được ghi bất đồng bộ (async) để không làm chậm luồng chính đang phục vụ người dùng

### 9.3. Bảo mật

- Phân quyền RBAC được áp dụng trên tất cả các API liên quan đến log
- Bảng AccessLog chỉ cho phép INSERT, không UPDATE/DELETE
- Chống log injection trong trường message (không cho phép kẻ tấn công chèn nội dung độc hại vào log)

### 9.4. Độ tin cậy

- Cron job dọn log có cơ chế thử lại nếu lần đầu thất bại
- Async log appender chạy trên luồng riêng, không bao giờ block luồng chính
- Sử dụng MDC (Mapped Diagnostic Context) để theo dõi ngữ cảnh request xuyên suốt các luồng

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: trên điện thoại (dưới 768px), thanh menu thu gọn, log hiển thị dạng thẻ
- Có loading skeleton khi đang tải dữ liệu
- Có trạng thái rỗng (empty state) với hướng dẫn thân thiện
- Tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA

### 9.6. Tuân thủ pháp lý

- Đáp ứng yêu cầu lưu trữ log kiểm toán theo quy định an toàn thông tin Việt Nam
- Log được giữ tối thiểu 90 ngày
- Log không thể sửa hoặc xóa

> **Ghi chú:** Cần bổ sung trích dẫn cụ thể nghị định/thông tư về lưu trữ log kiểm toán khi có thông tin chính xác.

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình Log truy cập dùng chung bố cục toàn hệ thống, bao gồm:

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

Để đảm bảo giao diện đồng nhất toàn hệ thống, chỉ được dùng các giá trị số sau:

**Khoảng cách (spacing):** 4px, 8px, 12px, 16px, 24px, 32px. Trong đó 12px là khoảng cách mặc định giữa các trường trong form (`spaceFormField`), 16px là padding mặc định của card (`spaceMd`).

**Bo góc (radius):** 4px (cho ô textarea), 8px, 12px (cho card), 999px (dạng pill — dùng cho input, select, button).

**Cỡ chữ (font size):** 10px (metadata, caption), 13px (nhãn, nội dung), 15px (tiêu đề card, tiêu đề section), 18px (tiêu đề trang).

**Độ đậm chữ (font weight):** 400 (nội dung), 500 (nhãn, nút), 600 (số liệu quan trọng, tiêu đề).

**Font chữ:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` cho toàn bộ văn bản.

> **Cấm tuyệt đối:** spacing 6, 10, 14, 18; radius 6, 7, 10; font-size 12, 14, 16, 24. Những giá trị này phá vỡ hệ thống thang số và làm giao diện thiếu nhất quán.

### 10.4. Style có sẵn — dùng lại, đừng tự chế

Hệ thống đã định nghĩa sẵn các kiểu dáng phổ biến. Khi cần hiển thị:

- **Thời gian, caption:** dùng `metaStyle` (chữ nhỏ 10px, màu xám nhạt, weight 400)
- **Card nội dung:** dùng `cardStyle` (nền trắng, viền 0.5px, bo góc 12px, padding 16px)
- **Tag trạng thái:** dùng `badgeBaseStyle` (chữ nhỏ, weight 500, padding 2px-8px, pill)
- **Link, nút text:** dùng `actionStyle` (pill, màu actionPrimary, weight 500)
- **Đường kẻ ngăn cách:** dùng `dividerStyle`

### 10.5. Giới hạn màu nhấn — tối đa 3 lần mỗi màn

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình Log truy cập:

1. Nút "Tìm kiếm" trên thanh lọc — hành động thường dùng
2. Icon "Xem chi tiết" trong bảng — điều hướng

Các màu trạng thái (xanh lá cho thành công, vàng cho cảnh báo, đỏ cho lỗi) và màu chữ không tính vào giới hạn này.

### 10.6. Màn hình danh sách log

Màn hình chính sử dụng 5 component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** hiển thị đường dẫn "Quản trị hệ thống > Quản lý log truy cập".

2. **FilterBar:** thanh lọc nằm ngang phía trên bảng, gồm: bộ chọn khoảng ngày, dropdown chọn đơn vị (phòng ban), ô tìm kiếm theo email người dùng, ô tìm kiếm từ khóa, nút "Tìm kiếm" và nút "Làm mới".

3. **StatusTabs:** 5 tab nằm ngang: Thao tác, Đăng nhập, Lỗi hệ thống, Tài khoản, Cấu hình. Mỗi tab hiển thị số lượng log trong nhóm đó. Tab đang chọn có đường gạch chân màu `actionPrimary`.

4. **DataTable:** bảng dữ liệu với tiêu đề cột cố định khi cuộn (sticky header), dòng được tô sáng khi di chuột qua (hover row). Các cột hiển thị:

| Cột | Nội dung | Ghi chú |
|---|---|---|
| STT | Số thứ tự dòng | Tự động đánh số |
| Đơn vị | Phòng ban của người dùng | Truy xuất từ UserAccount → Organization |
| Chức năng | Hành động đã thực hiện | Giá trị trường `action` (VD: VIEW_LIST, CREATE_PORT) |
| Địa chỉ IP | IP của người dùng | Trường `ipAddress` |
| Trình duyệt | Thông tin User-Agent | Rút gọn hiển thị (VD: "Chrome 120 / Windows") |
| Phiên đăng nhập | Mã session | Trường `sessionId` — gom các hành động trong cùng phiên |
| Ngày truy cập | Thời gian thực hiện | Trường `createdAt`, định dạng DD/MM/YYYY HH:mm |
| Thao tác | Icon "Xem chi tiết" | Click mở popup Chi tiết log truy cập |

**Lưu ý:** Không có cột "Sửa" hay "Xóa" vì log là bất biến.

5. **Pagination:** thanh điều hướng trang ở cuối bảng, hiển thị tổng số dòng và số trang.

### 10.7. Popup chi tiết log truy cập

Khi người dùng click icon "Xem chi tiết" trên một dòng, hệ thống mở popup "Chi tiết log truy cập" hiển thị toàn bộ thông tin của dòng log đó. Các trường hiển thị dạng form chỉ đọc (read-only):

- Mỗi trường dùng `marginBottom = spaceFormField` (12px)
- Input/Select dùng `borderRadius = radiusPill` (999px), chiều cao 40px
- Riêng metadata dạng JSON hiển thị trong thẻ `<pre>` với font monospace (`fontMono`)
- Cuối modal chỉ có nút "Đóng" (outlined, pill radius)

### 10.8. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị spinner của Ant Design hoặc khung xương (skeleton) — không hiển thị bảng trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng và dòng chữ "Không có log nào phù hợp với bộ lọc. Thử thay đổi tiêu chí tìm kiếm." với màu chữ `textSecondary` và cỡ chữ `fontSizeMd`.
- **Lỗi tải dữ liệu:** hiển thị cảnh báo đỏ và nút "Thử lại" màu `actionPrimary`.

### 10.9. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy tab nào | Thấy nút Xem chi tiết |
|---|---|---|
| system-admin | 5 tab | Có |
| admin (Security) | 5 tab | Có |
| admin-operation | Chỉ Thao tác + Đăng nhập | Có |
| admin thường / Cán bộ | Log của mình | Có |
| Lãnh đạo | Chỉ màn thống kê | Không |

Lưu ý: **không vai trò nào thấy nút Sửa hoặc Xóa** — log là bất biến.

### 10.10. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger 80px
- Bảng dữ liệu chuyển thành dạng thẻ (card), mỗi thẻ hiển thị: thời gian + loại log + nội dung rút gọn
- Thanh lọc chuyển thành panel có thể gập/mở
- Modal chi tiết thu nhỏ còn 90% chiều rộng màn hình

---

## 11. Kịch bản kiểm thử

Dưới đây là 20 kịch bản kiểm thử chính, bao phủ từ giao diện, chức năng, bảo mật đến hiệu năng:

**TS-005-01 — Lọc log theo khoảng thời gian:** Chọn ngày bắt đầu 01/07/2026, ngày kết thúc 15/07/2026. Hệ thống chỉ hiển thị log trong khoảng này, phân trang đúng.

**TS-005-02 — Lọc đồng thời 3 tiêu chí:** Chọn user "admin", type "login", severity "warning". Hệ thống chỉ hiển thị log đăng nhập thất bại của admin.

**TS-005-03 — Tìm kiếm từ khóa:** Gõ "password" vào ô tìm kiếm. Hệ thống trả về các dòng log có chứa từ "password" hoặc "PASSWORD" (không phân biệt hoa/thường).

**TS-005-04 — Xem chi tiết:** Click vào một dòng log. Modal hiển thị đầy đủ metadata dạng JSON, userAgent, requestPath.

**TS-005-07 — Chặn sửa log:** Gọi PUT /api/v1/logs/1. Hệ thống trả về 403 và message "Log không thể sửa đổi".

**TS-005-08 — Chặn xóa log:** Gọi DELETE /api/v1/logs/1. Hệ thống trả về 403 và message "Log không thể xóa".

**TS-005-09 — Tự động xóa log cũ:** Tạo log giả với ngày tạo cách đây 91 ngày. Chạy cron job. Log đó bị xóa. Log 89 ngày vẫn được giữ.

**TS-005-10 — Tự động gán severity cho login failure:** Đăng nhập sai mật khẩu. Log được tạo với severity = warning.

**TS-005-11 — Tự động gán severity cho system error:** Gây ra lỗi hệ thống (ví dụ: null pointer). Log được tạo với severity = error.

**TS-005-12 — Cảnh báo 5 lần đăng nhập thất bại:** Đăng nhập sai 5 lần trong 1 giờ. Hệ thống kích hoạt cảnh báo.

**TS-005-13 — Phân trang với 1.000+ dòng:** Tạo 1.200 dòng log. Chuyển trang, thời gian phản hồi dưới 2 giây.

**TS-005-14 — Giao diện điện thoại:** Mở màn hình trên màn hình 375px. Sidebar collapse, log hiển thị dạng card.

**TS-005-15 — Trạng thái rỗng:** Lọc với tiêu chí không có kết quả. Hiển thị thông báo thân thiện.

**TS-005-16 — Thống kê tổng hợp:** Xem báo cáo aggregate. 4 chỉ số hiển thị đúng: tổng truy cập, unique users, success rate, avgDuration.

**TS-005-17 — Admin chỉ xem log của mình:** Đăng nhập admin thường. Không thấy log của người khác.

**TS-005-18 — Admin-operation chỉ xem access + login:** Đăng nhập admin-operation. Chỉ thấy tab Access và Login. Không thấy tab Error, Account, Configuration.

**TS-005-19 — Lãnh đạo chỉ xem thống kê:** Đăng nhập lãnh đạo. Chỉ thấy màn thống kê, không thấy tab log chi tiết.

**TS-005-20 — Validate ngày:** Chọn ngày bắt đầu 15/07/2026, ngày kết thúc 01/07/2026. Hiển thị lỗi "Ngày bắt đầu phải nhỏ hơn ngày kết thúc".

---

## 12. Môi trường kỹ thuật

- **Backend:** Spring Boot + Spring Security + JWT
- **Frontend:** ReactJS với Ant Design v5
- **Database:** MSSQL 2022
- **Ghi log bất đồng bộ:** Spring Async + BlockingQueue (batch insert)
- **Dọn log định kỳ:** Spring @Scheduled (cron)
