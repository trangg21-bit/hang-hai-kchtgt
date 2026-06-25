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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller quản lý tài khoản người dùng.
 * <p>
 * Base path: {@code /api/users}
 * </p>
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Lấy danh sách toàn bộ người dùng.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> list() {
        List<UserResponse> users = userService.findAll().stream()
                .map(UserResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Lấy chi tiết một người dùng theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable UUID id) {
        UserResponse user = UserResponse.from(userService.findById(id));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Tạo mới người dùng.
     */
    @PostMapping
    @AuditLog(module = "USER", action = "CREATE_USER")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = UserResponse.from(userService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo người dùng thành công", user));
    }

    /**
     * Cập nhật thông tin người dùng.
     */
    @PutMapping("/{id}")
    @AuditLog(module = "USER", action = "UPDATE_USER")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = UserResponse.from(userService.update(id, request));
        return ResponseEntity.ok(ApiResponse.success("Cập nhật người dùng thành công", user));
    }

    /**
     * Xóa người dùng.
     */
    @DeleteMapping("/{id}")
    @AuditLog(module = "USER", action = "DELETE_USER")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa người dùng thành công", null));
    }

    /**
     * Thay đổi trạng thái tài khoản người dùng.
     */
    @PatchMapping("/{id}/status")
    @AuditLog(module = "USER", action = "CHANGE_USER_STATUS")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeStatusRequest request) {
        UserResponse user = UserResponse.from(userService.changeStatus(id, request.getStatus()));
        return ResponseEntity.ok(ApiResponse.success("Thay đổi trạng thái thành công", user));
    }

    /**
     * Khoá tài khoản người dùng.
     */
    @PostMapping("/{id}/lock")
    @AuditLog(module = "USER", action = "LOCK_USER")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> lockUser(@PathVariable UUID id) {
        UserResponse user = UserResponse.from(userService.changeStatus(id, UserStatus.LOCKED));
        return ResponseEntity.ok(ApiResponse.success("Khóa tài khoản thành công", user));
    }

    /**
     * Mở khóa tài khoản người dùng.
     */
    @PostMapping("/{id}/unlock")
    @AuditLog(module = "USER", action = "UNLOCK_USER")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> unlockUser(@PathVariable UUID id) {
        UserResponse user = UserResponse.from(userService.changeStatus(id, UserStatus.ACTIVE));
        return ResponseEntity.ok(ApiResponse.success("Mở khóa tài khoản thành công", user));
    }
}
