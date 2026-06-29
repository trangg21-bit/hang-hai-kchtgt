package com.hanghai.kchtg.vanban.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.TinhTrangVanHanh;
import com.hanghai.kchtg.vanban.service.KeHoachVanHanhService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * REST controller for F-129 Quản lý thông tin vận hành.
 *
 * Endpoints:
 *   GET    /api/v1/van-hanh              — list all operation plans
 *   POST   /api/v1/van-hanh              — create a new operation plan
 *   GET    /api/v1/van-hanh/{id}         — get a single plan
 *   PUT    /api/v1/van-hanh/{id}         — update a plan
 *   DELETE /api/v1/van-hanh/{id}         — delete a plan
 */
@RestController
@RequestMapping("/api/v1/van-hanh")
@RequiredArgsConstructor
public class KeHoachVanHanhController {

    private final KeHoachVanHanhService keHoachVanHanhService;

    /**
     * GET /api/v1/van-hanh
     * Returns all operation plans.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<KeHoachVanHanhResponse>>> listPlans(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<KeHoachVanHanhResponse> result = keHoachVanHanhService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * POST /api/v1/van-hanh
     * Creates a new operation plan.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<KeHoachVanHanhResponse>> createPlan(
            @RequestBody @Valid KeHoachVanHanhCreateRequest request) {
        KeHoachVanHanhResponse response = keHoachVanHanhService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo kế hoạch vận hành thành công", response));
    }

    /**
     * GET /api/v1/van-hanh/{id}
     * Returns a single operation plan by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KeHoachVanHanhResponse>> getPlan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(keHoachVanHanhService.getById(id)));
    }

    /**
     * PUT /api/v1/van-hanh/{id}
     * Updates an existing operation plan.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<KeHoachVanHanhResponse>> updatePlan(
            @PathVariable Long id,
            @RequestBody @Valid KeHoachVanHanhCreateRequest request) {
        KeHoachVanHanhResponse response = keHoachVanHanhService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kế hoạch vận hành thành công", response));
    }

    /**
     * DELETE /api/v1/van-hanh/{id}
     * Deletes an operation plan.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        keHoachVanHanhService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kế hoạch vận hành thành công", null));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    /**
     * GET /api/v1/van-hanh/date/{ngayVanHanh}
     * Filter by operation date.
     */
    @GetMapping("/date/{ngayVanHanh}")
    public ResponseEntity<ApiResponse<List<KeHoachVanHanhResponse>>> filterByDate(
            @PathVariable LocalDate ngayVanHanh) {
        return ResponseEntity.ok(ApiResponse.success(keHoachVanHanhService.findByNgayVanHanh(ngayVanHanh)));
    }

    /**
     * GET /api/v1/van-hanh/status/{tinhTrang}
     * Filter by status.
     */
    @GetMapping("/status/{tinhTrang}")
    public ResponseEntity<ApiResponse<List<KeHoachVanHanhResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangVanHanh status = TinhTrangVanHanh.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(keHoachVanHanhService.findByTinhTrang(status)));
    }

    /**
     * GET /api/v1/van-hanh/caucang/{cauCang}
     * Filter by structure (cầu cảng).
     */
    @GetMapping("/caucang/{cauCang}")
    public ResponseEntity<ApiResponse<List<KeHoachVanHanhResponse>>> filterByCauCang(
            @PathVariable String cauCang) {
        return ResponseEntity.ok(ApiResponse.success(keHoachVanHanhService.findByCauCang(cauCang)));
    }

    /**
     * GET /api/v1/van-hanh/thietbi/{thietBi}
     * Filter by equipment.
     */
    @GetMapping("/thietbi/{thietBi}")
    public ResponseEntity<ApiResponse<List<KeHoachVanHanhResponse>>> filterByThietBi(
            @PathVariable String thietBi) {
        return ResponseEntity.ok(ApiResponse.success(keHoachVanHanhService.findByThietBi(thietBi)));
    }

    /**
     * GET /api/v1/van-hanh/conflict
     * Check for scheduling conflicts.
     */
    @GetMapping("/conflict")
    public ResponseEntity<ApiResponse<Boolean>> checkConflict(
            @RequestParam LocalDate ngayVanHanh,
            @RequestParam LocalTime thoiGianBatDau,
            @RequestParam LocalTime thoiGianKetThuc,
            @RequestParam(name = "cauCang", required = false) String cauCang,
            @RequestParam(name = "thietBi", required = false) String thietBi) {
        boolean hasConflict = keHoachVanHanhService.hasConflictSchedule(
                ngayVanHanh, thoiGianBatDau, thoiGianKetThuc, cauCang, thietBi);
        return ResponseEntity.ok(ApiResponse.success(hasConflict));
    }
}
