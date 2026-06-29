package com.hanghai.kchtg.vanban.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.LoaiBaoTri;
import com.hanghai.kchtg.vanban.entity.TinhTrangBaoTri;
import com.hanghai.kchtg.vanban.service.KeHoachBaoTriService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for F-130 Quản lý thông tin bảo trì.
 *
 * Endpoints:
 *   GET    /api/v1/ke-hoach-bao-tri            — list all maintenance plans
 *   POST   /api/v1/ke-hoach-bao-tri            — create a new maintenance plan
 *   GET    /api/v1/ke-hoach-bao-tri/{id}       — get a single plan
 *   PUT    /api/v1/ke-hoach-bao-tri/{id}       — update a plan
 *   DELETE /api/v1/ke-hoach-bao-tri/{id}       — delete a plan
 *   POST   /api/v1/ke-hoach-bao-tri/result     — record maintenance result
 */
@RestController
@RequestMapping("/api/v1/ke-hoach-bao-tri")
@RequiredArgsConstructor
public class KeHoachBaoTriController {

    private final KeHoachBaoTriService keHoachBaoTriService;

    /**
     * GET /api/v1/ke-hoach-bao-tri
     * Returns all maintenance plans.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<KeHoachBaoTriResponse>>> listPlans(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<KeHoachBaoTriResponse> result = keHoachBaoTriService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * POST /api/v1/ke-hoach-bao-tri
     * Creates a new maintenance plan.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<KeHoachBaoTriResponse>> createPlan(
            @RequestBody @Valid KeHoachBaoTriCreateRequest request) {
        KeHoachBaoTriResponse response = keHoachBaoTriService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo kế hoạch bảo trì thành công", response));
    }

    /**
     * GET /api/v1/ke-hoach-bao-tri/{id}
     * Returns a single maintenance plan by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KeHoachBaoTriResponse>> getPlan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(keHoachBaoTriService.getById(id)));
    }

    /**
     * PUT /api/v1/ke-hoach-bao-tri/{id}
     * Updates an existing maintenance plan.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<KeHoachBaoTriResponse>> updatePlan(
            @PathVariable Long id,
            @RequestBody @Valid KeHoachBaoTriCreateRequest request) {
        KeHoachBaoTriResponse response = keHoachBaoTriService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kế hoạch bảo trì thành công", response));
    }

    /**
     * DELETE /api/v1/ke-hoach-bao-tri/{id}
     * Deletes a maintenance plan.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        keHoachBaoTriService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kế hoạch bảo trì thành công", null));
    }

    /**
     * POST /api/v1/ke-hoach-bao-tri/result
     * Records maintenance result.
     */
    @PostMapping("/result")
    public ResponseEntity<ApiResponse<KetQuaBaoTriResponse>> recordResult(
            @RequestBody @Valid KetQuaBaoTriRequest request) {
        KetQuaBaoTriResponse response = keHoachBaoTriService.recordResult(request);
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận kết quả bảo trì thành công", response));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    /**
     * GET /api/v1/ke-hoach-bao-tri/equipment/{thietBi}
     * Filter by equipment.
     */
    @GetMapping("/equipment/{thietBi}")
    public ResponseEntity<ApiResponse<List<KeHoachBaoTriResponse>>> filterByEquipment(
            @PathVariable String thietBi) {
        return ResponseEntity.ok(ApiResponse.success(keHoachBaoTriService.findByThietBi(thietBi)));
    }

    /**
     * GET /api/v1/ke-hoach-bao-tri/status/{tinhTrang}
     * Filter by status.
     */
    @GetMapping("/status/{tinhTrang}")
    public ResponseEntity<ApiResponse<List<KeHoachBaoTriResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangBaoTri status = TinhTrangBaoTri.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(keHoachBaoTriService.findByTinhTrang(status)));
    }

    /**
     * GET /api/v1/ke-hoach-bao-tri/type/{loai}
     * Filter by maintenance type.
     */
    @GetMapping("/type/{loai}")
    public ResponseEntity<ApiResponse<List<KeHoachBaoTriResponse>>> filterByType(
            @PathVariable String loai) {
        LoaiBaoTri type = LoaiBaoTri.valueOf(loai);
        return ResponseEntity.ok(ApiResponse.success(keHoachBaoTriService.findByLoaiBaoTri(type)));
    }

    /**
     * GET /api/v1/ke-hoach-bao-tri/date-range
     * Filter by expected start date range.
     */
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<KeHoachBaoTriResponse>>> filterByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(keHoachBaoTriService.findByNgayBatDauDuKienBetween(start, end)));
    }
}
