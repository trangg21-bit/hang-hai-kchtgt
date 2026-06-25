package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller quản lý quyền hạn (Permission).
 * <p>
 * Base path: {@code /api/permissions}
 * </p>
 */
@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionRepository permissionRepository;

    public PermissionController(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    /**
     * GET /api/permissions — trả về toàn bộ danh sách permission.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Permission>>> list() {
        List<Permission> permissions = permissionRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    /**
     * GET /api/permissions/{id} — lấy permission theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Permission>> getById(@PathVariable UUID id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found with id: " + id));
        return ResponseEntity.ok(ApiResponse.success(permission));
    }

    /**
     * POST /api/permissions/create — tạo mới một permission.
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Permission>> create(@RequestBody CreatePermissionRequest request) {
        if (permissionRepository.existsByCode(request.getCode())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Permission code '" + request.getCode() + "' already exists"));
        }

        Permission permission = new Permission();
        permission.setCode(request.getCode());
        permission.setName(request.getName());
        permission.setDescription(request.getDescription());
        permission.setResource(request.getResource());
        permission.setAction(request.getAction());

        Permission saved = permissionRepository.save(permission);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo quyền hạn thành công", saved));
    }

    /**
     * GET /api/permissions/code/{code} — lấy permission theo code.
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<Permission>> getByCode(@PathVariable String code) {
        Permission permission = permissionRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Permission not found with code: " + code));
        return ResponseEntity.ok(ApiResponse.success(permission));
    }

    /**
     * GET /api/permissions/resource/{resource} — lấy danh sách permission theo resource.
     */
    @GetMapping("/resource/{resource}")
    public ResponseEntity<ApiResponse<List<Permission>>> findByResource(@PathVariable String resource) {
        List<Permission> permissions = permissionRepository.findByResource(resource);
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    /**
     * Request body cho POST /create.
     */
    public static class CreatePermissionRequest {
        @NotBlank(message = "Code không được để trống")
        private String code;

        @NotBlank(message = "Name không được để trống")
        private String name;

        private String description;

        @NotBlank(message = "Resource không được để trống")
        private String resource;

        @NotBlank(message = "Action không được để trống")
        private String action;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getResource() { return resource; }
        public void setResource(String resource) { this.resource = resource; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
    }
}
