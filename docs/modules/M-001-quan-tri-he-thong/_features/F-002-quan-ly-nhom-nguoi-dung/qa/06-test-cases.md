---
feature-id: F-002
stage: qa-testing
agent: engineering-qa-engineer
document: test-cases
last-updated: "2026-06-28"
---

# QA Test Cases — F-002: Quản lý nhóm người dùng (User Group Management)

## Test Suite Overview

| Metric | Value |
|---|---|
| Total test cases | 28 |
| Unit tests | 8 |
| Integration tests | 8 |
| E2E tests | 6 |
| Security tests | 4 |
| UI/UX tests | 2 |

---

## 1. Unit Tests — Service Layer

### TC-001: Unique Name Validation on Create

| Field | Value |
|---|---|
| **tc_id** | TC-001 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | unit |
| **preconditions** | UserGroupRepository exists; DB has UNIQUE constraint on name |

| Step | Action | Expected |
|---|---|---|
| 1 | Create group with name "Đội A" | Returns 201, group created |
| 2 | Create another group with name "Đội A" | Returns 400/409, message "Tên nhóm đã tồn tại" |

**Map to:** AC-001, AC-002, BR-008

---

### TC-002: Unique Code Validation on Create

| Field | Value |
|---|---|
| **tc_id** | TC-002 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | unit |
| **preconditions** | DB has UNIQUE constraint on code |

| Step | Action | Expected |
|---|---|---|
| 1 | Create group with code "DA" | Returns 201, group created |
| 2 | Create another group with code "DA" | Returns 400/409, message "Mã nhóm đã tồn tại" |

**Map to:** AC-003, BR-013

---

### TC-003: GroupType Enum Validation

| Field | Value |
|---|---|
| **tc_id** | TC-003 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | unit |
| **preconditions** | GroupType enum: DEPARTMENT, PROJECT, CUSTOM |

| Step | Action | Expected |
|---|---|---|
| 1 | Create group with groupType="department" | Returns 201 |
| 2 | Create group with groupType="project" | Returns 201 |
| 3 | Create group with groupType="custom" | Returns 201 |
| 4 | Create group with groupType="invalid" | Returns 400, validation error |

**Map to:** AC-015, BR-012

---

### TC-004: Member Count Check on Delete

| Field | Value |
|---|---|
| **tc_id** | TC-004 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | unit |
| **preconditions** | Group exists with 2 active members |

| Step | Action | Expected |
|---|---|---|
| 1 | Attempt to delete group with 2 members | Returns 400, message "Không thể xóa nhóm còn 2 thành viên" |
| 2 | Remove all members, then delete group | Returns 200, group soft-deleted |

**Map to:** AC-004, AC-005, BR-009

---

### TC-005: Duplicate Membership Check

| Field | Value |
|---|---|
| **tc_id** | TC-005 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | unit |
| **preconditions** | Group exists; user U001 already a member |

| Step | Action | Expected |
|---|---|---|
| 1 | Add U001 to group again | Returns 400/409, message "Người dùng đã thuộc nhóm này" |
| 2 | Add different user U002 to same group | Returns 201, member created |

**Map to:** AC-007, BR-010

---

### TC-006: Copy Group Clones Members

| Field | Value |
|---|---|
| **tc_id** | TC-006 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | unit |
| **preconditions** | Group exists with 3 members |

| Step | Action | Expected |
|---|---|---|
| 1 | Copy group with new name "Đội A (Copy)" | Returns 201 |
| 2 | Query new group members | Returns 3 members (same as original) |
| 3 | Check GroupHistory for copy action | History entry exists with action="COPIED" |

**Map to:** AC-009, BR-014

---

### TC-007: History Logging on Mutations

| Field | Value |
|---|---|---|
| **tc_id** | TC-007 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | unit |
| **preconditions** | GroupHistoryRepository exists |

| Step | Action | Expected |
|---|---|---|
| 1 | Create group | GroupHistory entry: action=CREATE |
| 2 | Update group | GroupHistory entry: action=UPDATE |
| 3 | Add member | GroupHistory entry: action=MEMBER_ADDED |
| 4 | Remove member | GroupHistory entry: action=MEMBER_REMOVED |
| 5 | Delete group | GroupHistory entry: action=DELETE |

**Map to:** BR-015

---

### TC-008: Name Uniqueness Re-check on Update

| Field | Value |
|---|---|---|
| **tc_id** | TC-008 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | unit |
| **preconditions** | Group "Đội A" (id=1) and Group "Đội B" (id=2) exist |

| Step | Action | Expected |
|---|---|---|
| 1 | Update Group B name to "Đội A" | Returns 400/409, message "Tên nhóm đã tồn tại" |
| 2 | Update Group B name to "Đội C" | Returns 200, updated successfully |

**Map to:** AC-015, BR-008

---

## 2. Integration Tests — Full Flow

### TC-009: Full CRUD Lifecycle

| Field | Value |
|---|---|
| **tc_id** | TC-009 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | integration |
| **preconditions** | Clean DB; V20 migration applied |

| Step | Action | Expected |
|---|---|---|
| 1 | POST /api/v1/groups → {name: "Đội A", code: "DA", groupType: "department"} | 201 Created |
| 2 | GET /api/v1/groups/{id} | 200, data matches created group |
| 3 | PUT /api/v1/groups/{id} → {name: "Đội A Mới"} | 200 Updated |
| 4 | DELETE /api/v1/groups/{id} (no members) | 200 Deleted |
| 5 | GET /api/v1/groups/{id} after delete | 404 Not Found |

**Map to:** AC-001, AC-005

---

### TC-010: Delete with Members (409 Conflict)

| Field | Value |
|---|---|
| **tc_id** | TC-010 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | integration |
| **preconditions** | Group exists with 2 members |

| Step | Action | Expected |
|---|---|---|
| 1 | POST /api/v1/groups → create group | 201 |
| 2 | POST /api/v1/groups/{id}/members → add 2 members | 201 each |
| 3 | DELETE /api/v1/groups/{id} | 409 Conflict, message about remaining members |

**Map to:** AC-004, BR-009

---

### TC-011: Member Lifecycle (Add → List → Remove)

| Field | Value |
|---|---|
| **tc_id** | TC-011 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | integration |
| **preconditions** | Group exists |

| Step | Action | Expected |
|---|---|---|
| 1 | POST /api/v1/groups/{id}/members → add U001 | 201, memberCount=1 |
| 2 | GET /api/v1/groups/{id}/members | 200, returns U001 |
| 3 | POST /api/v1/groups/{id}/members → add U002 | 201, memberCount=2 |
| 4 | GET /api/v1/groups/{id}/members | 200, returns U001, U002 |
| 5 | DELETE /api/v1/groups/{id}/members/U001 | 200, memberCount=1 |
| 6 | GET /api/v1/groups/{id}/members | 200, returns U002 only |

**Map to:** AC-006, AC-008

---

### TC-012: FK Integrity Verification

| Field | Value |
|---|---|
| **tc_id** | TC-012 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | integration |
| **preconditions** | V20 migration applied; FK constraints on group_members and group_histories |

| Step | Action | Expected |
|---|---|---|
| 1 | Create group | user_groups row exists |
| 2 | Add member with invalid userId | FK constraint violation or 404 from service |
| 3 | Verify GroupMember.groupId FK | Points to valid user_groups |
| 4 | Verify GroupMember.userId FK | Points to valid user_accounts |

**Map to:** BR-010, BR-009

---

### TC-013: Duplicate Constraint Enforcement

| Field | Value |
|---|---|
| **tc_id** | TC-013 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | integration |
| **preconditions** | DB UNIQUE constraints active |

| Step | Action | Expected |
|---|---|---|
| 1 | Insert duplicate name directly via SQL (bypass app) | DB constraint rejects |
| 2 | Insert duplicate groupId+userId in group_members | DB constraint rejects |

**Map to:** BR-008, BR-013, BR-010

---

### TC-014: Pagination and Search

| Field | Value |
|---|---|
| **tc_id** | TC-014 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | integration |
| **preconditions** | 25 groups created |

| Step | Action | Expected |
|---|---|---|
| 1 | GET /api/v1/groups?page=0&size=10 | 200, returns 10 items, total=25, totalPages=3 |
| 2 | GET /api/v1/groups?page=2&size=10 | 200, returns remaining 5 items |
| 3 | GET /api/v1/groups?search=Đội | 200, filtered results |

**Map to:** AC-010

---

### TC-015: Filter by GroupType

| Field | Value |
|---|---|
| **tc_id** | TC-015 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | integration |
| **preconditions** | 3 department groups, 2 project groups, 1 custom group |

| Step | Action | Expected |
|---|---|---|
| 1 | GET /api/v1/groups?groupType=department | 200, returns 3 department groups |
| 2 | GET /api/v1/groups?groupType=project | 200, returns 2 project groups |
| 3 | GET /api/v1/groups?groupType=custom | 200, returns 1 custom group |
| 4 | GET /api/v1/groups | 200, returns all 6 groups |

**Map to:** AC-011, BR-012

---

### TC-016: Copy Group Full Flow

| Field | Value |
|---|---|
| **tc_id** | TC-016 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | integration |
| **preconditions** | Group with 3 members exists |

| Step | Action | Expected |
|---|---|---|
| 1 | POST /api/v1/groups/{id}/copy → {name: "Đội A (Copy)"} | 201 Created |
| 2 | GET /api/v1/groups/{newId}/members | 200, 3 members returned |
| 3 | GET /api/v1/groups/{id}/history | 200, entry with action=COPIED exists |

**Map to:** AC-009, BR-014

---

### TC-017: My Groups Filter (Ca nhan)

| Field | Value |
|---|---|
| **tc_id** | TC-017 |
| **feature_id** | F-002 |
| **priority** | Minor |
| **test_type** | integration |
| **preconditions** | User U001 is member of 2 groups |

| Step | Action | Expected |
|---|---|---|
| 1 | GET /api/v1/groups?myGroups=true (as U001) | 200, returns exactly 2 groups |
| 2 | GET /api/v1/groups?myGroups=false (as U001) | 200, returns all groups |

**Map to:** AC-013

---

## 3. E2E Tests — Frontend + Backend

### TC-018: Full CRUD UI Flow

| Field | Value |
|---|---|
| **tc_id** | TC-018 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | e2e |
| **preconditions** | Frontend running; user is Admin |

| Step | Action | Expected |
|---|---|---|
| 1 | Navigate to GroupList page | Page loads, table displays |
| 2 | Click "Thêm nhóm", fill form, submit | Toast "Đã tạo thành công", group appears in table |
| 3 | Click "Sửa" on a group, change name, submit | Toast "Đã lưu thành công", name updated |
| 4 | Click "Xóa", confirm in modal | Toast "Đã xóa thành công", group removed |

**Map to:** BA UI/UX Requirements

---

### TC-019: Member Management UI

| Field | Value |
|---|---|
| **tc_id** | TC-019 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | e2e |
| **preconditions** | Group exists; user is Admin |

| Step | Action | Expected |
|---|---|---|
| 1 | Open GroupDetail → Members tab | List of members displayed |
| 2 | Click "Thêm thành viên", search and select user | Modal with autocomplete search |
| 3 | Submit add member | Toast "Đã thêm thành viên", member appears in list |
| 4 | Click "Rời nhóm" on a member | Confirmation modal → remove |
| 5 | Verify member removed | Member no longer in list |

**Map to:** BA UI/UX Requirements

---

### TC-020: Search and Filter UI

| Field | Value |
|---|---|
| **tc_id** | TC-020 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | e2e |
| **preconditions** | GroupList page loaded |

| Step | Action | Expected |
|---|---|---|
| 1 | Type "Đội" in search box | Table filters to matching groups |
| 2 | Select groupType="department" filter | Table shows only department groups |
| 3 | Clear filters | All groups shown |
| 4 | Verify pagination controls | Page numbers, total count displayed |

**Map to:** AC-010, AC-011

---

### TC-021: Permission-Based UI

| Field | Value |
|---|---|
| **tc_id** | TC-021 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | e2e |
| **preconditions** | Logged in as Lanh dao (view-only role) |

| Step | Action | Expected |
|---|---|---|
| 1 | Navigate to GroupList page | Page loads |
| 2 | Check action buttons | "Thêm", "Sửa", "Xóa" buttons NOT visible |
| 3 | Navigate to GroupDetail | View-only content, no edit controls |

**Map to:** BA UI/UX Requirements, AC-012

---

### TC-022: Responsive Layout

| Field | Value |
|---|---|
| **tc_id** | TC-022 |
| **feature_id** | F-002 |
| **priority** | Minor |
| **test_type** | e2e |
| **preconditions** | Browser viewport < 768px |

| Step | Action | Expected |
|---|---|---|
| 1 | Open GroupList on mobile viewport | Sidebar collapses to hamburger |
| 2 | Groups display as cards (not table) | Card layout with group info |
| 3 | Open GroupDetail modal/form | Modal responsive, no overflow |

**Map to:** BA UI/UX Requirements

---

### TC-023: Form Validation

| Field | Value |
|---|---|
| **tc_id** | TC-023 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | e2e |
| **preconditions** | Create group form open |

| Step | Action | Expected |
|---|---|---|
| 1 | Leave name empty, submit | Error message under name field |
| 2 | Enter name > 100 characters | Error: "Tên nhóm tối đa 100 ký tự" |
| 3 | Enter duplicate name | Error: "Tên nhóm đã tồn tại" |
| 4 | Submit with valid data | Form closes, toast success |

**Map to:** BA UI/UX Requirements

---

### TC-024: Toast Notifications

| Field | Value |
|---|---|
| **tc_id** | TC-024 |
| **feature_id** | F-002 |
| **priority** | Minor |
| **test_type** | e2e |
| **preconditions** | Any group action page |

| Step | Action | Expected |
|---|---|---|
| 1 | Create group successfully | Toast "Đã tạo thành công" (green) |
| 2 | Delete group successfully | Toast "Đã xóa thành công" (green) |
| 3 | Delete group with members (error) | Toast error message (red) |
| 4 | Auto-dismiss after 3 seconds | Toast disappears |

**Map to:** BA UI/UX Requirements

---

## 4. Security Tests

### TC-025: Unauthenticated Access

| Field | Value |
|---|---|
| **tc_id** | TC-025 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | security |
| **preconditions** | No JWT token |

| Step | Action | Expected |
|---|---|---|
| 1 | GET /api/v1/groups without token | 401 Unauthorized |
| 2 | POST /api/v1/groups without token | 401 Unauthorized |

**Map to:** SA Security section

---

### TC-026: RBAC Enforcement

| Field | Value |
|---|---|
| **tc_id** | TC-026 |
| **feature_id** | F-002 |
| **priority** | Critical |
| **test_type** | security |
| **preconditions** | Users: Admin, Lanh dao, Can bo, Ca nhan each with valid JWT |

| Step | Action | Expected |
|---|---|---|
| 1 | Lanh dao → POST /api/v1/groups (create) | 403 Forbidden |
| 2 | Lanh dao → PUT /api/v1/groups/{id} (edit) | 403 Forbidden |
| 3 | Can bo → DELETE /api/v1/groups/{id} (delete) | 403 Forbidden |
| 4 | Can bo → POST /api/v1/groups/{id}/copy | 403 Forbidden |

**Map to:** SA RBAC Matrix, BR-011

---

### TC-027: Blocked User Membership

| Field | Value |
|---|---|
| **tc_id** | TC-027 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | security |
| **preconditions** | User account blocked; still a member of a group |

| Step | Action | Expected |
|---|---|---|
| 1 | GET /api/v1/groups/{id}/members (user blocked) | 200, user still in list |
| 2 | Verify user cannot login (independent check) | Login fails |

**Map to:** BR-002-05 (blocked users stay in group)

---

### TC-028: Input Sanitization

| Field | Value |
|---|---|
| **tc_id** | TC-028 |
| **feature_id** | F-002 |
| **priority** | Major |
| **test_type** | security |
| **preconditions** | Group creation form |

| Step | Action | Expected |
|---|---|---|
| 1 | Enter name with SQL injection attempt (e.g., `' OR 1=1 --`) | Rejected by @NotBlank/@Size validation or DB |
| 2 | Enter name with XSS attempt (e.g., `<script>alert(1)</script>`) | Stored as-is (escaped by frontend) |

**Map to:** SA Security recommendations

---

## Test Coverage Matrix

| BA AC | TC IDs | Status |
|---|---|---|
| AC-001 | TC-001, TC-009, TC-018 | Covered |
| AC-002 | TC-001 | Covered |
| AC-003 | TC-002 | Covered |
| AC-004 | TC-004, TC-010 | Covered |
| AC-005 | TC-004, TC-009, TC-018 | Covered |
| AC-006 | TC-005, TC-011, TC-019 | Covered |
| AC-007 | TC-005 | Covered |
| AC-008 | TC-011, TC-019 | Covered |
| AC-009 | TC-006, TC-016 | Covered |
| AC-010 | TC-014, TC-020 | Covered |
| AC-011 | TC-015, TC-020 | Covered |
| AC-012 | TC-021, TC-026 | Covered |
| AC-013 | TC-017 | Covered |
| AC-014 | TC-009, TC-018 | Covered |
| AC-015 | TC-003, TC-008 | Covered |
