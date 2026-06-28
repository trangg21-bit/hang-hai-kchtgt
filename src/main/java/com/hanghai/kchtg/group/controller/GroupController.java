package com.hanghai.kchtg.group.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.group.dto.AddGroupMemberRequest;
import com.hanghai.kchtg.group.dto.CreateUserGroupRequest;
import com.hanghai.kchtg.group.dto.GroupCopyRequest;
import com.hanghai.kchtg.group.dto.GroupMemberResponse;
import com.hanghai.kchtg.group.dto.PaginatedGroupResponse;
import com.hanghai.kchtg.group.dto.UpdateUserGroupRequest;
import com.hanghai.kchtg.group.dto.UserGroupResponse;
import com.hanghai.kchtg.group.entity.GroupHistory;
import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.service.UserGroupService;
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
 * member management, copy group, history endpoints.
 * </p>
 * <p>
 * Base path: {@code /api/groups}
 * </p>
 */
@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final UserGroupService service;

    public GroupController(UserGroupService service) {
        this.service = service;
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
     * - groupType (optional: department/project/custom)
     * - myGroups (optional: true = only groups user belongs to, Ca nhan)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedGroupResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String groupType,
            @RequestParam(required = false, defaultValue = "false") Boolean myGroups,
            Authentication authentication) {

        if (Boolean.TRUE.equals(myGroups)) {
            UUID currentUserId = extractUserId(authentication);
            if (currentUserId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Yeu cau xac thuc"));
            }
            PaginatedGroupResponse result = service.findMyGroups(currentUserId, search, groupType, page, size);
            return ResponseEntity.ok(ApiResponse.success(result));
        }

        PaginatedGroupResponse result = service.list(search, groupType, null, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/groups/{id} — Lay chi tiet mot nhom.
     * Role: All authenticated users
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserGroupResponse>> get(@PathVariable UUID id) {
        UserGroupResponse group = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(group));
    }

    /**
     * POST /api/groups — Tao moi nhom. Tra ve 201 Created.
     * Role: Admin only (BR-012: groupType required)
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

        UserGroupResponse group = service.create(request, operatorId, operatorName);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao nhom thanh cong", group));
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

        UserGroupResponse group = service.update(id, request, operatorId, operatorName);
        return ResponseEntity.ok(ApiResponse.success("Cap nhat nhom thanh cong", group));
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
        return ResponseEntity.ok(ApiResponse.success("Xoa nhom thanh cong", null));
    }

    // ── Member Management ───────────────────────────────────────────

    /**
     * POST /api/groups/{id}/members — Them thanh vien.
     * Role: Admin, Can bo
     */
    @PostMapping("/{id}/members")
    @PreAuthorize("@auth.check(authentication, 'group:member:manage')")
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
                .body(ApiResponse.success("Da them thanh vien", GroupMemberResponse.from(member)));
    }

    /**
     * DELETE /api/groups/{groupId}/members/{userId} — Xoa thanh vien.
     * Role: Admin, Can bo
     */
    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("@auth.check(authentication, 'group:member:manage')")
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
        return ResponseEntity.ok(ApiResponse.success("Da xoa thanh vien khoi nhom", null));
    }

    /**
     * GET /api/groups/{id}/members — Liet ke thanh vien (phan trang).
     * Role: Admin, Lanh dao, Can bo, Ca nhan
     */
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<PaginatedGroupResponse>> listMembers(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<GroupMember> pageResult = service.findMembers(id, page, size);

        List<GroupMemberResponse> items = pageResult.getContent().stream()
                .map(GroupMemberResponse::from)
                .toList();

        PaginatedGroupResponse result = new PaginatedGroupResponse(items, pageResult.getTotalElements(),
                pageResult.getNumber(), pageResult.getSize());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Copy Group (BR-014) ────────────────────────────────────────

    /**
     * POST /api/groups/{id}/copy — Sao cop nhom.
     * Role: Admin only
     */
    @PostMapping("/{id}/copy")
    @PreAuthorize("@auth.check(authentication, 'group:copy')")
    public ResponseEntity<ApiResponse<UserGroupResponse>> copy(
            @PathVariable UUID id,
            @Valid @RequestBody GroupCopyRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yeu cau xac thuc"));
        }

        UserGroup copied = service.copy(id, request, operatorId, operatorName);
        UserGroupResponse response = UserGroupResponse.from(copied,
                0L); // will be populated with actual count by client or separate call
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sao cop thanh cong", response));
    }

    // ── History (BR-015) ───────────────────────────────────────────

    /**
     * GET /api/groups/{id}/history — Lich su thay doi nhom.
     * Role: Admin
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'group:history')")
    public ResponseEntity<ApiResponse<List<GroupHistory>>> getHistory(@PathVariable UUID id) {
        List<GroupHistory> history = service.findHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /**
     * GET /api/groups/{id}/history/paginated — Lich su thay doi (phan trang).
     * Role: Admin
     */
    @GetMapping("/{id}/history/paginated")
    @PreAuthorize("@auth.check(authentication, 'group:history')")
    public ResponseEntity<ApiResponse<PaginatedGroupResponse>> getHistoryPaginated(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<GroupHistory> pageResult = service.findHistoryPaginated(id, page, size);

        List<GroupHistory> items = pageResult.getContent();

        PaginatedGroupResponse result = new PaginatedGroupResponse(items, pageResult.getTotalElements(),
                pageResult.getNumber(), pageResult.getSize());
        return ResponseEntity.ok(ApiResponse.success(result));
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
