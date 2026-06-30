package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.dto.CreateRoleRequest;
import com.hanghai.kchtg.user.dto.RoleResponse;
import com.hanghai.kchtg.user.dto.UpdateRoleRequest;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller quản lý vai trò (Role).
 * <p>
 * Base path: {@code /api/roles}
 * </p>
 */
@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
            org.springframework.data.domain.Page<RoleResponse> rolesPage = roleService.findAll(pageable).map(RoleResponse::from);
            return ResponseEntity.ok(ApiResponse.success(rolesPage));
        } else {
            List<RoleResponse> roles = roleService.findAll().stream()
                    .map(RoleResponse::from)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(roles));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> getById(@PathVariable UUID id) {
        RoleResponse role = RoleResponse.from(roleService.findById(id));
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<RoleResponse>> getByCode(@PathVariable String code) {
        RoleResponse role = RoleResponse.from(roleService.findByCode(code));
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> findActive() {
        List<RoleResponse> roles = roleService.findActiveRoles().stream()
                .map(RoleResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<RoleResponse>> create(@Valid @RequestBody CreateRoleRequest request) {
        RoleResponse role = RoleResponse.from(roleService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo vai trò thành công", role));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<RoleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest request) {
        RoleResponse role = RoleResponse.from(roleService.update(id, request));
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vai trò thành công", role));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        roleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa vai trò thành công", null));
    }
}
