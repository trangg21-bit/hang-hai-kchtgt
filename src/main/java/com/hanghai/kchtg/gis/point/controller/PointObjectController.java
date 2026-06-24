package com.hanghai.kchtg.gis.point.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.point.dto.CreatePointObjectRequest;
import com.hanghai.kchtg.gis.point.dto.PointObjectResponse;
import com.hanghai.kchtg.gis.point.dto.UpdatePointObjectRequest;
import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
import com.hanghai.kchtg.gis.point.service.PointObjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/point-objects")
@RequiredArgsConstructor
public class PointObjectController {

    private final PointObjectService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PointObjectResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PointObjectResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/type/{objectType}")
    public ResponseEntity<ApiResponse<List<PointObjectResponse>>> findByObjectType(
            @PathVariable ObjectType objectType) {
        return ResponseEntity.ok(ApiResponse.success(service.findByObjectType(objectType)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<PointObjectResponse>>> findByStatus(
            @PathVariable Status status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<PointObjectResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) ObjectType objectType,
            @RequestParam(required = false) Status status) {
        return ResponseEntity.ok(ApiResponse.success(service.search(name, code, objectType, status)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PointObjectResponse>> create(
            @Valid @RequestBody CreatePointObjectRequest request) {
        PointObjectResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("PointObject created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PointObjectResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePointObjectRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("PointObject updated successfully", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("PointObject deleted successfully", null));
    }

    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(@PathVariable UUID id) {
        service.submitForApproval(id);
        return ResponseEntity.ok(ApiResponse.success("PointObject submitted for approval", null));
    }

    @PostMapping("/{id}/approve-l1")
    public ResponseEntity<ApiResponse<PointObjectResponse>> approveL1(
            @PathVariable UUID id,
            @RequestParam String approverId) {
        PointObjectResponse response = service.approveL1(id, approverId);
        return ResponseEntity.ok(ApiResponse.success("PointObject approved at Level 1", response));
    }

    @PostMapping("/{id}/approve-l2")
    public ResponseEntity<ApiResponse<PointObjectResponse>> approveL2(
            @PathVariable UUID id,
            @RequestParam String approverId) {
        PointObjectResponse response = service.approveL2(id, approverId);
        return ResponseEntity.ok(ApiResponse.success("PointObject approved at Level 2", response));
    }
}