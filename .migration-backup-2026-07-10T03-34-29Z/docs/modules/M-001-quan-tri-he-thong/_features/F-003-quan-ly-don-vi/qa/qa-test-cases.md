---
feature-id: F-003
stage: qa-test-creation
agent: engineering-qa-engineer
creation-date: 2026-06-28
total-cases: 45
---

# Feature F-003: Quản lý đơn vị — QA Test Cases

## Test Case Catalog

### TC-001: Create Unit with Unique Code (BR-013)
- **ID**: TC-F003-001
- **Priority**: Critical
- **Preconditions**: User is authenticated with Admin role
- **Steps**:
  1. POST /api/org-units with body: `{name: "Chi cục 1", code: "CC001", type: "CHI_CUC"}`
  2. Observe response status
- **Expected**: 201 Created, response contains unit with code "CC001", status "DRAFT"
- **Type**: functional

### TC-002: Reject Duplicate Code on Create (BR-013)
- **ID**: TC-F003-002
- **Priority**: Critical
- **Preconditions**: A unit with code "CC001" already exists
- **Steps**:
  1. POST /api/org-units with body: `{name: "Chi cục 2", code: "CC001", type: "CHI_CUC"}`
  2. Observe response status
- **Expected**: 400 Bad Request, error message contains "đã tồn tại"
- **Type**: negative

### TC-003: Create Unit Under Parent (Hierarchy BR-016)
- **ID**: TC-F003-003
- **Priority**: Critical
- **Preconditions**: A root unit exists (e.g., "Cục Hàng hải" with code "CUC_HH")
- **Steps**:
  1. POST /api/org-units with body: `{name: "Chi cục 1", code: "CC001", type: "CHI_CUC", parentId: <root-id>}`
  2. Observe response and check path/level
- **Expected**: 201 Created, path = "/{root-id}/", level = 1 (child of root = level 1 since root itself is level 1)
- **Type**: functional

### TC-004: Self-Parenting Rejected (BR-016)
- **ID**: TC-F003-004
- **Priority**: Critical
- **Preconditions**: A unit exists with ID "test-unit-id"
- **Steps**:
  1. PUT /api/org-units/test-unit-id with body: `{parentId: "test-unit-id"}`
  2. Observe response status
- **Expected**: 400 Bad Request, error message about self-parenting
- **Type**: negative

### TC-005: Circular Reference via Descendant Rejected (BR-016)
- **ID**: TC-F003-005
- **Priority**: Critical
- **Preconditions**: Unit hierarchy: Root → Parent → Child (Child is descendant of Root)
- **Steps**:
  1. PUT /api/org-units/child-id with body: `{parentId: "root-id"}` (making child the parent of its own ancestor)
  2. Observe response status
- **Expected**: 400 Bad Request, error message about circular reference
- **Type**: negative

### TC-006: Update Unit Fields
- **ID**: TC-F003-006
- **Priority**: Major
- **Preconditions**: A unit exists with name "Old Name", code "OLD001"
- **Steps**:
  1. PUT /api/org-units/{id} with body: `{name: "New Name", description: "Updated"}`
  2. Observe response
- **Expected**: 200 OK, name updated to "New Name", other fields unchanged
- **Type**: functional

### TC-007: Delete Unit with Children Rejected (BR-014)
- **ID**: TC-F003-007
- **Priority**: Critical
- **Preconditions**: A parent unit has 2 child units
- **Steps**:
  1. DELETE /api/org-units/{parent-id}
  2. Observe response status
- **Expected**: 400 Bad Request, error message about having children
- **Type**: negative

### TC-008: Delete Leaf Unit (No Children)
- **ID**: TC-F003-008
- **Priority**: Major
- **Preconditions**: A leaf unit (no children) exists
- **Steps**:
  1. DELETE /api/org-units/{leaf-id}
  2. Observe response status
- **Expected**: 200 OK (soft-delete), unit excluded from subsequent queries
- **Type**: functional

### TC-009: Submit for Approval — DRAFT to PENDING (BR-015)
- **ID**: TC-F003-009
- **Priority**: Critical
- **Preconditions**: A unit in DRAFT status exists
- **Steps**:
  1. POST /api/org-units/{id}/submit
  2. Observe response
- **Expected**: 200 OK, status changed to PENDING
- **Type**: functional

### TC-010: Approve Pending Unit (BR-015)
- **ID**: TC-F003-010
- **Priority**: Critical
- **Preconditions**: A unit in PENDING status exists
- **Steps**:
  1. POST /api/org-units/{id}/approve?comments="OK"
  2. Observe response
- **Expected**: 200 OK, status changed to APPROVED, approvedAt set
- **Type**: functional

### TC-011: Reject Pending Unit (BR-015)
- **ID**: TC-F003-011
- **Priority**: Critical
- **Preconditions**: A unit in PENDING status exists
- **Steps**:
  1. POST /api/org-units/{id}/reject?comments="Not ready"
  2. Observe response
- **Expected**: 200 OK, status changed to REJECTED, approvedAt cleared
- **Type**: functional

### TC-012: Reject Approve on Non-PENDING Unit
- **ID**: TC-F003-012
- **Priority**: Major
- **Preconditions**: A unit in DRAFT or APPROVED status exists
- **Steps**:
  1. POST /api/org-units/{id}/approve
  2. Observe response status
- **Expected**: 400 Bad Request or 409 Conflict, status unchanged
- **Type**: negative

### TC-013: Build Full Org Tree
- **ID**: TC-F003-013
- **Priority**: Major
- **Preconditions**: Multiple units at different hierarchy levels exist
- **Steps**:
  1. GET /api/org-units/tree
  2. Observe response structure
- **Expected**: 200 OK, nested tree with children arrays, ordered by path then sortOrder
- **Type**: functional

### TC-014: Paginated Unit List
- **ID**: TC-F003-014
- **Priority**: Major
- **Preconditions**: At least 50 units exist
- **Steps**:
  1. GET /api/org-units?page=0&size=20
  2. Observe response
- **Expected**: 200 OK, Page<T> with 20 items, totalElements = 50+
- **Type**: functional

### TC-015: Search by Name
- **ID**: TC-F003-015
- **Priority**: Major
- **Preconditions**: Unit with name "Chi cục Hà Nội" exists
- **Steps**:
  1. GET /api/org-units/search?q=Hà Nội
  2. Observe response
- **Expected**: 200 OK, list contains matching unit (case-insensitive)
- **Type**: functional

### TC-016: Search by Code
- **ID**: TC-F003-016
- **Priority**: Major
- **Preconditions**: Unit with code "CC-HN-001" exists
- **Steps**:
  1. GET /api/org-units/search?q=CC-HN-001
  2. Observe response
- **Expected**: 200 OK, list contains matching unit
- **Type**: functional

### TC-017: Filter by Type
- **ID**: TC-F003-017
- **Priority**: Normal
- **Preconditions**: Units of various types exist (CUC, CHI_CUC, CANG_VU, TCT)
- **Steps**:
  1. GET /api/org-units/filter?type=CHI_CUC
  2. Observe response
- **Expected**: 200 OK, all returned units have type CHI_CUC
- **Type**: functional

### TC-018: Filter by Status
- **ID**: TC-F003-018
- **Priority**: Normal
- **Preconditions**: Units of various statuses exist
- **Steps**:
  1. GET /api/org-units/filter?status=PENDING
  2. Observe response
- **Expected**: 200 OK, all returned units have status PENDING
- **Type**: functional

### TC-019: Move Unit to Different Parent
- **ID**: TC-F003-019
- **Priority**: Critical
- **Preconditions**: Unit A has parent P1; parent P2 exists at same level as P1
- **Steps**:
  1. PUT /api/org-units/{a-id} with body: `{parentId: <p2-id>}`
  2. Verify subtree paths updated
- **Expected**: 200 OK, A's path starts with P2's path, all descendants' paths updated
- **Type**: functional

### TC-020: Coefficient = 0 Rejected (BR-017)
- **ID**: TC-F003-020
- **Priority**: Major
- **Preconditions**: None
- **Steps**:
  1. POST /api/org-units with body: `{name: "Test", code: "TEST001", type: "CUC", coefficient: 0}`
  2. Observe response status
- **Expected**: 400 Bad Request (Jakarta Validation @DecimalMin fails)
- **Type**: negative

### TC-021: Coefficient = Negative Rejected (BR-017)
- **ID**: TC-F003-021
- **Priority**: Major
- **Preconditions**: None
- **Steps**:
  1. POST /api/org-units with body: `{name: "Test", code: "TEST002", type: "CUC", coefficient: -1}`
  2. Observe response status
- **Expected**: 400 Bad Request (Jakarta Validation @DecimalMin fails)
- **Type**: negative

### TC-022: Name Exceeds 200 Characters Rejected (BR-003-08)
- **ID**: TC-F003-022
- **Priority**: Major
- **Preconditions**: None
- **Steps**:
  1. POST /api/org-units with body: `{name: "A".repeat(201), code: "TEST003", type: "CUC"}`
  2. Observe response status
- **Expected**: 400 Bad Request (@Size max=200 fails)
- **Type**: boundary

### TC-023: Unit Code Exactly 50 Characters Accepted
- **ID**: TC-F003-023
- **Priority**: Minor
- **Preconditions**: None
- **Steps**:
  1. POST /api/org-units with body: `{name: "Test", code: "C".repeat(50), type: "CUC"}`
  2. Observe response status
- **Expected**: 201 Created (code within @Size max=50)
- **Type**: boundary

### TC-024: Unauthenticated Access Returns 401
- **ID**: TC-F003-024
- **Priority**: Critical
- **Preconditions**: No auth token
- **Steps**:
  1. GET /api/org-units
  2. Observe response status
- **Expected**: 401 Unauthorized
- **Type**: security

### TC-025: Non-Admin Write Returns 403
- **ID**: TC-F003-025
- **Priority**: Critical
- **Preconditions**: Authenticated user without admin:manage permission
- **Steps**:
  1. POST /api/org-units with valid body
  2. Observe response status
- **Expected**: 403 Forbidden
- **Type**: security

### TC-026: Verify Path Format
- **ID**: TC-F003-026
- **Priority**: Major
- **Preconditions**: Multiple units at 3 levels exist
- **Steps**:
  1. GET /api/org-units/{root-id}
  2. GET /api/org-units/{child-id}
  3. GET /api/org-units/{grandchild-id}
- **Expected**: Paths: `"/{root-id}/"`, `"/{root-id}/{child-id}/"`, `"/{root-id}/{child-id}/{grandchild-id}/"` — trailing slash format
- **Type**: functional

### TC-027: Verify Level Calculation
- **ID**: TC-F003-027
- **Priority**: Major
- **Preconditions**: Units at levels 1, 2, 3 exist
- **Steps**:
  1. GET /api/org-units/{level-1-id}
  2. GET /api/org-units/{level-2-id}
  3. GET /api/org-units/{level-3-id}
- **Expected**: level = 1, 2, 3 respectively
- **Type**: functional

### TC-028: Soft-Delete Exclusion in List
- **ID**: TC-F003-028
- **Priority**: Major
- **Preconditions**: A deleted unit exists
- **Steps**:
  1. GET /api/org-units?page=0&size=100
  2. Count returned units
- **Expected**: Deleted unit NOT in response list (WHERE deletedAt IS NULL)
- **Type**: functional

### TC-029: Audit Trail on Create
- **ID**: TC-F003-029
- **Priority**: Major
- **Preconditions**: None
- **Steps**:
  1. Create a new unit
  2. Query UnitHistory for the created unit (future endpoint)
- **Expected**: UnitHistory record with action="CREATED", performedAt recorded
- **Type**: functional

### TC-030: Audit Trail on Approval
- **ID**: TC-F003-030
- **Priority**: Major
- **Preconditions**: A unit was approved
- **Steps**:
  1. Query UnitHistory for the approved unit
- **Expected**: UnitHistory record with action="APPROVED", approver name recorded, approvedAt comment captured
- **Type**: functional

### TC-031: Unit Type Enum Validation
- **ID**: TC-F003-031
- **Priority**: Major
- **Preconditions**: None
- **Steps**:
  1. POST /api/org-units with body: `{name: "Test", code: "TEST004", type: "INVALID_TYPE"}`
  2. Observe response
- **Expected**: 400 Bad Request (enum deserialization fails)
- **Type**: negative

### TC-032: Subtree Query Under Specific Unit
- **ID**: TC-F003-032
- **Priority**: Normal
- **Preconditions**: Multi-level hierarchy exists
- **Steps**:
  1. GET /api/org-units/{parent-id}/subtree
  2. Observe response
- **Expected**: 200 OK, only units under the specified parent returned (including the parent itself)
- **Type**: functional

### TC-033: Direct Children Query
- **ID**: TC-F003-033
- **Priority**: Normal
- **Preconditions**: A parent unit has 3 children
- **Steps**:
  1. GET /api/org-units?parentId={parent-id}
  2. Observe response
- **Expected**: 200 OK, exactly 3 direct children returned (not grandchildren)
- **Type**: functional

### TC-034: Re-submit After Rejection (REJECTED → PENDING)
- **ID**: TC-F003-034
- **Priority**: Major
- **Preconditions**: A unit in REJECTED status exists
- **Steps**:
  1. POST /api/org-units/{id}/submit
  2. Observe response
- **Expected**: 200 OK, status changed to PENDING
- **Type**: functional

### TC-035: Coefficient Valid (1.50) Accepted
- **ID**: TC-F003-035
- **Priority**: Normal
- **Preconditions**: None
- **Steps**:
  1. POST /api/org-units with body: `{name: "Test", code: "TEST005", type: "CUC", coefficient: 1.50}`
  2. Observe response
- **Expected**: 201 Created, coefficient stored as 1.5
- **Type**: functional

### TC-036: Coefficient Null Accepted
- **ID**: TC-F003-036
- **Priority**: Normal
- **Preconditions**: None
- **Steps**:
  1. POST /api/org-units with body: `{name: "Test", code: "TEST006", type: "CUC", coefficient: null}`
  2. Observe response
- **Expected**: 201 Created, coefficient is null/omitted
- **Type**: functional

### TC-037: Root Unit Seeding (V19 migration)
- **ID**: TC-F003-037
- **Priority**: Major
- **Preconditions**: Database freshly migrated with V19
- **Steps**:
  1. Query org_units for root unit (parentId IS NULL)
- **Expected**: Exactly one root unit with name "Cục Hàng hải", code "CUC_HH", type "CUC", status "APPROVED"
- **Type**: integration

### TC-038: Migration Idempotency (V18)
- **ID**: TC-F003-038
- **Priority**: Normal
- **Preconditions**: V18 migration already applied
- **Steps**:
  1. Apply V18 migration again
- **Expected**: No errors (ALTER TABLE IF EXISTS, CREATE INDEX IF NOT EXISTS, DO blocks handle idempotency)
- **Type**: integration

### TC-039: Pagination Size Cap at 100
- **ID**: TC-F003-039
- **Priority**: Normal
- **Preconditions**: Many units exist (>100)
- **Steps**:
  1. GET /api/org-units?page=0&size=200
  2. Observe response
- **Expected**: 200 OK, max 100 items returned (Math.min(size, 100) enforced)
- **Type**: boundary

### TC-040: Response DTO Serialization (JSON)
- **ID**: TC-F003-040
- **Priority**: Normal
- **Preconditions**: Unit with all fields populated exists
- **Steps**:
  1. GET /api/org-units/{id}
  2. Inspect JSON response
- **Expected**: All non-null fields present; children omitted in flat response (JsonInclude.NON_EMPTY)
- **Type**: ui

### TC-041: Update Code Unique Check Excludes Self
- **ID**: TC-F003-041
- **Priority**: Critical
- **Preconditions**: Unit with code "CC001" exists
- **Steps**:
  1. PUT /api/org-units/{id} with body: `{code: "CC001"}` (same code)
  2. Observe response
- **Expected**: 200 OK (no false-positive on same entity update)
- **Type**: functional

### TC-042: Update Parent Triggers Path Rebuild
- **ID**: TC-F003-042
- **Priority**: Critical
- **Preconditions**: Unit with 2 descendants exists; parent changed
- **Steps**:
  1. PUT /api/org-units/{id} with body: `{parentId: <new-parent>}`
  2. Verify unit path and descendants' paths
- **Expected**: Unit path updated; all descendant paths updated via cascade
- **Type**: integration

### TC-043: Approval Comments Captured
- **ID**: TC-F003-043
- **Priority**: Major
- **Preconditions**: Pending unit exists
- **Steps**:
  1. POST /api/org-units/{id}/approve?comments="Approved after review"
  2. Check UnitHistory
- **Expected**: UnitHistory record contains "Approved after review" in details/note
- **Type**: functional

### TC-044: Get Single Unit by ID
- **ID**: TC-F003-044
- **Priority**: Minor
- **Preconditions**: Unit exists
- **Steps**:
  1. GET /api/org-units/{id}
  2. Observe response
- **Expected**: 200 OK, single unit with all fields populated, children omitted
- **Type**: functional

### TC-045: Unit Not Found Returns 404
- **ID**: TC-F003-045
- **Priority**: Minor
- **Preconditions**: Non-existent UUID
- **Steps**:
  1. GET /api/org-units/non-existent-uuid
  2. Observe response
- **Expected**: 404 Not Found (EntityNotFoundException)
- **Type**: negative

## Test Summary

| Category | Count | Coverage |
|---|---|---|
| CRUD Operations | 8 | TC-001 through TC-008, TC-006, TC-041, TC-044 |
| Approval Workflow | 7 | TC-009 through TC-012, TC-034, TC-043, TC-030 |
| Hierarchy/Tree | 7 | TC-003, TC-004, TC-005, TC-013, TC-019, TC-026, TC-027 |
| Search/Filter | 5 | TC-014 through TC-018, TC-032, TC-033, TC-039 |
| Business Rules (BR) | 10 | TC-002, TC-007, TC-010-012, TC-020-022, TC-031, TC-035-036 |
| Security/RBAC | 2 | TC-024, TC-025 |
| Audit Trail | 2 | TC-029, TC-030, TC-043 |
| Integration/Migration | 4 | TC-037, TC-038, TC-042 |
| Boundary/Edge Cases | 5 | TC-022, TC-023, TC-039, TC-040, TC-045 |
| **Total** | **45** | |
