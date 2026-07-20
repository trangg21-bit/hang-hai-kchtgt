---
feature-id: F-002
document: lean-spec
output-mode: lean
last-updated: "2026-06-28"
---

# Lean Spec — F-002: Quản lý nhóm người dùng

## 1. Summary

Feature F-002 (Quan ly nhom nguoi dung) thuộc module M-001 (Quản trị hệ thống), xây dựng trên Spring Boot + Spring Security + JWT + ReactJS. Tính năng cho phép quản lý tập trung các nhóm người dùng: tạo, sửa, xóa nhóm; thêm/bớt thành viên; sao chép nhóm; tìm kiếm, lọc và phân trang danh sách nhóm. Phân quyền theo vai trò (Admin, Lanh dao, Can bo, Ca nhan) với RBAC qua JWT.

**Complexity:** Medium (5 business rules, 4 actors)

## 2. Scope

### In Scope

| # | Capability | Description |
|---|---|---|
| 1 | Tạo nhóm | Tạo nhóm mới với tên, mã, loại nhóm (department/project/custom), mô tả |
| 2 | Chỉnh sửa nhóm | Cập nhật tên, mô tả, loại nhóm |
| 3 | Xóa nhóm | Xóa nhóm (chỉ khi không còn thành viên, chỉ Admin) |
| 4 | Thêm thành viên | Thêm người dùng vào nhóm, ghi nhận roleInGroup và joinedBy |
| 5 | Xóa thành viên | Loại bỏ người dùng khỏi nhóm |
| 6 | Sao chép nhóm | Duplicate nhóm với toàn bộ thành viên gốc |
| 7 | Danh sách nhóm | Phân trang, tìm kiếm theo tên, lọc theo loại nhóm và số lượng thành viên |
| 8 | Chi tiết nhóm | Xem thông tin nhóm và danh sách thành viên |
| 9 | Lịch sử thay đổi | Ghi nhận lịch sử hành động trên nhóm (GroupHistory) |

### Out of Scope

| # | Capability | Rationale |
|---|---|---|
| 1 | Phân quyền tĩnh theo nhóm | F-001 Roles đảm nhận |
| 2 | Tự động thêm thành viên theo điều kiện | Rule-based membership không thuộc phạm vi |
| 3 | Phân cấp nhóm cha/con | Không hỗ trợ nested/chồng nhóm |

## 3. Actors & Permissions

| Actor | Role Slug | Permissions |
|---|---|---|
| Admin | Admin | Full CRUD nhóm, thêm/xóa thành viên, sao chép nhóm |
| Lanh dao | Lanh dao | View: xem danh sách nhóm, xem thành viên |
| Can bo | Can bo | View + Edit: xem danh sách, thêm/xóa thành viên, sửa thông tin nhóm |
| Ca nhan | Ca nhan | Self only: xem nhóm cá nhân thuộc về |

## 4. User Stories (MoSCoW)

| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-001 | Là Admin, tôi muốn tạo nhóm mới với tên, mã, loại nhóm và mô tả để tổ chức người dùng theo đơn vị/dự án | Must | Tên nhóm unique trong hệ thống; mã nhóm unique; loại nhóm thuộc enum [department, project, custom]; tạo thành công → toast "Đã tạo thành công" |
| US-002 | Là Admin/Can bo, tôi muốn chỉnh sửa thông tin nhóm để cập nhật tên, mô tả, loại nhóm | Must | Tên nhóm vẫn phải unique sau sửa; không cho phép sửa mã nhóm |
| US-003 | Là Admin, tôi muốn xóa nhóm khi không còn thành viên để dọn dẹp nhóm không còn sử dụng | Must | Chỉ Admin được xóa; hệ thống kiểm tra member count > 0 → từ chối xóa với thông báo rõ ràng |
| US-004 | Là Admin/Can bo, tôi muốn thêm người dùng vào nhóm với vai trò trong nhóm (roleInGroup) | Must | Kiểm tra duplicate membership trước khi thêm; ghi nhận joinedBy và joinedAt; toast thông báo thành công |
| US-005 | Là Admin/Can bo, tôi muốn xóa người dùng khỏi nhóm | Should | Xóa record GroupMember; không ảnh hưởng đến UserAccount; toast thông báo |
| US-006 | Là Admin, tôi muốn sao chép nhóm để tạo nhanh nhóm có cấu trúc tương tự | Should | Sao chép tên, mã, loại, mô tả; sao chép toàn bộ GroupMember từ nhóm gốc; tạo GroupHistory entry |
| US-007 | Là Lanh dao/Can bo/Ca nhan, tôi muốn tìm kiếm và lọc danh sách nhóm theo tên, loại nhóm, số lượng thành viên | Must | Kết quả phân trang; bộ lọc hoạt động độc lập hoặc kết hợp; hiển thị số lượng thành viên mỗi nhóm |
| US-008 | Là Ca nhan, tôi muốn xem danh sách nhóm mà tôi tham gia | Should | Chỉ hiển thị các nhóm có GroupMember với userId = currentUserId |
| US-009 | Là Admin, tôi muốn xem lịch sử thay đổi của nhóm (ai tạo, ai sửa, ai thêm/xóa thành viên) | Could | Hiển thị danh sách GroupHistory entries theo groupId, sắp xếp giảm dần theo performedAt |

## 5. Acceptance Criteria (BDD)

| TC-ID | Scenario | Given | When | Then | Priority |
|---|---|---|---|---|---|
| AC-001 | Tạo nhóm thành công | Người dùng là Admin, tên nhóm "Đội A" chưa tồn tại | POST /api/v1/groups với name="Đội A", code="DA", groupType="department" | Response 201, nhóm được tạo, toast "Đã tạo thành công" | Critical |
| AC-002 | Tạo nhóm trùng tên | Người dùng là Admin, tên nhóm "Đội A" đã tồn tại | POST /api/v1/groups với name="Đội A" (trùng) | Response 409 Conflict, message "Tên nhóm đã tồn tại" | Critical |
| AC-003 | Tạo nhóm trùng mã | Người dùng là Admin, mã nhóm "DA" đã tồn tại | POST /api/v1/groups với code="DA" (trùng) | Response 409 Conflict, message "Mã nhóm đã tồn tại" | Critical |
| AC-004 | Xóa nhóm còn thành viên | Nhóm "Đội A" có 2 thành viên, người dùng là Admin | DELETE /api/v1/groups/{id} | Response 409 Conflict, message "Không thể xóa nhóm còn thành viên" | Critical |
| AC-005 | Xóa nhóm rỗng | Nhóm "Đội A" không còn thành viên, người dùng là Admin | DELETE /api/v1/groups/{id} | Response 200, nhóm bị xóa, toast "Đã xóa thành công" | Critical |
| AC-006 | Thêm thành viên vào nhóm | Nhóm "Đội A" tồn tại, user "U001" chưa thuộc nhóm | POST /api/v1/groups/{id}/members với userId="U001", roleInGroup="member" | Response 201, GroupMember record được tạo, toast "Đã thêm thành viên" | Critical |
| AC-007 | Thêm thành viên trùng lặp | Nhóm "Đội A" đã có user "U001" | POST /api/v1/groups/{id}/members với userId="U001" | Response 409 Conflict, message "Người dùng đã thuộc nhóm này" | Major |
| AC-008 | Xóa thành viên khỏi nhóm | Nhóm "Đội A" có user "U001" | DELETE /api/v1/groups/{id}/members/U001 | Response 200, GroupMember record bị xóa, UserAccount không bị ảnh hưởng | Major |
| AC-009 | Sao chép nhóm | Nhóm "Đội A" có 3 thành viên | POST /api/v1/groups/{id}/copy với name="Đội A (Copy)" | Response 201, nhóm mới được tạo với 3 thành viên sao chép, GroupHistory entry ghi nhận | Major |
| AC-010 | Tìm kiếm nhóm theo tên | Có 5 nhóm trong hệ thống | GET /api/v1/groups?search=Đội&page=1&size=10 | Response 200, danh sách nhóm chứa từ khóa "Đội", phân trang chính xác | Major |
| AC-011 | Lọc nhóm theo loại | Có nhóm loại department và project | GET /api/v1/groups?groupType=department&page=1&size=10 | Response 200, chỉ trả về nhóm có groupType="department" | Major |
| AC-012 | Xem danh sách nhóm (view-only) | Người dùng là Lanh dao | GET /api/v1/groups | Response 200, danh sách nhóm; không hiển thị nút "Thêm/Sửa/Xóa" trên UI | Major |
| AC-013 | Xem nhóm cá nhân | Người dùng là Ca nhan, thuộc 2 nhóm | GET /api/v1/groups?myGroups=true | Response 200, chỉ hiển thị 2 nhóm mà user tham gia | Minor |
| AC-014 | Chỉnh sửa nhóm | Nhóm "Đội A" tồn tại, người dùng là Admin | PUT /api/v1/groups/{id} với name="Đội A Mới", description="Mô tả mới" | Response 200, thông tin nhóm được cập nhật, toast "Đã lưu thành công" | Major |
| AC-015 | Chỉnh sửa nhóm trùng tên | Nhóm "Đội A" và "Đội B" tồn tại, sửa "Đội B" thành "Đội A" | PUT /api/v1/groups/{id} với name="Đội A" | Response 409 Conflict, message "Tên nhóm đã tồn tại" | Critical |

## 6. Business Rules

| ID | Rule | Applies-to | Source | Exception |
|---|---|---|---|---|
| BR-008 | Tên nhóm phải unique trong toàn hệ thống; không cho phép trùng tên khi tạo mới hoặc sửa | Create/Update Group | UC-008 | Không có |
| BR-009 | Không được xóa nhóm khi vẫn còn thành viên; hệ thống kiểm tra member count trước khi xóa | Delete Group | UC-010 | Không có |
| BR-010 | Một người dùng có thể thuộc nhiều nhóm khác nhau cùng lúc | Membership | UC-009 | Không có |
| BR-011 | Chỉ Admin mới có quyền xóa nhóm; các vai trò khác không thể thực hiện DELETE /groups/{id} | Delete Group | UC-010 | Không có |
| BR-012 | GroupType phân loại thành 3 loại: department, project, custom; không cho phép giá trị khác | Create Group | UC-008 | Không có |
| BR-013 | Mã nhóm (code) phải unique trong toàn hệ thống | Create Group | UC-008 | Không có |
| BR-014 | Khi sao chép nhóm, toàn bộ GroupMember của nhóm gốc được sao chép sang nhóm mới với joinedBy = currentAdmin | Copy Group | UC-011 | Không có |
| BR-015 | Mọi thay đổi trên nhóm (tạo, sửa, xóa, thêm/xóa thành viên, sao chép) phải được ghi nhận vào GroupHistory | All mutations | UC-011 | Không có |

## 7. Entities & Data Model

| Entity | Key Fields | FK References | Notes |
|---|---|---|---|
| **UserGroup** | id (BIGINT PK), name (VARCHAR 100 NOT NULL), code (VARCHAR 30 UNIQUE NOT NULL), description (TEXT), groupType (VARCHAR 30), status (VARCHAR 20), createdAt, updatedAt | — | Bảng chính quản lý nhóm |
| **GroupMember** | id (BIGINT PK), groupId (BIGINT FK→UserGroup), userId (BIGINT FK→UserAccount), joinedBy (BIGINT FK→UserAccount), joinedAt, roleInGroup (VARCHAR 30) | UserGroup, UserAccount | Bảng trung gian |
| **GroupHistory** | id (BIGINT PK), groupId (BIGINT FK→UserGroup), action (VARCHAR 30), performedBy (BIGINT FK→UserAccount), performedAt, notes (TEXT) | UserGroup, UserAccount | Lịch sử thay đổi nhóm |
| **UserAccount** | id (BIGINT PK), username, email, passwordHash, roleId, organizationId, status, createdAt, updatedAt, deletedAt, lastLoginAt | Role, Organization | Tham chiếu từ GroupMember |
| **Role** | id (BIGINT PK), name, code, description, permissions (JSON), isSystem | — | Tham chiếu từ UserAccount |

## 8. API Endpoints

| Method | Endpoint | Description | Auth | Role Required |
|---|---|---|---|---|
| GET | /api/v1/groups | Danh sách nhóm (phân trang, search, filter) | JWT | Admin, Lanh dao, Can bo, Ca nhan |
| GET | /api/v1/groups/{id} | Chi tiết nhóm | JWT | Admin, Lanh dao, Can bo, Ca nhan |
| POST | /api/v1/groups | Tạo nhóm mới | JWT | Admin |
| PUT | /api/v1/groups/{id} | Chỉnh sửa nhóm | JWT | Admin, Can bo |
| DELETE | /api/v1/groups/{id} | Xóa nhóm | JWT | Admin |
| POST | /api/v1/groups/{id}/members | Thêm thành viên | JWT | Admin, Can bo |
| DELETE | /api/v1/groups/{id}/members/{userId} | Xóa thành viên | JWT | Admin, Can bo |
| POST | /api/v1/groups/{id}/copy | Sao chép nhóm | JWT | Admin |
| GET | /api/v1/groups/{id}/members | Danh sách thành viên | JWT | Admin, Lanh dao, Can bo, Ca nhan |
| GET | /api/v1/users | Danh sách người dùng (phân trang) | JWT | Admin, Can bo |
| GET | /api/v1/groups/{id}/history | Lịch sử thay đổi nhóm | JWT | Admin |

## 9. Testing Strategy

| Category | Scope | Test Cases |
|---|---|---|
| **Unit (Backend)** | Service layer | Unique name validation (BR-008); unique code validation (BR-013); member count check on delete (BR-009); groupType enum validation (BR-012); duplicate membership check (BR-010) |
| **Unit (Backend)** | Controller layer | Request validation: empty name, name > 100 chars, invalid groupType; response codes: 201, 400, 409, 403 |
| **Integration (Backend)** | Repository + DB | FK integrity: GroupMember → UserGroup, GroupMember → UserAccount; cascade behavior; duplicate constraint enforcement |
| **Integration (Backend)** | Full flow | Create group → add member → list members → remove member → delete group (empty) |
| **E2E (Frontend + Backend)** | ReactJS UI | Full CRUD flow on UI; search/filter with pagination; add/remove member via modal; toast notifications; permission-based UI (hide buttons for view-only roles) |
| **Security** | RBAC enforcement | Admin-only endpoints (DELETE, POST /copy) blocked for non-Admin; Lanh dao cannot edit/delete; Ca nhan only sees own groups |
| **UI/UX** | Responsive & states | Mobile sidebar collapse (< 768px); sticky header; loading skeleton; empty state; error state with retry; form validation with realtime error messages |

## 10. Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| **Performance** | Danh sách nhóm trả về trong < 500ms với < 1000 records; phân trang 20 items/trang | P95 < 500ms |
| **Security** | Tất cả endpoint bảo vệ bằng JWT; RBAC enforcement qua Spring Security; không có thông tin nhạy cảm trong response | OWASP Top 10 compliant |
| **Reliability** | GroupHistory ghi nhận mọi thay đổi; rollback không cần thiết (immutable audit log) | 100% mutation logged |
| **Usability** | Giao diện responsive (mobile < 768px); toast notification cho mọi action; form validation realtime | WCAG 2.1 AA |
| **Scalability** | Hỗ trợ tối thiểu 10.000 nhóm, 50.000 thành viên; index trên name, code, groupType, status | DB index strategy defined |

## 11. Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| **Q1: Creates new domain elements?** | **Yes** | Introduces 3 new aggregates: UserGroup, GroupMember, GroupHistory. These are new bounded-context entities not covered by existing modules. |
| **Q2: Affects system architecture?** | **No** | Uses existing Spring Boot + Spring Security + JWT stack; no new infrastructure or cross-module integration required. |
| **Q3: Approach clear from existing architecture?** | **No** | New aggregates require domain modeling (bounded context, context map, ubiquitous language) before architecture design. |

**Triage Verdict:** Route to **engineering-system-architect** (Q1=Yes → Phase 2 domain modeling required → system architect).

## 12. Ambiguities

| ID | Description | Impact | Question |
|---|---|---|---|
| [AMBIGUITY-001] | Vai trò "Lanh dao" và "Can bo" không rõ ràng trong permission matrix — Can bo có quyền edit nhưng không có quyền delete, trong khi root feature-brief chỉ gán "Full access" cho Admin | Medium | Cần xác nhận chính xác quyền của Can bo: có được xóa nhóm không? Có được sao chép nhóm không? |
| [AMBIGUITY-002] | Mã nhóm (code) có quy tắc sinh tự động hay do người dùng nhập? | Low | Cần xác định: auto-generated (ví dụ: DA-001) hoặc manual input? |
| [AMBIGUITY-003] | RoleInGroup — các giá trị enum của roleInGroup chưa được định nghĩa | Low | Cần xác định các vai trò trong nhóm (ví dụ: admin, member, observer) |
