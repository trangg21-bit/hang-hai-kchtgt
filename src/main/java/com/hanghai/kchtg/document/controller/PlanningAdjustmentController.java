package com.hanghai.kchtg.document.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.AdjustmentStatus;
import com.hanghai.kchtg.document.service.PlanningAdjustmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for F-134 Cập nhật quy hoạch bến cảng.
 */
@RestController
@RequestMapping("/api/v1/planning-adjustments")
@RequiredArgsConstructor
public class PlanningAdjustmentController {

    private final PlanningAdjustmentService planningAdjustmentService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PlanningAdjustmentResponse>>> listAdjustments() {
        return ResponseEntity.ok(ApiResponse.success(planningAdjustmentService.findAll()));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'planningadjustment:create')")
    public ResponseEntity<ApiResponse<PlanningAdjustmentResponse>> createAdjustment(
            @RequestBody @Valid PlanningAdjustmentCreateRequest request) {
        PlanningAdjustmentResponse response = planningAdjustmentService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo điều chỉnh quy hoạch thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<PlanningAdjustmentResponse>> getAdjustment(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(planningAdjustmentService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'planningadjustment:update')")
    public ResponseEntity<ApiResponse<PlanningAdjustmentResponse>> updateAdjustment(
            @PathVariable UUID id,
            @RequestBody @Valid PlanningAdjustmentCreateRequest request) {
        PlanningAdjustmentResponse response = planningAdjustmentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật điều chỉnh quy hoạch thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'planningadjustment:delete')")
    public ResponseEntity<ApiResponse<Void>> deleteAdjustment(@PathVariable UUID id) {
        planningAdjustmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa điều chỉnh quy hoạch thành công", null));
    }

    @GetMapping("/planning/{planningId}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PlanningAdjustmentResponse>>> getByPlanningId(@PathVariable UUID planningId) {
        return ResponseEntity.ok(ApiResponse.success(planningAdjustmentService.findByPlanningId(planningId)));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    @GetMapping("/status/{tinhTrang}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PlanningAdjustmentResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        AdjustmentStatus status = AdjustmentStatus.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(planningAdjustmentService.findByStatus(status)));
    }

    @PostMapping("/{id}/approval")
    @PreAuthorize("@auth.check(authentication, 'planningadjustment:approve')")
    public ResponseEntity<ApiResponse<AdjustmentApprovalResponse>> addApproval(
            @PathVariable UUID id,
            @RequestBody @Valid AdjustmentApprovalRequest request) {
        AdjustmentApprovalResponse response = planningAdjustmentService.addApproval(id, request);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt điều chỉnh thành công", response));
    }
}
