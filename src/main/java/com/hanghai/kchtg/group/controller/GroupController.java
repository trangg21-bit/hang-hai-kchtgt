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

import com.hanghai.kchtg.user.repository.UserRepository;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for User Group Management (M-010 F-002).
 */
@RestController
@RequestMapping("/api/v1/groups")
public class GroupController {

    private final UserGroupService service;
    private final OrgUnitCacheService orgUnitCacheService;
    private final UserRepository userRepository;

    public GroupController(UserGroupService service, OrgUnitCacheService orgUnitCacheService,
            UserRepository userRepository) {
        this.service = service;
        this.orgUnitCacheService = orgUnitCacheService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'group:read') or @auth.check(authentication, 'group:manage')")
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
                        .body(ApiResponse.error("Yêu cầu xác thực"));
            }
            PaginatedGroupResponse result = service.findMyGroups(currentUserId, search, code, status, organizationId,
                    page, size);
            return ResponseEntity.ok(ApiResponse.success(result));
        }

        PaginatedGroupResponse result = service.list(search, code, status, organizationId, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'group:read') or @auth.check(authentication, 'group:manage')")
    public ResponseEntity<ApiResponse<UserGroupResponse>> get(@PathVariable UUID id) {
        UserGroupResponse group = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(group));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'group:create') or @auth.check(authentication, 'group:manage')")
    public ResponseEntity<ApiResponse<UserGroupResponse>> create(
            @Valid @RequestBody CreateUserGroupRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu xác thực"));
        }

        UserGroup created = service.create(request, operatorId, operatorName);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo nhóm thành công",
                        UserGroupResponse.from(created, 0L, orgUnitCacheService.getName(created.getOrganizationId()))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'group:edit') or @auth.check(authentication, 'group:update') or @auth.check(authentication, 'group:manage')")
    public ResponseEntity<ApiResponse<UserGroupResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserGroupRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu xác thực"));
        }

        UserGroup updated = service.update(id, request, operatorId, operatorName);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhóm thành công",
                UserGroupResponse.from(updated, 0L, orgUnitCacheService.getName(updated.getOrganizationId()))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'group:delete') or @auth.check(authentication, 'group:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu xác thực"));
        }

        service.delete(id, operatorId, operatorName);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhóm thành công", null));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("@auth.check(authentication, 'groupmember:manage') or @auth.check(authentication, 'group:manage')")
    public ResponseEntity<ApiResponse<GroupMemberResponse>> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddGroupMemberRequest request,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu xác thực"));
        }

        GroupMember member = service.addMember(id, request, operatorId, operatorName);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm thành viên", GroupMemberResponse.from(member)));
    }

    @PostMapping("/{id}/members/batch")
    @PreAuthorize("@auth.check(authentication, 'groupmember:manage') or @auth.check(authentication, 'group:manage')")
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

    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("@auth.check(authentication, 'groupmember:manage') or @auth.check(authentication, 'group:manage')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID groupId,
            @PathVariable UUID userId,
            Authentication authentication) {
        UUID operatorId = extractUserId(authentication);
        String operatorName = extractUserName(authentication);

        if (operatorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu xác thực"));
        }

        service.removeMember(groupId, userId, operatorId, operatorName);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thành viên khỏi nhóm", null));
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("@auth.check(authentication, 'group:read') or @auth.check(authentication, 'groupmember:manage') or @auth.check(authentication, 'group:manage')")
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

    @GetMapping("/{id}/permissions")
    @PreAuthorize("@auth.check(authentication, 'group:permission') or @auth.check(authentication, 'group:manage')")
    public ResponseEntity<ApiResponse<List<String>>> listGroupPermissions(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findGroupPermissions(id)));
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("@auth.check(authentication, 'group:permission') or @auth.check(authentication, 'group:manage')")
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

    @PatchMapping("/{id}/lock")
    @PreAuthorize("@auth.check(authentication, 'group:lock') or @auth.check(authentication, 'group:manage')")
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

    private UUID extractUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UUID) {
            return (UUID) principal;
        }

        if (principal instanceof com.hanghai.kchtg.user.entity.User) {
            return ((com.hanghai.kchtg.user.entity.User) principal).getId();
        }

        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            String username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            return userRepository.findByUsername(username).map(com.hanghai.kchtg.user.entity.User::getId).orElse(null);
        }

        if (principal instanceof String) {
            return userRepository.findByUsername((String) principal).map(com.hanghai.kchtg.user.entity.User::getId)
                    .orElse(null);
        }

        return null;
    }

    private String extractUserName(Authentication authentication) {
        if (authentication == null) {
            return "System";
        }
        return authentication.getName();
    }
}