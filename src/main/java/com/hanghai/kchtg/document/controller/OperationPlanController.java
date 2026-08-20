package com.hanghai.kchtg.document.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.OperationPlanCreateRequest;
import com.hanghai.kchtg.document.dto.OperationPlanResponse;
import com.hanghai.kchtg.document.entity.OperationStatus;
import com.hanghai.kchtg.document.service.OperationPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for F-129 Quản lý thông tin vận hành.
 */
@RestController
@RequestMapping("/api/v1/operation-plans")
@RequiredArgsConstructor
public class OperationPlanController {

    private final OperationPlanService operationPlanService;

    /**
     * GET /api/v1/operation-plans
     * Returns all operation plans.
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'operationplan:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<OperationPlanResponse>>> listPlans(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<OperationPlanResponse> result = operationPlanService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * POST /api/v1/operation-plans
     * Creates a new operation plan.
     */
    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'operationplan:create') or @auth.check(authentication, 'document:create')")
    public ResponseEntity<ApiResponse<OperationPlanResponse>> createPlan(
            @RequestBody @Valid OperationPlanCreateRequest request) {
        OperationPlanResponse response = operationPlanService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo kế hoạch vận hành thành công", response));
    }

    /**
     * GET /api/v1/operation-plans/{id}
     * Returns a single operation plan by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'operationplan:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<OperationPlanResponse>> getPlan(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(operationPlanService.getById(id)));
    }

    /**
     * PUT /api/v1/operation-plans/{id}
     * Updates an existing operation plan.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'operationplan:update') or @auth.check(authentication, 'document:update')")
    public ResponseEntity<ApiResponse<OperationPlanResponse>> updatePlan(
            @PathVariable UUID id,
            @RequestBody @Valid OperationPlanCreateRequest request) {
        OperationPlanResponse response = operationPlanService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kế hoạch vận hành thành công", response));
    }

    /**
     * DELETE /api/v1/operation-plans/{id}
     * Deletes an operation plan.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'operationplan:delete') or @auth.check(authentication, 'document:delete')")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable UUID id) {
        operationPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kế hoạch vận hành thành công", null));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    /**
     * GET /api/v1/operation-plans/date/{operationDate}
     * Filter by operation date.
     */
    @GetMapping("/date/{operationDate}")
    @PreAuthorize("@auth.check(authentication, 'operationplan:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<OperationPlanResponse>>> filterByDate(
            @PathVariable LocalDate operationDate) {
        return ResponseEntity.ok(ApiResponse.success(operationPlanService.findByOperationDate(operationDate)));
    }

    /**
     * GET /api/v1/operation-plans/status/{status}
     * Filter by status.
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'operationplan:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<OperationPlanResponse>>> filterByStatus(
            @PathVariable String status) {
        OperationStatus opStatus = OperationStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(operationPlanService.findByStatus(opStatus)));
    }

    /**
     * GET /api/v1/operation-plans/pier/{pier}
     * Filter by structure (cầu cảng).
     */
    @GetMapping("/pier/{pier}")
    @PreAuthorize("@auth.check(authentication, 'operationplan:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<OperationPlanResponse>>> filterByPier(
            @PathVariable String pier) {
        return ResponseEntity.ok(ApiResponse.success(operationPlanService.findByPier(pier)));
    }

    /**
     * GET /api/v1/operation-plans/equipment/{equipment}
     * Filter by equipment.
     */
    @GetMapping("/equipment/{equipment}")
    @PreAuthorize("@auth.check(authentication, 'operationplan:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<OperationPlanResponse>>> filterByEquipment(
            @PathVariable String equipment) {
        return ResponseEntity.ok(ApiResponse.success(operationPlanService.findByEquipment(equipment)));
    }

    /**
     * GET /api/v1/operation-plans/conflict
     * Check for scheduling conflicts.
     */
    @GetMapping("/conflict")
    @PreAuthorize("@auth.check(authentication, 'operationplan:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<Boolean>> checkConflict(
            @RequestParam LocalDate operationDate,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime,
            @RequestParam(name = "pier", required = false) String pier,
            @RequestParam(name = "equipment", required = false) String equipment) {
        boolean hasConflict = operationPlanService.hasConflictSchedule(
                operationDate, startTime, endTime, pier, equipment);
        return ResponseEntity.ok(ApiResponse.success(hasConflict));
    }
}
