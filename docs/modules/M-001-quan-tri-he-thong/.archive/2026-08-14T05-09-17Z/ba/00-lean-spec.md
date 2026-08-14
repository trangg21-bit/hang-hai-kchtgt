# Lean Spec — Tách ô tìm kiếm màn hình Quản lý người dùng (F-001)

**Module:** M-001 — Quản trị hệ thống
**Feature:** F-001 — Quản lý tài khoản người dùng (màn danh sách — bộ lọc)
**Nguồn:** Triage `TRI-1786680781355-486b` (change_class: C2, change_type: business_rule)
**Loại tài liệu:** BA Lean Spec (canonical cho thay đổi bộ lọc tìm kiếm F-001)
**Ngày viết:** 2026-08-14
**Trạng thái:** proposed

---

## 1. Phạm vi

Tách **một ô tìm kiếm** hiện tại của bộ lọc màn danh sách người dùng thành **hai ô input riêng biệt**:

| Ô input | Tham số API | Ý nghĩa |
|---|---|---|
| Ô 1 — "Tìm theo email / tên đăng nhập" | `search` | Khớp **email HOẶC username** |
| Ô 2 — "Tìm theo họ tên" | `fullName` | Khớp **họ tên (fullName)**, tương đối, không phân biệt dấu |

Không đổi schema DB, không đổi phân trang, không đổi các bộ lọc hiện có (trạng thái, đơn vị), không đổi các màn hình khác.

## 2. Hành vi hiện tại (baseline — đã xác minh bằng source anchor)

- **API:** `GET /api/users` (alias `GET /api/v1/users`), `UserController.java:44`. Method `list(...)` nhận `@RequestParam(required = false) String search`, `UserStatus status`, `UUID orgUnitId`, `page`, `size`, `sortField`, `sortOrder` — `UserController.java:85-92`; gọi `userService.findAllWithCounts(search, status, orgUnitId, pageable)` — `UserController.java:102`.
- **Service:** `findAllWithCounts(...)` tạo `String searchLike = toSearchLike(search)` rồi gọi `searchUserList` / `searchUserListByOrgUnits`, đồng thời gọi `getStatusCounts(search, organizationFilter)` → `countUsersByStatus` / `countUsersByStatusAndOrgUnits` — `UserService.java:207-268`. Comment tại `UserService.java:230-232`: *"The status tabs must describe the same filtered result set as the table."*
- **Repository:** cả 5 query (`countUsersByStatus`, `countUsersByStatusAndOrgUnits`, `searchUsers`, `searchUserList`, `searchUserListByOrgUnits`) đều so **một** param `:search` với `fullName OR email OR username` qua `CAST(function('immutable_unaccent', LOWER(...)) AS string) LIKE CAST(:search AS string)` — `UserRepository.java` (các query đếm/liệt kê kể trên).
- **Chuẩn hóa từ khóa:** `toSearchLike(String keyword)` — `UserService.java:341-350`: `Normalizer.normalize(..., NFD)` + bỏ ký tự dấu (`\p{M}+`) + `đ→d` + bọc `%...%`; comment ghi rõ *"Kết quả vẫn dùng LIKE chứa nên \"Van A\" khớp \"Nguyễn Văn An\""*.
- **Phân quyền truy cập API:** `@PreAuthorize("@auth.check(authentication, 'user:read')")` — `UserController.java:84`.

## 3. Quy tắc nghiệp vụ mới (Business Rules)

**BR-001-07 — `search` = email HOẶC username (contains, case-insensitive):** Tham số `search` chỉ khớp `u.email` HOẶC `u.username` theo kiểu LIKE chứa (relative contains), không phân biệt hoa/thường. `search` **không còn khớp theo họ tên**. Input rỗng/whitespace/null → bỏ điều kiện này.

**BR-001-08 — `fullName` = họ tên, không phân biệt dấu (accent-insensitive):** Tham số `fullName` khớp `u.fullName` theo kiểu LIKE chứa, áp dụng chuẩn hóa hiện có `toSearchLike` (NFD + bỏ dấu + `đ→d`): input **không dấu** vẫn khớp tên **có dấu** — ví dụ `"van a"` khớp `"Nguyễn Văn An"`; `"nguyen van an"` cũng cho cùng kết quả. Input rỗng/whitespace/null → bỏ điều kiện này.

**BR-001-09 — Kết hợp AND toàn bộ bộ lọc:** `search`, `fullName`, trạng thái (`status`) và đơn vị (`orgUnitId`) kết hợp với nhau bằng AND. Tham số không được cung cấp → không áp dụng điều kiện tương ứng.

**BR-001-10 — Số đếm tab trạng thái phản ánh đúng bộ lọc kết hợp:** `statusCounts` (số đếm các tab trạng thái) phải được tính trên **cùng tập filter kết hợp** như bảng kết quả (`search` + `fullName` + `orgUnit` + trạng thái hiện hành của tab), không phải số liệu toàn bộ DB khi đang tìm kiếm. Tổng tab "Tất cả" = tổng các tab còn lại.

**BR-001-11 — Chuẩn hóa input và quy ước ngôn ngữ:** Mọi ô tìm kiếm được `trim()` trước khi gửi API. Tên cột/tham số/biến dùng tiếng Anh chuẩn (`search`, `fullName`, `email`, `username`); nhãn UI, placeholder và thông báo dùng tiếng Việt có dấu.

## 4. Acceptance Criteria

**AC-001-15 — Hiển thị 2 ô tìm kiếm riêng biệt:** Given người dùng mở màn danh sách người dùng, When xem FilterBar, Then thấy 2 ô input riêng: ô "Tìm theo email / tên đăng nhập" và ô "Tìm theo họ tên"; nhập 1 ô không ảnh hưởng ô còn lại.

**AC-001-16 — `search` chỉ khớp email/username:** Given nhập `NGUYEN` vào ô email / tên đăng nhập, When nhấn Tìm kiếm, Then danh sách chỉ gồm user có `email` HOẶC `username` chứa "nguyen" (không phân biệt hoa/thường); user chỉ khớp theo họ tên (ví dụ "Nguyễn Văn An") **không** xuất hiện. Nếu không khớp ai → bảng rỗng + empty state.

**AC-001-17 — `fullName` không phân biệt dấu:** Given nhập `van a` vào ô "Tìm theo họ tên", When tìm kiếm, Then "Nguyễn Văn An" xuất hiện trong kết quả; nhập `nguyễn văn an` (có dấu) cũng cho cùng kết quả. Given nhập `van a` vào ô email/tên đăng nhập (ô 1), When tìm kiếm, Then không ra "Nguyễn Văn An" (khẳng định tách biệt 2 ô).

**AC-001-18 — Kết hợp AND với trạng thái và đơn vị:** Given người dùng chọn tab trạng thái "Hoạt động", chọn đơn vị X, nhập cả 2 ô tìm kiếm, When tìm kiếm, Then kết quả = giao của tất cả điều kiện (search ∧ fullName ∧ status ∧ orgUnit); số đếm trên các tab trạng thái và tổng số record được tính trên cùng tập filter kết hợp này, không phải toàn bộ DB.

**AC-001-19 — Input trống/whitespace và kết quả rỗng:** Given một hoặc cả hai ô tìm kiếm chỉ chứa khoảng trắng, When tìm kiếm, Then ô đó được coi như không có bộ lọc (không báo lỗi). Given tổ hợp bộ lọc không khớp bản ghi nào, When tìm kiếm, Then bảng hiển thị empty state và số đếm tab "Tất cả" = 0.

## 5. API contract

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/users` (alias `/api/users`) | Danh sách người dùng phân trang kèm `statusCounts` | `user:read` (`UserController.java:84`) |

**Tham số:**

| Param | Bắt buộc | Kiểu | Ý nghĩa |
|---|---|---|---|
| `search` | Không | String | Từ khóa khớp `email` HOẶC `username`, LIKE contains, case-insensitive (thu hẹp từ hành vi cũ: không khớp họ tên) |
| `fullName` | **Mới** | String | Từ khóa khớp `fullName`, LIKE contains, không phân biệt dấu (qua `toSearchLike`) |
| `status` | Không | UserStatus | Lọc theo trạng thái (không đổi) |
| `orgUnitId` | Không | UUID | Lọc theo đơn vị + cây con (không đổi) |
| `page` / `size` / `sortField` / `sortOrder` | Không | — | Phân trang/sắp xếp (không đổi; mặc định 20 dòng/trang, tối đa 100) |

**Ví dụ:** `GET /api/v1/users?search=nguyen&fullName=van%20a&status=ACTIVE&orgUnitId=...`

**Response:** giữ nguyên cấu trúc `UserPageResponse` (`content`, `page`, `size`, `totalElements`, `totalPages`, `statusCounts`).

> Ghi chú triển khai (không đổi semantics): backend có thể tiếp tục dùng `toSearchLike` cho cả `search` và `fullName` — việc lowercase + bỏ dấu trên email/username (ASCII) là superset của case-insensitive, không làm thay đổi hành vi quan sát được ở BR-001-07.

## 6. Phân quyền / ranh giới dữ liệu

- Bộ lọc không làm thay đổi phạm vi dữ liệu: phạm vi đơn vị của người gọi (Admin Cục xem full dữ liệu; các vai trò khác giới hạn theo cây đơn vị) vẫn do `resolveOrganizationFilter` hiện hành đảm bảo — `UserService.java:307-333`. API vẫn yêu cầu `user:read`.
- **Không áp dụng** logic phê duyệt/vòng đời tài khoản — ngoài phạm vi thay đổi này.

## 7. Ngoài phạm vi (Non-goals)

- Không thêm/bỏ cột DB, không migration, không đổi entity.
- Không đổi phân trang, sắp xếp, các bộ lọc khác (status, orgUnit), các tab trạng thái.
- Không đổi các màn hình/module khác ngoài bộ lọc F-001.
- Không thay đổi placeholder dữ liệu (không gán dữ liệu giả) — nguyên tắc "Data thật - Không gán mặc định".

## 8. Nguồn bằng chứng (evidence anchors)

- `UserController.java:44` (base path), `:84-92` (list + params), `:102` (gọi service).
- `UserService.java:190-238` (findAllWithCounts), `:230-232` (counters = cùng tập filter), `:261-291` (getStatusCounts), `:341-350` (toSearchLike), `:307-333` (resolveOrganizationFilter).
- `UserRepository.java` — 5 query dùng chung 1 param `:search` so `fullName OR email OR username` (countUsersByStatus, countUsersByStatusAndOrgUnits, searchUsers, searchUserList, searchUserListByOrgUnits).
- `feature-brief.md` F-001 — AC-001-07 (dòng ~119), FilterBar (dòng ~570).
- Triage `docs/intel/_intake/TRI-1786680781355-486b.json` — done_oracle: "Bộ lọc hiển thị 2 ô input riêng biệt: ô 1 tìm theo email + username, ô 2 tìm theo họ tên (gõ không dấu vẫn khớp tên có dấu); bảng kết quả và số đếm các tab trạng thái phản ánh đúng bộ lọc kết hợp".
