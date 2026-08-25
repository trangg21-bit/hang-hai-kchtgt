package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.SystemMenu;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.SystemMenuRepository;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.hanghai.kchtg.user.service.PermissionRoleService;

/**
 * REST Controller quản lý quyền hạn (Permission).
 * <p>
 * Base path: {@code /api/permissions}
 * </p>
 */
@RestController
@RequestMapping({"/api/permissions", "/api/v1/permissions"})
public class PermissionController {

    private final PermissionRepository permissionRepository;
    private final SystemMenuRepository systemMenuRepository;
    private final PermissionRoleService permissionRoleService;

    public PermissionController(PermissionRepository permissionRepository,
                                SystemMenuRepository systemMenuRepository,
                                PermissionRoleService permissionRoleService) {
        this.permissionRepository = permissionRepository;
        this.systemMenuRepository = systemMenuRepository;
        this.permissionRoleService = permissionRoleService;
    }

    /**
     * GET /api/permissions — trả về toàn bộ danh sách permission.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Permission>>> list() {
        List<Permission> permissions = permissionRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    /**
     * GET /api/permissions/menu-tree — cây chức năng AUTH_MENU tương thích project gốc.
     * Không trộn các mã menu với permission API dạng resource:action.
     */
    @GetMapping("/menu-tree")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<List<MenuNodeResponse>>> menuTree(
            @RequestParam(defaultValue = "VMD_MTIS") String appCode) {
        List<SystemMenu> menus = systemMenuRepository
                .findByAppCodeAndStatusAndHideMenuOrderByOrderNoAscMenuCodeAsc(appCode, 1, false);
        Map<String, List<SystemMenu>> childrenByParent = menus.stream()
                .collect(Collectors.groupingBy(SystemMenu::getParentCode, LinkedHashMap::new, Collectors.toList()));

        List<MenuNodeResponse> roots = menus.stream()
                .filter(menu -> "*".equals(menu.getParentCode())
                        || !childrenByParent.containsKey(menu.getParentCode()))
                .map(menu -> toMenuNode(menu, childrenByParent))
                .collect(Collectors.toCollection(ArrayList::new));
        return ResponseEntity.ok(ApiResponse.success(roots));
    }

    private MenuNodeResponse toMenuNode(SystemMenu menu, Map<String, List<SystemMenu>> childrenByParent) {
        MenuNodeResponse node = new MenuNodeResponse();
        node.setKey(menu.getMenuCode());
        node.setTitle(menu.getName());
        node.setCode(menu.getMenuCode());
        node.setUrl(menu.getUrl());
        node.setParentCode(menu.getParentCode());
        List<MenuNodeResponse> children = childrenByParent.getOrDefault(menu.getMenuCode(), List.of()).stream()
                .map(child -> toMenuNode(child, childrenByParent))
                .collect(Collectors.toCollection(ArrayList::new));
        node.setChildren(children);
        return node;
    }

    @Data
    public static class MenuNodeResponse {
        private String key;
        private String title;
        private String code;
        private String url;
        private String parentCode;
        private List<MenuNodeResponse> children = new ArrayList<>();
    }

    /**
     * GET /api/permissions/{id} — lấy permission theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Permission>> getById(@PathVariable UUID id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found with id: " + id));
        return ResponseEntity.ok(ApiResponse.success(permission));
    }

    /**
     * POST /api/permissions/create — tạo mới một permission.
     */
    @PostMapping("/create")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
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
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Permission>> getByCode(@PathVariable String code) {
        Permission permission = permissionRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Permission not found with code: " + code));
        return ResponseEntity.ok(ApiResponse.success(permission));
    }

    /**
     * GET /api/permissions/resource/{resource} — lấy danh sách permission theo resource.
     */
    @GetMapping("/resource/{resource}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<List<Permission>>> findByResource(@PathVariable String resource) {
        List<Permission> permissions = permissionRepository.findByResource(resource);
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    /**
     * PUT /api/permissions/{id} — cập nhật thông tin permission.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Permission>> update(
            @PathVariable UUID id,
            @RequestBody CreatePermissionRequest request) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found with id: " + id));

        if (request.getName() != null) permission.setName(request.getName());
        if (request.getDescription() != null) permission.setDescription(request.getDescription());
        if (request.getResource() != null) permission.setResource(request.getResource());
        if (request.getAction() != null) permission.setAction(request.getAction());

        Permission updated = permissionRepository.save(permission);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quyền hạn thành công", updated));
    }

    /**
     * DELETE /api/permissions/{id} — xóa permission theo ID.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found with id: " + id));
        permissionRepository.delete(permission);
        return ResponseEntity.ok(ApiResponse.success("Xóa quyền hạn thành công", null));
    }

    /**
     * GET /api/permissions/evaluate/{userId} — lấy danh sách mã quyền hạn thực tế của user.
     */
    @GetMapping("/evaluate/{userId}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<java.util.Set<String>>> evaluatePermissions(@PathVariable UUID userId) {
        java.util.Set<String> permissions = permissionRoleService.getUserPermissions(userId);
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    /**
     * Request body cho POST /create va PUT /{id}.
     */
    @Data
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

    }
}
