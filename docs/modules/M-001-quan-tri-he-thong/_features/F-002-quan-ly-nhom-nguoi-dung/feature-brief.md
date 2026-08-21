---
id: F-002
name: Quản lý nhóm người dùng
slug: quan-ly-nhom-nguoi-dung
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-17
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý nhóm người dùng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-002
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Quản lý tập trung các nhóm người dùng (UserGroup): tạo mới, chỉnh sửa, khóa/mở khóa nhóm theo đơn vị trực thuộc, thêm/xóa người dùng vào nhóm và **gán quyền cho nhóm** (tích chọn quyền trên cây quyền — màn "Phân quyền nhóm"). Thành viên nhóm được thừa hưởng quyền của nhóm; khi rời nhóm hoặc nhóm bị khóa, quyền thừa hưởng bị thu hồi/tạm ngưng (quyền gán riêng không bị ảnh hưởng). Hỗ trợ tra cứu, tìm kiếm, lọc và phân trang danh sách nhóm. **Không có chức năng xóa nhóm** — vô hiệu hóa bằng khóa. Một người dùng có thể thuộc nhiều nhóm; quyền của một tài khoản = quyền gán riêng + quyền của các nhóm đang thuộc (tài liệu nền mục 3.2).

## 2. Trường dữ liệu

### 2.1. Form Tạo mới / Chỉnh sửa nhóm (popup dùng chung)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị | Có | TreeSelect dạng cây (orgUnitId) | Nhóm trực thuộc đơn vị chọn; read-only khi sửa |
| 2 | Tên nhóm | Có | Text, 2-100 ký tự; unique toàn hệ thống | BR-002-01 |
| 3 | Mã nhóm | Có | Text, 2-30 ký tự, chữ hoa + số + gạch dưới; unique | BR-002-03; read-only khi sửa |
| 4 | Mô tả | Không | TextArea, max 1000 ký tự | — |
| 5 | Trạng thái | Có | Select: "Sử dụng" / "Không sử dụng"; default "Sử dụng" | Khóa nhóm qua thao tác riêng (PATCH lock) |

### 2.2. Popup thêm thành viên

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Ô tìm kiếm | Không | Text, max 100 ký tự | Tìm theo họ tên hoặc email (contains) |
| 2 | Danh sách người dùng | Không | Table có Checkbox, phân trang | Chỉ hiển thị người dùng chưa thuộc nhóm; cột: Checkbox, Họ tên, Email, Đơn vị |
| 3 | Nút Thêm | — | Button | Disabled nếu chưa chọn ai; toast "Đã thêm X thành viên" |

### 2.3. Popup chi tiết nhóm (tab Thông tin)

| # | Trường | Ghi chú |
|---|---|---|
| 1 | Đơn vị | organizationName |
| 2 | Tên nhóm | name |
| 3 | Mã nhóm | code |
| 4 | Mô tả | description |
| 5 | Trạng thái | "Sử dụng" / "Không sử dụng" |
| 6 | Ngày tạo / Người tạo | createdAt / createdBy (Admin Cục xem thêm metadata theo mục 3.8 nền) |

## 3. Trạng thái và phê duyệt

Theo tài liệu nền (mục 3.7) — trạng thái lưu dạng **số** (INT): **Sử dụng** (hoạt động — thành viên thừa hưởng quyền của nhóm) / **Không sử dụng** (nhóm bị khóa — quyền thừa hưởng của toàn bộ thành viên bị tạm ngưng; khi mở khóa thì khôi phục — BR-002-08). Mặc định khi tạo: "Sử dụng". **Không có bước phê duyệt.** Khóa/mở khóa nhóm thực hiện trực tiếp bởi tài khoản có quyền `group:lock` (không qua duyệt).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (BR-002-01..BR-002-12)

- BR-002-01 — Tên nhóm (name) duy nhất toàn hệ thống; trùng khi tạo/sửa → từ chối, hiển thị "Tên nhóm đã tồn tại".
- BR-002-02 — Một người dùng có thể là thành viên của nhiều nhóm cùng lúc; không giới hạn số lượng. Không được thêm trùng vào cùng một nhóm.
- BR-002-03 — Mã nhóm (code) duy nhất toàn hệ thống; định dạng chữ hoa + số + gạch dưới, dài 2-30 ký tự. Trùng khi tạo → "Mã nhóm đã tồn tại".
- BR-002-05 — Tài khoản có quyền gán quyền có thể gán một hoặc nhiều quyền (chức năng) cho nhóm; toàn bộ thành viên trong nhóm thừa hưởng quyền sử dụng các chức năng được gán.
- BR-002-06 — Khi thành viên rời khỏi nhóm (bị xóa khỏi nhóm), quyền thừa hưởng từ nhóm bị thu hồi; quyền gán trực tiếp cho người dùng (từ F-001) không bị ảnh hưởng.
- BR-002-07 — Khi thêm thành viên mới vào nhóm, thành viên tự động có quyền sử dụng các chức năng đã gán cho nhóm (kế thừa ngay).
- BR-002-08 — Khi nhóm bị khóa (chuyển "Không sử dụng"), toàn bộ thành viên bị tạm ngưng quyền thừa hưởng từ nhóm; quyền gán trực tiếp không bị ảnh hưởng. Khi mở khóa (chuyển "Sử dụng"), quyền thừa hưởng được khôi phục.
- BR-002-09 — Nhóm bắt buộc thuộc một đơn vị: khi tạo phải chọn đơn vị trực thuộc trên cây đơn vị (TreeSelect, `organizationId`); trường Đơn vị bắt buộc (NOT NULL — enforce qua `CreateUserGroupRequest` `@NotNull`).
- BR-002-10 — Đơn vị của nhóm không được đổi sau khi tạo: khi sửa, trường Đơn vị read-only (chỉ đổi Tên, Mô tả, Trạng thái).
- BR-002-11 — Người thao tác chỉ được tạo/sửa/khóa nhóm trong phạm vi đơn vị được phân quyền (OrgUnitScopeService); ngoài phạm vi → 403 Forbidden. Đơn vị của nhóm KHÔNG mở rộng phạm vi dữ liệu của thành viên — view dữ liệu theo đơn vị của tài khoản + `orgunit:scope_all` (tài liệu nền mục 3.3).
- BR-002-12 — `orgunit:scope_all`, `admin:all`, `admin:manage`, `group:manage`, `*` chỉ được gán trực tiếp cho tài khoản; nhóm KHÔNG thừa kế (khớp `User.getAllPermissions()`, tài liệu nền mục 3.2).
- Quy tắc chung bổ sung (tài liệu nền mục 3.2): quyền mới phải đăng ký trong `PermissionSeeder.java`; nhóm là động — thêm/sửa/xóa/đổi quyền bất kỳ lúc nào; tài khoản có quyền đặc biệt ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN vượt qua mọi kiểm tra quyền.

### 4.2. Acceptance criteria kế thừa (AC-002-01..AC-002-16)

- AC-002-01 — Tạo nhóm thành công: trạng thái mặc định "Sử dụng", toast "Đã tạo thành công"; trùng tên → "Tên nhóm đã tồn tại"; trùng mã → "Mã nhóm đã tồn tại".
- AC-002-02 — Tạo thất bại do trùng tên (nhóm không được tạo). AC-002-03 — Tạo thất bại do trùng mã.
- AC-002-04 — Thêm thành viên chưa thuộc nhóm → toast "Đã thêm thành viên". AC-002-05 — Thêm trùng → lỗi "Người dùng đã thuộc nhóm này".
- AC-002-06 — Xóa thành viên khỏi nhóm (sau xác nhận): tài khoản người dùng không bị ảnh hưởng; thành viên không tồn tại trong nhóm → lỗi phù hợp.
- AC-002-07 — Tìm kiếm nhóm theo tên/mã (contains), kết quả phân trang chính xác; không có kết quả → trạng thái rỗng.
- AC-002-08 — Xem danh sách (view-only): tài khoản chỉ có quyền xem → không hiển thị nút Thêm mới và các nút thao tác trên dòng.
- AC-002-09 — Xem nhóm cá nhân (myGroups): tài khoản thông thường chỉ thấy các nhóm mình tham gia; không tham gia nhóm nào → trạng thái rỗng.
- AC-002-10 — Sửa nhóm thành công: Đơn vị và Mã nhóm không được thay đổi sau khi tạo; trùng tên → "Tên nhóm đã tồn tại"; toast "Đã lưu thành công".
- AC-002-11 — Sửa thất bại do trùng tên (thông tin không cập nhật).
- AC-002-12 — Gán quyền cho nhóm: tick chọn trên cây quyền → lưu → toàn bộ thành viên hiện tại có quyền được gán; bỏ chọn tất cả → nhóm không còn quyền nào được gán.
- AC-002-13 — Thành viên mới vào nhóm đã gán quyền → tự động thừa hưởng toàn bộ quyền của nhóm.
- AC-002-14 — Xem chi tiết nhóm: drawer 2 tab "Thông tin nhóm" + "Danh sách thành viên" (bảng phân trang). **Không có chức năng lịch sử nhóm.** Nhóm không tồn tại → hiển thị lỗi.
- AC-002-15 — Khóa nhóm: nhóm đang "Sử dụng" → xác nhận → chuyển "Không sử dụng", tạm ngưng quyền thừa hưởng của toàn bộ thành viên, toast "Đã khóa nhóm"; khi nhóm đã "Không sử dụng", nút hiển thị "Mở khóa nhóm người dùng".
- AC-002-16 — Mở khóa nhóm: nhóm đang "Không sử dụng" → xác nhận → chuyển "Sử dụng", khôi phục quyền thừa hưởng, toast "Đã mở khóa nhóm".

### 4.3. User stories kế thừa (US-002-01..US-002-09, MoSCoW)

- US-002-01 (Must) — Tạo nhóm mới với tên, mã, đơn vị, trạng thái để tổ chức người dùng theo đơn vị trực thuộc.
- US-002-02 (Must) — Thêm người dùng vào nhóm / xóa người dùng khỏi nhóm để quản lý danh sách thành viên.
- US-002-03 (Must) — Gán quyền cho nhóm để toàn bộ thành viên thừa hưởng quyền sử dụng các chức năng được gán.
- US-002-04 (Must) — Chỉnh sửa thông tin nhóm (tên, mô tả, trạng thái) khi có thay đổi.
- US-002-05 (Must) — Khóa nhóm để tạm ngưng quyền của toàn bộ thành viên khi nhóm không còn hoạt động.
- US-002-06 (Should) — Tìm kiếm và lọc danh sách nhóm theo đơn vị, mã nhóm, tên nhóm, trạng thái.
- US-002-07 (Should) — Xem chi tiết nhóm và danh sách thành viên để kiểm tra thông tin nhóm. (Không có chức năng lịch sử thay đổi nhóm — khớp AC-002-14 "Không có chức năng lịch sử nhóm".)
- US-002-08 (Should) — Xem danh sách nhóm và thành viên để nắm cơ cấu tổ chức theo đơn vị.
- US-002-09 (Could) — Xem danh sách các nhóm mà tôi đang tham gia.

### 4.4. Luồng nghiệp vụ chi tiết kế thừa (tóm tắt từ brief cũ mục 1.3)

- **Danh sách:** bảng STT, Đơn vị, Mã nhóm, Tên nhóm, Trạng thái, Thao tác; lọc theo Đơn vị (cây), Mã nhóm, Tên nhóm, Trạng thái; phân trang.
- **Tạo:** popup form 5 trường; kiểm tra tên/mã chưa tồn tại (BR-002-01/03); toast "Đã tạo thành công"; ghi nhận vào lịch sử (mục 3.8 nền).
- **Chi tiết:** tab Thông tin + tab Danh sách thành viên.
- **Sửa:** Tên nhóm, Mô tả, Trạng thái; Đơn vị + Mã nhóm read-only; kiểm tra trùng tên (BR-002-01); toast "Đã lưu thành công".
- **Thêm/Xóa thành viên:** popup tìm kiếm + checkbox; kiểm tra chưa thuộc nhóm (BR-002-02); xóa thành viên → thu hồi quyền thừa hưởng (BR-002-06).
- **Phân quyền nhóm:** popup cây quyền, tick sẵn các quyền đã gán; lưu → cập nhật danh sách quyền của nhóm (BR-002-05/07); toast "Đã cập nhật phân quyền".
- **Khóa/Mở khóa:** popup xác nhận kèm cảnh báo hậu quả ("Bạn có chắc chắn muốn khóa nhóm '{tên nhóm}'? Toàn bộ thành viên trong nhóm sẽ bị tạm ngưng quyền sử dụng chức năng thừa hưởng từ nhóm."); chuyển trạng thái + tạm ngưng/khôi phục quyền (BR-002-08).

### 4.5. Phân quyền riêng

Quyền theo mẫu `<resource>:<action>`, gán động qua nhóm/tài khoản (tài liệu nền mục 3.2); quyền mới phải đăng ký trong `PermissionSeeder.java`.

| Thao tác | Quyền cần có | Ghi chú |
|---|---|---|
| Xem danh sách / chi tiết nhóm | `group:read` | — |
| Tạo nhóm | `group:create` | — |
| Sửa thông tin nhóm | `group:edit` | — |
| Khóa / Mở khóa nhóm | `group:lock` | — |
| Mở popup Phân quyền + lưu quyền của nhóm | `group:permission` | Kiểm soát cả mở popup lẫn `PUT /groups/{id}/permissions` |
| Thêm / Xóa thành viên | `groupmember:manage` | — |
| Xem danh sách nhóm của mình (myGroups) | JWT (tự quản) | Chỉ nhóm mình tham gia |

Bảng vai trò × thao tác (mô hình cũ — **đã thay thế** bằng bảng trên): Admin full CRUD; Lãnh đạo view; Cán bộ view + edit + thành viên; Cá nhân self only. Trong mô hình động, các phạm vi này thể hiện qua tổ hợp quyền + đơn vị trực thuộc (tài liệu nền 3.2); ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN vượt qua mọi kiểm tra quyền.

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật) trên màn chi tiết nhóm; các tài khoản khác không thấy các trường này.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 2 trạng thái INT: Sử dụng / Không sử dụng (mặc định Sử dụng) |
| 2 | Có bước phê duyệt không | Không |
| 3 | Lọc cha-con / theo đơn vị | Có — nhóm trực thuộc đơn vị (orgUnitId, TreeSelect); lọc danh sách theo đơn vị; xem nhóm của mình (myGroups) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Đơn vị + Mã nhóm chỉ nhập khi tạo, read-only khi sửa; nút "Khóa"/"Mở khóa" tùy trạng thái hiện tại của nhóm; nút "Phân quyền" chỉ hiện khi có `group:permission` |
| 5 | Quyền riêng | `group:create`, `group:edit`, `group:lock`, `group:permission`, `group:read`, `groupmember:manage` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — popup chi tiết dạng 2 tab (Thông tin / Thành viên); popup Phân quyền hiển thị cây quyền có checkbox (tick sẵn quyền đã gán, hỗ trợ indeterminate); popup Thêm người dùng gồm form tìm kiếm + bảng checkbox + danh sách thành viên hiện tại |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/groups` | Danh sách nhóm (phân trang, tìm kiếm, lọc đơn vị/tên/mã/trạng thái; `myGroups=true` cho nhóm của mình) | `group:read` |
| GET | `/api/groups/{id}` | Chi tiết nhóm | `group:read` |
| POST | `/api/groups` | Tạo nhóm mới | `group:create` |
| PUT | `/api/groups/{id}` | Chỉnh sửa nhóm (Đơn vị + Mã nhóm không đổi) | `group:edit` |
| GET | `/api/groups/{id}/permissions` | Danh sách mã quyền của nhóm | `group:permission` |
| PUT | `/api/groups/{id}/permissions` | Cập nhật mã quyền của nhóm | `group:permission` |
| PATCH | `/api/groups/{id}/lock` | Khóa / Mở khóa nhóm (toggle) | `group:lock` |
| GET | `/api/groups/{id}/members` | Danh sách thành viên (phân trang) | `group:read` |
| POST | `/api/groups/{id}/members` | Thêm thành viên vào nhóm (batch ≤100/lần) | `groupmember:manage` |
| DELETE | `/api/groups/{groupId}/members/{userId}` | Xóa thành viên khỏi nhóm | `groupmember:manage` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `UserGroup` (nhóm người dùng):** id, organizationId (FK → org_units, NOT NULL — đơn vị trực thuộc), name (VARCHAR(100) NOT NULL — unique toàn hệ thống), code (VARCHAR(30) UNIQUE NOT NULL — chữ hoa + số + gạch dưới), description (TEXT), status (INT: 0=Không sử dụng, 1=Sử dụng; default 1), createdBy (FK → UserAccount), createdAt, updatedBy (FK → UserAccount, NULL), updatedAt. ~~groupType (VARCHAR — không có trong brief hiện hành)~~.

**Bảng `GroupMember` (thành viên nhóm):** id, groupId (FK → UserGroup, NOT NULL), userId (FK → UserAccount, NOT NULL), joinedBy (FK → UserAccount), joinedAt. Ràng buộc unique (groupId, userId) — không thêm trùng (BR-002-02).

**Bảng gán quyền cho nhóm (màn Phân quyền nhóm F-002):** lưu danh sách mã quyền (`<resource>:<action>`) được gán trực tiếp cho nhóm; thành viên kế thừa qua cơ chế quyền động (tài liệu nền 3.2) — cấu trúc chi tiết do SA chốt (API `GET/PUT /groups/{id}/permissions`).

**Bảng liên quan (không thuộc F-002):** ~~GroupHistory (brief hiện hành AC-002-14 ghi không có chức năng lịch sử nhóm)~~; UserAccount + quyền gán riêng (F-001); org_units (F-003); bảng quyền hệ thống đã có từ module xác thực & phân quyền.
