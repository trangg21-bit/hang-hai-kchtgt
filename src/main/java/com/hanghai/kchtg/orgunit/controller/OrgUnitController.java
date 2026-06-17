package com.hanghai.kchtg.orgunit.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.service.OrgUnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for organisational unit management.
 * <p>
 * Base path: {@code /api/org-units}
 * </p>
 */
@RestController
@RequestMapping("/api/org-units")
@RequiredArgsConstructor
public class OrgUnitController {

    private final OrgUnitService service;

    /**
     * List all units (flat). Add {@code ?parentId=} to filter by parent.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> getAll(
            @RequestParam(required = false) UUID parentId) {
        if (parentId != null) {
            return ResponseEntity.ok(
                    ApiResponse.success(service.findByParentId(parentId)));
        }
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    /**
     * Full hierarchical tree (root → children recursively).
     */
    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> getTree() {
        return ResponseEntity.ok(ApiResponse.success(service.findTree()));
    }

    /**
     * Single unit by ID (flat, no children).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrgUnitResponse>> getById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    /**
     * Create a new organisational unit.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrgUnitResponse>> create(
            @Valid @RequestBody CreateOrgUnitRequest request) {
        OrgUnitResponse response = service.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đơn vị thành công", response));
    }

    /**
     * Partial update of an existing unit.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrgUnitResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrgUnitRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật đơn vị thành công", service.update(id, request)));
    }

    /**
     * Delete a unit (fails if the unit has children).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Xóa đơn vị thành công", null));
    }
}
