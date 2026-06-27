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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
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
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> getTree() {
        return ResponseEntity.ok(ApiResponse.success(service.findTree()));
    }

    /**
     * Single unit by ID (flat, no children).
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<OrgUnitResponse>> getById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    /**
     * Create a new organisational unit.
     */
    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<OrgUnitResponse>> create(
            @Valid @RequestBody CreateOrgUnitRequest request) {
        OrgUnitResponse response = service.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao don vi thanh cong", response));
    }

    /**
     * Partial update of an existing unit.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<OrgUnitResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrgUnitRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cap nhat don vi thanh cong", service.update(id, request)));
    }

    /**
     * Delete a unit (fails if the unit has children).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Xoa don vi thanh cong", null));
    }
}
