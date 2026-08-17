package com.hanghai.kchtg.group.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.group.dto.*;
import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.group.service.UserGroupService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller cho CRUD quan ly nhom nguoi dung.
 * <p>
 * M-001 F-002: Full RBAC enforcement, pagination, search, filter,
 * member management and permission endpoints.
 * </p>
 * <p>
 * Base path: {@code /api/groups}
 * </p>
 */
@RestController
@RequestMapping("/api/v1/groups")
public class GroupController {

    private final UserGroupService service;
    private final OrgUnitCacheService orgUnitCacheService;

    public GroupController(UserGroupService service, OrgUnitCacheService orgUnitCacheService) {
        this.service = service;
        this.orgUnitCacheService = orgUnitCacheService;
    }

    // ── Group CRUD ──────────────────────────────────────────────────

    /**
     * GET /api/groups — Liet ke nhom (phan trang, search, filter).
     * Role: Admin, Lanh dao, Can bo (view all)
     *
     * Query params:
     * - page (default 0)
     * - size (default 20)
     * - search (optional, filters by name LIKE)
     * - organizationId (optional: restrict to one unit inside current scope)
     * - status (optional: active/inactive)
     * - myGroups (optional: true = only groups user belongs to, Ca nhan)
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'group:read')")
    public ResponseEntity<ApiResponse<PaginatedGroupResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false, defaultValue = "false") Boolean myGroups,
            Authentication authentication) {

        if (Boolean.TRUE.equals(myGroups)) {
            UUID currentUserId = extractUserId(authentication);
            if (currentUserId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Yeu cau xac thuc"));
            }
            PaginatedGroupResponse result = service.findMyGroups(currentUserId, search, code, status, organizationId, page, size);
            return ResponseEntity.ok(ApiResponse.success(result));
        }

        PaginatedGroupResponse result = service.list(search, code, status, organizationId, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/groups/{id} — Lay chi tiet mot nhom.
     * Role: All authenticated users
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'group:read')")
    public ResponseEntity<ApiResponse<UserGroupResponse>> get(@PathVariable UUID id) {
        UserGroupResponse group = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(group));
    }

    /**
     * POST /api/groups — Tao moi nhom. Tra ve 201 Created.
     * Role: Admin only.
     */
    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'group:create')")
    public ResponseEntity<ApiResponse<UserGroupResponse>> create(
            @Valid @RequestBody CreateUserGroupRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yeu cau xac thuc"));
        }

        UserGroup created = service.create(request, operatorId, operatorName);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo nhóm thành công",
                        UserGroupResponse.from(created, 0L, orgUnitCacheService.getName(created.getOrganizationId()))));
    }

    /**
     * PUT /api/groups/{id} — Cap nhat nhom.
     * Role: Admin, Can bo
     */
    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'group:edit')")
    public ResponseEntity<ApiResponse<UserGroupResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserGroupRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yeu cau xac thuc"));
        }

        UserGroup updated = service.update(id, request, operatorId, operatorName);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhóm thành công",
                        UserGroupResponse.from(updated, 0L, orgUnitCacheService.getName(updated.getOrganizationId()))));
    }

    /**
     * DELETE /api/groups/{id} — Xoa nhom.
     * Role: Admin only (BR-009, BR-011)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'group:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yeu cau xac thuc"));
        }

        service.delete(id, operatorId, operatorName);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhóm thành công", null));
    }

    // ── Member Management ───────────────────────────────────────────

    /**
     * POST /api/groups/{id}/members — Them thanh vien.
     * Role: Admin, Can bo
     */
    @PostMapping("/{id}/members")
    @PreAuthorize("@auth.check(authentication, 'groupmember:manage')")
    public ResponseEntity<ApiResponse<GroupMemberResponse>> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddGroupMemberRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yeu cau xac thuc"));
        }

        GroupMember member = service.addMember(id, request, operatorId, operatorName);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm thành viên", GroupMemberResponse.from(member)));
    }

    /** POST /api/groups/{id}/members/batch — thêm tối đa 100 thành viên nguyên tử. */
    @PostMapping("/{id}/members/batch")
    @PreAuthorize("@auth.check(authentication, 'groupmember:manage')")
    public ResponseEntity<ApiResponse<BatchAddGroupMembersResponse>> addMembers(
            @PathVariable UUID id,
            @Valid @RequestBody BatchAddGroupMembersRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu xác thực"));
        }

        BatchAddGroupMembersResponse result = service.addMembers(id, request, operatorId, operatorName);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm thành viên", result));
    }

    /**
     * DELETE /api/groups/{groupId}/members/{userId} — Xoa thanh vien.
     * Role: Admin, Can bo
     */
    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("@auth.check(authentication, 'groupmember:manage')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID groupId,
            @PathVariable UUID userId,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yeu cau xac thuc"));
        }

        service.removeMember(groupId, userId, operatorId, operatorName);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thành viên khỏi nhóm", null));
    }

    /**
     * GET /api/groups/{id}/members — Liet ke thanh vien (phan trang).
     * Role: Admin, Lanh dao, Can bo, Ca nhan
     */
    @GetMapping("/{id}/members")
    @PreAuthorize("@auth.check(authentication, 'group:read')")
    public ResponseEntity<ApiResponse<PaginatedGroupMemberResponse>> listMembers(
            @PathVariable UUID id,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<GroupMember> pageResult = service.findMembers(id, search, page, size);

        List<GroupMemberResponse> items = pageResult.getContent().stream()
                .map(GroupMemberResponse::from)
                .toList();
        PaginatedGroupMemberResponse result = new PaginatedGroupMemberResponse(items, pageResult.getTotalElements(),
                pageResult.getNumber(), pageResult.getSize());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Group Permission (F-002 UC-012) ─────────────────────────────

    /** Lấy các quyền trực tiếp đã gán cho nhóm để hiển thị trong modal phân quyền. */
    @GetMapping("/{id}/permissions")
    @PreAuthorize("@auth.check(authentication, 'group:permission')")
    public ResponseEntity<ApiResponse<List<String>>> listGroupPermissions(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findGroupPermissions(id)));
    }

    /** Thay thế danh sách quyền trực tiếp của nhóm và làm mới cache thành viên. */
    @PutMapping("/{id}/permissions")
    @PreAuthorize("@auth.check(authentication, 'group:permission')")
    public ResponseEntity<ApiResponse<List<String>>> updateGroupPermissions(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGroupPermissionsRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);
        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu xác thực"));
        }
        List<String> permissions = service.updateGroupPermissions(id, request, operatorId, operatorName);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật phân quyền cho nhóm", permissions));
    }

    // ── Lock / Unlock (F-002 AC-002-15, AC-002-16) ─────────────────

    /**
     * PATCH /api/v1/groups/{id}/lock — Khóa/Mở khóa nhóm.
     * Chuyển đổi trạng thái ACTIVE ↔ INACTIVE và ghi nhận LOCK/UNLOCK vào lịch sử.
     * Role: group:lock
     */
    @PatchMapping("/{id}/lock")
    @PreAuthorize("@auth.check(authentication, 'group:lock')")
    public ResponseEntity<ApiResponse<UserGroupResponse>> lock(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu xác thực"));
        }

        UserGroup updated = service.lockGroup(id, operatorId, operatorName);
        String message = updated.getStatus() == com.hanghai.kchtg.group.entity.GroupStatus.ACTIVE
                ? "Đã mở khóa nhóm"
                : "Đã khóa nhóm";
        return ResponseEntity.ok(ApiResponse.success(message,
                UserGroupResponse.from(updated, 0L, orgUnitCacheService.getName(updated.getOrganizationId()))));
    }

    // ── Helpers ─────────────────────────────────────────────────────

    /**
     * Extract user UUID from Spring Security Authentication.
     * The principal is expected to be a String (username) or a UserDetails-like object.
     */
    private UUID extractUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        // Spring Security default: principal is a String (username) for JWT filters
        // Some implementations wrap it in a map or UserDetails
        if (principal instanceof UUID) {
            return (UUID) principal;
        }
        if (principal instanceof String) {
            try {
                return UUID.fromString((String) principal);
            } catch (IllegalArgumentException e) {
                // principal is a username string, not UUID
                // In this case, return null — service layer will need to resolve from username
                return null;
            }
        }
        // If principal is a UserDetails-like object with an getId() method
        try {
            java.lang.reflect.Method getIdMethod = principal.getClass().getMethod("getId");
            Object id = getIdMethod.invoke(principal);
            if (id instanceof UUID) {
                return (UUID) id;
            }
            if (id instanceof String) {
                return UUID.fromString((String) id);
            }
        } catch (Exception e) {
            // Fallback: no ID method
        }

        return null;
    }

    /**
     * Extract user name from Spring Security Authentication.
     */
    private String extractUserName(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return "system";
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof String) {
            return (String) principal;
        }

        try {
            java.lang.reflect.Method getNameMethod = principal.getClass().getMethod("getName");
            return (String) getNameMethod.invoke(principal);
        } catch (Exception e) {
            try {
                java.lang.reflect.Method getUserNameMethod = principal.getClass().getMethod("getUsername");
                return (String) getUserNameMethod.invoke(principal);
            } catch (Exception ex) {
                return "system";
            }
        }
    }
}
