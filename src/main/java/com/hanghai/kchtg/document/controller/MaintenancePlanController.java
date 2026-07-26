package com.hanghai.kchtg.document.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.MaintenanceType;
import com.hanghai.kchtg.document.entity.MaintenanceStatus;
import com.hanghai.kchtg.document.service.MaintenancePlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for F-130 Quản lý thông tin bảo trì.
 */
@RestController
@RequestMapping("/api/v1/maintenance-plans")
@RequiredArgsConstructor
public class MaintenancePlanController {

    private final MaintenancePlanService maintenancePlanService;

    /**
     * GET /api/v1/maintenance-plans
     * Returns all maintenance plans.
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<MaintenancePlanResponse>>> listPlans(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<MaintenancePlanResponse> result = maintenancePlanService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * POST /api/v1/maintenance-plans
     * Creates a new maintenance plan.
     */
    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'maintenanceplan:create')")
    public ResponseEntity<ApiResponse<MaintenancePlanResponse>> createPlan(
            @RequestBody @Valid MaintenancePlanCreateRequest request) {
        MaintenancePlanResponse response = maintenancePlanService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo kế hoạch bảo trì thành công", response));
    }

    /**
     * GET /api/v1/maintenance-plans/{id}
     * Returns a single maintenance plan by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<MaintenancePlanResponse>> getPlan(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(maintenancePlanService.getById(id)));
    }

    /**
     * PUT /api/v1/maintenance-plans/{id}
     * Updates an existing maintenance plan.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'maintenanceplan:update')")
    public ResponseEntity<ApiResponse<MaintenancePlanResponse>> updatePlan(
            @PathVariable UUID id,
            @RequestBody @Valid MaintenancePlanCreateRequest request) {
        MaintenancePlanResponse response = maintenancePlanService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kế hoạch bảo trì thành công", response));
    }

    /**
     * DELETE /api/v1/maintenance-plans/{id}
     * Deletes a maintenance plan.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'maintenanceplan:delete')")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable UUID id) {
        maintenancePlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kế hoạch bảo trì thành công", null));
    }

    /**
     * POST /api/v1/maintenance-plans/result
     * Records maintenance result.
     */
    @PostMapping("/result")
    @PreAuthorize("@auth.check(authentication, 'maintenanceplan:report')")
    public ResponseEntity<ApiResponse<MaintenanceResultResponse>> recordResult(
            @RequestBody @Valid MaintenanceResultRequest request) {
        MaintenanceResultResponse response = maintenancePlanService.recordResult(request);
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận kết quả bảo trì thành công", response));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    @GetMapping("/equipment/{equipment}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<MaintenancePlanResponse>>> filterByEquipment(
            @PathVariable String equipment) {
        return ResponseEntity.ok(ApiResponse.success(maintenancePlanService.findByEquipment(equipment)));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<MaintenancePlanResponse>>> filterByStatus(
            @PathVariable String status) {
        MaintenanceStatus maintenanceStatus = MaintenanceStatus.valueOf(status);
        return ResponseEntity.ok(ApiResponse.success(maintenancePlanService.findByStatus(maintenanceStatus)));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<MaintenancePlanResponse>>> filterByType(
            @PathVariable String type) {
        MaintenanceType maintenanceType = MaintenanceType.valueOf(type);
        return ResponseEntity.ok(ApiResponse.success(maintenancePlanService.findByMaintenanceType(maintenanceType)));
    }

    @GetMapping("/date-range")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<MaintenancePlanResponse>>> filterByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(maintenancePlanService.findByNgayBatDauDuKienBetween(start, end)));
    }
}
