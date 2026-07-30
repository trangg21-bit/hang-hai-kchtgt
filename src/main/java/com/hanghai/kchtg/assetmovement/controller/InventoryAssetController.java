package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.InventoryAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InventoryAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.InventoryStatus;
import com.hanghai.kchtg.assetmovement.service.InventoryAssetService;
import com.hanghai.kchtg.common.dto.ApiResponse;
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
@RequestMapping("/api/v1/asset/inventory-assets")
@RequiredArgsConstructor
public class InventoryAssetController {

    private final InventoryAssetService inventoryAssetService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'inventoryasset:manage')")
    public ResponseEntity<ApiResponse<InventoryAssetResponse>> create(
            @RequestBody InventoryAssetRequest request) {
        InventoryAssetResponse response = inventoryAssetService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tài sản kiểm kê đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryasset:manage')")
    public ResponseEntity<ApiResponse<InventoryAssetResponse>> getById(
            @PathVariable UUID id) {
        InventoryAssetResponse response = inventoryAssetService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'inventoryasset:manage')")
    public ResponseEntity<ApiResponse<Page<InventoryAssetResponse>>> findAll(
            @RequestParam(required = false) UUID planId,
            @RequestParam(required = false) InventoryStatus inventoryStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<InventoryAssetResponse> result;
        if (planId != null && inventoryStatus != null) {
            result = inventoryAssetService.findByPlanIdAndStatus(planId, inventoryStatus, pageable);
        } else if (inventoryStatus != null) {
            result = inventoryAssetService.findByStatus(inventoryStatus, pageable);
        } else if (planId != null) {
            result = inventoryAssetService.findByPlanId(planId, pageable);
        } else {
            result = inventoryAssetService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryasset:manage')")
    public ResponseEntity<ApiResponse<InventoryAssetResponse>> update(
            @PathVariable UUID id,
            @RequestBody InventoryAssetRequest request) {
        InventoryAssetResponse response = inventoryAssetService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tài sản kiểm kê đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryasset:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        inventoryAssetService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tài sản kiểm kê đã được xóa", null));
    }
}
