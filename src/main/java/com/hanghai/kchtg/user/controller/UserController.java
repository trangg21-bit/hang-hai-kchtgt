package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.accesslog.annotation.AuditLog;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.dto.ChangeStatusRequest;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.dto.UserResponse;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST Controller quan ly tai khoan nguoi dung.
 * <p>
 * Base path: {@code /api/users}
 * </p>
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * T-001: Lay danh sach nguoi dung voi phan trang.
     * Default 20 items/page, max 100. Sort by created_at DESC.
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Enforce max page size
        int actualSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(page, actualSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserResponse> result = userService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Lay chi tiet mot nguoi dung theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable UUID id) {
        UserResponse user = UserResponse.from(userService.findById(id));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Tao moi nguoi dung.
     */
    @PostMapping
    @AuditLog(module = "USER", action = "CREATE_USER")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = UserResponse.from(userService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tao người dùng thành công", user));
    }

    /**
     * Cap nhat thong tin nguoi dung.
     */
    @PutMapping("/{id}")
    @AuditLog(module = "USER", action = "UPDATE_USER")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = UserResponse.from(userService.update(id, request));
        return ResponseEntity.ok(ApiResponse.success("Cap nhat người dùng thành công", user));
    }

    /**
     * Xoa nguoi dung.
     */
    @DeleteMapping("/{id}")
    @AuditLog(module = "USER", action = "DELETE_USER")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa người dùng thành công", null));
    }

    /**
     * Thay doi trang thai tai khoan nguoi dung.
     */
    @PatchMapping("/{id}/status")
    @AuditLog(module = "USER", action = "CHANGE_USER_STATUS")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeStatusRequest request) {
        UserResponse user = UserResponse.from(userService.changeStatus(id, request.getStatus()));
        return ResponseEntity.ok(ApiResponse.success("Thay doi trang thai thành công", user));
    }

    /**
     * Khoa tai khoan nguoi dung.
     */
    @PostMapping("/{id}/lock")
    @AuditLog(module = "USER", action = "LOCK_USER")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> lockUser(@PathVariable UUID id) {
        UserResponse user = UserResponse.from(userService.changeStatus(id, UserStatus.LOCKED));
        return ResponseEntity.ok(ApiResponse.success("Khóa tài khoản thành công", user));
    }

    /**
     * Mo khoa tai khoan nguoi dung.
     */
    @PostMapping("/{id}/unlock")
    @AuditLog(module = "USER", action = "UNLOCK_USER")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<UserResponse>> unlockUser(@PathVariable UUID id) {
        UserResponse user = UserResponse.from(userService.changeStatus(id, UserStatus.ACTIVE));
        return ResponseEntity.ok(ApiResponse.success("Mo khóa tài khoản thành công", user));
    }

    // =========================================================================
    //  T-004: Self-edit endpoints
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
     * T-004: PUT /users/me — cho phep nguoi dung hien tai cap nhat thong tin cua chinh minh.
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(@Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = userService.updateMyProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", user));
    }

    // =========================================================================
    //  T-012: Admin reset password endpoint
    // =========================================================================

    /**
     * T-012: POST /users/{id}/reset-password — admin dat lai mat khau cho user (policy nong nhe).
     */
    @PostMapping("/{id}/reset-password")
    @AuditLog(module = "USER", action = "RESET_USER_PASSWORD")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
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
    //  T-008: Pending status endpoint
    // =========================================================================

    /**
     * T-008: GET /users/{id}/pending-status — tra ve trang thai dang ky dang cho phep duyet.
     */
    @GetMapping("/{id}/pending-status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPendingStatus(@PathVariable UUID id) {
        String status = userService.getPendingStatus(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", status)));
    }
}
