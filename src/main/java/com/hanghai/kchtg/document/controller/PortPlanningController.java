package com.hanghai.kchtg.document.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.LookupResultResponse;
import com.hanghai.kchtg.document.dto.PortPlanningCreateRequest;
import com.hanghai.kchtg.document.dto.PortPlanningResponse;
import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.service.PortPlanningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for F-132 Quản lý quy hoạch bến cảng.
 */
@RestController
@RequestMapping("/api/v1/port-planning")
@RequiredArgsConstructor
public class PortPlanningController {

    private final PortPlanningService portPlanningService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<Page<PortPlanningResponse>>> listPlans(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<PortPlanningResponse> result = portPlanningService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'portplanning:create') or @auth.check(authentication, 'document:create')")
    public ResponseEntity<ApiResponse<PortPlanningResponse>> createPlan(
            @RequestBody @Valid PortPlanningCreateRequest request) {
        PortPlanningResponse response = portPlanningService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo quy hoạch bến cảng thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<PortPlanningResponse>> getPlan(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(portPlanningService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'portplanning:update') or @auth.check(authentication, 'document:update')")
    public ResponseEntity<ApiResponse<PortPlanningResponse>> updatePlan(
            @PathVariable UUID id,
            @RequestBody @Valid PortPlanningCreateRequest request) {
        PortPlanningResponse response = portPlanningService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quy hoạch bến cảng thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'portplanning:delete') or @auth.check(authentication, 'document:delete')")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable UUID id) {
        portPlanningService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa quy hoạch bến cảng thành công", null));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PortPlanningResponse>>> filterByStatus(
            @PathVariable String status) {
        PlanningStatus statusEnum = PlanningStatus.valueOf(status);
        return ResponseEntity.ok(ApiResponse.success(portPlanningService.findByStatus(statusEnum)));
    }

    @GetMapping("/name-search")
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PortPlanningResponse>>> searchByName(
            @RequestParam String keyword,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse
                .success(portPlanningService.searchByProjectNameContaining(keyword, page, size).getContent()));
    }

    @GetMapping("/date-range")
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PortPlanningResponse>>> filterByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(portPlanningService.findByApprovalDateBetween(start, end)));
    }

    // ── Dynamic Search Endpoint (F-133) ───────────────────────────────

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'portplanning:search') or @auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<LookupResultResponse>> searchPlans(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "yearStart", required = false) LocalDate yearStart,
            @RequestParam(name = "yearEnd", required = false) LocalDate yearEnd,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        LookupResultResponse result = portPlanningService.traCuu(
                keyword, status, yearStart, yearEnd, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
