package com.hanghai.kchtg.group.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.group.dto.CreateGroupRequest;
import com.hanghai.kchtg.group.dto.GroupResponse;
import com.hanghai.kchtg.group.dto.UpdateGroupRequest;
import com.hanghai.kchtg.group.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST controller cho CRUD quan ly nhom nguoi dung.
 * <p>
 * Base path: {@code /api/groups}
 * </p>
 */
@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService service;

    public GroupController(GroupService service) {
        this.service = service;
    }

    /** GET /api/groups - liet ke tat ca nhom. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<GroupResponse>>> list() {
        List<GroupResponse> groups = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    /** GET /api/groups/{id} - lay chi tiet mot nhom. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<GroupResponse>> get(@PathVariable UUID id) {
        GroupResponse group = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(group));
    }

    /** POST /api/groups - tao moi nhom. Tra ve 201 Created. */
    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<GroupResponse>> create(
            @Valid @RequestBody CreateGroupRequest request) {
        GroupResponse group = service.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nhom da duoc tao thanh cong", group));
    }

    /** PUT /api/groups/{id} - cap nhat nhom. */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<GroupResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGroupRequest request) {
        GroupResponse group = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Nhom da duoc cap nhat thanh cong", group));
    }

    /** DELETE /api/groups/{id} - xoa nhom. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Nhom da duoc xoa thanh cong", null));
    }
}