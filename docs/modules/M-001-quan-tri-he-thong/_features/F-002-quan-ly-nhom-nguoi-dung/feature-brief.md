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
# Feature: Quản lý nhóm người dùng

## Description

Quản lý tập trung các nhóm người dùng trong hệ thống, cho phép tạo mới, chỉnh sửa, xóa các nhóm theo loại (department/project/custom), quản lý thành viên nhóm (thêm/xóa), phân quyền cho nhóm (gán vai trò để thành viên thừa hưởng quyền), và tra cứu lịch sử thay đổi. Tính năng hỗ trợ tra cứu, tìm kiếm và phân trang danh sách nhóm với các bộ lọc thông minh.

## Business Intent

Quản trị hệ thống cần cơ chế phân nhóm người dùng linh hoạt để tổ chức cán bộ theo đơn vị, dự án hoặc nhóm công việc đặc thù, giúp tối ưu hóa việc gán quyền, chia sẻ dữ liệu và phối hợp nghiệp vụ giữa các thành viên trong cùng nhóm.

## Flow Summary

Quản trị hệ thống truy cập module Quản lý nhóm từ sidebar → chọn tạo nhóm mới hoặc quản lý nhóm hiện có → điền thông tin nhóm (tên, mã, loại nhóm, mô tả) → hệ thống kiểm tra tên nhóm unique → tạo nhóm thành công → thêm/xóa thành viên từ danh sách người dùng hệ thống → phân quyền cho nhóm bằng cách gán vai trò (Role) → hệ thống ghi nhận lịch sử thay đổi nhóm → hiển thị danh sách nhóm với khả năng lọc theo tên, loại nhóm, số lượng thành viên và phân trang. Quy trình mở rộng bao gồm: xem chi tiết thành viên từng nhóm, phân quyền cho nhóm (thành viên thừa hưởng quyền từ vai trò được gán), và quản lý lịch sử thay đổi nhóm.

## Acceptance Criteria (BDD)

| ID | Scenario | Given | When | Then | Priority |
|---|---|---|---|---|---|
| AC-001 | Tạo nhóm thành công | Người dùng là Admin, tên nhóm "Đội A" chưa tồn tại | Nhập name="Đội A", code="DA", groupType="department" và nhấn Tạo | Nhóm được tạo, toast "Đã tạo thành công" | Critical |
| AC-002 | Tạo nhóm thất bại — trùng tên | Người dùng là Admin, tên nhóm "Đội A" đã tồn tại | Nhập name="Đội A" (trùng) và nhấn Tạo | Hiển thị lỗi "Tên nhóm đã tồn tại", nhóm không được tạo | Critical |
| AC-003 | Tạo nhóm thất bại — trùng mã | Người dùng là Admin, mã nhóm "DA" đã tồn tại | Nhập code="DA" (trùng) và nhấn Tạo | Hiển thị lỗi "Mã nhóm đã tồn tại", nhóm không được tạo | Critical |
| AC-004 | Xóa nhóm thất bại — còn thành viên | Nhóm "Đội A" có 2 thành viên, người dùng là Admin | Nhấn Xóa nhóm | Hiển thị lỗi "Không thể xóa nhóm còn thành viên" | Critical |
| AC-005 | Xóa nhóm thành công | Nhóm "Đội A" không còn thành viên, người dùng là Admin | Nhấn Xóa và xác nhận | Nhóm bị xóa, toast "Đã xóa thành công" | Critical |
| AC-006 | Thêm thành viên vào nhóm | Nhóm "Đội A" tồn tại, user "U001" chưa thuộc nhóm | Chọn user "U001", nhấn Thêm | Thành viên được thêm, toast "Đã thêm thành viên" | Critical |
| AC-007 | Thêm thành viên thất bại — trùng lặp | Nhóm "Đội A" đã có user "U001" | Chọn user "U001" và nhấn Thêm | Hiển thị lỗi "Người dùng đã thuộc nhóm này" | Major |
| AC-008 | Xóa thành viên khỏi nhóm | Nhóm "Đội A" có user "U001" | Nhấn Xóa thành viên "U001" và xác nhận | Thành viên bị xóa khỏi nhóm, UserAccount không bị ảnh hưởng | Major |
| AC-009 | Tìm kiếm nhóm theo tên | Có 5 nhóm trong hệ thống | Nhập từ khóa "Đội" vào ô tìm kiếm | Danh sách nhóm chứa từ khóa "Đội", phân trang chính xác | Major |
| AC-011 | Lọc nhóm theo loại | Có nhóm loại department và project | Chọn filter groupType="department" | Chỉ hiển thị nhóm có groupType="department" | Major |
| AC-012 | Xem danh sách nhóm (view-only) | Người dùng là Lãnh đạo | Truy cập danh sách nhóm | Xem được danh sách; không hiển thị nút Thêm/Sửa/Xóa | Major |
| AC-013 | Xem nhóm cá nhân (myGroups) | Người dùng là Cá nhân, thuộc 2 nhóm | Truy cập danh sách nhóm | Chỉ hiển thị 2 nhóm mà user tham gia | Minor |
| AC-014 | Chỉnh sửa nhóm thành công | Nhóm "Đội A" tồn tại, người dùng là Admin hoặc Cán bộ | Sửa name="Đội A Mới", description="Mô tả mới", nhấn Lưu | Thông tin nhóm được cập nhật, toast "Đã lưu thành công" | Major |
| AC-015 | Chỉnh sửa nhóm thất bại — trùng tên | Nhóm "Đội A" và "Đội B" tồn tại | Sửa tên "Đội B" thành "Đội A" và nhấn Lưu | Hiển thị lỗi "Tên nhóm đã tồn tại" | Critical |
| AC-016 | Gán vai trò cho nhóm | Nhóm "Đội A" tồn tại, chưa có vai trò nào được gán | Mở modal Phân quyền, tick chọn 2 vai trò, nhấn Lưu | Nhóm được gán 2 vai trò; toàn bộ thành viên hiện tại có quyền từ 2 vai trò đó; GroupHistory ghi nhận | Major |
| AC-017 | Thành viên mới tự động có quyền từ nhóm | Nhóm "Đội A" đã được gán vai trò "Cán bộ" | Thêm user mới vào nhóm | User mới tự động có quyền của vai trò "Cán bộ" thừa hưởng từ nhóm | Major |

## In Scope

- Tạo nhóm người dùng mới (tên nhóm, mô tả, loại nhóm)
- Thêm/Xóa người dùng khỏi nhóm
- Chỉnh sửa thông tin nhóm (tên, mô tả, loại nhóm)
- Xóa nhóm (không xóa nếu còn thành viên)
- Phân quyền cho nhóm: gán một hoặc nhiều vai trò cho nhóm → toàn bộ thành viên thừa hưởng quyền
- Xem danh sách nhóm với bộ lọc (tên, loại, thành viên)
- Tìm kiếm nhóm (theo tên)
- Phân trang danh sách nhóm
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận

## Out of Scope

- Nhóm phân quyền tĩnh (F-001 Roles đảm nhận)
- Tự động thêm thành viên theo điều kiện (rule-based membership)
- Phân cấp nhóm cha/con (nhiều cấp)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full access | Tạo, sửa, xóa nhóm, thêm/xóa thành viên, phân quyền cho nhóm, xem lịch sử |
| Lanh dao | View | Xem danh sách nhóm, xem thành viên |
| Can bo | View + Edit + Quản lý thành viên (nếu được phân quyền) | Xem danh sách, sửa thông tin nhóm, thêm/xóa thành viên (khi được gán quyền tương ứng) |
| Ca nhan | Self only | Xem danh sách nhóm mà bản thân tham gia (filter myGroups=true) |

## Entities

- **UserGroup**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), description(TEXT), groupType(VARCHAR 30), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **GroupMember**: id(BIGINT PK), groupId(BIGINT FK→UserGroup), userId(BIGINT FK→UserAccount), joinedBy(BIGINT FK→UserAccount), joinedAt(TIMESTAMP)
- **GroupHistory**: id(BIGINT PK), groupId(BIGINT FK→UserGroup), action(VARCHAR 30), performedBy(BIGINT FK→UserAccount), performedAt(TIMESTAMP), notes(TEXT)
- **UserAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), email(VARCHAR 100 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), roleId(BIGINT FK→Role), organizationId(BIGINT FK→Organization), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), deletedAt(TIMESTAMP NULL), lastLoginAt(TIMESTAMP NULL)
- **Role**: id(BIGINT PK), name(VARCHAR 50 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), description(TEXT), permissions(JSON), isSystem(BOOLEAN DEFAULT false)
- **Organization**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), parentId(BIGINT FK→Organization), type(VARCHAR 30), status(VARCHAR 20), coefficient(DECIMAL 5,2), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **UserRole**: id(BIGINT PK), userId(BIGINT FK→UserAccount), roleId(BIGINT FK→Role), assignedBy(BIGINT FK→UserAccount), assignedAt(TIMESTAMP), expiresAt(TIMESTAMP NULL)
- **PasswordResetToken**: id(BIGINT PK), userId(BIGINT FK→UserAccount), token(VARCHAR 255 NOT NULL), expiresAt(TIMESTAMP NOT NULL), usedAt(TIMESTAMP NULL), createdAt(TIMESTAMP)
- **AdminAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), adminType(VARCHAR 30), moduleAccess(JSON), status(VARCHAR 20), mfaEnabled(BOOLEAN DEFAULT false), lastLoginAt(TIMESTAMP)
- **AccessLog**: id(BIGINT PK), userId(BIGINT FK→UserAccount), username(VARCHAR 50), action(VARCHAR 30), targetResource(VARCHAR 100), ipAddress(VARCHAR 45), userAgent(TEXT), responseCode(INT), duration_ms(INT), status(VARCHAR 20), createdAt(TIMESTAMP)
- **MapSymbol**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), symbolType(VARCHAR 30), color(VARCHAR 7), size(INT), svgData(TEXT), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **DataConnection**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), connectionType(VARCHAR 30), endpointUrl(VARCHAR 500 NOT NULL), authType(VARCHAR 30), config(JSON), status(VARCHAR 20), healthCheckUrl(VARCHAR 500), lastHealthCheck(TIMESTAMP NULL), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/groups | Danh sách nhóm (phân trang) | JWT |
| GET | /api/v1/groups/{id} | Chi tiết nhóm | JWT |
| POST | /api/v1/groups | Tạo nhóm mới | Admin |
| PUT | /api/v1/groups/{id} | Chỉnh sửa nhóm | Admin |
| DELETE | /api/v1/groups/{id} | Xóa nhóm | Admin |
| POST | /api/v1/groups/{id}/members | Thêm thành viên | Admin |
| DELETE | /api/v1/groups/{id}/members/{userId} | Xóa thành viên | Admin |
| POST | /api/v1/groups/{id}/copy | Sao chép nhóm | Admin |
| GET | /api/v1/groups/{id}/members | Danh sách thành viên | JWT |
| GET | /api/v1/users | Danh sách người dùng (phân trang) | JWT |
| POST | /api/v1/users | Tạo người dùng mới | Admin |
| GET | /api/v1/roles | Danh sách vai trò | JWT |
| PUT | /api/v1/users/{id}/lock | Khóa/mở khóa tài khoản | Admin |
| GET | /api/v1/logs | Danh sách log truy cập | Admin, Security |
| GET | /api/v1/symbols | Danh sách biểu tượng bản đồ | JWT |
| GET | /api/v1/connections | Danh sách kết nối liên thông | Admin |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-008 | Tên nhóm phải unique trong hệ thống | Create/Update Group | UC-008 |
| BR-009 | Không được xóa nhóm còn thành viên | Delete Group | UC-010 |
| BR-010 | Người dùng có thể thuộc nhiều nhóm cùng lúc | Membership | UC-009 |
| BR-011 | Chỉ Admin mới có quyền xóa nhóm | Delete Group | UC-010 |
| BR-012 | GroupType phân loại: department/project/custom | Create Group | UC-008 |
| BR-013 | Mã nhóm (code) phải unique trong toàn hệ thống | Create Group | UC-008 |
| BR-014 | Mọi thay đổi trên nhóm (tạo, sửa, xóa, thêm/xóa thành viên) phải được ghi nhận vào GroupHistory | All mutations | UC-011 |
| BR-015 | Admin có thể gán một hoặc nhiều vai trò (Role) cho nhóm; toàn bộ thành viên trong nhóm được thừa hưởng quyền từ các vai trò được gán | Group Permission | UC-012 |
| BR-016 | Khi thành viên rời khỏi nhóm, quyền thừa hưởng từ nhóm bị thu hồi (không ảnh hưởng đến quyền gán trực tiếp cho user từ F-001) | Group Permission | UC-012 |
| BR-017 | Khi thêm thành viên mới vào nhóm, thành viên tự động có quyền từ các vai trò đã gán cho nhóm | Group Permission | UC-012 |

## Testing Strategy

- Unit tests: Unique name validation (BR-008), unique code validation (BR-013), member count check on delete (BR-009), groupType enum validation (BR-012), duplicate membership check (BR-010)
- Integration tests: CRUD UserGroup with membership associations; create → add members → list → remove → delete flow; FK integrity (GroupMember → UserGroup, GroupMember → UserAccount); GroupHistory audit (BR-014)
- E2E tests: Create group → add members → verify group list → remove member; search/filter with pagination; permission UI (hide buttons for view-only roles); Ca nhan myGroups filter
- UI tests: Responsive sidebar, sticky header, pagination, search, toast notifications, tab detail view, member management modal

## UI Fields Specification

### 1. Màn hình danh sách nhóm (Group List)

| # | Cột | Data Index | Width | Sortable | Align | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | STT | — | 60px | No | Center | Số thứ tự theo trang |
| 2 | Tên nhóm | name | 200px | Yes | Left | In đậm; click để mở chi tiết |
| 3 | Mã nhóm | code | 120px | Yes | Center | — |
| 4 | Loại nhóm | groupType | 130px | Yes | Center | Badge: department (xanh dương), project (tím), custom (xám) |
| 5 | Mô tả | description | 250px | No | Left | Hiển thị tối đa 100 ký tự + "..." |
| 6 | Số thành viên | memberCount | 120px | Yes | Center | Số lượng thành viên đang hoạt động |
| 7 | Ngày tạo | createdAt | 150px | Yes | Center | Format `DD/MM/YYYY HH:mm` |
| 8 | Trạng thái | status | 120px | Yes | Center | Badge: active (xanh lá), inactive (xám) |
| 9 | Hành động | — | 120px | No | Center | Dropdown: Sửa, Quản lý thành viên, Phân quyền, Xóa (theo permission) |

**FilterBar:**

| Field | Type | Ghi chú |
|---|---|---|
| Tìm kiếm | Input text | Tìm theo tên nhóm |
| Loại nhóm | Select dropdown | department / project / custom |
| Trạng thái | Select dropdown | active / inactive |

### 2. Modal tạo/sửa nhóm (Create/Edit Group)

| # | Field | Field Name | Type | Required | Validation | Placeholder | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Tên nhóm | name | Input text | ✅ | 2-100 ký tự; unique trong hệ thống (BR-008) | `Đội khảo sát A` | — |
| 2 | Mã nhóm | code | Input text | ✅ | 2-30 ký tự, chữ hoa + số + gạch dưới; unique (BR-013) | `DA` | Không cho sửa sau khi tạo |
| 3 | Loại nhóm | groupType | Select | ✅ | department / project / custom (BR-012) | — | — |
| 4 | Mô tả | description | TextArea | ❌ | Tối đa 1000 ký tự | `Mô tả mục đích của nhóm...` | — |

**Modal footer:** [Hủy] [Lưu]

### 3. Modal xác nhận xóa nhóm (Delete Group)

Nội dung: `Bạn có chắc chắn muốn xóa nhóm "{name}"? Hành động này không thể hoàn tác.`

Nếu nhóm còn thành viên: hiển thị lỗi "Không thể xóa nhóm còn X thành viên. Vui lòng xóa hết thành viên trước." (BR-009)

**Modal footer:** [Hủy] [Xóa] (danger)

### 4. Modal quản lý thành viên (Manage Members)

**Form thêm thành viên:**

| # | Field | Field Name | Type | Required | Validation | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Ô tìm kiếm | search | Input text | ❌ | Tối đa 100 ký tự, tìm theo họ tên hoặc email | Tìm kiếm tương đối (contains) |
| 2 | Danh sách người dùng | — | Table (có Checkbox) | ❌ | Chỉ hiển thị người dùng chưa thuộc nhóm | Cột: Checkbox, Họ tên, Email, Đơn vị. Hỗ trợ phân trang. |
| 3 | Nút Add | — | Button | — | Disabled nếu chưa chọn ai | Thêm toàn bộ người dùng đã tick checkbox vào nhóm; toast "Đã thêm X thành viên" |

**Danh sách thành viên hiện tại:**

| # | Cột | Data Index | Width | Ghi chú |
|---|---|---|---|---|
| 1 | STT | — | 50px | — |
| 2 | Họ và tên | fullName | 200px | — |
| 3 | Email | email | 200px | — |
| 4 | Ngày tham gia | joinedAt | 150px | Format `DD/MM/YYYY` |
| 5 | Hành động | — | 80px | Nút "Xóa" (icon thùng rác) |

**Modal footer:** [Đóng]

### 5. Phân quyền cho nhóm (Group Permission)

| # | Field | Field Name | Type | Required | Validation | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Ô tìm kiếm | — | Input text | ❌ | Tối đa 100 ký tự, tìm theo tên hoặc mã vai trò (contains) | Lọc danh sách vai trò hiển thị |
| 2 | Sơ đồ cây vai trò | — | Tree (có Checkbox) | ❌ | Tích sẵn các vai trò đã gán trước đó. Nút cha có thể mở rộng/thu gọn; checkbox cha tick/bỏ tick toàn bộ con; hỗ trợ indeterminate. | Vai trò hiển thị dạng cây phân cấp theo nhóm chức năng. Dữ liệu từ F-001. |
| 3 | Nút Lưu | — | Button | — | — | Cập nhật GroupRole; toast "Đã cập nhật phân quyền"; ghi GroupHistory |
| 4 | Nút Đóng | — | Button | — | — | Đóng modal, không lưu |

### 6. Màn hình chi tiết nhóm (Group Detail)

Layout dạng tab:

| Tab | Nội dung |
|---|---|
| Thông tin nhóm | Tên, mã, loại, mô tả, trạng thái, ngày tạo, người tạo |
| Danh sách thành viên | Bảng thành viên (như modal quản lý) + nút Thêm/Xóa (nếu có quyền) |
| Lịch sử thay đổi | Bảng GroupHistory: thời gian, người thực hiện, hành động, ghi chú (BR-014) |

### Quy ước chung

- **Form layout**: vertical, label đậm, `marginBottom: spaceFormField` (12px) cho Form.Item
- **Input/Select**: `borderRadius: radiusPill` (999px), `height: 40px`
- **Validation**: realtime (khi blur), error message hiển thị dưới field
- **Submit button**: disabled khi form có lỗi, loading khi đang submit, toast notification khi thành công/thất bại
- **Modal footer**: [Hủy] outlined + [Submit] primary, cả hai pill radius
- **Quyền (permission-based)**: Sửa=`group:edit`, Xóa=`group:delete`, Thêm/Xóa thành viên=`group:member:manage`, Phân quyền=`group:permission`, Xem lịch sử=`group:history`
