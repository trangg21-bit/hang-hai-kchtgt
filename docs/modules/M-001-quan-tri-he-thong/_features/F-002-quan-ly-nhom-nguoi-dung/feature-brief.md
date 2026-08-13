---
id: F-002
name: Quản lý nhóm người dùng
slug: quan-ly-nhom-nguoi-dung
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý nhóm người dùng

**Tài liệu:** BA Feature Brief
**Feature:** F-002
**Module:** M-001 — Quản trị hệ thống
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-06-26

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Quản lý tập trung các nhóm người dùng trong hệ thống, cho phép tạo mới, chỉnh sửa, khóa/mở khóa nhóm theo đơn vị trực thuộc, thêm người dùng vào nhóm, phân quyền cho nhóm (gán chức năng để thành viên thừa hưởng quyền sử dụng), và tra cứu lịch sử thay đổi. Tính năng hỗ trợ tra cứu, tìm kiếm và phân trang danh sách nhóm với các bộ lọc thông minh.

### 1.2. Tại sao cần tính năng này?

Quản trị hệ thống cần cơ chế phân nhóm người dùng linh hoạt để tổ chức cán bộ theo đơn vị hoặc nhóm công việc đặc thù, giúp tối ưu hóa việc gán quyền sử dụng chức năng, chia sẻ dữ liệu và phối hợp nghiệp vụ giữa các thành viên trong cùng nhóm.

### 1.3. Luồng hoạt động chính

#### a) Xem danh sách và tìm kiếm

1. Người dùng truy cập màn hình Quản lý nhóm người dùng từ sidebar.
2. Hệ thống hiển thị danh sách nhóm dạng bảng với các cột: STT, Đơn vị, Mã nhóm, Tên nhóm, Trạng thái, Thao tác.
3. Người dùng có thể lọc danh sách theo các trường: Đơn vị (chọn trên cây đơn vị), Mã nhóm (nhập text), Tên nhóm (nhập text), Trạng thái (chọn "Sử dụng"/"Không sử dụng").
4. Hệ thống trả về danh sách nhóm phù hợp với bộ lọc, có phân trang.
5. Tại cột Thao tác, người dùng có thể thực hiện: Xem chi tiết, Sửa, Khóa nhóm người dùng, Phân quyền nhóm người dùng, Thêm thành viên vào nhóm người dùng.

#### b) Tạo nhóm mới

1. Người dùng nhấn nút "Thêm mới" trên màn hình danh sách.
2. Hệ thống mở popup tạo nhóm, hiển thị form với các trường: Đơn vị (cây đơn vị), Tên nhóm, Mã nhóm, Mô tả, Trạng thái.
3. Người dùng chọn đơn vị, nhập tên và mã nhóm, chọn trạng thái (mặc định "Sử dụng"), nhấn "Lưu".
4. Hệ thống kiểm tra tên và mã nhóm chưa tồn tại. Nếu hợp lệ, tạo nhóm mới, hiển thị toast "Đã tạo thành công", ghi nhận vào lịch sử. Nếu trùng tên hoặc mã, hiển thị lỗi tương ứng.

#### c) Xem chi tiết nhóm

1. Người dùng click "Xem chi tiết" trên một dòng nhóm trong danh sách.
2. Hệ thống mở popup chi tiết nhóm dạng tab:
   - Tab Thông tin: hiển thị Đơn vị, Tên nhóm, Mã nhóm, Mô tả, Trạng thái, Ngày tạo, Người tạo.
   - Tab Danh sách thành viên: hiển thị bảng thành viên hiện tại của nhóm.

#### d) Chỉnh sửa thông tin nhóm

1. Người dùng click "Sửa" trên một dòng nhóm trong danh sách.
2. Hệ thống mở popup chỉnh sửa với form các trường: Tên nhóm, Mô tả, Trạng thái. Trường Đơn vị và Mã nhóm hiển thị read-only (không cho sửa sau khi tạo).
3. Người dùng thay đổi thông tin, nhấn "Lưu".
4. Hệ thống kiểm tra tên nhóm không trùng với nhóm khác (BR-002-01). Nếu hợp lệ, cập nhật thông tin, hiển thị toast "Đã lưu thành công", ghi nhận vào lịch sử. Nếu trùng tên, hiển thị lỗi.

#### e) Thêm người dùng vào nhóm

1. Người dùng click "Thêm thành viên vào nhóm người dùng" trên một dòng nhóm trong danh sách.
2. Hệ thống mở popup "Thêm người dùng", hiển thị: danh sách thành viên hiện tại (bên dưới) và form thêm thành viên mới (bên trên) với ô tìm kiếm và bảng người dùng chưa thuộc nhóm.
3. Người dùng tìm kiếm người dùng, tick chọn, nhấn "Thêm".
4. Hệ thống kiểm tra người dùng chưa có trong nhóm, thêm vào danh sách thành viên, hiển thị toast "Đã thêm X thành viên". Nếu người dùng đã thuộc nhóm, báo lỗi.
   Người dùng nhấn "Xóa" trên một thành viên và xác nhận.
5. Hệ thống xóa thành viên khỏi nhóm, thu hồi quyền sử dụng chức năng thừa hưởng từ nhóm của thành viên đó.

#### f) Phân quyền chức năng cho nhóm

1. Người dùng click "Phân quyền nhóm người dùng" trên một dòng nhóm trong danh sách.
2. Hệ thống mở popup Phân quyền, hiển thị sơ đồ cây chức năng, trong đó các chức năng đã được gán trước đó được tick sẵn.
3. Người dùng tick/bỏ tick các chức năng cần gán, nhấn "Lưu".
4. Hệ thống cập nhật danh sách chức năng của nhóm, hiển thị toast "Đã cập nhật phân quyền", ghi nhận vào lịch sử. Toàn bộ thành viên hiện tại và thành viên thêm vào sau được thừa hưởng quyền sử dụng các chức năng đã gán.

#### g) Khóa/Mở khóa nhóm

1. Người dùng click "Khóa nhóm người dùng" trên một dòng nhóm đang có trạng thái "Sử dụng".
2. Hệ thống hiển thị popup xác nhận: "Bạn có chắc chắn muốn khóa nhóm '{tên nhóm}'? Toàn bộ thành viên trong nhóm sẽ bị tạm ngưng quyền sử dụng chức năng thừa hưởng từ nhóm."
3. Người dùng xác nhận.
4. Hệ thống chuyển trạng thái nhóm sang "Không sử dụng", tạm ngưng quyền thừa hưởng của toàn bộ thành viên, ghi nhận vào lịch sử.
5. Khi nhóm đang ở trạng thái "Không sử dụng", người dùng click "Khóa nhóm người dùng" (nút chuyển thành "Mở khóa nhóm người dùng").
6. Hệ thống hiển thị popup xác nhận mở khóa.
7. Người dùng xác nhận.
8. Hệ thống chuyển trạng thái nhóm sang "Sử dụng", khôi phục quyền thừa hưởng cho toàn bộ thành viên, ghi nhận vào lịch sử.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi tài khoản người dùng được phân quyền chức năng và có thể sử dụng các chức năng đúng như đã được phân quyền.

### 2.1. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ nhóm trong hệ thống, không giới hạn phạm vi đơn vị.
- **Xem thông tin người chỉnh sửa:** Với mỗi nhóm, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của nhóm (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới nhóm (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới nhóm (timestamp).

> **Ghi chú:** Các trường `người tạo mới`, `thời gian tạo mới`, `người chỉnh sửa`, `thời gian cập nhật` cần được bổ sung vào bảng dữ liệu tương ứng và chỉ hiển thị đối với tài khoản Admin Cục. Với các tài khoản khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-002-01:** Là người dùng có quyền quản trị, tôi muốn tạo nhóm người dùng mới với tên, mã, đơn vị và trạng thái để tổ chức người dùng theo đơn vị trực thuộc.
- **US-002-02:** Là người dùng có quyền quản trị, tôi muốn thêm người dùng vào nhóm hoặc xóa người dùng khỏi nhóm để quản lý danh sách thành viên.
- **US-002-03:** Là người dùng có quyền quản trị, tôi muốn gán chức năng cho nhóm để toàn bộ thành viên trong nhóm được thừa hưởng quyền sử dụng các chức năng đó.
- **US-002-04:** Là người dùng có quyền quản trị, tôi muốn chỉnh sửa thông tin nhóm (tên, mô tả, trạng thái) để cập nhật khi có thay đổi.
- **US-002-05:** Là người dùng có quyền quản trị, tôi muốn khóa nhóm để tạm ngưng quyền của toàn bộ thành viên trong nhóm khi nhóm không còn hoạt động.

### Mức Should (nên có)

- **US-002-06:** Là người dùng có quyền xem, tôi muốn tìm kiếm và lọc danh sách nhóm theo đơn vị, mã nhóm, tên nhóm, trạng thái để nhanh chóng tìm được nhóm cần quản lý.
- **US-002-07:** Là người dùng có quyền xem, tôi muốn xem chi tiết nhóm và lịch sử thay đổi của nhóm (ai đã làm gì, lúc nào) để phục vụ kiểm toán.
- **US-002-08:** Là người dùng, tôi muốn xem danh sách nhóm và thành viên để nắm được cơ cấu tổ chức theo đơn vị.

### Mức Could (có thể có sau)

- **US-002-09:** Là người dùng thông thường, tôi muốn xem danh sách các nhóm mà tôi đang tham gia để biết mình thuộc những nhóm nào.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-002-01 — Tạo nhóm thành công:** Khi người dùng nhập đầy đủ thông tin hợp lệ (đơn vị, tên nhóm, mã nhóm, trạng thái) và nhấn Tạo, hệ thống tạo nhóm mới với trạng thái mặc định "Sử dụng", hiển thị toast "Đã tạo thành công". Nếu tên hoặc mã đã tồn tại, hệ thống từ chối và hiển thị lỗi tương ứng "Tên nhóm đã tồn tại" hoặc "Mã nhóm đã tồn tại".

**AC-002-02 — Tạo nhóm thất bại do trùng tên:** Khi người dùng nhập tên nhóm đã tồn tại trong hệ thống và nhấn Tạo, hệ thống hiển thị lỗi "Tên nhóm đã tồn tại", nhóm không được tạo.

**AC-002-03 — Tạo nhóm thất bại do trùng mã:** Khi người dùng nhập mã nhóm đã tồn tại trong hệ thống và nhấn Tạo, hệ thống hiển thị lỗi "Mã nhóm đã tồn tại", nhóm không được tạo.

**AC-002-04 — Thêm thành viên vào nhóm:** Khi người dùng chọn người dùng chưa thuộc nhóm và nhấn Thêm, hệ thống thêm thành viên vào nhóm, hiển thị toast "Đã thêm thành viên". Nếu người dùng đã thuộc nhóm, hiển thị lỗi "Người dùng đã thuộc nhóm này".

**AC-002-05 — Thêm thành viên thất bại do trùng lặp:** Khi người dùng chọn người dùng đã có trong nhóm và nhấn Thêm, hệ thống hiển thị lỗi "Người dùng đã thuộc nhóm này", thành viên không được thêm trùng.

**AC-002-06 — Xóa thành viên khỏi nhóm:** Khi người dùng nhấn Xóa thành viên và xác nhận, thành viên bị xóa khỏi nhóm, tài khoản người dùng không bị ảnh hưởng. Nếu thành viên không tồn tại trong nhóm, hiển thị lỗi phù hợp.

**AC-002-07 — Tìm kiếm nhóm theo tên và mã:** Khi người dùng nhập từ khóa vào ô tìm kiếm Tên nhóm hoặc Mã nhóm, hệ thống trả về danh sách nhóm có tên hoặc mã chứa từ khóa, kết quả được phân trang chính xác. Nếu không có kết quả, hiển thị trạng thái rỗng.

**AC-002-08 — Xem danh sách nhóm (view-only):** Khi người dùng chỉ có quyền xem truy cập danh sách nhóm, hệ thống hiển thị danh sách nhưng không hiển thị nút Thêm mới và các nút thao tác trên dòng.

**AC-002-09 — Xem nhóm cá nhân (myGroups):** Khi người dùng thông thường truy cập danh sách nhóm, hệ thống chỉ hiển thị các nhóm mà người dùng đó tham gia. Nếu không tham gia nhóm nào, hiển thị trạng thái rỗng.

**AC-002-10 — Chỉnh sửa nhóm thành công:** Khi người dùng có quyền sửa thông tin nhóm (tên, mô tả, trạng thái) và nhấn Lưu, hệ thống cập nhật thông tin, hiển thị toast "Đã lưu thành công". Trường Đơn vị và Mã nhóm không được phép thay đổi sau khi tạo. Nếu tên mới trùng với nhóm khác, hiển thị lỗi "Tên nhóm đã tồn tại".

**AC-002-11 — Chỉnh sửa nhóm thất bại do trùng tên:** Khi người dùng sửa tên nhóm B thành tên đã tồn tại của nhóm A và nhấn Lưu, hệ thống hiển thị lỗi "Tên nhóm đã tồn tại", thông tin không được cập nhật.

**AC-002-12 — Gán chức năng cho nhóm:** Khi người dùng mở drawer Phân quyền, tick chọn chức năng trên cây chức năng và nhấn Lưu, hệ thống cập nhật danh sách chức năng của nhóm, toàn bộ thành viên hiện tại có quyền sử dụng các chức năng được gán. Nếu bỏ chọn tất cả chức năng, nhóm không còn chức năng nào được gán.

**AC-002-13 — Thành viên mới tự động có quyền từ nhóm:** Khi người dùng thêm người dùng mới vào nhóm đã được gán chức năng, người dùng mới tự động thừa hưởng toàn bộ quyền sử dụng các chức năng đã gán cho nhóm.

**AC-002-14 — Xem chi tiết nhóm:** Khi người dùng click "Xem chi tiết" trên một dòng nhóm, hệ thống mở drawer với 2 tab: Thông tin nhóm (đầy đủ các trường), Danh sách thành viên (bảng phân trang). Không có chức năng lịch sử nhóm. Nếu nhóm không tồn tại, hiển thị lỗi.

**AC-002-15 — Khóa nhóm:** Khi người dùng click "Khóa nhóm người dùng" trên nhóm đang "Sử dụng" và xác nhận, hệ thống chuyển trạng thái nhóm sang "Không sử dụng", tạm ngưng toàn bộ quyền thừa hưởng từ nhóm của các thành viên, hiển thị toast "Đã khóa nhóm". Nếu nhóm đã ở trạng thái "Không sử dụng", nút hiển thị là "Mở khóa nhóm người dùng".

**AC-002-16 — Mở khóa nhóm:** Khi người dùng click "Mở khóa nhóm người dùng" trên nhóm đang "Không sử dụng" và xác nhận, hệ thống chuyển trạng thái nhóm sang "Sử dụng", khôi phục toàn bộ quyền thừa hưởng từ nhóm cho các thành viên, hiển thị toast "Đã mở khóa nhóm".

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

**BR-002-01 — Tên nhóm duy nhất:** Tên nhóm (name) phải là duy nhất trong toàn hệ thống. Khi tạo mới hoặc chỉnh sửa, nếu trùng tên với nhóm khác, hệ thống từ chối và hiển thị lỗi.

**BR-002-02 — Người dùng có thể thuộc nhiều nhóm:** Một người dùng có thể là thành viên của nhiều nhóm cùng lúc. Không giới hạn số lượng nhóm mà một người dùng có thể tham gia.

**BR-002-03 — Mã nhóm duy nhất:** Mã nhóm (code) phải là duy nhất trong toàn hệ thống. Định dạng: chữ hoa, số và gạch dưới, dài 2-30 ký tự.

**BR-002-05 — Thừa hưởng quyền từ chức năng của nhóm:** Người dùng có quyền quản trị có thể gán một hoặc nhiều chức năng cho nhóm. Toàn bộ thành viên trong nhóm được thừa hưởng quyền sử dụng các chức năng được gán.

**BR-002-06 — Thu hồi quyền khi rời nhóm:** Khi thành viên rời khỏi nhóm, quyền sử dụng chức năng thừa hưởng từ nhóm bị thu hồi. Quyền được gán trực tiếp cho người dùng (từ F-001) không bị ảnh hưởng.

**BR-002-07 — Tự động cấp quyền cho thành viên mới:** Khi thêm thành viên mới vào nhóm, thành viên tự động có quyền sử dụng các chức năng đã gán cho nhóm.

**BR-002-08 — Hậu quả khi khóa nhóm:** Khi nhóm bị khóa (chuyển sang "Không sử dụng"), toàn bộ thành viên trong nhóm bị tạm ngưng quyền sử dụng chức năng thừa hưởng từ nhóm. Các quyền được gán trực tiếp cho người dùng không bị ảnh hưởng. Khi nhóm được mở khóa (chuyển sang "Sử dụng"), quyền thừa hưởng được khôi phục.

---

## 6. Mô hình dữ liệu

Tính năng này tạo ra/sửa đổi các bảng dữ liệu sau trong cơ sở dữ liệu:

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **trường mới cần thêm** vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = **trường không cần thiết**, cần loại bỏ khỏi bảng.
> - Các trường không được đánh dấu là các trường hiện có, được giữ nguyên.

### 6.1. Bảng UserGroup — Nhóm người dùng

Đây là bảng chính, lưu thông tin các nhóm người dùng trong hệ thống.

Các trường thông tin:

- <span style="color:red;font-weight:bold">**id:** BIGINT, PK, tự tăng — mã định danh nhóm</span>
- <span style="color:red;font-weight:bold">**organizationId:** BIGINT, FK → Organization, NOT NULL — đơn vị trực thuộc của nhóm</span>
- <span style="color:red;font-weight:bold">**name:** VARCHAR(100), NOT NULL — tên nhóm (duy nhất toàn hệ thống)</span>
- <span style="color:red;font-weight:bold">**code:** VARCHAR(30), UNIQUE, NOT NULL — mã nhóm (chữ hoa + số + gạch dưới)</span>
- <span style="color:red;font-weight:bold">**description:** TEXT — mô tả mục đích của nhóm</span>
- <span style="color:red;font-weight:bold">**status:** VARCHAR(20) — trạng thái: "Sử dụng" / "Không sử dụng". Mặc định: "Sử dụng"</span>
- <span style="color:red;font-weight:bold">**createdBy:** BIGINT, FK → UserAccount — người tạo nhóm</span>
- <span style="color:red;font-weight:bold">**createdAt:** TIMESTAMP — thời điểm tạo nhóm</span>
- <span style="color:red;font-weight:bold">**updatedBy:** BIGINT, FK → UserAccount, NULL — người chỉnh sửa cuối</span>
- <span style="color:red;font-weight:bold">**updatedAt:** TIMESTAMP — thời điểm cập nhật cuối</span>

### 6.2. Bảng GroupMember — Thành viên nhóm

Đây là bảng liên kết, lưu quan hệ nhiều-nhiều giữa nhóm và người dùng.

Các trường thông tin:

- <span style="color:red;font-weight:bold">**id:** BIGINT, PK, tự tăng</span>
- <span style="color:red;font-weight:bold">**groupId:** BIGINT, FK → UserGroup, NOT NULL — nhóm</span>
- <span style="color:red;font-weight:bold">**userId:** BIGINT, FK → UserAccount, NOT NULL — thành viên</span>
- <span style="color:red;font-weight:bold">**joinedBy:** BIGINT, FK → UserAccount — người thực hiện thêm thành viên</span>
- <span style="color:red;font-weight:bold">**joinedAt:** TIMESTAMP — thời điểm tham gia nhóm</span>

### 6.3. Bảng GroupFunction — Phân quyền chức năng cho nhóm

Đây là bảng liên kết nhiều-nhiều, lưu các chức năng được gán cho nhóm.

Các trường thông tin:

- <span style="color:red;font-weight:bold">**id:** BIGINT, PK, tự tăng</span>
- <span style="color:red;font-weight:bold">**groupId:** BIGINT, FK → UserGroup, NOT NULL — nhóm</span>
- <span style="color:red;font-weight:bold">**functionId:** BIGINT, FK → Function, NOT NULL — chức năng được gán</span>
- <span style="color:red;font-weight:bold">**assignedBy:** BIGINT, FK → UserAccount — người thực hiện gán</span>
- <span style="color:red;font-weight:bold">**assignedAt:** TIMESTAMP — thời điểm gán</span>

### 6.5. Các bảng liên quan (không thay đổi)

- **UserAccount:** id(BIGINT PK), username, email, passwordHash, roleId(FK→Role), organizationId(FK→Organization), status, createdAt, updatedAt
- **Organization:** id(BIGINT PK), name, code(UNIQUE), parentId(FK→Organization), type, status — danh sách đơn vị trong hệ thống
- **Function:** id(BIGINT PK), name, code(UNIQUE), parentId(FK→Function), description — cây chức năng hệ thống, đã có từ module xác thực & phân quyền

---

## 7. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng:

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/groups` | Danh sách nhóm (phân trang, tìm kiếm, lọc) | JWT |
| GET | `/api/v1/groups/{id}` | Chi tiết nhóm | JWT |
| POST | `/api/v1/groups` | Tạo nhóm mới | `group:create` |
| PUT | `/api/v1/groups/{id}` | Chỉnh sửa nhóm | `group:edit` |
| GET | `/api/v1/groups/{id}/permissions` | Danh sách mã quyền của nhóm | `group:permission` |
| PUT | `/api/v1/groups/{id}/permissions` | Cập nhật mã quyền của nhóm | `group:permission` |
| PATCH | `/api/v1/groups/{id}/lock` | Khóa/Mở khóa nhóm | `group:lock` |
| POST | `/api/v1/groups/{id}/members` | Thêm thành viên vào nhóm | `groupmember:manage` |
| DELETE | `/api/v1/groups/{groupId}/members/{userId}` | Xóa thành viên khỏi nhóm | `groupmember:manage` |
| GET | `/api/v1/groups/{id}/members` | Danh sách thành viên (phân trang) | `group:read` |

> **Ghi chú:** Permission `group:permission` kiểm soát cả việc mở popup và lưu danh sách mã quyền chức năng qua `PUT /api/v1/groups/{id}/permissions`. Danh sách quyền được lưu trực tiếp cho nhóm và được kế thừa bởi thành viên đang hoạt động.

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Tạo nhóm mới

Người dùng có quyền tạo nhóm điền form với các trường:

- **Đơn vị\* (bắt buộc):** Chọn đơn vị trên cây đơn vị. Nhóm sẽ trực thuộc đơn vị được chọn.
- **Tên nhóm\* (bắt buộc):** Nhập tên nhóm, độ dài 2-100 ký tự.
- **Mã nhóm\* (bắt buộc):** Nhập mã nhóm, độ dài 2-30 ký tự, chỉ gồm chữ hoa, số và gạch dưới.
- **Mô tả (tùy chọn):** Nhập mô tả mục đích của nhóm, tối đa 1000 ký tự.
- **Trạng thái\* (bắt buộc):** Chọn "Sử dụng" hoặc "Không sử dụng". Mặc định là "Sử dụng".

Hệ thống kiểm tra tên và mã chưa tồn tại trong hệ thống (BR-002-01, BR-002-03). Sau khi tạo thành công, hiển thị toast xác nhận kết quả.

### 8.2. Thêm người dùng vào nhóm

Người dùng click "Thêm thành viên vào nhóm người dùng" từ danh sách. Hệ thống mở popup "Thêm người dùng" với 2 khu vực: (1) form thêm thành viên với ô tìm kiếm và bảng người dùng chưa thuộc nhóm (có checkbox), (2) danh sách thành viên hiện tại. Khi thêm, hệ thống kiểm tra trùng lặp (BR-002-02 cho phép người dùng thuộc nhiều nhóm, nhưng không được thêm trùng vào cùng một nhóm). Khi xóa thành viên, quyền sử dụng chức năng thừa hưởng từ nhóm bị thu hồi (BR-002-06).

### 8.3. Phân quyền chức năng cho nhóm

Người dùng click "Phân quyền nhóm người dùng" từ danh sách, hệ thống mở drawer hiển thị sơ đồ cây chức năng. Người dùng tick chọn một hoặc nhiều chức năng cần gán cho nhóm. Khi lưu, hệ thống cập nhật danh sách chức năng của nhóm. Toàn bộ thành viên hiện tại và tương lai được thừa hưởng quyền sử dụng các chức năng đã gán cho nhóm (BR-002-05, BR-002-07).

### 8.4. Chỉnh sửa thông tin nhóm

Người dùng click "Sửa" trên một dòng nhóm trong danh sách. Hệ thống mở drawer chỉnh sửa với form các trường: Tên nhóm (bắt buộc, 2-100 ký tự), Mô tả (tùy chọn, tối đa 1000 ký tự), Trạng thái (bắt buộc, "Sử dụng"/"Không sử dụng"). Trường Đơn vị và Mã nhóm hiển thị ở chế độ read-only — không cho phép thay đổi sau khi tạo. Hệ thống kiểm tra tên nhóm không trùng với nhóm khác (BR-002-01). Sau khi lưu, hiển thị toast xác nhận.

### 8.5. Khóa/Mở khóa nhóm

Người dùng click "Khóa nhóm người dùng" trên nhóm đang "Sử dụng". Hệ thống hiển thị popup xác nhận kèm cảnh báo về hậu quả (toàn bộ thành viên bị tạm ngưng quyền thừa hưởng). Sau khi xác nhận, hệ thống chuyển trạng thái nhóm sang "Không sử dụng", tạm ngưng quyền thừa hưởng của toàn bộ thành viên (BR-002-08).

Ngược lại, khi nhóm đang "Không sử dụng", nút hiển thị là "Mở khóa nhóm người dùng". Người dùng click và xác nhận, hệ thống chuyển trạng thái sang "Sử dụng", khôi phục quyền thừa hưởng cho toàn bộ thành viên.

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- Danh sách nhóm phản hồi trong vòng 500ms với dưới 1000 nhóm
- Tìm kiếm thành viên để thêm vào nhóm phản hồi trong vòng 300ms
- Thêm thành viên hàng loạt (batch) hỗ trợ tối đa 100 thành viên/lần

### 9.2. Khả năng mở rộng

- Bảng UserGroup được thiết kế để hỗ trợ tới 10.000 nhóm
- Bảng GroupMember hỗ trợ tới 100.000 bản ghi

### 9.3. Bảo mật

- Phân quyền được áp dụng trên tất cả các API liên quan đến tính năng
- Mỗi endpoint được bảo vệ bởi permission tương ứng (`group:create`, `group:edit`, `group:lock`, `groupmember:manage`)
- Admin Cục có quyền xem full dữ liệu và thông tin kiểm toán (người tạo, người sửa, thời gian)

### 9.4. Độ tin cậy

- Khi khóa/mở khóa nhóm, toàn bộ thành viên được cập nhật trạng thái quyền đồng bộ

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: trên điện thoại (dưới 768px), thanh menu thu gọn
- Có loading skeleton khi đang tải dữ liệu
- Có trạng thái rỗng (empty state) với hướng dẫn thân thiện
- Tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA

### 9.6. Tuân thủ pháp lý


---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình Quản lý nhóm người dùng dùng chung bố cục toàn hệ thống, bao gồm:

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

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình Quản lý nhóm người dùng:

1. Nút "Thêm mới" trên ScreenHeader
2. Nút "Lưu" trong popup Phân quyền
3. Nút "Lưu" trong popup chỉnh sửa nhóm

Các màu trạng thái (xanh lá cho thành công, vàng cho cảnh báo, đỏ cho lỗi) và màu chữ không tính vào giới hạn này.

### 10.6. Màn hình danh sách nhóm (Group List)

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** hiển thị đường dẫn breadcrumb "Quản trị hệ thống > Quản lý nhóm người dùng". Nút "Thêm mới" (chỉ hiển thị khi có quyền `group:create`).

2. **FilterBar:** thanh lọc nằm ngang phía trên bảng, gồm 4 trường:

| Field | Type | Ghi chú |
|---|---|---|
| Đơn vị | TreeSelect | Chọn đơn vị trên cây đơn vị |
| Mã nhóm | Input text | Tìm kiếm tương đối (contains) |
| Tên nhóm | Input text | Tìm kiếm tương đối (contains) |
| Trạng thái | Select | "Sử dụng" / "Không sử dụng" |

3. **StatusTabs:** 3 tab nằm ngang: Tất cả, Đang sử dụng, Không sử dụng. Mỗi tab hiển thị số lượng nhóm trong nhóm đó. Tab đang chọn có đường gạch chân màu `actionPrimary`.

4. **DataTable:** bảng dữ liệu với tiêu đề cột cố định khi cuộn (sticky header), dòng được tô sáng khi di chuột qua (hover row). Các cột hiển thị:

| Cột | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Ghi chú |
|---|---|---|---|---|---|---|
| STT | Số thứ tự dòng | Text (tự động) | Không | Có | Tự động đánh số | Số thứ tự theo trang |
| Đơn vị | `organizationName` | Text | Không | Có | — | Tên đơn vị trực thuộc của nhóm |
| Mã nhóm | `code` | Text | Không (read-only sau khi tạo) | Có | — | — |
| Tên nhóm | `name` | Text | Có | Có | — | In đậm |
| Trạng thái | `status` | Select | Có | Có | "Sử dụng" | Badge: "Sử dụng" (xanh lá), "Không sử dụng" (xám) |
| Thao tác | — | Dropdown | — | — | — | Danh sách action bên dưới |

**Danh sách action trong cột Thao tác (chỉ hiển thị action có quyền):**

| Action | Permission | Mô tả |
|---|---|---|
| Xem chi tiết | `group:read` | Mở popup chi tiết nhóm (tab Thông tin / Thành viên / Lịch sử) |
| Sửa | `group:edit` | Mở popup chỉnh sửa thông tin nhóm |
| Khóa nhóm người dùng | `group:lock` | Khóa nhóm đang "Sử dụng"; nút đổi thành "Mở khóa nhóm người dùng" khi nhóm đang "Không sử dụng" |
| Phân quyền nhóm người dùng | `group:permission` | Mở popup cây chức năng để gán quyền |
| Thêm thành viên vào nhóm người dùng | `groupmember:manage` | Mở popup thêm người dùng vào nhóm |

5. **Pagination:** thanh điều hướng trang ở cuối bảng, hiển thị tổng số dòng và số trang.

### 10.7. Popup tạo mới/chỉnh sửa nhóm (Create/Edit Group)

Popup dùng chung cho cả tạo mới và chỉnh sửa. Khi ở chế độ chỉnh sửa, Đơn vị và Mã nhóm ở chế độ read-only.

| # | Field | Field Name | Type | Required | Validation | Placeholder | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Đơn vị | `organizationId` | TreeSelect | ✅ | Chọn một đơn vị trên cây đơn vị | — | Read-only khi sửa |
| 2 | Tên nhóm | `name` | Input text | ✅ | 2-100 ký tự; unique trong hệ thống (BR-002-01) | `Đội khảo sát A` | — |
| 3 | Mã nhóm | `code` | Input text | ✅ | 2-30 ký tự, chữ hoa + số + gạch dưới; unique (BR-002-03) | `DA` | Read-only khi sửa |
| 4 | Mô tả | `description` | TextArea | ❌ | Tối đa 1000 ký tự | `Mô tả mục đích của nhóm...` | — |
| 5 | Trạng thái | `status` | Select | ✅ | "Sử dụng" / "Không sử dụng" | — | Mặc định: "Sử dụng" |

**Popup footer:** [Hủy] [Lưu]

### 10.8. Popup xem chi tiết nhóm (Group Detail)

Layout dạng tab:

| Tab | Nội dung |
|---|---|
| Thông tin nhóm | Đơn vị, Tên nhóm, Mã nhóm, Mô tả, Trạng thái, Ngày tạo, Người tạo |
| Danh sách thành viên | Bảng thành viên (như popup thêm người dùng, chế độ xem) |

**Popup footer:** [Đóng]

### 10.9. Popup xác nhận khóa/mở khóa nhóm

**Khi khóa:** Nội dung: `Bạn có chắc chắn muốn khóa nhóm "{name}"? Toàn bộ thành viên trong nhóm sẽ bị tạm ngưng quyền sử dụng chức năng thừa hưởng từ nhóm.`

**Khi mở khóa:** Nội dung: `Bạn có chắc chắn muốn mở khóa nhóm "{name}"? Toàn bộ thành viên trong nhóm sẽ được khôi phục quyền sử dụng chức năng thừa hưởng từ nhóm.`

**Popup footer:** [Hủy] [Xác nhận]

### 10.10. Popup thêm người dùng

**Form thêm thành viên:**

| # | Field | Field Name | Type | Required | Validation | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Ô tìm kiếm | `search` | Input text | ❌ | Tối đa 100 ký tự, tìm theo họ tên hoặc email | Tìm kiếm tương đối (contains) |
| 2 | Danh sách người dùng | — | Table (có Checkbox) | ❌ | Chỉ hiển thị người dùng chưa thuộc nhóm | Cột: Checkbox, Họ tên, Email, Đơn vị. Hỗ trợ phân trang. |
| 3 | Nút Thêm | — | Button | — | Disabled nếu chưa chọn ai | Thêm toàn bộ người dùng đã tick checkbox vào nhóm; toast "Đã thêm X thành viên" |

**Danh sách thành viên hiện tại:**

| # | Cột | Data Index | Width | Ghi chú |
|---|---|---|---|---|
| 1 | STT | — | 50px | — |
| 2 | Họ và tên | `fullName` | 200px | — |
| 3 | Email | `email` | 200px | — |
| 4 | Ngày tham gia | `joinedAt` | 150px | Format `DD/MM/YYYY` |
| 5 | Hành động | — | 80px | Nút "Xóa" (icon thùng rác) |

**Popup footer:** [Đóng]

### 10.11. Popup phân quyền chức năng cho nhóm (Group Permission)

| # | Field | Field Name | Type | Required | Validation | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Ô tìm kiếm | — | Input text | ❌ | Tối đa 100 ký tự, tìm theo tên chức năng (contains) | Lọc danh sách chức năng hiển thị |
| 2 | Sơ đồ cây chức năng | — | Tree (có Checkbox) | ❌ | Tích sẵn các chức năng đã gán trước đó. Nút cha có thể mở rộng/thu gọn; checkbox cha tick/bỏ tick toàn bộ con; hỗ trợ indeterminate. | Chức năng hiển thị dạng cây phân cấp. Dữ liệu lấy từ danh sách chức năng hệ thống. |
| 3 | Nút Lưu | — | Button | — | — | Cập nhật danh sách chức năng của nhóm; toast "Đã cập nhật phân quyền" |
| 4 | Nút Đóng | — | Button | — | — | Đóng popup, không lưu |

### 10.12. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị spinner của Ant Design hoặc khung xương (skeleton) — không hiển thị bảng trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng và dòng chữ "Chưa có nhóm nào" với màu chữ `textSecondary` và cỡ chữ `fontSizeMd`.
- **Lỗi tải dữ liệu:** hiển thị cảnh báo đỏ và nút "Thử lại" màu `actionPrimary`.

### 10.13. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger 80px
- Bảng dữ liệu chuyển thành dạng thẻ (card)
- Thanh lọc chuyển thành panel có thể gập/mở
- Popup thu nhỏ còn 90% chiều rộng màn hình

### Quy ước chung

- **Form layout**: vertical, label đậm, `marginBottom: spaceFormField` (12px) cho Form.Item
- **Input/Select**: `borderRadius: radiusPill` (999px), `height: 40px`
- **Validation**: realtime (khi blur), error message hiển thị dưới field
- **Submit button**: disabled khi form có lỗi, loading khi đang submit, toast notification khi thành công/thất bại
- **Popup footer**: [Hủy] outlined + [Submit] primary, cả hai pill radius
- **Quyền (permission-based)**: Xem chi tiết=`group:read`, Sửa=`group:edit`, Khóa/Mở khóa=`group:lock`, Phân quyền=`group:permission`, Thêm thành viên=`groupmember:manage`
