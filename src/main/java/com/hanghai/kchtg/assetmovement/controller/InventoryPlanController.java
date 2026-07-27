package com.hanghai.kchtg.assetmovement.controller;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.dto.InventoryPlanRequest;
import com.hanghai.kchtg.assetmovement.dto.InventoryPlanResponse;
import com.hanghai.kchtg.assetmovement.entity.PlanStatus;
import com.hanghai.kchtg.assetmovement.service.InventoryPlanService;
import com.hanghai.kchtg.common.dto.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/asset/inventory-plans")
@RequiredArgsConstructor
public class InventoryPlanController {

    private final InventoryPlanService inventoryPlanService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<InventoryPlanResponse>> create(
            @Valid @RequestBody InventoryPlanRequest request) {
        InventoryPlanResponse response = inventoryPlanService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Kế hoạch đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<InventoryPlanResponse>> getById(
            @PathVariable UUID id) {
        InventoryPlanResponse response = inventoryPlanService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<Page<InventoryPlanResponse>>> findAll(
            @RequestParam(required = false) PlanStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<InventoryPlanResponse> result;
        if (status != null) {
            result = inventoryPlanService.findByStatus(status, pageable);
        } else {
            result = inventoryPlanService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<InventoryPlanResponse>> update(
            @PathVariable UUID id,
            @RequestBody InventoryPlanRequest request) {
        InventoryPlanResponse response = inventoryPlanService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Kế hoạch đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        inventoryPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Kế hoạch đã được xóa", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<InventoryPlanResponse>> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        InventoryPlanResponse response = inventoryPlanService.approve(id, remarks);
        return ResponseEntity.ok(ApiResponse.success("Kế hoạch đã được phê duyệt", response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<InventoryPlanResponse>> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        InventoryPlanResponse response = inventoryPlanService.reject(id, remarks);
        return ResponseEntity.ok(ApiResponse.success("Kế hoạch đã bị từ chối", response));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<InventoryPlanResponse>> start(
            @PathVariable UUID id) {
        InventoryPlanResponse response = inventoryPlanService.startExecution(id);
        return ResponseEntity.ok(ApiResponse.success("Kế hoạch đã bắt đầu thực hiện", response));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("@auth.check(authentication, 'inventoryplan:manage')")
    public ResponseEntity<ApiResponse<InventoryPlanResponse>> complete(
            @PathVariable UUID id) {
        InventoryPlanResponse response = inventoryPlanService.completeExecution(id);
        return ResponseEntity.ok(ApiResponse.success("Kế hoạch đã hoàn thành", response));
    }
}
