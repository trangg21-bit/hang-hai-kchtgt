package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.assetmovement.dto.InventoryReportRequest;
import com.hanghai.kchtg.assetmovement.dto.InventoryReportResponse;
import com.hanghai.kchtg.assetmovement.service.InventoryReportService;
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

/**
 * REST Controller cho Bao Cao Kiem Ke (F-125).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/inventory-reports")
@RequiredArgsConstructor
public class InventoryReportController {

    private final InventoryReportService inventoryReportService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'inventoryreport:manage')")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> create(
            @Valid @RequestBody InventoryReportRequest request) {
        InventoryReportResponse response = inventoryReportService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Báo cáo đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryreport:manage')")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> getById(
            @PathVariable UUID id) {
        InventoryReportResponse response = inventoryReportService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'inventoryreport:manage')")
    public ResponseEntity<ApiResponse<Page<InventoryReportResponse>>> findAll(
            @RequestParam(required = false) UUID planId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(EntityFields.CREATED_AT).descending());
        Page<InventoryReportResponse> result;
        if (planId != null) {
            result = inventoryReportService.findByPlanId(planId, pageable);
        } else {
            result = inventoryReportService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryreport:manage')")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> update(
            @PathVariable UUID id,
            @RequestBody InventoryReportRequest request) {
        InventoryReportResponse response = inventoryReportService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'inventoryreport:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        inventoryReportService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo đã được xóa", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'inventoryreport:manage')")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        InventoryReportResponse response = inventoryReportService.approve(id, remarks);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo đã được phê duyệt", response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'inventoryreport:manage')")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        InventoryReportResponse response = inventoryReportService.reject(id, remarks);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo đã bị từ chối", response));
    }
}
