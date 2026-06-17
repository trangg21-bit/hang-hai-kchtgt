package com.hanghai.kchtg.group.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.group.dto.CreateGroupRequest;
import com.hanghai.kchtg.group.dto.GroupResponse;
import com.hanghai.kchtg.group.dto.UpdateGroupRequest;
import com.hanghai.kchtg.group.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
 * REST controller cho CRUD quản lý nhóm người dùng.
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

    /** GET /api/groups — liệt kê tất cả nhóm. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<GroupResponse>>> list() {
        List<GroupResponse> groups = service.findAll();
        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    /** GET /api/groups/{id} — lấy chi tiết một nhóm. */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupResponse>> get(@PathVariable UUID id) {
        GroupResponse group = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(group));
    }

    /** POST /api/groups — tạo mới nhóm. Trả về 201 Created. */
    @PostMapping
    public ResponseEntity<ApiResponse<GroupResponse>> create(
            @Valid @RequestBody CreateGroupRequest request) {
        GroupResponse group = service.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nhóm đã được tạo thành công", group));
    }

    /** PUT /api/groups/{id} — cập nhật nhóm. */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGroupRequest request) {
        GroupResponse group = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Nhóm đã được cập nhật thành công", group));
    }

    /** DELETE /api/groups/{id} — xoá nhóm. */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Nhóm đã được xoá thành công", null));
    }
}
