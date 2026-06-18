package com.hanghai.kchtg.gis.polygon.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.polygon.dto.CreatePolygonObjectRequest;
import com.hanghai.kchtg.gis.polygon.dto.PolygonObjectResponse;
import com.hanghai.kchtg.gis.polygon.dto.UpdatePolygonObjectRequest;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import com.hanghai.kchtg.gis.polygon.service.PolygonObjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/polygon-objects")
@RequiredArgsConstructor
public class PolygonObjectController {

    private final PolygonObjectService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PolygonObjectResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PolygonObjectResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/type/{objectType}")
    public ResponseEntity<ApiResponse<List<PolygonObjectResponse>>> findByObjectType(
            @PathVariable ObjectType objectType) {
        return ResponseEntity.ok(ApiResponse.success(service.findByObjectType(objectType)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<PolygonObjectResponse>>> findByStatus(
            @PathVariable Status status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<PolygonObjectResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) ObjectType objectType,
            @RequestParam(required = false) Status status) {
        return ResponseEntity.ok(ApiResponse.success(service.search(name, code, objectType, status)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PolygonObjectResponse>> create(
            @Valid @RequestBody CreatePolygonObjectRequest request) {
        PolygonObjectResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("PolygonObject created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PolygonObjectResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePolygonObjectRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("PolygonObject updated successfully", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("PolygonObject deleted successfully", null));
    }

    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(@PathVariable UUID id) {
        service.submitForApproval(id);
        return ResponseEntity.ok(ApiResponse.success("PolygonObject submitted for approval", null));
    }

    @PostMapping("/{id}/approve-l1")
    public ResponseEntity<ApiResponse<PolygonObjectResponse>> approveL1(
            @PathVariable UUID id,
            @RequestParam String approverId) {
        PolygonObjectResponse response = service.approveL1(id, approverId);
        return ResponseEntity.ok(ApiResponse.success("PolygonObject approved at Level 1", response));
    }

    @PostMapping("/{id}/approve-l2")
    public ResponseEntity<ApiResponse<PolygonObjectResponse>> approveL2(
            @PathVariable UUID id,
            @RequestParam String approverId) {
        PolygonObjectResponse response = service.approveL2(id, approverId);
        return ResponseEntity.ok(ApiResponse.success("PolygonObject approved at Level 2", response));
    }
}
