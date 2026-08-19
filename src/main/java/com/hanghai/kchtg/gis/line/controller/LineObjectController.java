package com.hanghai.kchtg.gis.line.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.line.dto.CreateLineObjectRequest;
import com.hanghai.kchtg.gis.line.dto.LineObjectResponse;
import com.hanghai.kchtg.gis.line.dto.UpdateLineObjectRequest;
import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
import com.hanghai.kchtg.gis.line.service.LineObjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/line-objects")
@RequiredArgsConstructor
public class LineObjectController {

    private final LineObjectService service;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'lineobject:read') or @auth.check(authentication, 'gisline:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<List<LineObjectResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'lineobject:read') or @auth.check(authentication, 'gisline:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<LineObjectResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/type/{objectType}")
    @PreAuthorize("@auth.check(authentication, 'lineobject:read') or @auth.check(authentication, 'gisline:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<List<LineObjectResponse>>> findByObjectType(
            @PathVariable ObjectType objectType) {
        return ResponseEntity.ok(ApiResponse.success(service.findByObjectType(objectType)));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'lineobject:read') or @auth.check(authentication, 'gisline:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<List<LineObjectResponse>>> findByStatus(
            @PathVariable Status status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status)));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'lineobject:read') or @auth.check(authentication, 'gisline:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<List<LineObjectResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) ObjectType objectType,
            @RequestParam(required = false) Status status) {
        return ResponseEntity.ok(ApiResponse.success(service.search(name, code, objectType, status)));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'lineobject:create') or @auth.check(authentication, 'gisline:create') or @auth.check(authentication, 'data:create')")
    public ResponseEntity<ApiResponse<LineObjectResponse>> create(
            @Valid @RequestBody CreateLineObjectRequest request) {
        LineObjectResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("LineObject created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'lineobject:update') or @auth.check(authentication, 'gisline:update') or @auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<LineObjectResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLineObjectRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("LineObject updated successfully", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'lineobject:delete') or @auth.check(authentication, 'gisline:delete') or @auth.check(authentication, 'data:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("LineObject deleted successfully", null));
    }

    @PostMapping("/{id}/submit-approval")
    @PreAuthorize("@auth.check(authentication, 'lineobject:create') or @auth.check(authentication, 'lineobject:update') or @auth.check(authentication, 'gisline:create') or @auth.check(authentication, 'gisline:update') or @auth.check(authentication, 'data:create') or @auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(@PathVariable UUID id) {
        service.submitForApproval(id);
        return ResponseEntity.ok(ApiResponse.success("LineObject submitted for approval", null));
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("@auth.check(authentication, 'lineobject:approvec1') or @auth.check(authentication, 'lineobject:approvel1') or @auth.check(authentication, 'gisline:approvec1') or @auth.check(authentication, 'gisline:approvel1') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvel1')")
    public ResponseEntity<ApiResponse<LineObjectResponse>> approveL1(
            @PathVariable UUID id,
            @RequestParam UUID approverId) {
        LineObjectResponse response = service.approveL1(id, approverId);
        return ResponseEntity.ok(ApiResponse.success("LineObject approved at Level 1", response));
    }

    @PostMapping("/{id}/approve-l2")
    @PreAuthorize("@auth.check(authentication, 'lineobject:approvec2') or @auth.check(authentication, 'lineobject:approvel2') or @auth.check(authentication, 'gisline:approvec2') or @auth.check(authentication, 'gisline:approvel2') or @auth.check(authentication, 'data:approvec2') or @auth.check(authentication, 'data:approvel2')")
    public ResponseEntity<ApiResponse<LineObjectResponse>> approveL2(
            @PathVariable UUID id,
            @RequestParam UUID approverId) {
        LineObjectResponse response = service.approveL2(id, approverId);
        return ResponseEntity.ok(ApiResponse.success("LineObject approved at Level 2", response));
    }
}
