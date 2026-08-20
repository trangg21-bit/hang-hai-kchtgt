package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.accesslog.annotation.AuditLog;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.dto.ChangeStatusRequest;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.dto.UserResponse;
import com.hanghai.kchtg.user.dto.UserDetailResponse;
import com.hanghai.kchtg.user.dto.UserPageResponse;
import com.hanghai.kchtg.user.dto.GrantUserPermissionRequest;
import com.hanghai.kchtg.user.dto.UserPermissionOverrideResponse;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.service.UserService;
import com.hanghai.kchtg.user.service.UserPermissionService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.admin.entity.AdminAuditLog;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST Controller quan ly tai khoan nguoi dung.
 * <p>
 * Base paths: {@code /api/users} and the versioned {@code /api/v1/users}
 * </p>
 */
@RestController
@RequestMapping({ "/api/users", "/api/v1/users" })
public class UserController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Map<String, String> USER_SORT_FIELDS = Map.of(
            "username", "username",
            "fullName", "fullName",
            "email", "email",
            "orgUnitName", "orgUnit.name",
            "lastLoginAt", "lastLoginAt",
            "status", "status",
            "createdAt", EntityFields.CREATED_AT);

    private final UserService userService;
    private final UserPermissionService userPermissionService;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final PermissionCacheService permissionCacheService;
    private final UserRepository userRepository;
    private final OrgUnitCacheService orgUnitCacheService;

    public UserController(UserService userService, UserPermissionService userPermissionService,
            @Nullable AdminAuditLogRepository adminAuditLogRepository,
            @Nullable PermissionCacheService permissionCacheService,
            UserRepository userRepository,
            @Nullable OrgUnitCacheService orgUnitCacheService) {
        this.userService = userService;
        this.userPermissionService = userPermissionService;
        this.adminAuditLogRepository = adminAuditLogRepository;
        this.permissionCacheService = permissionCacheService;
        this.userRepository = userRepository;
        this.orgUnitCacheService = orgUnitCacheService;
    }

    /**
     * T-001: Lay danh sach nguoi dung voi phan trang (kem statusCounts).
     * Default 20 items/page, max 100. Sort by created_at DESC.
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'user:read')")
    public ResponseEntity<ApiResponse<UserPageResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortField,
            @RequestParam(required = false) String sortOrder) {
        // Enforce max page size
        int actualSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        // Immutable Map.of rejects a null key. The list screen legitimately
        // omits sortField on its initial request, so resolve it only when set.
        String mappedSortField = sortField == null ? null : USER_SORT_FIELDS.get(sortField);
        Sort.Direction direction = "ascend".equalsIgnoreCase(sortOrder)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Sort sort = mappedSortField == null
                ? Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)
                : Sort.by(direction, mappedSortField);
        Pageable pageable = PageRequest.of(Math.max(page, 0), actualSize, sort);
        UserPageResponse result = userService.findAllWithCounts(search, fullName, status, orgUnitId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Lay chi tiet mot nguoi dung theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'user:read')")
    public ResponseEntity<ApiResponse<UserDetailResponse>> getById(@PathVariable UUID id) {
        var entity = userService.findById(id);
        var auditIds = java.util.stream.Stream.of(entity.getCreatedBy(), entity.getUpdatedBy(), entity.getDeletedBy())
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        var auditNames = userRepository.findAllById(auditIds).stream()
                .collect(java.util.stream.Collectors.toMap(com.hanghai.kchtg.user.entity.User::getId,
                        user -> user.getFullName() == null || user.getFullName().isBlank() ? user.getUsername()
                                : user.getFullName(),
                        (first, second) -> first));
        UserDetailResponse user = UserDetailResponse.from(entity, orgUnitCacheService, auditNames);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Tao moi nguoi dung.
     */
    @PostMapping
    @AuditLog(module = "USER", action = "CREATE_USER")
    @PreAuthorize("@auth.check(authentication, 'user:create')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        var created = userService.create(request);
        UserResponse user = UserResponse.from(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tao người dùng thành công", user));
    }

    /**
     * Cap nhat thong tin nguoi dung.
     */
    @PutMapping("/{id}")
    @AuditLog(module = "USER", action = "UPDATE_USER")
    @PreAuthorize("@auth.check(authentication, 'user:update')")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        var updated = userService.update(id, request);
        UserResponse user = UserResponse.from(updated);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật người dùng thành công", user));
    }

    /**
     * Xoa nguoi dung.
     */
    @DeleteMapping("/{id}")
    @AuditLog(module = "USER", action = "DELETE_USER")
    @PreAuthorize("@auth.check(authentication, 'user:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa người dùng thành công", null));
    }

    /**
     * Thay doi trang thai tai khoan nguoi dung.
     */
    @PatchMapping("/{id}/status")
    @AuditLog(module = "USER", action = "CHANGE_USER_STATUS")
    @PreAuthorize("@auth.check(authentication, 'user:lock') or @auth.check(authentication, 'user:update') or @auth.check(authentication, 'user:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeStatusRequest request) {
        UserResponse user = UserResponse.from(userService.changeStatus(id, request.getStatus(), request.getReason()));
        return ResponseEntity.ok(ApiResponse.success("Thay doi trang thai thành công", user));
    }

    /**
     * Khoa tai khoan nguoi dung.
     */
    @PostMapping("/{id}/lock")
    @AuditLog(module = "USER", action = "LOCK_USER")
    @PreAuthorize("@auth.check(authentication, 'user:lock') or @auth.check(authentication, 'user:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> lockUser(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        UserResponse user = UserResponse.from(userService.changeStatus(id, UserStatus.LOCKED, reason));
        return ResponseEntity.ok(ApiResponse.success("Khóa tài khoản thành công", user));
    }

    /**
     * Mo khoa tai khoan nguoi dung.
     */
    @PostMapping("/{id}/unlock")
    @AuditLog(module = "USER", action = "UNLOCK_USER")
    @PreAuthorize("@auth.check(authentication, 'user:lock') or @auth.check(authentication, 'user:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> unlockUser(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        UserResponse user = UserResponse.from(userService.changeStatus(id, UserStatus.ACTIVE, reason));
        return ResponseEntity.ok(ApiResponse.success("Mo khóa tài khoản thành công", user));
    }

    // =========================================================================
    // T-004: Self-edit endpoints
    // =========================================================================

    /**
     * T-004: GET /users/me — tra ve thong tin nguoi dung dang dang nhap hien tai.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile() {
        UserResponse user = userService.getMyProfile();
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * T-004: PUT /users/me — cho phep nguoi dung hien tai cap nhat thong tin cua
     * chinh minh.
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(@Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = userService.updateMyProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", user));
    }

    // =========================================================================
    // T-012: Admin reset password endpoint
    // =========================================================================

    /**
     * T-012: POST /users/{id}/reset-password — admin dat lai mat khau cho user
     * (policy nong nhe).
     */
    @PostMapping("/{id}/reset-password")
    @AuditLog(module = "USER", action = "RESET_USER_PASSWORD")
    @PreAuthorize("@auth.check(authentication, 'user:update')")
    public ResponseEntity<ApiResponse<Void>> resetPasswordByAdmin(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mật khẩu mới không được để trống"));
        }
        userService.resetPasswordByAdmin(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }

    // =========================================================================
    // T-008: Pending status endpoint
    // =========================================================================

    /**
     * T-008: GET /users/{id}/pending-status — tra ve trang thai dang ky dang cho
     * phep duyet.
     */
    @GetMapping("/{id}/pending-status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPendingStatus(@PathVariable UUID id) {
        String status = userService.getPendingStatus(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", status)));
    }

    @GetMapping("/{id}/permissions")
    @PreAuthorize("@auth.check(authentication, 'user:manage')")
    public ResponseEntity<ApiResponse<java.util.List<UserPermissionOverrideResponse>>> listDirectPermissions(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userPermissionService.list(id)));
    }

    @PostMapping("/{id}/permissions")
    @AuditLog(module = "USER", action = "GRANT_DIRECT_PERMISSION")
    @PreAuthorize("@auth.check(authentication, 'user:manage')")
    public ResponseEntity<ApiResponse<UserPermissionOverrideResponse>> grantDirectPermission(
            @PathVariable UUID id, @Valid @RequestBody GrantUserPermissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cấp quyền trực tiếp thành công", userPermissionService.grant(id, request)));
    }

    @PutMapping("/{id}/permissions")
    @AuditLog(module = "USER", action = "REPLACE_DIRECT_PERMISSIONS")
    @PreAuthorize("@auth.check(authentication, 'user:manage')")
    public ResponseEntity<ApiResponse<java.util.List<UserPermissionOverrideResponse>>> replaceDirectPermissions(
            @PathVariable UUID id, @RequestBody java.util.List<String> permissionCodes) {
        userPermissionService.replaceDirectPermissions(id, permissionCodes);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quyền trực tiếp thành công",
                userPermissionService.list(id)));
    }

    @DeleteMapping("/{id}/permissions/{permissionCode}")
    @AuditLog(module = "USER", action = "REVOKE_DIRECT_PERMISSION")
    @PreAuthorize("@auth.check(authentication, 'user:manage')")
    public ResponseEntity<ApiResponse<Void>> revokeDirectPermission(
            @PathVariable UUID id, @PathVariable String permissionCode) {
        userPermissionService.revoke(id, permissionCode);
        return ResponseEntity.ok(ApiResponse.success("Thu hồi quyền trực tiếp thành công", null));
    }

    // ── User Roles Sub-resource Endpoints ────────────────────────────────────────

    private void saveAuditLog(String action, String target, String details) {
        if (adminAuditLogRepository == null)
            return;
        try {
            UUID adminId = SecurityUtils.getCurrentUserId();
            String adminName = null;
            if (adminId == null) {
                adminId = UUID.fromString("00000000-0000-0000-0000-000000000000");
                adminName = "SYSTEM";
            }
            AdminAuditLog log = AdminAuditLog.create(adminId, adminName, action, target, details, "127.0.0.1",
                    "System");
            adminAuditLogRepository.save(log);
        } catch (Exception ignored) {
        }
    }

}
