package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.dto.ChangeStatusRequest;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.dto.UserResponse;
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
 * REST Controller quan ly tai khoan nguoi dung.
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
     * Lay danh sach tong bo nguoi dung.
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
     * Lay chi tiet mot nguoi dung theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable UUID id) {
        UserResponse user = UserResponse.from(userService.findById(id));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Tao moi nguoi dung.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = UserResponse.from(userService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tao nguoi dung thanh cong", user));
    }

    /**
     * Cap nhat thong tin nguoi dung.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = UserResponse.from(userService.update(id, request));
        return ResponseEntity.ok(ApiResponse.success("Cap nhat nguoi dung thanh cong", user));
    }

    /**
     * Xoa nguoi dung.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa nguoi dung thanh cong", null));
    }

    /**
     * Thay doi trang tai tai khoan nguoi dung.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeStatusRequest request) {
        UserResponse user = UserResponse.from(userService.changeStatus(id, request.getStatus()));
        return ResponseEntity.ok(ApiResponse.success("Thay doi trang tai thanh cong", user));
    }
}
